// node --test: regrade-ids.mjs on a throwaway catalogue (B12: R-16, R-138, R-164).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'regrade-ids.mjs')

const item = (id, { parent = null, status = '1', lane = null, body = 'Text.', affects = null } = {}) => [
  '---', `id: ${id}`, ...(parent ? [`parent: ${parent}`] : []), `status: ${status}`, ...(lane ? [`swimlane: ${lane}`] : []),
  ...(affects ? ['affects:', ...affects.map(a => `  - ${a}`)] : []), '---', body, '',
].join('\n')

function repo({ extra = 0 } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'regrade-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim()
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  const s = (id, o) => w(`req/stories/${id}.md`, item(id, o))
  const commit = m => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'commit', '-q', '-m', m); return git('rev-parse', 'HEAD') }
  git('init', '-q')
  w('plan/plan.config.json', JSON.stringify({ requirements: 'req', outOfScopeLanes: ['Future Work'] }))
  s('EP-01'); s('FT-01.1', { parent: 'EP-01' })
  s('US-01.1.1', { parent: 'FT-01.1', lane: 'Future Work' })
  s('US-01.1.2', { parent: 'FT-01.1', lane: 'Now' })
  s('US-01.1.3', { parent: 'FT-01.1', lane: 'Now' })
  s('US-01.1.4', { parent: 'FT-01.1', lane: 'Now' })
  s('US-01.1.5', { parent: 'FT-01.1', lane: 'Now' })
  s('US-01.1.6', { parent: 'FT-01.1', lane: 'Now' })
  s('FT-02.1', { parent: 'EP-01' })
  s('US-02.1.1', { parent: 'FT-02.1', lane: 'Future Work' })
  for (let i = 1; i <= extra; i++) s(`US-03.1.${i}`, { lane: 'Now' })
  w('req/questions/OQ-01.md', item('OQ-01', { affects: ['US-01.1.4'] }))
  const base = commit('base')
  s('US-01.1.1', { parent: 'FT-01.1', lane: 'Now' }) // dragged out of the out-of-scope lane, nothing else
  s('US-01.1.2', { parent: 'FT-01.1', lane: 'Future Work' }) // dragged into it
  s('US-01.1.3', { parent: 'FT-01.1', lane: 'Next' }) // between two in-scope lanes
  s('US-01.1.4', { parent: 'FT-01.1', lane: 'Now', status: '5' }) // retired after the baseline
  s('US-02.1.1', { parent: 'FT-02.1', lane: 'Now' }) // its feature comes into scope
  w('req/questions/OQ-01.md', item('OQ-01', { affects: ['US-01.1.6'], body: 'Answered.' }))
  for (let i = 1; i <= extra; i++) s(`US-03.1.${i}`, { lane: 'Now', body: i % 2 ? 'Edited.' : 'Text.', status: i % 2 ? '1' : '2' })
  commit('change')
  // Uncommitted edits that must not change the answer for the committed ref.
  w('req/questions/OQ-01.md', item('OQ-01', { affects: ['US-01.1.5'], body: 'Changed again.' }))
  s('US-01.1.3', { parent: 'FT-01.1', lane: 'Next', status: '5' })
  w('plan/plan.json', JSON.stringify({ commit: base, phases: [] }))
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('re-grade reads the target commit and catches scope moves (R-16, R-138)', () => {
  const r = repo()
  try {
    const p = spawnSync(process.execPath, [TOOL, '--plan', 'plan', 'HEAD'], { cwd: r.dir, encoding: 'utf8' })
    assert.equal(p.status, 0, p.stderr)
    const out = JSON.parse(p.stdout)
    assert.deepEqual(out.ids, ['FT-02.1', 'US-01.1.1', 'US-01.1.6', 'US-02.1.1'])
    assert.deepEqual(out.cosmeticOnly, ['US-01.1.2', 'US-01.1.3'])
    assert.deepEqual(out.dropped, ['US-01.1.2', 'US-01.1.4'])
    assert.ok(out.scopeChanged.includes('US-01.1.1') && out.scopeChanged.includes('FT-02.1'))
    for (const k of ['baseline', 'to', 'counts', 'ids', 'cosmeticOnly']) assert.ok(k in out, k)
    const idsOnly = spawnSync(process.execPath, [TOOL, '--plan', 'plan', 'HEAD', '--ids-only'], { cwd: r.dir, encoding: 'utf8' })
    assert.equal(idsOnly.stdout.trim(), out.ids.join(' '))
  } finally { r.cleanup() }
})

test('change detection costs a bounded number of git processes (R-164)', () => {
  const r = repo({ extra: 200 })
  const shim = fs.mkdtempSync(path.join(os.tmpdir(), 'git-shim-'))
  try {
    const realGit = execFileSync('/bin/sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim()
    const log = path.join(shim, 'calls.log')
    fs.writeFileSync(path.join(shim, 'git'), `#!/bin/sh\necho "$1" >> "${log}"\nexec "${realGit}" "$@"\n`, { mode: 0o755 })
    const p = spawnSync(process.execPath, [TOOL, '--plan', 'plan', 'HEAD'], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, PATH: `${shim}:${process.env.PATH}` } })
    assert.equal(p.status, 0, p.stderr)
    const out = JSON.parse(p.stdout)
    assert.equal(out.counts.changedInSubstance, 201, 'the 100 edited bodies, the 100 status moves and the retirement')
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n')
    assert.ok(calls.length < 20, `${calls.length} git processes for about 200 changed entries: ${[...new Set(calls)].join(', ')}`)
  } finally { r.cleanup(); fs.rmSync(shim, { recursive: true, force: true, maxRetries: 5 }) }
})
