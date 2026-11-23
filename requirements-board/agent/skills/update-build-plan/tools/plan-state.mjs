// The build plan's state, for updating it after the catalogue changes.
// Usage (repo root): node <tools>/plan-state.mjs [--plan <dir>] [--to <ref>] [--coverage] [--diff [IDs] [--from <ref>]]
//   --plan <dir>   the plan folder (see config.mjs for the default)
//   --to <ref>     compare the plan's baseline (plan.json "commit") with this ref; default: the working tree
//   --coverage     print only the coverage check (exit 1 if incomplete); ids only on built phases that are
//                  no longer units are listed as delivered, not unknown
//   --diff [IDs]   the drift check: print the diff since the baseline of each changed item or question
//                  (only the IDs given, comma or space separated, when there are any) and of domain-model.md
//   --from <ref>   with --diff: diff from this commit instead of plan.json's (a phase doc's own drift
//                  baseline: the context pack prints the exact command)
// The catalogue may have moved since the baseline; req-changes.mjs reads every layout with rename
// detection, so a moved file counts only if its content changed.
// Prints JSON: baseline, to, changed catalogue items and questions, the notes and change logs added
// (the requirements folder's notes/ and changes/), whether domain-model.md changed, whether app code
// changed (config `appCode`: the code maps are then stale), the plan's phases already built (progress
// file DONE rows or Phase entries, numbered from config `firstPhase`, letters included) and those in
// progress, the planning units (<plan>/units.json), the phases' current covers, the coverage check
// (every unit in exactly one phase or parked), and under "analysis" the gap analysis's files missing on
// disk (missingMaps: config gapAnalysis.maps keys with no analysis/<appNoun>-map-<key>.md; deltaMissing:
// no analysis/domain-model-delta.md), passed to workflow-gap-analysis.js as they are.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { layoutsOf, pathOf, requirementChanges } from './req-changes.mjs'
import { loadConfig, phaseStatus, stripPlanArg } from './config.mjs'

const ROOT = process.cwd()
const config = loadConfig()
const CU = path.join(ROOT, config.plan)
const LAYOUTS = layoutsOf(config)
const argv = stripPlanArg()
const to = argv.includes('--to') ? argv[argv.indexOf('--to') + 1] : null
const fromArg = argv.includes('--from') ? argv[argv.indexOf('--from') + 1] : null
if (argv.includes('--from') && (!fromArg || fromArg.startsWith('--') || !argv.includes('--diff'))) {
  console.error('plan-state: --from <ref> goes with --diff.')
  process.exit(2)
}

const plan = JSON.parse(fs.readFileSync(path.join(CU, 'plan.json'), 'utf8'))
const unitsFile = path.join(CU, 'units.json')
const units = fs.existsSync(unitsFile) ? JSON.parse(fs.readFileSync(unitsFile, 'utf8')) : []

const seen = new Map()
for (const p of plan.phases) for (const id of p.covers) seen.set(id, [...(seen.get(id) || []), p.num])
for (const x of plan.parked || []) seen.set(x.id, [...(seen.get(x.id) || []), 'parked'])
// Built phases: DONE rows of the progress file's status table, or a "### [<word>] Phase NN" entry (letter
// suffixes such as 15a included). A phase IN PROGRESS is not built. Outside --diff this is the update view:
// the plan's build lanes (config `lanes`) count too, and lanes status.json declares that the config
// does not name are reported, on stderr and under "lanes".
const phaseState = phaseStatus(config, ROOT, { lanes: !argv.includes('--diff') })
const { built: builtPhases, inProgress: inProgressPhases } = phaseState
const lanes = phaseState.lanes
if (lanes?.unaccounted.length) console.error(`plan-state: status.json declares build lanes (${lanes.unaccounted.join(', ')}) but ${config.configFile} names no branch for ${lanes.configured.length ? 'all of them' : 'them'} (config "lanes": { "branches": [...] }), so phases built or checkpointed on a lane are not counted. Do not update the plan until they are: add the key, or wait for the join.`)
if (lanes?.missing.length) console.error(`plan-state: configured lane branch(es) not found: ${lanes.missing.join(', ')}.`)

// An id on a built phase that is no longer a unit was delivered by that phase (it now Matches): not stale.
const builtOnly = k => seen.get(k).every(n => builtPhases.includes(n))
const coverage = {
  ok: units.every(u => seen.get(u)?.length === 1),
  missing: units.filter(u => !seen.has(u)),
  dupes: [...seen].filter(([, v]) => v.length > 1).map(([k, v]) => `${k} in ${v.join(' + ')}`),
  unknown: [...seen.keys()].filter(k => !units.includes(k) && !builtOnly(k)),
  delivered: [...seen.keys()].filter(k => !units.includes(k) && builtOnly(k)).map(k => `${k} (${seen.get(k).join(' + ')})`),
}
if (argv.includes('--coverage')) {
  console.log(JSON.stringify(coverage, null, 1))
  process.exit(coverage.ok ? 0 : 1)
}

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' })
const range = to ? [plan.commit, to] : [plan.commit]
const diff = paths => git('diff', '--name-status', ...range, '--', ...paths).trim().split('\n').filter(Boolean)
// --from (with --diff only) moves the start of the diff; everything else runs from plan.json's baseline.
const changes = requirementChanges({ cwd: ROOT, from: fromArg ?? plan.commit, to, layouts: LAYOUTS })
const exists = rel => fs.existsSync(path.join(ROOT, rel))
const status = id => {
  const f = path.join(ROOT, pathOf(id, exists, LAYOUTS))
  return fs.existsSync(f) ? (fs.readFileSync(f, 'utf8').match(/^status:\s*(.*)$/m) || [])[1] : 'deleted'
}

if (argv.includes('--diff')) {
  const after = argv.slice(argv.indexOf('--diff') + 1)
  const ids = after.filter((a, i) => !a.startsWith('--') && !['--from', '--to', '--plan'].includes(after[i - 1])).flatMap(a => a.split(',')).map(s => s.trim()).filter(Boolean)
  const wanted = c => !ids.length || ids.includes(c.id)
  const base = fromArg ?? plan.commit
  const dRange = to ? [base, to] : [base]
  const picked = [...changes.items, ...changes.questions].filter(wanted)
  const dm = changes.domainModel.length ? changes.domainModel : []
  console.log(`Drift since ${base.slice(0, 7)}${to ? ` to ${to}` : ' (working tree)'}: ${picked.length ? picked.map(c => `${c.id} (${c.change})`).join(', ') : 'none of the covered items or questions changed'}; domain-model.md ${dm.length ? 'changed' : 'unchanged'}.`)
  for (const c of [...picked, ...dm]) {
    const paths = [c.file, c.was].filter(Boolean)
    process.stdout.write(c.change === 'A' && !to ? `\n(new) ${c.file}\n` : git('diff', '-M', ...dRange, '--', ...paths))
  }
  process.exit(0)
}


// The gap analysis's own files: a map or delta file that was never written cannot be reused or updated.
const mapKeys = (config.gapAnalysis.maps || [{ key: 'app' }]).map(m => String(m.key))
const analysis = {
  missingMaps: mapKeys.filter(k => !fs.existsSync(path.join(CU, 'analysis', `${config.appNoun}-map-${k}.md`))),
  deltaMissing: !fs.existsSync(path.join(CU, 'analysis', 'domain-model-delta.md')),
}

console.log(JSON.stringify({
  baseline: plan.commit, to: to || 'working tree',
  changedItems: changes.items.map(c => ({ id: c.id, change: c.change, status: status(c.id) })),
  changedQuestions: changes.questions.map(c => ({ id: c.id, change: c.change })),
  notesAdded: changes.notesAdded,
  changeLogsAdded: changes.changeLogsAdded,
  domainModelChanged: changes.domainModel.length > 0,
  appCodeChanged: config.appCode.length ? diff(config.appCode).length > 0 : true,
  builtPhases,
  inProgressPhases,
  ...(lanes && (lanes.declared.length || lanes.configured.length) ? { lanes: { declared: lanes.declared, branches: lanes.branches, missing: lanes.missing, unaccounted: lanes.unaccounted } } : {}),
  units: units.length,
  phases: plan.phases.map(p => ({ num: p.num, title: p.title, file: p.file, covers: p.covers })),
  parked: plan.parked,
  coverage,
  analysis,
}, null, 1))
