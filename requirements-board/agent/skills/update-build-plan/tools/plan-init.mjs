// Seeds an empty build plan at a commit: the light alternative to a fresh plan. No gap analysis is run;
// the app is taken as matching the catalogue at that commit, so the first update re-grades only what
// changed after it and adds phases for those changes alone.
// Usage (repo root):
//   node <tools>/plan-init.mjs [--plan <dir>] --at <ref> [--first <phase>] [--date YYYY-MM-DD] [--force] [--no-index]
//   --at <ref>       the catalogue commit the plan starts from (any ref; stored as the full sha)
//   --first <phase>  the first phase number new phases take (two digits, e.g. 45): written to the plan
//                    config's `firstPhase` (the config is created with just that key when there is none).
//                    Pick the number after the last phase of any earlier plan, so ids stay unique
//   --date           the date recorded in gaps.json and README.md (default today)
//   --force          overwrite the plan's data files when they exist (refused otherwise, writing nothing)
//   --no-index       skip index.html (by default build-index.mjs renders the empty plan page)
// Writes in the plan folder:
//   plan.json    { commit, phases: [], parked: [], sequencing_rules: "", milestones: [] }
//   gaps.json    an empty gap analysis with "seeded": <sha> (assemble-gaps.mjs --merge then leaves items
//                not graded since the seed out quietly, rather than as problems)
//   units.json   []
//   status.json  { done: [], in_progress: [], next: { phases: [], note: "No phase planned." }, guidance: {} }
//   analysis/domain-model-delta.md  a stub: no open deltas at the seed, DM ids start at DM-01
//   GAP-ANALYSIS.md                 a stub saying no gap analysis was run
// and, only when absent (never overwritten, even with --force: they are the owner's to edit):
//   ROADMAP.md   the sections the outline architect updates (decisions table, phase table, open
//                questions, sequencing rules, milestones, parked, standing rules), all empty
//   README.md    what the plan is, and an "Update history" with the seed as its first line
// Prints JSON: plan, commit, firstPhase, written, kept, and the index summary.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { TOOLS, loadConfig, stripPlanArg } from './config.mjs'

const ROOT = process.cwd()
const argv = stripPlanArg()
const opt = k => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null }
const usage = msg => { console.error(`plan-init: ${msg}\nusage: plan-init.mjs [--plan <dir>] --at <ref> [--first <phase>] [--date YYYY-MM-DD] [--force] [--no-index]`); process.exit(2) }

const at = opt('--at')
if (!at) usage('--at <ref> is required.')
const first = opt('--first')
if (argv.includes('--first') && !first) usage('--first needs a phase number.')
if (first && !/^\d{2,}$/.test(first)) usage(`--first ${first}: a phase number is two or more digits.`)
const date = opt('--date') ?? new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) usage(`--date ${date}: use YYYY-MM-DD.`)
const FORCE = argv.includes('--force')

let sha
try { sha = execFileSync('git', ['rev-parse', '--verify', '--quiet', `${at}^{commit}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { usage(`${at} is not a commit in this repo.`) }
const s7 = sha.slice(0, 7)

let config = loadConfig()
const CU = path.join(ROOT, config.plan)
const rel = f => path.relative(ROOT, path.join(CU, f)).split(path.sep).join('/')

// The data files: refused when any exists, unless --force.
const DATA = ['plan.json', 'gaps.json', 'units.json', 'status.json', 'analysis/domain-model-delta.md', 'GAP-ANALYSIS.md']
const present = DATA.filter(f => fs.existsSync(path.join(CU, f)))
if (present.length && !FORCE) {
  console.error(`plan-init: ${config.plan} already has ${present.join(', ')}. Nothing was written. Pass --force to overwrite them (ROADMAP.md and README.md are never overwritten), or seed another folder with --plan <dir>.`)
  process.exit(1)
}

// --first goes to the config, where every tool and workflow reads it.
const written = []
if (first) {
  const file = path.join(ROOT, config.configFile)
  let raw = {}
  let indent = 2
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8')
    raw = JSON.parse(text)
    indent = text.match(/^\{\s*\n([ \t]+)"/)?.[1] ?? 2
  }
  if (String(raw.firstPhase ?? '') !== first) {
    raw.firstPhase = first
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(raw, null, indent) + '\n')
    written.push(config.configFile.split(path.sep).join('/'))
    config = loadConfig({ argv: ['--plan', config.plan] })
  }
}
const FIRST = config.firstPhase
const APP = config.appNoun
const VERDICTS = ['Contradicts', 'Partial', 'Missing', 'OutOfScope', 'Matches', 'Grouping']

const files = {
  'plan.json': JSON.stringify({ commit: sha, phases: [], parked: [], sequencing_rules: '', milestones: [] }, null, 1) + '\n',
  'gaps.json': JSON.stringify({
    generated: date,
    catalogue_commit: sha,
    seeded: sha,
    method: `Seeded empty at ${s7} with plan-init.mjs: no gap analysis was run, and the ${APP} was taken as matching the catalogue then. Plan updates grade only the items changed since.`,
    counts: Object.fromEntries(VERDICTS.map(v => [v, 0])),
    in_scope: 0,
    themes: [],
    epics: [],
    items: [],
    summary_md: '',
    dataModelDeltas: [],
    deltaSummary: '',
    reverseFindings: [],
    reverseSummary: '',
    excluded: [],
  }, null, 1) + '\n',
  'units.json': '[]',
  'status.json': JSON.stringify({ done: [], in_progress: [], next: { phases: [], note: 'No phase planned.' }, guidance: {} }, null, 2) + '\n',
  'analysis/domain-model-delta.md': [
    '# Data-model delta',
    '',
    `Seeded empty at catalogue commit \`${s7}\` (${date}): the ${APP}'s model was taken as matching the domain model then, so there are no open deltas. A plan update that finds one numbers it from DM-01 upward and keeps that id from then on.`,
    '',
  ].join('\n'),
  'GAP-ANALYSIS.md': [
    `# ${config.title} · Gap analysis`,
    '',
    `Seeded empty at catalogue commit \`${s7}\` (${date}) with no gap analysis: the ${APP} was taken as matching the catalogue then. Each plan update grades the items changed since and rewrites this page.`,
    '',
  ].join('\n'),
}
const ownerFiles = {
  'ROADMAP.md': [
    `# ${config.title} · Roadmap`,
    '',
    `Seeded empty at catalogue commit \`${s7}\` (${date}): no phases yet. Phases are added only from requirements changes, numbered from ${FIRST}.`,
    '',
    '## Owner decisions',
    '',
    '| ID | Decision | Gates | Source |',
    '|---|---|---|---|',
    '',
    '## Phases',
    '',
    '| Phase | Title | Track | Depends on | Sessions | Delivers |',
    '|---|---|---|---|---|---|',
    '',
    '## Open questions',
    '',
    'None.',
    '',
    '## Sequencing rules',
    '',
    'None yet.',
    '',
    '## Milestones',
    '',
    'None yet.',
    '',
    '## Parked',
    '',
    'None.',
    '',
    '## Standing rules',
    '',
    'The rules every phase follows (how a phase runs, testing, design, screenshots). Add them before the first phase is planned.',
    '',
  ].join('\n'),
  'README.md': [
    `# ${config.title}`,
    '',
    `The build plan that keeps ${config.subject} in step with the requirements catalogue. It was seeded empty at catalogue commit \`${s7}\`, with no gap analysis: the ${APP} was taken as matching the catalogue then. Each requirements change, once committed, is brought in with the update-build-plan skill, which grades the changed items and adds phases for them, numbered from ${FIRST}.`,
    '',
    'Start at [index.html](index.html) (the plan page) or [ROADMAP.md](ROADMAP.md).',
    '',
    '## Update history',
    '',
    `- ${date} · seeded empty at \`${s7}\` (plan-init.mjs); no gap analysis, no phases.`,
    '',
  ].join('\n'),
}

const kept = []
fs.mkdirSync(path.join(CU, 'analysis'), { recursive: true })
for (const [f, text] of Object.entries(files)) { fs.writeFileSync(path.join(CU, f), text); written.push(rel(f)) }
for (const [f, text] of Object.entries(ownerFiles)) {
  if (fs.existsSync(path.join(CU, f))) { kept.push(rel(f)); continue }
  fs.writeFileSync(path.join(CU, f), text)
  written.push(rel(f))
}

const notes = []
for (const d of ['phases', 'epics']) if (fs.existsSync(path.join(CU, d)) && fs.readdirSync(path.join(CU, d)).length) notes.push(`${rel(d)}/ is not empty and was left as it is: an earlier plan's files no longer in plan.json.`)
if (config.progress && !fs.existsSync(path.join(ROOT, config.progress))) notes.push(`The progress file ${config.progress} (config "progress") does not exist yet: until it does, phases are read as unbuilt.`)

let index = null
if (!argv.includes('--no-index')) {
  const run = spawnSync(process.execPath, [path.join(TOOLS, 'build-index.mjs'), '--plan', config.plan], { cwd: ROOT, encoding: 'utf8' })
  if (run.status !== 0) { process.stderr.write(run.stderr); process.exit(1) }
  index = run.stdout.trim().split('\n').pop()
  written.push(rel('index.html'))
  const warnings = run.stderr.split('\n').filter(l => /^\s+- /.test(l)).map(l => l.trim().slice(2))
  if (warnings.length) notes.push(...warnings.map(w => `index: ${w}`))
}

console.log(JSON.stringify({ plan: config.plan, commit: sha, firstPhase: FIRST, written, kept, ...(notes.length ? { notes } : {}), ...(index ? { index } : {}) }, null, 1))
