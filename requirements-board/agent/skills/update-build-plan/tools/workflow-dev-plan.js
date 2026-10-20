export const meta = {
  name: 'build-plan-dev-plan',
  description: 'Opus planners: a fresh build plan (roadmap, detailed phase docs and kick-off prompts) from the verified gap analysis',
  phases: [
    { title: 'Outline', detail: 'architect, coverage check, critic, revision', model: 'opus' },
    { title: 'Detail', detail: 'one writer + one reviewer per phase', model: 'sonnet' },
  ],
}

/*
 * The update-build-plan skill's fresh-plan path, after workflow-gap-analysis.js and assemble-gaps.mjs.
 * args:
 *   root         repo root
 *   config       the plan's resolved config (node <tools>/config.mjs --json)
 *   commit       the catalogue commit the gap analysis graded
 *   units        <plan>/units.json (every gap, DM and RV id that must be planned or parked)
 *   today        YYYY-MM-DD
 *   firstPhase   the first phase number (optional; default config firstPhase): after a built plan, the
 *                number after the last built phase
 * Writes ROADMAP.md and phases/phase-NN-<slug>.md + .prompt.md. It does not write plan.json or
 * index.html: the skill runs apply-plan-update.mjs on this run's journal afterwards, which builds both.
 */
const ROOT = args.root
const C = args.config || {}
const CU = C.plan || 'docs/build-plan'
const CAT = C.requirements || 'requirements-board/requirements'
const BOARD = C.board || 'requirements-board'
const T = C.tools || `${BOARD}/agent/skills/update-build-plan/tools`
const PF = C.planFlag || ''
const PL = C.planning || {}
const PD = C.phaseDoc || {}
const GA = C.gapAnalysis || {}
const APP = C.appNoun || 'app'
const CAPTURE = !!C.capture
const PROGRESS = C.progress || null
const PROGRESS_NAME = PROGRESS ? PROGRESS.split('/').pop() : null
const ST = C.statuses || { settled: [], unsettled: [] }
const LANES = C.lanesText || ''
const FIRST = String(args.firstPhase || C.firstPhase || '01')
const O = 'opus'
const UNITS = args.units // every gap id, DM- id and RV- id that must be planned or parked
const COMMIT = args.commit
// A link from a phase doc (CU/phases/) up to the repo root.
const UP = [...CU.split('/').filter(Boolean), 'phases'].map(() => '..').join('/')
const EXTRA = PD.extraSections || {}
const extra = where => (EXTRA[where] ? [EXTRA[where]] : [])
const or = list => list.join(' or ')

const ownerRules = [
  ...(PL.ownerRules || [`Bring the ${APP} up to the current catalogue. ${LANES ? `${LANES.charAt(0).toUpperCase()}${LANES.slice(1)} and retired items are` : 'Retired items are'} excluded (and retired behaviour still in the ${APP} is removed or reworked, per the RV findings).`]),
  `New phases are numbered from ${FIRST}${PL.history ? ' (earlier phases are done)' : ''}. Each phase is sized for one focused Claude Code session (at most two), with one coherent deliverable${PL.styleRefs ? ', like the original phases' : ''}.`,
]
const CTX = `You are one agent planning the "${C.name || 'build plan'}" of ${C.subject || `the ${APP}`}.
- Repo root: ${ROOT} (use absolute paths; folder names may contain spaces).
- ${PL.history || C.appSummary || `The ${APP}'s code: ${(C.appCode || []).join(', ') || 'this repo'}.`}
- The requirements catalogue ("${CAT}/stories/<ID>.md", questions in "${CAT}/questions/OQ-nn.md", narrative model "${CAT}/domain-model.md") is the source of truth. Catalogue snapshot for this plan: commit ${COMMIT.slice(0, 7)}. It will keep changing over the coming weeks.
- A verified gap analysis has been done (Sonnet reviewers + adversarial verifiers). Its outputs, all under "${CU}/":
  - GAP-ANALYSIS.md: narrative summary and themes, at-a-glance counts, the Missing list, data-model and reverse-check tables (everything before "## By epic" is the part to read in full), then per-epic gap tables. epics/EP-nn.md: full per-gap detail for each epic (requirement, ${APP} today, missing or wrong, demo trigger, evidence).
  - gaps.json: every in-scope item with verdict (Matches / Partial / Contradicts / Missing / OutOfScope / Grouping), what is missing or wrong, evidence (file:line), proposed demo trigger, surfaces, size, and linked open questions. Also "dataModelDeltas" (DM-nn) and "reverseFindings" (RV-nn: retired or superseded behaviour the ${APP} still has).
  - analysis/${APP}-map-*.md: an index of the ${APP}'s code.
  - analysis/domain-model-delta.md, analysis/reverse-check.md.
- The product owner's rules for this plan:
${ownerRules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
- ${C.projectRules || 'Project rules: follow the repo\'s CLAUDE.md (or contributor docs) if it has one; agents never commit.'}
- Only write the files you are told to write.`

const PHASE = {
  type: 'object',
  properties: {
    num: { type: 'string', description: `Two digits, from "${FIRST}".` },
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
const roadmapSpec = `Write (or overwrite) "${ROADMAP_FILE}"${PL.styleRefs ? ` in the style of ${PL.styleRefs} (read them)` : ''}: a short intro (what the plan is, the catalogue commit, where the gap analysis lives), an owner decisions table (one row per open question or owner decision that gates a phase, in the form "| D1 | <decision> | <phases it gates, e.g. 15, 17 to 19, or all> | <the default built until it is answered> |": the update tooling reads rows that start "| D<n> |" and the phases in their third cell), an ASCII track diagram, the phase table (# | Phase | Delivers | Depends on | Covers: counts of gaps / DM / RV), sequencing rules, milestone demos, the parked list with reasons, a section "Owner review: agents test themselves" (no plan-approval stop; the agent runs each phase's manual test checklist itself in the running ${APP}; an "ask the owner" point becomes a built default logged on the phase's "For the owner's review" list; stops only for a change that would undo built work, a destructive or irreversible action, or a missing credential; the owner reviews once, at the end)${CAPTURE ? `, a section "Catalogue screenshots" (every phase keeps the catalogue screenshots in step with the ${APP}: it creates or updates the capture recipes in ${C.captureRecipes} for the stories it covers and any it breaks, then runs a full npm run capture in ${BOARD}/ with no failed recipe and npm run verify:board green; the first phase gives every live story a recipe)` : ''}, and a short "When the catalogue changes" section (each phase starts with a drift check against commit ${COMMIT.slice(0, 7)}; the update-build-plan skill re-grades changed items and updates the affected phases). Link phase docs as phases/phase-NN-<slug>.md.`

const planningGuidance = `Planning guidance:
- Read ${CU}/GAP-ANALYSIS.md (everything before "## By epic" in full, the per-epic tables as needed), ${CU}/analysis/domain-model-delta.md, ${CU}/analysis/reverse-check.md, the ${APP} maps, and gaps.json (use jq or node to slice it; it is large).${PL.styleRefs ? ` Read ${PL.styleRefs} for the house style and sizing.` : ''}
- Structure first: data-model deltas that ripple through the data layer and screens go early, grouped so each phase leaves the app green and usable (never leave a half-migrated model).
- Group remaining gaps by coherent deliverable and surface (a phase that touches one app area and one domain slice beats one that scatters), respecting dependencies between epics.
- Fold the RV removals/reworks into the phase that touches that code, unless a clean-up phase is clearly better.
- Settledness: ${ST.settled.length ? `${or(ST.settled)} items first; ` : ''}${ST.unsettled.length ? `${or(ST.unsettled)} items and ` : ''}items with unresolved OQs go later, or stay in their natural phase but are flagged "confirm before building" (list the OQs in blocked_by_oqs). Park only when there is no safe interim.
${(PL.guidance || []).map(g => `- ${g}\n`).join('')}- Every unit in the list below must appear in exactly one phase's covers or in parked. Matches/Grouping items are not units.
Units to cover (${UNITS.length}): ${UNITS.join(', ')}`

phase('Outline')
let outline = await agent(`${CTX}

TASK: you are the lead architect. Design the phase outline: the ordered set of build phases (from ${FIRST}) that closes every verified gap, data-model delta and reverse finding.

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

TASK: you are an independent critic of the phase outline below (also written to ${ROADMAP_FILE}). Challenge it hard, reading the gap analysis, the model delta, the reverse check and the ${APP} maps yourself:
- Ordering: does any phase depend on data-model work that lands later? Will the app stay green and usable after every phase?
- Sizing: is any phase more than two focused sessions of work given the gap sizes (gaps.json "size") and the code involved? Is any phase trivially small and better merged?
- Coherence: does each phase have one deliverable someone could be shown?
- Risk: is unsettled work (${ST.unsettled.length ? `${or(ST.unsettled)} status, ` : ''}unresolved OQs) placed where rework is cheap?
${(PL.criticChecks || ['Removal of retired behaviour: planned?']).map(c => `- ${c}`).join('\n')}
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

TASK: you are the lead architect. Revise your phase outline in response to the critic. Accept the points that are right, reject the ones that are not (say which and why in sequencing_rules only if it matters to builders). Keep coverage complete: every unit in exactly one phase or parked.

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

const sections = p => [
  `Title "# Phase ${p.num} · ${p.title}", then **Requirements covered:** every covered catalogue ID as a Markdown link to its file (relative from the phase doc: ${UP}/${CAT}/stories/<ID>.md), plus DM-/RV- ids linking to ../analysis/domain-model-delta.md and ../analysis/reverse-check.md; **Depends on:**; **Estimated:**.`,
  '## Goal',
  `## Before you start: drift check (run node ${T}/plan-state.mjs${PF} --diff <the covered IDs and linked OQs, comma separated>; if an item changed, re-read it and adjust the work items; if an item is now retired${LANES ? ` or in ${LANES}` : ''}, drop it and note that in ${PROGRESS_NAME || 'the phase report'}). Name any unresolved OQs and what to do if still open (safe interim behaviour).`,
  `## Reference: ${PD.reference || 'design files, catalogue items, analysis files, and code entry points'}.`,
  `## Work items: numbered, concrete, in build order; each names the files, functions and data structures to change and which catalogue acceptance criteria it satisfies. Data model first, then UI. ${PD.workItemRules || 'Include tests for any domain rule, and removal/rework of retired behaviour where covered.'}`,
  ...extra('afterWorkItems'),
  '## Out of scope',
  `## Manual test checklist (- [ ] items the agent itself verifies in the running ${APP}, per ROADMAP.md "Owner review: agents test themselves", ending with ${C.greenCommands || "the project's build and test commands"} green).`,
  ...extra('afterChecklist'),
  ...(CAPTURE ? [`## Catalogue screenshots: the standing step in ${CU}/ROADMAP.md "Catalogue screenshots". A table with one row per item that \`node ${T}/recipe-status.mjs${PF} ${p.num}\` lists (each ID linked), giving its recipe at plan time and what it must be when the phase is done (status, shots and states per app, highlight, caption); then "Recipes this phase breaks" (other recipes in ${C.captureRecipes}/ whose routes, seed ids, text or selectors this phase changes, found by grep) and the ${C.captureAtlas} sections to update. Add a matching Manual test checklist item (full npm run capture with no failed recipe, shots checked by eye, npm run verify:board green).`] : []),
  ...extra('afterScreenshots'),
  ...(PROGRESS_NAME ? [`## ${PROGRESS_NAME} updates`] : []),
].map(x => `   - ${x}`).join('\n')

const promptSpec = p => `ONLY the kick-off prompt text (no heading, no fences)${PL.styleRefs ? `, in the style of the original kick-off prompts (${PL.styleRefs})` : ''}: "Please run ${C.name || 'build plan'} Phase ${p.num} (${p.title}) of ${C.subject || `the ${APP}`}." Then an ordered read-first list (CLAUDE.md is automatic, so do not list it; list ${CU}/ROADMAP.md, this phase doc, the relevant section of ${CU}/GAP-ANALYSIS.md, the covered catalogue files${PD.readFirst ? `, ${PD.readFirst}` : ''}${CAPTURE ? `, ${C.captureAtlas}` : ''}). Then: do the drift check, write a step plan and start building without waiting for approval (ROADMAP.md "Owner review: agents test themselves"); "While working:" bullets with the phase's key rules; "When done:" checklist run by the agent itself in the running ${APP} (never handed to the owner)${CAPTURE ? `, the catalogue screenshot step (create or update the phase's capture recipes and any it broke, node scripts/capture.ts --dry then a full npm run capture in ${BOARD}/ with no failed recipe, check the shots, npm run verify:board)` : ''}, ${PROGRESS_NAME ? `a ${PROGRESS_NAME} entry` : 'a short report'} ending with a "For the owner's review" list, short notes; and a one-line phase goal.${PD.promptRules ? ` ${PD.promptRules}` : ''} Plain ASCII punctuation.`

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

TASK: write the detailed plan for Phase ${p.num} "${p.title}" and its kick-off prompt.

The full outline (for context; other phases are being written in parallel by other agents, so stay inside your phase's scope and refer to neighbours by number):
${outlineSummary}
Sequencing rules: ${outline.sequencing_rules}

This phase (JSON): ${JSON.stringify(p)}

Research before writing:
- For every unit this phase covers, read its entry in ${CU}/gaps.json (items, dataModelDeltas, reverseFindings) and its catalogue file ("${CAT}/stories/<ID>.md", plus any OQ files listed).
- Read the ${APP} code you will be changing (start from the maps in ${CU}/analysis/), so the plan names real files, components, functions and data structures, not guesses.
${PL.styleRefs ? `- Read ${PL.styleRefs} for the house style.\n` : ''}${(PL.research || []).map(r => `- ${r}\n`).join('')}
1. Write "${ROOT}/${phaseFile(p)}" with these sections:
${sections(p)}
2. Write "${ROOT}/${promptFile(p)}": ${promptSpec(p)}
Return goal_short, checks and changes "".`, { label: `write:${p.num}`, phase: 'Detail', model: 'sonnet', effort: 'high', schema: DETAIL }),
  (draft, p) => agent(`${CTX}

TASK: you are an independent reviewer of the plan for Phase ${p.num} "${p.title}". Files: "${ROOT}/${phaseFile(p)}" and its kick-off prompt "${ROOT}/${promptFile(p)}". Fix problems by editing both files in place.

The full outline:
${outlineSummary}
This phase (JSON): ${JSON.stringify(p)}

Check, reading the sources yourself:
${[
  `Coverage: for every covered unit, open its entry in ${CU}/gaps.json and its catalogue file. Is every missing_or_wrong point and every acceptance criterion addressed by a work item? Add what is missing.`,
  'Code reality: do the files, components, functions and data structures named exist (or are clearly marked as new)? Correct wrong names and paths.',
  'Scope: nothing that belongs to another phase in the outline; nothing that depends on a later phase.',
  `Rules: ${C.projectRules || "the project's rules (CLAUDE.md or contributor docs)"}`,
  'The prompt: points at the right files, includes the drift check, no plan-approval stop, the agent running the checklist itself, and "When done" steps; readable by a fresh agent with no other context.',
  ...(CAPTURE ? ['"## Catalogue screenshots" lists every story the phase owns, and the prompt runs npm run capture.'] : []),
  ...(PD.reviewChecks || []).map(c => `${c.charAt(0).toUpperCase()}${c.slice(1)}.`),
  `Size: realistic for ${p.est_sessions}? If clearly not, say so in changes (do not restructure the outline).`,
].map((c, i) => `${i + 1}. ${c}`).join('\n')}
Return goal_short and checks (improved if needed) and changes (a short list of what you changed, or "none").`, { label: `review:${p.num}`, phase: 'Detail', model: 'sonnet', effort: 'medium', schema: DETAIL }).then(r => r || draft),
)
const det = details.filter(Boolean)
log(`phase docs: ${det.length}/${outline.phases.length} written and reviewed; next: apply-plan-update.mjs on this run's journal builds plan.json and index.html`)

return { phases: outline.phases.map(p => `${p.num} ${p.title} [${p.covers.length}]`), parked: outline.parked.length, coverage: finalCov, critic: critique ? critique.verdict : null, written: det.map(d => d.num) }
