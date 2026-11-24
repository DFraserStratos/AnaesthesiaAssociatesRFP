/**
 * An anaesthetist moves a single Booking to a colleague (catch-up Phase 32a;
 * US-01.4.7's seven criteria, US-01.4.6's four, US-06.3.5 AC2, US-06.5.4,
 * US-13.8.2; D7, D38, D44, D54, D58, D61). The store action
 * `moveBookingToAnaesthetist` is the one path; the old anaesthetist guard on
 * `reassignBooking` points at it.
 */

import { completeAnswered } from '../test/completeAnswered'
import { describe, expect, it, vi } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { moveBookingToAnaesthetist } from './listMoveActions'
import * as lifecycle from './lifecycle'
import { authoriseList, cancelBooking, reassignBooking, submitList } from './lifecycle'
import { addPairingPreference } from './officePrivate'
import { setAvailabilityRange } from './availabilityActions'
import { runBillingForList } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { pairsForList } from './ledgerSelectors'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { openWarnings } from './warnings'
import { bookingMoveFor, bookingMovesOntoList, bookingsMovedToMe, movedToMe, notificationPool } from './notifications'
import { bookingsForList, bookingMoveInputOf, proceduresForBooking } from './selectors'
import { anaesthetistActor, OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import type { Actor } from './mutate'
import { ANAE, BOOKING_MOVE_DEMO, SEED_LIST_IDS, SURG } from '../domain/seed'
import { freeColleagues } from '../domain/bookingMoves'
import { slotIdFor } from '../domain/slots'

const D = BOOKING_MOVE_DEMO
const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR
const store = (): BoundAppStore => createAppStore()
const code = (o: { ok: boolean; code?: string }) => (o.ok ? 'ok' : o.code)
const actions = (api: BoundAppStore, from = 0) => api.getState().audit.slice(from).map((a) => a.action)
const as = (api: BoundAppStore, id: string): Actor => anaesthetistActor(api.getState(), id)!

function commits(api: BoundAppStore, run: () => unknown): number {
  let n = 0
  const off = api.subscribe(() => {
    n += 1
  })
  run()
  off()
  return n
}

describe('refusals (enforced in the store)', () => {
  it('refuses the office, a feed, a colleague, a cancelled Booking, a SUBMITTED List, a past day and a Draft List', () => {
    const api = store()
    for (const actor of [OFFICE, { who: 'Feed', role: 'system', source: 'integration' } as Actor]) {
      expect(code(moveBookingToAnaesthetist(api, actor, D.bookingId, D.receiverId))).toBe('ownerOnly')
    }
    expect(code(moveBookingToAnaesthetist(api, as(api, ANAE.sharma), D.bookingId, D.receiverId))).toBe('notOwnList')
    // Souter's Mon 20 AM List is SUBMITTED and dated before today.
    const submitted = bookingsForList(api.getState(), SEED_LIST_IDS.souterMon20Am)[0]!
    expect(code(moveBookingToAnaesthetist(api, SOUTER, submitted.id, D.receiverId))).toBe('listSubmitted')
    // A Booking on a Draft List: not hers.
    const onDraft = Object.values(api.getState().schedule.bookings).find((b) => api.getState().schedule.lists[b.listId]?.state === 'DRAFT')!
    expect(code(moveBookingToAnaesthetist(api, SOUTER, onDraft.id, D.receiverId))).toBe('notOwnList')
    const before = api.getState()
    expect(cancelBooking(api, SOUTER, D.secondBookingId, 'Patient unwell').ok).toBe(true)
    expect(code(moveBookingToAnaesthetist(api, SOUTER, D.secondBookingId, D.receiverId))).toBe('cancelled')
    expect(before.schedule.bookings[D.bookingId]?.listId).toBe(D.sourceListId)
  })

  it("refuses a past day's Booking (the office's to move)", () => {
    const api = store()
    api.setState({ clock: { ...api.getState().clock, todayISO: '2026-11-26' } })
    const out = moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.receiverId)
    expect(out).toMatchObject({ ok: false, code: 'pastDate', message: "This List's day has passed. Ask the office to move it." })
  })

  it('refuses a receiver who is not available or already holds a List, and the Booking stays', () => {
    const api = store()
    const before = api.getState()
    expect(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.unavailableColleagueId)).toMatchObject({
      ok: false,
      code: 'notAvailable',
      message: 'Dr Chen is not available this session. They need to set it available first.',
    })
    expect(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.listHoldingColleagueId)).toMatchObject({
      ok: false,
      code: 'hasList',
      message: 'Dr Fitzgerald already has a List this session.',
    })
    expect(api.getState()).toBe(before)
  })
})

describe('US-01.4.7 and US-01.4.6: one move, a new List', () => {
  it('AC1: the Booking leaves her List and is on a new one-Booking List in the colleague\'s session, copying hospital, surgeon and kind; the source List stays', () => {
    const api = store()
    const source = api.getState().schedule.lists[D.sourceListId]!
    const sourceCount = bookingsForList(api.getState(), D.sourceListId).length
    const out = moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.receiverId)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const s = api.getState()
    const created = s.schedule.lists[out.value.createdListId]!
    expect(created).toMatchObject({
      state: 'ACTIVE',
      anaesthetistId: D.receiverId,
      slotId: slotIdFor(D.receiverId, '2026-11-25', 'AM'),
      dateISO: '2026-11-25',
      session: 'AM',
      hospitalId: source.hospitalId,
      surgeonId: source.surgeonId,
      kind: source.kind,
    })
    expect(bookingsForList(s, created.id).map((b) => b.id)).toEqual([D.bookingId])
    expect(s.schedule.lists[D.sourceListId]).toBeDefined()
    expect(bookingsForList(s, D.sourceListId).length).toBe(sourceCount - 1)
    expect(out.value).toEqual({ listId: D.sourceListId, createdListId: created.id, toAnaesthetistId: D.receiverId })
  })

  it('AC2: never into an existing List (the colleague holding one is not offered, and refused when called)', () => {
    const api = store()
    const input = bookingMoveInputOf(api.getState())
    expect(freeColleagues(input, D.bookingId, ANAE.souter).map((r) => r.anaesthetistId)).not.toContain(D.listHoldingColleagueId)
    const theirList = Object.values(api.getState().schedule.lists).find((l) => l.state !== 'DRAFT' && l.slotId === slotIdFor(D.listHoldingColleagueId, '2026-11-25', 'AM'))!
    const theirCount = bookingsForList(api.getState(), theirList.id).length
    expect(code(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.listHoldingColleagueId))).toBe('hasList')
    expect(bookingsForList(api.getState(), theirList.id).length).toBe(theirCount)
  })

  it('AC3: a colleague not available is offered only after setting the session available themselves', () => {
    const api = store()
    expect(code(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.unavailableColleagueId))).toBe('notAvailable')
    const chen = as(api, D.unavailableColleagueId)
    expect(setAvailabilityRange(api, chen, { anaesthetistId: D.unavailableColleagueId, fromISO: '2026-11-25', toISO: '2026-11-25', sessions: 'AM', statusKey: 'free' }).ok).toBe(true)
    expect(freeColleagues(bookingMoveInputOf(api.getState()), D.bookingId, ANAE.souter).map((r) => r.anaesthetistId)).toContain(D.unavailableColleagueId)
    expect(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.unavailableColleagueId).ok).toBe(true)
  })

  it('AC5: free colleagues of several tiers come back by name alone', () => {
    const api = store()
    const free = freeColleagues(bookingMoveInputOf(api.getState()), D.bookingId, ANAE.souter)
    const tiers = free.map((r) => api.getState().officePrivate.priorityTiers[r.anaesthetistId] ?? 4)
    expect(new Set(tiers).size).toBeGreaterThan(1)
    const surnames = free.map((r) => r.name.split(' ').at(-1)!)
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
  })

  it('AC6 and the pool: "Tell the office" posts one row naming both anaesthetists; without it there is none; the colleague is told either way', () => {
    const ticked = store()
    const a = moveBookingToAnaesthetist(ticked, SOUTER, D.bookingId, D.receiverId, { tellOffice: true, message: '  Patient asked for an early start  ' })
    expect(a.ok).toBe(true)
    const pool = notificationPool(ticked.getState(), { page: 1 })
    expect(pool.total).toBe(1)
    const row = pool.rows[0]!
    expect(row.notification).toMatchObject({ kind: 'bookingMoved', bookingId: D.bookingId, fromAnaesthetistId: ANAE.souter, toAnaesthetistId: D.receiverId, message: 'Patient asked for an early start' })
    expect(row.text).toMatch(/^Dr Souter moved a Booking \(.+, Wed 25 Nov AM, Christchurch Eye Surgery\) to Dr Whitaker\. A new List was created\.$/)
    expect(row.target).toEqual({ kind: 'booking', bookingId: D.bookingId, dateISO: '2026-11-25' })
    expect(a.ok && a.value.notificationId).toBe(row.notification.id)
    // Not a to-do, and not Phase 32's List notice.
    expect(openWarnings(ticked.getState()).some((w) => JSON.stringify(w).includes(row.notification.id))).toBe(false)
    expect(movedToMe(ticked.getState(), D.receiverId, '2026-11-24')).toEqual([])

    const quiet = store()
    expect(moveBookingToAnaesthetist(quiet, SOUTER, D.bookingId, D.receiverId).ok).toBe(true)
    expect(Object.keys(quiet.getState().notifications)).toEqual([])
    for (const api of [ticked, quiet]) {
      const notices = bookingsMovedToMe(api.getState(), D.receiverId, '2026-11-24')
      expect(notices.map((n) => n.bookingId)).toEqual([D.bookingId])
      expect(bookingMoveFor(api.getState(), D.bookingId)?.fromAnaesthetistId).toBe(ANAE.souter)
      expect(bookingMovesOntoList(api.getState(), notices[0]!.listId)).toHaveLength(1)
    }
  })

  it('AC7 (no warning, D44): a receiver with a not-preferred pairing with the surgeon moves exactly like a clean one', () => {
    // Mrs Riley (Ms Lim) to Dr Ropata, who has PP-005 not preferred with Ms Lim.
    const flagged = store()
    const fFrom = flagged.getState().audit.length
    expect(moveBookingToAnaesthetist(flagged, SOUTER, D.notPreferredBookingId, D.notPreferredReceiverId).ok).toBe(true)
    const clean = store()
    const cFrom = clean.getState().audit.length
    expect(moveBookingToAnaesthetist(clean, SOUTER, D.notPreferredBookingId, ANAE.morrison).ok).toBe(true)
    expect(actions(flagged, fFrom)).toEqual(actions(clean, cFrom))
    expect(actions(flagged, fFrom).some((a) => /pairing|acknowledg/i.test(a))).toBe(false)
    expect(flagged.getState().officePrivate).toEqual(clean.getState().officePrivate)
    expect(SURG.lim).toBe(flagged.getState().schedule.lists[SEED_LIST_IDS.prepaymentUnpaidList]!.surgeonId)
  })

  it('AC7, the other side: a not-preferred pairing raised by the anaesthetist changes nothing either', () => {
    const flagged = store()
    expect(addPairingPreference(flagged, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: D.receiverId, surgeonId: SURG.whitford }).ok).toBe(true)
    const clean = store()
    const fFrom = flagged.getState().audit.length
    const cFrom = clean.getState().audit.length
    expect(moveBookingToAnaesthetist(flagged, SOUTER, D.bookingId, D.receiverId).ok).toBe(true)
    expect(moveBookingToAnaesthetist(clean, SOUTER, D.bookingId, D.receiverId).ok).toBe(true)
    expect(actions(flagged, fFrom)).toEqual(actions(clean, cFrom))
    expect(flagged.getState().schedule.lists).toEqual(clean.getState().schedule.lists)
  })

  it('one commit, one booking.movedToAnaesthetist with from and to, the List\'s own list.create, and no booking.reassign', () => {
    const api = store()
    const from = api.getState().audit.length
    let out: ReturnType<typeof moveBookingToAnaesthetist> | undefined
    expect(commits(api, () => (out = moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.receiverId, { message: 'Over to you' })))).toBe(1)
    const rows = api.getState().audit.slice(from)
    expect(rows.map((r) => r.action)).toEqual(['list.create', 'booking.movedToAnaesthetist'])
    const moved = rows[1]!
    expect(moved).toMatchObject({
      entityId: D.bookingId,
      who: 'Dr Melanie Souter',
      atISO: '2026-11-24T08:00:00',
      before: { listId: D.sourceListId, anaesthetistId: ANAE.souter },
      after: { anaesthetistId: D.receiverId, createdListId: out!.ok ? out!.value.createdListId : '', message: 'Over to you' },
    })
    expect(api.getState().schedule.bookings[D.bookingId]?.lastModifiedBy).toBe('Dr Melanie Souter')
  })

  it('uses reassignBooking\'s core, never reassignBooking itself', () => {
    const api = store()
    const spy = vi.spyOn(lifecycle, 'reassignBooking')
    expect(moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.receiverId).ok).toBe(true)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('US-01.4.6: the payable follows, nothing recalculated (US-06.3.5 AC2, US-06.5.4, D38)', () => {
  it('unprepaid: once the new List is authorised and billed, the payable is to the receiver; the Procedures are unchanged', () => {
    const api = store()
    // A completed Booking on Souter's Tue 21 AM List to Dr Hughes, who is free that session.
    const booking = bookingsForList(api.getState(), projectedSouterTue21Am()).find((b) => b.completed)!
    const proceduresBefore = proceduresForBooking(api.getState(), booking.id)
    const out = moveBookingToAnaesthetist(api, SOUTER, booking.id, ANAE.hughes)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(proceduresForBooking(api.getState(), booking.id)).toEqual(proceduresBefore)
    const listId = out.value.createdListId
    expect(submitList(api, as(api, ANAE.hughes), listId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    handoffListPairs(api, listId)
    const cases = pairsForList(api.getState(), listId).filter((c) => c.payable?.xeroAccPayId !== undefined)
    expect(cases.length).toBeGreaterThan(0)
    for (const c of cases) expect(api.getState().xero.accPays[c.payable!.xeroAccPayId!]?.anaesthetistId).toBe(ANAE.hughes)
  })

  function money(api: BoundAppStore, bookingIds: readonly string[]) {
    const s = api.getState()
    return {
      billing: s.billing,
      xero: s.xero,
      procedures: bookingIds.map((id) => proceduresForBooking(s, id)),
      bookings: bookingIds.map((id) => ({ ...s.schedule.bookings[id]!, listId: '', lastModifiedBy: '', lastModifiedAtISO: '' })),
    }
  }

  it.each([
    ['the paid Nair Booking', D.prepaidBookingId],
    ['Mrs Riley, prepayment invoice raised', D.notPreferredBookingId],
  ])('prepaid (%s): no invoice raised, no prepayment, invoice, ledger or Xero change, no money audit', (_label, bookingId) => {
    const api = store()
    expect(approveAllPrepayments(api, D.notPreferredBookingId)).toHaveLength(1)
    const before = money(api, [D.prepaidBookingId, D.notPreferredBookingId])
    const invoicesBefore = Object.keys(api.getState().billing.invoices).length
    const from = api.getState().audit.length
    const receiver = freeColleagues(bookingMoveInputOf(api.getState()), bookingId, ANAE.souter)[0]!
    expect(moveBookingToAnaesthetist(api, SOUTER, bookingId, receiver.anaesthetistId, { tellOffice: true }).ok).toBe(true)
    const after = money(api, [D.prepaidBookingId, D.notPreferredBookingId])
    expect(after).toEqual(before)
    expect(Object.keys(api.getState().billing.invoices).length).toBe(invoicesBefore)
    expect(actions(api, from).filter((a) => /prepay|invoice|billing|xero|payable|payee/i.test(a))).toEqual([])
  })

  it('prepaid, billed through: the receiver completes, submits and is authorised; no new prepayment invoice, and the payable names the receiver', () => {
    // The seeded prepayment's payable credits the AA Holding account (catch-up Phase 27); 27a's transfer to the receiver is later.
    const api = store()
    const receiver = freeColleagues(bookingMoveInputOf(api.getState()), D.prepaidBookingId, ANAE.souter)[0]!.anaesthetistId
    const prePaymentsBefore = Object.values(api.getState().billing.invoices).filter((i) => i.kind === 'prePayment').map((i) => i.id)
    // The seeded prepayment's own pair was settled before the move (Phase 09/10); only this List's new billing is asked about.
    const casesBefore = new Set(Object.keys(api.getState().billing.ledger))
    const out = moveBookingToAnaesthetist(api, SOUTER, D.prepaidBookingId, receiver)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const them = as(api, receiver)
    if (api.getState().schedule.bookings[D.prepaidBookingId]?.completed !== true) expect(completeAnswered(api, them, D.prepaidBookingId).ok).toBe(true)
    expect(submitList(api, them, out.value.createdListId).ok).toBe(true)
    expect(authoriseList(api, OFFICE, out.value.createdListId).ok).toBe(true)
    expect(runBillingForList(api, out.value.createdListId).ok).toBe(true)
    handoffListPairs(api, out.value.createdListId)
    const prePaymentsAfter = Object.values(api.getState().billing.invoices).filter((i) => i.kind === 'prePayment').map((i) => i.id)
    expect(prePaymentsAfter).toEqual(prePaymentsBefore)
    const cases = pairsForList(api.getState(), out.value.createdListId).filter((c) => c.payable?.xeroAccPayId !== undefined && !casesBefore.has(c.id))
    expect(cases.length).toBeGreaterThan(0)
    for (const c of cases) expect(api.getState().xero.accPays[c.payable!.xeroAccPayId!]?.anaesthetistId).toBe(receiver)
  })
})

describe('the old guard, replaced', () => {
  it("reassignBooking still refuses an anaesthetist putting a Booking onto a colleague's List, and points at Move to a colleague", () => {
    const api = store()
    const colleagueList = Object.values(api.getState().schedule.lists).find((l) => l.state === 'ACTIVE' && l.anaesthetistId === ANAE.morrison && l.dateISO >= '2026-11-24')!
    expect(reassignBooking(api, SOUTER, D.bookingId, colleagueList.id)).toMatchObject({
      ok: false,
      code: 'notOwnList',
      message: 'To hand a Booking to a colleague, use Move to a colleague.',
    })
    // A colleague's Booking is still not hers to move at all.
    const theirs = bookingsForList(api.getState(), colleagueList.id)[0]
    if (theirs !== undefined) expect(reassignBooking(api, SOUTER, theirs.id, D.sourceListId)).toMatchObject({ ok: false, code: 'notOwnList', message: 'Anaesthetists can only move Bookings between their own Lists.' })
    // Between her own ACTIVE Lists it is unchanged.
    expect(reassignBooking(api, SOUTER, D.bookingId, projectedSouterTue21Am()).ok).toBe(true)
  })
})

describe('determinism', () => {
  it('the same moves on the same seed give identical ids and state', () => {
    const run = () => {
      const api = store()
      moveBookingToAnaesthetist(api, SOUTER, D.bookingId, D.receiverId, { tellOffice: true })
      moveBookingToAnaesthetist(api, SOUTER, D.secondBookingId, D.secondReceiverId)
      const s = api.getState()
      return { lists: s.schedule.lists, bookings: s.schedule.bookings, notifications: s.notifications, audit: s.audit, counters: s.counters }
    }
    expect(run()).toEqual(run())
  })
})

function projectedSouterTue21Am(): string {
  return `L-${ANAE.souter}-2026-11-24-AM`
}
