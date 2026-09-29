export const meta = {
  name: 'link-requirements',
  description: 'Sonnet agents propose and adversarially verify links between requirements (text links + related), batch by batch',
  whenToUse:
    'After requirements are added or reworded, to link each live item to the items that define what its text names. Run `npm --prefix requirements-board run links:index` first (writes requirements-board/.links/index.md); apply the result with `npm --prefix requirements-board run links:apply -- --dry-run`, then without --dry-run.',
  phases: [
    { title: 'Propose', detail: 'one Sonnet agent per batch of epics reads its items and proposes links', model: 'sonnet' },
    { title: 'Verify', detail: 'one Sonnet agent per batch re-reads source and target and rejects weak links', model: 'sonnet' },
  ],
}

/*
 * args (all optional; paths relative to the repo root):
 *   indexPath  the catalogue index from `links:index` (default requirements-board/.links/index.md)
 *   outDir     where the proposal files go (default requirements-board/.links, gitignored; links:apply
 *              reads this folder by default, so pass it the same path if you change it)
 *   batches    epic groups, e.g. [["EP-06"]] to try one epic first
 *
 * Nothing here edits the catalogue: agents write <outDir>/<batch>.proposed.json and
 * <batch>.verified.json, and `scripts/apply-links.ts` applies the verified ones deterministically.
 */
const A = args || {}
const INDEX = A.indexPath || 'requirements-board/.links/index.md'
const OUT = A.outDir || 'requirements-board/.links'
const BATCHES = A.batches || [
  ['EP-01', 'EP-02'],
  ['EP-03', 'EP-12'],
  ['EP-04', 'EP-06'],
  ['EP-05', 'EP-10'],
  ['EP-07', 'EP-08'],
  ['EP-09', 'EP-11'],
  ['EP-13', 'EP-14', 'EP-15'],
]
const CATALOGUE = 'docs/discovery-reference/Updated Requirements/catalogue'

const SHAPES = `Proposal shapes (JSON):
  {"kind":"inline","item":"US-06.2.1","field":"description","anchor":"anaesthetist's prepaid set","occurrence":1,"target":"US-06.1.1","reason":"US-06.1.1 is where the anaesthetist ticks the codes in their prepaid set"}
  {"kind":"related","from":"US-06.1.1","to":"US-06.2.1","reason":"the prepaid setting and the rule that reads it"}
- field: one of description, acceptance, technical, notes (the body before any "## " heading is the description; "## Acceptance criteria", "## Technical discussion" and "## Notes" are the others).
- anchor: copied character for character from that field (same case, punctuation and apostrophe style), whole words, not inside an existing [text](ID) link or backticks.
- occurrence: which occurrence of that exact anchor in the field to link, counting only occurrences outside links and code (1 = the first).
- target: an epic, feature, story or open question ID that appears in the index.
- reason: one sentence naming what the target defines that the phrase refers to.`

const RULES = `The linking rules are the "## Links" section of ${CATALOGUE}/SCHEMA.md. Read it and follow it exactly. In short:
- Inline link: a phrase naming a rule, concept or behaviour that another item DEFINES. Link the shortest natural phrase; never propose rewording.
- Target the most specific item (story over feature over epic). Never the item itself, its own parent or epic, or its own children. Never a Retired item (the index lists only live items).
- First mention per field only; one link per target per field; about four text links per item at most. An item with nothing worth linking gets nothing.
- Leave everyday domain nouns (Booking, List, Procedure, Contract, anaesthetist) unlinked unless the sentence relies on the specific rule one item states.
- related: items coupled in a way the text does not name (a setting and the rule that reads it, a UI story and its engine story, one step and the next). About four per item at most; siblings are not related just for being siblings. Skip it when either item's text already links the other.
- Bare IDs already in the text (like "(OQ-25)") already render as links; leave them alone.`

const COUNTS = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    inline: { type: 'number' },
    related: { type: 'number' },
    rejected: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['file', 'inline', 'related'],
}

const nameOf = (epics) => epics.join('+')
const filesOf = (epics) =>
  epics
    .map((e) => {
      const n = e.replace('EP-', '')
      return `${CATALOGUE}/requirements/EP-${n}.md, FT-${n}.*.md and US-${n}.*.md`
    })
    .join('; ')

const propose = (epics) =>
  agent(
    `You are linking requirements in a Markdown catalogue so readers can click from a phrase to the card that defines it. Your batch: ${epics.join(', ')}.

Read, in this order:
1. ${INDEX}: one line per live item in the WHOLE catalogue (ID, type, status, title, first sentence, existing related and links), then the open questions. This is how you find targets outside your batch.
2. ${CATALOGUE}/SCHEMA.md, the "## Links" section.
3. The glossary in docs/discovery-reference/Updated Requirements/domain-model.md (skim, for what terms mean).
4. Every file of your batch: ${filesOf(epics)}. Work only on IDs that appear in the index (retired items and items under them are left out).

${RULES}

Before proposing a link, open the target's file and confirm it really defines what the phrase names. Prefer a few sure links to many plausible ones.

${SHAPES}

Do NOT edit any catalogue file. Write your proposals with the Write tool to ${OUT}/${nameOf(epics)}.proposed.json as {"batch":"${nameOf(epics)}","proposals":[...]}. Then return the counts.`,
    { label: `propose:${nameOf(epics)}`, phase: 'Propose', model: 'sonnet', effort: 'medium', schema: COUNTS },
  )

const verify = (epics) =>
  agent(
    `You are the skeptical reviewer of link proposals for a requirements catalogue. Read ${OUT}/${nameOf(epics)}.proposed.json. For EVERY proposal, open the source item's file and the target's file (${CATALOGUE}/requirements/<ID>.md, or questions/<ID>.md for an OQ) and decide.

${RULES}

Reject a proposal when any of these hold (and default to reject when unsure):
- the anchor is not an exact, whole-word substring of that field at that occurrence, outside existing links and backticks (check with grep, mind apostrophes);
- the target does not define what the phrase refers to, or a more specific item does;
- the target is the item itself, its parent or epic, one of its children, or Retired;
- it is a later mention when an earlier one in the same field could carry the link, or a second link to the same target in that field;
- the phrase is an everyday domain noun used in passing;
- a related pair the text already links, siblings with no real coupling, or a pair already listed (in either direction) in the index;
- the item would end up with more than about four text links or four related entries: keep the strongest.
You may correct an inline proposal's anchor (to a shorter exact phrase) or occurrence when its intent is clearly right; say so in its reason. Never add new proposals.

Write ${OUT}/${nameOf(epics)}.verified.json with the Write tool as {"batch":"${nameOf(epics)}","accepted":[...proposals, same shape...],"rejected":[{...proposal, "why":"..."}]}. Then return the counts of accepted inline and related links and of rejected ones.`,
    { label: `verify:${nameOf(epics)}`, phase: 'Verify', model: 'sonnet', effort: 'high', schema: COUNTS },
  )

log(`${BATCHES.length} batch(es); index ${INDEX}; output ${OUT}`)
const results = await pipeline(
  BATCHES,
  (epics) => propose(epics),
  (proposed, epics) => (proposed ? verify(epics).then((v) => ({ batch: nameOf(epics), proposed, verified: v })) : { batch: nameOf(epics), proposed: null, verified: null }),
)

const done = results.filter(Boolean)
const missing = BATCHES.map(nameOf).filter((b) => !done.some((r) => r.batch === b && r.verified))
if (missing.length) log(`No verified file for: ${missing.join(', ')}. Re-run with batches for those.`)
const total = (k) => done.reduce((n, r) => n + ((r.verified && r.verified[k]) || 0), 0)
log(`Accepted ${total('inline')} text link(s) and ${total('related')} relation(s); rejected ${total('rejected')}.`)
log(`Next: npm --prefix requirements-board run links:apply -- --dry-run, read ${OUT}/links-report.md, then run it without --dry-run.`)
return { batches: done, missing }
