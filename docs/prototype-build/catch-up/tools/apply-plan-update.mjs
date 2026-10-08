// Applies a plan update: rebuilds plan.json exactly from the outline run (workflow-plan-outline.js) and
// the detail runs (workflow-plan-detail.js), moves the drift-check baseline to the new commit across the
// plan docs, and regenerates index.html.
// Usage (repo root):
//   node docs/prototype-build/catch-up/tools/apply-plan-update.mjs <outline journal.jsonl> [<detail journal.jsonl> ...] <new-commit-sha> [--built 14,15]
//   Journals are read in order; for each phase the last writer or reviewer result wins, so pass a re-run's
//   journal after the run it repairs. (A single journal from the old one-step workflow-plan-update.js
//   still works.)
//   --built   extra phases whose docs keep their baseline. Phases PROGRESS.md marks DONE or IN PROGRESS
//             are always kept: a partly built phase's drift check stays on its own baseline.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--built')
const commit = positional.find(a => /^[0-9a-f]{40}$/.test(a))
const journals = positional.filter(a => a.endsWith('.jsonl'))
if (!journals.length || !commit) {
  console.error('usage: apply-plan-update.mjs <outline journal.jsonl> [<detail journal.jsonl> ...] <full 40-char commit sha> [--built 14,15]')
  process.exit(2)
}
const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const progress = fs.readFileSync(path.join(ROOT, 'docs/prototype-build/PROGRESS.md'), 'utf8')
const built = new Set([
  ...(argv.includes('--built') ? argv[argv.indexOf('--built') + 1].split(',') : []),
  ...[...progress.matchAll(/^\|\s*(\d{2}[a-z]?)\s*\|[^|\n]*\|\s*(?:DONE|IN PROGRESS)\s*\|/gim)].map(m => m[1]).filter(n => parseInt(n, 10) >= 14),
])

const results = journals.flatMap(j => {
  const lines = fs.readFileSync(j, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  const labelOf = new Map(lines.filter(l => l.type === 'started').map(l => [l.agentId, l.label]))
  return lines.filter(l => l.type === 'result' && l.result && labelOf.has(l.agentId)).map(l => ({ label: labelOf.get(l.agentId), result: l.result }))
})

const outline = results.filter(r => /^(architect:update|architect:revise|coverage-fix-\d+)$/.test(r.label)).pop()?.result
if (!outline?.phases) { console.error('no outline result in the journals'); process.exit(1) }
const detail = num => results.filter(r => [`review:${num}`, `update:${num}`, `write:${num}`].includes(r.label)).pop()?.result

const planPath = path.join(CU, 'plan.json')
const old = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const oldByNum = new Map(old.phases.map(p => [p.num, p]))
const phases = outline.phases.map(p => {
  const o = oldByNum.get(p.num)
  const d = detail(p.num)
  const file = o?.file || `phases/phase-${p.num}-${p.slug}.md`
  return { ...p, file, prompt_file: file.replace(/\.md$/, '.prompt.md'), goal_short: d?.goal_short || o?.goal_short || p.goal, checks: d?.checks || o?.checks || [] }
})
for (const p of phases) if (!fs.existsSync(path.join(CU, p.file))) console.warn(`warning: phase ${p.num} has no doc at ${p.file}`)
fs.writeFileSync(planPath, JSON.stringify({ commit, phases, parked: outline.parked, sequencing_rules: outline.sequencing_rules, milestones: outline.milestones }, null, 1) + '\n')

// Move the baseline: every plan doc except the gap-tool outputs, the tools, README.md (its history and
// snapshot line are written by hand) and built phases' docs.
const from = [old.commit, old.commit.slice(0, 7)]
const skip = f => /^(gaps\.json|GAP-ANALYSIS\.md|plan\.json|index\.html|README\.md)$/.test(f) || /^(epics|tools|analysis)\//.test(f)
  || [...built].some(n => new RegExp(`^phases/phase-${n}-`).test(f))
const walk = d => fs.readdirSync(path.join(CU, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
// Only baseline references move: lines about the drift check or the plan's baseline, and never an
// `old..new` range. Historical mentions ("graded at <old>", "since <old>") keep the old sha.
const BASELINE_LINE = /drift|baseline|plan-state\.mjs|planned (?:below )?against|against catalogue commit/i
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
const built_ = execFileSync('node', [path.join(CU, 'tools/build-index.mjs')], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
const warnings = built_.filter(l => /warn/i.test(l))
console.log(JSON.stringify({ phases: phases.length, keptBaseline: [...built].join(', '), updatedDetails: phases.filter(p => detail(p.num)).map(p => p.num).join(', '), baseline: `${from[1]} -> ${commit.slice(0, 7)}`, filesRebased: touched, indexWarnings: warnings, index: built_.slice(-2) }, null, 1))
