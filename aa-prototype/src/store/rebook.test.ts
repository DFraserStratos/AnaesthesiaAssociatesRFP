/**
 * Catch-up Phase 41 session 2, work item 16: rebook a truly cancelled prepaid
 * Booking with another anaesthetist (US-06.5.3). The cancellation already
 * settled the original prepayment (credited, refunded when paid); the new
 * Booking starts a fresh prepayment at the replacement's own price, and
 * nothing from the original moves.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { cancelBooking } from './lifecycle'
import { approvePrepayment } from './prepaymentActions'
import { prepaymentStatusFor } from './prepaymentSelectors'
import { proceduresForBooking } from './selectors'
import {
  REBOOK_MESSAGES,
  prepaymentHistoryFor,
  rebookPriceFor,
  rebookPriceLine,
  rebookTargetsFor,
  rebookWithAnotherAnaesthetist,
} from './rebookActions'
import { ANAE, SEED_MARKERS, SEED_PREPAID_BOOKING_ID } from '../domain/seed'
import { PRICED_ITEM } from '../domain/seed/pricedItems'
import { formatMoney } from '../domain/billing/money'
import type { AssignedList } from '../domain/types'
import type { Actor } from './mutate'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const NAIR = SEED_PREPAID_BOOKING_ID
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

function cancel(bookingId: string) {
  const out = cancelBooking(api, OFFICE, bookingId, 'Patient asked for another anaesthetist')
  if (!out.ok) throw new Error(out.message)
}

/** Dr Beaumont's first ACTIVE List from today on which her prepaid Rhinoplasty is offered (Mr Nand's ENT List at Forte). */
function beaumontPrepaidList(bookingId: string): string {
  const target = rebookTargetsFor(api.getState(), bookingId).find((t) => t.anaesthetistId === ANAE.beaumont)!
  const list = target.lists.find((l) => rebookPriceFor(api.getState(), bookingId, ANAE.beaumont, l.listId).kind === 'prepaid')
  if (list === undefined) throw new Error('No Beaumont List offers her prepaid Rhinoplasty')
  return list.listId
}

function rebook(bookingId: string, listId: string): string {
  const out = rebookWithAnotherAnaesthetist(api, OFFICE, bookingId, listId)
  if (!out.ok) throw new Error(out.message)
  return out.value.bookingId
}

/** The original's records, so the test can show nothing of them moves. */
function originalOf(bookingId: string) {
  const s = api.getState()
  return {
    booking: s.schedule.bookings[bookingId],
    procedures: proceduresForBooking(s, bookingId),
    invoices: Object.values(s.billing.invoices).filter((i) => i.bookingId === bookingId),
    creditNotes: s.billing.creditNotes,
    refunds: s.billing.prepaymentRefunds,
    ledger: s.billing.ledger,
  }
}

describe('rebook with another anaesthetist (US-06.5.3)', () => {
  it("Dr Beaumont's seeded price list makes none of her seeded Bookings prepaid", () => {
    const s = api.getState()
    const lists = new Set(Object.values(s.schedule.lists).filter((l) => l.anaesthetistId === ANAE.beaumont).map((l) => l.id))
    const hers = Object.values(s.schedule.bookings).filter((b) => lists.has(b.listId))
    expect(hers.length).toBeGreaterThan(0)
    for (const b of hers) expect(prepaymentStatusFor(s, b.id).status, b.id).toBe('none')
  })

  it('lists the other active anaesthetists in roster order, the original excluded, each with ACTIVE Lists from today', () => {
    const s = api.getState()
    const targets = rebookTargetsFor(s, NAIR)
    const ids = targets.map((t) => t.anaesthetistId)
    expect(ids).not.toContain(ANAE.souter)
    expect(ids).toContain(ANAE.beaumont)
    for (const t of targets) {
      for (const l of t.lists) {
        const list = s.schedule.lists[l.listId] as AssignedList
        expect(list.state).toBe('ACTIVE')
        expect(list.anaesthetistId).toBe(t.anaesthetistId)
        expect(l.dateISO >= s.clock.todayISO).toBe(true)
      }
    }
    // Ordered by date after the source date's Lists.
    const beaumont = targets.find((t) => t.anaesthetistId === ANAE.beaumont)!
    const dates = beaumont.lists.map((l) => l.dateISO)
    const sourceDate = s.schedule.lists[s.schedule.bookings[NAIR]!.listId]!.dateISO
    const rest = dates.filter((d) => d !== sourceDate)
    expect(rest).toEqual([...rest].sort())
  })

  it('the AC: a paid prepayment cancelled and rebooked with Dr Beaumont starts a new prepayment at her own price, awaiting approval; the original is untouched', () => {
    cancel(NAIR)
    const before = originalOf(NAIR)
    const listId = beaumontPrepaidList(NAIR)
    expect(rebookPriceFor(api.getState(), NAIR, ANAE.beaumont, listId)).toEqual({ kind: 'prepaid', amount: 1350 })
    expect(rebookPriceLine({ kind: 'prepaid', amount: 1350 }, 'Dr Sarah Beaumont', formatMoney)).toBe("New prepayment at Dr Beaumont's own price: $1,350.00 ex GST")

    const newId = rebook(NAIR, listId)
    const s = api.getState()
    const booking = s.schedule.bookings[newId]!
    expect(booking).toMatchObject({ listId, patientId: before.booking!.patientId, source: 'rebook', rebookedFromBookingId: NAIR })
    expect(booking.cancellation).toBeUndefined()

    // Each Procedure a skeleton: the text as received, the RVG code, the primary flag, the payer; no times or prices.
    const oldProcs = before.procedures
    const newProcs = proceduresForBooking(s, newId)
    expect(newProcs).toHaveLength(oldProcs.length)
    for (const old of oldProcs) {
      const made = newProcs.find((p) => p.procedureText?.text === old.procedureText?.text)!
      expect(made).toBeDefined()
      expect(made.isPrimary).toBe(old.isPrimary)
      expect(made.rvgGroupId).toBe(old.rvgGroupId)
      expect(made.payer).toEqual(old.payer)
      expect(made.anaestheticStartISO).toBeUndefined()
      expect(made.handoverISO).toBeUndefined()
      expect(made.enteredPrice).toBeUndefined()
      expect(made.modifierClaims).toEqual([])
      // Dr Beaumont's own Rhinoplasty, never the original's Contract; the septoplasty has none.
      if (old.governingContractId === PRICED_ITEM.souterRhinoplasty) expect(made.governingContractId).toBe(PRICED_ITEM.beaumontRhinoplasty)
      else expect(made.governingContractId).toBeUndefined()
    }

    // 27's derivation: awaiting approval at $1,350.00 ex GST.
    const status = prepaymentStatusFor(s, newId)
    expect(status.status).toBe('awaitingApproval')
    expect(status.groups).toHaveLength(1)
    expect(status.groups[0]!.amount).toBe(1350)

    // Nothing of the original moves.
    expect(originalOf(NAIR)).toEqual(before)

    // Audited on both Bookings.
    const rebooked = s.audit.filter((a) => a.action === 'booking.rebooked')
    expect(rebooked.map((a) => a.entityId).sort()).toEqual([NAIR, newId].sort())
  })

  it('copies another payer as one person across the Procedures that had them', () => {
    cancel(NAIR)
    const s0 = api.getState()
    const procs = proceduresForBooking(s0, NAIR)
    const other = { kind: 'other' as const, id: 'BP9001', name: 'Ian Nair', relationship: 'Partner', email: 'ian.nair@example.co.nz' }
    api.setState({ schedule: { ...s0.schedule, procedures: { ...s0.schedule.procedures, ...Object.fromEntries(procs.map((p) => [p.id, { ...p, payer: other }])) } } })
    const newId = rebook(NAIR, beaumontPrepaidList(NAIR))
    const payers = proceduresForBooking(api.getState(), newId).map((p) => p.payer)
    expect(payers.every((p) => p.kind === 'other' && p.name === 'Ian Nair' && p.email === 'ian.nair@example.co.nz')).toBe(true)
    // One person on the new Booking, never the cancelled Booking's id (a new Xero contact).
    const ids = new Set(payers.map((p) => (p.kind === 'other' ? p.id : '')))
    expect(ids.size).toBe(1)
    expect(ids.has('BP9001')).toBe(false)
  })

  it('with a colleague who has no prepaid price, the new Booking has no prepayment and the preview says so', () => {
    cancel(NAIR)
    const morrison = rebookTargetsFor(api.getState(), NAIR).find((t) => t.anaesthetistId === ANAE.morrison)!
    const listId = morrison.lists[0]!.listId
    expect(rebookPriceFor(api.getState(), NAIR, ANAE.morrison, listId)).toEqual({ kind: 'none' })
    expect(rebookPriceFor(api.getState(), NAIR, ANAE.morrison)).toEqual({ kind: 'none' })
    expect(rebookPriceLine({ kind: 'none' }, 'Dr Sarah Beaumont', formatMoney)).toBe('Dr Beaumont has no price for this procedure; the office adds it to their price list.')
    const newId = rebook(NAIR, listId)
    const s = api.getState()
    expect(prepaymentStatusFor(s, newId).status).toBe('none')
    expect(proceduresForBooking(s, newId).every((p) => p.governingContractId === undefined)).toBe(true)
  })

  it('reads "does not take prepayment" when her price list covers it but is not prepaid', () => {
    cancel(NAIR)
    const s = api.getState()
    const c = s.masters.contracts[PRICED_ITEM.beaumontRhinoplasty]!
    api.setState({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [c.id]: { ...c, prepaid: false } } } })
    expect(rebookPriceFor(api.getState(), NAIR, ANAE.beaumont)).toEqual({ kind: 'notPrepaid' })
    expect(rebookPriceLine({ kind: 'notPrepaid' }, 'Dr Sarah Beaumont', formatMoney)).toBe('Dr Beaumont does not take prepayment for this procedure.')
  })

  it('a Booking on her List where the rail does not offer her Rhinoplasty takes no Contract (Needs a Contract)', () => {
    cancel(NAIR)
    const beaumont = rebookTargetsFor(api.getState(), NAIR).find((t) => t.anaesthetistId === ANAE.beaumont)!
    const notOffered = beaumont.lists.find((l) => rebookPriceFor(api.getState(), NAIR, ANAE.beaumont, l.listId).kind === 'none')!
    expect(notOffered).toBeDefined()
    const newId = rebook(NAIR, notOffered.listId)
    const s = api.getState()
    expect(proceduresForBooking(s, newId).every((p) => p.governingContractId === undefined)).toBe(true)
    expect(prepaymentStatusFor(s, newId).status).toBe('none')
  })

  describe('refusals', () => {
    it('notCancelled: a live Booking is moved, not rebooked', () => {
      const out = rebookWithAnotherAnaesthetist(api, OFFICE, NAIR, beaumontPrepaidList(NAIR))
      expect(out).toMatchObject({ ok: false, code: 'notCancelled' })
    })

    it('sameAnaesthetist', () => {
      cancel(NAIR)
      const s = api.getState()
      const souterList = Object.values(s.schedule.lists).find((l) => l.anaesthetistId === ANAE.souter && l.state === 'ACTIVE' && l.dateISO >= s.clock.todayISO)!
      const out = rebookWithAnotherAnaesthetist(api, OFFICE, NAIR, souterList.id)
      expect(out).toMatchObject({ ok: false, code: 'sameAnaesthetist', message: REBOOK_MESSAGES.sameAnaesthetist })
      expect(REBOOK_MESSAGES.sameAnaesthetist).toBe('Choose a different anaesthetist. To keep the prepayment, move the booking instead of cancelling it.')
    })

    it('listLocked: the target List is not ACTIVE', () => {
      cancel(NAIR)
      const listId = beaumontPrepaidList(NAIR)
      const s = api.getState()
      const list = s.schedule.lists[listId] as AssignedList
      api.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...list, state: 'SUBMITTED' } } } })
      expect(rebookWithAnotherAnaesthetist(api, OFFICE, NAIR, listId)).toMatchObject({ ok: false, code: 'listLocked' })
    })

    it('pastDate: the target List is before today', () => {
      cancel(NAIR)
      const listId = beaumontPrepaidList(NAIR)
      const s = api.getState()
      api.setState({ clock: { ...s.clock, todayISO: '2026-08-10' } })
      expect(rebookWithAnotherAnaesthetist(api, OFFICE, NAIR, listId)).toMatchObject({ ok: false, code: 'pastDate' })
    })

    it('alreadyRebooked', () => {
      cancel(NAIR)
      const listId = beaumontPrepaidList(NAIR)
      rebook(NAIR, listId)
      expect(rebookWithAnotherAnaesthetist(api, OFFICE, NAIR, listId)).toMatchObject({ ok: false, code: 'alreadyRebooked' })
    })

    it('office only', () => {
      cancel(NAIR)
      const beaumont: Actor = { who: 'Dr Sarah Beaumont', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.beaumont }
      expect(rebookWithAnotherAnaesthetist(api, beaumont, NAIR, beaumontPrepaidList(NAIR))).toMatchObject({ ok: false, code: 'officeOnly' })
    })
  })

  describe('the history', () => {
    it('walks the link both ways: the earlier prepayment refunded, this one current', () => {
      cancel(NAIR)
      const newId = rebook(NAIR, beaumontPrepaidList(NAIR))
      const expected = [
        { bookingId: NAIR, anaesthetistId: ANAE.souter, amount: 1200, state: 'refunded' },
        { bookingId: newId, anaesthetistId: ANAE.beaumont, amount: 1350, state: 'current' },
      ]
      expect(prepaymentHistoryFor(api.getState(), NAIR)).toEqual(expected)
      expect(prepaymentHistoryFor(api.getState(), newId)).toEqual(expected)
    })

    it('an unpaid prepayment cancelled reads credited; a Booking never rebooked has no history', () => {
      expect(prepaymentHistoryFor(api.getState(), RILEY)).toEqual([])
      const group = prepaymentStatusFor(api.getState(), RILEY).groups.find((g) => g.status === 'awaitingApproval')!
      const sent = approvePrepayment(api, OFFICE, RILEY, group.payerKey)
      if (!sent.ok) throw new Error(sent.message)
      cancel(RILEY)
      const newId = rebook(RILEY, beaumontPrepaidList(RILEY))
      expect(prepaymentHistoryFor(api.getState(), newId)).toEqual([
        { bookingId: RILEY, anaesthetistId: ANAE.souter, amount: 1200, state: 'credited' },
        { bookingId: newId, anaesthetistId: ANAE.beaumont, amount: 1350, state: 'current' },
      ])
    })
  })
})
