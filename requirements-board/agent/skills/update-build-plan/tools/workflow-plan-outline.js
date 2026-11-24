export const meta = {
  name: 'build-plan-outline',
  description: 'Opus architect and critic update the build plan outline and ROADMAP after catalogue changes, and triage the phases',
  phases: [
    { title: 'Outline', detail: 'architect update, coverage check, critic, revision; each affected phase tiered', model: 'opus' },
  ],
}

/*
 * Stage 2a of the update-build-plan skill. The phase docs are written afterwards by
 * workflow-plan-detail.js, from per-phase briefs that tools/phase-briefs.mjs builds out of this run.
 * args (built by the skill from tools/plan-state.mjs):
 *   root         repo root
 *   config       the plan's resolved config (node <tools>/config.mjs --json)
 *   baseline     the plan's current catalogue commit (plan.json "commit")
 *   commit       the catalogue commit the plan is being brought up to
 *   units        <plan>/units.json after the re-grade (every gap, DM and RV id to plan)
 *   oldPhases    [{num, title, file, covers}] from plan.json before this run
 *   builtPhases  phase numbers already built (frozen)
 *   partlyBuilt  [{num, note}] phases in progress: their built part is frozen (optional)
 *   regraded     the ids re-graded this update (regrade-ids.mjs --ids-only, plus every DM id when the
 *                delta ran and every RV id when the reverse check ran) (optional). One that is still a
 *                unit (a gap) and sits only in built phases' covers is "stranded": nothing would build it,
 *                so the coverage check fails until it moves to an unbuilt phase or is parked.
 *   changeNotes  short text: what changed, the change log paths, and any owner directives
 * Numbering, checked in code with coverage: a new phase takes the next number above the highest numbered
 * phase in the plan (config firstPhase when the plan has none, or when that is higher); a letter suffix
 * (27a) only beside an unbuilt phase 27; a new phase on an owner-added track (U1) only on a track the plan
 * already has, numbered above it.
 */
const ROOT = args.root
const C = args.config || {}
const CU = C.plan || 'docs/build-plan'
const CAT = C.requirements || 'requirements-board/requirements'
const BOARD = C.board || 'requirements-board'
const T = C.tools || `${BOARD}/agent/skills/update-build-plan/tools`
const PF = C.planFlag || ''
const LANES = C.lanesText ? `${C.lanesText.charAt(0).toUpperCase()}${C.lanesText.slice(1)} and retired items are excluded` : 'Retired items are excluded'
const STANDING = C.standingRules || `${LANES}; phases are numbered upward, each one focused session (two at most) with one coherent deliverable, leaving the app green; phases run back to back and agents test themselves (ROADMAP.md "Owner review: agents test themselves": no plan-approval stop; "ask the owner" becomes a built default logged on the phase's "For the owner's review" list).`
const O = 'opus'
const UNITS = args.units
const OLD = args.oldPhases
const BUILT = new Set(args.builtPhases || [])
const PARTLY = args.partlyBuilt || []
const REGRADED = new Set((args.regraded || []).map(String))
const B7 = args.baseline.slice(0, 7)
const C7 = args.commit.slice(0, 7)

// ---- numbering ----
const OLD_NUMS = new Set(OLD.map(p => String(p.num)))
const lead = n => { const m = String(n).match(/^(\d+)/); return m ? parseInt(m[1], 10) : null }
const FIRST = String(C.firstPhase || '01')
const highest = Math.max(-1, ...OLD.map(p => lead(p.num)).filter(n => n !== null))
const nextNum = Math.max(highest + 1, lead(FIRST) ?? 1)
const NEXT = String(nextNum).padStart(Math.max(2, FIRST.length), '0')
const NUMBERING = `Numbering new phases: the next new phase is ${NEXT}, then upward (${OLD.length ? `the highest phase in the plan is ${highest < 0 ? 'none numbered' : String(highest).padStart(2, '0')}` : `the plan has no phases yet, so numbering starts at config firstPhase ${FIRST}`}). Never reuse or fill in a lower number. A letter suffix (27a) only for a phase that must run just after an UNBUILT phase 27; never beside a built phase (built: ${[...BUILT].join(', ') || 'none'}). A new phase on an owner-added track (a capital letter and digits, U1) only on a track the plan already has, above its highest. Existing phases keep their numbers.`
/** New phase ids that break the numbering rule, each with why. */
const numbering = o => {
  const bad = []
  const tracks = new Map()
  for (const n of OLD_NUMS) { const m = n.match(/^([A-Z])(\d+)$/); if (m) tracks.set(m[1], Math.max(tracks.get(m[1]) ?? 0, +m[2])) }
  for (const p of o.phases) {
    const n = String(p.num)
    if (OLD_NUMS.has(n)) continue
    let m
    if ((m = n.match(/^(\d+)$/))) { if (+m[1] < nextNum) bad.push(`${n}: a new phase numbers from ${NEXT} upward`) }
    else if ((m = n.match(/^(\d+)[a-z]$/))) {
      const base = [...OLD_NUMS, ...o.phases.map(x => String(x.num))].find(x => /^\d+$/.test(x) && +x === +m[1])
      if (!base) bad.push(`${n}: no phase ${m[1]} to sit beside; use ${NEXT} upward`)
      else if (BUILT.has(base)) bad.push(`${n}: phase ${base} is built; a letter suffix only beside an unbuilt phase, so use ${NEXT} upward`)
    } else if ((m = n.match(/^([A-Z])(\d+)$/))) { if (!tracks.has(m[1]) || +m[2] <= tracks.get(m[1])) bad.push(`${n}: no owner-added ${m[1]} track to extend (or not above its highest); use ${NEXT} upward`) }
    else bad.push(`${n}: not a phase number (two digits, an optional letter); use ${NEXT} upward`)
  }
  return bad
}

const CTX = `You are one agent updating the "${C.name || 'build plan'}" build plan of ${C.subject || 'the app'}.
- Repo root: ${ROOT} (use absolute paths; folder names may contain spaces).
- ${C.appSummary || ''} The requirements catalogue ("${CAT}/stories/<ID>.md", questions in "${CAT}/questions/OQ-nn.md", model in "${CAT}/domain-model.md") is the source of truth. To read why an item says what it says, run \`npm --prefix "${ROOT}/${BOARD}" run source -- --item <ID> --text\` (needs Node 22.18 or newer on PATH) and read only the cited passages.
- The plan in "${CU}/" was built against catalogue commit ${B7}: ROADMAP.md (owner decisions table, phase table, open questions, sequencing rules, milestones, parked list), plan.json, phases/phase-NN-<slug>.md and .prompt.md, and the verified gap analysis (gaps.json is about 200k tokens: query it with node or jq for the ids you need, never read it whole).
- The catalogue has moved to ${C7}; the changed items are already re-graded. What changed: ${args.changeNotes}
  Item diffs: node ${T}/plan-state.mjs${PF} --to ${C7} --diff <IDs> (rename-aware; never a plain git diff of the catalogue folder).
- Built phases (frozen; follow-up work goes to a later phase): ${[...BUILT].join(', ') || 'none'}.${PARTLY.length ? `\n- Partly built phases (their built part is frozen; only the unbuilt part may change): ${PARTLY.map(p => `${p.num}: ${p.note}`).join('; ')}.` : ''}
- Standing rules: ${STANDING}
- ${NUMBERING}
- Only write the files you are told to write. Never commit.`

const PHASE = {
  type: 'object',
  properties: {
    num: { type: 'string', description: `An existing phase keeps its number; a new one takes ${NEXT} upward (see the numbering rule).` }, slug: { type: 'string' }, title: { type: 'string' }, track: { type: 'string' },
    goal: { type: 'string' }, delivers: { type: 'string' },
    depends_on: { type: 'array', items: { type: 'string' } }, est_sessions: { type: 'string' },
    covers: { type: 'array', items: { type: 'string' } }, demo_triggers: { type: 'array', items: { type: 'string' } },
    blocked_by_oqs: { type: 'array', items: { type: 'string' } }, risks: { type: 'string' },
  },
  required: ['num', 'slug', 'title', 'track', 'goal', 'delivers', 'depends_on', 'est_sessions', 'covers', 'demo_triggers', 'blocked_by_oqs', 'risks'],
}
const OUTLINE = {
  type: 'object',
  properties: {
    phases: { type: 'array', items: PHASE },
    parked: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    sequencing_rules: { type: 'string' },
    milestones: { type: 'array', items: { type: 'object', properties: { after: { type: 'string' }, can_show: { type: 'string' } }, required: ['after', 'can_show'] } },
    affected: {
      type: 'array',
      description: 'Every unbuilt phase whose doc must change, with its tier. Leave out phases whose only change is the drift baseline (a script moves it).',
      items: {
        type: 'object',
        properties: {
          num: { type: 'string' },
          tier: { type: 'string', enum: ['light', 'substantive'] },
          hard: { type: 'boolean', description: 'At most four phases in all: the hardest substantive ones (a new model across store, seed and screens). They get an Opus writer; the rest get Sonnet.' },
          reason: { type: 'string', description: 'What must change in the doc, concretely: items joined or left, answered decisions, superseded readings it still builds on, renamed neighbours or files.' },
        },
        required: ['num', 'tier', 'hard', 'reason'],
      },
    },
  },
  required: ['phases', 'parked', 'sequencing_rules', 'milestones', 'affected'],
}

const TIERS = `Triage (the "affected" list decides what the detail stage spends; each phase doc rewrite costs real money, so tier honestly):
- Leave a phase OUT of "affected" when nothing it covers, nothing that gates it and nothing it builds on changed: only its drift baseline moves, and a script does that.
- "light": a few covered items, gating decisions or neighbours changed, or the doc names a reading, file or neighbour that is now superseded or renamed. One writer edits the named sections in place; no reviewer.
- "substantive": a new phase, a repurposed phase, or most of its scope rewritten. A writer and an independent reviewer.
- "hard": true on at most four substantive phases, where the reasoning is hardest.
- A phase whose covers change is at least light. Include phases whose covers did not change but whose text still builds on a superseded reading (search the unbuilt docs for the superseded terms).`

const coverage = o => {
  const seen = new Map()
  for (const p of o.phases) for (const id of p.covers) seen.set(id, [...(seen.get(id) || []), p.num])
  for (const x of o.parked) seen.set(x.id, [...(seen.get(x.id) || []), 'parked'])
  const missing = UNITS.filter(u => !seen.has(u))
  const dupes = [...seen].filter(([, v]) => v.length > 1).map(([k, v]) => `${k} in ${v.join(' + ')}`)
  const unknown = [...seen.keys()].filter(k => !UNITS.includes(k))
  // Re-graded this update, still a gap, and homed only on built phases: nothing would build it.
  const stranded = UNITS.filter(u => REGRADED.has(u) && seen.get(u)?.length && seen.get(u).every(n => BUILT.has(n))).map(u => `${u} (built ${seen.get(u).join(' + ')})`)
  const misnumbered = numbering(o)
  return { ok: !missing.length && !dupes.length && !stranded.length && !misnumbered.length, missing, dupes, unknown, stranded, misnumbered }
}
const covText = c => [
  `Missing (in no phase and not parked): ${c.missing.join(', ') || 'none'}`,
  `In more than one place: ${c.dupes.join('; ') || 'none'}`,
  `No longer units (now Matches, retired or out of scope: remove them from covers, or keep them only on a built phase): ${c.unknown.join(', ') || 'none'}`,
  `Stranded (re-graded this update and still a gap, but covered only by a built phase, so nothing would build it: take it out of the built phase's covers, the one change a built phase's entry may take (its doc stays as it is), and put it in an unbuilt phase, a new one if none fits, or park it with a reason): ${c.stranded.join(', ') || 'none'}`,
  `Misnumbered new phases (renumber them, and every depends_on, milestone and ROADMAP mention): ${c.misnumbered.join('; ') || 'none'}`,
].join('\n')

const ROADMAP_FILE = `${ROOT}/${CU}/ROADMAP.md`
const guidance = `How to update:
- Read ROADMAP.md, plan.json, the change logs, the changed catalogue items (plan-state --diff above) and the re-graded gaps.json entries for the changed items (query by id).
- Keep the plan stable: change only what the catalogue changes require. Keep phase numbers. ${NUMBERING}
- Answered questions and owner decisions: the phase that planned a default now builds the answer; record it in ROADMAP's decisions table (mark superseded rows and say by what) and drop the default; add a row, with a built default from its Recommendation, for each new open question that gates an unbuilt phase.
- New gaps go to the best-fitting unbuilt phase or a new phase. Items now Matches, retired or out of scope leave covers (note any code the phase must remove).
- A re-graded id that is still a gap and sits only on a built phase is stranded: the built phase did not finish it. Move it out of the built phase's covers into an unbuilt phase (a new one if none fits), or park it with a reason. That is the only change a built phase's entry may take.${REGRADED.size ? ` Re-graded this update: ${[...REGRADED].join(', ')}.` : ''}
- Re-check dependencies, ordering, estimates, milestones and the parked list.
- Every unit below must be in exactly one phase's covers or parked.
${TIERS}
Units (${UNITS.length}): ${UNITS.join(', ')}
Current phases and covers (JSON): ${JSON.stringify(OLD)}`
const roadmapSpec = `Update "${ROADMAP_FILE}" to match the outline (intro counts, decisions table, track diagram, phase table, open-questions table, sequencing rules, milestones, parked list), keeping its style. Replace the baseline commit ${B7} with ${C7} where it names the plan's baseline (not in history or ranges).`

phase('Outline')
let outline = await agent(`${CTX}

TASK: you are the lead architect. Update the phase outline for the catalogue changes.

${guidance}

Then ${roadmapSpec}
Return the full updated outline (all phases, built ones unchanged) and the tiered affected list.`, { label: 'architect:update', phase: 'Outline', model: O, effort: 'xhigh', schema: OUTLINE })

for (let i = 0; i < 2; i++) {
  const c = coverage(outline)
  log(`coverage: ${c.missing.length} missing, ${c.dupes.length} duplicated, ${c.unknown.length} stale, ${c.stranded.length} stranded, ${c.misnumbered.length} misnumbered`)
  if (c.ok && !c.unknown.filter(u => !outline.phases.some(p => BUILT.has(p.num) && p.covers.includes(u))).length) break
  outline = await agent(`${CTX}

TASK: fix coverage and numbering in this updated outline. Every unit must be in exactly one phase's covers or parked; stale ids leave unbuilt phases; stranded ids leave their built phase for an unbuilt one or the parked list; misnumbered new phases are renumbered. Keep everything else unchanged, and keep "affected" complete and tiered (add any phase you change, at least light).
${covText(c)}

Outline (JSON):
${JSON.stringify(outline)}

Then update "${ROADMAP_FILE}" to match. Return the fixed outline.`, { label: `coverage-fix-${i + 1}`, phase: 'Outline', model: O, effort: 'high', schema: OUTLINE })
}

const critique = await agent(`${CTX}

TASK: independent critic of the updated outline below (also in ${ROADMAP_FILE}). Read the catalogue diff, the change logs and the re-graded gaps yourself. Challenge: did every change reach a phase? Are answered decisions built as answered, not as the old default? Is newly placed work in the wrong phase or before its dependencies? Is any phase now too big (more than two sessions) or empty? Built phases untouched (bar a stranded id moved out of their covers)? Is a re-graded gap left only on a built phase? Are new phases numbered by the rule above?
Also check the triage: is any phase missing from "affected" whose doc still builds on a superseded reading? Is any phase tiered higher than its change needs (substantive where light would do, hard on more than four)? Over-tiering wastes the budget as surely as under-tiering loses changes. Return "revise" only for material issues.

${TIERS}

Outline (JSON):
${JSON.stringify(outline)}`, {
  label: 'critic', phase: 'Outline', model: O, effort: 'high',
  schema: { type: 'object', properties: { verdict: { type: 'string', enum: ['ok', 'revise'] }, issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['major', 'minor'] }, issue: { type: 'string' }, suggestion: { type: 'string' } }, required: ['severity', 'issue', 'suggestion'] } } }, required: ['verdict', 'issues'] },
})
if (critique && critique.verdict === 'revise') {
  log(`critic: revise (${critique.issues.filter(i => i.severity === 'major').length} major)`)
  const revised = await agent(`${CTX}

TASK: lead architect: revise the updated outline in response to the critic. Accept what is right, reject what is not. Keep coverage complete and "affected" complete and tiered.

${guidance}

Critic's issues (JSON): ${JSON.stringify(critique.issues)}
Current outline (JSON): ${JSON.stringify(outline)}

Then ${roadmapSpec}
Return the revised outline.`, { label: 'architect:revise', phase: 'Outline', model: O, effort: 'xhigh', schema: OUTLINE })
  if (revised) outline = revised
}
// The critic's revision can undo coverage or numbering: one last fix when it did.
if (critique && critique.verdict === 'revise') {
  const c = coverage(outline)
  if (!c.ok) {
    log(`after revision: ${covText(c).split('\n').filter(l => !/: none$/.test(l)).join('; ')}`)
    const fixed = await agent(`${CTX}

TASK: fix coverage and numbering in this revised outline. Every unit must be in exactly one phase's covers or parked; stranded ids leave their built phase for an unbuilt one or the parked list; misnumbered new phases are renumbered. Keep everything else unchanged, and keep "affected" complete and tiered (add any phase you change, at least light).
${covText(c)}

Outline (JSON):
${JSON.stringify(outline)}

Then update "${ROADMAP_FILE}" to match. Return the fixed outline.`, { label: 'coverage-fix-final', phase: 'Outline', model: O, effort: 'high', schema: OUTLINE })
    if (fixed) outline = fixed
  }
}
const finalCov = coverage(outline)
const unbuiltAffected = outline.affected.filter(a => !BUILT.has(a.num))
const tally = t => unbuiltAffected.filter(a => a.tier === t).length
log(`outline: ${outline.phases.length} phases; coverage ${finalCov.ok ? 'complete' : covText(finalCov)}; affected ${unbuiltAffected.length} (${tally('substantive')} substantive, ${tally('light')} light, ${unbuiltAffected.filter(a => a.hard).length} hard)`)
return { phases: outline.phases.length, coverage: finalCov, critic: critique ? critique.verdict : null, affected: unbuiltAffected }
