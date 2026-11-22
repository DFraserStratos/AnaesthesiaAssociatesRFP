// node --test: apply-plan-update.mjs on throwaway plan folders (B12: R-18, the D-08 guard).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'apply-plan-update.mjs')
const OLD = 'a'.repeat(40)
const NEW = 'b'.repeat(40)

function fixture({ label, newSlug, status, config = {}, writeNew = true }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-plan-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  w('plan/plan.config.json', JSON.stringify(config))
  w('plan/plan.json', JSON.stringify({ commit: OLD, phases: [
    { num: '29', slug: 'availability-calendar', title: 'Calendar', covers: [], file: 'phases/phase-29-availability-calendar.md' },
    { num: '30', slug: 'reports', title: 'Reports', covers: [], file: 'phases/phase-30-reports.md' },
  ] }))
  w('plan/phases/phase-29-availability-calendar.md', `# Phase 29\n\nDrift check: plan-state.mjs --diff, baseline ${OLD}\n`)
  w('plan/phases/phase-30-reports.md', `# Phase 30\n\nDrift check: baseline ${OLD}\n`)
  if (writeNew) w(`plan/phases/phase-29-${newSlug}.md`, `# Phase 29 new\n\nDrift check: baseline ${OLD}\n`)
  if (status) w('plan/status.json', JSON.stringify(status))
  const outline = { phases: [
    { num: '29', slug: newSlug, title: 'New 29', covers: [], goal: 'g' },
    { num: '30', slug: 'reports', title: 'Reports', covers: [], goal: 'g' },
  ] }
  w('j.jsonl', [JSON.stringify({ type: 'started', agentId: '1', label }), JSON.stringify({ type: 'result', agentId: '1', result: outline })].join('\n') + '\n')
  const run = (...extra) => spawnSync(process.execPath, [TOOL, '--plan', 'plan', 'j.jsonl', NEW, ...extra], { cwd: dir, encoding: 'utf8' })
  const plan = () => JSON.parse(fs.readFileSync(path.join(dir, 'plan/plan.json'), 'utf8'))
  return { dir, run, plan, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('a fresh-plan remake that reuses a number with a new slug points plan.json at the new doc and reports the old (R-18)', () => {
  const f = fixture({ label: 'architect', newSlug: 'ledger-core' })
  try {
    const r = f.run()
    const byNum = Object.fromEntries(f.plan().phases.map(p => [p.num, p.file]))
    assert.equal(byNum['29'], 'phases/phase-29-ledger-core.md', r.stderr)
    assert.equal(byNum['30'], 'phases/phase-30-reports.md')
    assert.match(r.stderr, /phases\/phase-29-availability-calendar\.md/)
    assert.match(r.stderr, /phases\/phase-29-ledger-core\.md/)
    // Warn only (B12-Q6): the old doc is left where it was.
    assert.ok(fs.existsSync(path.join(f.dir, 'plan/phases/phase-29-availability-calendar.md')))
  } finally { f.cleanup() }
})

test('an update run keeps an existing phase\'s doc path even if the outline renames its slug', () => {
  const f = fixture({ label: 'architect:update', newSlug: 'calendar-v2' })
  try {
    const r = f.run()
    const byNum = Object.fromEntries(f.plan().phases.map(p => [p.num, p.file]))
    assert.equal(byNum['29'], 'phases/phase-29-availability-calendar.md', r.stderr)
    assert.doesNotMatch(r.stderr, /still in the plan folder/)
  } finally { f.cleanup() }
})

test('declared lanes the config names no branch for stop the run before anything is written (D-08 guard)', () => {
  const f = fixture({ label: 'architect:update', newSlug: 'availability-calendar', status: { guidance: { lanes: [{ name: 'Lane A', queue: ['29'] }] } } })
  try {
    const before = fs.readFileSync(path.join(f.dir, 'plan/plan.json'), 'utf8')
    const r = f.run()
    assert.equal(r.status, 2, r.stderr)
    assert.match(r.stderr, /Lane A/)
    assert.equal(fs.readFileSync(path.join(f.dir, 'plan/plan.json'), 'utf8'), before)
    assert.match(fs.readFileSync(path.join(f.dir, 'plan/phases/phase-30-reports.md'), 'utf8'), new RegExp(OLD))
    // --ignore-lanes runs it.
    const r2 = f.run('--ignore-lanes')
    assert.notEqual(r2.status, 2, r2.stderr)
    assert.equal(f.plan().commit, NEW)
  } finally { f.cleanup() }
})

test('a configured lane branch that does not exist also stops the run (D-08 guard)', () => {
  const f = fixture({ label: 'architect:update', newSlug: 'availability-calendar', config: { lanes: { branches: ['lane/missing'] } }, status: { guidance: { lanes: [{ name: 'Lane A', queue: ['29'] }] } } })
  try {
    const r = f.run()
    assert.equal(r.status, 2, r.stderr)
    assert.match(r.stderr, /lane\/missing/)
    assert.notEqual(f.run('--ignore-lanes').status, 2)
  } finally { f.cleanup() }
})

test('a renamed slug with no doc written at the new path keeps the old doc (an update applied without its outline label)', () => {
  const f = fixture({ label: 'architect:revise', newSlug: 'calendar-v2', writeNew: false })
  try {
    const r = f.run()
    const byNum = Object.fromEntries(f.plan().phases.map(p => [p.num, p.file]))
    assert.equal(byNum['29'], 'phases/phase-29-availability-calendar.md', r.stderr)
  } finally { f.cleanup() }
})
