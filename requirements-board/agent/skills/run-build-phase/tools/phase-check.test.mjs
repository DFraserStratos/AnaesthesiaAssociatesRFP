// node --test: phase-check.mjs end to end on throwaway repos (B12: R-15, R-136, R-137).
// Each fixture is a temp git repo with a plan.config.json whose checks are tiny `node -e` commands, so the
// runs take well under a second and leave nothing behind in this repo.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'phase-check.mjs')

/** A temp repo with `plan/plan.config.json` holding `runner`. Returns { dir, run, last, cleanup }. */
function fixture(runner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-check-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  fs.mkdirSync(path.join(dir, 'plan'))
  fs.writeFileSync(path.join(dir, 'plan', 'plan.config.json'), JSON.stringify({ runner }))
  const run = (...args) => {
    const r = spawnSync(process.execPath, [TOOL, '--plan', 'plan', ...args], { cwd: dir, encoding: 'utf8', timeout: 30_000 })
    return { code: r.status, out: `${r.stdout}${r.stderr}` }
  }
  const last = () => JSON.parse(fs.readFileSync(path.join(dir, '.build-phase', 'last.json'), 'utf8'))
  return { dir, run, last, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

// A check that fails while the file `fail-<name>` exists in the repo root, and appends its name to order.txt.
const flag = name => `node -e "require('fs').appendFileSync('order.txt','${name}\\n');process.exit(require('fs').existsSync('fail-${name}')?1:0)"`
const slow = name => `node -e "setTimeout(()=>{require('fs').appendFileSync('order.txt','${name}\\n')},300)"`

test('--failed remembers a full-gate failure across a --changed run (R-15)', () => {
  const f = fixture({ checks: [
    { name: 'build', cmd: flag('build') },
    { name: 'vitest', cmd: flag('vitest'), changed: flag('vitest') },
  ] })
  try {
    fs.writeFileSync(path.join(f.dir, 'fail-build'), '')
    assert.equal(f.run().code, 1)
    // The quick inner loop: build has no changed form (OMIT), vitest passes in its quick form.
    const partial = f.run('--changed')
    assert.equal(partial.code, 0, partial.out)
    assert.match(partial.out, /GREEN \(PARTIAL/)
    // --failed must still re-run build, not report "nothing failed".
    const again = f.run('--failed')
    assert.doesNotMatch(again.out, /nothing failed/, again.out)
    assert.match(again.out, /FAIL\s+build/)
    // build fixed and passing in full form (by --only) clears it.
    fs.rmSync(path.join(f.dir, 'fail-build'))
    assert.equal(f.run('--only', 'build').code, 0)
    const none = f.run('--failed')
    assert.equal(none.code, 0)
    assert.match(none.out, /nothing failed/)
  } finally { f.cleanup() }
})

test('a pre-B12 last.json is read, and the merged file keeps the shape old tools read (R-15)', () => {
  const f = fixture({ checks: [{ name: 'build', cmd: flag('build') }, { name: 'lint', cmd: flag('lint') }] })
  try {
    fs.mkdirSync(path.join(f.dir, '.build-phase'))
    // As the pre-B12 tool wrote it: no per-result form.
    fs.writeFileSync(path.join(f.dir, '.build-phase', 'last.json'), JSON.stringify({ at: '2026-11-19T00:00:00.000Z', changed: false, results: [
      { name: 'build', status: 'FAIL', ms: 10, note: 'exit 1', log: '.build-phase/logs/build.log' },
      { name: 'lint', status: 'PASS', ms: 10, note: '', log: '.build-phase/logs/lint.log' },
    ] }))
    const r = f.run('--failed')
    assert.equal(r.code, 0, r.out)
    assert.match(r.out, /PASS\s+build/)
    assert.doesNotMatch(r.out, /lint/)
    const last = f.last()
    assert.equal(typeof last.at, 'string')
    assert.equal(typeof last.changed, 'boolean')
    // Every check still has a record (lint kept from the old file), each with name and status.
    assert.deepEqual(last.results.map(x => [x.name, x.status]), [['build', 'PASS'], ['lint', 'PASS']])
  } finally { f.cleanup() }
})

test('an alias in needs schedules like the canonical name (R-136)', () => {
  const f = fixture({ maxParallel: 4, checks: [
    { name: 'typecheck', aliases: ['tsc'], cmd: slow('typecheck') },
    { name: 'build', cmd: flag('build'), needs: ['tsc'] },
  ] })
  try {
    assert.equal(f.run().code, 0)
    assert.deepEqual(fs.readFileSync(path.join(f.dir, 'order.txt'), 'utf8').trim().split('\n'), ['typecheck', 'build'])
    // And a failed alias dependency skips the dependent.
    const g = fixture({ checks: [
      { name: 'typecheck', aliases: ['tsc'], cmd: flag('typecheck') },
      { name: 'build', cmd: flag('build'), needs: ['tsc'] },
    ] })
    try {
      fs.writeFileSync(path.join(g.dir, 'fail-typecheck'), '')
      const r = g.run()
      assert.equal(r.code, 1)
      assert.match(r.out, /SKIP\s+build/)
      assert.deepEqual(fs.readFileSync(path.join(g.dir, 'order.txt'), 'utf8').trim().split('\n'), ['typecheck'])
    } finally { g.cleanup() }
  } finally { f.cleanup() }
})

test('a dependency cycle is a config error in every mode, before the lock (R-137)', () => {
  const f = fixture({ checks: [
    { name: 'a', cmd: flag('a'), needs: ['b'] },
    { name: 'b', cmd: flag('b'), after: ['a'] },
    { name: 'c', cmd: flag('c') },
  ] })
  try {
    for (const args of [[], ['--list'], ['--only', 'c'], ['--changed']]) {
      const r = f.run(...args)
      assert.equal(r.code, 2, `${args.join(' ')}: ${r.out}`)
      assert.match(r.out, /cycle/i)
      assert.match(r.out, /\ba\b/)
      assert.match(r.out, /\bb\b/)
    }
    fs.mkdirSync(path.join(f.dir, '.build-phase'), { recursive: true })
    fs.writeFileSync(path.join(f.dir, '.build-phase', 'last.json'), JSON.stringify({ at: '', changed: false, results: [{ name: 'a', status: 'FAIL' }] }))
    assert.equal(f.run('--failed').code, 2)
    assert.notEqual(f.run('--stop-servers').code, 2, '--stop-servers runs no checks, so a cycle does not block it')
    assert.equal(fs.existsSync(path.join(f.dir, '.build-phase', 'lock')), false)
    assert.equal(fs.existsSync(path.join(f.dir, 'order.txt')), false, 'nothing started')
  } finally { f.cleanup() }
})

test('the live schedule shape still lists and runs: needs, after, aliases in --only', () => {
  const f = fixture({ checks: [
    { name: 'typecheck', aliases: ['tsc'], cmd: flag('typecheck'), changed: true },
    { name: 'build', cmd: flag('build'), needs: ['typecheck'] },
    { name: 'vitest', aliases: ['test'], cmd: flag('vitest') },
    { name: 'shots', cmd: flag('shots'), after: ['vitest', 'build'] },
  ] })
  try {
    const list = f.run('--list')
    assert.equal(list.code, 0)
    assert.match(list.out, /wave 1/)
    assert.match(list.out, /build.*\[needs typecheck\]/)
    assert.match(list.out, /shots.*\[after vitest, after build\]/)
    const only = f.run('--only', 'build')
    assert.equal(only.code, 0)
    assert.match(only.out, /PASS\s+typecheck/)
    assert.equal(f.run('--only', 'nope').code, 2)
  } finally { f.cleanup() }
})
