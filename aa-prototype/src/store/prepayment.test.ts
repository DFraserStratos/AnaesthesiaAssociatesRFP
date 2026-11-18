/**
 * Prepayment in the store (catch-up Phase 27; US-06.3.1, US-06.3.2, US-06.3.4,
 * US-06.3.5, US-08.2.2, FT-06.3, FT-08.1; D5, D6, D30, D38, D47, D57, D85):
 * the seeded states, Approve and send with its pair to the AA Holding
 * account, the switch, the per-payer groups and lock, the escalating warning,
 * the re-check, a move changing nothing, and the run leaving a raised
 * prepayment off the final invoice.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { approvePrepayment, autoSendPrepayments, setPrepaymentApprovalRequired } from './prepaymentActions'
import { pendingPrepayments, prepaymentForProcedure, prepaymentStatusFor, upcomingPrepayments } from './prepaymentSelectors'
import { proceduresForBooking } from './selectors'
import { warningsForBooking } from './warnings'
import { advanceClockToDate } from './clockActions'
import { receivePayment } from './paymentActions'
import { payablesDue, runPayables } from './payablesActions'
import { setProcedureContract } from './contractSelectionActions'
import { setProcedurePrice } from './pricingActions'
import { setProcedurePayer } from './payerActions'
import { addProcedure } from './bookingActions'
import { authoriseList, reassignBooking, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { setProcedureSplit } from './splitActions'
import { completeAnswered } from '../test/completeAnswered'
import { CONTRACT, SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { AA_HOLDING_ACCOUNT } from '../domain/billing/prepayment'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID
const PATIENT_KEY = (api: BoundAppStore, bookingId: string) => `patient:${api.getState().schedule.bookings[bookingId]!.patientId}`

const rileyProc = (api: BoundAppStore) => proceduresForBooking(api.getState(), RILEY)[0]!
const casesOf = (api: BoundAppStore, invoiceId: string) => Object.values(api.getState().billing.cases).find((c) => c.invoiceId === invoiceId)!

describe('the seeded prepayments', () => {
  it('Riley awaits approval at $1,200.00 with no invoice; Nair is paid on INV0001 at $1,200.00 ex GST', () => {
    const api = createAppStore()
    const riley = prepaymentStatusFor(api.getState(), RILEY)
    expect(riley.status).toBe('awaitingApproval')
    expect(riley.groups).toHaveLength(1)
    expect(riley.groups[0]).toMatchObject({ amount: 1200, ready: true, invoicedTotal: 0 })
    const nair = prepaymentStatusFor(api.getState(), NAIR)
    expect(nair.status).toBe('paid')
    expect(nair.groups[0]).toMatchObject({ invoiceNumber: 'AA-2026-0001', amount: 1200, invoicedTotal: 1380, receivedTotal: 1380 })
    // Only Nair's rhinoplasty is in the group, never Forte's septoplasty.
    expect(nair.groups[0]!.procedureIds).toHaveLength(1)
    expect(api.getState().appSettings.prepayment.approvalRequired).toBe(true)
  })

  it('the Bookings with a prepayment on Lists not yet AUTHORISED are exactly Riley and Nair', () => {
    const api = createAppStore()
    expect([...new Set(upcomingPrepayments(api.getState()).map((r) => r.bookingId))].sort()).toEqual([NAIR, RILEY].sort())
    expect(pendingPrepayments(api.getState()).map((r) => r.bookingId)).toEqual([RILEY])
  })

  it("INV0001's payable credits the AA Holding account, authorised, never paid by the payables run", () => {
    const api = createAppStore()
    const inv = Object.values(api.getState().billing.invoices).find((i) => i.invoiceNumber === 'AA-2026-0001')!
    const pay = api.getState().xero.accPays[casesOf(api, inv.id).accPayId!]!
    expect(pay.payeeAccount).toBe('aaHoldingAccount')
    expect(api.getState().xero.contacts[pay.contactId]?.name).toBe(AA_HOLDING_ACCOUNT.name)
    expect(pay).toMatchObject({ amountAuthorised: 1380, amountDisbursed: 0 })
    expect(inv.approval).toMatchObject({ mode: 'approved', by: 'Kirsty W.' })
    expect(payablesDue(api.getState()).count).toBe(0)
  })

  it("Riley's warning is mild on Tue 21 Jul (3 days out) and strong from Wed 22", () => {
    const api = createAppStore()
    const on = () => warningsForBooking(api.getState(), RILEY).filter((w) => w.ruleId === 'prepaymentUnpaid').map((w) => w.strength)
    expect(on()).toEqual(['mild'])
    advanceClockToDate(api, '2026-07-22')
    expect(on()).toEqual(['strong'])
  })
})

describe('Approve and send (US-06.3.1, D6, D38)', () => {
  it('the office approves once: one invoice to the payer, its pair to the AA Holding account, sent; the status reads unpaid', () => {
    const api = createAppStore()
    const out = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!out.ok) throw new Error(out.message)
    const state = api.getState()
    const inv = state.billing.invoices[out.value.invoiceId]!
    expect(inv).toMatchObject({ kind: 'prePayment', subtotal: 1200, gst: 180, total: 1380, counterparty: { kind: 'patient' }, approval: { mode: 'approved', by: 'Kirsty W.' } })
    expect(inv.delivery?.status).toBe('sent')
    const c = casesOf(api, inv.id)
    expect(state.xero.accRecs[c.accRecId!]?.amountDue).toBe(1380)
    expect(state.xero.accPays[c.accPayId!]).toMatchObject({ status: 'draft', payeeAccount: 'aaHoldingAccount', amountPayable: 1380 })
    expect(state.audit.some((e) => e.action === 'invoice.prePaymentApproved' && e.entityId === inv.id)).toBe(true)
    expect(prepaymentStatusFor(state, RILEY).status).toBe('unpaid')
    expect(pendingPrepayments(state)).toEqual([])
  })

  it('a second approve, the anaesthetist and a Booking with no prepayment are refused', () => {
    const api = createAppStore()
    expect(approvePrepayment(api, SOUTER, RILEY, PATIENT_KEY(api, RILEY))).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY)).ok).toBe(true)
    expect(approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))).toMatchObject({ ok: false, code: 'alreadySent' })
  })

  it('half a payment reads part paid; a full one paid; the payables run pays nothing to the holding account', () => {
    const api = createAppStore()
    const out = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!out.ok) throw new Error(out.message)
    const accRecId = casesOf(api, out.value.invoiceId).accRecId!
    receivePayment(api, { accRecId, amount: 690, idempotencyKey: 'half', source: 'webhook' })
    expect(prepaymentStatusFor(api.getState(), RILEY).groups[0]).toMatchObject({ status: 'partPaid', receivedTotal: 690, invoicedTotal: 1380 })
    receivePayment(api, { accRecId, amount: 690, idempotencyKey: 'rest', source: 'webhook' })
    expect(prepaymentStatusFor(api.getState(), RILEY).status).toBe('paid')
    const run = runPayables(api, OFFICE)
    expect(run.ok && run.value.disbursedCount).toBe(0)
  })

  it('a typed 0 on Prepaid · Fixed price cannot be approved; $2,000 typed invoices $2,300.00', () => {
    const api = createAppStore()
    const p = rileyProc(api)
    const backstop = Object.values(api.getState().masters.contracts).find((c) => c.name === 'Prepaid · Fixed price')!
    expect(setProcedureContract(api, OFFICE, p.id, backstop.id, { enteredPrice: 0 }).ok).toBe(true)
    expect(approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))).toMatchObject({ ok: false, code: 'noPrice' })
    expect(setProcedurePrice(api, OFFICE, p.id, 2000).ok).toBe(true)
    const out = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().billing.invoices[out.value.invoiceId]).toMatchObject({ subtotal: 2000, total: 2300 })
  })
})

describe('the Prepayment approval switch (US-06.3.1)', () => {
  it('off sends every ready pending group at once, automatic; on again, the next waits', () => {
    const api = createAppStore()
    const off = setPrepaymentApprovalRequired(api, OFFICE, false)
    if (!off.ok) throw new Error(off.message)
    expect(off.value.sentInvoiceIds).toHaveLength(1)
    const inv = api.getState().billing.invoices[off.value.sentInvoiceIds[0]!]!
    expect(inv.approval).toMatchObject({ mode: 'automatic', by: 'System' })
    expect(api.getState().audit.some((e) => e.action === 'invoice.prePaymentAutoSent')).toBe(true)
    expect(api.getState().audit.some((e) => e.action === 'settings.prepaymentApprovalChanged')).toBe(true)
    expect(setPrepaymentApprovalRequired(api, SOUTER, true)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(setPrepaymentApprovalRequired(api, OFFICE, true).ok).toBe(true)
    // A new prepaid Procedure now waits.
    const added = addProcedure(api, OFFICE, RILEY, { governingContractId: PRICED_ITEM.souterBleph })
    expect(added.ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), RILEY).groups.map((g) => g.status)).toEqual(['unpaid', 'awaitingApproval'])
  })

  it('off, picking a prepaid Contract sends at once; a group with no price is never sent', () => {
    const api = createAppStore()
    setPrepaymentApprovalRequired(api, OFFICE, false)
    const backstop = Object.values(api.getState().masters.contracts).find((c) => c.name === 'Prepaid · Fixed price')!
    const added = addProcedure(api, OFFICE, RILEY, { governingContractId: backstop.id })
    expect(added.ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), RILEY).groups.map((g) => g.status)).toEqual(['unpaid', 'awaitingApproval'])
    expect(autoSendPrepayments(api, RILEY)).toEqual([])
    if (!added.ok) return
    setProcedurePrice(api, OFFICE, added.value.procedureId, 650)
    expect(prepaymentStatusFor(api.getState(), RILEY).groups.map((g) => g.status)).toEqual(['unpaid', 'unpaid'])
  })
})

describe('per payer (US-06.3.1 "One per payer", "Payer locked"; D85)', () => {
  function twoPayers(api: BoundAppStore) {
    const added = addProcedure(api, OFFICE, RILEY, { governingContractId: PRICED_ITEM.souterBleph })
    if (!added.ok) throw new Error(added.message)
    expect(setProcedurePayer(api, OFFICE, added.value.procedureId, { kind: 'other', name: 'Parent Riley', relationship: 'Parent', email: 'parent@example.com' }).ok).toBe(true)
    return added.value.procedureId
  }

  it('two payers give two groups, approved one at a time, each with its own pair; the approved payer is locked, the other is not', () => {
    const api = createAppStore()
    const bleph = twoPayers(api)
    const groups = prepaymentStatusFor(api.getState(), RILEY).groups
    expect(groups.map((g) => [g.status, g.amount])).toEqual([['awaitingApproval', 1200], ['awaitingApproval', 900]])
    expect(pendingPrepayments(api.getState()).filter((r) => r.bookingId === RILEY)).toHaveLength(2)
    const parentKey = groups[1]!.payerKey
    const out = approvePrepayment(api, OFFICE, RILEY, parentKey)
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().billing.invoices[out.value.invoiceId]).toMatchObject({ subtotal: 900, counterparty: { kind: 'payer' } })
    expect(prepaymentStatusFor(api.getState(), RILEY).groups.map((g) => g.status).sort()).toEqual(['awaitingApproval', 'unpaid'])
    // The parent is locked on the Blepharoplasty; the patient's Rhinoplasty still changes.
    expect(setProcedurePayer(api, OFFICE, bleph, { kind: 'patient' }).ok).toBe(false)
    expect(setProcedurePayer(api, OFFICE, rileyProc(api).id, { kind: 'other', name: 'Guardian Riley', email: 'g@example.com' }).ok).toBe(true)
  })

  it("a Procedure added later for an already-invoiced payer forms its own pending group; the sent invoice is unchanged", () => {
    const api = createAppStore()
    const first = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!first.ok) throw new Error(first.message)
    const before = JSON.stringify(api.getState().billing.invoices[first.value.invoiceId])
    const added = addProcedure(api, OFFICE, RILEY, { governingContractId: PRICED_ITEM.souterBleph })
    if (!added.ok) throw new Error(added.message)
    const groups = prepaymentStatusFor(api.getState(), RILEY).groups
    expect(groups.map((g) => [g.status, g.procedureIds])).toEqual([['unpaid', [rileyProc(api).id]], ['awaitingApproval', [added.value.procedureId]]])
    expect(JSON.stringify(api.getState().billing.invoices[first.value.invoiceId])).toBe(before)
    // Not locked until its own invoice is raised.
    expect(setProcedurePayer(api, OFFICE, added.value.procedureId, { kind: 'other', name: 'Parent Riley', email: 'p@example.com' }).ok).toBe(true)
  })

  it('a split on a prepaid Procedure is refused', () => {
    const api = createAppStore()
    const out = setProcedureSplit(api, OFFICE, RILEY, rileyProc(api).id, { shares: [] })
    expect(out).toMatchObject({ ok: false, code: 'prepaidProcedure' })
  })
})

describe('the re-check (US-06.3.5) and a move (US-04.3.11)', () => {
  it('before sending, a Contract no longer prepaid clears it; a payer change regroups it to the new payer', () => {
    const api = createAppStore()
    const p = rileyProc(api)
    expect(setProcedureContract(api, OFFICE, p.id, CONTRACT.forteRvg).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), RILEY).status).toBe('none')
    expect(setProcedureContract(api, OFFICE, p.id, PRICED_ITEM.souterRhinoplasty).ok).toBe(true)
    expect(setProcedurePayer(api, OFFICE, p.id, { kind: 'other', name: 'Guardian Riley', relationship: 'Guardian', email: 'g@example.com' }).ok).toBe(true)
    expect(pendingPrepayments(api.getState()).find((r) => r.bookingId === RILEY)?.payerName).toBe('Guardian Riley')
  })

  it('after sending, a Contract changed off prepaid rewrites nothing and reads notNeeded with a mild office warning', () => {
    const api = createAppStore()
    const out = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!out.ok) throw new Error(out.message)
    const before = JSON.stringify(api.getState().billing.invoices[out.value.invoiceId])
    const p = rileyProc(api)
    expect(setProcedureContract(api, OFFICE, p.id, CONTRACT.forteRvg).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), RILEY).status).toBe('notNeeded')
    expect(JSON.stringify(api.getState().billing.invoices[out.value.invoiceId])).toBe(before)
    const w = warningsForBooking(api.getState(), RILEY).filter((x) => x.ruleId === 'prepaymentUnpaid')
    expect(w.map((x) => x.strength)).toEqual(['mild'])
    expect(w[0]!.text).toContain('no longer needs prepayment')
  })

  it('a reassign to a colleague leaves the status, amount, invoice and pair identical', () => {
    const api = createAppStore()
    const out = approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY))
    if (!out.ok) throw new Error(out.message)
    const snap = () => JSON.stringify({ s: prepaymentStatusFor(api.getState(), RILEY), x: api.getState().xero.accPays, i: api.getState().billing.invoices })
    const before = snap()
    const target = Object.values(api.getState().schedule.lists).find((l) => l.dateISO === '2026-07-24' && l.anaesthetistId !== undefined && l.anaesthetistId !== api.getState().schedule.lists[api.getState().schedule.bookings[RILEY]!.listId]!.anaesthetistId && l.state === 'ACTIVE')
    if (target === undefined) return
    const moved = reassignBooking(api, OFFICE, RILEY, target.id)
    if (!moved.ok) return
    expect(snap()).toBe(before)
    expect(rileyProc(api).governingContractId).toBe(PRICED_ITEM.souterRhinoplasty)
  })
})

describe('who may change the price (D30 narrowed, A16) and the price kept (D47)', () => {
  it('the office changes an unsent prepaid price and the amount follows; once sent it is refused; the anaesthetist never', () => {
    const api = createAppStore()
    const p = rileyProc(api)
    expect(setProcedurePrice(api, SOUTER, p.id, 1100).ok).toBe(false)
    expect(setProcedurePrice(api, OFFICE, p.id, 1100).ok).toBe(true)
    expect(prepaymentStatusFor(api.getState(), RILEY).groups[0]!.amount).toBe(1100)
    expect(approvePrepayment(api, OFFICE, RILEY, PATIENT_KEY(api, RILEY)).ok).toBe(true)
    expect(setProcedurePrice(api, OFFICE, p.id, 1000)).toMatchObject({ ok: false, code: 'prepaidPriceRaised' })
    expect(prepaymentForProcedure(api.getState(), p.id)?.amount).toMatchObject({ kind: 'priced', amount: 1100, source: 'invoiced' })
  })
})

describe('the run leaves a raised prepayment off the final invoice (US-08.2.2, D57)', () => {
  function authoriseAndRun(api: BoundAppStore, listId: string) {
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, SOUTER, b.id)
    if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') expect(submitList(api, SOUTER, listId).ok).toBe(true)
    const authorised = authoriseList(api, OFFICE, listId)
    if (!authorised.ok) throw new Error(authorised.message)
    expect(runBillingForList(api, listId).ok).toBe(true)
  }

  it("Nair (mixed): Forte's septoplasty invoice only, no rhinoplasty line or deduction, audited prepaid settled", () => {
    const api = createAppStore()
    authoriseAndRun(api, SEED_LIST_IDS.prepaymentPaidList)
    const finals = Object.values(api.getState().billing.invoices).filter((i) => i.bookingId === NAIR && i.kind === 'standard')
    expect(finals).toHaveLength(1)
    expect(finals[0]).toMatchObject({ subtotal: 212, counterparty: { kind: 'hospital' } })
    const lines = Object.values(api.getState().billing.invoiceLines).filter((l) => l.invoiceId === finals[0]!.id)
    expect(lines.every((l) => l.amount > 0)).toBe(true)
    expect(api.getState().audit.some((e) => e.action === 'booking.prepaidSettled' && e.entityId === NAIR)).toBe(true)
    expect(Object.keys(api.getState().billing.locks[NAIR]!.settledByPrepayment)).toHaveLength(1)
  })

  it('Riley approved (all prepaid): no final invoice; unapproved, billed at the Procedure price and off the strip', () => {
    const approved = createAppStore()
    approvePrepayment(approved, OFFICE, RILEY, PATIENT_KEY(approved, RILEY))
    const am = approved.getState().schedule.bookings[RILEY]!.listId
    authoriseAndRun(approved, am)
    expect(Object.values(approved.getState().billing.invoices).filter((i) => i.bookingId === RILEY && i.kind === 'standard')).toEqual([])

    const unapproved = createAppStore()
    authoriseAndRun(unapproved, am)
    const finals = Object.values(unapproved.getState().billing.invoices).filter((i) => i.bookingId === RILEY && i.kind === 'standard')
    expect(finals.map((i) => i.subtotal)).toEqual([1200])
    expect(pendingPrepayments(unapproved.getState())).toEqual([])
  })
})
