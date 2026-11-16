// node --test <tools>/phase-context.test.mjs
// The pure parts of the context pack: which owner decisions gate a phase, how a progress-file entry is
// trimmed, when a number names a phase, and fitting a pack to its size budget.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decisionsGating, gates, BASELINE_LINE } from '../../update-build-plan/tools/plan-docs.mjs'
import { unifiedDiff } from '../../update-build-plan/tools/req-changes.mjs'
import {
  mentions, sectionOf, entryBlocks, entryLevels, linesNaming, decisionLogEntries, decisionsNamed,
  rulesFor, phaseRowsOnly, focusSection, docBaseline, diffIds, fitBudget, compactLinks,
  passageAt, parseRunOrder, runOrderPosition, statusEntriesNaming, sessionSplit, recipesBreaks,
} from './phase-context.mjs'

const ROADMAP = [
  '## Owner decisions',
  '',
  '| # | Decision | Gates | Answer |',
  '|---|---|---|---|',
  '| D1 | Fee basis (OQ-02) | 16 | **Answered.** Monthly. |',
  '| D2 | Holders | 18a, 20, 21 | Default: none. |',
  '| D3 | Ranges | 28 to 32 | Open. |',
  '| D4 | Everything | all | Applies everywhere. |',
  '| D5 | Letters | 15b, 28 to 32 | Open. |',
  'Not a row | D6 | 21a |',
].join('\n')

test('decision rows: a phase is gated by its number, a range that holds it, or "all"', () => {
  const ids = num => decisionsGating(ROADMAP, num).map(r => r.split('|')[1].trim())
  assert.deepEqual(ids('21'), ['D2', 'D4'])
  assert.deepEqual(ids('30'), ['D3', 'D4', 'D5'])
  assert.deepEqual(ids('21a'), ['D4'], 'a lettered phase is not its number')
  assert.deepEqual(ids('32b'), ['D3', 'D4', 'D5'], 'a lettered phase inside a range is gated')
  assert.deepEqual(ids('U2'), ['D4'], 'a track phase only by "all"')
  assert.equal(gates(' 15b, 28 to 32 ', '15b'), true)
  assert.equal(gates('16', '17'), false)
})

test('a plain number names a phase only where it reads as one', () => {
  const yes = ['**27:** prepaid acts', "27's seam", '(16 fee run, 21, 27, 31 to 33)', 'Phase 27 is not built', 'runs after 27.']
  const no = ['Smith Mon 27 with', '26 to 27', '27 Oct', '2026-11-27', 'US-03.27', 'D27', '$27', '27 tests', 'line 27', 'PERSIST_VERSION 26 to 27']
  for (const t of yes) assert.equal(mentions(t, '27'), true, t)
  for (const t of no) assert.equal(mentions(t, '27'), false, t)
  assert.equal(mentions('**27 and 27a:** extend', '27a'), true)
  assert.equal(mentions('U2 and U3', 'U2'), true)
  assert.equal(mentions('U22', 'U2'), false)
})

const ENTRY = [
  '### Catch-up Phase 20 · One thing per item (2026-11-11)',
  '',
  'Intro sentence. It mentions 21a once.',
  '',
  '**Drift check.** Nothing changed.',
  '',
  `**Built.** ${'Lots of detail. '.repeat(400)}`,
  '- a bullet that names 21a and',
  '  wraps onto a second line.',
  '- a bullet that does not.',
  '',
  '**Tests.** 2,000 green.',
  '',
  '**Handoffs:**',
  '- **21:** the payer.',
  '- **21a:** the audit drives the flag; a stored',
  '  non-candidate is kept and flagged.',
  '',
  "**For the owner's review:**",
  '- Defaults built: one.',
].join('\n')

test('a progress entry splits into its bold-label blocks', () => {
  assert.deepEqual(entryBlocks(ENTRY).map(b => b.label), ['', 'Drift check', 'Built', 'Tests', 'Handoffs', "For the owner's review"])
})

test('a long entry keeps its handoff and owner parts and the passages naming the phase', () => {
  const [l0, l1, l2] = entryLevels(ENTRY, '21a', { fullBytes: 2000 })
  assert.ok(l0.length < ENTRY.length)
  for (const l of [l0, l1]) {
    assert.match(l, /\*\*Handoffs:\*\*/)
    assert.match(l, /- \*\*21:\*\* the payer/, 'a handoff block is kept whole')
    assert.match(l, /For the owner's review/)
  }
  assert.match(l0, /names 21a and wraps onto a second line/, 'a wrapped bullet is one passage')
  assert.doesNotMatch(l0, /does not\./)
  assert.doesNotMatch(l0, /Lots of detail/)
  assert.match(l0, /Left out: Drift check; Tests/)
  assert.doesNotMatch(l2, /the payer/, 'level 2 keeps only what names the phase')
  assert.match(l2, /21a:\*\* the audit drives the flag; a stored non-candidate is kept and flagged/)
  assert.ok(l2.length < l1.length && l1.length <= l0.length)
  assert.equal(entryLevels(ENTRY, '21a', { fullBytes: 1e6 })[0], ENTRY.trimEnd(), 'a short entry is kept whole')
})

test('linesNaming cuts a long paragraph to its sentences naming the phase', () => {
  const para = `${'Filler sentence here. '.repeat(80)}Phase 22 reads it. ${'More filler. '.repeat(20)}`
  assert.equal(linesNaming(para, '22')[0], 'Phase 22 reads it.')
})

test('Decisions-log entries are found by date and title words', () => {
  const log = [
    '## Decisions log',
    '',
    '- **2026-07-23 · Phase 07 build — decisions.** (1) one.',
    '- **2026-07-23 · Phase 08 build — decisions.** (1) two.',
    '  continued.',
    '- **2026-07-28 · Invoice preview centred with a sticky information rail** (the why).',
  ].join('\n')
  const entries = decisionLogEntries(log, 100)
  assert.deepEqual(entries.map(e => [e.date, e.line]), [['2026-07-23', 102], ['2026-07-23', 103], ['2026-07-28', 105]])
  assert.match(entries[1].text, /continued/)
  const doc = 'Decisions log: **2026-07-23 Phase 08 build\ndecisions** (2) and **2026-07-28 Invoice preview centred with a sticky information rail** (kept). Split on 2026-07-23 for other reasons.'
  assert.deepEqual(decisionsNamed(doc, entries).map(e => e.title), ['Phase 08 build — decisions', 'Invoice preview centred with a sticky information rail'])
})

test('sequencing rules: those naming the phase and the always-on ones, up to the history', () => {
  const sec = [
    '## Sequencing rules',
    '',
    '- **Track A runs in order: 18, 20, 21a.**',
    '  - 21a after 21.',
    '- **Track B:** 30 then 31.',
    '- **Every phase closes the same way:**',
    '  - green builds.',
    '',
    '**Placement notes for an old update.**',
    '- **21a** was moved here.',
  ].join('\n')
  assert.deepEqual(rulesFor(sec, '21a', ['Every phase']).map(r => r.label), ['Track A runs in order: 18, 20, 21a.', 'Every phase closes the same way:'])
})

test('a phase table keeps only its own row; a long passage about other phases is cut to what names this one', () => {
  const t = ['| Phase | Items |', '|---|---|', '| 21a | mine |', '| 33, 33a | theirs |', '| 40 | theirs |', '| Note | kept |'].join('\n')
  assert.deepEqual(phaseRowsOnly(t, '21a').split('\n'), ['| Phase | Items |', '|---|---|', '| 21a | mine |', '| 33, 33a | theirs |', '| Note | kept |'])
  const phases = ['18', '20', '21', '21a', '22', '24']
  const general = `- **Each phase patches the beats it breaks.** ${'A general rule with no phase in it. '.repeat(40)}`
  const list = `- **Known beats:** 18 the cheat sheet; 20 the rail; 21 the payer; 21a the capture; 24 the price. ${'More. '.repeat(200)}`
  const out = focusSection(`${general}\n\n${list}`, '21a', 900, phases)
  assert.ok(out.includes(general), 'a general rule is kept whole')
  assert.match(out, /21a the capture/)
  assert.doesNotMatch(out, /20 the rail/)
})

test('the drift baseline is the first commit on a baseline line of the drift section', () => {
  const doc = [
    '# Phase 21a',
    'Status at catalogue `efe123c`.',
    '## Before you start: drift check',
    '1. Run the catalogue diff against the plan\'s baseline, catalogue commit `fbdd555`:',
    '   node tools/plan-state.mjs --diff FT-03.6,US-03.6.1, OQ-99',
    '   At the update (`a68f09b..efe123c`) the changes were ...',
    '## Reference',
  ].join('\n')
  assert.deepEqual(docBaseline(doc, BASELINE_LINE), { sha: 'fbdd555', line: "1. Run the catalogue diff against the plan's baseline, catalogue commit `fbdd555`:" })
  assert.equal(docBaseline(doc, BASELINE_LINE, sha => sha !== 'fbdd555')?.sha ?? null, null, 'only real commits count')
  assert.deepEqual(diffIds(doc), ['FT-03.6', 'US-03.6.1', 'OQ-99'])
  assert.equal(sectionOf(doc, 'Before you start').line, 3)
})

test('links read as their text and target id', () => {
  assert.equal(compactLinks('the [pricing kind](US-04.2.2) and [a note](../notes/x.md)'), 'the pricing kind (US-04.2.2) and a note')
})

test('fitting the budget cuts in the given order, largest first, and says what it cut', () => {
  const p = (key, group, ...sizes) => ({ key, group, label: key, levels: sizes.map(n => 'x'.repeat(n)) })
  const parts = [p('fixed', 'fixed', 500), p('entryA', 'progress', 300, 100, 10), p('entryB', 'progress', 200, 50, 10), p('item', 'catalogue', 400, 100)]
  const steps = [['progress', 1], ['catalogue', 1], ['progress', 2]]
  let fit = fitBudget(parts.map(x => ({ ...x })), 1250, steps)
  assert.deepEqual(fit.parts.map(x => x.level), [0, 1, 0, 0], 'only the largest progress part is cut')
  assert.equal(fit.size, 1200)
  assert.equal(fit.over, false)
  assert.deepEqual(fit.trimmed, ['entryA (0.3 to 0.1 KB)'])
  fit = fitBudget(parts.map(x => ({ ...x })), 800, steps)
  assert.deepEqual(fit.parts.map(x => x.level), [0, 1, 1, 1], 'every progress part is cut once before the catalogue')
  fit = fitBudget(parts.map(x => ({ ...x })), 100, steps)
  assert.deepEqual(fit.parts.map(x => x.level), [0, 2, 2, 1])
  assert.equal(fit.over, true, 'a group no step names is never cut')
})

test('the drift diff is computed in process, deletions before additions', () => {
  assert.equal(unifiedDiff('a\nb\nc\n', 'a\nB\nc\n', 1), '@@ -1,3 +1,3 @@\n a\n-b\n+B\n c')
  assert.equal(unifiedDiff('same\n', 'same\n'), '')
})

const PHASES = [
  ['20', 'Contracts'], ['21', 'Contracts'], ['U1', 'UI'], ['U2', 'UI'], ['U3', 'UI'], ['21a', 'Contracts'], ['22', 'Billing'],
  ['33', 'Intake'], ['33a', 'Intake'], ['34', 'Intake'], ['40', 'Patients'], ['40a', 'Patients'], ['41', 'Money'], ['U7', 'UI'], ['44', 'Demo'],
].map(([num, track]) => ({ num, track }))

test('the run order: a statement found by its marker, read into steps, ranges and tracks expanded', () => {
  const sec = [
    '## Sequencing rules',
    '',
    '- **The track is kept.**',
    '  - **Run order.** 21, then U1, then U2 and U3 side by side, then 21a and',
    '    22, then Intake and 40 to 41, then U7, then 44. A U phase never runs beside one.',
    '  - **Other.** 22 after 21a.',
  ].join('\n')
  const text = passageAt(sec, '**Run order.**')
  assert.equal(text, '**Run order.** 21, then U1, then U2 and U3 side by side, then 21a and 22, then Intake and 40 to 41, then U7, then 44. A U phase never runs beside one.')
  assert.equal(passageAt(sec, 'nowhere'), null)
  const ro = parseRunOrder(text, PHASES)
  assert.deepEqual(ro.steps, [['21'], ['U1'], ['U2', 'U3'], ['21a', '22'], ['33', '33a', '34', '40', '40a', '41'], ['U7'], ['44']])
  assert.deepEqual(runOrderPosition(ro, '21a'), { previous: 'U3', next: '22', previousStep: ['U2', 'U3'], sameStep: ['22'], nextStep: ['33', '33a', '34', '40', '40a', '41'] })
  assert.equal(runOrderPosition(ro, '34', new Set(['40'])).next, '40a', 'the next phase skips built ones')
  assert.equal(runOrderPosition(ro, '44').next, null)
  assert.equal(runOrderPosition(ro, '20'), null, 'a phase the statement does not name')
  assert.deepEqual(parseRunOrder('Run order from here: 20 to 22, then 44 (US-01.1.5 parked)', PHASES).order, ['20', '21', '21a', '22', '44'], 'a numbered range skips track phases; catalogue ids are not phases')
})

test('the plan page entries naming a phase or the next one, verbatim', () => {
  const status = {
    in_progress: [],
    next: { phases: ['U1'], note: 'U1 on its own, then U2 and U3, all before 21a.' },
    guidance: { as_of: '2026-11-16', headline: 'Start U1 now.', parallel: 'Only U1.', safe: { U1: 'Its dependency is done.' }, wait: { '22': 'Needs 21a.', '26': 'Runs after 25.', '21a': 'Needs U2 and U3.' } },
  }
  assert.deepEqual(statusEntriesNaming(status, ['21a', '22']), [['next', status.next], ['guidance.wait.22', 'Needs 21a.'], ['guidance.wait.21a', 'Needs U2 and U3.']])
  assert.deepEqual(statusEntriesNaming({ ...status, in_progress: ['40'] }, ['40']).map(e => e[0]), ['in_progress'])
})

test('the phase doc: its session split and the recipes it breaks', () => {
  const doc = [
    '**Depends on:** 21.',
    '**Estimated:** 2 sessions. **Session 1** is items 1 to 6; ends green.',
    'Then **Session 2** is items 7 to 13.',
    '',
    '## Work items',
    '',
    '**Session 1: the rule, the form.**',
    '1. one',
    '**Session 2: the review.**',
    '',
    '## Catalogue screenshots',
    '',
    '| Item | Now |',
    '',
    '**Recipes this phase breaks.**',
    '- Recipes that shoot the review table.',
    '- Any that read "handover".',
    '',
    '**ATLAS.md.** Update the seed section.',
  ].join('\n')
  assert.deepEqual(sessionSplit(doc), { estimated: '**Estimated:** 2 sessions. **Session 1** is items 1 to 6; ends green. Then **Session 2** is items 7 to 13.', heads: ['Session 1: the rule, the form', 'Session 2: the review'] })
  assert.equal(recipesBreaks(doc), '**Recipes this phase breaks.**\n- Recipes that shoot the review table.\n- Any that read "handover".')
  assert.deepEqual(sessionSplit('# none'), { estimated: null, heads: [] })
  assert.equal(recipesBreaks('# none'), null)
})
