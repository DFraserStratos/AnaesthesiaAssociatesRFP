/**
 * The inbox's query over the seeded arrivals (27 Nov 2026 rebuild): Show, kind, source, the surgery window, Needs a
 * look and the search each narrow; the orders hold on real data; the default grouping leads with tomorrow.
 */

import { describe, expect, it } from 'vitest'
import { DEFAULT_INBOX_QUERY, groupBySurgeryDay, inboxItems, needsText, type InboxQuery } from '../../../../../domain/intake/inbox'
import { freshAppState } from '../../../../../store'
import { arrivalItemsOf } from '../../../../../store/intakeSelectors'

const state = freshAppState()
const TODAY = state.clock.todayISO
const ALL = arrivalItemsOf(state)
const run = (patch: Partial<InboxQuery> = {}) => inboxItems(ALL, { ...DEFAULT_INBOX_QUERY, ...patch }, TODAY, state.intake)

describe('matching', () => {
  it('Show splits the arrivals: To decide has none decided, Decided has only decided, Waiting for an NHI only NHI rows', () => {
    expect(run().length).toBeGreaterThan(0)
    expect(run().every((i) => !i.decided)).toBe(true)
    expect(run({ show: 'decided' }).every((i) => i.decided)).toBe(true)
    expect(run({ show: 'needsNhi' }).every((i) => i.kind === 'needsNhi')).toBe(true)
  })

  it('kind, source, the surgery window and Needs a look each narrow', () => {
    expect(run({ kind: 'newList' }).every((i) => i.kind === 'newList')).toBe(true)
    expect(run({ source: 'rooms' }).length).toBeGreaterThan(0)
    expect(run({ source: 'rooms' }).every((i) => i.source.kind === 'rooms')).toBe(true)
    const tomorrow = run({ surgery: 'tomorrow' })
    expect(tomorrow.length).toBeGreaterThan(0)
    expect(tomorrow.every((i) => i.dateISO === '2026-11-25')).toBe(true)
    const look = run({ look: true })
    expect(look.length).toBeLessThan(run().length)
    expect(look.every((i) => needsText(i) !== undefined)).toBe(true)
  })

  it('the search reads the title and the rows', () => {
    const doyle = run({ q: 'doyle' })
    expect(doyle.length).toBeGreaterThan(0)
    expect(doyle.every((i) => i.title.toLowerCase().includes('doyle'))).toBe(true)
    expect(run({ q: 'zzz no such thing' })).toEqual([])
  })
})

describe('sorting', () => {
  it('by surgery, soonest first, with the undated last either way', () => {
    for (const dir of ['asc', 'desc'] as const) {
      const rows = run({ sort: { key: 'surgery', dir } })
      const dated = rows.filter((i) => i.dateISO !== undefined).map((i) => i.dateISO!)
      expect(rows.slice(dated.length).every((i) => i.dateISO === undefined)).toBe(true)
      expect(dated).toEqual([...dated].sort((a, b) => (dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a))))
    }
  })

  it('by received, and by patients', () => {
    const received = run({ sort: { key: 'received', dir: 'desc' } }).map((i) => i.receivedAtISO)
    expect(received).toEqual([...received].sort().reverse())
    const patients = run({ sort: { key: 'patients', dir: 'asc' } }).map((i) => i.counts.rows)
    expect(patients).toEqual([...patients].sort((a, b) => a - b))
  })
})

describe('grouping', () => {
  it('one group per date of surgery, tomorrow first by default, Date not read last', () => {
    const groups = groupBySurgeryDay(run(), TODAY)
    expect(groups[0]!.label).toBe('Tomorrow, Wednesday 25 November')
    expect(groups[groups.length - 1]!.label).toBe('Date not read')
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(run().length)
    expect(new Set(groups.map((g) => g.key)).size).toBe(groups.length)
  })
})
