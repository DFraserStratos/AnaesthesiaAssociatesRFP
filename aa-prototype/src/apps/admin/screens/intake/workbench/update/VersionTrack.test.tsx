/**
 * The version track (build plan Phase 69, Work item 3) on the Okafor story, in the real store: the rooms email his
 * List, the office places it in Dr Rutherford's Wed 25 Nov PM session, the rooms re-send it (its removal left out),
 * then St George's sends the day-before List as an Update. The track reads the rooms' PDF first (once, though it
 * both made the List and arrived), the re-send, then St George's as the proposed version, "now".
 */

import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { OKAFOR_STORY, OKAFOR_STORY_LIST } from '../../../../../../domain/intake/hospitalDownloads'
import type { ListVersion } from '../../../../../../domain/intake/listVersions'
import { SURG } from '../../../../../../domain/seed/cast'
import { slotIdFor } from '../../../../../../domain/slots'
import { OFFICE_ACTOR, freshAppState, receiveHospitalBatch, receiveMailboxPdf, stgDayBeforeRows, useAppStore } from '../../../../../../store'
import { decideArrivingLists } from '../../../../../../store/intakeDecide'
import { arrivalItemsOf } from '../../../../../../store/intakeSelectors'
import { versionStops } from './updateReads'
import { VersionTrack } from './VersionTrack'

const S = OKAFOR_STORY

function ok<T>(out: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!out.ok) throw new Error(out.message)
  return out.value
}

/** The story up to St George's Update; returns the held List and the Update on the bench. */
function stgUpdate(): { listId: string; arrival: ArrivalItem } {
  const api = useAppStore
  const first = ok(receiveMailboxPdf(api, S.roomsList))
  const rows = api.getState().intake.rows
  const placeable = first.rowIds.filter((id) => rows[id]!.incoming.patient.nhi !== undefined)
  const slotId = slotIdFor(OKAFOR_STORY_LIST.anaesthetistId, OKAFOR_STORY_LIST.dateISO, OKAFOR_STORY_LIST.session)
  const listId = ok(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: placeable.map((rowId) => ({ rowId, kind: 'place' as const })), placement: { kind: 'slot', slotId, surgeonId: SURG.okafor } }])).placedListIds[0]!
  const resend = ok(receiveMailboxPdf(api, S.roomsResend))
  ok(decideArrivingLists(api, OFFICE_ACTOR, [{ rows: [...resend.rowIds, ...resend.removalRowIds].map((rowId) => ({ rowId, kind: 'leaveOut' as const })) }]))
  const stg = ok(receiveHospitalBatch(api, S.stgDayBefore.hospitalId, S.stgDayBefore.label, stgDayBeforeRows(api.getState()), { sampleId: S.stgDayBefore.id }))
  const arrival = arrivalItemsOf(api.getState()).find((i) => i.batchId === stg.batchId && i.heldListId === listId)!
  expect(arrival.kind).toBe('update')
  return { listId, arrival }
}

const stops = () => Array.from(document.querySelectorAll<HTMLElement>('[data-shot="intake-version-track"] li[data-version-kind]'))

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('VersionTrack', () => {
  it("shows the rooms' PDF first, the re-send, then St George's Update proposed, now", () => {
    const { listId, arrival } = stgUpdate()
    render(<VersionTrack arrival={arrival} listId={listId} />)
    const track = document.querySelector('[data-shot="intake-version-track"]')!
    expect(track).toHaveTextContent('This List so far')
    const all = stops()
    expect(all.map((s) => s.getAttribute('data-version-kind'))).toEqual(['origin', 'arrival', 'proposed'])
    expect(all[0]!.querySelector('[data-source-kind]')).toHaveAttribute('data-source-kind', 'rooms')
    expect(all[0]).toHaveTextContent('Rooms PDF24 Nov')
    expect(all[1]).toHaveTextContent('Rooms PDFre-sent24 Nov')
    expect(all[1]).toHaveAttribute('data-current', 'true')
    expect(all.map((s) => s.getAttribute('data-proposed'))).toEqual(['false', 'false', 'true'])
    const proposed = all[2]!
    expect(proposed.querySelector('[data-source-kind]')).toHaveAttribute('data-source-kind', 'hospital')
    expect(proposed).toHaveTextContent("St George's")
    expect(proposed).toHaveTextContent('now')
    expect(track.textContent ?? '').not.toMatch(/[–—]|\bslot\b/i)
  })

  it('draws nothing for an arrival with no held List', () => {
    const first = ok(receiveMailboxPdf(useAppStore, S.roomsList))
    const arrival = arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === first.batchId && i.kind === 'newList')!
    const { container } = render(<VersionTrack arrival={arrival} listId={arrival.heldListId} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('versionStops', () => {
  const v = (over: Partial<ListVersion>): ListVersion => ({ atISO: '2026-10-28T09:00:00', kind: 'arrival', source: 'rooms', label: 'x', rowIds: [], counts: { added: 0, changed: 0, cancelled: 0, removed: 0, unchanged: 0 }, current: false, ...over })
  const hospitals = { 'H-STG': { id: 'H-STG', name: "St George's" } }
  const batches = {
    B1: { arrivalSource: { kind: 'mailbox' as const, senderEmail: 'pa@rooms.example' }, pdfListId: 'P1' },
    B2: { arrivalSource: { kind: 'hospitalFeed' as const, hospitalId: 'H-STG' } },
  }
  const list = { origin: { kind: 'pdf' as const, senderEmail: 'pa@rooms.example', pdfListId: 'P1' } }

  it('a decided arrival marks the version it made, current, and appends nothing', () => {
    const versions = [v({ kind: 'origin' }), v({ batchId: 'B1', counts: { added: 3, changed: 0, cancelled: 0, removed: 0, unchanged: 0 } }), v({ batchId: 'B2', atISO: '2026-11-24T06:10:00', current: true })]
    const out = versionStops(versions, { batchId: 'B2', decided: true, receivedAtISO: '2026-11-24T06:10:00', source: { kind: 'hospital', hospitalId: 'H-STG', label: "St George's" } }, list, batches, hospitals)
    expect(out.map((s) => [s.kind, s.proposed, s.pending, s.current])).toEqual([
      ['origin', false, false, false],
      ['arrival', true, false, true],
    ])
  })

  it('a List made by hand keeps its origin, in the office words, and the waiting arrival is appended', () => {
    const out = versionStops([v({ kind: 'origin', label: 'Made by hand', current: true })], { batchId: 'B2', decided: false, receivedAtISO: '2026-11-24T06:10:00', source: { kind: 'hospital', hospitalId: 'H-STG', label: "St George's" } }, { origin: { kind: 'manual' } }, batches, hospitals)
    expect(out.map((s) => s.source.kind === 'office' ? s.source.label : s.source.mark.label)).toEqual(['Made by hand', "St George's"])
    expect(out[1]).toMatchObject({ kind: 'proposed', proposed: true, pending: true, current: false })
  })
})
