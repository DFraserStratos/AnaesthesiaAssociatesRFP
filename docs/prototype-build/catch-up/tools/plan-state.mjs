// The catch-up plan's state, for updating it after the catalogue changes.
// Usage (repo root): node docs/prototype-build/catch-up/tools/plan-state.mjs [--to <ref>] [--coverage] [--diff [IDs]]
//   --to <ref>     compare the plan's baseline (plan.json "commit") with this ref; default: the working tree
//   --coverage     print only the coverage check (exit 1 if incomplete)
//   --diff [IDs]   the drift check: print the diff since the baseline of each changed item or question
//                  (only the IDs given, comma or space separated, when there are any) and of domain-model.md
// The catalogue has moved since the baseline; req-changes.mjs reads every layout with rename detection,
// so a moved file counts only if its content changed.
// Prints JSON: baseline, to, changed catalogue items and questions, the notes and change logs added
// (requirements-board/requirements/notes/ and changes/), whether domain-model.md changed,
// whether prototype code changed (so the prototype maps are stale), catch-up phases already built
// (PROGRESS.md entries numbered 14+), the planning units (tools/units.json), the phases' current
// covers, and the coverage check (every unit in exactly one phase or parked).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { LAYOUTS, pathOf, requirementChanges } from './req-changes.mjs'

const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const argv = process.argv.slice(2)
const to = argv.includes('--to') ? argv[argv.indexOf('--to') + 1] : null

const plan = JSON.parse(fs.readFileSync(path.join(CU, 'plan.json'), 'utf8'))
const units = JSON.parse(fs.readFileSync(path.join(CU, 'tools/units.json'), 'utf8'))

const seen = new Map()
for (const p of plan.phases) for (const id of p.covers) seen.set(id, [...(seen.get(id) || []), p.num])
for (const x of plan.parked || []) seen.set(x.id, [...(seen.get(x.id) || []), 'parked'])
const coverage = {
  ok: units.every(u => seen.get(u)?.length === 1),
  missing: units.filter(u => !seen.has(u)),
  dupes: [...seen].filter(([, v]) => v.length > 1).map(([k, v]) => `${k} in ${v.join(' + ')}`),
  unknown: [...seen.keys()].filter(k => !units.includes(k)),
}
if (argv.includes('--coverage')) {
  console.log(JSON.stringify(coverage, null, 1))
  process.exit(coverage.ok ? 0 : 1)
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' })
const range = to ? [plan.commit, to] : [plan.commit]
const diff = paths => git('diff', '--name-status', ...range, '--', ...paths).trim().split('\n').filter(Boolean)
const changes = requirementChanges({ cwd: ROOT, from: plan.commit, to })
const exists = rel => fs.existsSync(path.join(ROOT, rel))
const status = id => {
  const f = path.join(ROOT, pathOf(id, exists))
  return fs.existsSync(f) ? (fs.readFileSync(f, 'utf8').match(/^status:\s*(.*)$/m) || [])[1] : 'deleted'
}

if (argv.includes('--diff')) {
  const ids = argv.slice(argv.indexOf('--diff') + 1).filter(a => !a.startsWith('--')).flatMap(a => a.split(',')).map(s => s.trim()).filter(Boolean)
  const wanted = c => !ids.length || ids.includes(c.id)
  const picked = [...changes.items, ...changes.questions].filter(wanted)
  const dm = changes.domainModel.length ? changes.domainModel : []
  console.log(`Drift since ${plan.commit.slice(0, 7)}${to ? ` to ${to}` : ' (working tree)'}: ${picked.length ? picked.map(c => `${c.id} (${c.change})`).join(', ') : 'none of the covered items or questions changed'}; domain-model.md ${dm.length ? 'changed' : 'unchanged'}.`)
  for (const c of [...picked, ...dm]) {
    const paths = [c.file, c.was].filter(Boolean)
    process.stdout.write(c.change === 'A' && !to ? `\n(new) ${c.file}\n` : git('diff', '-M', ...range, '--', ...paths))
  }
  process.exit(0)
}

const progress = fs.readFileSync(path.join(ROOT, 'docs/prototype-build/PROGRESS.md'), 'utf8')
const builtPhases = [...new Set([...progress.matchAll(/^###\s+(?:Catch-up\s+)?Phase\s+(\d{2})\b/gim)].map(m => m[1]).filter(n => Number(n) >= 14))]

console.log(JSON.stringify({
  baseline: plan.commit, to: to || 'working tree',
  changedItems: changes.items.map(c => ({ id: c.id, change: c.change, status: status(c.id) })),
  changedQuestions: changes.questions.map(c => ({ id: c.id, change: c.change })),
  notesAdded: changes.notesAdded,
  changeLogsAdded: changes.changeLogsAdded,
  domainModelChanged: changes.domainModel.length > 0,
  prototypeCodeChanged: diff(['aa-prototype/src']).length > 0,
  builtPhases,
  units: units.length,
  phases: plan.phases.map(p => ({ num: p.num, title: p.title, file: p.file, covers: p.covers })),
  parked: plan.parked,
  coverage,
}, null, 1))
