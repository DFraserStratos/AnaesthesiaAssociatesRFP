// Assembles gaps.json and GAP-ANALYSIS.md from a gap-analysis workflow journal.
// Usage (repo root): node docs/prototype-build/catch-up/tools/assemble-gaps.mjs <journal.jsonl> <commit> <date> [--merge]
// --merge: for a partial re-run, items (and the delta, reverse check and themes) the journal does not
// cover keep their entry from the existing gaps.json.
import fs from 'node:fs'
import path from 'node:path'

const [journalPath, commit, date] = process.argv.slice(2)
const MERGE = process.argv.includes('--merge')
const ROOT = process.cwd()
const CU = path.join(ROOT, 'docs/prototype-build/catch-up')
const CAT = path.join(ROOT, 'requirements-board/requirements')
const CAT_LINK = '../../../requirements-board/requirements'
const CAT_LINK_EPIC = '../../../../requirements-board/requirements'

// ---- journal -> results by label (last result wins) ----
const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const labelOf = new Map(lines.filter(l => l.type === 'started').map(l => [l.agentId, l.label]))
const byLabel = new Map()
for (const l of lines) if (l.type === 'result' && labelOf.has(l.agentId)) byLabel.set(labelOf.get(l.agentId), l.result)
const get = label => byLabel.get(label) ?? null
const prev = MERGE ? JSON.parse(fs.readFileSync(path.join(CU, 'gaps.json'), 'utf8')) : null
const prevItem = new Map((prev?.items || []).map(i => [i.id, i]))
const prevEpic = new Map((prev?.epics || []).map(e => [e.id, e]))

// ---- catalogue metadata ----
const readFm = file => {
  const fm = fs.readFileSync(file, 'utf8').split('---')[1]
  const g = k => { const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null }
  return { fm, g }
}
const items = {}
for (const f of fs.readdirSync(path.join(CAT, 'stories')).filter(f => f.endsWith('.md'))) {
  const { g } = readFm(path.join(CAT, 'stories', f))
  items[g('id')] = { id: g('id'), type: g('type'), parent: g('parent'), title: g('title'), status: g('status'), swimlane: g('swimlane') }
}
const oqs = {}
for (const f of fs.readdirSync(path.join(CAT, 'questions')).filter(f => f.endsWith('.md'))) {
  const { fm, g } = readFm(path.join(CAT, 'questions', f))
  const affects = [...fm.matchAll(/^\s+-\s*(\S+)\s*$/gm)].map(m => m[1]).filter(a => items[a])
  oqs[g('id')] = { id: g('id'), title: g('title'), status: g('status'), affects }
}
const epicOf = id => { let x = items[id]; while (x && x.parent) x = items[x.parent]; return x ? x.id : null }
const openOqs = id => Object.values(oqs).filter(o => o.status !== 'Answered' && o.affects.includes(id)).map(o => o.id)
const excluded = it => ['Retired', 'Future'].includes(it.status) || it.swimlane === 'Future Work' || ['Retired', 'Future'].includes(items[epicOf(it.id)].status)

const epicIds = Object.values(items).filter(i => i.type === 'epic').map(i => i.id).sort()
const inScope = e => Object.values(items).filter(i => epicOf(i.id) === e && !excluded(i)).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

// ---- merge verified items (fallback to reviewer output) ----
const epics = []
const problems = []
for (const e of epicIds) {
  const v = get(`verify:${e}`)
  const r = get(`review:${e}`)
  const fill = get(`review:${e}:fill`)
  const reviewed = new Map([...(r?.items || []), ...(fill?.items || [])].map(x => [x.id, x]))
  const verified = new Map((v?.items || []).map(x => [x.id, x]))
  const list = inScope(e).map(meta => {
    let x = verified.get(meta.id)
    if (!x && reviewed.has(meta.id)) { x = { ...reviewed.get(meta.id), verify_outcome: 'unverified', original_verdict: reviewed.get(meta.id).verdict, verify_note: 'Verifier did not return this item.' }; problems.push(`${meta.id} unverified`) }
    if (!x && prevItem.has(meta.id)) x = prevItem.get(meta.id)
    if (!x) { problems.push(`${meta.id} not graded`); return null }
    return { ...x, epic: e, title: meta.title, type: meta.type, status: meta.status, open_questions: openOqs(meta.id), file: `stories/${meta.id}.md` }
  }).filter(Boolean)
  epics.push({ id: e, title: items[e].title, status: items[e].status, observations: v?.epic_observations || r?.epic_observations || prevEpic.get(e)?.observations || '', items: list })
}
const delta = get('verify:domain-model') || get('delta:domain-model') || (prev && { deltas: prev.dataModelDeltas, summary: prev.deltaSummary })
const reverse = get('verify:reverse') || get('reverse-check') || (prev && { findings: prev.reverseFindings, summary: prev.reverseSummary })
const themes = get('themes') || (prev && { themes: prev.themes, summary_md: prev.summary_md })

const VERDICTS = ['Contradicts', 'Partial', 'Missing', 'OutOfScope', 'Matches', 'Grouping']
const GAP = new Set(['Contradicts', 'Partial', 'Missing'])
const allItems = epics.flatMap(e => e.items)
const count = list => Object.fromEntries(VERDICTS.map(v => [v, list.filter(i => i.verdict === v).length]))
const counts = count(allItems)
const excludedList = Object.values(items).filter(excluded).map(i => ({ id: i.id, title: i.title, status: i.status, swimlane: i.swimlane || undefined }))

const gaps = {
  generated: date, catalogue_commit: commit,
  method: 'Per-epic Sonnet reviewers against six prototype maps, each review re-checked by an adversarial Sonnet verifier; plus a verified data-model delta and a verified reverse check.',
  counts, in_scope: allItems.length,
  themes: themes?.themes || [],
  epics: epics.map(e => ({ id: e.id, title: e.title, status: e.status, observations: e.observations, counts: count(e.items) })),
  items: allItems,
  summary_md: themes?.summary_md || '',
  dataModelDeltas: delta?.deltas || [],
  deltaSummary: delta?.summary || '',
  reverseFindings: reverse?.findings || [],
  reverseSummary: reverse?.summary || '',
  excluded: excludedList,
}
fs.writeFileSync(path.join(CU, 'gaps.json'), JSON.stringify(gaps, null, 1) + '\n')

// ---- markdown ----
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ')
let CL = CAT_LINK
const link = id => `[${id}](${CL}/stories/${id}.md)`
const oqLink = id => `[${id}](${CL}/questions/${id}.md)`
const board = id => `[board](http://localhost:5180/#/board?item=${id})`
const anchor = id => id.toLowerCase()
const sizeOrder = { XL: 0, L: 1, M: 2, S: 3, None: 4 }
const vOrder = Object.fromEntries(VERDICTS.map((v, i) => [v, i]))

const md = []
md.push('# Requirements catch-up · Gap analysis', '')
md.push(`Catalogue snapshot \`${commit.slice(0, 7)}\` · generated ${date} · ${allItems.length} in-scope items (${excludedList.length} Retired or Future excluded)`, '')
md.push(`**Method.** ${gaps.method} Supporting analysis: [prototype maps](analysis/), [data-model delta](analysis/domain-model-delta.md), [reverse check](analysis/reverse-check.md). Machine-readable data: [gaps.json](gaps.json). The development plan built from this is in [ROADMAP.md](ROADMAP.md) and [index.html](index.html).`, '')
md.push('**Verdicts.** Matches: the prototype demonstrates the requirement as now written. Partial: present but missing rules or acceptance criteria. Contradicts: implemented, but some behaviour now differs from the requirement. Missing: nothing represents it. OutOfScope: cannot be shown in a front-end demo, even with a demo button. Grouping: an epic or feature with no rules of its own. Sizes are for a Claude Code session: S under an hour, M a few hours, L about a session, XL more.', '')

md.push('## At a glance', '')
md.push(`| Epic | ${VERDICTS.join(' | ')} | Items |`, `|---|${VERDICTS.map(() => '---:').join('|')}|---:|`)
for (const e of epics) { const c = count(e.items); md.push(`| [${e.id} · ${esc(e.title)}](#${anchor(e.id)}) | ${VERDICTS.map(v => c[v] || '').join(' | ')} | ${e.items.length} |`) }
md.push(`| **Total** | ${VERDICTS.map(v => `**${counts[v]}**`).join(' | ')} | **${allItems.length}** |`, '')
const corrected = allItems.filter(i => i.verify_outcome === 'corrected')
md.push(`Verification: ${corrected.length} of ${allItems.length} gradings were corrected by the adversarial verifier (see [Verification log](#verification-log))${problems.length ? `; ${problems.length} items could not be verified: ${problems.join(', ')}` : ''}.`, '')

if (themes?.summary_md) md.push('## Summary', '', themes.summary_md.trim(), '')

md.push('## Not represented in the prototype', '', 'Every in-scope requirement graded Missing, by epic.', '')
for (const e of epics) {
  const miss = e.items.filter(i => i.verdict === 'Missing')
  if (!miss.length) continue
  md.push(`**${e.id} · ${esc(e.title)}**`, '')
  for (const i of miss) md.push(`- ${link(i.id)} ${esc(i.title)} · ${i.status} · ${i.size}${i.open_questions.length ? ` · open: ${i.open_questions.map(oqLink).join(', ')}` : ''}. ${esc(i.summary)}`)
  md.push('')
}

md.push('## Structural changes (data model)', '')
if (delta?.summary) md.push(delta.summary.trim(), '')
if (gaps.dataModelDeltas.length) {
  md.push('| ID | Kind | Change | Size | Catalogue |', '|---|---|---|---|---|')
  for (const d of gaps.dataModelDeltas) md.push(`| ${d.id} | ${d.kind} | ${esc(d.title)} | ${d.size} | ${(d.catalogue_refs || []).filter(r => items[r]).map(link).join(', ') || esc((d.catalogue_refs || []).join(', '))} |`)
  md.push('', 'Detail and impact: [analysis/domain-model-delta.md](analysis/domain-model-delta.md).', '')
}

md.push('## Prototype behaviour to remove or rework', '')
if (reverse?.summary) md.push(reverse.summary.trim(), '')
if (gaps.reverseFindings.length) {
  md.push('| ID | Kind | Finding | Action | Size | Catalogue |', '|---|---|---|---|---|---|')
  for (const f of gaps.reverseFindings) md.push(`| ${f.id} | ${f.kind} | **${esc(f.title)}**: ${esc(f.explanation)} | ${f.recommended_action} | ${f.size} | ${(f.catalogue_refs || []).filter(r => items[r]).map(link).join(', ') || esc((f.catalogue_refs || []).join(', '))} |`)
  md.push('', 'Evidence: [analysis/reverse-check.md](analysis/reverse-check.md).', '')
}

md.push('## By epic', '')
for (const e of epics) {
  const c = count(e.items)
  md.push(`<a id="${anchor(e.id)}"></a>`, '', `### ${e.id} · ${e.title}`, '')
  md.push(`${link(e.id)} · epic status ${e.status} · ${VERDICTS.filter(v => c[v]).map(v => `${c[v]} ${v}`).join(', ')}`, '')
  if (e.observations) md.push(`> ${esc(e.observations)}`, '')
  const gapsHere = e.items.filter(i => i.verdict !== 'Matches' && i.verdict !== 'Grouping')
    .sort((a, b) => vOrder[a.verdict] - vOrder[b.verdict] || sizeOrder[a.size] - sizeOrder[b.size] || a.id.localeCompare(b.id, undefined, { numeric: true }))
  if (gapsHere.length) {
    md.push('| Item | Status | Verdict | Gap | Size |', '|---|---|---|---|---|')
    for (const i of gapsHere) md.push(`| ${link(i.id)} [${esc(i.title)}](epics/${e.id}.md#${anchor(i.id)}) | ${i.status}${i.open_questions.length ? `, ${i.open_questions.map(oqLink).join(', ')}` : ''} | ${i.verdict} | ${esc(i.summary)} | ${i.size} |`)
    md.push('', `Details for every gap: [epics/${e.id}.md](epics/${e.id}.md).`, '')
    const emd = []; CL = CAT_LINK_EPIC
    emd.push(`# ${e.id} · ${e.title} · gap details`, '', `Part of the [gap analysis](../GAP-ANALYSIS.md#${anchor(e.id)}) · catalogue \`${commit.slice(0, 7)}\` · ${link(e.id)}`, '')
    if (e.observations) emd.push(`> ${esc(e.observations)}`, '')
    for (const i of gapsHere) {
      const md = emd
      md.push(`<a id="${anchor(i.id)}"></a>`, '', `## ${i.id} · ${esc(i.title)} · ${i.verdict}`, '')
      md.push(`${link(i.id)} · ${board(i.id)} · status ${i.status} · surfaces: ${(i.surfaces || []).join(', ') || 'none'} · confidence ${i.confidence}`, '')
      md.push(`- **Requirement:** ${esc(i.requirement_says)}`, `- **Prototype today:** ${esc(i.prototype_does)}`)
      if (i.missing_or_wrong?.length) { md.push('- **Missing or wrong:**'); for (const m of i.missing_or_wrong) md.push(`  - ${esc(m)}`) }
      if (i.demo_trigger) md.push(`- **Demo trigger:** ${esc(i.demo_trigger)}`)
      if (i.evidence?.length) md.push(`- **Evidence:** ${i.evidence.map(x => `\`${esc(x)}\``).join(', ')}`)
      if (i.verify_outcome === 'corrected') md.push(`- **Verifier:** corrected from ${i.original_verdict}. ${esc(i.verify_note)}`)
      md.push('')
    }
    fs.mkdirSync(path.join(CU, 'epics'), { recursive: true })
    fs.writeFileSync(path.join(CU, 'epics', `${e.id}.md`), emd.join('\n'))
    CL = CAT_LINK
  }
  const ok = e.items.filter(i => i.verdict === 'Matches')
  if (ok.length) md.push(`**Matches (${ok.length}):** ${ok.map(i => `${link(i.id)} ${esc(i.title)}`).join(' · ')}`, '')
  const grp = e.items.filter(i => i.verdict === 'Grouping')
  if (grp.length) md.push(`**Grouping only (${grp.length}):** ${grp.map(i => link(i.id)).join(', ')}`, '')
}

md.push('## Excluded from this analysis', '', 'Retired and Future items (and stories in the Future Work lane) were not graded. The reverse check above covers retired behaviour the prototype still has.', '')
md.push(excludedList.map(i => `${link(i.id)} ${esc(i.title)} (${i.status}${i.swimlane ? `, ${i.swimlane}` : ''})`).join(' · '), '')

md.push('<a id="verification-log"></a>', '', '## Verification log', '')
md.push(`Each epic's gradings were re-checked from scratch by a separate verifier told to refute them. ${corrected.length} corrections:`, '')
md.push('| Item | From | To | Why |', '|---|---|---|---|')
for (const i of corrected) md.push(`| ${link(i.id)} | ${i.original_verdict} | ${i.verdict} | ${esc(i.verify_note)} |`)
md.push('')

fs.writeFileSync(path.join(CU, 'GAP-ANALYSIS.md'), md.join('\n'))

// ---- planning units: every gap + every delta + every reverse finding not kept as-is ----
const units = [
  ...allItems.filter(i => GAP.has(i.verdict)).map(i => i.id),
  ...gaps.dataModelDeltas.map(d => d.id),
  ...gaps.reverseFindings.filter(f => f.recommended_action !== 'Keep as demo scaffold').map(f => f.id),
]
fs.writeFileSync(path.join(CU, 'tools/units.json'), JSON.stringify(units))
console.log(JSON.stringify({ counts, inScope: allItems.length, corrected: corrected.length, problems, deltas: gaps.dataModelDeltas.length, reverse: gaps.reverseFindings.length, units: units.length, themes: (themes?.themes || []).map(t => t.title) }, null, 1))
