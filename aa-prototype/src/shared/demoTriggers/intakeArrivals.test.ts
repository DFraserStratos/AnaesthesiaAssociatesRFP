/**
 * Intake's six demo actions (build plan Phase 68; D119): each runs as its source through the ingest, never as the
 * office; decides nothing (no row decided, the schedule and the patients untouched); is disabled or refused on a
 * repeat; and lands in the feed as its kind (`arrivalItemsOf`). Then the badge walk: `matchingAttentionCount` after
 * each action played in order on one state (the practice, where St George's and Southern Cross hold Lists on the
 * day), with the office's placing of Mr Okafor's List between the first two, as the story plays it.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { createAppStore, practiceAppState, type AppState, type AppStoreApi } from '../../store/appStore'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { decideArrivingLists } from '../../store/intakeDecide'
import { arrivalFeed, arrivalItemsOf } from '../../store/intakeSelectors'
import { matchingAttentionCount } from '../../store/matchingSelectors'
import { MAILBOX_ACTOR } from '../../store/intakeIngest'
import { integrationActorForHospital } from '../../store/integrationActions'
import { OKAFOR_STORY, OKAFOR_STORY_LIST } from '../../domain/intake/hospitalDownloads'
import type { ArrivalItem } from '../../domain/intake/arrivals'
import { HOSP, SURG } from '../../domain/seed/cast'
import { slotIdFor } from '../../domain/slots'
import { DEMO_TRIGGERS } from './registry'
import type { DemoTrigger, DemoTriggerCtx } from './types'

const byId = (id: string): DemoTrigger => DEMO_TRIGGERS.find((t) => t.id === id)!
const ARRIVALS: DemoTriggerCtx = { pathname: '/admin/intake', params: {}, published: {} }
const SOURCES: DemoTriggerCtx = { pathname: '/admin/intake/sources', params: {}, published: {} }
const S = OKAFOR_STORY

let practice: AppState
beforeAll(() => {
  practice = practiceAppState()
}, 120_000)

function core(): AppStoreApi {
  return createAppStore()
}

function inPractice(): AppStoreApi {
  const api = createAppStore()
  api.setState(practice)
  return api
}

/** The schedule and the patients, to show an action decided nothing. */
const held = (api: AppStoreApi) => JSON.stringify({ schedule: api.getState().schedule, patients: api.getState().masters.patients })

/**
 * Run an action and check it ran as `who` (never the office), wrote something, and decided nothing: every row it
 * staged is open, and the schedule and patients are as they were. Returns the batches it made.
 */
function runAsSource(api: AppStoreApi, id: string, who: string, choiceId?: string, ctx: DemoTriggerCtx = ARRIVALS): string[] {
  const t = byId(id)
  expect(t.disabledReason(api.getState(), ctx, choiceId), id).toBeNull()
  const auditFrom = api.getState().audit.length
  const batchesBefore = new Set(Object.keys(api.getState().intake.batches))
  const before = held(api)
  const out = t.run(api, ctx, choiceId)
  expect(out.ok, out.message).toBe(true)
  expect(out.message).not.toMatch(/[–—]/)
  const written = api.getState().audit.slice(auditFrom)
  expect(written.length).toBeGreaterThan(0)
  for (const e of written) {
    expect(e.who, `${id}: ${e.action}`).toBe(who)
    expect(e.role, `${id}: ${e.action}`).not.toBe('office')
  }
  expect(held(api)).toBe(before)
  const batches = Object.keys(api.getState().intake.batches).filter((b) => !batchesBefore.has(b))
  expect(batches.length, id).toBeGreaterThan(0)
  for (const b of batches) for (const rowId of api.getState().intake.batches[b]!.rowIds) expect(api.getState().intake.rows[rowId]!.status).toBe('open')
  return batches
}

const itemsOf = (api: AppStoreApi, batchId: string): ArrivalItem[] => arrivalItemsOf(api.getState()).filter((i) => i.batchId === batchId)

/** The office places Mr Okafor's first List in Dr Rutherford's free Wed 25 Nov PM Slot; Sione Faleolo's row waits for his NHI. */
function placeOkafor(api: AppStoreApi, batchId: string): string {
  const rows = api.getState().intake.batches[batchId]!.rowIds.map((id) => api.getState().intake.rows[id]!)
  const placeable = rows.filter((r) => r.incoming.patient.nhi !== undefined)
  const out = decideArrivingLists(api, OFFICE_ACTOR, [
    {
      rows: placeable.map((r) => ({ rowId: r.id, kind: 'place' as const })),
      placement: { kind: 'slot', slotId: slotIdFor(OKAFOR_STORY_LIST.anaesthetistId, OKAFOR_STORY_LIST.dateISO, OKAFOR_STORY_LIST.session), surgeonId: SURG.okafor },
    },
  ])
  if (!out.ok) throw new Error(out.message)
  return out.value.placedListIds[0]!
}

const STG_FEED = integrationActorForHospital(HOSP.stg).who
const SX_FEED = integrationActorForHospital(HOSP.sx).who

describe('the six actions are registered as D119 names them', () => {
  it('on Arrivals, in the bar, the feed failure on Sources too; four keep the run sheet label until the sweep', () => {
    expect(DEMO_TRIGGERS.filter((t) => t.id.startsWith('intake-')).map((t) => [t.id, t.label])).toEqual([
      ['intake-rooms-email-list', 'Receive list with a missing NHI'],
      ['intake-rooms-resend', 'Receive updated PDF from rooms'],
      ['intake-stg-day-before', 'Import hospital file'],
      ['intake-sx-cancels', 'Send update for a matched Booking'],
      ['intake-scanned-pdf', 'A scanned PDF arrives'],
      ['intake-feed-fails', 'A feed message fails'],
    ])
    for (const t of DEMO_TRIGGERS.filter((x) => x.id.startsWith('intake-'))) {
      expect(t.surfaces, t.id).toEqual(['bar'])
      expect(t.routes, t.id).toContain('/admin/intake')
      expect(`${t.label} ${t.description}`, t.id).not.toMatch(/[–—]|\bslot\b|\bCard\b/)
    }
    expect(byId('intake-feed-fails').routes).toEqual(['/admin/intake', '/admin/intake/sources'])
  })
})

describe('(1) Rooms email a List', () => {
  it("lands as the mailbox: a New List with one patient needing an NHI; then Already received", () => {
    const api = core()
    const [batchId] = runAsSource(api, 'intake-rooms-email-list', MAILBOX_ACTOR.who)
    // The New List, and its patient with no NHI also as a Needs NHI item (D117: Waiting for NHI folds into the feed).
    const items = itemsOf(api, batchId!)
    expect(items.map((i) => i.kind)).toEqual(['newList', 'needsNhi'])
    expect(items[0]).toMatchObject({ dateISO: '2026-11-25', session: 'PM', source: { kind: 'rooms' }, title: "Mr Okafor · St George's · Wed 25 Nov PM" })
    expect(items[0]!.flags).toEqual({ needsNhi: 1 })
    expect(items[0]!.rowIds).toHaveLength(4)
    expect(api.getState().intake.rows[items[1]!.rowIds[0]!]!.incoming.patient.name).toBe('Sione Faleolo')
    expect(byId('intake-rooms-email-list').disabledReason(api.getState(), ARRIVALS)).toBe('Already received')
  })
})

describe('(2) Rooms re-send it', () => {
  it('waits for the first List; before it is held it lands as a second new List', () => {
    const api = core()
    expect(byId('intake-rooms-resend').disabledReason(api.getState(), ARRIVALS)).toBe("Mr Okafor's first List has not arrived yet")
    runAsSource(api, 'intake-rooms-email-list', MAILBOX_ACTOR.who)
    const [batchId] = runAsSource(api, 'intake-rooms-resend', MAILBOX_ACTOR.who)
    expect(itemsOf(api, batchId!).map((i) => i.kind)).toEqual(['newList'])
    expect(byId('intake-rooms-resend').disabledReason(api.getState(), ARRIVALS)).toBe('Already received')
  })

  it("once Okafor's List is placed, lands as an Update with Gordon Pike's Booking to confirm as a removal", () => {
    const api = core()
    const [first] = runAsSource(api, 'intake-rooms-email-list', MAILBOX_ACTOR.who)
    const listId = placeOkafor(api, first!)
    expect(api.getState().schedule.lists[listId]).toMatchObject({ anaesthetistId: OKAFOR_STORY_LIST.anaesthetistId, dateISO: '2026-11-25', session: 'PM', surgeonId: SURG.okafor })
    const [batchId] = runAsSource(api, 'intake-rooms-resend', MAILBOX_ACTOR.who)
    const items = itemsOf(api, batchId!)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'update', heldListId: listId })
    expect(items[0]!.flags.removals).toBe(1)
    const removal = items[0]!.rowIds.map((id) => api.getState().intake.rows[id]!).find((r) => r.removalOfBookingId !== undefined)
    expect(removal?.incoming.patient.name).toBe('Gordon Pike')
    expect(byId('intake-rooms-resend').run(api, ARRIVALS).ok).toBe(false)
  })
})

describe("(3) St George's sends the day-before List", () => {
  it("in the core seed (no other St George's List that day): Okafor's rows only, as St George's feed; then Already received", () => {
    const api = core()
    const [batchId] = runAsSource(api, 'intake-stg-day-before', STG_FEED)
    expect(api.getState().intake.batches[batchId!]!.rowIds).toHaveLength(S.stgDayBefore.okaforRows.length)
    expect(itemsOf(api, batchId!).map((i) => i.kind)).toEqual(['newList'])
    expect(byId('intake-stg-day-before').disabledReason(api.getState(), ARRIVALS)).toBe('Already received')
  })

  it("in the practice, after Okafor's List is placed: a St George's file over Okafor's Update and Lists that match exactly", () => {
    const api = inPractice()
    const [first] = runAsSource(api, 'intake-rooms-email-list', MAILBOX_ACTOR.who)
    const listId = placeOkafor(api, first!)
    const [batchId] = runAsSource(api, 'intake-stg-day-before', STG_FEED)
    const items = itemsOf(api, batchId!)
    expect(items.find((i) => i.heldListId === listId)?.kind).toBe('update')
    const exact = items.filter((i) => i.kind === 'matchesExactly')
    expect(exact).toHaveLength(S.stgDayBefore.matchingListCount)
    expect(items).toHaveLength(1 + S.stgDayBefore.matchingListCount)
    const group = arrivalFeed(api.getState(), { kind: 'hospital', hospitalId: HOSP.stg }, '').find((g) => g.items.some((i) => i.batchId === batchId))
    expect(group).toMatchObject({ kind: 'file', heading: { listCount: 1 + S.stgDayBefore.matchingListCount } })
  })
})

describe('(4) Southern Cross cancels a Booking', () => {
  it('is disabled with its reason in the core seed, which holds no Southern Cross Booking ahead', () => {
    expect(byId('intake-sx-cancels').disabledReason(core().getState(), ARRIVALS)).toBe('No Southern Cross Booking ahead to cancel')
  })

  it('in the practice: one Cancellation, as the Southern Cross feed, the Booking untouched; a repeat is disabled while it waits', () => {
    const api = inPractice()
    const [batchId] = runAsSource(api, 'intake-sx-cancels', SX_FEED)
    const items = itemsOf(api, batchId!)
    expect(items.map((i) => i.kind)).toEqual(['cancellation'])
    expect(items[0]!.rowIds).toHaveLength(1)
    expect(byId('intake-sx-cancels').disabledReason(api.getState(), ARRIVALS)).toMatch(/^The cancellation for .+ is already waiting at Intake$/)
  })
})

describe('(5) A scanned PDF arrives', () => {
  it("a scan with values to check (an Update to Mr Whitford's Thu 3 Dec PM List AA holds), as the mailbox; then Already received, and the default moves to the other choice", () => {
    const api = core()
    const t = byId('intake-scanned-pdf')
    expect(t.choices!(api.getState(), ARRIVALS).map((c) => c.id)).toEqual(['scan', 'unreadable'])
    expect(t.defaultChoice!(api.getState(), ARRIVALS)).toBe('scan')
    const [batchId] = runAsSource(api, 'intake-scanned-pdf', MAILBOX_ACTOR.who, 'scan')
    const items = itemsOf(api, batchId!)
    expect(items.map((i) => i.kind)).toEqual(['update'])
    expect(items[0]!.flags).toEqual({ toCheck: 3 })
    expect(t.disabledReason(api.getState(), ARRIVALS, 'scan')).toBe('Already received')
    expect(t.defaultChoice!(api.getState(), ARRIVALS)).toBe('unreadable')
  })

  it('a page that cannot be read lands with its reason, as the mailbox; a repeat is disabled while it stands', () => {
    const api = core()
    const [batchId] = runAsSource(api, 'intake-scanned-pdf', MAILBOX_ACTOR.who, 'unreadable')
    const items = itemsOf(api, batchId!)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'unreadable', reason: S.unreadable.reason, rowIds: [] })
    expect(byId('intake-scanned-pdf').disabledReason(api.getState(), ARRIVALS, 'unreadable')).toBe(`${S.unreadable.fileName} is still in the feed: dismiss it first`)
    expect(byId('intake-scanned-pdf').run(api, ARRIVALS, 'unreadable').ok).toBe(false)
  })
})

describe('(6) A feed message fails', () => {
  it('a held message from Southern Cross, as its feed, from Arrivals or Sources; a repeat is disabled while it stands', () => {
    const api = core()
    const [batchId] = runAsSource(api, 'intake-feed-fails', SX_FEED, undefined, SOURCES)
    const items = itemsOf(api, batchId!)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'held', reason: S.failedMessage.reason, rowIds: [] })
    for (const ctx of [ARRIVALS, SOURCES]) expect(byId('intake-feed-fails').disabledReason(api.getState(), ctx)).toBe('This message is still held in the feed: dismiss it first')
  })
})

describe('the badge walk (D125: each List, each waiting row, each unreadable PDF and held message, once)', () => {
  it('moves by exact numbers through the six actions played in order on the practice', () => {
    const api = inPractice()
    const badge = () => matchingAttentionCount(api.getState())
    const walk: [string, number][] = [['start', badge()]]
    const [first] = runAsSource(api, 'intake-rooms-email-list', MAILBOX_ACTOR.who)
    walk.push(['(1) Rooms email a List', badge()])
    placeOkafor(api, first!)
    walk.push(["the office places Okafor's List", badge()])
    runAsSource(api, 'intake-rooms-resend', MAILBOX_ACTOR.who)
    walk.push(['(2) Rooms re-send it', badge()])
    runAsSource(api, 'intake-stg-day-before', STG_FEED)
    walk.push(["(3) St George's day-before List", badge()])
    runAsSource(api, 'intake-sx-cancels', SX_FEED)
    walk.push(['(4) Southern Cross cancels', badge()])
    runAsSource(api, 'intake-scanned-pdf', MAILBOX_ACTOR.who, 'scan')
    walk.push(['(5) a scan', badge()])
    runAsSource(api, 'intake-scanned-pdf', MAILBOX_ACTOR.who, 'unreadable')
    walk.push(['(5) a page that cannot be read', badge()])
    runAsSource(api, 'intake-feed-fails', SX_FEED)
    walk.push(['(6) a feed message fails', badge()])
    expect(walk).toEqual([
      // The seed's rooms PDF List and its row waiting for an NHI.
      ['start', 2],
      // Okafor's New List, and Sione Faleolo waiting for his NHI.
      ['(1) Rooms email a List', 4],
      // Its three rows with an NHI placed: the List leaves; Sione Faleolo still waits.
      ["the office places Okafor's List", 3],
      // The Update (his still-open row is not sent twice).
      ['(2) Rooms re-send it', 4],
      // Okafor's List from the hospital, and two Lists that match exactly.
      ["(3) St George's day-before List", 7],
      ['(4) Southern Cross cancels', 8],
      ['(5) a scan', 9],
      ['(5) a page that cannot be read', 10],
      ['(6) a feed message fails', 11],
    ])
  })
})
