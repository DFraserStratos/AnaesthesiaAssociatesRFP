/**
 * Catch-up Phase 22 review fixes and the plan review's missing tests, at
 * store level: a split whose party has left the Booking, a split on a prepaid
 * Procedure, the additional procedure's BTM on a split share, a split on an
 * office price override, a guardian as a split party, the stand-in's send,
 * the prepayment invoice's delivery, the ACCPAY's tax invoice snapshot, the
 * GST number on the anaesthetist, and S3's figures.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { runBillingForList, type BillingRunResult } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { authoriseList, submitList } from './lifecycle'
import { setProcedurePrice } from './pricingActions'
import { setProcedurePayer } from './payerActions'
import { contractPartyFor, setProcedureSplit } from './splitActions'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { authoriseAsSimulatedOffice } from './officeStandIn'
import { addAnaesthetist, editAnaesthetist } from './mastersActions'
import { warningsForBooking } from './warnings'
import { billingContextForBooking, prePaymentInvoicesForBooking, proceduresForBooking } from './selectors'
import { clockISO, type Actor } from './mutate'
import { validateBookingForBilling } from '../domain/billing/validateBookingForBilling'
import { btmBreakdownText, GST_NUMBER_INVALID } from '../domain/billing/invoicePresentation'
import { buildInvoicesForBooking, PREPAID_SPLIT_MESSAGE } from '../domain/billing/invoiceBuild'
import { ANAE, INS, PAT, SEED_MARKERS } from '../domain/seed'
import type { CounterpartyRef, FeeSplit, Invoice, InvoiceLine } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function marker(key: string): string {
  const m = SEED_MARKERS[key]
  if (m === undefined) throw new Error(`missing marker ${key}`)
  return m.entityId
}

const FEE_SPLIT_BOOKING = marker('feeSplitBooking')
const PREPAYMENT_BOOKING = marker('prepaymentBooking')
const PRENTICE_PM = 'L-34821-2026-07-20-PM'
const NIB: CounterpartyRef = { kind: 'insurer', id: INS.nib }
const PARTY_GONE = 'a party in the split is no longer on this Booking'

function store(): BoundAppStore {
  return createAppStore()
}

function listOf(api: BoundAppStore, bookingId: string): string {
  const booking = api.getState().schedule.bookings[bookingId]
  if (booking === undefined) throw new Error(`missing booking ${bookingId}`)
  return booking.listId
}

function procOf(api: BoundAppStore, bookingId: string, index = 0): string {
  const proc = proceduresForBooking(api.getState(), bookingId)[index]
  if (proc === undefined) throw new Error(`booking ${bookingId} has no procedure ${index}`)
  return proc.id
}

/** ACTIVE to submit (office) to authorise to run. Every step must succeed. */
function stageAndBill(api: BoundAppStore, listId: string): BillingRunResult {
  const list = api.getState().schedule.lists[listId]
  if (list === undefined) throw new Error(`missing list ${listId}`)
  if (list.state === 'ACTIVE') {
    const submitted = submitList(api, OFFICE, listId)
    if (!submitted.ok) throw new Error(`submit refused: ${submitted.message}`)
  }
  const authorised = authoriseList(api, OFFICE, listId)
  if (!authorised.ok) throw new Error(`authorise refused: ${authorised.message}`)
  const run = runBillingForList(api, listId)
  if (!run.ok) throw new Error(`run refused: ${run.message}`)
  return run.value
}

function invoicesForBooking(api: BoundAppStore, bookingId: string): Invoice[] {
  return Object.values(api.getState().billing.invoices)
    .filter((i) => i.bookingId === bookingId && i.kind === 'standard')
    .sort((a, b) => a.id.localeCompare(b.id))
}

function linesOf(api: BoundAppStore, invoiceId: string): InvoiceLine[] {
  return Object.values(api.getState().billing.invoiceLines)
    .filter((l) => l.invoiceId === invoiceId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

function payerRef(api: BoundAppStore, bookingId: string): CounterpartyRef {
  const payer = proceduresForBooking(api.getState(), bookingId)[0]?.payer
  if (payer === undefined || payer.kind !== 'other') throw new Error("expected another payer on the Procedure")
  return { kind: 'payer', id: payer.id }
}

/** nib 50%, the given party the rest. */
function nibHalfAnd(party: CounterpartyRef): FeeSplit {
  return { shares: [{ party: NIB, basis: { kind: 'percent', percent: 50 } }, { party, basis: { kind: 'rest' } }] }
}

// ---------------------------------------------------------------------------

describe('a split whose party has left the Booking (review fix)', () => {
  /** Another payer on BK0025, split 50% nib and the rest to them, then the payer renamed (a new BP id). */
  function renamedPayer(api: BoundAppStore): { oldRef: CounterpartyRef; newRef: CounterpartyRef; procedureId: string } {
    expect(setProcedurePayer(api, OFFICE, procOf(api, FEE_SPLIT_BOOKING), { kind: 'other', name: 'Jo Prentice', relationship: 'Guardian', email: 'jo.prentice@example.net' }).ok).toBe(true)
    const oldRef = payerRef(api, FEE_SPLIT_BOOKING)
    const procedureId = procOf(api, FEE_SPLIT_BOOKING)
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, nibHalfAnd(oldRef)).ok).toBe(true)
    const payer = proceduresForBooking(api.getState(), FEE_SPLIT_BOOKING)[0]!.payer
    expect(payer.kind).toBe('other')
    expect(setProcedurePayer(api, OFFICE, procOf(api, FEE_SPLIT_BOOKING), { kind: 'other', id: oldRef.id, name: 'Sam Carter', relationship: 'Guardian', email: 'sam.carter@example.net' }).ok).toBe(true)
    const newRef = payerRef(api, FEE_SPLIT_BOOKING)
    expect(newRef.id).not.toBe(oldRef.id)
    return { oldRef, newRef, procedureId }
  }

  it('fails validation on field split with the party gone reason', () => {
    const api = store()
    const { procedureId } = renamedPayer(api)
    const state = api.getState()
    const booking = state.schedule.bookings[FEE_SPLIT_BOOKING]!
    const ctx = billingContextForBooking(state, booking)
    expect(ctx).toBeDefined()
    const failures = validateBookingForBilling(booking, proceduresForBooking(state, FEE_SPLIT_BOOKING), ctx!)
    const split = failures.find((f) => f.field === 'split')
    expect(split).toMatchObject({ procedureId, field: 'split' })
    expect(split!.message).toContain(PARTY_GONE)
  })

  it('the run fails the Booking with splitDoesNotFit and never invoices the old BP id', () => {
    const api = store()
    const { oldRef } = renamedPayer(api)
    const result = stageAndBill(api, PRENTICE_PM)
    const exception = result.exceptions.find((e) => e.bookingId === FEE_SPLIT_BOOKING)
    expect(exception).toMatchObject({ code: 'splitDoesNotFit' })
    expect(exception!.message).toContain(PARTY_GONE)
    expect(invoicesForBooking(api, FEE_SPLIT_BOOKING)).toHaveLength(0)
    const toOld = Object.values(api.getState().billing.invoices).filter((i) => i.counterparty.kind === oldRef.kind && i.counterparty.id === oldRef.id)
    expect(toOld).toHaveLength(0)
  })

  it('raises the splitDoesNotFit warning on the Booking', () => {
    const api = store()
    renamedPayer(api)
    const warning = warningsForBooking(api.getState(), FEE_SPLIT_BOOKING).find((w) => w.ruleId === 'splitDoesNotFit')
    expect(warning).toBeDefined()
    expect(warning!.text).toContain(PARTY_GONE)
  })

  it('setProcedureSplit refuses partyUnknown for a share naming a party not on the Booking', () => {
    const api = store()
    const { oldRef, newRef, procedureId } = renamedPayer(api)
    const before = api.getState().schedule.procedures[procedureId]?.split
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, nibHalfAnd(oldRef))).toMatchObject({ ok: false, code: 'partyUnknown' })
    // The patient is no longer the payer either.
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, nibHalfAnd({ kind: 'patient', id: PAT.prentice }))).toMatchObject({ ok: false, code: 'partyUnknown' })
    expect(api.getState().schedule.procedures[procedureId]?.split).toEqual(before)
    // The new payer is accepted, and the warning goes.
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procedureId, nibHalfAnd(newRef)).ok).toBe(true)
    expect(warningsForBooking(api.getState(), FEE_SPLIT_BOOKING).some((w) => w.ruleId === 'splitDoesNotFit')).toBe(false)
  })
})

describe('a prepaid Procedure with a split (review fix)', () => {
  it('the final build refuses prepaidSplit for a prepaid Procedure left off with a split, and bills nothing (catch-up Phase 27)', () => {
    // Catch-up Phase 27: approval no longer builds through the final invoice's guards, so the
    // prepaidSplit refusal is read where it now lives: the final build of a left-off Procedure.
    const api = store()
    const procedureId = procOf(api, FEE_SPLIT_BOOKING)
    const prepaidContract = api.getState().schedule.procedures[procOf(api, PREPAYMENT_BOOKING)]!.governingContractId
    expect(prepaidContract).toBeDefined()
    // Move P0026 to the prepaid Contract, keeping its split (a direct state edit).
    api.setState((s) => ({
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: { ...s.schedule.procedures[procedureId]!, governingContractId: prepaidContract } } },
    }))
    expect(api.getState().schedule.procedures[procedureId]?.split).toBeDefined()
    const s = api.getState()
    const booking = s.schedule.bookings[FEE_SPLIT_BOOKING]!
    const ctx = billingContextForBooking(s, booking)!
    const built = buildInvoicesForBooking(booking, proceduresForBooking(s, FEE_SPLIT_BOOKING), {
      ...ctx,
      patientId: booking.patientId,
      prepaidLeftOff: { [procedureId]: { amount: 1200, prepaymentInvoiceId: 'INV-PRE' } },
    })
    expect(built).toMatchObject({ kind: 'exception', code: 'prepaidSplit', message: PREPAID_SPLIT_MESSAGE })
    expect(prePaymentInvoicesForBooking(s, FEE_SPLIT_BOOKING)).toHaveLength(0)
  })
})

describe('the BTM breakdown on a split share of an additional procedure', () => {
  it('carries btm.units equal to the charged time units and prints the additional wording', () => {
    const api = store()
    const bookingId = marker('splitBillingBooking')
    const second = procOf(api, bookingId, 1)
    const holder = contractPartyFor(api.getState(), second)
    expect(holder).toBeDefined()
    expect(setProcedureSplit(api, OFFICE, bookingId, second, { shares: [{ party: holder!, basis: { kind: 'percent', percent: 50 } }, { party: NIB, basis: { kind: 'rest' } }] }).ok).toBe(true)
    stageAndBill(api, listOf(api, bookingId))
    const lines = invoicesForBooking(api, bookingId).flatMap((i) => linesOf(api, i.id)).filter((l) => l.procedureId === second)
    // Two share lines, each 50% of 2 time units at $26.50 ($53).
    expect(lines.map((l) => l.amount)).toEqual([26.5, 26.5])
    for (const line of lines) {
      expect(line.btm).toMatchObject({ time: 2, units: 2, unitValue: 26.5 })
      expect(btmBreakdownText(line.btm!)).toBe('Additional procedure: Time 2 units at $26.50')
    }
  })
})

describe('a split on an office-typed price', () => {
  it('divides the typed price and conserves it to the cent', () => {
    const api = store()
    const procedureId = procOf(api, FEE_SPLIT_BOOKING)
    expect(setProcedurePrice(api, OFFICE, procedureId, 200).ok).toBe(true)
    stageAndBill(api, PRENTICE_PM)
    const invoices = invoicesForBooking(api, FEE_SPLIT_BOOKING)
    // The office types $200: nib keeps its typed $132.50, Alan the rest $67.50.
    expect(invoices.map((i) => [i.counterparty.kind, i.subtotal])).toEqual([
      ['insurer', 132.5],
      ['patient', 67.5],
    ])
    expect(invoices.reduce((s, i) => s + i.subtotal, 0)).toBe(200)
    expect(invoices.map((i) => i.split?.feeExGst)).toEqual([200, 200])
  })
})

describe('a guardian as a split party', () => {
  it("bills the guardian's share to the guardian's name and email; nib's share keeps nib's delivery", () => {
    const api = store()
    expect(setProcedurePayer(api, OFFICE, procOf(api, FEE_SPLIT_BOOKING), { kind: 'other', name: 'Jo Prentice', relationship: 'Guardian', email: 'jo.prentice@example.net' }).ok).toBe(true)
    const guardian = payerRef(api, FEE_SPLIT_BOOKING)
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procOf(api, FEE_SPLIT_BOOKING), nibHalfAnd(guardian)).ok).toBe(true)
    stageAndBill(api, PRENTICE_PM)
    const atISO = clockISO(api.getState().clock)
    const invoices = invoicesForBooking(api, FEE_SPLIT_BOOKING)
    expect(invoices).toHaveLength(2)
    const nib = invoices.find((i) => i.counterparty.kind === 'insurer')!
    const jo = invoices.find((i) => i.counterparty.kind === 'payer')!
    expect(jo.counterparty).toEqual(guardian)
    expect(jo.billedTo).toMatchObject({ name: 'Jo Prentice', email: 'jo.prentice@example.net' })
    expect(jo.delivery).toEqual({ method: 'email', status: 'sent', sends: [{ atISO, to: 'jo.prentice@example.net', by: 'Billing run' }] })
    expect(nib.billedTo?.email).not.toBe('jo.prentice@example.net')
    expect(nib.delivery).toEqual({ method: 'email', status: 'sent', sends: [{ atISO, to: 'claims@nib.example', by: 'Billing run' }] })
    expect([nib.subtotal, jo.subtotal]).toEqual([106, 106])
  })
})

describe('the PWA stand-in runs the same send as the billing run', () => {
  it('authoriseAsSimulatedOffice stamps delivery and audits invoice.sent as the billing run', () => {
    const api = store()
    const res = authoriseAsSimulatedOffice(api, PRENTICE_PM)
    expect(res.ok && res.value.billed).toBe(true)
    const atISO = clockISO(api.getState().clock)
    const invoices = invoicesForBooking(api, FEE_SPLIT_BOOKING)
    expect(invoices).toHaveLength(2)
    for (const inv of invoices) {
      expect(inv.delivery).toMatchObject({ method: 'email', status: 'sent', sends: [{ atISO, by: 'Billing run' }] })
      const sent = api.getState().audit.filter((a) => a.action === 'invoice.sent' && a.entityId === inv.id)
      expect(sent).toHaveLength(1)
      expect(sent[0]).toMatchObject({ who: 'Billing run', after: { to: inv.delivery?.status === 'sent' ? inv.delivery.sends[0]?.to : undefined, atISO } })
    }
    // The same stamps as the office authorising and running the run itself.
    const direct = store()
    stageAndBill(direct, PRENTICE_PM)
    expect(invoicesForBooking(direct, FEE_SPLIT_BOOKING).map((i) => i.delivery)).toEqual(invoices.map((i) => i.delivery))
  })
})

describe('the prepayment invoice is sent as it is raised', () => {
  it('approving the prepayment (catch-up Phase 27) stamps delivery on the prepayment invoice', () => {
    const api = store()
    expect(approveAllPrepayments(api, PREPAYMENT_BOOKING, OFFICE)).toHaveLength(1)
    const atISO = clockISO(api.getState().clock)
    const [invoice] = prePaymentInvoicesForBooking(api.getState(), PREPAYMENT_BOOKING)
    expect(invoice).toBeDefined()
    // Annette Riley holds an email: the invoice is emailed at the clock time.
    expect(invoice!.delivery).toEqual({ method: 'email', status: 'sent', sends: [{ atISO, to: 'annette.riley17@example.net', by: 'Billing run' }] })
    expect(api.getState().audit.filter((a) => a.action === 'invoice.sent' && a.entityId === invoice!.id)).toHaveLength(1)
  })
})

describe("the ACCPAY's tax invoice is a snapshot", () => {
  it('survives a later change to the GST number on the anaesthetist', () => {
    const api = store()
    stageAndBill(api, PRENTICE_PM)
    handoffListPairs(api, PRENTICE_PM)
    const invoices = invoicesForBooking(api, FEE_SPLIT_BOOKING)
    expect(invoices).toHaveLength(2)
    const accPayFor = (inv: Invoice) => {
      const c = api.getState().billing.ledger[inv.caseReference]
      const accPayId = c !== undefined && c.kind !== 'aaFee' ? c.payable?.xeroAccPayId : undefined
      return accPayId !== undefined ? api.getState().xero.accPays[accPayId] : undefined
    }
    for (const inv of invoices) {
      expect(inv.supplier).toEqual({ anaesthetistId: ANAE.souter, name: 'Dr Melanie Souter', gstNumber: '104348211' })
      expect(accPayFor(inv)?.taxInvoice?.supplierGstNumber).toBe('104348211')
    }
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { gstNumber: '12-345-678' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.gstNumber).toBe('12345678')
    for (const inv of invoicesForBooking(api, FEE_SPLIT_BOOKING)) {
      expect(inv.supplier?.gstNumber).toBe('104348211')
      const tax = accPayFor(inv)?.taxInvoice
      expect(tax?.supplierGstNumber).toBe('104348211')
      expect(tax?.wording).toContain('GST 104-348-211')
    }
  })
})

describe('the GST number on the anaesthetist (DM-62)', () => {
  it('editAnaesthetist refuses "12", stores "104 348 299" as digits, audits it, and clears on blank', () => {
    const api = store()
    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { gstNumber: '12' })).toMatchObject({ ok: false, code: 'invalidGstNumber', message: GST_NUMBER_INVALID })
    expect(GST_NUMBER_INVALID).toBe('Enter a GST number of 8 or 9 digits.')
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.gstNumber).toBe('104348211')

    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { gstNumber: '104 348 299' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.souter]?.gstNumber).toBe('104348299')
    const audit = api.getState().audit.filter((a) => a.action === 'anaesthetist.update' && a.entityId === ANAE.souter).at(-1)
    expect(audit).toMatchObject({ before: { gstNumber: '104348211' }, after: { gstNumber: '104348299' } })

    expect(editAnaesthetist(api, OFFICE, ANAE.souter, { gstNumber: '  ' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.souter]).not.toHaveProperty('gstNumber')
  })

  it('addAnaesthetist refuses "12" and stores a spaced number as digits; none when left out', () => {
    const api = store()
    const base = { name: 'Dr New Person', phone: '021 555 9001', email: 'n.person@aa-associates.example', unitValue: 30, bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' }, startDateISO: api.getState().clock.todayISO }
    expect(addAnaesthetist(api, OFFICE, { ...base, registrationNumber: '99001', hpiId: '99GSTA', gstNumber: '12' })).toMatchObject({ ok: false, code: 'invalidGstNumber', message: GST_NUMBER_INVALID })
    expect(api.getState().masters.anaesthetists['99001']).toBeUndefined()
    expect(addAnaesthetist(api, OFFICE, { ...base, registrationNumber: '99001', hpiId: '99GSTA', gstNumber: '104 348 299' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists['99001']?.gstNumber).toBe('104348299')
    expect(addAnaesthetist(api, OFFICE, { ...base, registrationNumber: '99002', hpiId: '99GSTB', name: 'Dr Other Person' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists['99002']).not.toHaveProperty('gstNumber')
  })

  it('Dr Strand holds no GST number', () => {
    expect(store().getState().masters.anaesthetists['47733']?.gstNumber).toBeUndefined()
  })
})

describe('S3 at store level: re-splitting the Prentice fee before authorise', () => {
  const alanRest = (nibPercent: number): FeeSplit => ({
    shares: [
      { party: NIB, basis: { kind: 'percent', percent: nibPercent } },
      { party: { kind: 'patient', id: PAT.prentice }, basis: { kind: 'rest' } },
    ],
  })

  it.each([
    { pct: 62.5, nibTotal: 152.38, alanTotal: 91.43 },
    { pct: 60, nibTotal: 146.28, alanTotal: 97.52 },
  ])('nib at $pct percent: nib $nibTotal, Alan Prentice $alanTotal (with GST)', ({ pct, nibTotal, alanTotal }) => {
    const api = store()
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procOf(api, FEE_SPLIT_BOOKING), alanRest(pct)).ok).toBe(true)
    stageAndBill(api, PRENTICE_PM)
    expect(invoicesForBooking(api, FEE_SPLIT_BOOKING).map((i) => [i.counterparty.kind, i.total])).toEqual([
      ['insurer', nibTotal],
      ['patient', alanTotal],
    ])
  })

  it('removing the split gives one invoice of $243.80 to Alan Prentice', () => {
    const api = store()
    expect(setProcedureSplit(api, OFFICE, FEE_SPLIT_BOOKING, procOf(api, FEE_SPLIT_BOOKING), null).ok).toBe(true)
    stageAndBill(api, PRENTICE_PM)
    const invoices = invoicesForBooking(api, FEE_SPLIT_BOOKING)
    expect(invoices).toHaveLength(1)
    expect(invoices[0]).toMatchObject({ counterparty: { kind: 'patient', id: PAT.prentice }, total: 243.8, billedTo: { name: 'Alan Prentice' } })
  })
})
