/**
 * The memoised indexes (catch-up Phase 43): each returns what the plain scan it
 * replaced returned, in the same order, and is rebuilt when its map is replaced.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState } from './appStore'
import { auditNewestFirst, bookingsByList, invoicesByBooking, listsByAnaesthetist, listsByDate, pairByInvoice, pairsByBooking, proceduresByBooking } from './indexes'
import { bookingsForList, invoicesForList, proceduresForBooking } from './selectors'
import { pairsForBooking, pairsForList } from './ledgerSelectors'
import { isBookingPair } from '../domain/billing/ledger'
import { createBooking } from './bookingActions'
import { RVG_GROUP, SEED_MARKERS } from '../domain/seed'

const s = freshAppState()
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)

describe('indexes equal the plain scans', () => {
  it('Bookings by List, Procedures by Booking, invoices and pairs', () => {
    for (const listId of Object.keys(s.schedule.lists)) {
      const plain = Object.values(s.schedule.bookings).filter((b) => b.listId === listId).sort(byId)
      expect(bookingsForList(s, listId)).toEqual(plain)
      const ids = new Set(plain.map((b) => b.id))
      expect(invoicesForList(s, listId)).toEqual(Object.values(s.billing.invoices).filter((i) => ids.has(i.bookingId)).sort(byId))
      expect(pairsForList(s, listId)).toEqual(Object.values(s.billing.ledger).filter((p) => isBookingPair(p) && ids.has(p.bookingId)).sort(byId))
    }
    for (const bookingId of Object.keys(s.schedule.bookings)) {
      expect(proceduresForBooking(s, bookingId)).toEqual(Object.values(s.schedule.procedures).filter((p) => p.bookingId === bookingId).sort(byId))
      expect(pairsForBooking(s, bookingId)).toEqual(Object.values(s.billing.ledger).filter((p) => isBookingPair(p) && p.bookingId === bookingId).sort(byId))
    }
    for (const i of Object.values(s.billing.invoices)) {
      expect(pairByInvoice(s.billing.ledger).get(i.id)).toEqual(Object.values(s.billing.ledger).find((p) => 'invoiceId' in p && p.invoiceId === i.id))
    }
  })

  it('Lists by date and anaesthetist, invoices by Booking, the audit newest first', () => {
    const lists = Object.values(s.schedule.lists)
    expect([...listsByDate(s.schedule.lists).values()].flat().length).toBe(lists.length)
    for (const l of lists.slice(0, 50)) {
      expect(listsByDate(s.schedule.lists).get(l.dateISO)).toContain(l)
      if (l.anaesthetistId !== undefined) expect(listsByAnaesthetist(s.schedule.lists).get(l.anaesthetistId)).toContain(l)
    }
    expect([...invoicesByBooking(s.billing.invoices).values()].flat().length).toBe(Object.keys(s.billing.invoices).length)
    const { sorted, entityTypes } = auditNewestFirst(s.audit)
    expect(sorted).toHaveLength(s.audit.length)
    for (let i = 1; i < sorted.length; i++) expect(sorted[i - 1]!.atISO >= sorted[i]!.atISO).toBe(true)
    expect(entityTypes).toEqual([...new Set(s.audit.map((a) => a.entityType))].sort())
  })

  it('is rebuilt after a mutation replaces the map, and never serves a stale row', () => {
    const api = createAppStore()
    const listId = SEED_MARKERS['designDayPmList']!.entityId
    const before = api.getState().schedule.bookings
    const indexBefore = bookingsByList(before)
    const count = (indexBefore.get(listId) ?? []).length
    const out = createBooking(api, { who: 'Kirsty W.', role: 'office', source: 'office' }, listId, {
      patient: { name: 'Index Check', dobISO: '1980-05-06', nhi: 'ZZZ0016' },
      sourceText: { text: 'Cystoscopy', source: 'phone' },
      rvgGroupId: RVG_GROUP.a3!,
    })
    expect(out.ok).toBe(true)
    const after = api.getState().schedule.bookings
    expect(after).not.toBe(before)
    expect(bookingsForList(api.getState(), listId)).toHaveLength(count + 1)
    expect(bookingsByList(before).get(listId) ?? []).toHaveLength(count)
    if (out.ok) expect(proceduresByBooking(api.getState().schedule.procedures).get(out.value.bookingId)).toHaveLength(1)
    expect(pairsByBooking(api.getState().billing.ledger)).toBe(pairsByBooking(api.getState().billing.ledger))
  })
})
