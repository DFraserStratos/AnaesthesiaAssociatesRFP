// node --test: the plan tools' status rule (B12: R-07, plan-tool half; accepted decision 16).
// The board refuses any overlapping recode upstream (scripts/recode-statuses.ts; proven by the board's
// tests/recodeStatuses.test.ts), so following every recorded recode in order reads every version, old or
// new, as today's code. These checks pin that rule in the plan tools and read this catalogue's own recode
// history (when it has one) the same way.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRecodes, normaliseStatus } from './scope.mjs'
import { recodeHistoryProblems } from '../../../../shared/statuses.ts'

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const REQ = path.relative(process.cwd(), path.join(BOARD, 'requirements'))

test('a names-to-codes recode reads old names as codes, and codes as themselves', () => {
  const recodes = [{ date: '2026-10-20', items: { Proposed: '1', Future: '1', Confirmed: '4', Retired: '6' }, questions: { Open: '1', Answered: '4' } }]
  assert.equal(normaliseStatus(recodes, 'item', 'Confirmed'), '4')
  assert.equal(normaliseStatus(recodes, 'item', 'Retired'), '6')
  assert.equal(normaliseStatus(recodes, 'question', 'Answered'), '4')
  for (const v of ['1', '4', '6']) assert.equal(normaliseStatus(recodes, 'item', v), v, `a value saved after the recode reads as itself: ${v}`)
})

test('under the no-overlap rule, following the chain is idempotent on every post-recode value', () => {
  // A later renumber to fresh codes, as statuses:recode allows (no target is an earlier source).
  const recodes = [
    { date: '2026-10-20', items: { Proposed: '1', Confirmed: '4', Retired: '6' }, questions: {} },
    { date: '2026-12-01', items: { 5: '7', 6: '8' }, questions: {} },
  ]
  assert.deepEqual(recodeHistoryProblems(recodes), [], 'the board accepts this history')
  for (const v of ['Confirmed', 'Retired', '1', '4', '5', '6', '7', '8']) {
    const once = normaliseStatus(recodes, 'item', v)
    assert.equal(normaliseStatus(recodes, 'item', once), once, `idempotent from ${v}`)
  }
  assert.equal(normaliseStatus(recodes, 'item', 'Retired'), '8', 'an old name follows every recode in turn')
  assert.equal(normaliseStatus(recodes, 'item', '8'), '8', 'a value saved after the renumber reads as itself')
})

test('the board flags the overlapping renumber that would misread a later value (the upstream rule)', () => {
  // `4=5,5=6` would map a stored 5 (saved after it) on to 6; the board's rule reports it (and
  // statuses:recode refuses to record it).
  const overlapping = [{ date: '2026-12-01', items: { 4: '5', 5: '6' }, questions: {} }]
  assert.ok(recodeHistoryProblems(overlapping).length > 0)
  assert.equal(normaliseStatus(overlapping, 'item', '5'), '6', 'what the chain would do with such a history')
})

test('this catalogue\'s recode history reads as today', () => {
  if (!fs.existsSync(path.join(BOARD, 'requirements', 'status-recodes.json'))) return
  const recodes = loadRecodes(process.cwd(), REQ)
  assert.ok(Array.isArray(recodes))
  assert.deepEqual(recodeHistoryProblems(recodes), [], 'the history has no overlap')
  for (const r of recodes) {
    for (const kind of ['items', 'questions']) {
      for (const target of Object.values(r[kind] ?? {})) {
        const k = kind === 'items' ? 'item' : 'question'
        const once = normaliseStatus(recodes, k, target)
        assert.equal(normaliseStatus(recodes, k, once), once, `${r.date} ${kind} target ${target} is stable`)
      }
    }
  }
})
