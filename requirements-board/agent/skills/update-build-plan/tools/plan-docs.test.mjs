// node --test <tools>/plan-docs.test.mjs
// The pure readers of the plan's Markdown: decision gates and the kick-off prompt checks.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decisionsGating, gates, loadsRunner, runsCaptureStep, staleRoots } from './plan-docs.mjs'

test('a decision gates a phase by number, letter, range or "all"', () => {
  assert.ok(gates('15b, 28 to 32', '15b'))
  assert.ok(gates('15b, 28 to 32', '30'))
  assert.ok(gates('all', 'U2'))
  assert.ok(!gates('28 to 32', '33'))
  const roadmap = '| D1 | one | 21 | x |\n| D2 | two | 22 to 24 | y |\nprose'
  assert.deepEqual(decisionsGating(roadmap, '23'), ['| D2 | two | 22 to 24 | y |'])
})

test('a prompt loads the runner skill only by its whole name', () => {
  const slim = 'Please run Phase 21a.\n\nLoad the run-build-phase skill and follow it for this phase.'
  assert.ok(loadsRunner(slim, 'run-build-phase'))
  assert.ok(!loadsRunner('Load the run-build-phase-old skill.', 'run-build-phase'))
  assert.ok(!loadsRunner('Load my-run-build-phase.', 'run-build-phase'))
  assert.ok(!loadsRunner(slim, null), 'no runner configured: nothing loads it')
})

test('the capture step: run by the prompt, or by the runner skill it loads', () => {
  const old = 'When done: in requirements-board/, node scripts/capture.ts --dry, then a full npm run capture.'
  const slim = 'Load the run-build-phase skill and follow it for this phase.'
  assert.ok(runsCaptureStep(old, null))
  assert.ok(runsCaptureStep(old, 'run-build-phase'))
  assert.ok(runsCaptureStep(slim, 'run-build-phase'))
  assert.ok(!runsCaptureStep(slim, null), 'without a runner configured, a slim prompt never captures')
  assert.ok(!runsCaptureStep('When done: run the checklist.', 'run-build-phase'))
})

test('stale repo roots: home-folder paths that are not the checkout (or a sibling worktree of it)', () => {
  const root = '/Users/me/Dev Work/Project'
  const prompt = [
    `Repo root: ${root} (quote paths).`,
    `Read "${root}/docs/plan.md".`,
    `Your worktree: ${root}-U2 on branch ui/u2.`,
    'Old root: /Users/me/Local Dev/Project Old (folder names contain spaces).',
    'Also /home/ci/checkout/x.md',
    `Not the root: ${root}Extra/file.md`,
    'Old root again: /Users/me/Local Dev/Project Old (folder names contain spaces).',
  ].join('\n')
  assert.deepEqual(staleRoots(prompt, root), [
    '/Users/me/Local Dev/Project Old (folder names contain spaces',
    '/home/ci/checkout/x.md',
    `${root}Extra/file.md`,
  ])
  assert.deepEqual(staleRoots('Load the run-build-phase skill.', root), [])
})
