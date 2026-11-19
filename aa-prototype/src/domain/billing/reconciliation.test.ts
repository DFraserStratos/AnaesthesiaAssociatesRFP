import { describe, expect, it } from 'vitest'
import { ageDays, reconciliationStatus, type ReconciliationCheck } from './reconciliation'

const item = (id: string, sinceISO: string, amount = 10) => ({ id, label: id, amount, sinceISO, source: 'bankLine' as const })

describe('reconciliationStatus (US-13.2.4, DM-67)', () => {
  it('is square only when every difference is zero to the cent and no item is open', () => {
    const checks: ReconciliationCheck[] = [
      { id: 'a', label: 'A', difference: 0, items: [] },
      { id: 'b', label: 'B', difference: 0.004, items: [] },
    ]
    expect(reconciliationStatus(checks, '2026-07-21T09:00:00')).toEqual({ status: 'square', failing: [], items: [] })
  })

  it('fails a check on a difference alone, or on an item alone, in table order', () => {
    const checks: ReconciliationCheck[] = [
      { id: 'a', label: 'A', difference: 0, items: [item('x', '2026-07-20T10:00:00')] },
      { id: 'b', label: 'B', difference: 0, items: [] },
      { id: 'c', label: 'C', difference: -5, items: [] },
    ]
    const out = reconciliationStatus(checks, '2026-07-21T09:00:00')
    expect(out.status).toBe('outOfBalance')
    expect(out.failing.map((c) => c.id)).toEqual(['a', 'c'])
  })

  it('lists items oldest first, ties by id, aged in whole calendar days', () => {
    const checks: ReconciliationCheck[] = [
      { id: 'a', label: 'A', difference: 0, items: [item('z', '2026-07-21T08:00:00'), item('b', '2026-07-01T10:00:00')] },
      { id: 'c', label: 'C', difference: 0, items: [item('a', '2026-07-21T08:00:00')] },
    ]
    const out = reconciliationStatus(checks, '2026-07-21T23:59:00')
    expect(out.items.map((i) => [i.id, i.ageDays, i.checkId])).toEqual([
      ['b', 20, 'a'],
      ['a', 0, 'c'],
      ['z', 0, 'a'],
    ])
  })

  it('ageDays never goes negative and ignores the time of day', () => {
    expect(ageDays('2026-07-21T23:00:00', '2026-07-22T00:01:00')).toBe(1)
    expect(ageDays('2026-07-22T10:00:00', '2026-07-21T10:00:00')).toBe(0)
    expect(ageDays('', '2026-07-21T10:00:00')).toBe(0)
    expect(ageDays('2026-02-28', '2026-03-01')).toBe(1)
  })

  it('gives identical output for identical input', () => {
    const checks: ReconciliationCheck[] = [{ id: 'a', label: 'A', difference: 1, items: [item('x', '2026-07-01')] }]
    expect(reconciliationStatus(checks, '2026-07-21')).toEqual(reconciliationStatus(checks, '2026-07-21'))
  })
})
