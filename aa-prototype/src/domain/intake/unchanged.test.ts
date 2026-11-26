import { describe, expect, it } from 'vitest'
import type { ImportBatch, ImportRow, IncomingBookingFields } from '../types'
import type { MatchingView } from './matching'
import { arrivalItems, type ArrivalIntake } from './arrivals'
import { identicalReArrival, incomingFieldsKey, isUnchangedList, unchangedLists } from './unchanged'

const STG = 'H-STG'
const HALE = { name: 'Mr T. Hale', hpiId: '40HALT' }
const SARAH: IncomingBookingFields = { hospitalId: STG, dateISO: '2026-12-01', session: 'AM', surgeon: HALE, scheduledTime: '08:30', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' }, hospitalStatus: 'booked' }

const v: MatchingView = {
  bookings: { B1: { id: 'B1', listId: 'L1', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' }, scheduledTime: '08:30', cancelled: false, procedures: [] } },
  lists: { L1: { id: 'L1', hospitalId: STG, surgeonId: 'S-HALE', dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE' } },
  openSlots: [],
  surgeons: { 'S-HALE': { id: 'S-HALE', ...HALE } },
  hospitals: { [STG]: { id: STG, name: "St George's" } },
  anaesthetists: {},
  parties: {},
  rows: [],
}

const batch = (id: string, receivedAtISO: string, rowIds: string[]): ImportBatch => ({
  id,
  channel: 'download',
  source: 'hospital',
  hospitalId: STG,
  label: id,
  arrivalSource: { kind: 'hospitalFeed', hospitalId: STG },
  receivedAtISO,
  rowIds,
})

function twoArrivals(earlier: Partial<ImportRow>, laterFields: IncomingBookingFields = SARAH): ArrivalIntake {
  const first: ImportRow = { id: 'r1', batchId: 'IB1', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-23T09:00:00', incoming: SARAH, status: 'open', ...earlier }
  const second: ImportRow = { id: 'r2', batchId: 'IB2', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T09:00:00', incoming: laterFields, status: 'open' }
  return {
    batches: { IB1: batch('IB1', first.receivedAtISO, ['r1']), IB2: batch('IB2', second.receivedAtISO, ['r2']) },
    rows: { r1: first, r2: second },
    pdfLists: {},
  }
}

const items = (intake: ArrivalIntake) => arrivalItems({ ...v, rows: Object.values(intake.rows) }, intake, { dataQualityNhis: new Set(), anaesthetists: {} })

describe('unchanged Lists (DM-21)', () => {
  it('keys a row by its content as sent, whatever the key order', () => {
    const a = incomingFieldsKey(SARAH)
    const b = incomingFieldsKey({ patient: { nhi: 'CQY9304', name: 'Sarah Mitchell' }, hospitalStatus: 'booked', scheduledTime: '08:30', surgeon: { hpiId: '40HALT', name: 'Mr T. Hale' }, session: 'AM', dateISO: '2026-12-01', hospitalId: STG })
    expect(a).toBe(b)
    expect(incomingFieldsKey({ ...SARAH, scheduledTime: '08:31' })).not.toBe(a)
  })

  it('shows an identical re-arrival of a decided List as an unchanged List waiting for a confirm, never skipped', () => {
    const intake = twoArrivals({ status: 'applied', decision: { kind: 'match', bookingId: 'B1', changeType: 'noChange', fieldsApplied: [], listId: 'L1' } })
    const all = items(intake)
    const later = all.find((i) => i.batchId === 'IB2')!
    expect(isUnchangedList(later)).toBe(true)
    expect(identicalReArrival(intake, later)).toBe(true)
    expect(unchangedLists(all).map((i) => i.batchId)).toEqual(['IB2'])
  })

  it('is not a re-arrival while the earlier row is open, or when the content differs', () => {
    const open = twoArrivals({})
    expect(identicalReArrival(open, items(open).find((i) => i.batchId === 'IB2')!)).toBe(false)
    const changed = twoArrivals({ status: 'applied', decision: { kind: 'match', bookingId: 'B1', changeType: 'noChange', fieldsApplied: [] } }, { ...SARAH, scheduledTime: '09:00' })
    const later = items(changed).find((i) => i.batchId === 'IB2')!
    expect(identicalReArrival(changed, later)).toBe(false)
    expect(later.kind).toBe('update')
  })
})
