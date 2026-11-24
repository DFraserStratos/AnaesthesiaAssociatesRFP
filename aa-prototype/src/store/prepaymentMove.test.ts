/**
 * A moved prepaid Booking changes nothing; the optional patient email
 * (catch-up Phase 41; US-06.5.4, D38; OQ-120's default, D68).
 *
 * Riley's prepayment is approved, sent and half paid, then moved through each
 * move path there is: the invoice, its ledger pair, the Xero pairs, the
 * prepayment status and the AA Holding account deep-equal before and after,
 * no invoice is raised, no prepayment or invoice audit row is added and no
 * patient is emailed. The email is the office's choice afterwards: it names
 * the new anaesthetist, the same amount, never the NHI, and changes nothing
 * on the ledger. After the receiver's List is authorised, 27a's transfer pays
 * the receiver.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, cancelBooking, reassignBooking, submitList } from './lifecycle'
import { moveListToSlot, reassignList } from './slotActions'
import { markUnavailableAndMoveList, moveBookingToAnaesthetist, moveListToOffice, pushListToSlot } from './listMoveActions'
import { assignDraftList } from './draftListActions'
import { receivePayment } from './paymentActions'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { prePaymentInvoicesForBooking } from './selectors'
import { pairForInvoice } from './ledgerSelectors'
import { anaesthetistChangedFor, emailPatientAnaesthetistChanged, PATIENT_NOTICE_MESSAGES, patientNoticesFor } from './prepaymentNotice'
import { holdingBalance, holdingEntries } from '../domain/billing/prepayHolding'
import { formatMoney } from '../domain/billing/money'
import { slotIdFor } from '../domain/slots'
import { completeAnswered } from '../test/completeAnswered'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { SEED_MARKERS } from '../domain/seed'
import type { Actor, Outcome } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER = '34821'
const SOUTER_ME: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: SOUTER }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId
const FRI = '2026-11-27'

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

const listOf = (bookingId: string) => api.getState().schedule.bookings[bookingId]!.listId
const anaesthetistOf = (bookingId: string) => api.getState().schedule.lists[listOf(bookingId)]!.anaesthetistId
const colleagues = () =>
  Object.values(api.getState().masters.anaesthetists)
    .filter((a) => a.active && a.registrationNumber !== SOUTER)
    .map((a) => a.registrationNumber)
    .sort()

/** Riley's prepayment approved, sent and half paid: the invoice id. */
function sentPartPaid(): string {
  const [invoiceId] = approveAllPrepayments(api, RILEY)
  const pair = pairForInvoice(api.getState(), invoiceId!)!
  const out = receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: 690, idempotencyKey: 'T-RILEY-HALF', source: 'webhook' })
  if (!out.ok) throw new Error(out.message)
  expect(prepaymentStatusFor(api.getState(), RILEY).groups[0]?.status).toBe('partPaid')
  return invoiceId!
}

/** Everything a move must leave alone. */
function ledgerSnapshot(invoiceId: string) {
  const s = api.getState()
  const entries = holdingEntries(s.billing)
  return {
    invoiceIds: Object.keys(s.billing.invoices).sort(),
    invoice: s.billing.invoices[invoiceId],
    pair: pairForInvoice(s, invoiceId),
    accRecs: s.xero.accRecs,
    accPays: s.xero.accPays,
    status: prepaymentStatusFor(s, RILEY),
    entries,
    balance: holdingBalance(entries),
    transfers: s.billing.transfers,
  }
}

function completeAndSubmit(listId: string) {
  const anaesthetistId = api.getState().schedule.lists[listId]!.anaesthetistId!
  const owner: Actor = { who: api.getState().masters.anaesthetists[anaesthetistId]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === listId && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') {
    const out = submitList(api, owner, listId)
    if (!out.ok) throw new Error(out.message)
  }
}

/** The office moves Riley alone onto a colleague's ACTIVE List holding nothing else (so authorising it needs only Riley). */
function officeMovesRiley(): string {
  const holds = (listId: string) => Object.values(api.getState().schedule.bookings).some((b) => b.listId === listId && b.cancellation === undefined)
  const candidates = Object.values(api.getState().schedule.lists)
    .filter((l) => l.anaesthetistId !== undefined && l.anaesthetistId !== SOUTER && l.state === 'ACTIVE' && l.dateISO >= '2026-11-24' && !holds(l.id))
    .sort((a, b) => Number(b.dateISO === FRI) - Number(a.dateISO === FRI) || a.id.localeCompare(b.id))
  const moved = candidates.find((l) => reassignBooking(api, OFFICE, RILEY, l.id).ok)
  expect(moved, 'a colleague List the office can move Riley onto').toBeDefined()
  return moved!.anaesthetistId!
}

/** The first colleague a move succeeds to, trying each in turn. */
function firstThat(move: (anaesthetistId: string) => Outcome<unknown>): string | undefined {
  return colleagues().find((id) => move(id).ok)
}

type MovePath = { name: string; required: boolean; run: () => boolean }

const PATHS: MovePath[] = [
  { name: "the office's reassignBooking (Move booking to another list)", required: true, run: () => officeMovesRiley() !== SOUTER },
  { name: "the office's reassignList (Reassign list, cover)", required: false, run: () => firstThat((id) => reassignList(api, OFFICE, listOf(RILEY), id)) !== undefined },
  { name: "the office's moveListToSlot (28)", required: false, run: () => firstThat((id) => moveListToSlot(api, OFFICE, listOf(RILEY), slotIdFor(id, FRI, 'AM'))) !== undefined },
  { name: "32a's moveBookingToAnaesthetist (the anaesthetist's single-Booking move)", required: true, run: () => firstThat((id) => moveBookingToAnaesthetist(api, SOUTER_ME, RILEY, id)) !== undefined },
  { name: "32's pushListToSlot (her List to a colleague's free session)", required: false, run: () => firstThat((id) => pushListToSlot(api, SOUTER_ME, listOf(RILEY), slotIdFor(id, FRI, 'AM'))) !== undefined },
  {
    name: "32's markUnavailableAndMoveList to a colleague",
    required: false,
    run: () => firstThat((id) => markUnavailableAndMoveList(api, SOUTER_ME, slotIdFor(SOUTER, FRI, 'AM'), 'unavailable', { route: 'colleague', toSlotId: slotIdFor(id, FRI, 'AM') })) !== undefined,
  },
  {
    name: "32's moveListToOffice, then 31's assignDraftList to a colleague",
    required: false,
    run: () => {
      const listId = listOf(RILEY)
      if (!moveListToOffice(api, SOUTER_ME, listId).ok) return false
      // In the office's pool nobody is named yet, so there is no change to email about.
      expect(anaesthetistChangedFor(api.getState(), RILEY)).toBe(false)
      return firstThat((id) => assignDraftList(api, OFFICE, listId, { anaesthetistId: id })) !== undefined
    },
  },
  {
    name: "the office's markUnavailableAndMoveList to the office, then assignDraftList",
    required: false,
    run: () => {
      const listId = listOf(RILEY)
      if (!markUnavailableAndMoveList(api, OFFICE, slotIdFor(SOUTER, FRI, 'AM'), 'unavailable', { route: 'office' }).ok) return false
      return firstThat((id) => assignDraftList(api, OFFICE, listId, { anaesthetistId: id })) !== undefined
    },
  },
]

describe('a moved prepaid Booking changes nothing (US-06.5.4 ACs 1 and 2)', () => {
  for (const path of PATHS) {
    it(`${path.name}: no invoice, no ledger, Xero, status or holding change, no prepayment audit, no patient email`, (ctx) => {
      const invoiceId = sentPartPaid()
      const before = ledgerSnapshot(invoiceId)
      const auditFrom = api.getState().audit.length
      const moved = path.run()
      if (path.required) expect(moved, 'this path moves Riley in the seed').toBe(true)
      if (!moved) {
        ctx.skip()
        return
      }
      expect(anaesthetistOf(RILEY)).not.toBe(SOUTER)
      expect(ledgerSnapshot(invoiceId)).toEqual(before)
      const added = api.getState().audit.slice(auditFrom).map((e) => e.action)
      expect(added.filter((a) => a.startsWith('prepayment') || a.startsWith('invoice.') || a === 'booking.patientNotified')).toEqual([])
      expect(patientNoticesFor(api.getState(), RILEY)).toEqual([])
      expect(anaesthetistChangedFor(api.getState(), RILEY)).toBe(true)
    })
  }

  it('moving back to Dr Souter changes nothing either, and the change is gone', () => {
    const invoiceId = sentPartPaid()
    const before = ledgerSnapshot(invoiceId)
    const home = listOf(RILEY)
    officeMovesRiley()
    expect(reassignBooking(api, OFFICE, RILEY, home).ok).toBe(true)
    expect(ledgerSnapshot(invoiceId)).toEqual(before)
    expect(anaesthetistChangedFor(api.getState(), RILEY)).toBe(false)
  })
})

describe('the optional patient email (US-06.5.4; OQ-120 default)', () => {
  it('refuses on an unmoved Booking, for anyone but the office, and on a cancelled Booking', () => {
    sentPartPaid()
    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY)).toMatchObject({ ok: false, code: 'notChanged', message: PATIENT_NOTICE_MESSAGES.notChanged })
    officeMovesRiley()
    expect(emailPatientAnaesthetistChanged(api, SOUTER_ME, RILEY)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY, { templateId: 'LT001' })).toMatchObject({ ok: false, code: 'templateWrongKind' })
    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY, { templateId: 'LT-NOPE' })).toMatchObject({ ok: false, code: 'templateInactive' })
    expect(cancelBooking(api, OFFICE, RILEY, 'Patient unwell').ok).toBe(true)
    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY)).toMatchObject({ ok: false, code: 'bookingCancelled' })
    expect(anaesthetistChangedFor(api.getState(), RILEY)).toBe(false)
    expect(patientNoticesFor(api.getState(), RILEY)).toEqual([])
  })

  it('after the office move: LT003 to the invoice email, naming the new anaesthetist and the same amount, no NHI; two sends append two; the ledger untouched', () => {
    const invoiceId = sentPartPaid()
    const receiver = officeMovesRiley()
    const before = ledgerSnapshot(invoiceId)
    const auditFrom = api.getState().audit.length
    const s = api.getState()
    const invoice = s.billing.invoices[invoiceId]!
    const receiverName = s.masters.anaesthetists[receiver]!.name
    const patient = s.masters.patients[s.schedule.bookings[RILEY]!.patientId]!

    const first = emailPatientAnaesthetistChanged(api, OFFICE, RILEY)
    expect(first).toMatchObject({ ok: true, value: { invoiceId } })
    const notices = patientNoticesFor(api.getState(), RILEY)
    expect(notices).toHaveLength(1)
    const n = notices[0]!
    expect(n).toMatchObject({ kind: 'anaesthetistChanged', by: OFFICE.who, anaesthetistId: receiver, letter: { templateId: 'LT003', kind: 'anaesthetistChanged' } })
    expect(n.to).toContain('@')
    expect(first.ok && first.value.to).toBe(n.to)
    expect(n.letter.body).toContain(receiverName)
    expect(n.letter.body).not.toContain('Souter')
    expect(n.letter.body).toContain(formatMoney(invoice.total))
    expect(n.letter.body).toContain(patient.name)
    if (patient.nhi !== undefined) {
      expect(n.letter.body).not.toContain(patient.nhi)
      expect(JSON.stringify(api.getState().audit.slice(auditFrom))).not.toContain(patient.nhi)
    }

    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY).ok).toBe(true)
    expect(patientNoticesFor(api.getState(), RILEY)).toHaveLength(2)
    const added = api.getState().audit.slice(auditFrom)
    expect(added.map((e) => [e.action, e.entityType, e.entityId])).toEqual([
      ['booking.patientNotified', 'booking', RILEY],
      ['booking.patientNotified', 'booking', RILEY],
    ])
    expect(ledgerSnapshot(invoiceId)).toEqual(before)
  })

  it("then the receiver's List is authorised: 27a's transfer pays the receiver the invoiced amount, never Dr Souter", () => {
    const invoiceId = sentPartPaid()
    const receiver = officeMovesRiley()
    expect(emailPatientAnaesthetistChanged(api, OFFICE, RILEY).ok).toBe(true)
    const listId = listOf(RILEY)
    completeAndSubmit(listId)
    const out = authoriseList(api, OFFICE, listId)
    if (!out.ok) throw new Error(out.message)
    const t = Object.values(api.getState().billing.transfers).find((x) => x.invoiceId === invoiceId)
    expect(t).toBeDefined()
    expect(t!.in.payee).toMatchObject({ kind: 'anaesthetist', anaesthetistId: receiver })
    expect(t!.in.amount).toBe(api.getState().billing.invoices[invoiceId]!.total)
    // The email never raised anything: Riley's only prepayment invoice is still the one sent.
    expect(prePaymentInvoicesForBooking(api.getState(), RILEY).map((i) => i.id)).toEqual([invoiceId])
  })
})
