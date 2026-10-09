import { describe, expect, it } from 'vitest'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor, type BctiRecord } from './bcti'

function rec(id: string, anaesthetistId: string, issuedAtISO: string, receivablePaidAtISO?: string, voided = false): BctiRecord {
  return {
    accPayId: id,
    billNumber: `AA-${id}-P`,
    receivableInvoiceNumber: `AA-${id}`,
    anaesthetistId,
    issuedAtISO,
    ...(receivablePaidAtISO !== undefined ? { receivablePaidAtISO } : {}),
    voided,
  }
}

const RECORDS: BctiRecord[] = [
  rec('P1', 'A', '2026-07-02T09:00:00', '2026-07-31T10:00:00'),
  rec('P2', 'A', '2026-07-03T09:00:00', '2026-08-01T10:00:00'),
  rec('P3', 'A', '2026-07-28T09:00:00', '2026-08-03T10:00:00'),
  rec('P4', 'A', '2026-07-10T09:00:00'), // unpaid or part paid
  rec('P5', 'B', '2026-07-05T09:00:00', '2026-07-09T10:00:00'),
  rec('P6', 'A', '2026-07-06T09:00:00', '2026-07-08T10:00:00', true), // voided
]

const ids = (rs: BctiRecord[]): string[] => rs.map((r) => r.accPayId)

describe('bctisFor (the only BCTI count)', () => {
  it('builds the paid-only rule by default', () => {
    expect(BCTI_COUNT_RULE.paidOnly).toBe(true)
  })

  it('counts by anaesthetist and paid month: 31 Jul and 1 Aug land in different months', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-07'))).toEqual(['P1'])
    expect(ids(bctisFor(RECORDS, 'A', '2026-08'))).toEqual(['P2', 'P3'])
  })

  it('counts one issued 28 Jul and paid 3 Aug in August, not July', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-07'))).not.toContain('P3')
    expect(ids(bctisFor(RECORDS, 'A', '2026-08'))).toContain('P3')
  })

  it('skips unpaid and part-paid records, and voided ones', () => {
    const all = [...bctisFor(RECORDS, 'A', '2026-07'), ...bctisFor(RECORDS, 'A', '2026-08')]
    expect(ids(all)).not.toContain('P4')
    expect(ids(all)).not.toContain('P6')
  })

  it('counts every paid record exactly once across consecutive months', () => {
    const months = ['2026-06', '2026-07', '2026-08', '2026-09']
    const counted = months.flatMap((m) => ids(bctisFor(RECORDS, 'A', m)))
    expect(counted.sort()).toEqual(['P1', 'P2', 'P3'])
    expect(new Set(counted).size).toBe(counted.length)
  })

  it('counts a duplicated record once', () => {
    expect(ids(bctisFor([...RECORDS, RECORDS[0]!], 'A', '2026-07'))).toEqual(['P1'])
  })

  it('counts against the anaesthetist on the record only', () => {
    expect(ids(bctisFor(RECORDS, 'B', '2026-07'))).toEqual(['P5'])
  })

  it('counts by issue month with paidOnly off', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-07', { paidOnly: false }))).toEqual(['P1', 'P2', 'P4', 'P3'])
  })

  it('is deterministic whatever the input order', () => {
    const reversed = [...RECORDS].reverse()
    expect(bctisFor(reversed, 'A', '2026-08')).toEqual(bctisFor(RECORDS, 'A', '2026-08'))
  })
})

describe('bctisFor never misses a paid BCTI (fee history)', () => {
  it('carries a BCTI paid in an already invoiced month to the next month not yet invoiced', () => {
    // July was run to date before P1 (paid 31 Jul) landed: it is charged in August.
    const julyRun = bctiFeeHistory([{ anaesthetistId: 'A', monthISO: '2026-07', bctis: [] }], 'A')
    expect(ids(bctisFor(RECORDS, 'A', '2026-07', BCTI_COUNT_RULE, julyRun))).toEqual([])
    expect(ids(bctisFor(RECORDS, 'A', '2026-08', BCTI_COUNT_RULE, julyRun))).toEqual(['P1', 'P2', 'P3'])
  })

  it('carries past several invoiced months, and never counts an already charged BCTI', () => {
    const history = bctiFeeHistory(
      [
        { anaesthetistId: 'A', monthISO: '2026-07', bctis: [{ accPayId: 'P1' }] },
        { anaesthetistId: 'A', monthISO: '2026-08', bctis: [] },
        { anaesthetistId: 'B', monthISO: '2026-09', bctis: [{ accPayId: 'P2' }] },
      ],
      'A',
    )
    expect(ids(bctisFor(RECORDS, 'A', '2026-09', BCTI_COUNT_RULE, history))).toEqual(['P2', 'P3'])
    const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
    const counted = months.flatMap((m) => ids(bctisFor(RECORDS, 'A', m, BCTI_COUNT_RULE, history)))
    expect(counted.sort()).toEqual(['P2', 'P3'])
  })
})
