/**
 * To authorise's rows (US-07.2.4): oldest submitted first, Needs a look from Review's own flags and
 * the anaesthetist's changes since submitting, the search, date and Needs a look filters, and the
 * order Review's Previous and Next follow, the open List kept in place once authorised.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { editBooking, freshAppState, useAppStore, type Actor } from '../../../../store'
import { ANAE, SEED_LIST_IDS } from '../../../../domain/seed'
import type { AssignedList, AuditEntry } from '../../../../domain/types'
import { filterToAuthorise, needsALook, orderToAuthorise, reviewQueueOrder, submittedAtByList, toAuthoriseOrder, toAuthoriseRows } from './toAuthoriseRows'
import { listsToAuthorise } from './listsCounts'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
/** The seeded List with a Procedure that needs a price and a Contract change to approve. */
const FLAGGED = 'L-45178-2026-11-17-AM'

const state = () => useAppStore.getState()

beforeEach(() => useAppStore.setState(freshAppState()))

describe('the order', () => {
  it('is oldest submitted first, a List with no submit in the audit sorting by its date', () => {
    const rows = toAuthoriseRows(state())
    expect(rows.map((r) => r.list.id).sort()).toEqual(listsToAuthorise(state()).map((l) => l.id).sort())
    const keys = rows.map((r) => r.submittedAtISO ?? r.list.dateISO)
    expect(keys).toEqual([...keys].sort())
    expect(toAuthoriseOrder(state())).toEqual(rows.map((r) => r.list.id))
  })

  it("puts Monday's submission above Tuesday's whatever the List dates", () => {
    const list = (id: string, dateISO: string) => ({ id, dateISO, anaesthetistId: 'A' }) as AssignedList
    const ordered = orderToAuthorise([
      { list: list('late-list', '2026-11-10'), submittedAtISO: '2026-11-24T09:00:00' },
      { list: list('early-list', '2026-11-20'), submittedAtISO: '2026-11-23T09:00:00' },
    ])
    expect(ordered.map((r) => r.list.id)).toEqual(['early-list', 'late-list'])
  })

  it('reads the last submit of each List', () => {
    const e = (entityId: string, atISO: string) => ({ entityType: 'list', entityId, action: 'list.submit', atISO }) as AuditEntry
    expect(submittedAtByList([e('L1', '2026-11-20T10:00:00'), e('L1', '2026-11-22T10:00:00')]).get('L1')).toBe('2026-11-22T10:00:00')
  })

  it('keeps the open List in its place once it leaves the tab', () => {
    const ids = toAuthoriseOrder(state())
    const second = ids[1]!
    useAppStore.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [second]: { ...(s.schedule.lists[second] as AssignedList), state: 'AUTHORISED' } } } }))
    expect(toAuthoriseOrder(state())).not.toContain(second)
    expect(toAuthoriseOrder(state(), second)).toEqual(ids)
  })
})

describe('Needs a look', () => {
  it("reads Review's flags: a Procedure that needs a price, a Contract change to approve", () => {
    const row = toAuthoriseRows(state()).find((r) => r.list.id === FLAGGED)!
    expect(row.needs.needsPrice).toBe(1)
    expect(row.needs.contractChanges).toBe(1)
    expect(row.needsALook).toBe(true)
  })

  it('leaves out a List with nothing to check', () => {
    const quiet = toAuthoriseRows(state()).filter((r) => !r.needsALook)
    expect(quiet.length).toBeGreaterThan(0)
    for (const r of quiet) expect(r.needs).toEqual({ needsPrice: 0, contractChanges: 0, flags: 0, changed: null })
    expect(needsALook({ needsPrice: 0, contractChanges: 0, flags: 0, changed: null })).toBe(false)
  })

  it("counts the anaesthetist's change after submitting", () => {
    const pm = SEED_LIST_IDS.souterMon20Pm
    expect(toAuthoriseRows(state()).find((r) => r.list.id === pm)!.needsALook).toBe(false)
    const booking = Object.values(state().schedule.bookings).find((b) => b.listId === pm && b.cancellation === undefined)!
    editBooking(useAppStore, SOUTER, booking.id, { notes: 'next-day fix' })
    const row = toAuthoriseRows(state()).find((r) => r.list.id === pm)!
    expect(row.needs.changed?.count).toBe(1)
    expect(row.needsALook).toBe(true)
  })
})

describe('the filters', () => {
  it('narrow by anaesthetist, surgeon or hospital, by List date and to Needs a look', () => {
    const rows = toAuthoriseRows(state())
    const { masters } = state()
    const all = { q: '', dateISO: '', look: false }
    expect(filterToAuthorise(rows, all, masters)).toHaveLength(rows.length)

    const souter = filterToAuthorise(rows, { ...all, q: 'souter' }, masters)
    expect(souter.length).toBeGreaterThan(0)
    for (const r of souter) expect(r.list.anaesthetistId).toBe(ANAE.souter)

    const first = rows[0]!.list
    const hospital = masters.hospitals[first.hospitalId]!.name
    expect(filterToAuthorise(rows, { ...all, q: hospital.toUpperCase() }, masters).every((r) => r.list.hospitalId === first.hospitalId)).toBe(true)
    const surgeon = masters.surgeons[first.surgeonId]!.name
    expect(filterToAuthorise(rows, { ...all, q: surgeon }, masters).map((r) => r.list.id)).toContain(first.id)

    const onDay = filterToAuthorise(rows, { ...all, dateISO: first.dateISO }, masters)
    expect(onDay.every((r) => r.list.dateISO === first.dateISO)).toBe(true)

    const look = filterToAuthorise(rows, { ...all, look: true }, masters)
    expect(look.map((r) => r.list.id)).toContain(FLAGGED)
    expect(look.every((r) => r.needsALook)).toBe(true)
    expect(look.length).toBeLessThan(rows.length)
  })
})

describe("reviewQueueOrder (Review's Previous and Next)", () => {
  const list = (anaesthetistId: string, dateISO: string, session: 'AM' | 'PM') => ({ anaesthetistId, dateISO, session })
  const lists = {
    souterAm: list(ANAE.souter, '2026-11-23', 'AM'),
    morrison: list(ANAE.morrison, '2026-11-20', 'PM'),
    souterPm: list(ANAE.souter, '2026-11-23', 'PM'),
    souterEarlier: list(ANAE.souter, '2026-11-20', 'PM'),
    chen: list(ANAE.chen, '2026-11-19', 'AM'),
  }

  it("keeps each anaesthetist's Lists together, by date then AM before PM, in the order each first appears", () => {
    expect(reviewQueueOrder(['souterPm', 'morrison', 'souterAm', 'chen', 'souterEarlier'], lists)).toEqual([
      'souterEarlier',
      'souterAm',
      'souterPm',
      'morrison',
      'chen',
    ])
  })

  it('leaves a queue of one anaesthetist each as it is', () => {
    expect(reviewQueueOrder(['chen', 'morrison', 'souterAm'], lists)).toEqual(['chen', 'morrison', 'souterAm'])
  })
})
