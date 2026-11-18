/** Catch-up Phase 33a: the pure stub rules (US-02.6.1, US-02.6.2, DM-58). */
import { describe, expect, it } from 'vitest'
import type { ImportRow, Stub } from '../types'
import { STUB_READINGS, listStubNote, stubFor, stubsOnList, withStubsInTimeOrder } from './stubs'

const row = (over: Partial<ImportRow['incoming']> = {}, corrections?: ImportRow['corrections']): Pick<ImportRow, 'id' | 'incoming' | 'corrections'> => ({
  id: 'IR0009',
  incoming: {
    hospitalId: 'H-SX',
    dateISO: '2026-07-28',
    session: 'PM',
    scheduledTime: '15:30',
    patient: { name: 'Tama Henare' },
    procedure: { text: 'T&A', code: 'H2' },
    hospitalStatus: 'booked',
    ...over,
  },
  ...(corrections !== undefined ? { corrections } : {}),
})

const AT = '2026-07-21T09:00:00'

describe('stubFor (US-02.6.1)', () => {
  it('places a stub for a row with no NHI and a List to land on, keyed on the row, never the NHI', () => {
    const s = stubFor(row(), { id: 'L1', state: 'ACTIVE' }, 'Southern Cross theatre list', AT)
    expect(s).toEqual({
      listId: 'L1',
      importRowId: 'IR0009',
      reason: 'noNhi',
      asReceived: { patientName: 'Tama Henare', procedureText: 'T&A', scheduledTime: '15:30', hospitalId: 'H-SX', sourceLabel: 'Southern Cross theatre list' },
      createdAtISO: AT,
      status: 'standing',
    })
  })
  it('places none when the row has an NHI (sent or corrected), no List, an authorised List, or is a cancellation', () => {
    expect(stubFor(row({ patient: { name: 'X', nhi: 'ZQA1024' } }), { id: 'L1', state: 'ACTIVE' }, 'f', AT)).toBeUndefined()
    expect(stubFor(row({}, { nhi: 'ZQA1024' }), { id: 'L1', state: 'ACTIVE' }, 'f', AT)).toBeUndefined()
    expect(stubFor(row(), undefined, 'f', AT)).toBeUndefined()
    expect(stubFor(row(), { id: 'L1', state: 'AUTHORISED' }, 'f', AT)).toBeUndefined()
    expect(stubFor(row({ hospitalStatus: 'cancelled' }), { id: 'L1', state: 'ACTIVE' }, 'f', AT)).toBeUndefined()
  })
  it('stands on a submitted List and on a Draft List', () => {
    expect(stubFor(row(), { id: 'L1', state: 'SUBMITTED' }, 'f', AT)?.listId).toBe('L1')
    expect(stubFor(row(), { id: 'D1', state: 'DRAFT' }, 'f', AT)?.listId).toBe('D1')
  })
  it('keeps blank wording out of what it shows', () => {
    expect(stubFor(row({ procedure: { text: '   ' } }), { id: 'L1', state: 'ACTIVE' }, 'f', AT)?.asReceived.procedureText).toBeUndefined()
  })
})

const stub = (id: string, listId: string, time: string | undefined, status: Stub['status'] = 'standing'): Stub => ({
  id,
  listId,
  importRowId: `R-${id}`,
  reason: 'noNhi',
  asReceived: { patientName: id, hospitalId: 'H', sourceLabel: 'f', ...(time !== undefined ? { scheduledTime: time } : {}) },
  createdAtISO: AT,
  status,
})

describe('stubsOnList and the time order', () => {
  it('lists only standing stubs on that List, by time (untimed last)', () => {
    const all = { a: stub('a', 'L1', undefined), b: stub('b', 'L1', '14:00'), c: stub('c', 'L1', '09:00', 'resolved'), d: stub('d', 'L2', '08:00') }
    expect(stubsOnList(all, 'L1').map((s) => s.id)).toEqual(['b', 'a'])
  })
  it('slots a stub in among Bookings by time, after a Booking at the same time; Bookings keep their order', () => {
    const bookings = [{ t: '13:00' }, { t: '14:00' }, { t: undefined }, { t: '16:00' }]
    const out = withStubsInTimeOrder(bookings, (b) => b.t, [stub('s', 'L', '14:00'), stub('u', 'L', undefined)])
    expect(out.map((e) => (e.kind === 'stub' ? e.stub.id : e.booking.t ?? '-'))).toEqual(['13:00', '14:00', 's', '-', '16:00', 'u'])
  })
})

describe('labels', () => {
  it('says how many wait at intake', () => {
    expect(listStubNote(0)).toBe('')
    expect(listStubNote(1)).toBe('1 waiting at intake')
    expect(listStubNote(2)).toBe('2 waiting at intake')
  })
  it('labels the readings once, with no en or em dash and never "stub Booking"', () => {
    expect(STUB_READINGS.length).toBe(7)
    for (const r of STUB_READINGS) {
      expect(r).not.toMatch(/[–—]/)
      expect(r.toLowerCase()).not.toContain('stub booking')
    }
  })
})
