// The capture recipes behind each phase's catalogue screenshots (when the plan uses screenshot capture:
// config `capture`, by default on when the board's config has a capture section).
// Usage (repo root): node <tools>/recipe-status.mjs [--plan <dir>] [<phase> ...] [--check]
//   <phase>   list the items a phase covers with their recipe status and shots (default: every phase)
//   --plan-file <file.json>  read phases from this plan file instead of plan.json (phase-briefs.mjs passes
//             the outline of an update in progress, before plan.json is rebuilt); `--plan <file.json>` works too
//   --check   exit 1 unless every unbuilt phase doc has a "## Catalogue screenshots" section that names
//             each story it covers (and each feature it covers that has no stories), and its kick-off
//             prompt runs the capture step
// Stories are listed under a covered epic or feature. Out-of-scope items (scope.mjs) are skipped. A story
// with no recipe is marked "none": the phase must create it (see ROADMAP.md, "Catalogue screenshots").
// Without screenshot capture it prints that and exits 0.
import fs from 'node:fs'
import path from 'node:path'
import { loadRecodes, loadStatuses, outOfScopeRule } from './scope.mjs'
import { loadConfig, phaseStatus } from './config.mjs'

const ROOT = process.cwd()
// `--plan` names the plan folder, or (a .json file) a plan file to read phases from, as `--plan-file` does.
const rawArgv = process.argv.slice(2)
const valueOf = flag => (rawArgv.includes(flag) ? rawArgv[rawArgv.indexOf(flag) + 1] : null)
const planIsFile = (valueOf('--plan') || '').endsWith('.json')
const planFileArg = valueOf('--plan-file') || (planIsFile ? valueOf('--plan') : null)
const config = loadConfig({ argv: planIsFile ? rawArgv.filter((a, i) => a !== '--plan' && rawArgv[i - 1] !== '--plan') : rawArgv })
const CU = path.join(ROOT, config.plan)
const REQ = path.join(ROOT, config.requirements, 'stories')
const SECTION = '## Catalogue screenshots'
const argv = rawArgv
const check = argv.includes('--check')
if (!config.capture) {
  console.log('ok: this plan does not use screenshot capture (plan.config.json "capture")')
  process.exit(0)
}
const RECIPES = path.join(ROOT, config.captureRecipes)
const planFile = planFileArg ? path.resolve(planFileArg) : path.join(CU, 'plan.json')
const wanted = argv.filter((a, i) => !a.startsWith('--') && !['--plan', '--plan-file'].includes(argv[i - 1]))

const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'))

const catalogue = {}
for (const f of fs.readdirSync(REQ).filter(f => f.endsWith('.md'))) {
  const head = fs.readFileSync(path.join(REQ, f), 'utf8').split('\n---')[0]
  const g = k => (head.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '')
  const id = f.replace(/\.md$/, '')
  catalogue[id] = { id, parent: g('parent'), status: g('status') ?? '', swimlane: g('swimlane') }
}
// Live: in scope by the shared rule (scope.mjs: not retired, not in an out-of-scope lane).
const outOfScope = outOfScopeRule(catalogue, loadRecodes(ROOT, config.requirements), loadStatuses(ROOT, config.requirements).retired, config.outOfScopeLanes)
const live = id => id in catalogue && !outOfScope(id)
const ids = Object.keys(catalogue)
const childrenOf = id => ids.filter(x => x !== id && x.slice(3).startsWith(id.slice(3) + '.'))
const recipe = id => {
  const f = path.join(RECIPES, `${id}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
}

// The items whose screenshots a phase owns: covered stories, stories under a covered epic or
// feature, and covered features with no stories.
function shotItems(phase) {
  const out = []
  const add = id => { if (live(id) && !out.includes(id)) out.push(id) }
  for (const id of phase.covers) {
    if (id.startsWith('US-')) add(id)
    else if (/^(EP|FT)-/.test(id)) {
      const kids = childrenOf(id)
      if (id.startsWith('FT-') && !kids.some(k => k.startsWith('US-'))) add(id)
      for (const k of kids) if (k.startsWith('US-')) add(k)
    }
  }
  return out
}

// A phase is built once the progress file has its "### Phase NN" entry (or status.json lists it done).
const builtSet = new Set(phaseStatus(config, ROOT).builtByEntry)
const built = num => builtSet.has(num)

if (check) {
  const problems = []
  for (const p of plan.phases) {
    if (built(p.num)) continue
    const doc = fs.readFileSync(path.join(CU, p.file), 'utf8')
    const prompt = fs.readFileSync(path.join(CU, p.file.replace(/\.md$/, '.prompt.md')), 'utf8')
    const at = doc.indexOf(`\n${SECTION}`)
    if (at < 0) { problems.push(`${p.num}: no "${SECTION}" section in ${p.file}`); continue }
    const next = doc.indexOf('\n## ', at + SECTION.length + 1)
    const body = doc.slice(at, next < 0 ? undefined : next)
    const absent = shotItems(p).filter(id => !body.includes(id))
    if (absent.length) problems.push(`${p.num}: section does not name ${absent.join(', ')}`)
    if (!/npm run capture/.test(prompt)) problems.push(`${p.num}: kick-off prompt does not run npm run capture`)
  }
  if (problems.length) { console.log(problems.join('\n')); process.exit(1) }
  console.log(`ok: ${plan.phases.filter(p => !built(p.num)).length} unbuilt phases have the capture step`)
  process.exit(0)
}

for (const p of plan.phases) {
  if (wanted.length && !wanted.includes(p.num)) continue
  console.log(`Phase ${p.num} · ${p.title}${built(p.num) ? ' (built)' : ''}`)
  const items = shotItems(p)
  if (!items.length) console.log('  no stories covered')
  for (const id of items) {
    const r = recipe(id)
    if (!r) { console.log(`  ${id}  none (create it)`); continue }
    const shots = (r.shots || []).map(s => `${s.app}-${s.name}${s.states.length > 1 ? `[${s.states.map(x => x.state).join(',')}]` : ''}`)
    console.log(`  ${id}  ${r.status}${shots.length ? `  ${shots.join(' ')}` : ''}`)
    if (r.absentReason) console.log(`      ${r.absentReason}`)
  }
  console.log('')
}
