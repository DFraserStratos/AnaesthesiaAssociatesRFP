export const meta = {
  name: 'build-plan-detail',
  description: 'Sonnet writers (Opus for the few hard phases) update the tiered phase docs from their briefs; Sonnet reviewers check the substantive ones',
  phases: [
    { title: 'Detail', detail: 'one writer per phase from its brief; a reviewer on the diff of each substantive phase', model: 'sonnet' },
  ],
}

/*
 * Stage 2b of the update-build-plan skill, after workflow-plan-outline.js and tools/phase-briefs.mjs.
 * args:
 *   root         repo root
 *   config       the plan's resolved config (node <tools>/config.mjs --json)
 *   baseline     the plan's current catalogue commit (plan.json "commit")
 *   commit       the catalogue commit the plan is being brought up to
 *   briefsDir    the --out directory of phase-briefs.mjs (holds outline.md and <num>.md)
 *   phases       the contents of <briefsDir>/detail-args.json, or a subset of it
 *   reviewOnly   phase numbers whose writer already finished: run only their reviewer (optional)
 *   partlyBuilt  [{num, note}] phases in progress whose built part is frozen (optional)
 *   today        YYYY-MM-DD (dates the section a partly built phase gets)
 *   changeNotes  the owner's cross-cutting directives for this update, short (optional)
 * To re-run after a failure (for example a usage limit), call again with `phases` cut down to the
 * failed ones (and reviewOnly for those whose writer had finished). Never use resume for this: resume
 * replays only the longest unchanged prefix of agent calls, so in a pipeline it re-runs finished work.
 */
const ROOT = args.root
const C = args.config || {}
const CU = C.plan || 'docs/build-plan'
const CAT = C.requirements || 'requirements-board/requirements'
const BOARD = C.board || 'requirements-board'
const T = C.tools || `${BOARD}/agent/skills/update-build-plan/tools`
const PF = C.planFlag || ''
const PD = C.phaseDoc || {}
const CAPTURE = !!C.capture
const PROGRESS = C.progress ? C.progress.split('/').pop() : null
const LANES = C.lanesText ? `${C.lanesText.charAt(0).toUpperCase()}${C.lanesText.slice(1)} and retired items are excluded` : 'Retired items are excluded'
const STANDING = C.standingRules || `${LANES}; phases are numbered upward, each one focused session (two at most) with one coherent deliverable, leaving the app green; phases run back to back and agents test themselves (ROADMAP.md "Owner review: agents test themselves": no plan-approval stop; "ask the owner" becomes a built default logged on the phase's "For the owner's review" list).`
// A link from a phase doc (CU/phases/) up to the repo root.
const UP = [...CU.split('/').filter(Boolean), 'phases'].map(() => '..').join('/')
const B7 = args.baseline.slice(0, 7)
const C7 = args.commit.slice(0, 7)
const REVIEW_ONLY = new Set(args.reviewOnly || [])
const PARTLY = new Map((args.partlyBuilt || []).map(p => [p.num, p.note]))
const OUTLINE_FILE = `${args.briefsDir}/outline.md`
// Project sections (config phaseDoc.extraSections): "## Name: what it holds".
const EXTRA = PD.extraSections || {}
const nameOf = t => (t ? t.replace(/^##\s*/, '').split(':')[0].trim() : null)
const extraNames = where => (EXTRA[where] ? [nameOf(EXTRA[where])] : [])

const CTX = `You are one agent updating a single phase of the "${C.name || 'build plan'}" build plan of ${C.subject || 'the app'}. ${C.appSummary || ''}
- Repo root: ${ROOT} (use absolute paths; folder names may contain spaces). The plan is in "${CU}/". The catalogue moved from ${B7} to ${C7}; the plan is being brought up to ${C7}.
- Your BRIEF holds everything that changed for your phase: its outline entry, the covers that joined or left, the catalogue diff of each covered item that changed, its gap entries, the owner decisions that gate it, the changed questions and change-log rows that name its items${CAPTURE ? ', and its catalogue screenshot rows' : ''}. Work from it. Do NOT read ROADMAP.md, gaps.json, GAP-ANALYSIS.md or the change logs whole. For a neighbouring phase, read "${OUTLINE_FILE}" (one line per phase) and only the section of its doc you need. For an item the brief does not diff, run node ${T}/plan-state.mjs${PF} --to ${C7} --diff <ID>. For code, grep for the names you need and read only those regions.${args.changeNotes ? `\n- Owner directives for this update: ${args.changeNotes}` : ''}
- Standing rules: ${STANDING}${CAPTURE ? ` Never edit capture recipes, catalogue images or ${C.captureReport}: the build phase does that.` : ''} Only write this phase's doc and prompt. Never commit.
- Keep the doc lean. Do not restate catalogue text the reader can open; link it.${CAPTURE ? ' In "## Catalogue screenshots", give each row one or two lines (recipe now; what it must show when done: status, shots and states per app, highlight, caption); an item this phase does not change gets a one-line "no change here (Phase NN owns it)".' : ''} Do not let the doc grow: when you add, cut what is superseded.`

const DETAIL = {
  type: 'object',
  properties: { num: { type: 'string' }, goal_short: { type: 'string' }, checks: { type: 'array', items: { type: 'string' } }, changes: { type: 'string' } },
  required: ['num', 'goal_short', 'checks', 'changes'],
}
const frozen = p => PARTLY.has(p.num) ? `\nThis phase is PARTLY BUILT: ${PARTLY.get(p.num)} Never rewrite or remove the built part's text. Keep the doc's drift-check baseline as it is, and record what the unbuilt part must now do differently in a dated "## Requirements changed since <the built part> (${args.today})" section near the top; point the prompt at it. If a change would undo built work, do not plan it: put "NEEDS OWNER: ..." in your "changes" output.` : ''

const newSections = [
  'title', `Requirements covered (links ${UP}/${CAT}/stories/<ID>.md; DM and RV ids to ../analysis/)`, 'Depends on', 'Estimated', 'Goal',
  `Before you start (drift check against ${C7}; open questions with their built defaults)`, 'Reference',
  'Work items (concrete, naming real files and structures, or marked new)', ...extraNames('afterWorkItems'),
  'Out of scope', 'Manual test checklist', ...extraNames('afterChecklist'),
  ...(CAPTURE ? [`Catalogue screenshots (the standing step in ${CU}/ROADMAP.md "Catalogue screenshots": the rows from the brief, the recipes this phase breaks, the ATLAS.md sections)`] : []),
  ...extraNames('afterScreenshots'), ...(PROGRESS ? [`${PROGRESS} updates`] : []),
].join(', ')
const editSections = [
  'Requirements covered', 'Goal', 'Before you start', 'Work items', ...extraNames('afterWorkItems'), 'Manual test checklist', ...extraNames('afterChecklist'),
  ...(CAPTURE ? ['Catalogue screenshots (rows for items that joined, none for items that left, each re-stated for what it must show when done)'] : []),
  ...extraNames('afterScreenshots'), 'and the prompt',
].join(', ')

const writerPrompt = p => `${CTX}

TASK: ${p.isNew ? 'write' : 'update'} Phase ${p.num} "${p.title}" (tier: ${p.tier}). Why: ${p.reason}
Brief: "${p.brief}" (read it first). Doc: "${ROOT}/${CU}/${p.file}". Prompt: "${ROOT}/${CU}/${p.prompt}".${frozen(p)}
${p.isNew
  ? `Write both in the house style: read one neighbouring phase doc and its prompt first. Sections: ${newSections}. The prompt holds only the kick-off prompt text${CAPTURE ? '; its "When done:" runs the catalogue screenshot step (a full npm run capture with no failed recipe, then npm run verify:board)' : ''}.${PD.promptRules ? ` ${PD.promptRules}` : ''}`
  : `Edit both in place, section by section, only where the brief's changes reach: ${editSections}. Build answers instead of defaults and drop "provisional" labels for answered questions. Remove work for items that left; add work for items that joined. ${PARTLY.has(p.num) ? '' : `Where the doc names the plan's baseline ${B7} as its drift-check baseline, make it ${C7}; leave historical mentions and ranges alone.`}`}
Return goal_short (one paragraph), checks (3 or 4 "what to check when it's done" bullets) and changes (one paragraph: what you changed).`

const reviewChecks = p => [
  'every change in the brief reached the doc, and nothing from a removed, retired or superseded requirement survives in what the phase builds',
  'answered questions and decisions are built as answered, open ones as their stated default',
  'files, components and functions it names exist (grep) or are marked new',
  `scope fits "${OUTLINE_FILE}"`,
  `the drift-check baseline is ${C7}${PARTLY.has(p.num) ? ' (except this partly built phase, which keeps its own)' : ''}`,
  ...(CAPTURE ? ['"## Catalogue screenshots" names every item in the brief\'s screenshot rows and the prompt runs npm run capture'] : []),
  ...(PD.reviewChecks || []),
].map((c, i) => `(${i + 1}) ${c}`).join('; ')

const reviewerPrompt = p => `${CTX}

TASK: independent reviewer of Phase ${p.num} "${p.title}" just after its update. Brief: "${p.brief}". Run \`git -C "${ROOT}" diff -- "${CU}/${p.file}" "${CU}/${p.prompt}"\` and review the CHANGE${p.isNew ? ' (a new phase: its files are untracked, so read them whole)' : ''}; open other parts of the doc only where the diff depends on them. Fix problems in place.${frozen(p)}
Check: ${reviewChecks(p)}.
Return goal_short, checks and changes (what you changed, or "none").`

const label = (step, p) => `${step}:${p.num}`
const results = await pipeline(
  args.phases,
  p => REVIEW_ONLY.has(p.num)
    ? Promise.resolve({ num: p.num, goal_short: '', checks: [], changes: '(writer finished in an earlier run)' })
    : agent(writerPrompt(p), { label: label(p.isNew ? 'write' : 'update', p), phase: 'Detail', model: p.hard ? 'opus' : 'sonnet', effort: p.tier === 'light' ? 'medium' : 'high', schema: DETAIL }),
  (draft, p) => (p.tier === 'substantive' && draft)
    ? agent(reviewerPrompt(p), { label: label('review', p), phase: 'Detail', model: 'sonnet', effort: 'medium', schema: DETAIL }).then(r => r || { ...draft, reviewFailed: true })
    : draft,
)
const done = args.phases.filter((p, i) => results[i] && !results[i].reviewFailed)
const failed = args.phases.filter((p, i) => !results[i]).map(p => p.num)
const reviewFailed = args.phases.filter((p, i) => results[i] && results[i].reviewFailed).map(p => p.num)
log(`phase docs: ${done.length}/${args.phases.length} done${failed.length ? `; writer failed: ${failed.join(', ')} (re-run with phases cut to these)` : ''}${reviewFailed.length ? `; reviewer failed: ${reviewFailed.join(', ')} (re-run with these in reviewOnly)` : ''}`)
const needsOwner = results.filter(Boolean).filter(r => /NEEDS OWNER/.test(r.changes)).map(r => `${r.num}: ${r.changes}`)
return { done: done.map(p => `${p.num} (${p.tier})`), failed, reviewFailed, needsOwner, changes: results.filter(Boolean).map(r => `${r.num}: ${String(r.changes).slice(0, 240)}`) }
