/**
 * `Booking.source` (DM-39; catch-up Phase 15): optional and display-only.
 * Each creation path that knows its source stamps it, the scenario seed stamps
 * every Booking it builds by a deterministic rule, and the generated history
 * Bookings stay unset.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { createBooking } from './bookingActions'
import { decideImportRow, importHospitalDownload } from './matchingActions'
import type { Actor } from './mutate'
import { ANAE, HOSP, SEED_LIST_IDS, SEED_MARKERS, buildSeed } from '../domain/seed'
import type { BookingSource } from '../domain/types'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
/** The four live sources: Copy (US-02.4.3, Retired) and photo (US-02.4.4, Future Work) left in Phase 15b. */
const SOURCES: readonly BookingSource[] = ['hospitalDownload', 'surgeonPdf', 'admin', 'anaesthetistAdHoc']

function store(): BoundAppStore {
  return createAppStore()
}

describe('creation paths stamp their source', () => {
  it('createBooking stores a given source and records it in the create audit', () => {
    const api = store()
    const outcome = createBooking(api, SOUTER, SEED_LIST_IDS.souterPm21, {
      patient: { name: 'Ad Hoc Patient', dobISO: '1990-05-05' },
      sourceText: { text: 'Diagnostic laparoscopy', source: 'anaesthetist' },
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
      sourceText: { text: 'Diagnostic laparoscopy', source: 'anaesthetist' },
    })
    if (!outcome.ok) throw new Error(outcome.message)
    expect(api.getState().schedule.bookings[outcome.value.bookingId]).not.toHaveProperty('source')
  })

  it('a Booking created from a hospital row on the matching screen stamps hospitalDownload (catch-up Phase 33)', () => {
    const api = store()
    const imported = importHospitalDownload(api, OFFICE, 'SAMPLE_FORTE_SHEET')
    if (!imported.ok) throw new Error(imported.message)
    const r1 = api.getState().intake.batches[imported.value.batchId!]!.rowIds[0]!
    const res = decideImportRow(api, OFFICE, r1, { kind: 'createBooking', listId: 'L-29104-2026-07-28-AM' })
    if (!res.ok) throw new Error(res.message)
    // A keyed sheet is the hospital pathway too: its channel lives on the row and the text's source.
    expect(api.getState().schedule.bookings[res.value.bookingId ?? '']?.source).toBe('hospitalDownload')
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
      const list = seed.schedule.lists[b.listId]
      const hospitalId = list?.hospitalId
      // A request the office logged as a Draft List (catch-up Phase 31) is an office entry, wherever it is.
      const expected: BookingSource =
        list?.state === 'DRAFT'
          ? 'admin'
          : b.correlationRef !== undefined || hospitalId === HOSP.stg || hospitalId === HOSP.sx || hospitalId === HOSP.cph
          ? 'hospitalDownload'
          : hospitalId === HOSP.forte || hospitalId === HOSP.ces
            ? 'surgeonPdf'
            : 'admin'
      expect(b.source, b.id).toBe(expected)
    }
    // A seeded Forte scenario Booking reads Surgeon PDF (the S3 split Booking).
    expect(seed.schedule.bookings[SEED_MARKERS['splitBillingBooking']!.entityId]?.source).toBe('surgeonPdf')
  })

  it('carries nothing of Copy a Booking: no copiedFromBookingId, no removed source, no booking.copy audit (Phase 15b)', () => {
    for (const b of all) {
      expect(b, b.id).not.toHaveProperty('copiedFromBookingId')
      if (b.source !== undefined) expect(SOURCES, b.id).toContain(b.source)
    }
    expect(seed.audit.filter((a) => a.action === 'booking.copy')).toEqual([])
    expect(seed.audit.filter((a) => JSON.stringify(a.after ?? {}).includes('copiedFromBookingId'))).toEqual([])
  })

  it('stays deterministic: two builds deep-equal', () => {
    expect(buildSeed()).toEqual(buildSeed())
  })
})
