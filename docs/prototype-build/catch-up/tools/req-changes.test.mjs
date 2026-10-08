// node --test docs/prototype-build/catch-up/tools/  (or: npm run test:plan-state)
// A scratch git repository: the catalogue in its old layout, then moved to its new one with a small
// edit. Only the edited files may come back as changed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { requirementChanges } from './req-changes.mjs'

const OLD = 'docs/discovery-reference/Updated Requirements'
const NEW = 'requirements-board/requirements'
const body = (id, extra = '') => `---\nid: ${id}\nstatus: Confirmed\n---\n\n${Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of ${id}.`).join('\n')}\n${extra}`

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'req-changes-'))
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' })
  const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text) }
  const commit = msg => { git('add', '-A'); git('-c', 'user.name=T', '-c', 'user.email=t@x', 'commit', '-q', '-m', msg); return git('rev-parse', 'HEAD').trim() }
  git('init', '-q')
  for (const id of ['EP-01', 'FT-01.1', 'US-01.1.1']) write(`${OLD}/catalogue/requirements/${id}.md`, body(id))
  write(`${OLD}/catalogue/questions/OQ-01.md`, body('OQ-01'))
  write(`${OLD}/catalogue/notes/2026-10-01-meeting.md`, body('note', '[t](<../../../Meeting Recordings/T.md>)\n'))
  write(`${OLD}/changes/2026-10-01-update.md`, body('log', '[US](../catalogue/requirements/US-01.1.1.md)\n'))
  write(`${OLD}/domain-model.md`, body('dm'))
  const baseline = commit('baseline')
  // The move: one commit, every file renamed, link paths fixed, and one real edit.
  fs.mkdirSync(path.join(dir, 'requirements-board'), { recursive: true })
  git('mv', `${OLD}/catalogue`, NEW)
  git('mv', `${NEW}/requirements`, `${NEW}/stories`)
  git('mv', `${OLD}/changes`, `${NEW}/changes`)
  git('mv', `${OLD}/domain-model.md`, `${NEW}/domain-model.md`)
  write(`${NEW}/notes/2026-10-01-meeting.md`, body('note', '[t](<../artifacts/files/T.md>)\n'))
  write(`${NEW}/changes/2026-10-01-update.md`, body('log', '[US](../stories/US-01.1.1.md)\n'))
  write(`${NEW}/stories/FT-01.1.md`, body('FT-01.1', 'A real edit.\n'))
  return { dir, git, write, commit, baseline }
}

test('a move counts nothing as changed but the edited item, before and after it is committed', () => {
  const s = scratch()
  for (const to of [null, s.commit('move')]) {
    const c = requirementChanges({ cwd: s.dir, from: s.baseline, to })
    assert.deepEqual(c.items.map(i => [i.id, i.change]), [['FT-01.1', 'M']], `to ${to}`)
    assert.equal(c.items[0].file, `${NEW}/stories/FT-01.1.md`)
    assert.equal(c.items[0].was, `${OLD}/catalogue/requirements/FT-01.1.md`)
    assert.deepEqual(c.questions, [])
    assert.deepEqual(c.notesAdded, [])
    assert.deepEqual(c.changeLogsAdded, [])
    assert.deepEqual(c.domainModel, [])
  }
})

test('a log rewritten past git\'s similarity threshold is still not new', () => {
  const s = scratch()
  s.write(`${NEW}/changes/2026-10-01-update.md`, 'entirely different\n')
  const c = requirementChanges({ cwd: s.dir, from: s.baseline, to: s.commit('move') })
  assert.deepEqual(c.changeLogsAdded, [])
})

test('deletions, new items, new notes and logs, and domain-model edits show, in either layout', () => {
  const s = scratch()
  const moved = s.commit('move')
  s.git('rm', '-q', `${NEW}/stories/US-01.1.1.md`)
  s.write(`${NEW}/stories/US-01.1.2.md`, body('US-01.1.2'))
  s.write(`${NEW}/questions/OQ-02.md`, body('OQ-02'))
  s.write(`${NEW}/notes/2026-10-09-new.md`, body('new note'))
  s.write(`${NEW}/changes/2026-10-09-update.md`, body('new log'))
  s.write(`${NEW}/domain-model.md`, body('dm', 'Changed.\n'))
  const working = requirementChanges({ cwd: s.dir, from: s.baseline })
  const ids = c => c.items.map(i => `${i.id}:${i.change}`).sort()
  assert.deepEqual(ids(working), ['FT-01.1:M', 'US-01.1.1:D', 'US-01.1.2:A'])
  assert.deepEqual(working.questions.map(q => `${q.id}:${q.change}`), ['OQ-02:A'])
  assert.deepEqual(working.notesAdded, [`${NEW}/notes/2026-10-09-new.md`])
  assert.deepEqual(working.changeLogsAdded, [`${NEW}/changes/2026-10-09-update.md`])
  assert.equal(working.domainModel.length, 1)
  // The deleted item is reported at its baseline (old-layout) path.
  assert.equal(working.items.find(i => i.id === 'US-01.1.1').file, `${OLD}/catalogue/requirements/US-01.1.1.md`)
  // A range that starts after the move reads the new layout alone.
  const after = requirementChanges({ cwd: s.dir, from: moved, to: s.commit('more') })
  assert.deepEqual(ids(after), ['US-01.1.1:D', 'US-01.1.2:A'])
})

test('substance ignores evidence links, order, lanes, images and link markup, but not status or text', async () => {
  const { substance } = await import('./req-changes.mjs')
  const a = '---\nid: US-1\nstatus: Verify\nsources:\n  - "Notes #1"\norder: 2\n---\n\nSee [the Contract](US-04.1.1) for detail.\n'
  const b = '---\nid: US-1\nstatus: Verify\nsources:\n  - "Notes #1"\n  - OQ-04\norder: 3\nartifacts:\n  - AR-28#x\nimages:\n  - src: a.png\n---\n\nSee the Contract for detail.\n'
  assert.equal(substance(a), substance(b))
  assert.notEqual(substance(a), substance(a.replace('Verify', 'Confirmed')))
  assert.notEqual(substance(a), substance(a.replace('for detail', 'for the detail')))
})
