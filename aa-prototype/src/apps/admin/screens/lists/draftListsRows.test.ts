/**
 * Lists › Draft Lists' view model (US-01.6.2 "Search and filters", "Sorting", "Filtered"): the search
 * over surgeon, hospital and note; When (from today, next two weeks, include past) with a count of
 * the past ones it hides; hospital and why; one group per day with today's labelled; the why text.
 */

import { describe, expect, it } from 'vitest'
import { freshAppState, waitingDraftLists } from '../../../../store'
import type { DraftList, List } from '../../../../domain/types'
import {
  DRAFT_LISTS_PAGE_SIZE,
  dayGroupLabel,
  draftOriginText,
  fortnightEndISO,
  groupByDay,
  historyDraftRows,
  hospitalOptions,
  inWhen,
  parseView,
  parseWhen,
  parseWhy,
  waitingDraftRows,
} from './draftListsRows'

const state = freshAppState()
const TODAY = state.clock.todayISO
const masters = state.masters
const waiting = waitingDraftLists(state)
const ALL = { q: '', hospitalId: 'all', why: 'all' as const, when: 'upcoming' as const }

/** A copy of a seeded Draft List with some fields changed (never the record itself). */
function copy(l: DraftList, patch: Partial<DraftList>): DraftList {
  return { ...l, ...patch }
}

describe('draftListsRows', () => {
  it('pages at the other sections\' 50', () => {
    expect(DRAFT_LISTS_PAGE_SIZE).toBe(50)
  })

  it('parses the URL values, falling back to the defaults', () => {
    expect(parseView('history')).toBe('history')
    expect(parseView('nope')).toBe('waiting')
    expect(parseWhen('fortnight')).toBe('fortnight')
    expect(parseWhen('all')).toBe('all')
    expect(parseWhen('')).toBe('upcoming')
    expect(parseWhy('recurringClash')).toBe('recurringClash')
    expect(parseWhy('conflict')).toBe('all')
  })

  it('keeps every waiting Draft List from today on by default, in the given (soonest first) order', () => {
    expect(waiting.length).toBeGreaterThan(5)
    const { rows, pastHidden } = waitingDraftRows(waiting, ALL, TODAY, masters)
    expect(rows.map((l) => l.id)).toEqual(waiting.filter((l) => l.dateISO >= TODAY).map((l) => l.id))
    expect(pastHidden).toBe(0)
  })

  it('When: past Draft Lists only with Include past, counted while hidden; Next 2 weeks stops 13 days on', () => {
    const past = copy(waiting[0]!, { id: 'LD-PAST', dateISO: '2026-11-20' })
    const far = copy(waiting[0]!, { id: 'LD-FAR', dateISO: '2026-12-20' })
    const all = [past, ...waiting, far]
    const upcoming = waitingDraftRows(all, ALL, TODAY, masters)
    expect(upcoming.rows.map((l) => l.id)).not.toContain('LD-PAST')
    expect(upcoming.rows.map((l) => l.id)).toContain('LD-FAR')
    expect(upcoming.pastHidden).toBe(1)
    const fortnight = waitingDraftRows(all, { ...ALL, when: 'fortnight' }, TODAY, masters)
    expect(fortnight.rows.map((l) => l.id)).not.toContain('LD-FAR')
    expect(fortnight.rows.every((l) => l.dateISO >= TODAY && l.dateISO <= fortnightEndISO(TODAY))).toBe(true)
    expect(fortnightEndISO('2026-11-24')).toBe('2026-12-07')
    const everything = waitingDraftRows(all, { ...ALL, when: 'all' }, TODAY, masters)
    expect(everything.rows[0]!.id).toBe('LD-PAST')
    expect(everything.pastHidden).toBe(0)
    expect(inWhen('2026-11-23', 'upcoming', TODAY)).toBe(false)
    expect(inWhen('2026-11-24', 'fortnight', TODAY)).toBe(true)
  })

  it('Filtered: given Draft Lists at two hospitals, filtering by one shows only that hospital\'s', () => {
    const hospitals = new Set(waiting.map((l) => l.hospitalId))
    expect(hospitals.size).toBeGreaterThan(1)
    const one = waiting[0]!.hospitalId
    const { rows } = waitingDraftRows(waiting, { ...ALL, hospitalId: one }, TODAY, masters)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((l) => l.hospitalId === one)).toBe(true)
    expect(rows.length).toBe(waiting.filter((l) => l.hospitalId === one && l.dateISO >= TODAY).length)
  })

  it('Why filters by the origin', () => {
    const { rows } = waitingDraftRows(waiting, { ...ALL, why: 'request' }, TODAY, masters)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((l) => l.draft.origin === 'request')).toBe(true)
  })

  it('searches the surgeon, the hospital and the note, ignoring case', () => {
    const withNote = waiting.find((l) => (l.notes ?? '') !== '')!
    const word = withNote.notes!.split(' ').find((w) => w.length > 4)!.toUpperCase()
    expect(waitingDraftRows(waiting, { ...ALL, q: word }, TODAY, masters).rows.map((l) => l.id)).toContain(withNote.id)
    const l = waiting[0]!
    const surgeon = masters.surgeons[l.surgeonId]!.name
    expect(waitingDraftRows(waiting, { ...ALL, q: surgeon.toLowerCase() }, TODAY, masters).rows.every((r) => r.surgeonId === l.surgeonId || (r.notes ?? '').toLowerCase().includes(surgeon.toLowerCase()))).toBe(true)
    const hospital = masters.hospitals[l.hospitalId]!.name
    expect(waitingDraftRows(waiting, { ...ALL, q: ` ${hospital} ` }, TODAY, masters).rows.map((r) => r.id)).toContain(l.id)
    expect(waitingDraftRows(waiting, { ...ALL, q: 'zzz no such thing' }, TODAY, masters).rows).toEqual([])
  })

  it('History takes the search, hospital and why filters, never When', () => {
    const done = [copy(waiting[0]!, { id: 'LD-OLD', dateISO: '2026-10-01', removedAtISO: '2026-10-02T09:00:00' })] as List[]
    expect(historyDraftRows(done, ALL, masters).map((l) => l.id)).toEqual(['LD-OLD'])
    expect(historyDraftRows(done, { ...ALL, why: 'hospitalRow' }, masters)).toEqual([])
  })

  it('Sorting: one group per day in the rows\' order, today\'s labelled as today, past days marked', () => {
    const past = copy(waiting[0]!, { id: 'LD-PAST', dateISO: '2026-11-20' })
    const groups = groupByDay([past, ...waiting], TODAY)
    expect(groups.map((g) => g.dateISO)).toEqual([...new Set(['2026-11-20', ...waiting.map((l) => l.dateISO)])])
    expect(groups.flatMap((g) => g.lists.map((l) => l.id))).toEqual(['LD-PAST', ...waiting.map((l) => l.id)])
    expect(groups[0]!.past).toBe(true)
    expect(groups.find((g) => g.dateISO === TODAY)?.label).toBe('Today, Tue 24 Nov')
    expect(dayGroupLabel('2026-11-25', TODAY)).toBe('Wed 25 Nov')
  })

  it('why it has no anaesthetist: the origin with its detail', () => {
    const request = waiting.find((l) => l.draft.origin === 'request' && l.draft.source === 'phone')!
    expect(draftOriginText(request, masters.anaesthetists)).toBe('Request · Phone')
    const clash = waiting.find((l) => l.draft.origin === 'recurringClash' && l.draft.fromAnaesthetistId !== undefined)!
    expect(draftOriginText(clash, masters.anaesthetists)).toMatch(/^Recurring booking · Dr \S.* unavailable$/)
    const returned = waiting.find((l) => l.draft.origin === 'unavailableReturn')!
    expect(draftOriginText(returned, masters.anaesthetists)).toMatch(/^Returned: anaesthetist unavailable · Dr /)
    const moved = copy(returned, { draft: { ...returned.draft, origin: 'movedToOffice' } })
    expect(draftOriginText(moved, masters.anaesthetists)).toMatch(/^Moved to the office · Dr /)
    const row = copy(returned, { draft: { origin: 'hospitalRow', sinceISO: returned.draft.sinceISO, by: 'x' } })
    expect(draftOriginText(row, masters.anaesthetists)).toBe('Hospital row')
    expect(draftOriginText({}, masters.anaesthetists)).toBe('')
  })

  it('the Hospital choices are the view\'s hospitals by name, plus a known chosen one', () => {
    const opts = hospitalOptions(waiting, masters.hospitals, 'all')
    expect(opts.map((o) => o.value).sort()).toEqual([...new Set(waiting.map((l) => l.hospitalId))].sort())
    expect(opts.map((o) => o.label)).toEqual([...opts.map((o) => o.label)].sort((a, b) => a.localeCompare(b)))
    const other = Object.keys(masters.hospitals).find((id) => !waiting.some((l) => l.hospitalId === id))!
    expect(hospitalOptions(waiting, masters.hospitals, other).map((o) => o.value)).toContain(other)
    expect(hospitalOptions(waiting, masters.hospitals, 'H-NOPE').map((o) => o.value)).not.toContain('H-NOPE')
  })
})
