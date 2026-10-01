// Applies a workflow-plan-update.js run: rebuilds plan.json exactly from the run's journal, moves the
// drift-check baseline to the new commit across the plan docs, and regenerates index.html.
// Usage (repo root): node docs/prototype-build/catch-up/tools/apply-plan-update.mjs <journal.jsonl> <new-commit-sha> [--built 14,15]
//   --built   phases already built: their docs keep their historical baseline
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const [journalPath, commit] = process.argv.slice(2)
const argv = process.argv.slice(2)
const built = new Set(argv.includes('--built') ? argv[argv.indexOf('--built') + 1].split(',') : [])
if (!journalPath || !/^[0-9a-f]{40}$/.test(commit || '')) {
  console.error('usage: apply-plan-update.mjs <journal.jsonl> <full 40-char commit sha> [--built 14,15]')
  process.exit(2)
}
const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')

const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const labelOf = new Map(lines.filter(l => l.type === 'started').map(l => [l.agentId, l.label]))
const results = lines.filter(l => l.type === 'result' && l.result && labelOf.has(l.agentId)).map(l => ({ label: labelOf.get(l.agentId), result: l.result }))

const outline = results.filter(r => /^(architect:update|architect:revise|coverage-fix-\d+)$/.test(r.label)).pop()?.result
if (!outline?.phases) { console.error('no outline result in the journal'); process.exit(1) }
const detail = num => (results.filter(r => r.label === `review:${num}`).pop() || results.filter(r => r.label === `update:${num}` || r.label === `write:${num}`).pop())?.result

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

// Move the baseline: every plan doc except the gap-tool outputs, the tools, and built phases' docs.
const from = [old.commit, old.commit.slice(0, 7)]
const skip = f => /^(gaps\.json|GAP-ANALYSIS\.md|plan\.json|index\.html)$/.test(f) || /^(epics|tools|analysis)\//.test(f)
  || [...built].some(n => new RegExp(`^phases/phase-${n}-`).test(f))
const walk = d => fs.readdirSync(path.join(CU, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
let touched = 0
if (old.commit !== commit) for (const f of walk('.').map(f => f.replace(/^\.\//, '')).filter(f => f.endsWith('.md') && !skip(f))) {
  const p = path.join(CU, f)
  const s = fs.readFileSync(p, 'utf8')
  const t = s.split(from[0]).join(commit).split(from[1]).join(commit.slice(0, 7))
  if (t !== s) { fs.writeFileSync(p, t); touched++ }
}
const built_ = execFileSync('node', [path.join(CU, 'tools/build-index.mjs')], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
const warnings = built_.filter(l => /warn/i.test(l))
console.log(JSON.stringify({ phases: phases.length, updatedDetails: phases.filter(p => detail(p.num)).map(p => p.num).join(', '), baseline: `${from[1]} -> ${commit.slice(0, 7)}`, filesRebased: touched, indexWarnings: warnings, index: built_.slice(-2) }, null, 1))
