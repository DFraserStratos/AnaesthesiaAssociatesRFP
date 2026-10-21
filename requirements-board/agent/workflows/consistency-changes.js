export const meta = {
  name: 'consistency-changes',
  description: 'Stage 2 of the consistency review: Haiku per epic/feature pack flags drift against the rulings list, Sonnet per epic verifies and drafts exact edits, Sonnet checks diagrams and the domain model, Opus consolidates per topic group. Read-only: proposes edits, applies nothing.',
  whenToUse:
    'Run by the consistency-review skill once the user has reviewed rulings.md and its conflicts are decided. Pass run (the run folder holding rulings.md, packs/ and artifact-packs/), units, diagrams and topics (from <run>/index.json), plus the "This repo" arguments (owner, houseRules, protectedArtifacts, groups). Then build the review page from the run journal with build-review.mjs.',
  phases: [
    { title: 'Find', detail: 'Haiku per epic/feature pack', model: 'haiku' },
    { title: 'Verify', detail: 'Sonnet per epic, diagrams, domain model', model: 'sonnet' },
    { title: 'Consolidate', detail: 'Opus per topic group', model: 'opus' },
  ],
}

/*
 * args:
 *   run          required: the run folder (absolute): rulings.md, packs/<id>.md, artifact-packs/<id>.md
 *   units        required: index.json "units" ({id, epic, title})
 *   topics       required: index.json "topics" (the rulings' topic headings)
 *   diagrams     index.json "diagrams" ({id, title, svg}); [] to skip the diagram pass
 *   repo         repo root, absolute (default: paths relative to the agents' working directory, the repo root)
 *   req          catalogue folder relative to the repo (default requirements-board/requirements)
 *   owner        who decides, e.g. "Sam" (default "the product owner")
 *   houseRules   strings: project rules every finder, verifier and consolidator obeys (e.g. what a fixed
 *                ruling forbids writing, a Technical discussion line it requires and finders must not flag)
 *   protectedArtifacts [{id, reason}]: diagrams nobody may edit (a client's own document); only flagged
 *   diagramNote  one extra line for the diagram reviewers (e.g. "a diagram dated before <date> predates ...")
 *   groups       [{name, topics: [...] | null}] consolidation groups; one with topics null takes every topic
 *                no other group lists. Default: the topics in groups of about eight, the last one catch-all.
 *   chunk        findings per verifier (default 30); diagramsPerAgent (default 5)
 */
const A = args || {}
const ROOT = A.repo ? A.repo.replace(/\/$/, '') + '/' : ''
const REQ_REL = (A.req || 'requirements-board/requirements').replace(/\/$/, '')
const REQ = ROOT + REQ_REL
const RUN = A.run
const OWNER = A.owner || 'the product owner'
const HOUSE = A.houseRules || []
const PROTECTED = A.protectedArtifacts || []
if (!RUN || !Array.isArray(A.units) || !Array.isArray(A.topics)) {
  log('Missing args: run, units and topics are required (units and topics come from <run>/index.json).')
  return { error: 'missing args' }
}
const RULINGS = `${RUN}/rulings.md`

const READ_RULINGS = `Read the current rulings list ${RULINGS} in full (read it in parts with offset/limit until you reach the end). It is the yardstick: Fixed rulings (F-), Rulings by topic (R-), "No longer true" (S-: stale understandings and retired terms), Terminology, and Conflicts decided by ${OWNER} (C-: each Recommendation, or the position ${OWNER} chose, is now the ruling). Within it, open questions are never rulings.`
const HOUSE_TEXT = HOUSE.length ? `\nProject rules (binding):\n${HOUSE.map((h) => `- ${h}`).join('\n')}` : ''

const KINDS = ['contradicts-ruling', 'stale-understanding', 'retired-term', 'open-stated-as-decided', 'contradicts-other-item', 'answer-not-reflected', 'internal-contradiction', 'status-wrong', 'other']

// ---------- Haiku: find
const FIND_SCHEMA = {
  type: 'object',
  properties: {
    reachedEnd: { type: 'boolean', description: 'true only if you read both files to their last line' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'ID of the core item whose text is wrong' },
          kind: { type: 'string', enum: KINDS },
          itemQuote: { type: 'string', description: 'Verbatim words from the item that are wrong (copy exactly)' },
          against: { type: 'string', description: 'R-/S-/F-/C- number, or the other item ID, that it conflicts with' },
          evidence: { type: 'string', description: 'Verbatim words from the ruling or other item' },
          suggestion: { type: 'string', description: 'What the text should say instead, briefly' },
        },
        required: ['item', 'kind', 'itemQuote', 'against', 'evidence', 'suggestion'],
      },
    },
  },
  required: ['reachedEnd', 'findings'],
}

const findPrompt = (u) => `You are checking part of a requirements catalogue for drift: text that no longer matches the latest decisions. Read-only: do not edit any file.

1. ${READ_RULINGS}
2. Read your reading pack ${u.pack} in full (read in parts of about 400 lines with offset/limit until the end; it can be long). It holds the core items for ${u.id} (${u.title}) in full, summaries of linked items, the questions that affect them, and the exact note points the items cite.

Check every CORE item (description, acceptance criteria, technical discussion, notes, title and status) and flag:
- contradicts-ruling: says something a ruling (R-, F-, C-) says is not so.
- stale-understanding / retired-term: contains an understanding or a term listed under "No longer true" or "Avoid (retired)". Do not flag a retired term where the text is explicitly explaining the history ("was called X until 7 October" is fine).
- open-stated-as-decided: states as settled something the rulings say is open or pending (every Conflict settled as pending, and every "open (OQ-nn)").
- contradicts-other-item: two items in the pack (or a core item and a linked item summary) say incompatible things.
- answer-not-reflected: an Answered question in the pack says X and the item says otherwise. Open questions are never a basis for a finding.
- internal-contradiction: the item's own description and acceptance criteria disagree.
- status-wrong: an agreed or confirmed item whose rule the rulings say is pending or open, or similar.
Do NOT flag: style, missing links, wording preferences, things merely not mentioned, or anything a Fixed ruling (F-) or the project rules below explicitly allow or require.
${HOUSE_TEXT}

Prefer recall: if in doubt, flag it; a stronger reviewer will filter. Quote exactly. Return an empty list if the items are consistent.`

// ---------- Sonnet: verify per epic chunk
const EDIT = {
  type: 'object',
  properties: {
    file: { type: 'string', description: `Path relative to the repo root, e.g. ${REQ_REL}/stories/US-06.1.1.md` },
    old: { type: 'string', description: 'Exact text copied from the file, occurring exactly once in it' },
    new: { type: 'string', description: 'Replacement text' },
  },
  required: ['file', 'old', 'new'],
}
const VERIFIED = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'string' } },
    topic: { type: 'string', enum: A.topics.concat(['Other']) },
    kind: { type: 'string', enum: KINDS },
    summary: { type: 'string', description: 'One plain sentence: what is wrong now' },
    change: { type: 'string', description: 'One plain sentence: what the edit does' },
    evidence: { type: 'array', items: { type: 'object', properties: { cite: { type: 'string' }, quote: { type: 'string' } }, required: ['cite', 'quote'] } },
    rulings: { type: 'array', items: { type: 'string' } },
    edits: { type: 'array', items: EDIT },
    size: { type: 'string', enum: ['small', 'medium', 'large'] },
    confidence: { type: 'string', enum: ['high', 'medium'] },
  },
  required: ['items', 'topic', 'kind', 'summary', 'change', 'evidence', 'rulings', 'edits', 'size', 'confidence'],
}
const QUESTION = {
  type: 'object',
  properties: { title: { type: 'string' }, body: { type: 'string' }, affects: { type: 'array', items: { type: 'string' } } },
  required: ['title', 'body', 'affects'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verified: { type: 'array', items: VERIFIED },
    dropped: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, reason: { type: 'string' } }, required: ['item', 'reason'] } },
    newQuestions: { type: 'array', items: QUESTION },
  },
  required: ['verified', 'dropped', 'newQuestions'],
}

const SIZES = `Size: large = what the system does changes (a rule's meaning), the same fix spans several items, a status moves off agreed or confirmed, or a diagram needs redrawing; medium = out-of-date or contradicting wording in one item that would change what someone builds; small = retired terms, names, titles, stale sources or phrasing that does not change meaning.`

const EDIT_RULES = `How to write edits (they will be shown to ${OWNER} for approval, then applied mechanically by exact string replacement):
- "old" must be copied exactly from the current file (Read it) and occur exactly once; keep it as short as uniqueness allows (a sentence or paragraph, not the whole file).
- Fix the meaning, not the style. Keep the catalogue's voice (${REQ}/VOICE.md), the ${REQ}/SCHEMA.md format and its sections. Do not rewrite text that is fine.
- Where a fix rests on a ruling, add that ruling's source to the item's sources in date order, in full catalogue form (the rulings header maps its cite shorthand to the full "Notes <date> · <words>" form). Quote a source only if it contains "#" or ": ".
- A rule that is now pending (a Conflict settled as pending, any open OQ) is described as pending with its OQ, and a settled or signed-off status on it moves to the Verify status (look up numbers in board.config.json; never infer from a number).
- Never edit retired items, notes/, changes/, reference/, or question answers. If a fix needs a decision the rulings do not make, put it in newQuestions instead of editing.${HOUSE_TEXT}`

const verifyPrompt = (label, findings) => `You verify drift findings that cheap reviewers raised about a requirements catalogue, and draft exact fixes for the real ones. Read-only: do not edit any file; return proposed edits only.

${READ_RULINGS}

Findings to verify (${label}):
${JSON.stringify(findings)}

For each finding: open the item file (${REQ}/stories/<ID>.md) and check the quote is really there and really conflicts with the ruling (open the cited note or question if the ruling's wording leaves doubt). Drop false positives, nitpicks, anything resting on an open question, and anything the rulings allow. Merge duplicates (the same fix raised twice, or one fix spanning several items) into one verified entry with all its edits. While you have a file open, you may add a finding you notice yourself in it, held to the same bar.

${EDIT_RULES}

${SIZES}

Give each verified entry the topic (from the rulings' topic headings) it mainly belongs to.`

// ---------- Sonnet: diagrams and domain model
const protectedText = PROTECTED.map((p) => `${p.id} is ${p.reason}: do not propose edits to it; only report as a finding (no edits, size large, change "flag to ${OWNER}") if requirements link to it for something it now contradicts.`).join('\n')
const diagramPrompt = (ds) => `You check diagrams in a requirements catalogue against the latest decisions. Read-only: do not edit any file; return proposed edits only.

${READ_RULINGS}

Diagrams to check (each pack holds the sidecar, the text drawn in the SVG in document order, and the items that link to it):
${ds.map((d) => `- ${d.id} · ${d.title}: pack ${RUN}/artifact-packs/${d.id}.md; SVG ${ROOT}${d.svg}; sidecar ${REQ}/artifacts/${d.id}.md`).join('\n')}

For each: read the pack; flag any drawn text or region note that contradicts a ruling, uses a retired term or a stale understanding, or omits something so central that the diagram now misleads (for example a state or flag the rulings added). Diagram dates matter: compare a diagram's date with the dates of the rulings it touches.${A.diagramNote ? ' ' + A.diagramNote : ''}
${protectedText}
Fixes:
- Sidecar text (region names and notes, description): normal edits.
- SVG text: an edit replacing the text inside one <text>/<tspan> only when the new text is about the same length (within about 20%); "old" must be exact from the SVG file and unique.
- Anything needing layout changes, new boxes or arrows, or longer text: no edits; size large, and "change" describes exactly what to redraw (it will be done with the svg-diagram skill).

${EDIT_RULES}`

const domainPrompt = `You check the catalogue's narrative domain model ${REQ}/domain-model.md (it is long; read it all in parts with offset/limit) against the latest decisions. Read-only: return proposed edits only.

${READ_RULINGS}

Flag every passage that contradicts a ruling, keeps a stale understanding or retired term (outside clearly historical "what changed" passages, which may describe the old state as old), states as decided something pending, or contradicts itself. Draft exact edits (file ${REQ_REL}/domain-model.md).

${EDIT_RULES}

${SIZES}`

// ---------- run Find + Verify
const units = A.units.map((u) => ({ ...u, pack: `${RUN}/packs/${u.id}.md` }))
const epics = [...new Set(units.map((u) => u.epic))]
const CHUNK = A.chunk || 30

phase('Find')
const epicResults = pipeline(
  epics,
  (ep) => parallel(units.filter((u) => u.epic === ep).map((u) => () =>
    agent(findPrompt(u), { label: `find:${u.id}`, phase: 'Find', schema: FIND_SCHEMA, model: 'haiku' })
      .then((r) => r && { unit: u.id, ...r }))),
  async (found, ep) => {
    const ok = found.filter(Boolean)
    const notEnd = ok.filter((r) => !r.reachedEnd).map((r) => r.unit)
    if (notEnd.length) log(`${ep}: did not reach end of files: ${notEnd.join(', ')}`)
    const missing = units.filter((u) => u.epic === ep && !ok.find((r) => r.unit === u.id)).map((u) => u.id)
    if (missing.length) log(`${ep}: finder failed for ${missing.join(', ')}`)
    const all = ok.flatMap((r) => r.findings.map((f) => ({ unit: r.unit, ...f })))
    if (!all.length) return []
    const chunks = []
    for (let i = 0; i < all.length; i += CHUNK) chunks.push(all.slice(i, i + CHUNK))
    const res = await parallel(chunks.map((c, i) => () => {
      const label = chunks.length > 1 ? `verify:${ep}.${i + 1}` : `verify:${ep}`
      return agent(verifyPrompt(label, c), { label, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'sonnet', effort: 'medium' })
        .then((r) => r && { label, raw: c.length, ...r })
    }))
    return res.filter(Boolean)
  },
)

const D = A.diagrams || []
const PER = A.diagramsPerAgent || 5
const diagramChunks = []
for (let i = 0; i < D.length; i += PER) diagramChunks.push(D.slice(i, i + PER))
const side = (label, prompt) => () => agent(prompt, { label, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'sonnet', effort: 'medium' }).then((r) => r && { label, raw: 0, ...r })
const sideResults = parallel([
  ...diagramChunks.map((ds, i) => side(`verify:diagrams.${i + 1}`, diagramPrompt(ds))),
  side('verify:domain-model', domainPrompt),
])

const verifyRuns = [...(await epicResults).flat(), ...(await sideResults)].filter(Boolean)
const keyed = verifyRuns.flatMap((v) => v.verified.map((f, i) => ({ key: `${v.label.replace('verify:', '')}/${i + 1}`, ...f })))
const questions = verifyRuns.flatMap((v) => v.newQuestions)
const raw = verifyRuns.reduce((n, v) => n + v.raw, 0)
log(`Find: ${raw} raw findings; Verify kept ${keyed.length}, dropped ${verifyRuns.reduce((n, v) => n + v.dropped.length, 0)}; ${questions.length} new questions`)

// ---------- Opus: consolidate per topic group
let GROUPS = A.groups
if (!GROUPS) {
  const per = 8
  GROUPS = []
  for (let i = 0; i < A.topics.length; i += per) { const t = A.topics.slice(i, i + per); GROUPS.push({ name: t.length > 1 ? `${t[0]} to ${t[t.length - 1]}` : t[0], topics: t }) }
  if (!GROUPS.length) GROUPS.push({ name: 'Everything', topics: null })
  else GROUPS[GROUPS.length - 1].topics = null
}
const listed = GROUPS.filter((g) => g.topics).flatMap((g) => g.topics)
const inGroup = (g, f) => (g.topics ? g.topics.includes(f.topic) : !listed.includes(f.topic))
const index = keyed.map((f) => `${f.key} [${f.topic}] ${f.items.join(',')}: ${f.summary}`).join('\n')

const CONSOLIDATE_SCHEMA = {
  type: 'object',
  properties: {
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Plain-language name of the change, e.g. "Prepaid is set on the Price list, not the profile"' },
          size: { type: 'string', enum: ['small', 'medium', 'large'] },
          topic: { type: 'string' },
          why: { type: 'string', description: `Two or three plain sentences for ${OWNER}: what was wrong, what changes, which ruling` },
          confidence: { type: 'string', enum: ['high', 'medium'] },
          keys: { type: 'array', items: { type: 'string' }, description: 'Finding keys this change covers' },
          editsOverride: { type: 'array', items: EDIT, description: 'Only if you revised the edits: the full replacement edit set for these keys. Empty to keep the findings\' edits.' },
          extraEdits: { type: 'array', items: EDIT, description: 'Additional edits you found were needed (other items with the same drift)' },
        },
        required: ['title', 'size', 'topic', 'why', 'confidence', 'keys', 'editsOverride', 'extraEdits'],
      },
    },
    dropped: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, reason: { type: 'string' } }, required: ['key', 'reason'] } },
    newQuestions: { type: 'array', items: QUESTION },
    notes: { type: 'string' },
  },
  required: ['changes', 'dropped', 'newQuestions', 'notes'],
}

phase('Consolidate')
const consolidated = (await parallel(GROUPS.map((g) => () => {
  const mine = keyed.filter((f) => inGroup(g, f))
  if (!mine.length) return Promise.resolve(null)
  return agent(`You are the final reviewer of proposed fixes to a requirements catalogue (${REQ}), for the topic group "${g.name}". ${OWNER} will read your output as an HTML review page and accept or reject each change; nothing is applied before that. Read-only: do not edit any file.

${READ_RULINGS}

Your findings (verified by Sonnet, each with proposed exact edits):
${JSON.stringify(mine)}

Every finding across all groups (for cross-group awareness; other groups handle their own):
${index}

New questions proposed so far (all groups): ${JSON.stringify(questions)}

Do this:
1. Adversarially re-check every large and medium finding: is the ruling really the latest word (check the cited note or question if unsure), does the item really say what is quoted, does the edit say exactly what the ruling says and no more? Drop wrong ones with a reason. Spot-check small ones.
2. Consistency: where the same rule is fixed in several items, make the wording consistent, and group them into ONE change (several keys). If other items in this topic carry the same drift but have no finding, search for them (grep the stories folder) and add extraEdits.
3. Conflicts: two edits on the same file whose "old" text overlaps must be merged into one edit (use editsOverride).
4. Size each change (${SIZES}) and give it a plain title and a short why for ${OWNER}.
5. Questions: keep only genuinely unresolved matters that block a fix in your group; merge duplicates. Write each body as the catalogue's questions are written: "**Already settled:** ..." (if anything is), "**Still to answer:**" with numbered bold questions, then "Recommendation: ...".
Every key of yours must end up in exactly one change or in dropped.

${EDIT_RULES}`, { label: `consolidate:${g.name}`, phase: 'Consolidate', schema: CONSOLIDATE_SCHEMA, model: 'opus', effort: 'high' })
    .then((r) => r && { group: g.name, keys: mine.map((f) => f.key), ...r })
}))).filter(Boolean)

const covered = new Set(consolidated.flatMap((c) => [...c.changes.flatMap((x) => x.keys), ...c.dropped.map((d) => d.key)]))
const uncovered = keyed.filter((f) => !covered.has(f.key)).map((f) => f.key)
if (uncovered.length) log(`Not covered by consolidation (will show as unreviewed): ${uncovered.join(', ')}`)
return {
  raw, verified: keyed.length, questionsProposed: questions.length,
  changes: consolidated.reduce((n, c) => n + c.changes.length, 0),
  bySize: ['large', 'medium', 'small'].map((s) => `${s}: ${consolidated.reduce((n, c) => n + c.changes.filter((x) => x.size === s).length, 0)}`).join(', '),
  dropped: consolidated.reduce((n, c) => n + c.dropped.length, 0),
  uncovered,
  notes: consolidated.map((c) => `${c.group}: ${c.notes}`),
}
