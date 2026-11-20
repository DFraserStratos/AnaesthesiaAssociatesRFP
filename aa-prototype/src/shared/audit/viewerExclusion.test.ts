/**
 * The audit viewer's carve-out (catch-up Phase 39; US-13.5.2, DM-45): the list
 * is pinned against every action the store emits that records money moving,
 * and checked to leave master data, Contract, time-entry and credit-note
 * actions audited.
 */

import { describe, expect, it } from 'vitest'
import { AUDIT_VIEWER_EXCLUDED, auditViewerEntries, shownInAuditViewer } from './viewerExclusion'
import { ACTION_LABELS } from './actionLabels'
import { CREDIT_ACTION_LABELS } from '../procedureEventCopy'

const STORE_SOURCES = import.meta.glob('../../store/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function emittedActionCodes(): string[] {
  const codes = new Set<string>()
  for (const [file, source] of Object.entries(STORE_SOURCES)) {
    if (file.endsWith('.test.ts')) continue
    for (const match of source.matchAll(/\baction: '([^']+)'/g)) codes.add(match[1]!)
  }
  return [...codes].sort()
}

/** What reads as money moving: a payment, a receipt, a disbursement or payout, a bill paid, a bank or remittance match, a release on receipt. */
const MONEY = /payment|receipt|disburs|bankLine|remittance|unmatched|allocation|accpayAuthorised|transferReleased|creditAllocated|batchPaid|offset/i
/**
 * Codes the pattern catches that move no money: a Procedure's payer, the prepayment approval switch, a prepaid
 * Booking left off the final invoice, 27a's transfer of a prepayment's payable (neither money in nor money out),
 * and the weekly payment cycle's office decisions and staging (catch-up Phase 39a: audited, like any office step).
 */
const NOT_MONEY = new Set([
  'procedure.payer',
  'settings.prepaymentApprovalChanged',
  'booking.prepaidSettled',
  'prepayment.transfer',
  'prepayment.transferNoop',
  'payments.weekClosed',
  'payments.lineHeldOut',
  'payments.holdReleased',
  'payments.anomalyFixed',
  'payments.scheduleSent',
  'payments.runSuperseded',
  'demo.paymentWeekStaged',
  'demo.bankLineRemoved',
])

describe('AUDIT_VIEWER_EXCLUDED (US-13.5.2: payments are not audited, credit notes are)', () => {
  it('holds every action that records money moving, and nothing else the store does not emit', () => {
    const emitted = emittedActionCodes()
    const money = emitted.filter((code) => MONEY.test(code) && !NOT_MONEY.has(code))
    expect(money.length).toBeGreaterThan(10)
    expect([...AUDIT_VIEWER_EXCLUDED].sort()).toEqual(money)
    for (const code of ['xero.paymentReceived', 'xero.accpayAuthorised', 'xero.disbursed', 'aaFee.paymentRecorded', 'ledger.receiptRecorded', 'ledger.disbursed']) {
      expect(AUDIT_VIEWER_EXCLUDED, code).toContain(code)
    }
  })

  it('every excluded action still has its label (the record keeps it)', () => {
    for (const code of AUDIT_VIEWER_EXCLUDED) expect(ACTION_LABELS[code], code).toBeDefined()
  })

  it('leaves credit notes, master data, Contracts and time entries audited', () => {
    const kept = [
      ...Object.keys(CREDIT_ACTION_LABELS),
      'contract.create',
      'contract.update',
      'contract.priceRange.update',
      'hospital.create',
      'surgeon.update',
      'party.update',
      'anaesthetist.update',
      'procedure.update',
      'session.times',
      'rvgTimeRule.update',
      'invoice.create',
    ]
    for (const code of kept) expect(shownInAuditViewer({ action: code }), code).toBe(true)
  })

  it('filters only: the entries it is given are untouched, and the order kept', () => {
    const entries = [{ action: 'credit.submitted' }, { action: 'xero.paymentReceived' }, { action: 'contract.update' }, { action: 'ledger.disbursed' }]
    const copy = structuredClone(entries)
    expect(auditViewerEntries(entries).map((e) => e.action)).toEqual(['credit.submitted', 'contract.update'])
    expect(entries).toEqual(copy)
  })
})
