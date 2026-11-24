/**
 * The shared notification pool's pure parts (catch-up Phase 32; FT-13.8,
 * US-13.8.1, US-13.8.2): the one sentence, newest-first paging, the rule.
 */

import { describe, expect, it } from 'vitest'
import { activeCount, isActive, MOVED_TO_ME_DAYS, NOTIFICATION_POOL_RULE, notificationText, pageOf } from './notifications'
import { surnameCommaInitial } from './names'
import type { Anaesthetist, Hospital, Notification, Surgeon } from './types'

const masters = {
  anaesthetists: {
    A1: { registrationNumber: 'A1', name: 'Dr Rachel Hughes' } as Anaesthetist,
    A2: { registrationNumber: 'A2', name: 'Dr Priya Sharma' } as Anaesthetist,
  },
  hospitals: { 'H-STG': { id: 'H-STG', name: "St George's", locationType: 'hospital' } as Hospital },
  surgeons: { 'S-REID': { id: 'S-REID', name: 'Ms A. Reid' } as Surgeon },
}

function n(extra: Partial<Notification> = {}): Notification {
  return {
    id: 'NT0001',
    atISO: '2026-11-24T09:12:00',
    kind: 'listMoved',
    byActor: 'Dr Rachel Hughes',
    listId: 'L1',
    route: 'colleague',
    cause: 'move',
    fromAnaesthetistId: 'A1',
    toAnaesthetistId: 'A2',
    dateISO: '2026-11-26',
    session: 'AM',
    hospitalId: 'H-STG',
    surgeonId: 'S-REID',
    ...extra,
  }
}

describe('notificationText', () => {
  it('names both anaesthetists on a move to a colleague (US-13.8.2 "Moved to a colleague")', () => {
    expect(notificationText(n(), masters)).toBe("Dr Hughes moved Thu 26 Nov AM (St George's, Ms A. Reid) to Dr Sharma")
  })

  it('says a return went to the office (US-13.8.2 "Returned to the office")', () => {
    expect(notificationText(n({ route: 'office', toAnaesthetistId: undefined }), masters)).toBe(
      "Dr Hughes returned Thu 26 Nov AM (St George's, Ms A. Reid) to the office",
    )
  })

  it('adds the unavailable cause on both routes', () => {
    expect(notificationText(n({ cause: 'unavailable' }), masters)).toMatch(/to Dr Sharma when marking the session not available$/)
    expect(notificationText(n({ route: 'office', cause: 'unavailable', toAnaesthetistId: undefined }), masters)).toMatch(
      /to the office when marking the session not available$/,
    )
  })

  it('uses no dash but the hyphen, never "slot", and nothing about preferences', () => {
    for (const text of [notificationText(n(), masters), notificationText(n({ route: 'office', cause: 'unavailable' }), masters)]) {
      expect(text).not.toMatch(/[–—]/)
      expect(text).not.toMatch(/\bslots?\b/i)
      expect(text).not.toMatch(/prefer|tier|blacklist/i)
    }
  })
})

describe('pageOf', () => {
  const rows = Array.from({ length: 13 }, (_, i) =>
    n({ id: `NT${String(i + 1).padStart(4, '0')}`, atISO: `2026-11-24T09:${String(10 + Math.floor(i / 2)).padStart(2, '0')}:00` }),
  )

  it('orders newest first and breaks a tie by id, descending', () => {
    const page = pageOf(rows, 1, 6)
    expect(page.rows.map((r) => r.id)).toEqual(['NT0013', 'NT0012', 'NT0011', 'NT0010', 'NT0009', 'NT0008'])
  })

  it('pages exactly and clamps the page number', () => {
    expect([1, 2, 3].map((p) => pageOf(rows, p, 6).rows.length)).toEqual([6, 6, 1])
    expect(pageOf(rows, 3, 6)).toMatchObject({ page: 3, pageCount: 3, total: 13 })
    expect(pageOf(rows, 99, 6).page).toBe(3)
    expect(pageOf(rows, 0, 6).page).toBe(1)
    expect(pageOf([], 1, 6)).toEqual({ rows: [], page: 1, pageCount: 1, total: 0 })
  })
})

describe('NOTIFICATION_POOL_RULE (OQ-79 answered, D58; catch-up Phase 32b)', () => {
  it('keeps List moves, the optional single-Booking notice and alerts; a tick resolves a notice; nothing expires', () => {
    expect(NOTIFICATION_POOL_RULE).toEqual({ sources: ['listMoved', 'bookingMoved', 'officeAlert'], expiresAfterDays: null, actionable: true, pageSize: 6 })
    expect(MOVED_TO_ME_DAYS).toBe(7)
  })

  it('a notice is active until it carries resolvedAt; the count is the active ones', () => {
    const active = n()
    const resolved = n({ id: 'NT0002', resolvedAt: '2026-11-24T10:00:00', resolvedBy: 'Kirsty W.' })
    expect(isActive(active)).toBe(true)
    expect(isActive(resolved)).toBe(false)
    expect(activeCount([active, resolved, n({ id: 'NT0003' })])).toBe(2)
  })
})

describe('an alert to the office (catch-up Phase 32b; US-03.6.3)', () => {
  it('reads as one sentence naming who asked and the List, or the Booking; no dash, no slot, never "flag"', () => {
    const { route: _r, cause: _c, toAnaesthetistId: _t, ...base } = n()
    void _r
    void _c
    void _t
    const list: Notification = { ...base, kind: 'officeAlert', message: 'Is the Contract right?' }
    expect(notificationText(list, masters)).toBe("Dr Hughes asked the office to check Thu 26 Nov AM (St George's, Ms A. Reid)")
    const booking: Notification = { ...list, bookingId: 'BK1', patientName: surnameCommaInitial('Hemi Walker') }
    expect(notificationText(booking, masters)).toBe("Dr Hughes asked the office to check a Booking (Walker, H., Thu 26 Nov AM, St George's)")
    for (const t of [notificationText(list, masters), notificationText(booking, masters)]) {
      expect(t).not.toMatch(/[–—]|slot|flag/i)
    }
  })
})

describe('a single Booking moved (catch-up Phase 32a)', () => {
  it('reads as one sentence naming both anaesthetists, the patient, the session and the new List', () => {
    const booking = n({ kind: 'bookingMoved', bookingId: 'BK1', patientName: surnameCommaInitial('Annette Riley') })
    expect(notificationText(booking, masters)).toBe("Dr Hughes moved a Booking (Riley, A., Thu 26 Nov AM, St George's) to Dr Sharma. A new List was created.")
    expect(notificationText({ ...booking, patientName: undefined }, masters)).toBe("Dr Hughes moved a Booking (Thu 26 Nov AM, St George's) to Dr Sharma. A new List was created.")
    expect(notificationText(booking, masters)).not.toMatch(/[–—]|prefer|tier/i)
  })
  it('shortens a patient to surname and initial', () => {
    expect(surnameCommaInitial('Annette Riley')).toBe('Riley, A.')
    expect(surnameCommaInitial('Cher')).toBe('Cher')
  })
})
