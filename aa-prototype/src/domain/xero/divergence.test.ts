import { describe, expect, it } from 'vitest'
import type { XeroAccRec } from '../types'
import { detectXeroDivergences, type EngineReceivable } from './divergence'

function accRec(id: string, over: Partial<XeroAccRec> = {}): XeroAccRec {
  return { id, kind: 'procedure', invoiceId: `INV-${id}`, contactId: 'XC0001', invoiceNumber: `AA-${id}`, reference: `BC-${id}`, issuedAtISO: '2026-07-21T09:00:00', amountDue: 500, amountReceived: 0, status: 'awaitingPayment', ...over }
}
function engine(id: string, over: Partial<EngineReceivable> = {}): EngineReceivable {
  return { pairId: `BC-${id}`, invoiceId: `INV-${id}`, accRecId: id, amount: 500, receivedAmount: 0, ...over }
}

describe('detectXeroDivergences (catch-up Phase 37)', () => {
  it('flags a void made in Xero on an open receivable, once', () => {
    const recs = { XR1: accRec('XR1', { status: 'voided' }) }
    const found = detectXeroDivergences([engine('XR1')], recs, [])
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({ kind: 'voidedInXero', accRecId: 'XR1', engineHolds: { amount: 500, outstanding: 500 }, xeroShows: { status: 'voided', total: 500 } })
    expect(detectXeroDivergences([engine('XR1')], recs, [{ accRecId: 'XR1', kind: 'voidedInXero', status: 'open' }])).toEqual([])
  })

  it('never re-flags a change the office resolved; flags again only if Xero changes again', () => {
    const recs = { XR1: accRec('XR1', { amountDue: 480, amendedAtISO: '2026-07-21T10:00:00' }) }
    const resolved = { accRecId: 'XR1', kind: 'amendedInXero' as const, status: 'resolved' as const, xeroShows: { total: 480, changedAtISO: '2026-07-21T10:00:00' } }
    expect(detectXeroDivergences([engine('XR1')], recs, [resolved])).toEqual([])
    const changedAgain = { XR1: accRec('XR1', { amountDue: 460, amendedAtISO: '2026-07-22T10:00:00' }) }
    expect(detectXeroDivergences([engine('XR1')], changedAgain, [resolved])).toHaveLength(1)
  })

  it('flags an amended total, never an unchanged one', () => {
    const recs = { XR1: accRec('XR1', { amountDue: 480 }), XR2: accRec('XR2') }
    const found = detectXeroDivergences([engine('XR1'), engine('XR2')], recs, [])
    expect(found.map((f) => [f.accRecId, f.kind])).toEqual([['XR1', 'amendedInXero']])
    expect(found[0]!.xeroShows.total).toBe(480)
  })

  it('never flags a paid receivable as voided', () => {
    const recs = { XR1: accRec('XR1', { status: 'voided' }) }
    expect(detectXeroDivergences([engine('XR1', { receivedAmount: 500 })], recs, [])).toEqual([])
  })

  it('never flags what the engine credited itself, nor an AA fee ACCREC', () => {
    const recs = { XR1: accRec('XR1', { status: 'voided' }), XR2: accRec('XR2', { kind: 'aaFee', amountDue: 10 }) }
    expect(detectXeroDivergences([engine('XR1', { creditedByEngine: true }), engine('XR2')], recs, [])).toEqual([])
  })

  it('orders by ACCREC id, then kind, and is deterministic', () => {
    const recs = { XR2: accRec('XR2', { status: 'voided' }), XR1: accRec('XR1', { amountDue: 1 }) }
    const input = [engine('XR2'), engine('XR1')]
    const a = detectXeroDivergences(input, recs, [])
    expect(a.map((f) => f.accRecId)).toEqual(['XR1', 'XR2'])
    expect(detectXeroDivergences(input, recs, [])).toEqual(a)
  })
})
