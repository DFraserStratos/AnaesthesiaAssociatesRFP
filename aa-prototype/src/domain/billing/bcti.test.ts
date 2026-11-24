import { describe, expect, it } from 'vitest'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor, type BctiRecord } from './bcti'
import { bctiRecordsOf } from './ledger'
import type { BookingLedgerPair, LedgerTransfer } from '../types'

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
  rec('P1', 'A', '2026-11-02T09:00:00', '2026-11-30T10:00:00'),
  rec('P2', 'A', '2026-11-03T09:00:00', '2026-12-01T10:00:00'),
  rec('P3', 'A', '2026-11-28T09:00:00', '2026-12-03T10:00:00'),
  rec('P4', 'A', '2026-11-10T09:00:00'), // unpaid or part paid
  rec('P5', 'B', '2026-11-05T09:00:00', '2026-11-09T10:00:00'),
  rec('P6', 'A', '2026-11-06T09:00:00', '2026-11-08T10:00:00', true), // voided
]

const ids = (rs: BctiRecord[]): string[] => rs.map((r) => r.accPayId)

describe('bctisFor (the only BCTI count)', () => {
  it('builds the paid-only rule by default', () => {
    expect(BCTI_COUNT_RULE.paidOnly).toBe(true)
  })

  it('counts by anaesthetist and paid month: 30 Nov and 1 Dec land in different months', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-11'))).toEqual(['P1'])
    expect(ids(bctisFor(RECORDS, 'A', '2026-12'))).toEqual(['P2', 'P3'])
  })

  it('counts one issued 28 Nov and paid 3 Dec in December, not November', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-11'))).not.toContain('P3')
    expect(ids(bctisFor(RECORDS, 'A', '2026-12'))).toContain('P3')
  })

  it('skips unpaid and part-paid records, and voided ones', () => {
    const all = [...bctisFor(RECORDS, 'A', '2026-11'), ...bctisFor(RECORDS, 'A', '2026-12')]
    expect(ids(all)).not.toContain('P4')
    expect(ids(all)).not.toContain('P6')
  })

  it('counts every paid record exactly once across consecutive months', () => {
    const months = ['2026-10', '2026-11', '2026-12', '2027-01']
    const counted = months.flatMap((m) => ids(bctisFor(RECORDS, 'A', m)))
    expect(counted.sort()).toEqual(['P1', 'P2', 'P3'])
    expect(new Set(counted).size).toBe(counted.length)
  })

  it('counts a duplicated record once', () => {
    expect(ids(bctisFor([...RECORDS, RECORDS[0]!], 'A', '2026-11'))).toEqual(['P1'])
  })

  it('counts against the anaesthetist on the record only', () => {
    expect(ids(bctisFor(RECORDS, 'B', '2026-11'))).toEqual(['P5'])
  })

  it('counts by issue month with paidOnly off', () => {
    expect(ids(bctisFor(RECORDS, 'A', '2026-11', { paidOnly: false }))).toEqual(['P1', 'P2', 'P4', 'P3'])
  })

  it('is deterministic whatever the input order', () => {
    const reversed = [...RECORDS].reverse()
    expect(bctisFor(reversed, 'A', '2026-12')).toEqual(bctisFor(RECORDS, 'A', '2026-12'))
  })
})

describe('bctisFor never misses a paid BCTI (fee history)', () => {
  it('carries a BCTI paid in an already invoiced month to the next month not yet invoiced', () => {
    // July was run to date before P1 (paid 31 Jul) landed: it is charged in August.
    const julyRun = bctiFeeHistory([{ anaesthetistId: 'A', monthISO: '2026-11', bctis: [] }], 'A')
    expect(ids(bctisFor(RECORDS, 'A', '2026-11', BCTI_COUNT_RULE, julyRun))).toEqual([])
    expect(ids(bctisFor(RECORDS, 'A', '2026-12', BCTI_COUNT_RULE, julyRun))).toEqual(['P1', 'P2', 'P3'])
  })

  it('carries past several invoiced months, and never counts an already charged BCTI', () => {
    const history = bctiFeeHistory(
      [
        { anaesthetistId: 'A', monthISO: '2026-11', bctis: [{ accPayId: 'P1' }] },
        { anaesthetistId: 'A', monthISO: '2026-12', bctis: [] },
        { anaesthetistId: 'B', monthISO: '2027-01', bctis: [{ accPayId: 'P2' }] },
      ],
      'A',
    )
    expect(ids(bctisFor(RECORDS, 'A', '2027-01', BCTI_COUNT_RULE, history))).toEqual(['P2', 'P3'])
    const months = ['2026-10', '2026-11', '2026-12', '2027-01', '2027-02']
    const counted = months.flatMap((m) => ids(bctisFor(RECORDS, 'A', m, BCTI_COUNT_RULE, history)))
    expect(counted.sort()).toEqual(['P2', 'P3'])
  })
})

describe("a prepayment's payable and the count (catch-up Phase 27a; OQ-29 provisional)", () => {
  // (catch-up Phase 36: the records are read from the ledger's payable legs, `bctiRecordsOf`, not the Xero ACCPAYs.)
  const pair = (id: string, held: boolean): BookingLedgerPair => ({
    id: `BC-${id}`, kind: held ? 'prePayment' : 'procedure', invoiceId: `INV-${id}`, bookingId: `BK-${id}`, listId: 'L1',
    ...(held ? {} : { anaesthetistId: 'A' }), patientId: 'PT1', procedureIds: [], procedureShares: [], createdAtISO: '2026-11-17T09:00:00',
    receivable: { number: `AA-${id}`, counterparty: { kind: 'patient', id: 'PT1' } as BookingLedgerPair['receivable']['counterparty'], amount: 100, receivedAmount: 100, paidInAtISO: '2026-11-17T09:00:00', xeroAccRecId: id },
    payable: {
      number: `AA-${id}-P`, payee: held ? { kind: 'holding' } : { kind: 'anaesthetist', anaesthetistId: 'A' }, amount: 100, releasedAmount: 100, disbursedAmount: 0,
      issuedAtISO: '2026-11-17T09:00:00', xeroAccPayId: `P-${id}`,
    },
  })
  const pairs = [pair('R1', false), pair('R2', true)]
  // The held prepayment's payable names no anaesthetist; with the switch on it charges whoever its transfer pays.
  const transfer: LedgerTransfer = {
    id: 'TR1', kind: 'prepayTransfer', collectPairId: 'BC-R2', invoiceId: 'INV-R2', bookingId: 'BK-R2', listId: 'L1', patientId: 'PT1', createdAtISO: '2026-11-24T09:00:00',
    out: { amount: 100 },
    in: { number: 'TR1', payee: { kind: 'anaesthetist', anaesthetistId: 'A' }, amount: 100, releasedAmount: 100, disbursedAmount: 0, issuedAtISO: '2026-11-24T09:00:00' },
  }

  it('is off by default: the AA Holding account payable is not a BCTI', () => {
    expect(BCTI_COUNT_RULE.prepaymentPairs).toBe(false)
    expect(ids(bctiRecordsOf(pairs, { TR1: transfer }))).toEqual(['BC-R1']) // keyed on the pair id (catch-up Phase 36 review: stable across the hand-off)
  })

  it('switched on, it counts again', () => {
    expect(ids(bctiRecordsOf(pairs, { TR1: transfer }, { ...BCTI_COUNT_RULE, prepaymentPairs: true })).sort()).toEqual(['BC-R1', 'BC-R2'])
  })
})
