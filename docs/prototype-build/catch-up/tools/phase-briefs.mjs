// Per-phase briefs for the detail stage of a plan update (update-build-plan skill, Stage 2).
// Usage (repo root):
//   node docs/prototype-build/catch-up/tools/phase-briefs.mjs <outline journal.jsonl> <to-sha> --out <dir> [--built 14,15]
//   --built   phases already built (skipped; a partly built phase is NOT listed: it gets a brief, and the
//             detail workflow's partlyBuilt note keeps its built part frozen)
// Reads the outline run's result (workflow-plan-outline.js: phases, affected phases with tiers) and the
// current plan.json (the old covers), then writes into <dir>:
//   plan.next.json     the outline as a plan file, for recipe-status.mjs --plan
//   outline.md         every phase in one line each, with the sequencing rules (the writers' neighbour view)
//   <num>.md           one brief per phase to write: what changed for it and nothing else
//   detail-args.json   the `phases` argument for workflow-plan-detail.js
// A brief holds the phase's outline entry, the covers that joined or left, the substantive catalogue
// diff of each covered item that changed, its gap entries, the decision rows that gate it, the change
// log rows and changed questions that name its items, and its catalogue screenshot rows. Writers read
// the brief and their own doc instead of ROADMAP.md, gaps.json and the change logs whole: that context
// is most of what a plan update costs.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { requirementChanges, changedInSubstance } from './req-changes.mjs'

const argv = process.argv.slice(2)
const [journalPath, sha] = argv.filter((a, i) => !a.startsWith('--') && !['--out', '--built'].includes(argv[i - 1]))
const out = argv.includes('--out') ? path.resolve(argv[argv.indexOf('--out') + 1]) : null
if (!journalPath || !sha || !out) { console.error('usage: phase-briefs.mjs <outline journal.jsonl> <to-sha> --out <dir>'); process.exit(2) }
const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const rel = p => path.relative(ROOT, p)
fs.mkdirSync(out, { recursive: true })

// The outline: the last architect or coverage-fix result in the run.
const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const labelOf = new Map(lines.filter(l => l.type === 'started').map(l => [l.agentId, l.label]))
const outline = lines.filter(l => l.type === 'result' && /^(architect:update|architect:revise|coverage-fix-\d+)$/.test(labelOf.get(l.agentId))).pop()?.result
if (!outline?.phases) { console.error('no outline result in the journal'); process.exit(1) }

const plan = JSON.parse(fs.readFileSync(path.join(CU, 'plan.json'), 'utf8'))
const from = plan.commit
const oldByNum = new Map(plan.phases.map(p => [p.num, p]))
const fileOf = p => oldByNum.get(p.num)?.file || `phases/phase-${p.num}-${p.slug}.md`
fs.writeFileSync(path.join(out, 'plan.next.json'), JSON.stringify({ commit: from, phases: outline.phases.map(p => ({ ...p, file: fileOf(p) })) }, null, 1))
// The neighbours in brief, so a writer can check scope and order without reading ROADMAP.md.
fs.writeFileSync(path.join(out, 'outline.md'), [
  '# Outline after this update', '', `Sequencing rules: ${outline.sequencing_rules}`, '',
  ...outline.phases.map(p => `- **${p.num} ${p.title}** (after ${p.depends_on.join(', ') || 'none'}; ${p.est_sessions} session(s)): ${p.delivers}`),
].join('\n'))

const gaps = JSON.parse(fs.readFileSync(path.join(CU, 'gaps.json'), 'utf8'))
const gapOf = new Map([...gaps.items, ...gaps.dataModelDeltas, ...gaps.reverseFindings].map(x => [x.id, x]))
const changes = requirementChanges({ cwd: ROOT, from, to: sha })
const changedItem = new Map(changes.items.filter(e => changedInSubstance({ cwd: ROOT, from, to: sha, entry: e })).map(e => [e.id, e]))
const changedQuestions = changes.questions.filter(e => changedInSubstance({ cwd: ROOT, from, to: sha, entry: e }))
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const show = (file) => { try { return git('show', `${sha}:${file}`) } catch { return '' } }
const logs = changes.changeLogsAdded.map(f => ({ f, lines: show(f).split('\n') }))
const roadmap = fs.readFileSync(path.join(CU, 'ROADMAP.md'), 'utf8')
const decisionRows = roadmap.split('\n').filter(l => /^\| D\d+ \|/.test(l))

// "28 to 32", "15b, 28 to 32", "all": does a decision's Gates cell name this phase?
const gates = (cell, num) => cell.split(',').map(s => s.trim()).some(t => {
  if (t === num || t === 'all') return true
  const r = t.match(/^(\d+)[a-z]?\s+to\s+(\d+)[a-z]?$/)
  return r ? parseInt(num, 10) >= +r[1] && parseInt(num, 10) <= +r[2] : false
})
const fmGet = (text, k) => (text.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '')

// Tiers come from the outline's `affected` list. A phase whose covers changed is never "baseline".
const tierOf = new Map(outline.affected.map(a => [a.num, a]))
const builtNums = new Set(argv.includes('--built') ? argv[argv.indexOf('--built') + 1].split(',') : [])
const work = []
for (const p of outline.phases) {
  if (builtNums.has(p.num)) continue
  const old = oldByNum.get(p.num)
  const a = tierOf.get(p.num)
  const coversChanged = !old || old.covers.length !== p.covers.length || p.covers.some(c => !old.covers.includes(c))
  let tier = a?.tier || (coversChanged ? 'light' : 'baseline')
  if (tier === 'baseline' && coversChanged) tier = 'light'
  if (!old) tier = 'substantive'
  if (tier === 'baseline') continue
  work.push({ p, old, a, tier })
}

const sections = []
const args = []
for (const { p, old, a, tier } of work) {
  const covers = p.covers
  const joined = old ? covers.filter(c => !old.covers.includes(c)) : covers
  const left = old ? old.covers.filter(c => !covers.includes(c)) : []
  const catIds = [...new Set([...covers, ...left])].filter(id => /^(EP|FT|US)-/.test(id))
  const s = []
  s.push(`# Brief · Phase ${p.num} · ${p.title}`, '')
  s.push(`Tier: **${tier}**${a?.hard ? ' (hard)' : ''}. Why: ${(a?.reason || (old ? 'its covered items changed' : 'new phase')).replace(/\.+$/, '')}.`)
  s.push(`Catalogue ${from.slice(0, 7)} to ${sha.slice(0, 7)}. Doc: ${rel(path.join(CU, fileOf(p)))} and its .prompt.md.`, '')
  s.push('## Outline entry', '', '```json', JSON.stringify(p, null, 1), '```', '')
  s.push('## Covers', '', `Joined: ${joined.join(', ') || 'none'}. Left: ${left.join(', ') || 'none'}${left.length ? ' (remove their work; say where it went)' : ''}.`, '')

  s.push('## Catalogue changes in substance (diff from the plan baseline)', '')
  const diffed = catIds.filter(id => changedItem.has(id))
  if (!diffed.length) s.push('None of the covered items changed in substance.', '')
  for (const id of diffed) {
    const e = changedItem.get(id)
    const d = e.change === 'A' ? `(new) ${e.file}\n${show(e.file)}` : git('diff', '-M', '-U1', from, sha, '--', ...[e.file, e.was].filter(Boolean))
    s.push(`### ${id} (${e.change}, now ${fmGet(show(e.file), 'status') || 'deleted'})`, '', '```diff', d.trim(), '```', '')
  }
  const unchanged = catIds.filter(id => !changedItem.has(id))
  if (unchanged.length) s.push(`Covered, unchanged in substance: ${unchanged.join(', ')}.`, '')

  s.push('## Gap entries (gaps.json, current)', '')
  for (const id of covers) {
    const g = gapOf.get(id)
    if (!g) { s.push(`- ${id}: no entry (Matches or closed).`); continue }
    const pick = g.verdict
      ? { verdict: g.verdict, summary: g.summary, missing_or_wrong: g.missing_or_wrong, evidence: (g.evidence || []).slice(0, 6), demo_trigger: g.demo_trigger, surfaces: g.surfaces, size: g.size }
      : g.catalogue_says ? { title: g.title, catalogue_says: g.catalogue_says, prototype_has: g.prototype_has, impact: g.impact, size: g.size, prototype_refs: (g.prototype_refs || []).slice(0, 6) }
        : { title: g.title, explanation: g.explanation, recommended_action: g.recommended_action, size: g.size, prototype_evidence: (g.prototype_evidence || []).slice(0, 6) }
    s.push(`- ${id}: ${JSON.stringify(pick)}`)
  }
  s.push('')

  const rows = decisionRows.filter(r => gates(r.split('|')[3] || '', p.num))
  s.push('## Owner decisions that gate this phase (ROADMAP.md, as the architect left it)', '', ...(rows.length ? rows : ['None.']), '')

  const qs = changedQuestions.filter(q => { const t = show(q.file); const m = t.match(/^affects:\n((?:\s+-.*\n?)+)/m); return m && catIds.some(id => m[1].includes(id)) })
  s.push('## Changed questions that affect its items', '')
  if (!qs.length) s.push('None.')
  for (const q of qs) {
    const t = show(q.file)
    const rec = (t.match(/^\**Recommendation\**:?.*$/im) || [''])[0]
    s.push(`- ${q.id} (${fmGet(t, 'status')}): ${fmGet(t, 'title')}. ${rec.slice(0, 400)} File: ${q.file}`)
  }
  s.push('')

  s.push('## Change log rows naming its items', '')
  let n = 0
  for (const { f, lines: ls } of logs) for (const l of ls) if (l.startsWith('|') && catIds.some(id => l.includes(`[${id}]`) || l.includes(` ${id} `))) { s.push(`- (${path.basename(f)}) ${l.slice(0, 900)}`); n++ }
  if (!n) s.push('None.')
  s.push('')

  let shots = ''
  try { shots = execFileSync('node', [path.join(CU, 'tools/recipe-status.mjs'), p.num, '--plan', path.join(out, 'plan.next.json')], { cwd: ROOT, encoding: 'utf8' }) } catch (e) { shots = String(e.stdout || e.message) }
  s.push('## Catalogue screenshot rows (recipe-status.mjs, against the new covers)', '', '```', shots.trim(), '```', '')

  const file = path.join(out, `${p.num}.md`)
  fs.writeFileSync(file, s.join('\n'))
  const docPath = fileOf(p)
  args.push({ num: p.num, title: p.title, tier, hard: !!a?.hard, isNew: !old, reason: a?.reason || (old ? 'its covered items changed' : 'new phase'), file: docPath, prompt: docPath.replace(/\.md$/, '.prompt.md'), brief: file })
  sections.push(`${p.num.padEnd(4)} ${tier.padEnd(12)} ${Math.round(fs.statSync(file).size / 4 / 1000)}k tokens`)
}
fs.writeFileSync(path.join(out, 'detail-args.json'), JSON.stringify(args, null, 1))
const count = t => args.filter(x => x.tier === t).length
console.log(`${args.length} briefs in ${out}: ${count('substantive')} substantive (${args.filter(x => x.hard).length} hard), ${count('light')} light; ${outline.phases.length - args.length - builtNums.size} baseline-only phases get no agent.`)
console.log(sections.join('\n'))
