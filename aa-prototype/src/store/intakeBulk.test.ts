/**
 * Intake's bulk decisions (build plan Phase 71; US-02.1.6, US-02.1.7, D118, D125): Confirm unchanged decides every
 * List of an arrival that matches exactly as one change set, changing no List, Booking or Slot, re-checked at the
 * click; Dismiss takes a held message out of To decide with a reason. On the practice, where St George's day-before
 * message carries Lists that match exactly.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, practiceAppState, type AppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { confirmUnchangedLists, dismissHeldMessage, unchangedListsOfBatch } from './intakeBulk'
import { receiveFailedMessage, receiveHospitalBatch, stgDayBeforeRows } from './intakeIngest'
import { arrivalByKey, arrivalFeedCounts, arrivalItemsOf } from './intakeSelectors'
import type { Actor } from './mutate'
import { identicalReArrival, isUnchangedList, unchangedLists } from '../domain/intake/unchanged'
import { OKAFOR_STORY } from '../domain/intake/hospitalDownloads'
import { HOSP } from '../domain/seed/cast'

const ANAESTHETIST: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

/** The practice with St George's day-before message received (as its feed): the store and the arrival's id. */
function dayBefore(): { api: AppStoreApi; batchId: string } {
  const api = createAppStore()
  api.setState(practiceAppState())
  const out = receiveHospitalBatch(api, HOSP.stg, OKAFOR_STORY.stgDayBefore.label, stgDayBeforeRows(api.getState()))
  if (!out.ok) throw new Error(out.message)
  return { api, batchId: out.value.batchId }
}

function listsOf(api: AppStoreApi, batchId: string) {
  return arrivalItemsOf(api.getState()).filter((i) => i.batchId === batchId && i.kind !== 'needsNhi')
}

/**
 * Every domain slice a confirm must leave alone (all but the intake records and the audit bookkeeping). A matched
 * Booking keeps only bookkeeping from the match: its last-modified stamp and its balance-check stamp (US-11.3.2,
 * written by every match of a hospital row); its content is compared whole.
 */
function outsideIntake(s: AppState) {
  const bookings = Object.fromEntries(
    Object.entries(s.schedule.bookings).map(([id, b]) => {
      const { lastModifiedBy: _by, lastModifiedAtISO: _at, balanceCheck: _check, ...content } = b
      return [id, content]
    }),
  )
  return {
    masters: s.masters,
    schedule: { ...s.schedule, bookings },
    settings: s.settings,
    appSettings: s.appSettings,
    billing: s.billing,
    xero: s.xero,
    integrations: s.integrations,
    masterLoads: s.masterLoads,
    dayNotes: s.dayNotes,
    officePrivate: s.officePrivate,
    notifications: s.notifications,
    patientCare: s.patientCare,
    support: s.support,
  }
}

describe('confirmUnchangedLists (US-02.1.6, D118)', () => {
  it("shows the day-before message's exact Lists as unchanged and the update List not, all waiting after the ingest", () => {
    const { api, batchId } = dayBefore()
    const lists = listsOf(api, batchId)
    const exact = lists.filter(isUnchangedList)
    expect(exact).toHaveLength(OKAFOR_STORY.stgDayBefore.matchingListCount)
    expect(lists.filter((i) => !isUnchangedList(i)).length).toBeGreaterThan(0)
    // Nothing decides them at the ingest: they wait for a person.
    expect(exact.every((i) => !i.decided && i.openRowIds.length > 0)).toBe(true)
    expect(unchangedListsOfBatch(api.getState(), batchId).map((i) => i.key)).toEqual(unchangedLists(lists).map((i) => i.key))
  })

  it('one confirm decides every unchanged List as one change set, changing no List, Booking or Slot', () => {
    const { api, batchId } = dayBefore()
    const before = api.getState()
    const keys = unchangedListsOfBatch(before, batchId).map((i) => i.key)
    const others = listsOf(api, batchId).filter((i) => !isUnchangedList(i))
    const out = confirmUnchangedLists(api, OFFICE_ACTOR, batchId, keys)
    if (!out.ok) throw new Error(out.message)
    expect(out.value.confirmed).toEqual(keys)
    expect(out.value.skipped).toEqual([])
    const after = api.getState()
    const sets = new Set(after.audit.slice(before.audit.length).map((a) => a.changeSetId))
    expect(sets.size).toBe(1)
    expect([...sets][0]).toBe(out.value.changeSetId)
    expect(outsideIntake(after)).toEqual(outsideIntake(before))
    for (const key of keys) expect(arrivalByKey(after, key)).toMatchObject({ kind: 'matchesExactly', decided: true })
    // A List with a difference is left for its own bench.
    for (const other of others) expect(arrivalByKey(after, other.key)!.openRowIds).toEqual(other.openRowIds)
    expect(unchangedListsOfBatch(after, batchId)).toEqual([])
  })

  it('an identical re-arrival whose earlier rows are all decided still waits as an unchanged List', () => {
    const { api, batchId } = dayBefore()
    const exact = unchangedListsOfBatch(api.getState(), batchId)
    const sent = exact.flatMap((i) => i.rowIds.map((id) => api.getState().intake.rows[id]!.incoming))
    const done = confirmUnchangedLists(api, OFFICE_ACTOR, batchId)
    expect(done.ok).toBe(true)
    const again = receiveHospitalBatch(api, HOSP.stg, 'Identical re-arrival', sent)
    if (!again.ok) throw new Error(again.message)
    const s = api.getState()
    const reArrived = listsOf(api, again.value.batchId)
    expect(reArrived).toHaveLength(exact.length)
    expect(reArrived.every((i) => i.kind === 'matchesExactly' && !i.decided && identicalReArrival(s.intake, i))).toBe(true)
    expect(unchangedListsOfBatch(s, again.value.batchId)).toHaveLength(exact.length)
  })

  it('refuses another role and an arrival with none', () => {
    const { api, batchId } = dayBefore()
    const audit = api.getState().audit.length
    expect(confirmUnchangedLists(api, ANAESTHETIST, batchId)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(confirmUnchangedLists(api, OFFICE_ACTOR, batchId)).toMatchObject({ ok: true })
    expect(confirmUnchangedLists(api, OFFICE_ACTOR, batchId)).toMatchObject({ ok: false, code: 'nothingToConfirm' })
    expect(confirmUnchangedLists(api, OFFICE_ACTOR, 'no-such-arrival')).toMatchObject({ ok: false, code: 'nothingToConfirm' })
    expect(api.getState().audit.slice(audit).every((a) => a.role === 'office')).toBe(true)
  })

  it('a List that gained a difference since it was shown is skipped and named', () => {
    const { api, batchId } = dayBefore()
    const shown = unchangedListsOfBatch(api.getState(), batchId)
    expect(shown.length).toBeGreaterThanOrEqual(2)
    const [kept, changed] = shown as [(typeof shown)[number], (typeof shown)[number]]
    // AA's Booking moves after the List was shown, so the row as sent now differs from it.
    const s = api.getState()
    const row = s.intake.rows[changed.openRowIds[0]!]!
    const booking = Object.values(s.schedule.bookings).find((b) => b.listId === changed.heldListId && b.scheduledTime === row.incoming.scheduledTime)!
    api.setState({ schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [booking.id]: { ...booking, scheduledTime: '06:05' } } } })
    const out = confirmUnchangedLists(api, OFFICE_ACTOR, batchId, shown.map((i) => i.key))
    if (!out.ok) throw new Error(out.message)
    expect(out.value.confirmed).toEqual([kept.key])
    expect(out.value.skipped).toEqual([changed.title])
    expect(arrivalByKey(api.getState(), changed.key)!.decided).toBe(false)
  })
})

describe('dismissHeldMessage (US-02.1.7, D125)', () => {
  function held(): { api: AppStoreApi; batchId: string } {
    const api = createAppStore()
    const out = receiveFailedMessage(api, HOSP.sx, { label: 'Southern Cross · appointment', reason: 'No patient in the message', raw: 'MSH|^~\\&|SX' })
    if (!out.ok) throw new Error(out.message)
    return { api, batchId: out.value.batchId }
  }

  it('needs a reason and refuses another role, writing nothing', () => {
    const { api, batchId } = held()
    const before = api.getState()
    expect(dismissHeldMessage(api, OFFICE_ACTOR, batchId, '   ')).toMatchObject({ ok: false, code: 'reasonRequired' })
    expect(dismissHeldMessage(api, ANAESTHETIST, batchId, 'Sent again')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(dismissHeldMessage(api, OFFICE_ACTOR, 'no-such-arrival', 'Sent again')).toMatchObject({ ok: false, code: 'notFound' })
    expect(api.getState()).toBe(before)
  })

  it('is one change set with one audit entry; the message leaves To decide and reads decided', () => {
    const { api, batchId } = held()
    const before = api.getState()
    const toDecide = arrivalFeedCounts(before).toDecide
    expect(arrivalByKey(before, batchId)).toMatchObject({ kind: 'held', decided: false })
    const out = dismissHeldMessage(api, OFFICE_ACTOR, batchId, '  The hospital sent it again  ')
    if (!out.ok) throw new Error(out.message)
    const after = api.getState()
    const entries = after.audit.slice(before.audit.length)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ action: 'importBatch.dismissed', entityId: batchId, who: OFFICE_ACTOR.who, changeSetId: out.value.changeSetId })
    expect(out.value.changeSetId).not.toBeNull()
    expect(after.intake.batches[batchId]!.dismissed).toEqual({ by: OFFICE_ACTOR.who, atISO: entries[0]!.atISO, reason: 'The hospital sent it again' })
    expect({ ...after.intake.batches[batchId], dismissed: undefined }).toEqual({ ...before.intake.batches[batchId], dismissed: undefined })
    expect(arrivalFeedCounts(after).toDecide).toBe(toDecide - 1)
    expect(arrivalByKey(after, batchId)!.decided).toBe(true)
    expect(dismissHeldMessage(api, OFFICE_ACTOR, batchId, 'Again')).toMatchObject({ ok: false, code: 'alreadyDismissed' })
  })

  it('refuses an arrival that is not a held message', () => {
    const { api, batchId } = dayBefore()
    expect(dismissHeldMessage(api, OFFICE_ACTOR, batchId, 'Not ours')).toMatchObject({ ok: false, code: 'notHeld' })
  })
})
