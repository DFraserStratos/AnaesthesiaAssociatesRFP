/** Stepping order for the question sheet: the Outstanding items list as filtered, with the open question anchored. */
import { describe, expect, it } from 'vitest'
import type { QuestionStatus } from '../shared/types.ts'
import { questionWalk, type QuestionFilters } from '../src/questionWalk.ts'
import { question } from './fixtures.ts'

const all: QuestionFilters = { owner: '', kind: '', query: '', showAnswered: true }
const statuses: Record<string, QuestionStatus> = {
  'OQ-02': 'Answered',
  'OQ-03': 'Open',
  'OQ-05': 'Confirm',
  'OQ-10': 'Open',
  'OQ-12': 'Open',
  'OQ-13': 'Answered', // just answered in the sheet
  'OQ-17': 'Open',
  'OQ-20': 'Proposed',
}
const qs = Object.entries(statuses).map(([id, status]) => question({ id, status, owner: id === 'OQ-10' ? 'Greg' : 'AA' }))
const ids = (f: QuestionFilters, anchor?: { id: string; status: QuestionStatus }) => questionWalk(qs, f, anchor).map((q) => q.id)

describe('questionWalk', () => {
  it('follows the list: Open, Awaiting confirmation, Proposed, then Answered', () => {
    expect(ids(all)).toEqual(['OQ-03', 'OQ-10', 'OQ-12', 'OQ-17', 'OQ-05', 'OQ-20', 'OQ-02', 'OQ-13'])
  })

  it('leaves Answered out when it is hidden', () => {
    expect(ids({ ...all, showAnswered: false })).toEqual(['OQ-03', 'OQ-10', 'OQ-12', 'OQ-17', 'OQ-05', 'OQ-20'])
  })

  it('applies the list filters', () => {
    expect(ids({ ...all, owner: 'Greg' })).toEqual(['OQ-10'])
    expect(ids({ ...all, query: 'oq-1' })).toEqual(['OQ-10', 'OQ-12', 'OQ-17', 'OQ-13'])
  })

  it('keeps a question just answered where it was opened, between its old Open neighbours', () => {
    const walk = ids(all, { id: 'OQ-13', status: 'Open' })
    const at = walk.indexOf('OQ-13')
    expect([walk[at - 1], walk[at + 1]]).toEqual(['OQ-12', 'OQ-17'])
    expect(walk.filter((id) => id === 'OQ-13')).toHaveLength(1)
  })

  it('keeps an anchored question in the walk even with Answered hidden', () => {
    expect(ids({ ...all, showAnswered: false }, { id: 'OQ-13', status: 'Open' })).toContain('OQ-13')
  })
})
