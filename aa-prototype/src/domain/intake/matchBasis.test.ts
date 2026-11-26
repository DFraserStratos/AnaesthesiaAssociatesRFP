import { describe, expect, it } from 'vitest'
import type { ImportRow, IncomingBookingFields } from '../types'
import type { MatchingView } from './matching'
import { arrivalItems, type ArrivalIntake } from './arrivals'
import { matchBasisFor } from './matchBasis'

const STG = 'H-STG'
const HALE = { name: 'Mr T. Hale', hpiId: '40HALT' }

const f = (over: Partial<IncomingBookingFields> & { patient: IncomingBookingFields['patient'] }): IncomingBookingFields => ({
  hospitalId: STG,
  dateISO: '2026-12-01',
  session: 'AM',
  surgeon: HALE,
  hospitalStatus: 'booked',
  ...over,
})

function setup(rows: ImportRow[]) {
  const v: MatchingView = {
    bookings: {
      B1: { id: 'B1', listId: 'L1', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' }, cancelled: false, procedures: [] },
      B2: { id: 'B2', listId: 'L1', patient: { name: 'Tom Reid', nhi: 'ZAA0067' }, cancelled: true, procedures: [] },
    },
    lists: { L1: { id: 'L1', hospitalId: STG, surgeonId: 'S-HALE', dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE' } },
    openSlots: [],
    surgeons: { 'S-HALE': { id: 'S-HALE', ...HALE }, 'S-OKAFOR': { id: 'S-OKAFOR', name: 'Mr C. Okafor' } },
    hospitals: { [STG]: { id: STG, name: "St George's" } },
    anaesthetists: {},
    parties: {},
    rows,
  }
  const intake: ArrivalIntake = {
    batches: { IB1: { id: 'IB1', channel: 'download', source: 'hospital', hospitalId: STG, label: 'File', arrivalSource: { kind: 'hospitalFeed', hospitalId: STG }, receivedAtISO: '2026-11-24T09:00:00', rowIds: rows.map((r) => r.id) } },
    rows: Object.fromEntries(rows.map((r) => [r.id, r])),
    pdfLists: {},
  }
  return { v, intake, items: arrivalItems(v, intake, { dataQualityNhis: new Set(), anaesthetists: {} }) }
}

const row = (id: string, incoming: IncomingBookingFields): ImportRow => ({ id, batchId: 'IB1', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T09:00:00', incoming, status: 'open' })

describe('matchBasisFor', () => {
  it('ticks each key the held List agrees on and counts patients found by NHI, never a score', () => {
    const { v, intake, items } = setup([
      row('r1', f({ patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' } })),
      row('r2', f({ patient: { name: 'Tom Reid', nhi: 'ZAA0067' } })),
      row('r3', f({ patient: { name: 'Jo Bloggs', nhi: 'ZAD2210' } })),
      row('r4', f({ patient: { name: 'No Nhi' } })),
    ])
    const item = items.find((i) => i.kind !== 'needsNhi')!
    const basis = matchBasisFor(v, intake, item)!
    expect(basis.keys).toEqual([
      { key: 'surgeon', label: 'Surgeon', agreed: true },
      { key: 'hospital', label: 'Hospital', agreed: true },
      { key: 'day', label: 'Day', agreed: true },
      { key: 'session', label: 'Session', agreed: true },
    ])
    // B2 is cancelled, so only Sarah Mitchell is found; the row with no NHI is not counted.
    expect(basis.patientsByNhi).toEqual({ found: 1, of: 3 })
    expect(Object.keys(basis)).not.toContain('score')
  })

  it('leaves the surgeon unticked when the arrival names another surgeon on the same List', () => {
    const { v, intake, items } = setup([row('r1', f({ surgeon: { name: 'Mr C. Okafor' }, patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' } }))])
    // The row's NHI is on L1, the matcher's own match, though its surgeon differs.
    const basis = matchBasisFor(v, intake, { ...items[0]!, heldListId: 'L1' })!
    expect(basis.keys.find((k) => k.key === 'surgeon')!.agreed).toBe(false)
    expect(basis.keys.filter((k) => k.agreed).map((k) => k.key)).toEqual(['hospital', 'day', 'session'])
  })

  it('is undefined for a new List', () => {
    const { v, intake, items } = setup([row('r1', f({ dateISO: '2026-12-09', patient: { name: 'Jo Bloggs', nhi: 'ZAD2210' } }))])
    expect(items[0]!.kind).toBe('newList')
    expect(matchBasisFor(v, intake, items[0]!)).toBeUndefined()
  })
})
