/**
 * Bulk hospital remittance, left in Xero (catch-up Phase 37; US-10.2.4), and
 * the reconciliation status it feeds (US-13.2.4, DM-67).
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { ST_GEORGES_REMITTANCE, resolveRemittance } from '../domain/xeroSim/remittanceFixtures'
import { bankLineMatchRefusal, bulkRemittanceRefusal, matchBankLineInXero, receiveBulkRemittance } from './xeroSimActions'
import { pairByAccRec, receivableOutstanding } from './ledgerSelectors'
import { setXeroOutage } from './xeroQueue'
import { OFFICE_ACTOR } from './demoActors'
import { reconciliationChecksOf, reconciliationStatusOf, unmatchedBankLines } from './reconciliationSelectors'
import { injectUnmatchedReceipt } from './ledgerDemo'
import { allocateUnmatchedReceipt } from './ledgerActions'
import { advanceClockDays } from './clockActions'
import { authoriseList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function receiptsOn(api: BoundAppStore, accRecId: string) {
  return Object.values(api.getState().billing.receipts).filter((r) => r.accRecId === accRecId)
}

describe('the St George remittance fixture', () => {
  it('resolves to three open St George receivables on one contact, Mitchell not among them', () => {
    const api = createAppStore()
    const resolved = resolveRemittance(ST_GEORGES_REMITTANCE, api.getState().xero)
    expect(resolved.ok).toBe(true)
    if (!resolved.ok) return
    const recs = resolved.value.lines.map((l) => api.getState().xero.accRecs[l.accRecId]!)
    expect(new Set(recs.map((r) => r.contactId)).size).toBe(1)
    expect(recs.every((r) => r.status === 'awaitingPayment' && r.amountReceived === 0)).toBe(true)
    expect(recs.map((r) => r.invoiceNumber)).toEqual(['AA-2026-H01', 'AA-2026-H03', 'AA-2026-H04'])
    expect(resolved.value.lines.map((l) => [l.quotedReference, l.amount])).toEqual([
      ['AA-2026-H01', 845],
      ['AA-2026-H03', 520.5],
      ['AA-2026-H40', 980],
    ])
    expect(resolved.value.lines.some((l) => l.accRecId === 'XRH07')).toBe(false)
  })
})

describe('receiveBulkRemittance (work item 10)', () => {
  it('pays the two matched invoices by webhook once, leaves one line unmatched and Mitchell untouched', () => {
    const api = createAppStore()
    const mitchellBefore = api.getState().xero.accRecs['XRH07']!
    const out = receiveBulkRemittance(api)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.value).toMatchObject({ matchedCount: 2, matchedTotal: 1365.5, unmatchedCount: 1, receiptsRecorded: 2, queued: 0 })
    const s = api.getState()
    for (const id of ['XRH01', 'XRH03']) {
      const receipts = receiptsOn(api, id)
      expect(receipts).toHaveLength(1)
      expect(receipts[0]!.idempotencyKey).toMatch(/^REMIT-RMT\d{4}-BKL\d{4}$/)
      expect(receivableOutstanding(pairByAccRec(s, id)!)).toBe(0)
    }
    expect(receiptsOn(api, 'XRH04')).toHaveLength(0)
    expect(s.xero.accRecs['XRH07']).toEqual(mitchellBefore)
    const lines = unmatchedBankLines(s)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ quotedReference: 'AA-2026-H40', amount: 980, status: 'unmatched', reference: ST_GEORGES_REMITTANCE.reference })
    // Engine side: no unmatched receipt (that is money the engine holds; this line never reached it).
    expect(Object.keys(s.billing.unmatchedReceipts)).toHaveLength(0)
    const actions = s.audit.map((a) => a.action)
    expect(actions).toContain('xero.remittanceReceived')
    expect(actions).toContain('xero.bankLineUnmatched')
  })

  it('is refused a second time', () => {
    const api = createAppStore()
    expect(receiveBulkRemittance(api).ok).toBe(true)
    expect(bulkRemittanceRefusal(api.getState())).toBe('Already received')
    expect(receiveBulkRemittance(api)).toMatchObject({ ok: false, message: 'Already received' })
    expect(Object.keys(api.getState().xero.remittances)).toHaveLength(1)
  })

  it("the office's match in Xero pays the third invoice by webhook exactly once", () => {
    const api = createAppStore()
    receiveBulkRemittance(api)
    const line = unmatchedBankLines(api.getState())[0]!
    expect(bankLineMatchRefusal(api.getState(), line.id, 'XRH07')).toBe('The line is more than the invoice balance')
    expect(bankLineMatchRefusal(api.getState(), line.id, 'XRH0X')).toBe('Choose an invoice')
    const out = matchBankLineInXero(api, OFFICE_ACTOR, line.id, 'XRH04')
    expect(out).toMatchObject({ ok: true, value: { invoiceNumber: 'AA-2026-H04', amount: 980, recorded: true } })
    expect(receiptsOn(api, 'XRH04')).toHaveLength(1)
    expect(matchBankLineInXero(api, OFFICE_ACTOR, line.id, 'XRH04')).toMatchObject({ ok: false, message: 'This line is already matched' })
    expect(receiptsOn(api, 'XRH04')).toHaveLength(1)
    expect(unmatchedBankLines(api.getState())).toHaveLength(0)
  })

  it('refuses a different contact', () => {
    const api = createAppStore()
    receiveBulkRemittance(api)
    const line = unmatchedBankLines(api.getState())[0]!
    const other = Object.values(api.getState().xero.accRecs).find((r) => r.contactId !== api.getState().xero.accRecs['XRH04']!.contactId && r.kind === 'procedure')!
    expect(bankLineMatchRefusal(api.getState(), line.id, other.id)).toBe('That invoice is for a different contact')
  })

  it('during an outage the payments land in Xero and their syncs queue, then restore records each once', () => {
    const api = createAppStore()
    expect(setXeroOutage(api, OFFICE_ACTOR, true).ok).toBe(true)
    const out = receiveBulkRemittance(api)
    expect(out).toMatchObject({ ok: true, value: { receiptsRecorded: 0, queued: 2 } })
    expect(receiptsOn(api, 'XRH01')).toHaveLength(0)
    expect(Object.values(api.getState().billing.xeroQueue).filter((q) => q.kind === 'paymentSync' && q.status !== 'sent')).toHaveLength(2)
    expect(setXeroOutage(api, OFFICE_ACTOR, false).ok).toBe(true)
    expect(receiptsOn(api, 'XRH01')).toHaveLength(1)
    expect(receiptsOn(api, 'XRH03')).toHaveLength(1)
    expect(setXeroOutage(api, OFFICE_ACTOR, false).ok).toBe(false)
    expect(receiptsOn(api, 'XRH01')).toHaveLength(1)
  })
})

describe('reconciliation status (work item 12a; US-13.2.4, DM-67)', () => {
  it('reads square from reset', () => {
    const api = createAppStore()
    const status = reconciliationStatusOf(api.getState())
    expect(status.status).toBe('square')
    expect(status.items).toEqual([])
    expect(reconciliationChecksOf(api.getState()).map((c) => c.id)).toEqual(['ledger', 'ledgerAgainstXero', 'xeroBankLines'])
  })

  it('an unmatched receipt puts the Ledger check out by $120.00 with one item that ages with the clock, and allocating it squares the books', () => {
    const api = createAppStore()
    const injected = injectUnmatchedReceipt(api, 'souter')
    expect(injected.ok).toBe(true)
    let status = reconciliationStatusOf(api.getState())
    expect(status.status).toBe('outOfBalance')
    expect(status.failing.map((c) => [c.id, c.difference])).toEqual([['ledger', 120]])
    expect(status.items).toHaveLength(1)
    expect(status.items[0]).toMatchObject({ amount: 120, ageDays: 0, source: 'unmatchedReceipt' })
    advanceClockDays(api, 1)
    status = reconciliationStatusOf(api.getState())
    expect(status.items[0]!.ageDays).toBe(1)
    const pair = Object.values(api.getState().billing.ledger).find((p) => p.kind === 'procedure' && p.anaesthetistId === ANAE.souter && receivableOutstanding(p) >= 120)!
    expect(allocateUnmatchedReceipt(api, OFFICE_ACTOR, injected.ok ? injected.value.id : '', pair.id).ok).toBe(true)
    expect(reconciliationStatusOf(api.getState()).status).toBe('square')
  })

  it("lists the remittance's unmatched bank line, and the office's match clears it", () => {
    const api = createAppStore()
    receiveBulkRemittance(api)
    const status = reconciliationStatusOf(api.getState())
    expect(status.failing.map((c) => c.id)).toEqual(['xeroBankLines'])
    expect(status.items).toEqual([expect.objectContaining({ amount: 980, source: 'bankLine' })])
    matchBankLineInXero(api, OFFICE_ACTOR, status.items[0]!.id, 'XRH04')
    expect(reconciliationStatusOf(api.getState()).status).toBe('square')
  })

  it('a hand-off waiting for Xero counts against Xero until restore', () => {
    const api = createAppStore()
    unwires.push(wireBillingRun(api))
    setXeroOutage(api, OFFICE_ACTOR, true)
    expect(authoriseList(api, OFFICE_ACTOR, projectedListId(ANAE.souter, '2026-07-20', 'AM')).ok).toBe(true)
    const status = reconciliationStatusOf(api.getState())
    expect(status.failing.map((c) => c.id)).toEqual(['ledgerAgainstXero'])
    expect(status.items.every((i) => i.source === 'xeroQueue' && i.amount > 0)).toBe(true)
    setXeroOutage(api, OFFICE_ACTOR, false)
    expect(reconciliationStatusOf(api.getState()).status).toBe('square')
  })
})
