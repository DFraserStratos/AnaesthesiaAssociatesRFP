/**
 * Catch-up Phase 41 session 1 (US-06.3.6, US-06.4.1, US-08.6.5; D30, D31,
 * D57, D68): the prepayment letter on every send, the reminder, template
 * maintenance, and nothing further after a prepaid procedure but by hand: a
 * credit for the whole prepayment invoice, then a fresh additional invoice.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, submitList } from './lifecycle'
import { approvePrepayment, REMINDER_MESSAGES, sendPrepaymentReminder, setPrepaymentApprovalRequired } from './prepaymentActions'
import { lastPrepaymentReminder, previewPrepaymentLetter } from './prepaymentLetter'
import { createLetterTemplate, editLetterTemplate, LETTER_TEMPLATE_MESSAGES, setDefaultLetterTemplate, setLetterTemplateActive } from './letterTemplateActions'
import { prepaidSettlementFor, prepaymentStatusFor } from './prepaymentSelectors'
import { addProcedureEvent, approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { creditOptionFor, submitCredit } from './creditActions'
import { receivePayment } from './paymentActions'
import { ledgerPositionOf, pairForInvoice } from './ledgerSelectors'
import { proceduresForBooking } from './selectors'
import { completeAnswered } from '../test/completeAnswered'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { holdingBalance, holdingEntries } from '../domain/billing/prepayHolding'
import { LETTER_MESSAGES } from '../domain/billing/prepaymentLetter'
import { CREDIT_MESSAGES } from '../shared/procedureEventCopy'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { stageLongerPrepaidProcedure } from './prepaymentFollowupDemo'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const NAIR = SEED_PREPAID_BOOKING_ID
const NAIR_LIST = SEED_LIST_IDS.prepaymentPaidList

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

const souter = (): Actor => ({ who: api.getState().masters.anaesthetists[ANAE.souter]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter })
const delaney = (): Actor => ({ who: api.getState().masters.anaesthetists[ANAE.delaney]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.delaney })
const balance = () => holdingBalance(holdingEntries(api.getState().billing))
const payerKey = (bookingId: string) => prepaymentStatusFor(api.getState(), bookingId).groups[0]!.payerKey

function approveRiley(opts: { letterTemplateId?: string } = {}): string {
  const out = approvePrepayment(api, OFFICE, RILEY, payerKey(RILEY), opts)
  if (!out.ok) throw new Error(out.message)
  return out.value.invoiceId
}
function authorise(listId: string) {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const owner: Actor = { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
}
function pay(invoiceId: string, amount: number, key: string) {
  const c = pairForInvoice(api.getState(), invoiceId)!
  const out = receivePayment(api, { accRecId: c.receivable.xeroAccRecId!, amount, idempotencyKey: key, source: 'webhook' })
  if (!out.ok) throw new Error(out.message)
}
function expectInBalance() {
  const pos = ledgerPositionOf(api.getState())
  expect(pos.imbalance).toBe(0)
  expect(pos.checks).toEqual([])
}
const nairProcedure = () => api.getState().billing.invoices['INV0001']!.procedureIds![0]!

describe('the letter goes with every send (US-06.3.6)', () => {
  it('Approve and send: the default Standard prepayment letter, naming the patient, procedure, date, prepaid amount as the price and the anaesthetist, never the NHI', () => {
    const preview = previewPrepaymentLetter(api.getState(), RILEY, { payerKey: payerKey(RILEY) })!
    const invoiceId = approveRiley()
    const invoice = api.getState().billing.invoices[invoiceId]!
    const patient = api.getState().masters.patients[api.getState().schedule.bookings[RILEY]!.patientId]!
    expect(invoice.letter).toMatchObject({ templateId: 'LT001', templateName: 'Standard prepayment letter', kind: 'request' })
    expect(invoice.letter!.body).toContain(patient.name)
    expect(invoice.letter!.body).toContain('Rhinoplasty')
    expect(invoice.letter!.body).toContain('Friday 24 July 2026')
    expect(invoice.letter!.body).toContain('The anaesthetic fee is $1,380.00, payable before your procedure.')
    expect(invoice.letter!.body).toContain('Dr Melanie Souter')
    expect(invoice.letter!.body).toContain(invoice.invoiceNumber)
    expect(invoice.letter!.body).not.toContain(patient.nhi)
    expect(invoice.letter!.body).not.toMatch(/estimate|deposit/i)
    // The preview equals the sent letter but for the number, allocated when sent.
    expect(preview.body.replace('(allocated when sent)', invoice.invoiceNumber)).toBe(invoice.letter!.body)
  })

  it('a chosen template goes instead; an inactive or wrong-kind template is refused', () => {
    const made = createLetterTemplate(api, OFFICE, { kind: 'request', name: 'Short letter', body: 'Dear {{patientName}}, please pay {{prepaidAmount}} on invoice {{invoiceNumber}}.' })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    expect(approvePrepayment(api, OFFICE, RILEY, payerKey(RILEY), { letterTemplateId: 'LT002' })).toMatchObject({ ok: false, code: 'templateWrongKind' })
    const invoiceId = approveRiley({ letterTemplateId: made.value.id })
    expect(api.getState().billing.invoices[invoiceId]!.letter).toMatchObject({ templateId: made.value.id, templateName: 'Short letter' })
  })

  it('with approval switched off, the automatic send carries the default letter', () => {
    const out = setPrepaymentApprovalRequired(api, OFFICE, false)
    expect(out.ok).toBe(true)
    const sent = out.ok ? out.value.sentInvoiceIds : []
    expect(sent.length).toBeGreaterThan(0)
    for (const id of sent) expect(api.getState().billing.invoices[id]!.letter).toMatchObject({ templateId: 'LT001' })
  })

  it('the sent letter is a snapshot: editing the template later changes nothing already sent', () => {
    const invoiceId = approveRiley()
    const before = api.getState().billing.invoices[invoiceId]!.letter
    expect(editLetterTemplate(api, OFFICE, 'LT001', { name: 'Standard prepayment letter', body: 'Dear {{patientName}}, the fee is {{prepaidAmount}}.' }).ok).toBe(true)
    expect(api.getState().billing.invoices[invoiceId]!.letter).toEqual(before)
  })

  it("the seed's INV0001 was sent with the Standard prepayment letter", () => {
    expect(api.getState().billing.invoices['INV0001']!.letter).toMatchObject({ templateId: 'LT001', kind: 'request' })
    expect(api.getState().billing.invoices['INV0001']!.letter!.body).toContain('$1,380.00')
  })
})

describe('template maintenance (office only)', () => {
  it('validates the words: unknown fields, a missing prepaid amount and estimate wording are refused', () => {
    expect(createLetterTemplate(api, OFFICE, { kind: 'request', name: 'X', body: 'Pay {{estimate}} now {{prepaidAmount}}.' })).toMatchObject({ ok: false, code: 'unknownMergeField' })
    expect(createLetterTemplate(api, OFFICE, { kind: 'request', name: 'X', body: 'Dear {{patientName}}, please pay.' })).toMatchObject({ ok: false, code: 'missingPrepaidAmount' })
    expect(createLetterTemplate(api, OFFICE, { kind: 'request', name: 'X', body: 'The estimated fee is {{prepaidAmount}}.' })).toMatchObject({ ok: false, code: 'estimateWording', message: LETTER_MESSAGES.estimateWording })
    expect(createLetterTemplate(api, OFFICE, { kind: 'reminder', name: 'X', body: 'Please pay invoice {{invoiceNumber}}.' })).toMatchObject({ ok: false, code: 'missingAmountOutstanding' })
    expect(createLetterTemplate(api, OFFICE, { kind: 'request', name: 'Standard prepayment letter', body: 'Fee {{prepaidAmount}}.' })).toMatchObject({ ok: false, code: 'nameTaken' })
    expect(createLetterTemplate(api, souter(), { kind: 'request', name: 'Mine', body: 'Fee {{prepaidAmount}}.' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('one default per kind; the default and the last active template cannot be switched off', () => {
    expect(setLetterTemplateActive(api, OFFICE, 'LT001', false)).toMatchObject({ ok: false, code: 'defaultInactive', message: LETTER_TEMPLATE_MESSAGES.defaultInactive })
    const made = createLetterTemplate(api, OFFICE, { kind: 'request', name: 'Second letter', body: 'Fee {{prepaidAmount}}, invoice {{invoiceNumber}}.' })
    if (!made.ok) throw new Error(made.message)
    expect(setDefaultLetterTemplate(api, OFFICE, made.value.id).ok).toBe(true)
    const requests = Object.values(api.getState().masters.prepaymentLetterTemplates).filter((t) => t.kind === 'request')
    expect(requests.filter((t) => t.isDefault).map((t) => t.id)).toEqual([made.value.id])
    expect(setLetterTemplateActive(api, OFFICE, 'LT001', false).ok).toBe(true)
    expect(setLetterTemplateActive(api, OFFICE, 'LT002', false)).toMatchObject({ ok: false, code: 'defaultInactive' })
    const audit = api.getState().audit.map((a) => a.action)
    expect(audit).toEqual(expect.arrayContaining(['letterTemplate.create', 'letterTemplate.setDefault', 'letterTemplate.deactivate']))
  })
})

describe('Send prepayment reminder', () => {
  it('awaiting approval has no invoice, so nothing to remind', () => {
    expect(sendPrepaymentReminder(api, OFFICE, RILEY)).toMatchObject({ ok: false, code: 'noOutstandingPrepayment', message: REMINDER_MESSAGES.noOutstandingPrepayment })
  })

  it('office only; two reminders append two; a half payment lowers the amount; the status never moves', () => {
    const invoiceId = approveRiley()
    expect(sendPrepaymentReminder(api, souter(), RILEY)).toMatchObject({ ok: false, code: 'officeOnly' })
    const status = prepaymentStatusFor(api.getState(), RILEY).status
    expect(sendPrepaymentReminder(api, OFFICE, RILEY).ok).toBe(true)
    expect(lastPrepaymentReminder(api.getState(), invoiceId)).toMatchObject({ amountOutstanding: 1380, letter: { templateId: 'LT002' } })
    expect(lastPrepaymentReminder(api.getState(), invoiceId)!.letter.body).toContain('$1,380.00 of the anaesthetic fee')
    pay(invoiceId, 690, 'RILEY-HALF')
    expect(sendPrepaymentReminder(api, OFFICE_SIMULATION_ACTOR, RILEY).ok).toBe(true)
    expect(api.getState().billing.invoices[invoiceId]!.prepaymentReminders).toHaveLength(2)
    expect(lastPrepaymentReminder(api.getState(), invoiceId)).toMatchObject({ amountOutstanding: 690 })
    expect(prepaymentStatusFor(api.getState(), RILEY).status).toBe('partPaid')
    expect(status).toBe('unpaid')
    expect(api.getState().audit.filter((a) => a.action === 'invoice.prepaymentReminder')).toHaveLength(2)
  })

  it('a paid prepayment has nothing to remind', () => {
    expect(sendPrepaymentReminder(api, OFFICE, NAIR)).toMatchObject({ ok: false, code: 'noOutstandingPrepayment' })
  })
})

describe('nothing further after a prepaid procedure (US-06.4.1)', () => {
  it("authorising Nair's List bills nothing for her rhinoplasty and raises nothing later; the block reads the prepaid price, the BTM for reference and the transfer", () => {
    const before = Object.keys(api.getState().billing.invoices).length
    authorise(NAIR_LIST)
    const raised = Object.values(api.getState().billing.invoices).slice(before)
    expect(raised.every((i) => !(i.procedureIds ?? []).includes(nairProcedure()))).toBe(true)
    // The next event run raises nothing for the difference, either way.
    expect(runEventInvoicing(api, OFFICE).ok).toBe(false)
    const block = prepaidSettlementFor(api.getState(), nairProcedure())!
    expect(block).toMatchObject({ prepaidAmount: 1200, prepaymentInvoice: { number: 'AA-2026-0001', status: 'paid' }, transfer: { toAnaesthetistId: ANAE.souter, amount: 1380 }, additionalInvoices: [], credits: [] })
    expect(typeof block.recordedBtmUnits).toBe('number')
    expectInBalance()
  })
})

describe('longer than planned (Stage longer prepaid procedure)', () => {
  it('a recorded BTM far above the prepaid amount raises nothing at authorise or later; an additional invoice by hand links to the prepayment invoice', () => {
    const owner = souter()
    for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === NAIR_LIST && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
    expect(submitList(api, owner, NAIR_LIST).ok).toBe(true)
    const staged = stageLongerPrepaidProcedure(api, OFFICE, NAIR_LIST, NAIR)
    expect(staged.ok).toBe(true)
    const before = Object.keys(api.getState().billing.invoices).length
    expect(authoriseList(api, OFFICE, NAIR_LIST).ok).toBe(true)
    expect(Object.values(api.getState().billing.invoices).slice(before).some((i) => (i.procedureIds ?? []).includes(nairProcedure()))).toBe(false)
    expect(runEventInvoicing(api, OFFICE).ok).toBe(false)
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.negativeInvoices).filter((r) => !r.id.startsWith('HS'))).toEqual([])
    const add = addProcedureEvent(api, OFFICE, nairProcedure(), { kind: 'additionalInvoice', occurredOnISO: '2026-07-24', party: { sameAs: true }, lines: [{ description: 'Rhinoplasty, longer than planned', quantity: 1, unitAmount: 300 }] })
    if (!add.ok) throw new Error(add.message)
    expect(approveProcedureEvent(api, OFFICE, add.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const fresh = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(fresh).toMatchObject({ kind: 'additional', subtotal: 300 })
    expect(fresh.lineage).toEqual(expect.arrayContaining([expect.objectContaining({ invoiceId: 'INV0001' })]))
    expect(pairForInvoice(api.getState(), fresh.id)!.payable?.payee).toEqual({ kind: 'anaesthetist', anaesthetistId: ANAE.souter })
    expectInBalance()
  })
})

describe('differences by hand: the whole prepayment invoice credited, then a fresh additional invoice (D31)', () => {
  function credit(actor: Actor) {
    const sub = submitCredit(api, actor, { invoiceId: 'INV0001', reason: 'Half the procedure was done', cause: 'correction', replacements: [] })
    if (!sub.ok) throw new Error(sub.message)
    const appr = approveProcedureEvent(api, OFFICE, sub.value.creditEventId)
    if (!appr.ok) throw new Error(appr.message)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    return api.getState().billing.creditNotes[run.value.creditNoteIds[0]!]!
  }

  it("after authorise, Dr Souter's whole credit of INV0001: the credit note linked to it, a negative invoice to her, INV0001 unchanged, then a $600.00 additional invoice payable to her, the ledger in balance throughout", () => {
    authorise(NAIR_LIST)
    const original = structuredClone(api.getState().billing.invoices['INV0001'])
    expect(creditOptionFor(api.getState(), { role: 'anaesthetist', anaesthetistId: ANAE.souter }, nairProcedure())).toMatchObject({ kind: 'enabled', invoiceId: 'INV0001' })
    const note = credit(souter())
    expect(note).toMatchObject({ originalInvoiceId: 'INV0001', subtotal: 1200, total: 1380 })
    const negative = api.getState().billing.negativeInvoices[note.negativeInvoiceId!]!
    expect(negative).toMatchObject({ anaesthetistId: ANAE.souter, amount: 1380 })
    expect(api.getState().billing.invoices['INV0001']).toEqual(original)
    expect(api.getState().schedule.procedureEvents[note.creditEventId]).toMatchObject({ kind: 'credit', procedureId: nairProcedure() })
    expectInBalance()
    // Anything still owed: a fresh additional invoice, its payable to whoever did the List.
    const add = addProcedureEvent(api, souter(), nairProcedure(), { kind: 'additionalInvoice', occurredOnISO: '2026-07-24', party: { sameAs: true }, lines: [{ description: 'Rhinoplasty, half the procedure', quantity: 1, unitAmount: 600 }] })
    if (!add.ok) throw new Error(add.message)
    expect(approveProcedureEvent(api, OFFICE, add.value.eventId).ok).toBe(true)
    const run = runEventInvoicing(api, OFFICE)
    if (!run.ok) throw new Error(run.message)
    const fresh = api.getState().billing.invoices[run.value.invoiceIds[0]!]!
    expect(fresh).toMatchObject({ kind: 'additional', subtotal: 600 })
    const pair = pairForInvoice(api.getState(), fresh.id)!
    expect(pair.payable?.payee).toEqual({ kind: 'anaesthetist', anaesthetistId: ANAE.souter })
    expect(prepaidSettlementFor(api.getState(), nairProcedure())).toMatchObject({ prepaymentInvoice: { status: 'credited' }, credits: [{ total: 1380 }], additionalInvoices: [{ id: fresh.id }] })
    expectInBalance()
  })

  it('before authorise (the office): the AA Holding account falls by what it held, no negative invoice, and Authorise bills the Procedure normally', () => {
    expect(balance()).toBe(1380)
    const note = credit(OFFICE)
    expect(note.negativeInvoiceId).toBeUndefined()
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24; Wave 5 join).
    expect(Object.values(api.getState().billing.negativeInvoices).filter((r) => !r.id.startsWith('HS'))).toEqual([])
    expect(balance()).toBe(0)
    expectInBalance()
    // The credited invoice no longer counts as issued: the Procedure bills at authorise and nothing is transferred for it.
    const before = Object.keys(api.getState().billing.invoices).length
    // Credited by hand: no fresh prepayment is derived for it (the payer's money is held), so approval off sends nothing.
    expect(prepaymentStatusFor(api.getState(), NAIR).groups.some((g) => g.status === 'awaitingApproval')).toBe(false)
    const off = setPrepaymentApprovalRequired(api, OFFICE, false)
    expect(off.ok && off.value.sentInvoiceIds.every((id) => api.getState().billing.invoices[id]!.bookingId !== NAIR)).toBe(true)
    authorise(NAIR_LIST)
    const raised = Object.values(api.getState().billing.invoices).slice(before)
    expect(raised.some((i) => (i.procedureIds ?? []).includes(nairProcedure()) && i.kind === 'standard')).toBe(true)
    expect(Object.values(api.getState().billing.transfers).filter((t) => t.invoiceId === 'INV0001')).toEqual([])
    expectInBalance()
  })

  it('refusals: split, a colleague, before authorise for the anaesthetist, and one credit per prepayment invoice', () => {
    expect(submitCredit(api, OFFICE, { invoiceId: 'INV0001', reason: 'x', cause: 'split', replacements: [] })).toMatchObject({ ok: false, code: 'kindNotCreditable', message: CREDIT_MESSAGES.prepaymentNoSplit })
    expect(submitCredit(api, souter(), { invoiceId: 'INV0001', reason: 'x', cause: 'correction', replacements: [] })).toMatchObject({ ok: false, code: 'prepaymentBeforeAuthorise' })
    authorise(NAIR_LIST)
    expect(submitCredit(api, delaney(), { invoiceId: 'INV0001', reason: 'x', cause: 'correction', replacements: [] })).toMatchObject({ ok: false, code: 'notOwnProcedure' })
    credit(souter())
    expect(submitCredit(api, OFFICE, { invoiceId: 'INV0001', reason: 'x', cause: 'correction', replacements: [] })).toMatchObject({ ok: false, code: 'alreadyCredited' })
  })

  it('a by-hand credit pays no refund: the money received stays held for the payer', () => {
    // Measured from before the credit: the seed already holds Heather Sinclair's $260.00 (catch-up Phase 40, D24; Wave 5 join).
    const heldBefore = ledgerPositionOf(api.getState()).creditsHeldForPayers
    const note = credit(OFFICE)
    expect(note.reversal.heldForPayer).toBe(1380)
    expect(ledgerPositionOf(api.getState()).creditsHeldForPayers - heldBefore).toBe(1380)
    expect(proceduresForBooking(api.getState(), NAIR).length).toBeGreaterThan(0)
  })
})
