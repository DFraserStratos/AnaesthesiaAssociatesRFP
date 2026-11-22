// The build plan's folder and its plan.config.json, shared by every tool. Run the tools from the repo root.
//
// Which plan: `--plan <dir>` on any tool, else the BUILD_PLAN environment variable, else the one
// plan.config.json in the repo (tracked or not), else docs/build-plan. Every config key is optional;
// a missing file means all defaults (a new plan). The keys are documented in the skill's SKILL.md
// ("The plan's config").
//
// CLI: node <tools>/config.mjs [--plan <dir>] [--json]
//   prints the resolved config (defaults filled in, statuses read from the board's config): the
//   `config` argument every workflow takes.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const TOOLS = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_PLAN = 'docs/build-plan'
const CONFIG_FILE = 'plan.config.json'

/** The plan folder, repo-relative, from argv / BUILD_PLAN / the repo's only plan.config.json / the default. */
export function planDirOf(argv = process.argv.slice(2), root = process.cwd()) {
  const i = argv.indexOf('--plan')
  if (i >= 0 && argv[i + 1]) return path.relative(root, path.resolve(root, argv[i + 1])) || '.'
  if (process.env.BUILD_PLAN) return path.relative(root, path.resolve(root, process.env.BUILD_PLAN)) || '.'
  const found = discover(root)
  if (found.length > 1) {
    console.error(`More than one ${CONFIG_FILE} in the repo (${found.join(', ')}): pass --plan <dir>.`)
    process.exit(2)
  }
  return found.length ? path.dirname(found[0]) : DEFAULT_PLAN
}

/** Every plan.config.json in the repo, tracked or not (git-ignored ones aside). */
function discover(root) {
  try {
    return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', `:(glob)**/${CONFIG_FILE}`], { cwd: root, encoding: 'utf8' })
      .split('\n').filter(f => f && fs.existsSync(path.join(root, f)))
  } catch {
    return []
  }
}

/** argv without `--plan <dir>`, so each tool's own argument parsing never sees it. */
export function stripPlanArg(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--plan')
  return i < 0 ? argv : [...argv.slice(0, i), ...argv.slice(i + 2)]
}

const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1)

/** The plan's config with every default filled in. */
export function loadConfig({ argv = process.argv.slice(2), root = process.cwd() } = {}) {
  const plan = planDirOf(argv, root)
  const file = path.join(root, plan, CONFIG_FILE)
  let raw = {}
  if (fs.existsSync(file)) raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const board = raw.board ?? 'requirements-board'
  const requirements = raw.requirements ?? `${board}/requirements`
  const app = raw.app ?? null
  const appNoun = raw.appNoun ?? 'app'
  const name = raw.name ?? 'build plan'
  // A tool finds this plan by itself when it is the repo's only plan.config.json (or, with none, the
  // default folder); otherwise commands need `--plan <dir>`. `planFlag` is that flag or nothing.
  const found = discover(root)
  const findable = found.length ? found.length === 1 && path.dirname(found[0]) === plan : plan === DEFAULT_PLAN
  const c = {
    plan,
    tools: path.relative(root, TOOLS).split(path.sep).join('/'),
    planFlag: findable ? '' : ` --plan "${plan}"`,
    configFile: path.relative(root, file),
    configExists: fs.existsSync(file),
    name,
    title: raw.title ?? titleCase(name),
    subject: raw.subject ?? `the ${appNoun}`,
    appNoun,
    app,
    appCode: raw.appCode ?? (app ? [app] : []),
    appSummary: raw.appSummary ?? (app ? `The ${appNoun} lives in ${app}/.` : `The ${appNoun}'s code is in this repo.`),
    board,
    requirements,
    boardUrl: raw.boardUrl ?? 'http://localhost:5180',
    progress: raw.progress ?? null,
    // Build lanes: { branches: ["lane/a", ...], complete: "{id} complete:", checkpoint: "{id} checkpoint:" },
    // read by the update view of phaseStatus only; null when the plan declares none.
    lanes: raw.lanes && typeof raw.lanes === 'object' ? raw.lanes : null,
    firstPhase: String(raw.firstPhase ?? '01'),
    outOfScopeLanes: raw.outOfScopeLanes ?? [],
    olderCatalogues: raw.olderCatalogues ?? [],
    capture: raw.capture ?? null,
    standingRules: raw.standingRules ?? null,
    projectRules: raw.projectRules ?? null,
    greenCommands: raw.greenCommands ?? null,
    gapAnalysis: raw.gapAnalysis ?? {},
    planning: raw.planning ?? {},
    phaseDoc: raw.phaseDoc ?? {},
    index: raw.index ?? {},
    // The phase runner skill (`runner.skill`, e.g. "run-build-phase"): when set, kick-off prompts are slim and
    // doc-first (they load that skill, which carries every generic step) and the phase doc holds the reads and
    // stops. The rest of `runner` (checks, devServers, capture, context) is read from the file by the runner's
    // own tools, so it is not copied here.
    runnerSkill: (raw.runner && typeof raw.runner.skill === 'string' && raw.runner.skill.trim()) || null,
  }
  // Screenshot capture: on when the plan says so, or (unset) when the board has a capture section.
  const boardConfig = readBoardConfig(root, requirements)
  if (c.capture === null) c.capture = !!boardConfig.capture
  if (c.capture) {
    const cap = boardConfig.capture || {}
    c.captureRecipes = `${requirements}/${cap.recipes ?? 'capture/recipes'}`
    c.captureReport = `${requirements}/${cap.report ?? 'capture/REPORT.md'}`
    c.captureAtlas = `${requirements}/${typeof c.capture === 'object' && c.capture.atlas ? c.capture.atlas : 'capture/ATLAS.md'}`
  }
  c.statuses = statusesOf(boardConfig, raw.settledStatuses, raw.unsettledStatuses)
  c.lanesText = c.outOfScopeLanes.length ? `the ${c.outOfScopeLanes.join(' and ')} lane${c.outOfScopeLanes.length > 1 ? 's' : ''}` : ''
  return c
}

function readBoardConfig(root, requirements) {
  try { return JSON.parse(fs.readFileSync(path.join(root, requirements, 'board.config.json'), 'utf8')) } catch { return {} }
}

// The board's defaults (BOARD/shared/statuses.ts) when its config has no lists.
const STATUS_DEFAULTS = {
  statuses: [{ code: 1, label: 'Proposed', role: 'default' }, { code: 2, label: 'Open', role: 'waiting' }, { code: 3, label: 'Verify' }, { code: 4, label: 'Confirmed' }, { code: 5, label: 'Retired', role: 'retired' }],
  questionStatuses: [{ code: 1, label: 'Open', role: 'default' }, { code: 2, label: 'Confirm' }, { code: 3, label: 'Proposed' }, { code: 4, label: 'Answered', role: 'answered' }],
}
export function statusListsOf(boardConfig) {
  const list = kind => (Array.isArray(boardConfig[kind]) ? boardConfig[kind] : STATUS_DEFAULTS[kind])
  return { statuses: list('statuses'), questionStatuses: list('questionStatuses') }
}

/**
 * Status words for agent prompts: every live status, the settled ones (config `settledStatuses`, codes;
 * default those the board marks `settle`) and the unsettled ones (`unsettledStatuses`; default the rest
 * but the default status).
 */
function statusesOf(boardConfig, settledCodes, unsettledCodes) {
  const { statuses } = statusListsOf(boardConfig)
  const live = statuses.filter(s => s.role !== 'retired')
  const retired = statuses.find(s => s.role === 'retired')
  const fmt = s => `${s.label} (${s.code})`
  return {
    list: live.map(s => `${s.code} ${s.label}`).join(', '),
    retired: retired ? fmt(retired) : 'Retired',
    settled: live.filter(s => (settledCodes ? settledCodes.map(String).includes(String(s.code)) : s.settle)).map(fmt),
    unsettled: live.filter(s => (unsettledCodes ? unsettledCodes.map(String).includes(String(s.code)) : !s.settle && s.role !== 'default')).map(fmt),
  }
}

// ---- phase status: the progress file, else status.json ----
// A progress file (config `progress`) records phases in a status table, rows
// `| NN | <title> | DONE | <date> | ...` or `| NN | ... | IN PROGRESS | ...`, and one `### [<word>] Phase NN`
// entry per built phase. Without one, status.json in the plan folder may list `done` and `in_progress`.
// Only phases numbered from config `firstPhase` count. A phase number is two digits with an optional
// letter (15, 15a), or a capital letter and digits (U1): an owner-added track outside the numbered run,
// which always counts as this plan's.
// A phase IN PROGRESS (its row, or status.json's in_progress) is partly built, never built, even once its
// session-1 entry is written; an entry with no status row at all still counts as built (older plans).
const NUM = '\\d{2}[a-z]?|[A-Z]\\d+'
const ROW = st => new RegExp(`^\\|\\s*(${NUM})\\s*\\|[^|\\n]*\\|\\s*(?:${st})\\s*\\|`, 'gm')

/** The phase sets of one progress text (with no text, status.json's done and in_progress lists). */
function parseProgress(text, status, firstPhase) {
  // status.json's done and in_progress lists stand in only when there is no progress file.
  const listed = k => (text ? [] : (status[k] ?? []).map(String))
  const first = parseInt(firstPhase, 10)
  const ours = n => /^[A-Z]/.test(n) || parseInt(n, 10) >= first
  const rows = st => [...text.matchAll(ROW(st))].map(m => m[1])
  const doneDate = new Map([...text.matchAll(new RegExp(`^\\|\\s*(${NUM})\\s*\\|[^|\\n]*\\|\\s*DONE\\s*\\|\\s*([^|\\n]*?)\\s*\\|`, 'gm'))].map(m => [m[1], m[2]]))
  for (const n of listed('done')) if (!doneDate.has(n)) doneDate.set(n, '')
  const done = [...new Set([...rows('DONE'), ...listed('done')])]
  const entries = [...text.matchAll(new RegExp(`^###\\s+(?:\\S+\\s+)?Phase\\s+(${NUM})\\b`, 'gm'))].map(m => m[1])
  const inProgress = [...new Set([...rows('IN PROGRESS'), ...listed('in_progress')])]
  // Partly built: IN PROGRESS and not also DONE (a DONE row wins over a stale IN PROGRESS one).
  const partly = new Set(inProgress.filter(n => !done.includes(n)))
  return {
    ours,
    doneDate,
    doneRows: done,
    inProgressRows: inProgress,
    built: [...new Set([...done, ...entries].filter(n => ours(n) && !partly.has(n)))],
    builtByEntry: [...new Set([...entries, ...listed('done')].filter(n => ours(n) && !partly.has(n)))],
    inProgress: inProgress.filter(ours),
    keepBaseline: [...new Set([...done, ...inProgress].filter(ours))],
  }
}

/**
 * The plan's phase status from the progress file (else status.json). With `{ lanes: true }`, the
 * update-build-plan view (never a phase's own context pack, which keeps to its own branch), the plan's
 * build lanes are merged in as laneStatus reads them: a lane's built phase is built, its partly built
 * phase in progress, and both keep their drift baselines. The returned fields are the same either way,
 * plus `lanes` in the update view.
 */
export function phaseStatus(c, root = process.cwd(), { lanes = false } = {}) {
  const text = c.progress && fs.existsSync(path.join(root, c.progress)) ? fs.readFileSync(path.join(root, c.progress), 'utf8') : ''
  let status = {}
  try { status = JSON.parse(fs.readFileSync(path.join(root, c.plan, 'status.json'), 'utf8')) } catch {}
  const p = parseProgress(text, status, c.firstPhase)
  const out = {
    text,
    status,
    doneDate: p.doneDate,
    /** DONE rows (any number), for display. */
    doneRows: p.doneRows,
    /** IN PROGRESS rows (any number). */
    inProgressRows: p.inProgressRows,
    /** Built: DONE rows, or a Phase entry with no IN PROGRESS row; ours only. */
    built: p.built,
    /** Built by entry only (a "### Phase NN" heading with no IN PROGRESS row). */
    builtByEntry: p.builtByEntry,
    inProgress: p.inProgress,
    /** Phases whose docs keep their own drift baseline: DONE or IN PROGRESS, ours only. */
    keepBaseline: p.keepBaseline,
  }
  if (!lanes) return out
  const l = laneStatus(c, root, status)
  const laneBuilt = l.branches.flatMap(b => b.built).filter(p.ours)
  const lanePartly = l.branches.flatMap(b => b.partlyBuilt).filter(p.ours)
  const built = [...new Set([...out.built, ...laneBuilt])]
  return {
    ...out,
    built,
    builtByEntry: [...new Set([...out.builtByEntry, ...laneBuilt])],
    inProgress: [...new Set([...out.inProgress, ...lanePartly])].filter(n => !built.includes(n)),
    keepBaseline: [...new Set([...out.keepBaseline, ...laneBuilt, ...lanePartly])],
    lanes: l,
  }
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * What the plan's build lanes hold. Config `lanes.branches` names the lane branches; for each one
 * other than the current branch: commits on HEAD..<branch> whose subject starts with `lanes.complete`
 * (default "{id} complete:") mean built and `lanes.checkpoint` (default "{id} checkpoint:") partly built,
 * and the branch's own progress file is read by the same rules as this one's (DONE built, IN PROGRESS partly
 * built); the stronger state wins. A configured branch that does not exist is listed under `missing`.
 * `declared` names status.json's guidance.lanes; `unaccounted` lists them when the config names fewer
 * branches than status.json declares lanes, so the tools can say so rather than proceed in silence.
 */
export function laneStatus(c, root = process.cwd(), status = null) {
  if (!status) {
    try { status = JSON.parse(fs.readFileSync(path.join(root, c.plan, 'status.json'), 'utf8')) } catch { status = {} }
  }
  const declared = (Array.isArray(status?.guidance?.lanes) ? status.guidance.lanes : []).map((l, i) => String(l?.name ?? `lane ${i + 1}`))
  const conf = c.lanes && typeof c.lanes === 'object' ? c.lanes : {}
  const configured = (Array.isArray(conf.branches) ? conf.branches : []).filter(b => typeof b === 'string' && b.trim())
  const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 })
  let current = ''
  try { current = git('rev-parse', '--abbrev-ref', 'HEAD').trim() } catch {}
  const subjectRe = (tpl, fallback) => {
    const [a, b] = (typeof tpl === 'string' && tpl.includes('{id}') ? tpl : fallback).split('{id}')
    return new RegExp(`^${esc(a)}(${NUM})${esc(b)}`)
  }
  const completeRe = subjectRe(conf.complete, '{id} complete:')
  const checkpointRe = subjectRe(conf.checkpoint, '{id} checkpoint:')
  const branches = []
  const missing = []
  for (const branch of configured) {
    if (branch === current) continue
    try { git('rev-parse', '--verify', '--quiet', `${branch}^{commit}`) } catch { missing.push(branch); continue }
    let subjects = []
    try { subjects = git('log', '--format=%s', `HEAD..${branch}`).split('\n').filter(Boolean) } catch {}
    let text = ''
    if (c.progress) { try { text = git('show', `${branch}:${c.progress}`) } catch {} }
    const p = parseProgress(text, {}, c.firstPhase)
    const done = new Set([...p.built, ...subjects.map(s => s.match(completeRe)?.[1]).filter(Boolean)])
    const partly = new Set([...p.inProgress, ...subjects.map(s => s.match(checkpointRe)?.[1]).filter(Boolean)].filter(n => !done.has(n)))
    branches.push({ branch, built: [...done], partlyBuilt: [...partly] })
  }
  return { declared, configured, current, branches, missing, unaccounted: declared.length > configured.length ? declared : [] }
}

/** Repo-relative path `to`, as a link from folder `fromDir` (both repo-relative). */
export const linkFrom = (fromDir, to) => path.relative(fromDir, to).split(path.sep).join('/')

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = loadConfig()
  console.log(JSON.stringify(c, null, process.argv.includes('--json') ? 0 : 1))
}
