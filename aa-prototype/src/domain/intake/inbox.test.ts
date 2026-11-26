/**
 * The Arrivals inbox's pure parts (27 Nov 2026 rebuild): the orders (undated last whichever way), the day grouping,
 * and the words each column shows. The query over the seeded arrivals is `apps/.../intake/inbox/inboxQuery.test.ts`.
 */

import { describe, expect, it } from 'vitest'
import type { ArrivalItem } from './arrivals'
import {
  DEFAULT_INBOX_QUERY,
  arrivalFromText,
  emptyInboxText,
  groupBySurgeryDay,
  inboxCountText,
  inboxListText,
  inboxPosition,
  inboxReceivedText,
  inboxSurgeryText,
  needsText,
  nextInboxSort,
  surgeryDayLabel,
} from './inbox'

const TODAY = '2026-11-24'

function item(patch: Partial<ArrivalItem>): ArrivalItem {
  return {
    key: 'k',
    kind: 'newList',
    batchId: 'b',
    rowIds: [],
    openRowIds: [],
    hospitalId: 'H',
    source: { kind: 'hospital', hospitalId: 'H', label: 'Hospital' },
    receivedAtISO: `${TODAY}T06:00:00`,
    title: "Mr Okafor · St George's · Wed 25 Nov AM",
    counts: { rows: 0, open: 0, added: 0, changed: 0, cancelled: 0, removed: 0, unchanged: 0, waitingNhi: 0 },
    flags: {},
    decided: false,
    ...patch,
  } as ArrivalItem
}

describe('grouping', () => {
  it('one group per run of a date, undated last under Date not read', () => {
    const rows = [item({ key: 'a', dateISO: '2026-11-25' }), item({ key: 'b', dateISO: '2026-11-25' }), item({ key: 'c', dateISO: '2026-11-27' }), item({ key: 'd' })]
    const groups = groupBySurgeryDay(rows, TODAY)
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['Tomorrow, Wednesday 25 November', 2],
      ['Friday 27 November', 1],
      ['Date not read', 1],
    ])
  })

  it('a header click flips its own column, and starts a new one ascending (Received newest first)', () => {
    expect(nextInboxSort({ key: 'surgery', dir: 'asc' }, 'surgery')).toEqual({ key: 'surgery', dir: 'desc' })
    expect(nextInboxSort({ key: 'surgery', dir: 'asc' }, 'kind')).toEqual({ key: 'kind', dir: 'asc' })
    expect(nextInboxSort({ key: 'kind', dir: 'asc' }, 'received')).toEqual({ key: 'received', dir: 'desc' })
  })

  it('labels today, tomorrow and other days', () => {
    expect(surgeryDayLabel('2026-11-24', '2026-11-24')).toBe('Today, Tuesday 24 November')
    expect(surgeryDayLabel('2026-11-26', '2026-11-24')).toBe('Thursday 26 November')
    expect(surgeryDayLabel(undefined, '2026-11-24')).toBe('Date not read')
  })

  it('positions an item among its neighbours', () => {
    expect(inboxPosition(['a', 'b', 'c'], 'b')).toEqual({ index: 1, previous: 'a', next: 'c' })
    expect(inboxPosition(['a', 'b'], 'x')).toEqual({ index: -1, next: 'a' })
  })
})

describe('words', () => {
  it('Needs: blank when nothing does, else the flags in a few words', () => {
    expect(needsText(item({}))).toBeUndefined()
    expect(needsText(item({ flags: { needsNhi: 1, toCheck: 3 } }))).toBe('NHI for 1 patient, 3 values to check')
    expect(needsText(item({ flags: { removals: 1 } }))).toBe('1 removal to confirm')
    expect(needsText(item({ kind: 'unreadable' }))).toBe('Read it by hand')
    expect(needsText(item({ flags: { needsNhi: 1 }, decided: true }))).toBeUndefined()
  })

  it('Surgery, List and Received cells', () => {
    expect(inboxSurgeryText({ dateISO: '2026-11-25', session: 'AM' })).toBe('Wed 25 Nov AM')
    expect(inboxSurgeryText({ dateISO: '2026-11-25', session: 'PM' }, true)).toBe('PM')
    expect(inboxSurgeryText({})).toBe('Not read')
    expect(inboxListText(item({ dateISO: '2026-11-25' }))).toBe("Mr Okafor · St George's")
    expect(inboxListText(item({ kind: 'unreadable', title: 'Scan_0655.pdf' }))).toBe('Scan_0655.pdf')
    expect(inboxReceivedText('2026-11-24T05:40:00', '2026-11-24')).toBe('Today 05:40')
    expect(inboxReceivedText('2026-11-23T08:50:00', '2026-11-24')).toBe('Mon 08:50')
    expect(inboxReceivedText('2026-11-10T08:50:00', '2026-11-24')).toBe('10 Nov 08:50')
  })

  it('From: the hospital, else the rooms mailbox', () => {
    const intake = { batches: {}, pdfLists: {} } as never
    expect(arrivalFromText(item({}), intake)).toBe('Hospital')
    expect(arrivalFromText(item({ source: { kind: 'rooms', label: 'Rooms' } }), intake)).toBe('Rooms mailbox')
    expect(arrivalFromText(item({ source: { kind: 'rooms', label: 'Rooms', byHand: true } }), intake)).toBe('Added by hand')
  })

  it('the count and the empty inbox', () => {
    expect(inboxCountText(18, 'toDecide')).toBe('18 to decide')
    expect(inboxCountText(6, 'decided')).toBe('6 decided')
    expect(emptyInboxText(DEFAULT_INBOX_QUERY)).toBe('Nothing to decide.')
    expect(emptyInboxText({ ...DEFAULT_INBOX_QUERY, q: ' tan ' })).toBe('No arrivals match "tan".')
    expect(emptyInboxText({ ...DEFAULT_INBOX_QUERY, look: true })).toBe('No arrivals match these filters.')
  })
})
