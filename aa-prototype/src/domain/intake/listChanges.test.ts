import { describe, expect, it } from 'vitest'
import type { ImportRow, IncomingBookingFields } from '../types'
import type { MatchingView } from './matching'
import { arrivalItems, type ArrivalExtras, type ArrivalIntake } from './arrivals'
import { listChangeSummary } from './listChanges'

const STG = 'H-STG'
const HALE = { name: 'Mr T. Hale', hpiId: '40HALT' }

function view(rows: readonly ImportRow[]): MatchingView {
  return {
    bookings: {
      B1: { id: 'B1', listId: 'L1', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' }, scheduledTime: '08:30', cancelled: false, procedures: [] },
      B2: { id: 'B2', listId: 'L1', patient: { name: 'Tom Reid', nhi: 'ZAA0067' }, scheduledTime: '10:00', cancelled: false, procedures: [] },
      B3: { id: 'B3', listId: 'L1', patient: { name: 'Kim Wu', nhi: 'ZAE0310' }, scheduledTime: '11:00', cancelled: false, procedures: [] },
    },
    lists: { L1: { id: 'L1', hospitalId: STG, surgeonId: 'S-HALE', dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE', anaesthetistId: 'A1', slotId: 'SL1' } },
    openSlots: [],
    surgeons: { 'S-HALE': { id: 'S-HALE', ...HALE } },
    hospitals: { [STG]: { id: STG, name: "St George's" } },
    anaesthetists: {},
    parties: {},
    rows,
  }
}

const f = (over: Partial<IncomingBookingFields> & { patient: IncomingBookingFields['patient'] }): IncomingBookingFields => ({
  hospitalId: STG,
  dateISO: '2026-12-01',
  session: 'AM',
  surgeon: HALE,
  hospitalStatus: 'booked',
  ...over,
})

const row = (id: string, incoming: IncomingBookingFields, over: Partial<ImportRow> = {}): ImportRow => ({
  id,
  batchId: 'IB1',
  channel: 'pdfList',
  source: 'rooms',
  receivedAtISO: '2026-11-24T09:00:00',
  incoming,
  status: 'open',
  ...over,
})

const EXTRAS: ArrivalExtras = { dataQualityNhis: new Set(), anaesthetists: {} }

function fixture() {
  const rows = [
    row('r-new', f({ scheduledTime: '12:00', patient: { name: 'Jo Bloggs', nhi: 'ZAD2210', ethnicityCode: 'abc' }, procedure: { text: 'Hernia' } })),
    row('r-time', f({ scheduledTime: '09:00', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' } })),
    row('r-same', f({ scheduledTime: '10:00', patient: { name: 'Tom Reid', nhi: 'ZAA0067' } })),
    row('r-wait', f({ patient: { name: 'Mere Tipene' } })),
    row('r-rem', f({ scheduledTime: '11:00', patient: { name: 'Kim Wu', nhi: 'ZAE0310' }, hospitalStatus: 'cancelled' }), { removalOfBookingId: 'B3' }),
  ]
  const intake: ArrivalIntake = {
    batches: { IB1: { id: 'IB1', channel: 'pdfList', source: 'rooms', hospitalId: STG, label: 'PDF', arrivalSource: { kind: 'mailbox', senderEmail: 'pa@x.example' }, receivedAtISO: '2026-11-24T09:00:00', rowIds: rows.map((r) => r.id) } },
    rows: Object.fromEntries(rows.map((r) => [r.id, r])),
    pdfLists: {},
  }
  return { v: view(rows), intake, ids: rows.map((r) => r.id) }
}

describe('listChangeSummary', () => {
  it('orders rows by time then name, each with its change, Booking, differences and flags', () => {
    const { v, intake, ids } = fixture()
    const { rows, counts } = listChangeSummary(v, intake, ids, EXTRAS)
    expect(rows.map((r) => [r.rowId, r.change, r.bookingId])).toEqual([
      ['r-time', 'changed', 'B1'],
      ['r-same', 'unchanged', 'B2'],
      ['r-rem', 'removed', 'B3'],
      ['r-new', 'added', undefined],
      ['r-wait', 'waiting', undefined],
    ])
    expect(rows[0]!.diffs.map((d) => [d.key, d.current, d.incoming])).toEqual([['time', '08:30', '09:00']])
    expect(rows.find((r) => r.rowId === 'r-new')).toMatchObject({ patientName: 'Jo Bloggs', nhi: 'ZAD2210', procedureText: 'Hernia', flags: ['dataQuality'] })
    expect(rows.find((r) => r.rowId === 'r-wait')!.flags).toEqual(['needsNhi'])
    expect(rows.find((r) => r.rowId === 'r-rem')!.flags).toEqual(['removals'])
    expect(counts).toEqual({ added: 1, changed: 1, cancelled: 0, unchanged: 1, removed: 1, waitingNhi: 1 })
  })

  it('agrees with the feed item counts (one source of truth)', () => {
    const { v, intake, ids } = fixture()
    const item = arrivalItems(v, intake, EXTRAS).find((i) => i.kind !== 'needsNhi')!
    const { counts } = listChangeSummary(v, intake, ids, EXTRAS)
    const { rows: _r, open: _o, ...itemCounts } = item.counts
    expect(itemCounts).toEqual(counts)
  })

  it('reads a decided row from its decision, its Booking included', () => {
    const { v, intake, ids } = fixture()
    const r = intake.rows['r-new']!
    const decided = { ...intake, rows: { ...intake.rows, 'r-new': { ...r, status: 'applied' as const, decision: { kind: 'createBooking' as const, listId: 'L1', bookingId: 'B9' } } } }
    const out = listChangeSummary(v, decided, ids, EXTRAS).rows.find((x) => x.rowId === 'r-new')!
    expect(out).toMatchObject({ change: 'added', status: 'applied', bookingId: 'B9' })
  })
})
