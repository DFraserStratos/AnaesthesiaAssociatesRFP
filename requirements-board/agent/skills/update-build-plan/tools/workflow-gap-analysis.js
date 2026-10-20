export const meta = {
  name: 'build-plan-gap-analysis',
  description: 'Sonnet gap analysis: the app vs the requirements catalogue, per epic, adversarially verified',
  phases: [
    { title: 'Map', detail: 'code maps + domain-model delta', model: 'sonnet' },
    { title: 'Review', detail: 'one reviewer per epic + reverse check', model: 'sonnet' },
    { title: 'Verify', detail: 'adversarial verifier per review', model: 'sonnet' },
    { title: 'Themes', detail: 'cross-epic synthesis', model: 'sonnet' },
  ],
}

/*
 * args: root (repo root), config (the plan's resolved config: node <tools>/config.mjs --json), commit
 * (catalogue commit graded), epics (from tools/build-args.mjs), plus optional switches for a partial
 * re-run over changed items:
 *   reuseMaps: true   skip the mappers; reuse analysis/<appNoun>-map-*.md (app code unchanged)
 *   runDelta: false   skip the data-model delta (domain-model.md unchanged)
 *   runReverse: false skip the reverse check (no newly retired items)
 *   runThemes: false  skip the themes summary (assemble-gaps.mjs --merge keeps the earlier one)
 *   baseline: <sha>   the plan's previous catalogue commit: the delta then works as an update of the
 *                     existing analysis/domain-model-delta.md, from the domain model's diff, keeping ids
 */
const ROOT = args.root
const OPT = { reuseMaps: !!args.reuseMaps, runDelta: args.runDelta !== false, runReverse: args.runReverse !== false, runThemes: args.runThemes !== false }
const EPICS = args.epics.map(e => ({
  ...e,
  items: e.items.map(s => { const [id, status, oq] = s.split('|'); return { id, status, type: id.startsWith('EP') ? 'epic' : id.startsWith('FT') ? 'feature' : 'story', title: '', oqs: oq ? oq.split(',') : [] } }),
  // build-args.mjs gives why each is out: retired, or out-of-scope (an out-of-scope lane).
  excluded: e.excluded.map(s => { const [id, reason, swimlane] = s.split('|'); return { id, reason, swimlane, title: '' } }),
}))
const C = args.config || {}
const GA = C.gapAnalysis || {}
const CAT = C.requirements || 'requirements-board/requirements'
const BOARD = C.board || 'requirements-board'
const T = C.tools || `${BOARD}/agent/skills/update-build-plan/tools`
const PF = C.planFlag || ''
const AN = `${C.plan || 'docs/build-plan'}/analysis`
// A link from AN up to the repo root.
const UP = AN.split('/').filter(Boolean).map(() => '..').join('/')
const APP = C.appNoun || 'app'
const CODE = (C.appCode && C.appCode[0]) || C.app || 'src'
const ST = C.statuses || { list: '', retired: 'Retired', settled: [], unsettled: [] }
const LANES = C.lanesText || ''
const or = list => list.join(' or ')
const M = 'sonnet'

const CTX = `You are one agent in a gap analysis between ${C.subject || `the ${APP}`} and the current requirements catalogue.
- Repo root: ${ROOT} (use absolute paths; folder names may contain spaces).
- ${GA.codeGuide || C.appSummary || `The ${APP}'s code: ${(C.appCode || []).join(', ') || 'this repo'}.`}
- Requirements catalogue (THE source of truth, supersedes any older specification and the ${APP}'s build docs wherever they differ): "${CAT}/stories/<ID>.md" (one file per epic EP-nn / feature FT-nn.m / story US-nn.m.k), outstanding questions in "${CAT}/questions/OQ-nn.md" (field "affects" lists item IDs). Format: "${CAT}/SCHEMA.md". Narrative model: "${CAT}/domain-model.md". Evidence notes: "${CAT}/notes/".
- Each item's "sources:" cites its evidence ${GA.sourcesExample || '("Notes 2026-10-01 · Client meeting #16", "Q&A 2026-09-24 #2")'}. When you need the reasoning behind a requirement (why it says what it says, what a vague phrase means), run \`npm --prefix "${ROOT}/${BOARD}" run source -- --item <ID> --text\` and read only the cited passages it prints (a note's numbered point, a document page), never whole notes or transcripts. It needs Node 22.18 or newer: if it fails with ERR_UNKNOWN_FILE_EXTENSION, put one first on PATH (e.g. from ~/.nvm/versions/node/).
- ${GA.history || `Older design or build docs describe what was intended at the time: use them only as leads to find code, never as proof something exists. THE CODE IS THE TRUTH about the ${APP}.`}
- This is a READ-ONLY analysis. Do not modify any file except an output file you are explicitly told to write. No git writes, no builds, no dev servers.
- Be concise and factual. Cite code as ${CODE}/...:line.`

const SURFACES = GA.surfaces || ['ui', 'logic', 'data', 'integration', 'docs']
const SURFACE_KEYS = SURFACES.map(x => x.split(/[\s(]/)[0])
const VERDICTS = `Verdicts (pick exactly one per item):
- Matches: the ${APP} demonstrates the requirement's behaviour and ALL its acceptance criteria as now written (visible in the UI, or triggerable via an existing demo control), with nothing contradicting it.
- Partial: the concept is present and correct as far as it goes, but some rules / acceptance criteria / screens are missing.
- Contradicts: the ${APP} implements the concept but some implemented behaviour differs from what the requirement now says (typically an older reading the catalogue has since changed). Use this over Partial whenever any implemented behaviour is WRONG, even if other parts are also missing.
- Missing: nothing in the ${APP} represents it.
- OutOfScope: ${GA.outOfScope || `cannot be meaningfully built or shown in the ${APP} (e.g. hosting region, backup RPO, uptime SLA). Use sparingly: if there is ANY user-visible effect, it is not OutOfScope.`}
- Grouping: an epic or feature whose body only introduces/groups its children and states no rule of its own. If it states its own rules or acceptance criteria, grade it normally.

${GA.demoTriggerRule || 'demo_trigger: for anything automatic, scheduled, time-driven, external-system-driven or backend-only, how a tester can make it happen and see its effect (an existing control, or a concrete proposal). Otherwise leave demo_trigger "".'}

Size of the work to close the gap (for a Claude Code agent session): None (Matches/Grouping/OutOfScope), S (< ~1 hour), M (a few hours), L (about a session), XL (more than a session).

Surfaces: which parts would change: ${SURFACES.join(', ')}.`

const ITEM = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    verdict: { type: 'string', enum: ['Matches', 'Partial', 'Contradicts', 'Missing', 'OutOfScope', 'Grouping'] },
    summary: { type: 'string', description: 'One sentence: the gap, or why it matches.' },
    requirement_says: { type: 'string', description: 'The essence of what the requirement now demands (1-2 sentences).' },
    prototype_does: { type: 'string', description: `What the ${APP} actually does today, or "Nothing".` },
    missing_or_wrong: { type: 'array', items: { type: 'string' }, description: 'Each specific rule / acceptance criterion / screen element that is missing or wrong. Empty for Matches.' },
    evidence: { type: 'array', items: { type: 'string' }, description: `${CODE}/...:line refs; for Missing, the searches you ran ("searched: prepay|deposit in src -> none").` },
    demo_trigger: { type: 'string' },
    surfaces: { type: 'array', items: { type: 'string', enum: SURFACE_KEYS } },
    size: { type: 'string', enum: ['None', 'S', 'M', 'L', 'XL'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['id', 'verdict', 'summary', 'requirement_says', 'prototype_does', 'missing_or_wrong', 'evidence', 'demo_trigger', 'surfaces', 'size', 'confidence'],
}
const VITEM = {
  ...ITEM,
  properties: {
    ...ITEM.properties,
    verify_outcome: { type: 'string', enum: ['upheld', 'corrected'] },
    original_verdict: { type: 'string' },
    verify_note: { type: 'string', description: 'What you checked and, if corrected, why.' },
  },
  required: [...ITEM.required, 'verify_outcome', 'original_verdict', 'verify_note'],
}
const REVIEW = {
  type: 'object',
  properties: {
    items: { type: 'array', items: ITEM },
    epic_observations: { type: 'string', description: 'Cross-cutting notes for this epic: structural changes, dependencies on other epics, demo-script impact.' },
  },
  required: ['items', 'epic_observations'],
}
const VREVIEW = {
  type: 'object',
  properties: { items: { type: 'array', items: VITEM }, epic_observations: { type: 'string' } },
  required: ['items', 'epic_observations'],
}
const DELTA = {
  type: 'object',
  properties: {
    deltas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'DM-01, DM-02 ...' },
          kind: { type: 'string', enum: ['NewEntity', 'ChangedEntity', 'RemovedEntity', 'NewRelationship', 'ChangedRelationship', 'NewLifecycle', 'ChangedLifecycle', 'RuleChange'] },
          title: { type: 'string' },
          catalogue_says: { type: 'string' },
          prototype_has: { type: 'string' },
          catalogue_refs: { type: 'array', items: { type: 'string' } },
          prototype_refs: { type: 'array', items: { type: 'string' } },
          impact: { type: 'string', description: 'What it ripples into (store, seed, screens), and whether it must precede other work.' },
          size: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
          verify_outcome: { type: 'string', description: 'Verifier only: upheld | corrected | added. Reviewer: "".' },
          verify_note: { type: 'string' },
        },
        required: ['id', 'kind', 'title', 'catalogue_says', 'prototype_has', 'catalogue_refs', 'prototype_refs', 'impact', 'size', 'verify_outcome', 'verify_note'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['deltas', 'summary'],
}
const REVERSE = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'RV-01, RV-02 ...' },
          kind: { type: 'string', enum: ['RetiredStillImplemented', 'FutureStillShowcased', 'DecisionSuperseded', 'UnbackedBehaviour'] },
          title: { type: 'string' },
          prototype_evidence: { type: 'array', items: { type: 'string' } },
          catalogue_refs: { type: 'array', items: { type: 'string' } },
          explanation: { type: 'string' },
          recommended_action: { type: 'string', enum: ['Remove', 'Rework', 'Hide from demo', 'Keep as demo scaffold'] },
          size: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
          verify_outcome: { type: 'string', description: 'Verifier only: upheld | corrected | added. Reviewer: "".' },
          verify_note: { type: 'string' },
        },
        required: ['id', 'kind', 'title', 'prototype_evidence', 'catalogue_refs', 'explanation', 'recommended_action', 'size', 'verify_outcome', 'verify_note'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

const MAPS = GA.maps || [{ key: 'app', scope: `${(C.appCode || []).join(', ') || 'the app code in this repo'}: every route/screen, the domain types and rules, the data layer and anything that looks stubbed.` }]

phase('Map')
log(`${EPICS.reduce((n, e) => n + e.items.length, 0)} items across ${EPICS.length} epics; options ${JSON.stringify(OPT)}; catalogue @ ${args.commit.slice(0, 7)}`)

const mapJobs = MAPS.map(mp => () => agent(
  `${CTX}

TASK: write a navigational map of one area of the ${APP} to the file "${ROOT}/${AN}/${APP}-map-${mp.key}.md".
Area: ${mp.scope}

Purpose: the downstream reviewers, each checking one epic of requirements against the ${APP}, will read ALL map files first to know where to look, then read the code themselves. So the map must be an accurate, dense INDEX, not an essay:
- every route/screen: route path, component file, what the user sees, what they can do, which store actions/hooks it calls;
- the domain concepts, statuses, validations, calculations and business rules visible in this area, with file paths (and line numbers for the important ones);
- demo, test or simulator affordances in this area;
- anything that looks stubbed, hardcoded, or visual-only.
Describe what the code DOES. Start the file with a one-paragraph orientation and a table of contents. Keep it under ~25KB. Read the code thoroughly: you are the foundation others build on.
Final answer: 3-5 lines saying what you covered and anything you could not map.`,
  { label: `map:${mp.key}`, phase: 'Map', model: M, effort: 'medium' },
))

const STABLE_IDS = args.baseline
  ? `This is an UPDATE of "${ROOT}/${AN}/domain-model-delta.md" (written against catalogue ${args.baseline.slice(0, 7)}). Read it first, then the domain model's diff: node ${T}/plan-state.mjs${PF} --to ${args.commit.slice(0, 7)} --diff domain-model (and --diff <IDs> for the items it names). Re-check every earlier delta against the current catalogue and code, but spend your reading on what changed. IDS ARE STABLE: the build plan cites deltas by number. A delta that continues an earlier one (same entity, relationship or lifecycle concern, even if the reading moved) keeps its id; a new delta takes the next number above the highest id ever used; an earlier id with no delta now is listed in the intro as closed, merged into DM-xx, or dropped, with why. Never renumber.`
  : 'Number the deltas DM-01 upward.'

const deltaJob = () => agent(
  `${CTX}

TASK: data-model delta. Compare the entity/relationship/lifecycle model the requirements now describe with the model the ${APP} implements.
${STABLE_IDS}
1. Read "${CAT}/domain-model.md" fully, then skim every epic and feature file in "${CAT}/stories/" (EP-*.md, FT-*.md) and the stories that define entities, statuses or lifecycles. Ignore retired items (status ${ST.retired})${LANES ? ` and items in ${LANES}` : ''}.
2. Read the ${APP}'s types and lifecycles: ${GA.modelCode || `its data model code in ${(C.appCode || []).join(', ') || 'this repo'} (types, schemas, store or database models, seed or fixture data)`}.
3. List every structural difference: new entities, changed entities (fields, identity, cardinality), removed/renamed entities, relationships, lifecycle/status machines, and model-level rules (who owns what, what is derived vs stored). Skip cosmetic naming unless it changes meaning.
These deltas decide the order of the rebuild (model changes ripple into store, seed and every screen), so be precise about impact and whether a delta must precede other work.
Also write a readable version to "${ROOT}/${AN}/domain-model-delta.md" (a short intro, then one section per delta with catalogue links as relative paths from that file, e.g. ${UP}/${CAT}/stories/US-01.1.1.md).
Return the structured deltas (verify_outcome and verify_note as "").`,
  { label: 'delta:domain-model', phase: 'Map', model: M, effort: 'high', schema: DELTA },
)

const mapped = await parallel([...(OPT.reuseMaps ? [] : mapJobs), ...(OPT.runDelta ? [deltaJob] : [])])
const deltaDraft = OPT.runDelta ? mapped[mapped.length - 1] : null
const mapFiles = MAPS.map(mp => `"${ROOT}/${AN}/${APP}-map-${mp.key}.md"`).join('\n')
log(`maps ${OPT.reuseMaps ? 'reused' : `done (${mapped.slice(0, OPT.runDelta ? -1 : undefined).filter(Boolean).length}/${MAPS.length})`}; ${deltaDraft ? deltaDraft.deltas.length : 0} draft model deltas`)

const READ_MAPS = `First read ALL of these ${APP} map files (they index where things are):\n${mapFiles}\nIf a map file is missing, explore the code directly.`

const itemLine = it => `- ${it.id} [${it.type}, status ${it.status}] ${it.oqs.length ? ` (unresolved questions: ${it.oqs.join(', ')})` : ''}`

const reviewPrompt = (ep, items) => `${CTX}

TASK: grade how well the ${APP} matches each in-scope requirement of epic ${ep.id} "${ep.title}" (epic status ${ep.status}).

${READ_MAPS}

Then read each of these catalogue files in full ("${CAT}/stories/<ID>.md"), plus the question files for any unresolved questions listed, plus the parts of domain-model.md that concern this epic:
${items.map(itemLine).join('\n')}

For EACH item: read the requirement (description, acceptance criteria, technical discussion, notes; where its intent is unclear, its cited sources as above), then find the ${APP} code that would implement it (use the maps, then grep/read the code; try synonyms and older vocabulary, since the ${APP} may use different names). Decide a verdict with evidence.

${VERDICTS}

Status handling: grade every item regardless of status (${ST.list}; status files hold these numbers, defined in ${CAT}/board.config.json). For ${ST.unsettled.length ? `${or(ST.unsettled.map(x => x.replace(/ \(\d+\)$/, '')))} items or ` : ''}items with unresolved questions, grade against the text as written and mention the uncertainty in summary.

Return exactly one entry per item listed above (${items.length} items), same IDs. In epic_observations, note structural changes and dependencies on other epics${GA.demoScript ? `, and any ${GA.demoScript} this epic's gaps would break or change` : ''}.`

const verifyPrompt = (ep, items, review) => `${CTX}

TASK: you are an ADVERSARIAL VERIFIER. Another agent graded how well the ${APP} matches each in-scope requirement of epic ${ep.id} "${ep.title}". Your job is to try to prove each grading wrong, independently, from the catalogue files and the code. Do not trust the reviewer's evidence: re-open the files.

${READ_MAPS}

Requirement files: "${CAT}/stories/<ID>.md" for:
${items.map(itemLine).join('\n')}

${VERDICTS}

How to attack each verdict:
- Missing: search hard for an implementation the reviewer missed (other names, older vocabulary, data and state code, seed data, demo or admin panels, shared components). If found, correct to Matches/Partial/Contradicts.
- Partial / Contradicts: check every missing_or_wrong point against both the requirement text and the code (and, where the text is ambiguous, the passages its sources cite). Drop points that are not real; add points the reviewer missed. Decide whether Contradicts is really Partial (nothing wrong, only missing) or vice versa.
- Matches: re-check EVERY Matches item${ST.settled.length ? ` whose status is ${or(ST.settled)}, and at least half of the rest` : ''}. Look for acceptance criteria not satisfied or behaviour that has quietly changed. A false Matches hides work; treat it as seriously as a false gap.
- OutOfScope: challenge it: could a demo trigger (a button or control that makes it happen) represent it? If so, re-grade and propose the trigger.
- Grouping: confirm the body states no rule of its own.
Also sanity-check size, surfaces and demo_trigger.

Reviewer's grading (JSON):
${JSON.stringify(review)}

Return ALL ${items.length} items with your final values, plus verify_outcome (upheld/corrected), original_verdict (the reviewer's verdict) and verify_note (what you checked; if corrected, why). Keep or improve epic_observations.`

const reversePrompt = `${CTX}

TASK: REVERSE CHECK. The rest of the analysis asks "what does the catalogue require that the ${APP} lacks?". You ask the opposite: "what does the ${APP} do that is now WRONG or no longer wanted?".

${READ_MAPS}

Check four things:
1. RetiredStillImplemented: these catalogue items are Retired; read each and find whether the ${APP} still implements or showcases the retired behaviour:
${EPICS.flatMap(e => e.excluded).filter(x => x.reason === 'retired').map(x => `- ${x.id} ${x.title}`).join('\n')}
2. FutureStillShowcased: these are out of current scope${LANES ? ` (${LANES})` : ''}; does the ${APP} prominently showcase them in a way that would mislead its users or audience about current scope?
${EPICS.flatMap(e => e.excluded).filter(x => x.reason !== 'retired').map(x => `- ${x.id} [${x.reason}${x.swimlane ? ', ' + x.swimlane : ''}] ${x.title}`).join('\n')}
3. DecisionSuperseded: read ${GA.decisionsLog || 'any record of earlier design decisions the repo keeps (a decisions log, ADRs, a build record), if there is one'}. For each ruling that the current catalogue now contradicts, record it: the ${APP} follows a reading that has since changed. Cite the catalogue item that supersedes it.
4. UnbackedBehaviour: ${APP} business behaviour (rules, statuses, screens) that no in-scope catalogue item supports AND that conflicts with or would mislead against the catalogue. Demo-only simulators and presenter tooling are fine; do not list them unless they model an external system in a way the catalogue now contradicts.

Catalogue files: "${CAT}/stories/<ID>.md". Also write a readable report to "${ROOT}/${AN}/reverse-check.md" (short intro, then findings grouped by kind; link catalogue items with relative paths from that file, e.g. ${UP}/${CAT}/stories/US-01.1.1.md).
Return the structured findings (verify_outcome and verify_note as "").`

const verifyReversePrompt = draft => `${CTX}

TASK: ADVERSARIAL VERIFIER for a reverse check (things the ${APP} does that are now wrong or unwanted). Try to refute each finding from the catalogue files and the code: is the retired/superseded behaviour really in the ${APP}? Does the catalogue really contradict the old decision (read the catalogue item cited, and look for other in-scope items that might support the ${APP}'s behaviour)? Is the recommended action right? Correct or drop findings that do not survive, and ADD any the reverse checker clearly missed (retired items: ${EPICS.flatMap(e => e.excluded).filter(x => x.reason === 'retired').map(x => x.id).join(', ')}${GA.decisionsLog ? `; earlier decisions: ${GA.decisionsLog}` : ''}).

${READ_MAPS}

Draft findings (JSON):
${JSON.stringify(draft)}

Return the final list. verify_outcome per finding: upheld | corrected | added (drop refuted ones, and mention every dropped id and why in summary). Then UPDATE "${ROOT}/${AN}/reverse-check.md" so it matches your final list.`

const verifyDeltaPrompt = draft => `${CTX}

TASK: ADVERSARIAL VERIFIER for a data-model delta (structural differences between the model the requirements describe and the ${APP}'s model). For each delta, re-read the catalogue refs and the ${APP} refs and try to refute it: does the catalogue really say that (and is it in scope: not retired${LANES ? ` or in ${LANES}` : ''})? Does the ${APP} really lack/differ? Is the impact right? Correct or drop deltas that do not survive; ADD structural deltas the author missed (read "${CAT}/domain-model.md" and ${GA.modelCode || `the ${APP}'s data model code`} yourself).

Draft deltas (JSON):
${JSON.stringify(draft)}

Keep every id as the author set it (the build plan cites them by number); a delta you add takes the next free number. Return the final list. verify_outcome per delta: upheld | corrected | added (drop refuted ones and name them in summary). Then UPDATE "${ROOT}/${AN}/domain-model-delta.md" to match your final list.`

const missingIds = (items, got) => {
  const have = new Set((got || []).map(x => x.id))
  return items.filter(it => !have.has(it.id))
}

phase('Review')
const epicResults = pipeline(
  EPICS,
  async ep => {
    let r = await agent(reviewPrompt(ep, ep.items), { label: `review:${ep.id}`, phase: 'Review', model: M, effort: 'high', schema: REVIEW })
    const miss = missingIds(ep.items, r && r.items)
    if (miss.length) {
      log(`${ep.id}: reviewer skipped ${miss.length} item(s), re-reviewing them`)
      const r2 = await agent(reviewPrompt(ep, miss), { label: `review:${ep.id}:fill`, phase: 'Review', model: M, effort: 'high', schema: REVIEW })
      r = { items: [...((r && r.items) || []), ...((r2 && r2.items) || [])], epic_observations: `${(r && r.epic_observations) || ''}\n${(r2 && r2.epic_observations) || ''}`.trim() }
    }
    const known = new Set(ep.items.map(i => i.id))
    r.items = r.items.filter(i => known.has(i.id))
    return r
  },
  async (review, ep) => {
    const v = await agent(verifyPrompt(ep, ep.items, review), { label: `verify:${ep.id}`, phase: 'Verify', model: M, effort: 'high', schema: VREVIEW })
    const byId = new Map(((v && v.items) || []).map(x => [x.id, x]))
    const items = ep.items.map(it => {
      if (byId.has(it.id)) return byId.get(it.id)
      const orig = review.items.find(x => x.id === it.id)
      return orig ? { ...orig, verify_outcome: 'unverified', original_verdict: orig.verdict, verify_note: 'Verifier did not return this item.' } : null
    }).filter(Boolean)
    const unv = items.filter(x => x.verify_outcome === 'unverified').length
    const cor = items.filter(x => x.verify_outcome === 'corrected').length
    log(`${ep.id}: ${items.length}/${ep.items.length} graded, ${cor} corrected by verifier${unv ? `, ${unv} UNVERIFIED` : ''}`)
    return { epic: ep.id, title: ep.title, items, epic_observations: (v && v.epic_observations) || review.epic_observations }
  },
)
const reverseResult = !OPT.runReverse ? Promise.resolve([null]) : pipeline(
  [1],
  () => agent(reversePrompt, { label: 'reverse-check', phase: 'Review', model: M, effort: 'high', schema: REVERSE }),
  draft => agent(verifyReversePrompt(draft), { label: 'verify:reverse', phase: 'Verify', model: M, effort: 'high', schema: REVERSE }).then(v => v || draft),
)
const deltaResult = deltaDraft
  ? agent(verifyDeltaPrompt(deltaDraft), { label: 'verify:domain-model', phase: 'Verify', model: M, effort: 'high', schema: DELTA }).then(v => v || deltaDraft)
  : Promise.resolve(null)

const [epics, rev, delta] = await Promise.all([epicResults, reverseResult, deltaResult])
const verified = epics.filter(Boolean)
const reverse = rev[0]

const counts = {}
for (const e of verified) for (const it of e.items) counts[it.verdict] = (counts[it.verdict] || 0) + 1
log(`verdicts: ${JSON.stringify(counts)}`)

phase('Themes')
const compact = verified.map(e => ({
  epic: e.epic, title: e.title, observations: e.epic_observations,
  items: e.items.map(i => ({ id: i.id, verdict: i.verdict, summary: i.summary, missing_or_wrong: i.missing_or_wrong, demo_trigger: i.demo_trigger, surfaces: i.surfaces, size: i.size })),
}))
const themes = !OPT.runThemes ? null : await agent(
  `${CTX}

TASK: write the narrative summary for the gap-analysis report. The verified per-item gradings, the verified data-model delta and the verified reverse check are below. Detailed per-epic tables are generated separately from the data, so do NOT reproduce item-by-item lists. Write for the product owner and the planners who will turn this into build phases.

Write summary_md (Markdown, headings at ### level and below, about 1,000 to 1,800 words):
- A short headline paragraph: how far the ${APP} is from the catalogue overall.
- Themes: the 6 to 12 big shifts between the ${APP} and the current requirements (each: what changed, why it matters, the item IDs and DM-/RV- ids involved, rough size).
- Structural first: which data-model changes must land before screen work, and why.
- Things to remove or rework (from the reverse check).
${GA.demoScript ? `- Demo impact: which ${GA.demoScript} (read it) break or change.\n` : ''}${(GA.themeBullets || []).map(b => `- ${b}\n`).join('')}- Uncertainty: where unresolved questions (OQ-nn)${ST.unsettled.length ? ` or ${or(ST.unsettled)} statuses` : ''} make a gap unsafe to build yet.
Refer to items by ID only (links are added later). Also return themes as structured data.

Verified item gradings:
${JSON.stringify(compact)}

Verified data-model delta:
${JSON.stringify(delta)}

Verified reverse check:
${JSON.stringify(reverse)}`,
  {
    label: 'themes', phase: 'Themes', model: M, effort: 'high',
    schema: {
      type: 'object',
      properties: {
        summary_md: { type: 'string' },
        themes: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, item_ids: { type: 'array', items: { type: 'string' } } }, required: ['title', 'description', 'item_ids'] } },
      },
      required: ['summary_md', 'themes'],
    },
  },
)

return { counts, epics: verified.length, reverse: reverse ? reverse.findings.length : 0, deltas: delta ? delta.deltas.length : 0, themes: themes ? themes.themes.map(t => t.title) : null }
