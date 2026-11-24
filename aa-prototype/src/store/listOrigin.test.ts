/**
 * Catch-up Phase 34: where a List came from (US-02.2.4, DM-70). The pure
 * helper's build choices, and the store's creation paths each stamping it.
 */
import { describe, expect, it } from 'vitest'
import { listOriginText, listSenderEmail, originAfterRoomsRow, originForNewList } from '../domain/lists/listOrigin'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { assignListToSlot } from './slotActions'
import { assignDraftList, createDraftList, redateDraftList } from './draftListActions'
import { HOSP, SURG } from '../domain/seed/cast'

describe('originForNewList: one helper, one rule per cause', () => {
  it('the office and a request entered by hand hold no sender; a PDF request with its address records it', () => {
    expect(originForNewList({ kind: 'office' })).toEqual({ kind: 'manual' })
    expect(originForNewList({ kind: 'request', source: 'phone' })).toEqual({ kind: 'manual' })
    expect(originForNewList({ kind: 'request', source: 'pdf', senderEmail: '  ' })).toEqual({ kind: 'manual' })
    expect(originForNewList({ kind: 'request', source: 'pdf', senderEmail: ' pa@rooms.example ' })).toEqual({ kind: 'pdf', senderEmail: 'pa@rooms.example' })
  })

  it('a row gives the rooms\' PDF with its sender, or the hospital\'s list with no sender', () => {
    expect(originForNewList({ kind: 'importRow', source: 'rooms', hospitalId: 'H-1', senderEmail: 'pa@rooms.example', pdfListId: 'PDL0002' })).toEqual({ kind: 'pdf', senderEmail: 'pa@rooms.example', pdfListId: 'PDL0002' })
    expect(originForNewList({ kind: 'importRow', source: 'hospital', hospitalId: 'H-1' })).toEqual({ kind: 'hospital', hospitalId: 'H-1' })
  })

  it('a recurring booking records recurring; a List made from another keeps that one\'s origin', () => {
    expect(originForNewList({ kind: 'recurring' })).toEqual({ kind: 'recurring' })
    const from = { origin: { kind: 'pdf' as const, senderEmail: 'pa@rooms.example' } }
    expect(originForNewList({ kind: 'derived', from })).toEqual(from.origin)
  })
})

describe('the later-address rule', () => {
  const pdf = { kind: 'pdf' as const, senderEmail: 'pa@rooms.example' }
  it('a later PDF from another address replaces the sender; the same address (any case) changes nothing', () => {
    expect(originAfterRoomsRow(pdf, 'inbox@rooms.example', 'PDL0003')).toEqual({ kind: 'pdf', senderEmail: 'inbox@rooms.example', pdfListId: 'PDL0003' })
    expect(originAfterRoomsRow(pdf, 'PA@rooms.example', 'PDL0003')).toBeUndefined()
  })
  it('a row from an earlier PDF never puts the older address back (review fix)', () => {
    const at: Record<string, string> = { PDL0001: '2026-11-24T07:10', PDL0003: '2026-11-24T09:00' }
    const fromLater = { kind: 'pdf' as const, senderEmail: 'inbox@rooms.example', pdfListId: 'PDL0003' }
    expect(originAfterRoomsRow(fromLater, 'pa@rooms.example', 'PDL0001', (id) => at[id])).toBeUndefined()
    const fromEarlier = { kind: 'pdf' as const, senderEmail: 'pa@rooms.example', pdfListId: 'PDL0001' }
    expect(originAfterRoomsRow(fromEarlier, 'inbox@rooms.example', 'PDL0003', (id) => at[id])).toEqual(fromLater)
  })
  it('a hospital, by-hand or recurring List never takes a sender', () => {
    for (const o of [{ kind: 'hospital' as const, hospitalId: 'H-1' }, { kind: 'manual' as const }, { kind: 'recurring' as const }]) {
      expect(originAfterRoomsRow(o, 'pa@rooms.example', 'PDL0003')).toBeUndefined()
      expect(listSenderEmail({ origin: o })).toBeUndefined()
    }
  })
  it('reads in words', () => {
    const name = () => "St George's"
    expect(listOriginText(pdf, name)).toBe("From a rooms' PDF · sent from pa@rooms.example")
    expect(listOriginText({ kind: 'hospital', hospitalId: 'H-STG' }, name)).toBe("From the hospital's list · St George's")
    expect(listOriginText({ kind: 'manual' }, name)).toBe('Entered by hand')
    expect(listOriginText({ kind: 'recurring' }, name)).toBe('From a recurring booking')
  })
})

describe('every store creation path stamps the origin', () => {
  it('the office\'s List in a session is entered by hand, with no sender', () => {
    const api = createAppStore()
    const out = assignListToSlot(api, OFFICE_ACTOR, 'S-45178-2026-12-09-AM', { hospitalId: HOSP.stg, surgeonId: SURG.tan, kind: 'private' })
    if (!out.ok) throw new Error(out.message)
    expect(api.getState().schedule.lists[out.value.listId]!.origin).toEqual({ kind: 'manual' })
  })

  it('a Draft List request from a PDF records its "Sent from" address, kept after a re-date and after assignment', () => {
    const api = createAppStore()
    expect(createDraftList(api, OFFICE_ACTOR, { hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: '2026-12-09', session: 'PM', source: 'pdf', senderEmail: 'nope' })).toMatchObject({ ok: false, code: 'invalidEmail' })
    const made = createDraftList(api, OFFICE_ACTOR, { hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: '2026-12-08', session: 'PM', source: 'pdf', senderEmail: 'pa@papanui.example' })
    if (!made.ok) throw new Error(made.message)
    const id = made.value.listId
    expect(api.getState().schedule.lists[id]!.origin).toEqual({ kind: 'pdf', senderEmail: 'pa@papanui.example' })
    expect(redateDraftList(api, OFFICE_ACTOR, id, { dateISO: '2026-12-09', session: 'PM' }).ok).toBe(true)
    const assigned = assignDraftList(api, OFFICE_ACTOR, id, { anaesthetistId: '45178' })
    if (!assigned.ok) throw new Error(assigned.message)
    const list = api.getState().schedule.lists[id]!
    expect(list.state).toBe('ACTIVE')
    expect(list.origin).toEqual({ kind: 'pdf', senderEmail: 'pa@papanui.example' })
  })

  it('a phone request is entered by hand', () => {
    const api = createAppStore()
    const made = createDraftList(api, OFFICE_ACTOR, { hospitalId: HOSP.stg, surgeonId: SURG.tan, dateISO: '2026-12-09', session: 'PM', source: 'phone' })
    if (!made.ok) throw new Error(made.message)
    expect(api.getState().schedule.lists[made.value.listId]!.origin).toEqual({ kind: 'manual' })
  })

  it('every seeded List holds an origin', () => {
    const lists = Object.values(createAppStore().getState().schedule.lists)
    expect(lists.every((l) => l.origin !== undefined)).toBe(true)
  })
})
