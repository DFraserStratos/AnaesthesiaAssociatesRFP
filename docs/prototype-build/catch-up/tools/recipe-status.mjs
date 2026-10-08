// The capture recipes behind each phase's catalogue screenshots.
// Usage (repo root): node docs/prototype-build/catch-up/tools/recipe-status.mjs [<phase> ...] [--check]
//   <phase>   list the items a phase covers with their recipe status and shots (default: every phase)
//   --plan <file>  read phases from this plan file instead of plan.json (phase-briefs.mjs passes the
//             outline of an update in progress, before plan.json is rebuilt)
//   --check   exit 1 unless every unbuilt phase doc has a "## Catalogue screenshots" section that names
//             each story it covers (and each feature it covers that has no stories), and its kick-off
//             prompt runs the capture step
// Stories are listed under a covered epic or feature. Retired and Future items are skipped. A story
// with no recipe is marked "none": the phase must create it (see ROADMAP.md, "Catalogue screenshots").
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const REQ = path.join(ROOT, 'requirements-board/requirements/stories')
const RECIPES = path.join(ROOT, 'requirements-board/capture/recipes')
const SECTION = '## Catalogue screenshots'
const argv = process.argv.slice(2)
const check = argv.includes('--check')
const planFile = argv.includes('--plan') ? path.resolve(argv[argv.indexOf('--plan') + 1]) : path.join(CU, 'plan.json')
const wanted = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--plan')

const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'))
const progress = fs.readFileSync(path.join(ROOT, 'docs/prototype-build/PROGRESS.md'), 'utf8')

const status = {}
for (const f of fs.readdirSync(REQ)) {
  const m = fs.readFileSync(path.join(REQ, f), 'utf8').match(/^status:\s*(.*)$/m)
  status[f.replace(/\.md$/, '')] = m ? m[1].trim() : ''
}
const live = id => id in status && !/^(Retired|Future)$/i.test(status[id])
const ids = Object.keys(status)
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

// Same rule as plan-state.mjs: a catch-up phase is built once PROGRESS.md has its "### Phase NN" entry.
const builtSet = new Set([...progress.matchAll(/^###\s+(?:Catch-up\s+)?Phase\s+(\d{2}[a-z]?)\b/gim)].map(m => m[1]).filter(n => parseInt(n, 10) >= 14))
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
