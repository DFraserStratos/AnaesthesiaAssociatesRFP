// node --test: phase status (B12: R-14, R-17 / D-08). Fixture repos live under the OS temp folder.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { phaseStatus } from './config.mjs'

const tmp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix))

test('an IN PROGRESS phase with its session-1 entry is in progress, not built (R-14)', () => {
  const dir = tmp('plan-r14-')
  try {
    fs.mkdirSync(path.join(dir, 'plan'))
    fs.writeFileSync(path.join(dir, 'PROGRESS.md'), [
      '| 26 | Done one | DONE | 2026-11-18 |',
      '| 27 | Half built | IN PROGRESS | |',
      '',
      '### Catch-up Phase 26 · Done one (2026-11-18)',
      '### Catch-up Phase 27 · Half built (2026-11-19)',
      '### Catch-up Phase 28 · Entry only (2026-11-19)',
    ].join('\n'))
    const s = phaseStatus({ plan: 'plan', progress: 'PROGRESS.md', firstPhase: '14' }, dir)
    assert.deepEqual(s.built, ['26', '28'])
    assert.deepEqual(s.builtByEntry, ['26', '28'])
    assert.deepEqual(s.inProgress, ['27'])
    assert.deepEqual(s.keepBaseline, ['26', '27'])
    // Without a progress file, status.json's in_progress is not built either.
    fs.writeFileSync(path.join(dir, 'plan/status.json'), JSON.stringify({ done: ['01'], in_progress: ['02'] }))
    const bare = phaseStatus({ plan: 'plan', progress: null, firstPhase: '01' }, dir)
    assert.deepEqual([bare.built, bare.inProgress], [['01'], ['02']])
  } finally { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
})

/** A repo with master and two lane branches, in this plan's lane format. */
function laneRepo() {
  const dir = tmp('plan-lanes-')
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const write = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  const commit = msg => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'commit', '-q', '-m', msg) }
  git('init', '-q', '-b', 'master')
  const base = '| 26 | One | DONE | 2026-11-18 |\n'
  write('PROGRESS.md', base)
  write('plan/status.json', JSON.stringify({ guidance: { lanes: [{ name: 'Lane A', queue: ['27'] }, { name: 'Lane B', queue: ['33', '34'] }] } }))
  commit('start')
  git('branch', 'lane/a')
  git('branch', 'lane/b')
  // Lane A: 27 checkpointed (its IN PROGRESS row and session-1 entry written).
  git('switch', '-q', 'lane/a')
  write('PROGRESS.md', `${base}| 27 | Two | IN PROGRESS | |\n\n### Catch-up Phase 27 · Two (2026-11-19)\n`)
  write('app.txt', 'a')
  commit('27 checkpoint: session 1')
  // Lane B: 33 complete; 34 complete by commit only (its row not written yet).
  git('switch', '-q', 'lane/b')
  write('PROGRESS.md', `${base}| 33 | Three | DONE | 2026-11-19 |\n`)
  write('b.txt', 'b')
  commit('33 complete: done')
  write('b.txt', 'b2')
  commit('34 complete: done by commit')
  git('switch', '-q', 'master')
  return { dir, git, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('the update view counts lane-built and lane-checkpointed phases (R-17, D-08)', () => {
  const r = laneRepo()
  try {
    const c = { plan: 'plan', progress: 'PROGRESS.md', firstPhase: '14', lanes: { branches: ['lane/a', 'lane/b', 'lane/gone'] } }
    // Master's own view (the context pack's) is unchanged: only 26.
    const own = phaseStatus(c, r.dir)
    assert.deepEqual([own.built, own.inProgress], [['26'], []])
    assert.equal(own.lanes, undefined)
    const s = phaseStatus(c, r.dir, { lanes: true })
    assert.deepEqual(s.built.sort(), ['26', '33', '34'])
    assert.deepEqual(s.inProgress, ['27'])
    assert.deepEqual(s.keepBaseline.sort(), ['26', '27', '33', '34'])
    assert.deepEqual(s.builtByEntry.sort(), ['26', '33', '34'])
    assert.deepEqual(s.lanes.missing, ['lane/gone'])
    assert.deepEqual(s.lanes.unaccounted, [])
    assert.deepEqual(s.lanes.branches.map(b => [b.branch, b.built.sort(), b.partlyBuilt]), [['lane/a', ['26'], ['27']], ['lane/b', ['26', '33', '34'], []]])
  } finally { r.cleanup() }
})

test('declared lanes with no configured branches are reported as unaccounted (D-08 guard)', () => {
  const r = laneRepo()
  try {
    const s = phaseStatus({ plan: 'plan', progress: 'PROGRESS.md', firstPhase: '14' }, r.dir, { lanes: true })
    assert.deepEqual(s.lanes.unaccounted, ['Lane A', 'Lane B'])
    assert.deepEqual(s.built, ['26'])
  } finally { r.cleanup() }
})

test('inside a lane, the own-branch view reads that lane only and the update view skips itself', () => {
  const r = laneRepo()
  try {
    r.git('switch', '-q', 'lane/a')
    const c = { plan: 'plan', progress: 'PROGRESS.md', firstPhase: '14', lanes: { branches: ['lane/a', 'lane/b'] } }
    const own = phaseStatus(c, r.dir)
    assert.deepEqual([own.built, own.inProgress], [['26'], ['27']])
    const s = phaseStatus(c, r.dir, { lanes: true })
    assert.deepEqual(s.lanes.branches.map(b => b.branch), ['lane/b'])
  } finally { r.cleanup() }
})

test('custom subject patterns are honoured', () => {
  const r = laneRepo()
  try {
    const c = { plan: 'plan', progress: null, firstPhase: '14', lanes: { branches: ['lane/b'], complete: 'Done {id}:', checkpoint: 'Saved {id}:' } }
    const s = phaseStatus(c, r.dir, { lanes: true })
    assert.deepEqual(s.built, [])
  } finally { r.cleanup() }
})
