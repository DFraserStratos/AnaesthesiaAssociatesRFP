// Applies a plan update: rebuilds plan.json exactly from the outline run (workflow-plan-outline.js) and
// the detail runs (workflow-plan-detail.js), moves the drift-check baseline to the new commit across the
// plan docs, and regenerates index.html.
// Usage (repo root):
//   node <tools>/apply-plan-update.mjs [--plan <dir>] <outline journal.jsonl> [<detail journal.jsonl> ...] <new-commit-sha> [--built 14,15]
//   Journals are read in order; for each phase the last writer or reviewer result wins, so pass a re-run's
//   journal after the run it repairs. (A single journal from the old one-step workflow-plan-update.js
//   still works.)
//   --built   extra phases whose docs keep their baseline. Phases the progress file (or status.json) marks
//             DONE or IN PROGRESS are always kept: a partly built phase's drift check stays on its own baseline;
//             so are phases a build lane has completed or checkpointed (config `lanes`).
//   --ignore-lanes  run although status.json declares build lanes the config names no branch for, or a
//             configured lane branch does not exist (refused otherwise, exit 2: their phases' baselines
//             would move).
// A phase number the new plan reuses with a different slug (a fresh-plan remake) gets the new doc path; when
// the old doc is still in phases/ both paths are reported (stderr and "superseded"); nothing is moved.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { TOOLS, loadConfig, phaseStatus, stripPlanArg } from './config.mjs'
import { BASELINE_LINE } from './plan-docs.mjs'

const config = loadConfig()
const argv = stripPlanArg()
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--built')
const commit = positional.find(a => /^[0-9a-f]{40}$/.test(a))
const journals = positional.filter(a => a.endsWith('.jsonl'))
if (!journals.length || !commit) {
  console.error('usage: apply-plan-update.mjs <outline journal.jsonl> [<detail journal.jsonl> ...] <full 40-char commit sha> [--built 14,15]')
  process.exit(2)
}
const ROOT = process.cwd()
const CU = path.join(ROOT, config.plan)
const status = phaseStatus(config, ROOT, { lanes: true })
if ((status.lanes.unaccounted.length || status.lanes.missing.length) && !argv.includes('--ignore-lanes')) {
  const why = status.lanes.unaccounted.length
    ? `status.json declares build lanes (${status.lanes.unaccounted.join(', ')}) but ${config.configFile} names no branch for ${status.lanes.configured.length ? 'all of them' : 'them'} (config "lanes": { "branches": [...] })`
    : `the configured lane branch${status.lanes.missing.length > 1 ? 'es' : ''} ${status.lanes.missing.join(', ')} ${status.lanes.missing.length > 1 ? 'do' : 'does'} not exist`
  console.error(`apply-plan-update: ${why}. Phases built or checkpointed on a lane cannot be kept, so nothing was written. Fix the config, run after the join, or pass --ignore-lanes.`)
  process.exit(2)
}
const built = new Set([
  ...(argv.includes('--built') ? argv[argv.indexOf('--built') + 1].split(',') : []),
  ...status.keepBaseline,
])

const results = journals.flatMap(j => {
  const lines = fs.readFileSync(j, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  const labelOf = new Map(lines.filter(l => l.type === 'started').map(l => [l.agentId, l.label]))
  return lines.filter(l => l.type === 'result' && l.result && labelOf.has(l.agentId)).map(l => ({ label: labelOf.get(l.agentId), result: l.result }))
})

const outline = results.filter(r => /^(architect|architect:update|architect:revise|coverage-fix-\d+|coverage-fix-final)$/.test(r.label)).pop()?.result
if (!outline?.phases) { console.error('no outline result in the journals'); process.exit(1) }
const detail = num => results.filter(r => [`review:${num}`, `update:${num}`, `write:${num}`].includes(r.label)).pop()?.result

const planPath = path.join(CU, 'plan.json')
const old = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath, 'utf8')) : { commit: commit, phases: [] }
const oldByNum = new Map(old.phases.map(p => [p.num, p]))
// An update run (its outline labelled architect:update) keeps every existing phase's doc. A fresh-plan
// remake (workflow-dev-plan.js, labelled architect) keeps the old doc only for the same phase (same slug),
// and moves to the new path only once the remake has written a doc there.
const updateRun = results.some(r => r.label === 'architect:update')
const superseded = []
const phases = outline.phases.map(p => {
  const o = oldByNum.get(p.num)
  const d = detail(p.num)
  const fresh = `phases/phase-${p.num}-${p.slug}.md`
  const file = o?.file && (updateRun || !p.slug || !o.slug || o.slug === p.slug || !fs.existsSync(path.join(CU, fresh))) ? o.file : fresh
  if (o?.file && file !== o.file && fs.existsSync(path.join(CU, o.file))) superseded.push({ num: p.num, old: o.file, new: file })
  return { ...p, file, prompt_file: file.replace(/\.md$/, '.prompt.md'), goal_short: d?.goal_short || o?.goal_short || p.goal, checks: d?.checks || o?.checks || [] }
})
for (const p of phases) if (!fs.existsSync(path.join(CU, p.file))) console.warn(`warning: phase ${p.num} has no doc at ${p.file}`)
for (const s of superseded) console.warn(`warning: phase ${s.num} now uses ${s.new}; the old doc ${s.old} is still in the plan folder (left as it is)`)
fs.writeFileSync(planPath, JSON.stringify({ commit, phases, parked: outline.parked, sequencing_rules: outline.sequencing_rules, milestones: outline.milestones }, null, 1) + '\n')

// Move the baseline: every plan doc except the gap-tool outputs, the tools, README.md (its history and
// snapshot line are written by hand) and built phases' docs.
const from = [old.commit, old.commit.slice(0, 7)]
const skip = f => /^(gaps\.json|GAP-ANALYSIS\.md|plan\.json|units\.json|plan\.config\.json|status\.json|index\.html|README\.md)$/.test(f) || /^(epics|tools|analysis)\//.test(f)
  || [...built].some(n => new RegExp(`^phases/phase-${n}-`).test(f))
const walk = d => fs.readdirSync(path.join(CU, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
// Only baseline references move: lines about the drift check or the plan's baseline, and never an
// `old..new` range. Historical mentions ("graded at <old>", "since <old>") keep the old sha.
const shaRe = new RegExp(`(\\.\\.)?\\b(${from[0]}|${from[1]})\\b(?!\\.\\.)`, 'g')
const rebase = line => !BASELINE_LINE.test(line) ? line
  : line.replace(shaRe, (m, range, sha) => range ? m : (sha.length === 40 ? commit : commit.slice(0, 7)))
let touched = 0
if (old.commit !== commit) for (const f of walk('.').map(f => f.replace(/^\.\//, '')).filter(f => f.endsWith('.md') && !skip(f))) {
  const p = path.join(CU, f)
  const s = fs.readFileSync(p, 'utf8')
  const t = s.split('\n').map(rebase).join('\n')
  if (t !== s) { fs.writeFileSync(p, t); touched++ }
}
// build-index prints its summary on stdout and its warnings on stderr.
const run = spawnSync('node', [path.join(TOOLS, 'build-index.mjs'), '--plan', config.plan], { cwd: ROOT, encoding: 'utf8' })
if (run.status !== 0) { process.stderr.write(run.stderr); process.exit(1) }
const built_ = run.stdout.trim().split('\n')
const warnings = run.stderr.split('\n').filter(l => /^\s+- /.test(l)).map(l => l.trim().slice(2))
console.log(JSON.stringify({ phases: phases.length, keptBaseline: [...built].join(', '), updatedDetails: phases.filter(p => detail(p.num)).map(p => p.num).join(', '), baseline: `${from[1]} -> ${commit.slice(0, 7)}`, filesRebased: touched, indexWarnings: warnings, index: built_.slice(-2), ...(superseded.length ? { superseded } : {}) }, null, 1))
