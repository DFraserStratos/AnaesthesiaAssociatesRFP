import { describe, expect, it } from 'vitest'
import type { ImportBatch, ImportRow, IncomingBookingFields, PdfReadValue, SurgeonPdfList } from '../types'
import type { MatchingBooking, MatchingView } from './matching'
import {
  arrivalItems,
  arrivingListKey,
  feedFilterCounts,
  feedGroups,
  matchesFeedFilter,
  matchesFeedSearch,
  resolveNamedAnaesthetist,
  rowChangeOf,
  rowWaitsForNhi,
  type ArrivalExtras,
  type ArrivalIntake,
  type ArrivalItem,
} from './arrivals'

const STG = 'H-STG'
const SX = 'H-SX'
const FORTE = 'H-FORTE'
const HALE = { name: 'Mr T. Hale', hpiId: '40HALT' }
const OKAFOR = { name: 'Mr C. Okafor', hpiId: '42OKAC' }
const PATEL = { name: 'Ms K. Patel', hpiId: '41PATK' }

function booking(id: string, listId: string, name: string, nhi: string, scheduledTime: string): MatchingBooking {
  return { id, listId, patient: { name, nhi }, scheduledTime, cancelled: false, procedures: [] }
}

function view(rows: readonly ImportRow[] = []): MatchingView {
  return {
    bookings: {
      B1: booking('B1', 'L-HALE-AM', 'Sarah Mitchell', 'CQY9304', '08:30'),
      B2: booking('B2', 'L-HALE-PM', 'Tom Reid', 'ZAA0067', '13:00'),
      B3: booking('B3', 'L-PATEL', 'Ann Lee', 'ZAC3326', '08:00'),
      B4: booking('B4', 'L-HALE-AM', 'Kim Wu', 'ZAE0310', '09:30'),
    },
    lists: {
      'L-HALE-AM': { id: 'L-HALE-AM', hospitalId: STG, surgeonId: 'S-HALE', dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE', anaesthetistId: '34821', slotId: 'SL-1' },
      'L-HALE-PM': { id: 'L-HALE-PM', hospitalId: STG, surgeonId: 'S-HALE', dateISO: '2026-12-01', session: 'PM', state: 'ACTIVE', anaesthetistId: '34821', slotId: 'SL-2' },
      'L-PATEL': { id: 'L-PATEL', hospitalId: SX, surgeonId: 'S-PATEL', dateISO: '2026-12-02', session: 'AM', state: 'ACTIVE', anaesthetistId: '29104', slotId: 'SL-3' },
    },
    openSlots: [],
    surgeons: {
      'S-HALE': { id: 'S-HALE', ...HALE },
      'S-OKAFOR': { id: 'S-OKAFOR', ...OKAFOR },
      'S-PATEL': { id: 'S-PATEL', ...PATEL },
    },
    hospitals: { [STG]: { id: STG, name: "St George's" }, [SX]: { id: SX, name: 'Southern Cross' }, [FORTE]: { id: FORTE, name: 'Forte Health' } },
    anaesthetists: { '34821': { name: 'Dr Melanie Souter' }, '29104': { name: 'Dr James Rutherford' } },
    parties: {},
    rows,
  }
}

function fields(over: Partial<IncomingBookingFields> & { patient: IncomingBookingFields['patient'] }): IncomingBookingFields {
  return { hospitalId: STG, dateISO: '2026-12-01', session: 'AM', surgeon: HALE, hospitalStatus: 'booked', ...over }
}

function row(id: string, batchId: string, incoming: IncomingBookingFields, over: Partial<ImportRow> = {}): ImportRow {
  return { id, batchId, channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T09:00:00', incoming, status: 'open', ...over }
}

function batch(id: string, receivedAtISO: string, over: Partial<ImportBatch> = {}): ImportBatch {
  return { id, channel: 'download', source: 'hospital', hospitalId: STG, label: `${id} file`, arrivalSource: { kind: 'hospitalFeed', hospitalId: STG }, receivedAtISO, rowIds: [], ...over }
}

const read = (field: PdfReadValue['field'], value: string, confidence: number): PdfReadValue => ({ field, value, confidence, box: { page: 1, x: 0, y: 0, width: 10, height: 2 } })

function pdfList(): SurgeonPdfList {
  return {
    id: 'PDL1',
    sampleId: 'S',
    file: { name: 'okafor.pdf', facsimile: '' },
    surgeonId: 'S-OKAFOR',
    senderEmail: 'pa@okafor.example',
    hospitalId: FORTE,
    subject: 'List',
    receivedAtISO: '2026-11-24T08:00:00',
    receivedBy: 'Mailbox',
    target: { anaesthetistId: '29104', dateISO: '2026-12-03', session: 'AM' },
    status: 'received',
    rows: [
      { id: 'p1', asRead: { name: 'Pat Doe', procedureText: 'Knee' }, corrections: [], read: [read('name', 'Pat Doe', 0.95), read('nhi', 'ZAF4434', 0.5)] },
      { id: 'p2', asRead: { name: 'Lou Ray', procedureText: 'Hip' }, corrections: [], read: [read('name', 'Lou Ray', 0.99)] },
    ],
    headerRead: [read('session', 'AM', 0.6), read('hospital', 'Forte Health', 0.99)],
  }
}

/** Five arrivals: an unreadable PDF, a Southern Cross cancellation, St George's three-List file, a rooms PDF, a held message. */
function base(): { view: MatchingView; intake: ArrivalIntake } {
  const rows: ImportRow[] = [
    row('r1', 'IB-STG', fields({ scheduledTime: '08:30', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' } })),
    row('r2', 'IB-STG', fields({ session: 'PM', scheduledTime: '13:30', patient: { name: 'Tom Reid', nhi: 'ZAA0067' } })),
    row('r3', 'IB-STG', fields({ session: 'PM', scheduledTime: '14:00', patient: { name: 'Mere Tipene', dobISO: '1981-10-18' } })),
    row('r4', 'IB-STG', fields({ surgeon: OKAFOR, anaesthetist: { name: 'Dr Melanie Souter' }, patient: { name: 'Jo Bloggs', nhi: 'ZAD2210' }, procedure: { text: 'Hernia' } })),
    row('r5', 'IB-SX', fields({ hospitalId: SX, dateISO: '2026-12-02', surgeon: PATEL, patient: { name: 'Ann Lee', nhi: 'ZAC3326' }, hospitalStatus: 'cancelled' })),
    row('r6', 'IB-PDF', fields({ hospitalId: FORTE, dateISO: '2026-12-03', surgeon: OKAFOR, patient: { name: 'Pat Doe', nhi: 'ZAF4434' }, procedure: { text: 'Knee' } }), { channel: 'pdfList', source: 'rooms', pdfRowId: 'p1' }),
    row('r7', 'IB-PDF', fields({ hospitalId: FORTE, dateISO: '2026-12-03', surgeon: OKAFOR, patient: { name: 'Lou Ray', nhi: 'ZAG5541', ethnicityCode: '9999' }, procedure: { text: 'Hip' } }), {
      channel: 'pdfList',
      source: 'rooms',
      pdfRowId: 'p2',
    }),
  ]
  const batches: ImportBatch[] = [
    batch('IB-UNREAD', '2026-11-24T11:00:00', { channel: 'pdfList', source: 'rooms', hospitalId: FORTE, arrivalSource: { kind: 'mailbox', senderEmail: 'pa@x.example' }, file: { name: 'scan-page.pdf', facsimile: '' }, unreadableReason: 'The page is blank.' }),
    batch('IB-SX', '2026-11-24T10:00:00', { hospitalId: SX, arrivalSource: { kind: 'hospitalFeed', hospitalId: SX }, rowIds: ['r5'] }),
    batch('IB-STG', '2026-11-24T09:00:00', { rowIds: ['r1', 'r2', 'r3', 'r4'] }),
    batch('IB-PDF', '2026-11-24T08:00:00', { channel: 'pdfList', source: 'rooms', hospitalId: FORTE, arrivalSource: { kind: 'mailbox', senderEmail: 'pa@okafor.example' }, pdfListId: 'PDL1', rowIds: ['r6', 'r7'] }),
    batch('IB-HELD', '2026-11-24T07:00:00', { label: 'Message 4471', heldReason: 'The message could not be read.' }),
  ]
  const intake: ArrivalIntake = {
    batches: Object.fromEntries(batches.map((b) => [b.id, b])),
    rows: Object.fromEntries(rows.map((r) => [r.id, r])),
    pdfLists: { PDL1: pdfList() },
  }
  return { view: view(rows), intake }
}

const EXTRAS: ArrivalExtras = { dataQualityNhis: new Set(), anaesthetists: { '34821': { name: 'Dr Melanie Souter', hpiId: '12SOUM' }, '29104': { name: 'Dr James Rutherford' } } }

function itemsOf(v: MatchingView, intake: ArrivalIntake, extras: ArrivalExtras = EXTRAS): ArrivalItem[] {
  return arrivalItems(v, intake, extras)
}

function by(items: readonly ArrivalItem[], title: string): ArrivalItem {
  const hit = items.find((i) => i.title.startsWith(title))
  if (hit === undefined) throw new Error(`no item ${title}: ${items.map((i) => i.title).join(' | ')}`)
  return hit
}

describe('the key and the waiting test', () => {
  it('keys an arriving List by the arrival and the four keys as sent, never the corrections', () => {
    expect(arrivingListKey('IB1', { hospitalId: STG, dateISO: '2026-12-01', session: 'AM', surgeon: HALE })).toBe('IB1~2026-12-01~AM~H-STG~40HALT')
    expect(arrivingListKey('IB1', { hospitalId: STG, dateISO: '2026-12-01', session: 'AM', surgeon: { name: "Mr T. O'Hale" } })).toBe('IB1~2026-12-01~AM~H-STG~mr-t-o-hale')
    expect(arrivingListKey('IB1', { hospitalId: STG, dateISO: '2026-12-01', session: 'PM' })).toBe('IB1~2026-12-01~PM~H-STG~none')
    const { view: v, intake } = base()
    const before = itemsOf(v, intake).map((i) => i.key)
    const r1 = intake.rows.r1!
    const corrected = { ...intake, rows: { ...intake.rows, r1: { ...r1, corrections: { scheduledTime: '07:45', patientName: 'Sarah J Mitchell', surgeonId: 'S-OKAFOR' } } } }
    expect(itemsOf(v, corrected).map((i) => i.key)).toEqual(before)
  })

  it('waits only for a row with no NHI at all, while open', () => {
    const f = fields({ patient: { name: 'X' } })
    expect(rowWaitsForNhi({ incoming: f, status: 'open' })).toBe(true)
    expect(rowWaitsForNhi({ incoming: fields({ patient: { name: 'X', nhi: 'ABC' } }), status: 'open' })).toBe(false)
    expect(rowWaitsForNhi({ incoming: f, corrections: { nhi: 'ZAF4434' }, status: 'open' })).toBe(false)
    expect(rowWaitsForNhi({ incoming: f, status: 'rejected' })).toBe(false)
  })

  it('reads a decided row from its decision', () => {
    const { view: v, intake } = base()
    const r1 = intake.rows.r1!
    expect(rowChangeOf(v, r1)).toBe('unchanged')
    expect(rowChangeOf(v, { ...r1, status: 'applied', decision: { kind: 'match', bookingId: 'B1', changeType: 'modification', fieldsApplied: ['time'] } })).toBe('changed')
    expect(rowChangeOf(v, { ...r1, status: 'applied', decision: { kind: 'createDraft', listId: 'L9', bookingId: 'B9' } })).toBe('added')
    expect(rowChangeOf(v, { ...r1, removalOfBookingId: 'B1' })).toBe('removed')
  })

  it('resolves the named anaesthetist by HPI CPN, else by name', () => {
    expect(resolveNamedAnaesthetist(EXTRAS.anaesthetists, { anaesthetist: { name: 'Someone', hpiId: '12soum' } })).toBe('34821')
    expect(resolveNamedAnaesthetist(EXTRAS.anaesthetists, { anaesthetist: { name: 'James Rutherford' } })).toBe('29104')
    expect(resolveNamedAnaesthetist(EXTRAS.anaesthetists, { anaesthetist: { name: 'Dr Nobody' } })).toBeUndefined()
  })
})

describe('arrival items', () => {
  it('orders newest arrival first, and an arrival by day, session and surgeon, with a waiting row after its List', () => {
    const { view: v, intake } = base()
    expect(itemsOf(v, intake).map((i) => i.key)).toEqual([
      'IB-UNREAD',
      'IB-SX~2026-12-02~AM~H-SX~41PATK',
      'IB-STG~2026-12-01~AM~H-STG~42OKAC',
      'IB-STG~2026-12-01~AM~H-STG~40HALT',
      'IB-STG~2026-12-01~PM~H-STG~40HALT',
      'nhi~r3',
      'IB-PDF~2026-12-03~AM~H-FORTE~42OKAC',
      'IB-HELD',
    ])
  })

  it('reads each kind: update, new List, cancellation, matches exactly, unreadable, held', () => {
    const { view: v, intake } = base()
    const items = itemsOf(v, intake)
    expect(items.map((i) => [i.key.split('~')[0], i.kind])).toEqual([
      ['IB-UNREAD', 'unreadable'],
      ['IB-SX', 'cancellation'],
      ['IB-STG', 'newList'],
      ['IB-STG', 'matchesExactly'],
      ['IB-STG', 'update'],
      ['nhi', 'needsNhi'],
      ['IB-PDF', 'newList'],
      ['IB-HELD', 'held'],
    ])
    const unreadable = items[0]!
    expect(unreadable).toMatchObject({ title: 'scan-page.pdf', reason: 'The page is blank.', decided: false, source: { kind: 'rooms', label: 'Rooms PDF', senderEmail: 'pa@x.example' } })
    expect(items[7]).toMatchObject({ title: 'Message 4471', reason: 'The message could not be read.', source: { kind: 'hospital', hospitalId: STG, label: "St George's" } })
  })

  it('titles, counts and resolves an arriving List', () => {
    const { view: v, intake } = base()
    const items = itemsOf(v, intake)
    const update = by(items, 'Mr Hale · St George\'s · Tue 1 Dec PM')
    expect(update).toMatchObject({
      heldListId: 'L-HALE-PM',
      surgeonId: 'S-HALE',
      surgeonName: 'Mr T. Hale',
      rowIds: ['r2', 'r3'],
      openRowIds: ['r2', 'r3'],
      counts: { rows: 2, open: 2, changed: 1, waitingNhi: 1, added: 0, unchanged: 0 },
      flags: { needsNhi: 1 },
      decided: false,
    })
    const okafor = by(items, 'Mr Okafor · St George')
    expect(okafor).toMatchObject({ namedAnaesthetistId: '34821', counts: { added: 1 } })
    expect(okafor.heldListId).toBeUndefined()
  })

  it('makes each row waiting for an NHI its own item, and flags its List while undecided', () => {
    const { view: v, intake } = base()
    const waiting = itemsOf(v, intake).find((i) => i.kind === 'needsNhi')!
    expect(waiting).toMatchObject({ key: 'nhi~r3', rowIds: ['r3'], title: "Mere Tipene · St George's · Tue 1 Dec PM", flags: { needsNhi: 1 }, heldListId: 'L-HALE-PM', decided: false })
    const r3 = intake.rows.r3!
    const withNhi = { ...intake, rows: { ...intake.rows, r3: { ...r3, corrections: { nhi: 'ZAH6659' } } } }
    const after = itemsOf(v, withNhi)
    expect(after.some((i) => i.kind === 'needsNhi')).toBe(false)
    expect(by(after, 'Mr Hale · St George\'s · Tue 1 Dec PM').flags.needsNhi).toBeUndefined()
  })

  it('flags values to check on a PDF (its rows and its header) and a bad ethnicity code', () => {
    const { view: v, intake } = base()
    const pdf = by(itemsOf(v, intake), 'Mr Okafor · Forte Health')
    expect(pdf.flags).toEqual({ toCheck: 2, dataQuality: 1 })
    expect(pdf.source).toEqual({ kind: 'rooms', label: 'Rooms PDF', senderEmail: 'pa@okafor.example' })
  })

  it('flags data quality for a patient already flagged, by NHI', () => {
    const { view: v, intake } = base()
    const items = itemsOf(v, intake, { ...EXTRAS, dataQualityNhis: new Set(['ZAA0067']) })
    expect(by(items, 'Mr Hale · St George\'s · Tue 1 Dec PM').flags.dataQuality).toBe(1)
  })

  it('flags open removals; a removal is never a cancellation', () => {
    const { intake } = base()
    const rem = row('rr', 'IB-RE', fields({ scheduledTime: '08:30', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' }, hospitalStatus: 'cancelled' }), { removalOfBookingId: 'B1', channel: 'pdfList', source: 'rooms' })
    const keep = row('rk', 'IB-RE', fields({ scheduledTime: '09:30', patient: { name: 'Kim Wu', nhi: 'ZAE0310' } }), { channel: 'pdfList', source: 'rooms' })
    const next: ArrivalIntake = {
      ...intake,
      batches: { ...intake.batches, 'IB-RE': batch('IB-RE', '2026-11-24T12:00:00', { channel: 'pdfList', source: 'rooms', arrivalSource: { kind: 'byHand', by: 'Kirsty W.', senderEmail: 'pa@hale.example' }, rowIds: ['rr', 'rk'] }) },
      rows: { ...intake.rows, rr: rem, rk: keep },
    }
    const item = itemsOf(view(Object.values(next.rows)), next)[0]!
    expect(item).toMatchObject({ kind: 'update', heldListId: 'L-HALE-AM', counts: { removed: 1, unchanged: 1 }, flags: { removals: 1 }, source: { kind: 'rooms', byHand: true } })
  })

  it('a List whose rows all wait for an NHI is still an item, shown only through its waiting rows', () => {
    const { view: v, intake } = base()
    const r2 = intake.rows.r2!
    const next = { ...intake, rows: { ...intake.rows, r2: { ...r2, status: 'rejected' as const, decision: { kind: 'reject' as const, reason: 'Duplicate' } } } }
    const items = itemsOf(v, next)
    const list = by(items, 'Mr Hale · St George\'s · Tue 1 Dec PM')
    expect(matchesFeedFilter(list, { kind: 'toDecide' })).toBe(false)
    expect(matchesFeedFilter(items.find((i) => i.key === 'nhi~r3')!, { kind: 'toDecide' })).toBe(true)
  })
})

describe('the feed: filters, search and groups', () => {
  it('groups a three-List hospital file under one heading, a PDF alone, and the waiting rows at the foot', () => {
    const { view: v, intake } = base()
    const groups = feedGroups(itemsOf(v, intake), { kind: 'toDecide' }, '', intake)
    expect(groups.map((g) => [g.kind, g.key])).toEqual([
      ['single', 'IB-UNREAD'],
      ['single', 'IB-SX~2026-12-02~AM~H-SX~41PATK'],
      ['file', 'file~IB-STG'],
      ['single', 'IB-PDF~2026-12-03~AM~H-FORTE~42OKAC'],
      ['single', 'IB-HELD'],
      ['waiting', 'waiting'],
    ])
    const file = groups[2]!
    expect(file.items).toHaveLength(3)
    expect(file.heading).toMatchObject({ label: 'IB-STG file', listCount: 3, source: { kind: 'hospital', hospitalId: STG } })
    expect(groups[5]!.items.map((i) => i.key)).toEqual(['nhi~r3'])
  })

  it('Rooms PDFs shows only what came from the rooms', () => {
    const { view: v, intake } = base()
    const groups = feedGroups(itemsOf(v, intake), { kind: 'roomsPdfs' }, '', intake)
    expect(groups.flatMap((g) => g.items.map((i) => i.key))).toEqual(['IB-UNREAD', 'IB-PDF~2026-12-03~AM~H-FORTE~42OKAC'])
    expect(groups.every((g) => g.kind === 'single')).toBe(true)
  })

  it('a hospital filter shows that hospital only', () => {
    const { view: v, intake } = base()
    const keys = feedGroups(itemsOf(v, intake), { kind: 'hospital', hospitalId: SX }, '', intake).flatMap((g) => g.items.map((i) => i.key))
    expect(keys).toEqual(['IB-SX~2026-12-02~AM~H-SX~41PATK'])
  })

  it('Needs NHI shows only the waiting rows, each alone', () => {
    const { view: v, intake } = base()
    const groups = feedGroups(itemsOf(v, intake), { kind: 'needsNhi' }, '', intake)
    expect(groups.map((g) => [g.kind, g.key])).toEqual([['single', 'nhi~r3']])
  })

  it('Decided shows only decided items: a List whose rows are all decided, a dismissed message', () => {
    const { view: v, intake } = base()
    const r4 = intake.rows.r4!
    const next: ArrivalIntake = {
      ...intake,
      batches: { ...intake.batches, 'IB-HELD': { ...intake.batches['IB-HELD']!, dismissed: { by: 'Kirsty W.', atISO: '2026-11-24T12:00:00', reason: 'Resent' } } },
      rows: { ...intake.rows, r4: { ...r4, status: 'applied', decision: { kind: 'createList', slotId: 'SL-9', listId: 'L-NEW', bookingId: 'B-NEW' } } },
    }
    const v2: MatchingView = { ...v, lists: { ...v.lists, 'L-NEW': { id: 'L-NEW', hospitalId: STG, surgeonId: 'S-OKAFOR', dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE' } } }
    const items = itemsOf(v2, next)
    const decided = feedGroups(items, { kind: 'decided' }, '', next).flatMap((g) => g.items)
    expect(decided.map((i) => [i.key, i.kind])).toEqual([
      ['IB-STG~2026-12-01~AM~H-STG~42OKAC', 'newList'],
      ['IB-HELD', 'held'],
    ])
    expect(decided[0]!.heldListId).toBe('L-NEW')
    // The file heading now holds the two Lists still to decide.
    const file = feedGroups(items, { kind: 'toDecide' }, '', next).find((g) => g.kind === 'file')!
    expect(file.heading!.listCount).toBe(2)
  })

  it('searches titles, patients, NHIs and the arrival label in any case', () => {
    const { view: v, intake } = base()
    const items = itemsOf(v, intake)
    const keys = (q: string) => items.filter((i) => matchesFeedSearch(i, q, intake)).map((i) => i.key)
    expect(keys('')).toHaveLength(items.length)
    expect(keys('tom reid')).toEqual(['IB-STG~2026-12-01~PM~H-STG~40HALT'])
    expect(keys('zac3326')).toEqual(['IB-SX~2026-12-02~AM~H-SX~41PATK'])
    expect(keys('MESSAGE 4471')).toEqual(['IB-HELD'])
    expect(keys('okafor')).toEqual(['IB-STG~2026-12-01~AM~H-STG~42OKAC', 'IB-PDF~2026-12-03~AM~H-FORTE~42OKAC'])
  })

  it('counts each filter as it would show', () => {
    const { view: v, intake } = base()
    expect(feedFilterCounts(itemsOf(v, intake))).toEqual({ toDecide: 8, needsNhi: 1, roomsPdfs: 2, decided: 0, byHospital: { [STG]: 4, [SX]: 1 } })
  })
})
