// node --test: plan-init.mjs seeds an empty plan the other tools run on, and assemble-gaps.mjs --merge
// onto it (or onto no gaps.json at all). Fixture repos live under the OS temp folder.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const tool = name => path.join(HERE, name)

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-init-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim()
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  const r = f => fs.readFileSync(path.join(dir, f), 'utf8')
  const commit = m => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'commit', '-q', '-m', m); return git('rev-parse', 'HEAD') }
  const story = (id, parent, body) => `---\nid: ${id}\ntype: ${id.startsWith('EP') ? 'epic' : 'story'}\n${parent ? `parent: ${parent}\n` : ''}title: ${id}\nstatus: 1\n---\n${body}\n`
  git('init', '-q')
  w('plan/plan.config.json', JSON.stringify({ requirements: 'req' }, null, 2))
  w('req/stories/EP-01.md', story('EP-01', null, 'Epic.'))
  w('req/stories/US-01.1.1.md', story('US-01.1.1', 'EP-01', 'First.'))
  w('req/stories/US-01.1.2.md', story('US-01.1.2', 'EP-01', 'Other.'))
  w('req/questions/.keep', '')
  const seed = commit('seed')
  const run = (name, ...a) => spawnSync(process.execPath, [tool(name), ...a], { cwd: dir, encoding: 'utf8' })
  return { dir, git, w, r, commit, story, seed, run, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('plan-init seeds an empty plan in the shapes the tools read, and the tools run on it', () => {
  const f = repo()
  try {
    const out = f.run('plan-init.mjs', '--at', 'HEAD', '--first', '45', '--date', '2026-11-24')
    assert.equal(out.status, 0, out.stderr)
    const res = JSON.parse(out.stdout)
    assert.equal(res.commit, f.seed)
    assert.equal(res.firstPhase, '45')
    assert.equal(res.notes, undefined, 'no index warnings, nothing left over')
    assert.deepEqual(JSON.parse(f.r('plan/plan.json')), { commit: f.seed, phases: [], parked: [], sequencing_rules: '', milestones: [] })
    const gaps = JSON.parse(f.r('plan/gaps.json'))
    assert.equal(gaps.catalogue_commit, f.seed)
    assert.equal(gaps.seeded, f.seed)
    for (const k of ['items', 'epics', 'themes', 'dataModelDeltas', 'reverseFindings', 'excluded']) assert.deepEqual(gaps[k], [], k)
    assert.deepEqual(JSON.parse(f.r('plan/units.json')), [])
    assert.deepEqual(JSON.parse(f.r('plan/status.json')), { done: [], in_progress: [], next: { phases: [], note: 'No phase planned.' }, guidance: {} })
    assert.match(f.r('plan/analysis/domain-model-delta.md'), /DM-01/)
    assert.match(f.r('plan/ROADMAP.md'), /^## Owner decisions$/m)
    assert.match(f.r('plan/README.md'), /^## Update history$/m)
    assert.match(f.r('plan/index.html'), /0 of 0 phases done/)
    // --first lands in the config, other keys and indent kept.
    assert.equal(f.r('plan/plan.config.json'), JSON.stringify({ requirements: 'req', firstPhase: '45' }, null, 2) + '\n')

    // The update tools run cleanly on it.
    f.commit('plan seeded')
    f.w('req/stories/US-01.1.1.md', f.story('US-01.1.1', 'EP-01', 'Second.'))
    const head = f.commit('change one story')
    const state = f.run('plan-state.mjs', '--to', head)
    assert.equal(state.status, 0, state.stderr)
    const s = JSON.parse(state.stdout)
    assert.equal(s.baseline, f.seed)
    assert.deepEqual(s.changedItems.map(c => c.id), ['US-01.1.1'])
    assert.deepEqual([s.phases, s.builtPhases, s.units], [[], [], 0])
    assert.equal(s.coverage.ok, true)
    assert.deepEqual(s.analysis, { missingMaps: ['app'], deltaMissing: false })
    assert.equal(f.run('plan-state.mjs', '--coverage').status, 0)
    const ids = f.run('regrade-ids.mjs', head, '--ids-only')
    assert.equal(ids.status, 0, ids.stderr)
    assert.equal(ids.stdout.trim(), 'US-01.1.1')
    const index = f.run('build-index.mjs')
    assert.equal(index.status, 0, index.stderr)
    assert.equal(index.stderr.trim(), '', 'build-index warns about nothing')
  } finally { f.cleanup() }
})

test('plan-init refuses to overwrite a plan unless --force, and never overwrites ROADMAP.md or README.md', () => {
  const f = repo()
  try {
    assert.equal(f.run('plan-init.mjs', '--at', 'HEAD', '--no-index').status, 0)
    f.w('plan/ROADMAP.md', 'owner text\n')
    f.w('plan/units.json', '["US-01.1.1"]')
    const again = f.run('plan-init.mjs', '--at', 'HEAD')
    assert.equal(again.status, 1)
    assert.match(again.stderr, /already has plan\.json.*Nothing was written/)
    assert.equal(f.r('plan/units.json'), '["US-01.1.1"]', 'nothing changed')
    const forced = f.run('plan-init.mjs', '--at', 'HEAD', '--force', '--no-index')
    assert.equal(forced.status, 0, forced.stderr)
    assert.equal(f.r('plan/units.json'), '[]')
    assert.equal(f.r('plan/ROADMAP.md'), 'owner text\n')
    assert.deepEqual(JSON.parse(forced.stdout).kept, ['plan/ROADMAP.md', 'plan/README.md'])
    // Bad arguments stop before anything is written.
    assert.equal(f.run('plan-init.mjs').status, 2)
    assert.equal(f.run('plan-init.mjs', '--at', 'no-such-ref', '--force').status, 2)
    assert.equal(f.run('plan-init.mjs', '--at', 'HEAD', '--first', '4a', '--force').status, 2)
  } finally { f.cleanup() }
})

/** A gap-analysis journal grading only US-01.1.1 (Partial) in EP-01. */
function journal(f) {
  const item = { id: 'US-01.1.1', verdict: 'Partial', summary: 's', requirement_says: 'r', prototype_does: 'p', missing_or_wrong: ['m'], evidence: [], surfaces: ['ui'], size: 'S', confidence: 'high', demo_trigger: '', verify_outcome: 'upheld', verify_note: '' }
  const lines = [
    { type: 'started', agentId: 'a1', label: 'review:EP-01' }, { type: 'result', agentId: 'a1', result: { items: [item], epic_observations: '' } },
    { type: 'started', agentId: 'a2', label: 'verify:EP-01' }, { type: 'result', agentId: 'a2', result: { items: [item], epic_observations: '' } },
  ]
  const file = path.join(f.dir, 'journal.jsonl')
  fs.writeFileSync(file, lines.map(l => JSON.stringify(l)).join('\n') + '\n')
  return file
}

test('assemble-gaps --merge onto a seeded plan leaves items not graded since the seed out quietly', () => {
  const f = repo()
  try {
    assert.equal(f.run('plan-init.mjs', '--at', 'HEAD', '--no-index').status, 0)
    const out = f.run('assemble-gaps.mjs', journal(f), f.seed, '2026-11-25', '--merge')
    assert.equal(out.status, 0, out.stderr)
    const res = JSON.parse(out.stdout)
    assert.deepEqual(res.problems, [])
    assert.equal(res.notGradedSinceSeed, 2, 'EP-01 and US-01.1.2')
    assert.equal(res.units, 1)
    const gaps = JSON.parse(f.r('plan/gaps.json'))
    assert.equal(gaps.seeded, f.seed, 'the seed is carried forward')
    assert.deepEqual(gaps.items.map(i => i.id), ['US-01.1.1'])
    assert.deepEqual(JSON.parse(f.r('plan/units.json')), ['US-01.1.1'])
    assert.match(f.r('plan/GAP-ANALYSIS.md'), /seeded empty at `.{7}`/)
  } finally { f.cleanup() }
})

test('assemble-gaps --merge with no gaps.json merges onto nothing instead of failing', () => {
  const f = repo()
  try {
    const out = f.run('assemble-gaps.mjs', journal(f), f.seed, '2026-11-25', '--merge')
    assert.equal(out.status, 0, out.stderr)
    assert.match(out.stderr, /does not exist yet/)
    const res = JSON.parse(out.stdout)
    assert.deepEqual(res.problems, ['EP-01 not graded', 'US-01.1.2 not graded'])
    assert.equal(JSON.parse(f.r('plan/gaps.json')).seeded, undefined)
  } finally { f.cleanup() }
})
