// node --test: build-index.mjs on throwaway plan folders (B12: A-4, A-10).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-index.mjs')

function fixture({ status = {}, commitFirst = null }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-index-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim()
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t) }
  const commit = m => { git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'gc.auto=0', 'commit', '-q', '-m', m); return git('rev-parse', 'HEAD') }
  git('init', '-q')
  w('plan/plan.config.json', JSON.stringify({ requirements: 'req' }))
  let base = null
  if (commitFirst) { commitFirst(w); base = commit('baseline') }
  const phases = [
    { num: '01', slug: 'one', title: 'One', track: 'A', goal: 'g', delivers: 'd', depends_on: [], covers: [], blocked_by_oqs: ['OQ-01'], file: 'phases/phase-01-one.md', prompt_file: 'phases/phase-01-one.prompt.md' },
    { num: '02', slug: 'two', title: 'Two', track: 'A', goal: 'g', delivers: 'd', depends_on: [], covers: [], blocked_by_oqs: ['OQ-02'], file: 'phases/phase-02-two.md', prompt_file: 'phases/phase-02-two.prompt.md' },
  ]
  w('plan/plan.json', JSON.stringify({ commit: base ?? 'c'.repeat(40), phases, parked: [], sequencing_rules: '', milestones: [] }))
  for (const p of phases) { w(`plan/${p.file}`, `# Phase ${p.num}\n`); w(`plan/${p.prompt_file}`, `Prompt for ${p.num}\n`) }
  w('plan/lanes/lane-a.prompt.md', 'Lane A prompt text\n')
  w('plan/status.json', JSON.stringify(status))
  const run = () => spawnSync(process.execPath, [TOOL, '--plan', 'plan'], { cwd: dir, encoding: 'utf8' })
  const html = () => fs.readFileSync(path.join(dir, 'plan/index.html'), 'utf8')
  return { dir, w, run, html, cleanup: () => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) }
}

test('"Start now" lists each lane with its queue and prompt button when no phase is marked safe (A-4)', () => {
  const f = fixture({ status: { guidance: { headline: 'Lanes', lanes: [{ name: 'Lane A', where: 'worktree A', queue: ['01', '02'], prompt_file: 'lanes/lane-a.prompt.md' }] } } })
  try {
    const r = f.run()
    assert.equal(r.status, 0, r.stderr)
    const now = f.html().split('id="h-now"')[1].split('</section>')[0]
    assert.match(now, /Copy Lane A prompt/)
    assert.match(now, /Lane A prompt text/)
    assert.match(now, /Queue:/)
  } finally { f.cleanup() }
})

test('a question answered before a names-to-codes recode does not flag "re-plan first"; one answered since still does (A-10)', () => {
  const f = fixture({
    commitFirst: w => {
      // At the baseline: OQ-01 already answered (stored by name), OQ-02 still open; no recode yet.
      w('req/questions/OQ-01.md', '---\nid: OQ-01\nstatus: Answered\n---\nQ\n')
      w('req/questions/OQ-02.md', '---\nid: OQ-02\nstatus: Open\n---\nQ\n')
    },
  })
  try {
    // After it: the names-to-codes recode, and OQ-02 answered.
    f.w('req/board.config.json', JSON.stringify({ questionStatuses: [{ code: 1, label: 'Open', role: 'default' }, { code: 4, label: 'Answered', role: 'answered' }] }))
    f.w('req/status-recodes.json', JSON.stringify([{ date: '2026-10-20', items: {}, questions: { Open: '1', Answered: '4' } }]))
    f.w('req/questions/OQ-01.md', '---\nid: OQ-01\nstatus: 4\n---\nQ\n')
    f.w('req/questions/OQ-02.md', '---\nid: OQ-02\nstatus: 4\n---\nQ\n')
    const r = f.run()
    assert.equal(r.status, 0, r.stderr)
    const html = f.html()
    assert.doesNotMatch(html, /OQ-01<\/a> \(answered since\)/, 'OQ-01 was answered at the baseline: no re-plan flag')
    assert.match(html, /OQ-02<\/a> \(answered since\)/, 'OQ-02 was answered since: still flagged')
  } finally { f.cleanup() }
})
