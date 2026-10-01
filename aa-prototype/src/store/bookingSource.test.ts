/**
 * `Booking.source` (DM-39; catch-up Phase 15): optional and display-only.
 * Each creation path that knows its source stamps it, the scenario seed stamps
 * every Booking it builds by a deterministic rule, and the generated history
 * Bookings stay unset.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { addPostOpAddendum, copyBooking, createBooking } from './bookingActions'
import { authoriseList, submitList } from './lifecycle'
import { ingestPdfRow, processMessage } from './integrationActions'
import { bookingsForList } from './selectors'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS, SEED_MARKERS, buildSeed, listIdForSlot } from '../domain/seed'
import { SURGEON_PDFS } from '../domain/integrations/pdfSamples'
import type { BookingSource } from '../domain/types'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOURCES: readonly BookingSource[] = ['hospitalDownload', 'surgeonPdf', 'admin', 'anaesthetistAdHoc', 'anaesthetistPhoto', 'copy']

function store(): BoundAppStore {
  return createAppStore()
}

function newest(api: BoundAppStore, listId: string) {
  return bookingsForList(api.getState(), listId).sort((a, b) => a.id.localeCompare(b.id)).at(-1)
}

describe('creation paths stamp their source', () => {
  it('createBooking stores a given source and records it in the create audit', () => {
    const api = store()
    const outcome = createBooking(api, SOUTER, SEED_LIST_IDS.souterPm21, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      operation: 'Diagnostic laparoscopy',
      billingRoute: 'hospital',
      source: 'anaesthetistAdHoc',
    })
    if (!outcome.ok) throw new Error(outcome.message)
    expect(api.getState().schedule.bookings[outcome.value.bookingId]?.source).toBe('anaesthetistAdHoc')
    const create = api.getState().audit.find((a) => a.entityId === outcome.value.bookingId && a.action === 'booking.create')
    expect(create?.after).toMatchObject({ source: 'anaesthetistAdHoc' })
  })

  it('createBooking without a source leaves it unset', () => {
    const api = store()
    const outcome = createBooking(api, SOUTER, SEED_LIST_IDS.souterPm21, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      operation: 'Diagnostic laparoscopy',
      billingRoute: 'hospital',
    })
    if (!outcome.ok) throw new Error(outcome.message)
    expect(api.getState().schedule.bookings[outcome.value.bookingId]).not.toHaveProperty('source')
  })

  it('a hospital message create stamps hospitalDownload (interim until Phase 33)', () => {
    const api = store()
    const res = processMessage(api, 'MSG-STG-1001')
    if (!res.ok) throw new Error(res.message)
    expect(api.getState().schedule.bookings[res.value.bookingId ?? '']?.source).toBe('hospitalDownload')
  })

  it('a surgeon PDF row create stamps surgeonPdf', () => {
    const api = store()
    const pdf = SURGEON_PDFS[0]!
    const row = pdf.rows.find((r) => r.id === 'R2')!
    const listId = listIdForSlot(pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)
    const created = ingestPdfRow(api, OFFICE, listId, row)
    if (!created.ok) throw new Error(created.message)
    expect(api.getState().schedule.bookings[created.value.bookingId]?.source).toBe('surgeonPdf')
  })

  it('Copy stamps copy', () => {
    const api = store()
    const outcome = copyBooking(api, SOUTER, SEED_MARKERS['pendingCaptureBooking']!.entityId)
    if (!outcome.ok) throw new Error(outcome.message)
    expect(api.getState().schedule.bookings[outcome.value.bookingId]?.source).toBe('copy')
  })

  it('the post-op addendum follows the actor: admin for the office (interim until Phase 39)', () => {
    const api = store()
    const tue14 = listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')
    const original = bookingsForList(api.getState(), tue14)[0]!.id
    expect(submitList(api, OFFICE, tue14).ok).toBe(true)
    expect(authoriseList(api, OFFICE, tue14).ok).toBe(true)
    const added = addPostOpAddendum(api, OFFICE, original)
    if (!added.ok) throw new Error(added.message)
    expect(api.getState().schedule.bookings[added.value.bookingId]?.source).toBe('admin')
    expect(newest(api, added.value.listId)?.id).toBe(added.value.bookingId)
  })
})

describe('the post-op addendum, anaesthetist actor', () => {
  it('stamps anaesthetistAdHoc when the anaesthetist adds it', () => {
    const api = store()
    const tue14 = listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')
    const original = bookingsForList(api.getState(), tue14)[0]!.id
    expect(submitList(api, OFFICE, tue14).ok).toBe(true)
    expect(authoriseList(api, OFFICE, tue14).ok).toBe(true)
    const sharma: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
    const added = addPostOpAddendum(api, sharma, original)
    if (!added.ok) throw new Error(added.message)
    expect(api.getState().schedule.bookings[added.value.bookingId]?.source).toBe('anaesthetistAdHoc')
  })
})

describe('the seed source rule', () => {
  const seed = buildSeed()
  const all = Object.values(seed.schedule.bookings)
  const scenario = all.filter((b) => !b.id.startsWith('HBK'))
  const history = all.filter((b) => b.id.startsWith('HBK'))

  it('every scenario Booking has a valid source; the history Bookings have none', () => {
    expect(scenario.length).toBeGreaterThan(100)
    for (const b of scenario) expect(SOURCES).toContain(b.source)
    expect(history.length).toBeGreaterThan(0)
    for (const b of history) expect(b).not.toHaveProperty('source')
  })

  it('follows the rule: feed or correlation is hospitalDownload, Forte and CES are surgeonPdf, else admin', () => {
    for (const b of scenario) {
      const hospitalId = seed.schedule.lists[b.listId]?.hospitalId
      const expected: BookingSource =
        b.correlationRef !== undefined || hospitalId === HOSP.stg || hospitalId === HOSP.sx || hospitalId === HOSP.cph
          ? 'hospitalDownload'
          : hospitalId === HOSP.forte || hospitalId === HOSP.ces
            ? 'surgeonPdf'
            : 'admin'
      expect(b.source, b.id).toBe(expected)
    }
    // A seeded Forte scenario Booking reads Surgeon PDF (the S3 split Booking).
    expect(seed.schedule.bookings[SEED_MARKERS['splitBillingBooking']!.entityId]?.source).toBe('surgeonPdf')
  })

  it('stays deterministic: two builds deep-equal', () => {
    expect(buildSeed()).toEqual(buildSeed())
  })
})
