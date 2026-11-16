#!/usr/bin/env node
// Runs a build phase's finishing checks (builds, tests, screenshot suites, the catalogue check) in one
// command, side by side where that is safe, and reports compactly: one line per check, the tail of each
// failure, one summary line. Dependency-free. Run from anywhere in the repo:
//   node <tools>/phase-check.mjs [--plan <dir>]            every check
//   node <tools>/phase-check.mjs --only build,vitest       those checks (and the checks they need)
//   node <tools>/phase-check.mjs --failed                  the checks that failed (or were skipped) last run
//   node <tools>/phase-check.mjs --changed                 quick inner loop: only checks with a "changed"
//                                                          form, in that form (e.g. vitest --changed); PARTIAL
//   node <tools>/phase-check.mjs --list                    print the planned schedule, run nothing (--dry too)
//   node <tools>/phase-check.mjs --capture <IDs|all>       catalogue screenshots: dev servers up, dry run, capture
//   node <tools>/phase-check.mjs --stop-servers            stop the dev servers this tool started (no others)
//   node <tools>/phase-check.mjs --help
// Exit 0 when everything run passed, 1 on any failure or skip, 2 on a usage or config problem.
//
// The commands come from the plan's config (plan.config.json, found by ../../update-build-plan/tools/
// config.mjs), key "runner":
//   "runner": {
//     "maxParallel": 4,                    checks running at once (default 4)
//     "logDir": ".build-phase",            repo-relative; logs in <logDir>/logs/<check>.log, git-ignored
//     "concurrency": "...",                free text: why the schedule below is safe (for humans)
//     "checks": [ { "name": "build",       what --only takes
//                   "aliases": ["b"],      other names --only accepts
//                   "cwd": "app",          repo-relative; <cwd>/node_modules/.bin is put on PATH (as npm run does)
//                   "cmd": "vite build",   a shell command
//                   "needs": ["typecheck"],  runs after these, and only if they passed (else SKIP)
//                   "after": ["vitest"],   runs after these, pass or fail (ordering only, e.g. for CPU)
//                   "changed": true | "cmd" | { "cmd": "...", "paths": ["dir"] },
//                                          the --changed form: true = same command; paths = run only if git
//                                          shows changes under them; no "changed" key = skipped by --changed
//                   "focus": "error TS",   regex: on failure show the matching lines rather than the tail
//                   "timeout": 900,        seconds (default 1200)
//                   "equivalent": "..." }  free text, shown by --list: which project command this stands for
//     ],
//     "devServers": [ { "name": "app", "port": 5173, "url": "http://localhost:5173", "cwd": ".", "cmd": "npm run dev:app" } ],
//     "devCommand": { "cwd": ".", "cmd": "npm run dev" },   starts every dev server at once (when all are down)
//     "startTimeout": 120,                 seconds to wait for the dev servers to answer
//     "node": { "min": "22.18", "paths": ["/opt/homebrew/opt/node@24/bin", "$HOME/.nvm/versions/node/v24.20.0/bin"] },
//                                          the Node every child needs; see "Node guard" below
//     "capture": { "cwd": "board", "cmd": "node scripts/capture.ts", "onlyFlag": "--only", "dryFlag": "--dry",
//                  "report": "board/requirements/capture/REPORT.md" }   (report defaults to the plan config's)
//   }
// A check that "needs" another is pulled in by --only. A dependency left out of the run (--failed, --changed)
// counts as met. A check is started as soon as its needs and afters are done and a slot is free, in config
// order.
//
// --capture: probes each dev server's URL; when all are down it starts devCommand, when only some are, each
// missing server's own cmd; detached, output to <logDir>/logs/dev-servers.log, left running afterwards (the
// next run reuses them). Waits until they answer (startTimeout), then runs the capture with the IDs and the
// dry flag, and only if that passes the real capture. "all" runs the full capture without the dry pass: a
// failed recipe writes nothing, so a dry pass would only double the time. The report's summary table is
// printed before and after (the board rewrites it on full runs only).
//
// --stop-servers: stops each process group listed in <logDir>/dev-servers.pid (the servers --capture
// started), SIGTERM then SIGKILL after 5 s, and empties the file. A pid that is gone, or no longer leads its
// own process group (reused by something else), is left alone. Servers this tool did not start are never in
// the file, so they are never touched.
//
// Node guard: with "runner.node.min" set and the running node older, the first of "runner.node.paths" (or
// "path"; "$HOME" and "~" expand) whose `node --version` is new enough goes first on PATH for every child
// (checks, capture, dev servers). None found: fail fast (exit 2) before running anything, naming the fix.
//
// A lock (<logDir>/lock) stops two runs at once; a stale lock (its process gone) is taken over. Results are
// kept in <logDir>/last.json for --failed. Nothing is interactive and nothing watches.
import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadConfig, stripPlanArg } from '../../update-build-plan/tools/config.mjs'

const HELP = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0]
  .split('\n').filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/ ?/, '')).join('\n')

// ---- arguments ----
const rawArgv = process.argv.slice(2)
const argv = stripPlanArg(rawArgv)
const has = f => argv.includes(f)
const valueOf = f => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null
}
if (has('--help') || has('-h')) {
  console.log(HELP)
  process.exit(0)
}
const KNOWN = new Set(['--only', '--failed', '--changed', '--list', '--dry', '--capture', '--stop-servers'])
for (const [i, a] of argv.entries()) {
  if (a.startsWith('--') && !KNOWN.has(a)) usage(`unknown option ${a}`)
  if (!a.startsWith('--') && !['--only', '--capture'].includes(argv[i - 1])) usage(`unexpected argument ${a}`)
}
if (has('--only') && !valueOf('--only')) usage('--only needs check names, comma separated')
if (has('--capture') && !valueOf('--capture')) usage('--capture needs catalogue IDs (comma separated) or "all"')

function usage(msg) {
  console.error(`phase-check: ${msg}. See --help.`)
  process.exit(2)
}

// ---- config ----
const ROOT = repoRoot()
const config = loadConfig({ argv: rawArgv, root: ROOT })
const raw = config.configExists ? JSON.parse(fs.readFileSync(path.join(ROOT, config.configFile), 'utf8')) : {}
const runner = raw.runner
if (!runner || !Array.isArray(runner.checks) || !runner.checks.length) {
  console.error(`phase-check: no "runner.checks" in ${config.configFile}. See --help for the shape.`)
  process.exit(2)
}
const CHECKS = runner.checks
const byName = new Map()
for (const c of CHECKS) {
  if (!c.name || !c.cmd) usage(`a runner check lacks "name" or "cmd" (${JSON.stringify(c)})`)
  for (const n of [c.name, ...(c.aliases ?? [])]) byName.set(n, c)
}
for (const c of CHECKS) for (const d of [...(c.needs ?? []), ...(c.after ?? [])]) if (!byName.has(d)) usage(`check ${c.name} names unknown check ${d}`)
const MAX = Math.max(1, Number(runner.maxParallel) || 4)
const LOG_ROOT = path.resolve(ROOT, runner.logDir ?? '.build-phase')
const LOGS = path.join(LOG_ROOT, 'logs')
const LAST = path.join(LOG_ROOT, 'last.json')
/** A path as a reader types it: repo-relative inside the repo, absolute outside it. */
const rel = p => {
  const r = path.relative(ROOT, p)
  return r.startsWith('..') || path.isAbsolute(r) ? p : r || '.'
}

function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return process.cwd()
  }
}

// ---- small helpers ----
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*(\x07|\x1b\\)|\x1b[()][0-9A-B]/g
/** Log text as a reader sees it: no colour codes, carriage-return redraws collapsed to their last state. */
const clean = s => s.replace(ANSI, '').split('\n').map(l => l.split('\r').filter(Boolean).pop() ?? '').join('\n')
const dur = ms => (ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60_000)}m ${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')}s`)
const pad = (s, n) => String(s).padEnd(n)
const WIDTH = Math.max(...CHECKS.map(c => c.name.length), 'capture-dry'.length) + 2

function ensureLogDir() {
  fs.mkdirSync(LOGS, { recursive: true })
  const ignore = path.join(LOG_ROOT, '.gitignore')
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n')
}

function takeLock() {
  ensureLogDir()
  const lock = path.join(LOG_ROOT, 'lock')
  try {
    const pid = Number(fs.readFileSync(lock, 'utf8'))
    if (pid && pid !== process.pid) {
      try {
        process.kill(pid, 0)
        console.error(`phase-check: another run (pid ${pid}) is in progress; wait for it (lock: ${rel(lock)}).`)
        process.exit(2)
      } catch { /* stale lock: its process is gone */ }
    }
  } catch { /* no lock */ }
  fs.writeFileSync(lock, String(process.pid))
  process.on('exit', () => {
    try { if (fs.readFileSync(lock, 'utf8') === String(process.pid)) fs.unlinkSync(lock) } catch {}
  })
}

/** The lines to show for a failure: the focus pattern's matches, else the last 40 non-blank lines. */
function excerpt(logFile, focus, n = 40) {
  let lines
  // The log's first line is the command phase-check wrote; it is never part of the excerpt.
  try { lines = clean(fs.readFileSync(logFile, 'utf8')).split('\n').slice(1).filter(l => l.trim()) } catch { return ['(no log)'] }
  if (focus) {
    const re = new RegExp(focus)
    const hits = lines.filter(l => re.test(l))
    if (hits.length) return hits.length > n ? [`... ${hits.length - n} earlier matching line(s) in the log`, ...hits.slice(-n)] : hits
  }
  return lines.slice(-n)
}

// ---- running a command ----
const children = new Set()
function killAll(sig = 'SIGTERM') {
  for (const ch of children) { try { process.kill(-ch.pid, sig) } catch {} }
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { killAll(); process.exit(130) })

// ---- Node guard ----
const verParts = v => String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
const atLeast = (v, min) => {
  const a = verParts(v), b = verParts(min)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  return true
}
const expandHome = p => p.replace(/^~(?=\/|$)/, process.env.HOME ?? '~').replace(/\$HOME|\$\{HOME\}/g, process.env.HOME ?? '$HOME')

/** The bin folder to put first on PATH for children ('' when the running node is new enough). Exits 2 when none is. */
function nodeBin() {
  const want = runner.node?.min
  if (!want || atLeast(process.versions.node, want)) return ''
  const list = [runner.node.paths ?? runner.node.path ?? []].flat().map(expandHome)
  const tried = []
  for (const dir of list) {
    const bin = path.join(dir, 'node')
    if (!fs.existsSync(bin)) { tried.push(`${dir} (no node)`); continue }
    let v = ''
    try { v = execFileSync(bin, ['--version'], { encoding: 'utf8' }).trim() } catch {}
    if (v && atLeast(v, want)) {
      console.log(`phase-check: node ${process.versions.node} is older than ${want}; children use ${v} from ${dir}`)
      return dir
    }
    tried.push(`${dir} (${v || 'unrunnable'})`)
  }
  console.error(`phase-check: node ${process.versions.node} is older than ${want}, which the checks need, and no newer Node was found${tried.length ? ` (tried ${tried.join(', ')})` : ''}.`)
  console.error(`Fix: put a Node ${want}+ bin folder first on PATH (e.g. export PATH="/path/to/node-${want}+/bin:$PATH"), or add it to "runner.node.paths" in ${rel(path.resolve(ROOT, config.configFile))}.`)
  process.exit(2)
}
let NODE_BIN = null
const nodeBinOnce = () => (NODE_BIN ??= nodeBin())

function envFor(cwd) {
  const bins = [path.join(cwd, 'node_modules', '.bin'), path.join(ROOT, 'node_modules', '.bin'), nodeBinOnce()].filter(b => b && fs.existsSync(b))
  return { ...process.env, PATH: [...bins, process.env.PATH].join(path.delimiter), FORCE_COLOR: '0', NO_COLOR: '1' }
}

/** Runs `cmd` in repo-relative `cwd`, all output to `logFile`. Resolves { ok, code, ms, timedOut }. */
function run(cmd, cwd, logFile, timeoutS = 1200) {
  const abs = path.join(ROOT, cwd ?? '.')
  const out = fs.openSync(logFile, 'w')
  fs.writeSync(out, `$ (cd ${cwd ?? '.'} && ${cmd})\n\n`)
  const t0 = performance.now()
  return new Promise(resolve => {
    const ch = spawn(cmd, { cwd: abs, shell: true, detached: true, env: envFor(abs), stdio: ['ignore', out, out] })
    children.add(ch)
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; try { process.kill(-ch.pid, 'SIGTERM') } catch {} }, timeoutS * 1000)
    const done = (code, err) => {
      clearTimeout(timer)
      children.delete(ch)
      if (err) fs.writeSync(out, `\n${err.message}\n`)
      if (timedOut) fs.writeSync(out, `\nphase-check: timed out after ${timeoutS}s\n`)
      fs.closeSync(out)
      resolve({ ok: code === 0 && !timedOut, code, ms: performance.now() - t0, timedOut })
    }
    ch.on('error', e => done(-1, e))
    ch.on('exit', code => done(code ?? -1))
  })
}

// ---- which checks, in which form ----
const changedMode = has('--changed')

function gitChanged(paths) {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', ...paths], { cwd: ROOT, encoding: 'utf8' }).trim().length > 0
  } catch {
    return true
  }
}

/** The command a check runs in this mode, or { skip: reason }. */
function formOf(c) {
  if (!changedMode) return { cmd: c.cmd }
  const ch = c.changed
  if (ch === undefined || ch === false) return { skip: 'not in --changed' }
  if (ch === true) return { cmd: c.cmd }
  if (typeof ch === 'string') return { cmd: ch }
  if (ch.paths && !gitChanged(ch.paths)) return { skip: `no changes under ${ch.paths.join(', ')}` }
  return { cmd: ch.cmd ?? c.cmd }
}

function selectChecks() {
  let names
  if (has('--only')) {
    names = new Set()
    const add = n => {
      const c = byName.get(n)
      if (!c) usage(`no check named "${n}" (checks: ${CHECKS.map(x => x.name).join(', ')})`)
      if (names.has(c.name)) return
      names.add(c.name)
      for (const d of c.needs ?? []) add(d)
    }
    for (const n of valueOf('--only').split(',').map(s => s.trim()).filter(Boolean)) add(n)
  } else if (has('--failed')) {
    let last = null
    try { last = JSON.parse(fs.readFileSync(LAST, 'utf8')) } catch {}
    if (!last) usage(`no previous run recorded (${rel(LAST)})`)
    names = new Set(last.results.filter(r => r.status !== 'PASS' && r.status !== 'OMIT' && byName.has(r.name)).map(r => byName.get(r.name).name))
    if (!names.size) {
      console.log('phase-check: nothing failed last run; nothing to re-run.')
      process.exit(0)
    }
  } else {
    names = new Set(CHECKS.map(c => c.name))
  }
  return CHECKS.filter(c => names.has(c.name))
}

// ---- the schedule ----
/** Waves for --list: each check one past the latest of its in-run needs and afters. */
function waves(sel) {
  const inRun = new Set(sel.map(c => c.name))
  const wave = new Map()
  const of = c => {
    if (wave.has(c.name)) return wave.get(c.name)
    const deps = [...(c.needs ?? []), ...(c.after ?? [])].filter(d => inRun.has(d))
    const w = deps.length ? 1 + Math.max(...deps.map(d => of(byName.get(d)))) : 1
    wave.set(c.name, w)
    return w
  }
  sel.forEach(of)
  return wave
}

function printSchedule(sel) {
  const wave = waves(sel)
  const top = Math.max(...wave.values())
  console.log(`phase-check plan (${config.configFile} "runner"): ${sel.length} check(s), up to ${MAX} at a time${changedMode ? '; --changed: PARTIAL' : ''}`)
  for (let w = 1; w <= top; w++) {
    const group = sel.filter(c => wave.get(c.name) === w)
    if (!group.length) continue
    console.log(`\nwave ${w}${w > 1 ? ' (starts as each check\'s needs/afters finish)' : ''}:`)
    for (const c of group) {
      const f = formOf(c)
      const deps = [...(c.needs ?? []).map(d => `needs ${d}`), ...(c.after ?? []).map(d => `after ${d}`)].join(', ')
      console.log(`  ${pad(c.name, WIDTH)}${f.skip ? `SKIP (${f.skip})` : `(cd ${c.cwd ?? '.'} && ${f.cmd})`}${deps ? `   [${deps}]` : ''}`)
      if (c.equivalent) console.log(`  ${pad('', WIDTH)}= ${c.equivalent}`)
    }
  }
  if (runner.concurrency) console.log(`\nWhy this is safe: ${runner.concurrency}`)
}

async function runChecks(sel) {
  nodeBinOnce()
  takeLock()
  const inRun = new Set(sel.map(c => c.name))
  const state = new Map(sel.map(c => [c.name, { status: 'WAIT' }]))
  const t0 = performance.now()
  const results = []
  console.log(`phase-check: ${sel.length} check(s), up to ${MAX} at a time; logs in ${rel(LOGS)}/${changedMode ? '\nPARTIAL RUN (--changed): only the quick forms of some checks; this is not a full phase check.' : ''}`)

  const finish = (c, status, ms, note) => {
    state.get(c.name).status = status
    results.push({ name: c.name, status, ms, note, log: rel(path.join(LOGS, `${c.name}.log`)), focus: c.focus })
    console.log(`${pad(status, 5)} ${pad(c.name, WIDTH)}${ms == null ? '' : dur(ms).padStart(8)}${note ? `   ${note}` : ''}`)
  }
  // Checks left out of the run count as met.
  const met = d => !inRun.has(d) || state.get(d).status === 'PASS' || state.get(d).status === 'OMIT'
  const doneish = d => !inRun.has(d) || !['WAIT', 'RUN'].includes(state.get(d).status)

  await new Promise(resolveAll => {
    let running = 0
    const pump = () => {
      for (const c of sel) {
        const s = state.get(c.name)
        if (s.status !== 'WAIT') continue
        const needs = c.needs ?? []
        if (needs.some(d => doneish(d) && !met(d))) {
          finish(c, 'SKIP', null, `needs ${needs.filter(d => !met(d)).join(', ')}`)
          continue
        }
        if (![...needs, ...(c.after ?? [])].every(doneish)) continue
        const f = formOf(c)
        if (f.skip) { finish(c, 'OMIT', null, f.skip); continue }
        if (running >= MAX) continue
        running++
        s.status = 'RUN'
        run(f.cmd, c.cwd, path.join(LOGS, `${c.name}.log`), c.timeout).then(r => {
          running--
          finish(c, r.ok ? 'PASS' : 'FAIL', r.ms, r.timedOut ? 'timed out' : r.ok ? '' : `exit ${r.code}`)
          pump()
        })
      }
      // A skip can unblock others in the same pass; loop until stable.
      if ([...state.values()].every(s => !['WAIT', 'RUN'].includes(s.status))) return resolveAll()
      if (running === 0 && sel.some(c => state.get(c.name).status === 'WAIT')) setImmediate(pump)
    }
    pump()
  })

  const bad = results.filter(r => r.status === 'FAIL')
  for (const r of bad) {
    console.log(`\n---- ${r.name} FAILED (full log: ${r.log}) ----`)
    for (const l of excerpt(path.join(ROOT, r.log), r.focus)) console.log(l)
  }
  try { fs.writeFileSync(LAST, JSON.stringify({ at: new Date().toISOString(), changed: changedMode, results }, null, 1)) } catch {}
  const count = st => results.filter(r => r.status === st)
  const skipped = count('SKIP')
  const parts = [`${count('PASS').length} passed`, `${bad.length} failed${bad.length ? ` (${bad.map(r => r.name).join(', ')})` : ''}`]
  if (skipped.length) parts.push(`${skipped.length} skipped (${skipped.map(r => r.name).join(', ')})`)
  if (count('OMIT').length) parts.push(`${count('OMIT').length} not run`)
  const ok = !bad.length && !skipped.length
  console.log(`\n${ok ? 'GREEN' : 'RED'}${changedMode ? ' (PARTIAL: --changed)' : ''}: ${parts.join(', ')} in ${dur(performance.now() - t0)}.`)
  return ok
}

// ---- --capture ----
function probe(url, ms = 1500) {
  const u = new URL(url)
  const port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80)
  const hosts = u.hostname === 'localhost' ? ['127.0.0.1', '::1'] : [u.hostname]
  const one = host => new Promise(res => {
    const s = net.connect({ host, port })
    const end = v => { s.destroy(); res(v) }
    s.setTimeout(ms, () => end(false))
    s.once('connect', () => end(true))
    s.once('error', () => end(false))
  })
  return Promise.all(hosts.map(one)).then(r => r.some(Boolean))
}

const urlOf = s => s.url ?? `http://localhost:${s.port}`

async function ensureServers(servers, timeoutS) {
  const up = await Promise.all(servers.map(s => probe(urlOf(s))))
  const down = servers.filter((_, i) => !up[i])
  if (!down.length) {
    console.log(`${pad('UP', 5)} ${pad('dev servers', WIDTH)}        already running: ${servers.map(s => `${s.name} ${urlOf(s)}`).join(', ')}`)
    return true
  }
  const log = path.join(LOGS, 'dev-servers.log')
  const fd = fs.openSync(log, 'a')
  const starts = down.length === servers.length && runner.devCommand ? [runner.devCommand] : down
  for (const s of starts) {
    if (!s.cmd) { console.error(`phase-check: dev server ${s.name} is down and has no "cmd" to start it.`); return false }
    const abs = path.join(ROOT, s.cwd ?? '.')
    fs.writeSync(fd, `\n$ (cd ${s.cwd ?? '.'} && ${s.cmd})   [phase-check, ${new Date().toISOString()}]\n`)
    const ch = spawn(s.cmd, { cwd: abs, shell: true, detached: true, env: { ...envFor(abs), FORCE_COLOR: '0' }, stdio: ['ignore', fd, fd] })
    ch.unref()
    fs.appendFileSync(path.join(LOG_ROOT, 'dev-servers.pid'), `${ch.pid} ${s.cmd}\n`)
  }
  fs.closeSync(fd)
  const t0 = performance.now()
  while (performance.now() - t0 < timeoutS * 1000) {
    const now = await Promise.all(servers.map(s => probe(urlOf(s))))
    if (now.every(Boolean)) {
      console.log(`${pad('UP', 5)} ${pad('dev servers', WIDTH)}${dur(performance.now() - t0).padStart(8)}   started ${starts.map(s => s.cmd).join(' + ')} (left running; log ${rel(log)})`)
      return true
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  const still = (await Promise.all(servers.map(async s => ((await probe(urlOf(s))) ? null : s.name)))).filter(Boolean)
  console.log(`${pad('FAIL', 5)} ${pad('dev servers', WIDTH)}${dur(performance.now() - t0).padStart(8)}   not answering after ${timeoutS}s: ${still.join(', ')}`)
  console.log(`\n---- dev servers (log: ${rel(log)}) ----`)
  for (const l of excerpt(log, null, 30)) console.log(l)
  return false
}

/** The report's first Markdown table as "Label a/b" pairs, plus its header columns. */
function reportSummary(file) {
  let text
  try { text = fs.readFileSync(file, 'utf8') } catch { return null }
  const rows = text.split('\n').filter(l => /^\|/.test(l))
  if (rows.length < 3) return null
  const cells = l => l.split('|').slice(1, -1).map(s => s.trim())
  const head = cells(rows[0]).slice(1)
  const body = []
  for (const l of rows.slice(2)) {
    if (!/^\|/.test(l)) break
    const [label, ...vals] = cells(l)
    body.push([label, vals.join('/')])
  }
  const extra = (text.match(/^\d+ screenshots\..*$/m) || [])[0]
  return { head: head.join('/'), body, extra, mtime: fs.statSync(file).mtime }
}

const fmtSummary = s => (s ? `${s.body.map(([k, v]) => `${k} ${v}`).join(' · ')}${s.extra ? `  (${s.extra.replace(/\.$/, '')})` : ''}` : '(no report)')

async function runCapture(ids) {
  nodeBinOnce()
  takeLock()
  const cap = runner.capture
  if (!cap?.cmd) usage(`no "runner.capture" in ${config.configFile}`)
  const servers = runner.devServers ?? []
  const reportFile = path.resolve(ROOT, cap.report ?? config.captureReport ?? '')
  const all = ids === 'all'
  const t0 = performance.now()
  console.log(`phase-check --capture ${all ? 'all (full run, writes the report)' : ids}; logs in ${rel(LOGS)}/`)
  const before = reportSummary(reportFile)
  console.log(`report before (${before?.head ?? '?'}): ${fmtSummary(before)}`)

  if (servers.length && !(await ensureServers(servers, Number(runner.startTimeout) || 120))) {
    console.log(`\nRED: dev servers did not come up in ${dur(performance.now() - t0)}.`)
    return false
  }
  const onlyArg = all ? '' : ` ${cap.onlyFlag ?? '--only'} ${ids}`
  const steps = all ? [] : [{ name: 'capture-dry', cmd: `${cap.cmd}${onlyArg} ${cap.dryFlag ?? '--dry'}` }]
  steps.push({ name: 'capture', cmd: `${cap.cmd}${onlyArg}` })
  let ok = true
  for (const st of steps) {
    const log = path.join(LOGS, `${st.name}.log`)
    const r = await run(st.cmd, cap.cwd, log, Number(cap.timeout) || 3600)
    const tail = clean(fs.readFileSync(log, 'utf8')).split('\n').filter(l => /recipe\(s\) OK/.test(l)).pop()
    console.log(`${pad(r.ok ? 'PASS' : 'FAIL', 5)} ${pad(st.name, WIDTH)}${dur(r.ms).padStart(8)}   ${tail?.trim() ?? (r.ok ? '' : `exit ${r.code}`)}`)
    if (!r.ok) {
      ok = false
      console.log(`\n---- ${st.name} FAILED (full log: ${rel(log)}) ----`)
      const lines = clean(fs.readFileSync(log, 'utf8')).split('\n').slice(1).filter(l => l.trim())
      const hits = lines.filter(l => /✗|ERROR|not running|Error|invalid|No recipes/.test(l))
      for (const l of (hits.length ? hits : lines).slice(-40)) console.log(l)
      break
    }
  }
  const after = reportSummary(reportFile)
  const rewritten = after && (!before || after.mtime > before.mtime)
  if (!rewritten) {
    console.log(`report after: not rewritten (${all ? 'the full run did not finish' : 'the board rewrites it on full runs only'})`)
  } else {
    const was = new Map(before?.body ?? [])
    const moved = after.body.filter(([k, v]) => was.get(k) !== v).map(([k, v]) => `${k} ${was.get(k) ?? '?'} -> ${v}`)
    console.log(`report after (${after.head}): ${fmtSummary(after)}`)
    console.log(`report changes: ${moved.length ? moved.join(' · ') : 'none'}`)
  }
  console.log(`\n${ok ? 'GREEN' : 'RED'}: capture ${all ? 'all' : ids} ${ok ? 'passed' : 'failed'} in ${dur(performance.now() - t0)}.`)
  return ok
}

// ---- --stop-servers ----
const alive = pid => { try { process.kill(-pid, 0); return true } catch { return false } }

async function stopServers() {
  const file = path.join(LOG_ROOT, 'dev-servers.pid')
  let lines = []
  try { lines = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim()) } catch {}
  if (!lines.length) {
    console.log('phase-check: no dev servers started by phase-check are recorded; nothing to stop.')
    return true
  }
  const targets = []
  for (const l of lines) {
    const pid = parseInt(l, 10)
    const cmd = l.slice(String(pid).length).trim()
    if (!pid || !alive(pid)) { console.log(`GONE  ${pad(pid || '?', 8)}${cmd}`); continue }
    // Our servers were spawned detached, so each leads its own process group (pgid = pid). A pid that no
    // longer does was reused by another process: leave it alone.
    let pgid = ''
    try { pgid = execFileSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).trim() } catch {}
    if (pgid && pgid !== String(pid)) { console.log(`LEFT  ${pad(pid, 8)}${cmd}   (pid now belongs to another process)`); continue }
    try { process.kill(-pid, 'SIGTERM') } catch {}
    targets.push({ pid, cmd })
  }
  const t0 = performance.now()
  while (targets.some(t => alive(t.pid)) && performance.now() - t0 < 5000) await new Promise(r => setTimeout(r, 200))
  let ok = true
  for (const t of targets) {
    if (alive(t.pid)) { try { process.kill(-t.pid, 'SIGKILL') } catch {} }
    await new Promise(r => setTimeout(r, 100))
    const still = alive(t.pid)
    if (still) ok = false
    console.log(`${still ? 'FAIL ' : 'STOP '} ${pad(t.pid, 8)}${t.cmd}`)
  }
  if (ok) fs.writeFileSync(file, '')
  return ok
}

// ---- main ----
if (has('--stop-servers')) process.exit((await stopServers()) ? 0 : 1)
if (has('--capture')) {
  if (has('--list') || has('--dry')) {
    const cap = runner.capture ?? {}
    const ids = valueOf('--capture')
    console.log(`phase-check --capture plan: probe ${(runner.devServers ?? []).map(s => `${s.name} ${urlOf(s)}`).join(', ')}; start "${runner.devCommand?.cmd ?? 'each server\'s cmd'}" if down`)
    if (ids !== 'all') console.log(`  then (cd ${cap.cwd} && ${cap.cmd} ${cap.onlyFlag ?? '--only'} ${ids} ${cap.dryFlag ?? '--dry'})`)
    console.log(`  then (cd ${cap.cwd} && ${cap.cmd}${ids === 'all' ? '' : ` ${cap.onlyFlag ?? '--only'} ${ids}`})`)
    process.exit(0)
  }
  process.exit((await runCapture(valueOf('--capture'))) ? 0 : 1)
}
const sel = selectChecks()
if (has('--list') || has('--dry')) {
  printSchedule(sel)
  process.exit(0)
}
process.exit((await runChecks(sel)) ? 0 : 1)
