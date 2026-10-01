// The catch-up plan's state, for updating it after the catalogue changes.
// Usage (repo root): node docs/prototype-build/catch-up/tools/plan-state.mjs [--to <ref>] [--coverage]
//   --to <ref>   compare the plan's baseline (plan.json "commit") with this ref; default: the working tree
//   --coverage   print only the coverage check (exit 1 if incomplete)
// Prints JSON: baseline, to, changed catalogue items and questions, whether domain-model.md changed,
// whether prototype code changed (so the prototype maps are stale), catch-up phases already built
// (PROGRESS.md entries numbered 14+), the planning units (tools/units.json), the phases' current
// covers, and the coverage check (every unit in exactly one phase or parked).
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const REQ = 'docs/discovery-reference/Updated Requirements'
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
  .map(l => { const [st, ...f] = l.split('\t'); return { status: st, file: f[f.length - 1] } })
const untracked = p => (to ? [] : git('ls-files', '--others', '--exclude-standard', '--', p).trim().split('\n').filter(Boolean).map(file => ({ status: 'A', file })))
const idOf = f => path.basename(f, '.md')
const changes = [...diff([`${REQ}/catalogue/requirements`, `${REQ}/catalogue/questions`]), ...untracked(`${REQ}/catalogue`)]
  .filter(c => c.file.endsWith('.md'))
const status = id => {
  const f = path.join(ROOT, REQ, 'catalogue/requirements', `${id}.md`)
  return fs.existsSync(f) ? (fs.readFileSync(f, 'utf8').match(/^status:\s*(.*)$/m) || [])[1] : 'deleted'
}

const progress = fs.readFileSync(path.join(ROOT, 'docs/prototype-build/PROGRESS.md'), 'utf8')
const builtPhases = [...new Set([...progress.matchAll(/^###\s+(?:Catch-up\s+)?Phase\s+(\d{2})\b/gim)].map(m => m[1]).filter(n => Number(n) >= 14))]

console.log(JSON.stringify({
  baseline: plan.commit, to: to || 'working tree',
  changedItems: changes.filter(c => c.file.includes('/requirements/')).map(c => ({ id: idOf(c.file), change: c.status, status: status(idOf(c.file)) })),
  changedQuestions: changes.filter(c => c.file.includes('/questions/')).map(c => ({ id: idOf(c.file), change: c.status })),
  notesAdded: [...diff([`${REQ}/catalogue/notes`]), ...untracked(`${REQ}/catalogue/notes`)].map(c => c.file),
  domainModelChanged: diff([`${REQ}/domain-model.md`]).length > 0,
  prototypeCodeChanged: diff(['aa-prototype/src']).length > 0,
  builtPhases,
  units: units.length,
  phases: plan.phases.map(p => ({ num: p.num, title: p.title, file: p.file, covers: p.covers })),
  parked: plan.parked,
  coverage,
}, null, 1))
