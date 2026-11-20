// node --test: plan-state.mjs --diff on a throwaway repo (B12: R-135).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plan-state.mjs')

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-state-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim()
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  const commit = m => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'commit', '-q', '-m', m); return git('rev-parse', 'HEAD') }
  git('init', '-q')
  w('plan/plan.config.json', JSON.stringify({ requirements: 'req' }))
  w('req/stories/US-01.1.1.md', '---\nid: US-01.1.1\nstatus: 1\n---\nFirst text.\n')
  const c1 = commit('one')
  w('req/stories/US-01.1.1.md', '---\nid: US-01.1.1\nstatus: 1\n---\nSecond text.\n')
  const c2 = commit('two')
  w('req/stories/US-01.1.1.md', '---\nid: US-01.1.1\nstatus: 1\n---\nThird text.\n')
  commit('three')
  w('plan/plan.json', JSON.stringify({ commit: c1, phases: [] }))
  const run = (...a) => spawnSync(process.execPath, [TOOL, '--plan', 'plan', ...a], { cwd: dir, encoding: 'utf8' })
  return { dir, c1, c2, run, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('--diff --from diffs from the stated baseline; bare --diff from plan.json\'s (R-135)', () => {
  const r = repo()
  try {
    const bare = r.run('--diff', 'US-01.1.1')
    assert.equal(bare.status, 0, bare.stderr)
    assert.match(bare.stdout, new RegExp(`^Drift since ${r.c1.slice(0, 7)} \\(working tree\\): US-01\\.1\\.1 \\(M\\)`))
    assert.match(bare.stdout, /^-First text\.$/m)
    const from = r.run('--diff', 'US-01.1.1', '--from', r.c2)
    assert.equal(from.status, 0, from.stderr)
    assert.match(from.stdout, new RegExp(`^Drift since ${r.c2.slice(0, 7)} \\(working tree\\)`))
    assert.match(from.stdout, /^-Second text\.$/m)
    assert.doesNotMatch(from.stdout, /First text/)
    assert.equal(r.run('--from', r.c2).status, 2, '--from needs --diff')
  } finally { r.cleanup() }
})
