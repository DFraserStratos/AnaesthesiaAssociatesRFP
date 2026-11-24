import { describe, expect, it } from 'vitest'
import type { XeroAccRec } from '../types'
import { matchRemittanceLines } from './remittance'

function rec(id: string, invoiceNumber: string, over: Partial<XeroAccRec> = {}): XeroAccRec {
  return { id, kind: 'procedure', invoiceId: `INV-${id}`, contactId: 'XC0009', invoiceNumber, reference: `BC-${id}`, issuedAtISO: '2026-10-05T09:00:00', amountDue: 845, amountReceived: 0, status: 'awaitingPayment', ...over }
}

describe('matchRemittanceLines (catch-up Phase 37, Xero side only)', () => {
  const recs = [rec('XR1', 'AA-2026-H0001'), rec('XR3', 'AA-2026-H0003', { amountDue: 520.5 }), rec('XR4', 'AA-2026-H0004', { amountDue: 980 })]

  it('matches exact numbers at or below the balance', () => {
    const out = matchRemittanceLines(
      [
        { lineId: 'L1', quotedReference: 'AA-2026-H0001', amount: 845 },
        { lineId: 'L2', quotedReference: 'AA-2026-H0003', amount: 520.5 },
      ],
      recs,
    )
    expect(out).toEqual({ matched: [{ lineId: 'L1', accRecId: 'XR1', amount: 845 }, { lineId: 'L2', accRecId: 'XR3', amount: 520.5 }], unmatched: [] })
  })

  it('leaves a mistyped or unknown number unmatched', () => {
    const out = matchRemittanceLines([{ lineId: 'L3', quotedReference: 'AA-2026-H0040', amount: 980 }], recs)
    expect(out).toEqual({ matched: [], unmatched: ['L3'] })
  })

  it('leaves an amount above the balance unmatched', () => {
    const out = matchRemittanceLines([{ lineId: 'L1', quotedReference: 'AA-2026-H0001', amount: 845.01 }], recs)
    expect(out.unmatched).toEqual(['L1'])
  })

  it('never matches a voided ACCREC, and one ACCREC takes one line', () => {
    const voided = [rec('XR1', 'AA-2026-H0001', { status: 'voided' })]
    expect(matchRemittanceLines([{ lineId: 'L1', quotedReference: 'AA-2026-H0001', amount: 10 }], voided).unmatched).toEqual(['L1'])
    const twice = matchRemittanceLines(
      [
        { lineId: 'L1', quotedReference: 'AA-2026-H0001', amount: 400 },
        { lineId: 'L2', quotedReference: 'AA-2026-H0001', amount: 400 },
      ],
      recs,
    )
    expect(twice).toEqual({ matched: [{ lineId: 'L1', accRecId: 'XR1', amount: 400 }], unmatched: ['L2'] })
  })

  it('is deterministic', () => {
    const lines = [{ lineId: 'L1', quotedReference: 'AA-2026-H0004', amount: 980 }]
    expect(matchRemittanceLines(lines, recs)).toEqual(matchRemittanceLines(lines, [...recs].reverse()))
  })
})
