export const meta = {
  name: 'catchup-dev-plan',
  description: 'Opus planners: catch-up roadmap, detailed phase docs, kick-off prompts and HTML build plan from the verified gap analysis',
  phases: [
    { title: 'Outline', detail: 'architect, coverage check, critic, revision', model: 'opus' },
    { title: 'Detail', detail: 'one writer + one reviewer per phase', model: 'opus' },
    { title: 'Publish', detail: 'HTML build plan + final consistency pass', model: 'opus' },
  ],
}

const ROOT = args.root
const CU = 'docs/prototype-build/catch-up'
const CAT = 'docs/discovery-reference/Updated Requirements/catalogue'
const O = 'opus'
const UNITS = args.units // every gap id, DM- id and RV- id that must be planned or parked
const COMMIT = args.commit

const CTX = `You are one agent planning the "requirements catch-up" of the Anaesthesia Associates (AA) prototype.
- Repo root: ${ROOT} (use absolute paths; folder names contain spaces).
- The prototype (aa-prototype/) is a finished React demo over a fake in-browser backend, built in July 2026 against the original RFP in 14 phases (docs/prototype-build/ROADMAP.md, phases/phase-00..13, index.html, PROGRESS.md). It is used in live vendor workshops.
- The requirements catalogue ("${CAT}/requirements/<ID>.md", questions in "${CAT}/questions/OQ-nn.md", narrative model "docs/discovery-reference/Updated Requirements/domain-model.md") is now the source of truth and has moved a long way from the RFP. Catalogue snapshot for this plan: commit ${COMMIT.slice(0, 7)}. It will keep changing over the coming weeks.
- A verified gap analysis has been done (Sonnet reviewers + adversarial verifiers). Its outputs, all under "${CU}/":
  - GAP-ANALYSIS.md: narrative summary and themes, at-a-glance counts, the Missing list, data-model and reverse-check tables (everything before "## By epic" is the part to read in full), then per-epic gap tables. epics/EP-nn.md: full per-gap detail for each epic (requirement, prototype today, missing or wrong, demo trigger, evidence).
  - gaps.json: every in-scope item with verdict (Matches / Partial / Contradicts / Missing / OutOfScope / Grouping), what is missing or wrong, evidence (file:line), proposed demo trigger, surfaces, size, and linked open questions. Also "dataModelDeltas" (DM-nn) and "reverseFindings" (RV-nn: retired or superseded behaviour the prototype still has).
  - analysis/prototype-map-*.md: an index of the prototype's code (screens, store actions, domain types, seed, harness bar and demo controls).
  - analysis/domain-model-delta.md, analysis/reverse-check.md.
- The product owner's rules for this plan:
  1. Bring the prototype up to the current catalogue. Future and Retired items are excluded (and retired behaviour still in the prototype is removed or reworked, per the RV findings).
  2. Anything that cannot be demoed through normal use (automatic, scheduled, backend, external-system events) gets a demo-trigger BUTTON in the control area at the top of the screen (the prototype's harness bar), shown ONLY on the screen where it is relevant. The PWA build (dist-pwa, no harness bar) needs an equivalent; check analysis/prototype-map-shell-demo-pwa.md.
  3. New phases are numbered from 14 (00 to 13 are done). Each phase is sized for one focused Claude Code session (at most two), with one coherent deliverable, like the original phases.
- Project rules (CLAUDE.md, which you already have): mock backend only, store hooks + audited mutate(), determinism (demo clock, seeded RNG), bump PERSIST_VERSION on seed changes, pure billing maths with Vitest tests, design files in docs/design are authoritative (crimson identity only, teal the only action colour), no en/em dashes in app copy, finish green (npm run build, npm run build:pwa, npx vitest run), the demo guide (docs/demo-guide) mirrors scripted beats, agents never commit.
- Only write the files you are told to write.`

const PHASE = {
  type: 'object',
  properties: {
    num: { type: 'string', description: 'Two digits, from "14".' },
    slug: { type: 'string', description: 'kebab-case, for phase-NN-<slug>.md' },
    title: { type: 'string' },
    track: { type: 'string', description: 'Short group label, e.g. Foundations, Schedule, Capture, Billing, Money, Admin, Demo.' },
    goal: { type: 'string', description: '2-4 sentences.' },
    delivers: { type: 'string', description: 'One line for the roadmap table.' },
    depends_on: { type: 'array', items: { type: 'string' } },
    est_sessions: { type: 'string', description: '"1 session" or "2 sessions"' },
    covers: { type: 'array', items: { type: 'string' }, description: 'Gap item IDs, DM- ids and RV- ids this phase closes.' },
    demo_triggers: { type: 'array', items: { type: 'string' } },
    blocked_by_oqs: { type: 'array', items: { type: 'string' } },
    risks: { type: 'string' },
  },
  required: ['num', 'slug', 'title', 'track', 'goal', 'delivers', 'depends_on', 'est_sessions', 'covers', 'demo_triggers', 'blocked_by_oqs', 'risks'],
}
const OUTLINE = {
  type: 'object',
  properties: {
    phases: { type: 'array', items: PHASE },
    parked: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] }, description: 'Units deliberately not planned (e.g. OutOfScope confirmed, or blocked by an open question with no safe interim). Keep this short.' },
    sequencing_rules: { type: 'string' },
    milestones: { type: 'array', items: { type: 'object', properties: { after: { type: 'string' }, can_show: { type: 'string' } }, required: ['after', 'can_show'] } },
  },
  required: ['phases', 'parked', 'sequencing_rules', 'milestones'],
}

const coverage = outline => {
  const seen = new Map()
  for (const p of outline.phases) for (const id of p.covers) seen.set(id, [...(seen.get(id) || []), p.num])
  for (const x of outline.parked) seen.set(x.id, [...(seen.get(x.id) || []), 'parked'])
  const missing = UNITS.filter(u => !seen.has(u))
  const dupes = [...seen].filter(([, v]) => v.length > 1).map(([k, v]) => `${k} in ${v.join(' + ')}`)
  const unknown = [...seen.keys()].filter(k => !UNITS.includes(k))
  return { ok: !missing.length && !dupes.length, missing, dupes, unknown }
}
const covText = c => `Missing (in no phase and not parked): ${c.missing.join(', ') || 'none'}\nIn more than one place (each unit must be in exactly one phase or parked): ${c.dupes.join('; ') || 'none'}\nUnknown ids (not gaps; fine to drop): ${c.unknown.join(', ') || 'none'}`

const ROADMAP_FILE = `${ROOT}/${CU}/ROADMAP.md`
const roadmapSpec = `Write (or overwrite) "${ROADMAP_FILE}" in the style of docs/prototype-build/ROADMAP.md (read it): a short intro (what the catch-up is, the catalogue commit, where the gap analysis lives), an ASCII track diagram, the phase table (# | Phase | Delivers | Depends on | Covers: counts of gaps / DM / RV), sequencing rules, milestone demos, the parked list with reasons, and a short "When the catalogue changes" section (each phase starts with a drift check against commit ${COMMIT.slice(0, 7)}; re-run the gap analysis for changed items, see ${CU}/README.md). Link phase docs as phases/phase-NN-<slug>.md.`

const planningGuidance = `Planning guidance:
- Read ${CU}/GAP-ANALYSIS.md (everything before "## By epic" in full, the per-epic tables as needed), ${CU}/analysis/domain-model-delta.md, ${CU}/analysis/reverse-check.md, the prototype maps, and gaps.json (use jq or node to slice it; it is large). Read docs/prototype-build/ROADMAP.md and two original phase docs for the house style and sizing.
- Structure first: data-model deltas that ripple through store, seed and screens go early, grouped so each phase leaves the app green and demoable (the prototype is shown in live workshops between phases; never leave a half-migrated model).
- An early foundation phase should build the screen-contextual demo-trigger mechanism in the harness bar (and its PWA equivalent) so later phases just register triggers.
- Group remaining gaps by coherent deliverable and surface (a phase that touches one app area and one domain slice beats one that scatters), respecting dependencies between epics.
- Fold the RV removals/reworks into the phase that touches that code, unless a clean-up phase is clearly better.
- Settledness: Confirmed items first; Open/Verify items and items with unresolved OQs go later, or stay in their natural phase but are flagged "confirm before building" (list the OQs in blocked_by_oqs). Park only when there is no safe interim.
- The demo guide (docs/demo-guide, S1 to S5) must be updated where beats change: either inside each phase or in a closing demo phase that rewrites the run sheet; decide, and say so.
- Every unit in the list below must appear in exactly one phase's covers or in parked. Matches/Grouping items are not units.
Units to cover (${UNITS.length}): ${UNITS.join(', ')}`

phase('Outline')
let outline = await agent(`${CTX}

TASK: you are the lead architect. Design the phase outline for the catch-up: the ordered set of build phases (from 14) that closes every verified gap, data-model delta and reverse finding.

${planningGuidance}

Then ${roadmapSpec}
Return the outline.`, { label: 'architect', phase: 'Outline', model: O, effort: 'xhigh', schema: OUTLINE })

for (let i = 0; i < 2; i++) {
  const c = coverage(outline)
  log(`coverage: ${c.missing.length} missing, ${c.dupes.length} duplicated`)
  if (c.ok) break
  outline = await agent(`${CTX}

TASK: fix coverage in this phase outline. Every unit must appear in exactly one phase's covers, or in parked. Keep the outline otherwise unchanged unless a fix needs a small restructure. Check gaps.json for the missing items to place them well.
${covText(c)}

Outline (JSON):
${JSON.stringify(outline)}

Then update "${ROADMAP_FILE}" to match. Return the fixed outline.`, { label: `coverage-fix-${i + 1}`, phase: 'Outline', model: O, effort: 'high', schema: OUTLINE })
}

const critique = await agent(`${CTX}

TASK: you are an independent critic of the catch-up phase outline below (also written to ${ROADMAP_FILE}). Challenge it hard, reading the gap analysis, the model delta, the reverse check and the prototype maps yourself:
- Ordering: does any phase depend on model/store work that lands later? Will the app stay green and demoable after every phase?
- Sizing: is any phase more than two focused sessions of work given the gap sizes (gaps.json "size") and the code involved? Is any phase trivially small and better merged?
- Coherence: does each phase have one deliverable a presenter could show?
- Risk: is unsettled work (Open/Verify, unresolved OQs) placed where rework is cheap?
- The demo-trigger mechanism, the PWA equivalent, removal of retired behaviour, and demo-guide updates: all planned?
- Anything important in GAP-ANALYSIS.md's themes that the outline misses or under-weights.
Return verdict "revise" only for issues that materially improve the plan.

Outline (JSON):
${JSON.stringify(outline)}`, {
  label: 'critic', phase: 'Outline', model: O, effort: 'high',
  schema: { type: 'object', properties: { verdict: { type: 'string', enum: ['ok', 'revise'] }, issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['major', 'minor'] }, issue: { type: 'string' }, suggestion: { type: 'string' } }, required: ['severity', 'issue', 'suggestion'] } } }, required: ['verdict', 'issues'] },
})

if (critique && critique.verdict === 'revise') {
  log(`critic: revise (${critique.issues.filter(i => i.severity === 'major').length} major issues)`)
  const revised = await agent(`${CTX}

TASK: you are the lead architect. Revise your catch-up phase outline in response to the critic. Accept the points that are right, reject the ones that are not (say which and why in sequencing_rules only if it matters to builders). Keep coverage complete: every unit in exactly one phase or parked.

${planningGuidance}

Critic's issues (JSON):
${JSON.stringify(critique.issues)}

Current outline (JSON):
${JSON.stringify(outline)}

Then ${roadmapSpec}
Return the revised outline.`, { label: 'architect:revise', phase: 'Outline', model: O, effort: 'xhigh', schema: OUTLINE })
  if (revised) outline = revised
  const c = coverage(outline)
  if (!c.ok) {
    const fixed = await agent(`${CTX}

TASK: fix coverage in this phase outline. Every unit must appear in exactly one phase's covers, or in parked. Keep everything else unchanged.
${covText(c)}

Outline (JSON):
${JSON.stringify(outline)}

Then update "${ROADMAP_FILE}" to match. Return the fixed outline.`, { label: 'coverage-fix-final', phase: 'Outline', model: O, effort: 'high', schema: OUTLINE })
    if (fixed) outline = fixed
  }
}
const finalCov = coverage(outline)
log(`outline: ${outline.phases.length} phases (${outline.phases.map(p => p.num).join(', ')}); coverage ${finalCov.ok ? 'complete' : `INCOMPLETE: ${covText(finalCov)}`}`)

const outlineSummary = outline.phases.map(p => `${p.num} ${p.title} (after ${p.depends_on.join(', ') || 'none'}): ${p.delivers}`).join('\n')
const phaseFile = p => `${CU}/phases/phase-${p.num}-${p.slug}.md`
const promptFile = p => `${CU}/phases/phase-${p.num}-${p.slug}.prompt.md`

const DETAIL = {
  type: 'object',
  properties: {
    num: { type: 'string' },
    goal_short: { type: 'string', description: 'One paragraph for the HTML phase card.' },
    checks: { type: 'array', items: { type: 'string' }, description: '3 or 4 "what to check when it is done" bullets.' },
    changes: { type: 'string', description: 'Reviewer only: what you changed. Writer: "".' },
  },
  required: ['num', 'goal_short', 'checks', 'changes'],
}

phase('Detail')
const details = await pipeline(
  outline.phases,
  p => agent(`${CTX}

TASK: write the detailed plan for catch-up Phase ${p.num} "${p.title}" and its kick-off prompt.

The full outline (for context; other phases are being written in parallel by other agents, so stay inside your phase's scope and refer to neighbours by number):
${outlineSummary}
Sequencing rules: ${outline.sequencing_rules}

This phase (JSON): ${JSON.stringify(p)}

Research before writing:
- For every unit this phase covers, read its entry in ${CU}/gaps.json (items, dataModelDeltas, reverseFindings) and its catalogue file ("${CAT}/requirements/<ID>.md", plus any OQ files listed).
- Read the prototype code you will be changing (start from the maps in ${CU}/analysis/), so the plan names real files, components, store actions and seed structures, not guesses.
- Read two original phase docs (docs/prototype-build/phases/phase-05-anaesthetist-web-app.md and phase-08-billing-run-and-invoices.md) and the Phase 05 kick-off prompt in docs/prototype-build/index.html for the house style.
- Check the design references in docs/design/ that apply to the screens you touch.

1. Write "${ROOT}/${phaseFile(p)}" in the house style of the original phase docs, with these sections:
   - Title "# Phase ${p.num} · ${p.title}", then **Requirements covered:** every covered catalogue ID as a Markdown link to its file (relative from the phase doc: ../../../discovery-reference/Updated%20Requirements/catalogue/requirements/<ID>.md), plus DM-/RV- ids linking to ../analysis/domain-model-delta.md and ../analysis/reverse-check.md; **Depends on:**; **Estimated:**.
   - ## Goal
   - ## Before you start: drift check (run git diff ${COMMIT.slice(0, 7)} -- "${CAT}" for the covered IDs; if an item changed, re-read it and adjust the work items; if an item is now Retired or Future, drop it and note that in PROGRESS.md). Name any unresolved OQs and what to do if still open (safe interim behaviour).
   - ## Reference: design files, catalogue items, analysis files, and code entry points.
   - ## Work items: numbered, concrete, in build order; each names the files/store actions/seed structures to change and which catalogue acceptance criteria it satisfies. Model/store/seed first, then UI. Include PERSIST_VERSION bumps, Vitest tests for any domain or billing rule, and removal/rework of retired behaviour where covered.
   - ## Demo triggers: each screen-contextual harness-bar button this phase adds (label, screen, effect), plus the PWA equivalent where the screen is mobile.
   - ## Out of scope
   - ## Manual test checklist (- [ ] items a person verifies in the browser, ending with npm run build, npm run build:pwa and npx vitest run green).
   - ## Demo guide updates: which docs/demo-guide files and S1 to S5 beats change, or "none".
   - ## Adversarial review (after build): the standard pass (PROGRESS convention 18), with "Steer this phase's reviewers at:" bullets specific to this phase.
   - ## PROGRESS.md updates
2. Write "${ROOT}/${promptFile(p)}": ONLY the kick-off prompt text (no heading, no fences), in the style of the original Phase 05 kick-off prompt: "Please run catch-up Phase ${p.num} (${p.title}) of the Anaesthesia Associates prototype." Then an ordered read-first list (CLAUDE.md is automatic, so do not list it; list ${CU}/ROADMAP.md, this phase doc, the relevant section of ${CU}/GAP-ANALYSIS.md, the covered catalogue files, the relevant design files, and the PROGRESS.md sections that matter: binding conventions + any Decisions log entries this phase supersedes). Then: do the drift check, enter plan mode and wait for approval; "While working:" bullets with the phase's key rules; "When done:" checklist, adversarial review pass, PROGRESS.md entry, demo guide updates, short notes; and a one-line phase goal. Plain ASCII punctuation.
Return goal_short, checks and changes "".`, { label: `write:${p.num}`, phase: 'Detail', model: O, effort: 'high', schema: DETAIL }),
  (draft, p) => agent(`${CTX}

TASK: you are an independent reviewer of the plan for catch-up Phase ${p.num} "${p.title}". Files: "${ROOT}/${phaseFile(p)}" and its kick-off prompt "${ROOT}/${promptFile(p)}". Fix problems by editing both files in place.

The full outline:
${outlineSummary}
This phase (JSON): ${JSON.stringify(p)}

Check, reading the sources yourself:
1. Coverage: for every covered unit, open its entry in ${CU}/gaps.json and its catalogue file. Is every missing_or_wrong point and every acceptance criterion addressed by a work item? Add what is missing.
2. Code reality: do the files, components, store actions and seed structures named exist (or are clearly marked as new)? Correct wrong names and paths.
3. Scope: nothing that belongs to another phase in the outline; nothing that depends on a later phase.
4. Rules: mock backend + audited mutate(), determinism, PERSIST_VERSION, pure tested billing maths, design authority and colour rules, no en/em dashes in app copy, finish green, demo triggers screen-contextual in the harness bar (+ PWA equivalent), demo guide mirroring.
5. The prompt: points at the right files, includes the drift check, plan-mode stop, and "When done" steps; readable by a fresh agent with no other context.
6. Size: realistic for ${p.est_sessions}? If clearly not, say so in changes (do not restructure the outline).
Return goal_short and checks (improved if needed) and changes (a short list of what you changed, or "none").`, { label: `review:${p.num}`, phase: 'Detail', model: O, effort: 'high', schema: DETAIL }).then(r => r || draft),
)
const det = details.filter(Boolean)
log(`phase docs: ${det.length}/${outline.phases.length} written and reviewed`)

phase('Publish')
const planData = {
  commit: COMMIT,
  phases: outline.phases.map(p => {
    const d = det.find(x => x.num === p.num) || {}
    return { ...p, file: `phases/phase-${p.num}-${p.slug}.md`, prompt_file: `phases/phase-${p.num}-${p.slug}.prompt.md`, goal_short: d.goal_short || p.goal, checks: d.checks || [] }
  }),
  parked: outline.parked, sequencing_rules: outline.sequencing_rules, milestones: outline.milestones,
}
const html = await agent(`${CTX}

TASK: publish the catch-up build plan as an HTML page in the same style as the original build plan, docs/prototype-build/index.html (read it fully: fonts, CSS tokens, hero with stats strip, prose sections, phase-at-a-glance table, phase articles with badges, "What to check when it's done" details, kick-off prompt blocks with Copy buttons, and its script).

Make it regenerable, because the requirements will keep changing:
1. Write "${ROOT}/${CU}/plan.json" containing exactly this data (verbatim):
${JSON.stringify(planData)}
2. Write "${ROOT}/${CU}/tools/build-index.mjs", a dependency-free Node script (node ${CU}/tools/build-index.mjs from the repo root) that reads plan.json, each phase's prompt_file, gaps.json and GAP-ANALYSIS.md's themes section, and writes "${ROOT}/${CU}/index.html". Reuse the original page's CSS and copy-button script (copy them into the generator); HTML-escape all text.
3. Page content, in order:
   - Hero: kicker "AA Prototype · Requirements catch-up", a title in the original's voice, a sub line (catalogue commit, date ${args.today}), and a stats strip (in-scope items, Matches, Partial, Contradicts, Missing, phases, estimated sessions) computed from gaps.json and plan.json.
   - "What changed since the prototype": the themes (from gaps.json "themes" if present, else GAP-ANALYSIS.md).
   - "The gap at a glance": one row per epic with counts per verdict (a simple stacked bar in CSS is fine, colours from the page's own palette), linking to that epic's section in GAP-ANALYSIS.md (anchor #ep-nn) and its detail file epics/EP-nn.md.
   - "How this works": adapted from the original (fresh session per phase, paste the kick-off prompt, drift check first, plan mode, checklist, adversarial review, PROGRESS.md entry; when the catalogue changes, see README.md).
   - "The phases at a glance": table like the original.
   - One article per phase like the original: number, title, badges (after phase X, est. sessions, plan doc link, count of items covered), goal_short, the covered items as small links (to the requirement file; plus a board link http://localhost:5180/#/board?item=<ID> for catalogue IDs), the "What to check" details, and the kick-off prompt from its prompt file with a Copy button.
   - Parked items with reasons; milestones.
   Links to catalogue files are relative from ${CU}/index.html: ../../discovery-reference/Updated%20Requirements/catalogue/requirements/<ID>.md.
4. Run the generator and confirm index.html is written and every phase has its prompt. Open nothing in a browser.
Return a short note: files written, page size, any data you could not find.`, { label: 'publish:html', phase: 'Publish', model: O, effort: 'high' })

const final = await agent(`${CTX}

TASK: final consistency pass over the catch-up plan in "${ROOT}/${CU}/": ROADMAP.md, phases/*.md, phases/*.prompt.md, plan.json, index.html (generated by tools/build-index.mjs), GAP-ANALYSIS.md, gaps.json.
Check and fix in place:
1. Every relative link in ROADMAP.md, GAP-ANALYSIS.md, epics/*.md and the phase docs resolves to an existing file (write a small throwaway node link checker in /tmp or the session scratchpad; do not add it to the repo). Fix broken ones.
2. ROADMAP.md's table, plan.json and the phase doc headers agree (numbers, titles, dependencies, estimates).
3. Every unit in this list is covered by exactly one phase doc's "Requirements covered" or listed as parked: ${UNITS.join(', ')}. Report any not covered (and add it to the right phase doc if the fix is obvious).
4. Kick-off prompts reference files that exist.
5. If you changed plan.json or a prompt file, re-run node ${CU}/tools/build-index.mjs.
Return a short report: what you checked, what you fixed, anything left for a human.`, { label: 'final-check', phase: 'Publish', model: O, effort: 'high' })

return { phases: outline.phases.map(p => `${p.num} ${p.title} [${p.covers.length}]`), parked: outline.parked.length, coverage: finalCov, critic: critique ? critique.verdict : null, html, final }
