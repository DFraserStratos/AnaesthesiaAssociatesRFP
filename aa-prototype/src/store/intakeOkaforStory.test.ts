/**
 * The Okafor story end to end (build plan Phases 68 to 72; the Wave 7 join's "play the six demo actions in order"):
 * the six Intake demo actions, each run through its own trigger body as its source, and between them the office's
 * decisions through the store's actions, on one state (the practice, where St George's and Southern Cross hold Lists
 * on the day). Throughout: Intake's badge is the feed's To decide count, and no action changes the schedule or the
 * patients before the office decides.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { createAppStore, practiceAppState, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { MAILBOX_ACTOR } from './intakeIngest'
import { integrationActorForHospital } from './integrationActions'
import { placeArrivalList, placeChoicesFor, sessionChoice } from './intakePlace'
import { applyArrivingList, decideCancellation, stubCandidates } from './intakeApply'
import { confirmUnchangedLists, dismissHeldMessage, DISMISS_REASON_REQUIRED } from './intakeBulk'
import { dismissUnreadablePdf, DISMISS_REASON_REQUIRED_MESSAGE } from './pdfListActions'
import { arrivalFeedCounts, arrivalItemsOf, arrivalRows } from './intakeSelectors'
import { assessImportRow, matchingAttentionCount } from './matchingSelectors'
import { DEMO_TRIGGERS } from '../shared/demoTriggers/registry'
import type { DemoTriggerCtx } from '../shared/demoTriggers/types'
import { OKAFOR_STORY, OKAFOR_STORY_LIST, OKAFOR_STORY_PATIENTS } from '../domain/intake/hospitalDownloads'
import { toCheckCount } from '../domain/intake/pdfRead'
import type { ArrivalItem } from '../domain/intake/arrivals'
import { slotIdFor } from '../domain/slots'
import { ANAE, HOSP, SURG } from '../domain/seed/cast'

const S = OKAFOR_STORY
const P = OKAFOR_STORY_PATIENTS
const ARRIVALS: DemoTriggerCtx = { pathname: '/admin/intake', params: {}, published: {} }
const STG_FEED = integrationActorForHospital(HOSP.stg).who
const SX_FEED = integrationActorForHospital(HOSP.sx).who

let api: AppStoreApi
beforeAll(() => {
  api = createAppStore()
  api.setState(practiceAppState())
}, 120_000)

const state = () => api.getState()
const badge = () => matchingAttentionCount(state())

/** The badge is the feed's To decide count, every time it is read. */
function badgeIsToDecide(): number {
  const b = badge()
  expect(b, 'badge vs To decide').toBe(arrivalFeedCounts(state()).toDecide)
  return b
}

/** The schedule and the patients, to show an arrival changed nothing. */
const held = () => JSON.stringify({ schedule: state().schedule, patients: state().masters.patients })

/**
 * Play one demo action as its source: enabled, ok, every audit entry written by `who`, nothing decided (the schedule
 * and patients untouched, every row it staged open). Returns the one batch it made.
 */
function play(id: string, who: string, choiceId?: string): string {
  const t = DEMO_TRIGGERS.find((x) => x.id === id)
  if (t === undefined) throw new Error(`no trigger ${id}`)
  expect(t.disabledReason(state(), ARRIVALS, choiceId), id).toBeNull()
  const before = held()
  const auditFrom = state().audit.length
  const batchesBefore = new Set(Object.keys(state().intake.batches))
  const out = t.run(api, ARRIVALS, choiceId)
  expect(out.ok, out.message).toBe(true)
  for (const e of state().audit.slice(auditFrom)) expect(e.who, `${id}: ${e.action}`).toBe(who)
  expect(held(), `${id} changed the schedule or patients`).toBe(before)
  const made = Object.keys(state().intake.batches).filter((b) => !batchesBefore.has(b))
  expect(made, id).toHaveLength(1)
  for (const rowId of state().intake.batches[made[0]!]!.rowIds) expect(state().intake.rows[rowId]!.status).toBe('open')
  return made[0]!
}

const itemsOf = (batchId: string): ArrivalItem[] => arrivalItemsOf(state()).filter((i) => i.batchId === batchId)
const changeSetsSince = (from: number) => new Set(state().audit.slice(from).map((a) => a.changeSetId))
const bookingsOn = (listId: string) => Object.values(state().schedule.bookings).filter((b) => b.listId === listId)
/**
 * The schedule as content: a confirmed match stamps only bookkeeping on its Booking (last modified, and the patient
 * balance check, US-11.3.2), as `intakeBulk.test.ts` reads it.
 */
const scheduleContent = () => {
  const sch = state().schedule
  const bookings = Object.fromEntries(
    Object.entries(sch.bookings).map(([id, b]) => {
      const { lastModifiedBy: _by, lastModifiedAtISO: _at, balanceCheck: _check, ...content } = b
      return [id, content]
    }),
  )
  return JSON.stringify({ ...sch, bookings })
}
const bookingFor = (listId: string, name: string) => bookingsOn(listId).find((b) => state().masters.patients[b.patientId]?.name === name)

// Carried from step to step.
let listId = ''
let stubId = ''
let faleoloRowId = ''
let pikeBookingId = ''

describe("the Okafor story, the six demo actions in order (D119, intake-ideas.html section 2)", () => {
  it('starts with the badge equal to To decide', () => {
    badgeIsToDecide()
  })

  it("(1) the rooms email a List: a New List from the mailbox naming Dr Rutherford, placed in his free Wed 25 Nov PM session as one change set, Sione Faleolo a standing stub", () => {
    const b0 = badgeIsToDecide()
    const batchId = play('intake-rooms-email-list', MAILBOX_ACTOR.who)
    expect(state().intake.batches[batchId]!.arrivalSource).toEqual({ kind: 'mailbox', senderEmail: S.roomsList.senderEmail })
    const items = itemsOf(batchId)
    expect(items.map((i) => i.kind)).toEqual(['newList', 'needsNhi'])
    const item = items[0]!
    expect(item).toMatchObject({
      dateISO: OKAFOR_STORY_LIST.dateISO,
      session: OKAFOR_STORY_LIST.session,
      surgeonId: SURG.okafor,
      namedAnaesthetistId: ANAE.rutherford,
      source: { kind: 'rooms', senderEmail: S.roomsList.senderEmail },
      flags: { needsNhi: 1 },
    })
    expect(item.rowIds).toHaveLength(4)
    faleoloRowId = item.rowIds.find((id) => state().intake.rows[id]!.incoming.patient.name === P.faleolo.name)!
    expect(state().intake.rows[faleoloRowId]!.incoming.patient.nhi).toBeUndefined()
    // The New List and Faleolo waiting for his NHI.
    expect(badgeIsToDecide()).toBe(b0 + 2)

    const choices = placeChoicesFor(state(), item.key)!
    expect(choices.namedAnaesthetistId).toBe(ANAE.rutherford)
    expect(choices.suggested).toMatchObject({ anaesthetistId: ANAE.rutherford, dateISO: '2026-11-25', session: 'PM' })
    expect(choices.suggested!.id).toBe(slotIdFor(ANAE.rutherford, '2026-11-25', 'PM'))

    const from = state().audit.length
    const placed = placeArrivalList(api, OFFICE_ACTOR, item.key, sessionChoice(choices.suggested!.id))
    if (!placed.ok) throw new Error(placed.message)
    listId = placed.value.listId
    expect(state().schedule.lists[listId]).toMatchObject({ state: 'ACTIVE', anaesthetistId: ANAE.rutherford, surgeonId: SURG.okafor, dateISO: '2026-11-25', session: 'PM' })
    expect(bookingsOn(listId).map((b) => state().masters.patients[b.patientId]!.name).sort()).toEqual([P.pike.name, P.lindqvist.name, P.ngata.name])
    expect(placed.value.stubIds).toHaveLength(1)
    stubId = placed.value.stubIds[0]!
    expect(state().intake.stubs[stubId]).toMatchObject({ listId, importRowId: faleoloRowId, status: 'standing', asReceived: { patientName: P.faleolo.name } })
    expect(placed.value.changeSetId).not.toBeNull()
    expect(changeSetsSince(from)).toEqual(new Set([placed.value.changeSetId]))
    pikeBookingId = bookingFor(listId, P.pike.name)!.id
    // The List leaves To decide; Faleolo still waits.
    expect(badgeIsToDecide()).toBe(b0 + 1)
  })

  it("(2) the rooms re-send it: an Update to that List, Pike offered as a removal, Lindqvist's time changed, Brooks added; applied as one change set, Pike's Booking kept and cancelled", () => {
    const b0 = badgeIsToDecide()
    const batchId = play('intake-rooms-resend', MAILBOX_ACTOR.who)
    const items = itemsOf(batchId)
    expect(items.map((i) => i.kind)).toEqual(['update'])
    const item = items[0]!
    expect(item.heldListId).toBe(listId)
    expect(item.flags.removals).toBe(1)
    expect(badgeIsToDecide()).toBe(b0 + 1)

    const rows = arrivalRows(state(), item.key)
    const byName = (name: string) => rows.find((r) => r.patientName === name)
    expect(byName(P.pike.name)).toMatchObject({ change: 'removed', bookingId: pikeBookingId })
    expect(byName(P.lindqvist.name)).toMatchObject({ change: 'changed', scheduledTime: '15:30' })
    expect(byName(P.brooks.name)?.change).toBe('added')
    expect(byName(P.ngata.name)?.change).toBe('unchanged')

    const from = state().audit.length
    const res = applyArrivingList(api, OFFICE_ACTOR, item.key, {})
    if (!res.ok) throw new Error(res.message)
    expect(res.value.changeSetId).not.toBeNull()
    expect(changeSetsSince(from)).toEqual(new Set([res.value.changeSetId]))
    const pike = state().schedule.bookings[pikeBookingId]!
    expect(pike.listId).toBe(listId)
    expect(pike.cancellation).toBeDefined()
    expect(bookingFor(listId, P.lindqvist.name)!.scheduledTime).toBe('15:30')
    expect(bookingFor(listId, P.brooks.name)).toBeDefined()
    expect(state().intake.stubs[stubId]!.status).toBe('standing')
    expect(badgeIsToDecide()).toBe(b0)
  })

  it("(3) St George's day-before List: Okafor's an Update carrying Faleolo's NHI, resolving the stub into a Booking (DM-17); the day's other Lists match exactly and are confirmed together in one change set", () => {
    const b0 = badgeIsToDecide()
    const batchId = play('intake-stg-day-before', STG_FEED)
    const items = itemsOf(batchId)
    const okafor = items.find((i) => i.heldListId === listId)!
    expect(okafor.kind).toBe('update')
    const exact = items.filter((i) => i.kind === 'matchesExactly')
    expect(exact).toHaveLength(S.stgDayBefore.matchingListCount)
    expect(items).toHaveLength(1 + S.stgDayBefore.matchingListCount)
    expect(badgeIsToDecide()).toBe(b0 + items.length)

    // The St George's row with Faleolo's NHI is offered to resolve his stub.
    const candidates = stubCandidates(state(), okafor.key)
    const entries = Object.entries(candidates)
    expect(entries).toHaveLength(1)
    const [arrivingRowId, matches] = entries[0]!
    expect(state().intake.rows[arrivingRowId]!.incoming.patient).toMatchObject({ name: P.faleolo.name, nhi: P.faleolo.nhiFromHospital })
    expect(matches).toEqual([{ stubId, waitingRowId: faleoloRowId, nhi: P.faleolo.nhiFromHospital }])

    // The exact matches, confirmed together: one change set, the schedule untouched.
    const schedule = scheduleContent()
    let from = state().audit.length
    const confirmed = confirmUnchangedLists(api, OFFICE_ACTOR, batchId, exact.map((i) => i.key))
    if (!confirmed.ok) throw new Error(confirmed.message)
    expect(confirmed.value.confirmed.sort()).toEqual(exact.map((i) => i.key).sort())
    expect(confirmed.value.skipped).toEqual([])
    expect(changeSetsSince(from)).toEqual(new Set([confirmed.value.changeSetId]))
    expect(scheduleContent()).toBe(schedule)
    expect(badgeIsToDecide()).toBe(b0 + 1)

    // Okafor's Update applied: the stub becomes Faleolo's Booking, one change set.
    from = state().audit.length
    const res = applyArrivingList(api, OFFICE_ACTOR, okafor.key, {})
    if (!res.ok) throw new Error(res.message)
    expect(changeSetsSince(from)).toEqual(new Set([res.value.changeSetId]))
    const stub = state().intake.stubs[stubId]!
    expect(stub.status).toBe('resolved')
    const faleolo = bookingFor(listId, P.faleolo.name)
    expect(faleolo).toBeDefined()
    expect(stub.bookingId).toBe(faleolo!.id)
    expect(state().masters.patients[faleolo!.patientId]!.nhi).toBe(P.faleolo.nhiFromHospital)
    expect(state().intake.rows[faleoloRowId]!.status).toBe('applied')
    // Okafor's Update and Faleolo's wait both leave To decide.
    expect(badgeIsToDecide()).toBe(b0 - 1)
  })

  it('(4) Southern Cross cancels a Booking: a cancellation arrival, the Booking untouched until decided, then kept visible, marked cancelled', () => {
    const b0 = badgeIsToDecide()
    const batchId = play('intake-sx-cancels', SX_FEED)
    const items = itemsOf(batchId)
    expect(items.map((i) => i.kind)).toEqual(['cancellation'])
    expect(badgeIsToDecide()).toBe(b0 + 1)
    const suggestion = assessImportRow(state(), items[0]!.rowIds[0]!)?.suggestion
    expect(suggestion).toMatchObject({ kind: 'match', changeType: 'cancellation' })
    const bookingId = suggestion!.kind === 'match' ? suggestion!.bookingId : ''
    const before = state().schedule.bookings[bookingId]!
    expect(before.cancellation).toBeUndefined()

    const res = decideCancellation(api, OFFICE_ACTOR, items[0]!.key, 'apply')
    if (!res.ok) throw new Error(res.message)
    const after = state().schedule.bookings[bookingId]!
    expect(after.cancellation).toBeDefined()
    expect(after.listId).toBe(before.listId)
    expect(badgeIsToDecide()).toBe(b0)
  })

  it('(5) a scanned PDF: its unsure values flagged to check; the page that cannot be read counts in the badge until dismissed with a reason', () => {
    const b0 = badgeIsToDecide()
    const scanBatch = play('intake-scanned-pdf', MAILBOX_ACTOR.who, 'scan')
    const scan = itemsOf(scanBatch)
    expect(scan.map((i) => i.kind)).toEqual(['update'])
    expect(scan[0]!.flags.toCheck).toBe(3)
    const pdfListId = state().intake.batches[scanBatch]!.pdfListId!
    expect(toCheckCount(state().intake.pdfLists[pdfListId]!)).toBe(3)
    expect(badgeIsToDecide()).toBe(b0 + 1)

    const unreadableBatch = play('intake-scanned-pdf', MAILBOX_ACTOR.who, 'unreadable')
    const unreadable = itemsOf(unreadableBatch)
    expect(unreadable).toHaveLength(1)
    expect(unreadable[0]).toMatchObject({ kind: 'unreadable', reason: S.unreadable.reason, decided: false })
    expect(badgeIsToDecide()).toBe(b0 + 2)

    expect(dismissUnreadablePdf(api, OFFICE_ACTOR, unreadableBatch, '  ')).toMatchObject({ ok: false, message: DISMISS_REASON_REQUIRED_MESSAGE })
    expect(badgeIsToDecide()).toBe(b0 + 2)
    const out = dismissUnreadablePdf(api, OFFICE_ACTOR, unreadableBatch, 'Asked the rooms for a clearer copy')
    if (!out.ok) throw new Error(out.message)
    expect(state().intake.batches[unreadableBatch]!.dismissed).toMatchObject({ by: OFFICE_ACTOR.who, reason: 'Asked the rooms for a clearer copy' })
    expect(itemsOf(unreadableBatch)[0]).toMatchObject({ kind: 'unreadable', decided: true })
    expect(badgeIsToDecide()).toBe(b0 + 1)
  })

  it('(6) a feed message fails: held and counted until dismissed with a reason, never dropped', () => {
    const b0 = badgeIsToDecide()
    const batchId = play('intake-feed-fails', SX_FEED)
    const items = itemsOf(batchId)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'held', reason: S.failedMessage.reason, decided: false })
    expect(badgeIsToDecide()).toBe(b0 + 1)

    expect(dismissHeldMessage(api, OFFICE_ACTOR, batchId, '')).toMatchObject({ ok: false, message: DISMISS_REASON_REQUIRED })
    expect(badgeIsToDecide()).toBe(b0 + 1)
    const out = dismissHeldMessage(api, OFFICE_ACTOR, batchId, 'Southern Cross re-sent it with the patient')
    if (!out.ok) throw new Error(out.message)
    expect(state().intake.batches[batchId]).toMatchObject({ heldReason: S.failedMessage.reason, dismissed: { reason: 'Southern Cross re-sent it with the patient' } })
    expect(itemsOf(batchId)[0]).toMatchObject({ kind: 'held', decided: true })
    expect(badgeIsToDecide()).toBe(b0)
  })
})
