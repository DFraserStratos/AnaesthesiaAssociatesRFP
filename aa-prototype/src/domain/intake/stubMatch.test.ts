import { describe, expect, it } from 'vitest'
import type { ImportRow, IncomingBookingFields, Stub } from '../types'
import type { MatchingView } from './matching'
import { arrivalItems } from './arrivals'
import { stubMatchFor, stubMatchesForItem } from './stubMatch'

const SX = 'H-SX'
const PATEL = { name: 'Ms K. Patel', hpiId: '41PATK' }

const f = (patient: IncomingBookingFields['patient']): IncomingBookingFields => ({ hospitalId: SX, dateISO: '2026-12-08', session: 'PM', surgeon: PATEL, scheduledTime: '14:00', patient, hospitalStatus: 'booked' })

const waitingRow: ImportRow = { id: 'w1', batchId: 'IB1', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T07:30:00', incoming: f({ name: 'Mere Tipene', dobISO: '1981-10-18' }), status: 'open' }
const stub: Stub = {
  id: 'STB1',
  listId: 'L-STUB',
  importRowId: 'w1',
  reason: 'noNhi',
  asReceived: { patientName: 'Mere Tipene', scheduledTime: '14:00', hospitalId: SX, sourceLabel: 'Southern Cross' },
  createdAtISO: '2026-11-24T07:30:00',
  status: 'standing',
}

function setup(arriving: ImportRow) {
  const rows = [waitingRow, arriving]
  const v: MatchingView = {
    bookings: {},
    lists: { 'L-STUB': { id: 'L-STUB', hospitalId: SX, surgeonId: 'S-PATEL', dateISO: '2026-12-08', session: 'PM', state: 'ACTIVE', anaesthetistId: 'A1', slotId: 'SL1' } },
    openSlots: [],
    surgeons: { 'S-PATEL': { id: 'S-PATEL', ...PATEL } },
    hospitals: { [SX]: { id: SX, name: 'Southern Cross' } },
    anaesthetists: {},
    parties: {},
    rows,
  }
  const intake = {
    batches: {
      IB1: { id: 'IB1', channel: 'download' as const, source: 'hospital' as const, hospitalId: SX, label: 'SX', arrivalSource: { kind: 'hospitalFeed' as const, hospitalId: SX }, receivedAtISO: '2026-11-24T07:30:00', rowIds: ['w1'] },
      IB2: { id: 'IB2', channel: 'download' as const, source: 'hospital' as const, hospitalId: SX, label: 'SX 2', arrivalSource: { kind: 'hospitalFeed' as const, hospitalId: SX }, receivedAtISO: '2026-11-24T10:00:00', rowIds: [arriving.id] },
    },
    rows: Object.fromEntries(rows.map((r) => [r.id, r])),
    pdfLists: {},
    stubs: { STB1: stub },
  }
  return { v, intake }
}

const arriving = (patient: IncomingBookingFields['patient']): ImportRow => ({ id: 'a1', batchId: 'IB2', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T10:00:00', incoming: f(patient), status: 'open' })

describe('stubMatchFor', () => {
  it('matches a standing stub on the row\'s List by name and date of birth, carrying the NHI', () => {
    const row = arriving({ name: 'MERE TIPENE', nhi: 'zaf4434', dobISO: '1981-10-18' })
    const { v, intake } = setup(row)
    expect(stubMatchFor(v, intake, row)).toEqual({ stubId: 'STB1', waitingRowId: 'w1', nhi: 'ZAF4434' })
    const item = arrivalItems(v, intake, { dataQualityNhis: new Set(), anaesthetists: {} }).find((i) => i.batchId === 'IB2')!
    expect(stubMatchesForItem(v, intake, item)).toEqual([{ rowId: 'a1', stubId: 'STB1', waitingRowId: 'w1', nhi: 'ZAF4434' }])
  })

  it('needs the same birth date and a valid NHI, and never matches the waiting row itself', () => {
    const otherDob = arriving({ name: 'Mere Tipene', nhi: 'ZAF4434', dobISO: '1981-10-19' })
    expect(stubMatchFor(setup(otherDob).v, setup(otherDob).intake, otherDob)).toBeUndefined()
    const noNhi = arriving({ name: 'Mere Tipene', dobISO: '1981-10-18' })
    expect(stubMatchFor(setup(noNhi).v, setup(noNhi).intake, noNhi)).toBeUndefined()
    const invalid = arriving({ name: 'Mere Tipene', nhi: 'ZAF4435', dobISO: '1981-10-18' })
    expect(stubMatchFor(setup(invalid).v, setup(invalid).intake, invalid)).toBeUndefined()
    const { v, intake } = setup(arriving({ name: 'X', nhi: 'ZAF4434' }))
    expect(stubMatchFor(v, intake, { ...waitingRow, corrections: { nhi: 'ZAF4434' } })).toBeUndefined()
  })

  it('ignores a stub that is no longer standing', () => {
    const row = arriving({ name: 'Mere Tipene', nhi: 'ZAF4434', dobISO: '1981-10-18' })
    const { v, intake } = setup(row)
    expect(stubMatchFor(v, { ...intake, stubs: { STB1: { ...stub, status: 'resolved' } } }, row)).toBeUndefined()
  })
})
