import { describe, expect, it } from 'vitest'
import type { ImportBatch, IntakeSource } from '../types'
import type { ArrivalItem, ArrivalKind } from './arrivals'
import { heldBySource, notConnected, sourceRows, todaysMessages, type SourcesInput } from './sources'

const TODAY = '2026-11-24'

const SOURCES: IntakeSource[] = [
  { id: 'SRC-STG', kind: 'hospitalFeed', name: "St George's", hospitalId: 'H-STG', protocol: 'HL7 v2', state: 'receiving' },
  { id: 'SRC-SX', kind: 'hospitalFeed', name: 'Southern Cross', hospitalId: 'H-SX', protocol: 'FHIR R4', state: 'receiving', lastReceivedAtISO: '2026-11-20T09:00:00' },
  { id: 'SRC-MAILBOX', kind: 'mailbox', name: "Rooms' mailbox", address: 'lists@aa.example', state: 'reading' },
  { id: 'SRC-FORTE', kind: 'hospitalFeed', name: 'Forte Health', hospitalId: 'H-FORTE', state: 'notConnected' },
]

function batch(id: string, at: string, from: ImportBatch['arrivalSource'], extra: Partial<ImportBatch> = {}): ImportBatch {
  return {
    id,
    channel: 'download',
    source: 'hospital',
    hospitalId: from.kind === 'hospitalFeed' ? from.hospitalId : 'H-STG',
    label: `${id} label`,
    arrivalSource: from,
    receivedAtISO: at,
    rowIds: [`${id}-r1`],
    ...extra,
  }
}

function item(batchId: string, kind: ArrivalKind, n: number, opts: { decided?: boolean; dateISO?: string } = {}): ArrivalItem {
  return {
    key: `${batchId}~${n}`,
    kind,
    batchId,
    rowIds: [`${batchId}-r${n}`],
    openRowIds: opts.decided === true ? [] : [`${batchId}-r${n}`],
    hospitalId: 'H-STG',
    dateISO: opts.dateISO ?? '2026-11-25',
    session: 'AM',
    source: { kind: 'hospital', hospitalId: 'H-STG', label: "St George's" },
    receivedAtISO: '',
    title: '',
    counts: { rows: 1, open: 1, added: 0, changed: 0, cancelled: 0, unchanged: 0, removed: 0, waitingNhi: 0 },
    flags: {},
    decided: opts.decided ?? false,
  }
}

const STG = { kind: 'hospitalFeed', hospitalId: 'H-STG' } as const
const SX = { kind: 'hospitalFeed', hospitalId: 'H-SX' } as const
const MAIL = { kind: 'mailbox', senderEmail: 'tait.rooms@example.nz' } as const

function fixture(): SourcesInput {
  const batches: Record<string, ImportBatch> = {
    'B-SX-CANCEL': batch('B-SX-CANCEL', `${TODAY}T08:05:00`, SX),
    'B-PDF-TAIT': batch('B-PDF-TAIT', `${TODAY}T07:42:00`, MAIL, { file: { name: 'Tait list 15 Dec PM.pdf', facsimile: '' } }),
    'B-PDF-SCAN': batch('B-PDF-SCAN', `${TODAY}T06:58:00`, { kind: 'byHand', by: 'Office', senderEmail: 'reception@eye.example' }, { file: { name: 'Scan.pdf', facsimile: '' } }),
    'B-STG-FILE': batch('B-STG-FILE', `${TODAY}T06:10:00`, STG, { label: 'Day-before List' }),
    'B-SX-HELD': batch('B-SX-HELD', `${TODAY}T05:52:00`, SX, { rowIds: [], label: 'Appointment/88190', heldReason: 'cannot tell who the patient is' }),
    'B-STG-OLD': batch('B-STG-OLD', '2026-11-23T06:05:00', STG),
  }
  const items: ArrivalItem[] = [
    item('B-SX-CANCEL', 'cancellation', 1),
    item('B-PDF-TAIT', 'newList', 1, { dateISO: '2026-12-15' }),
    item('B-PDF-SCAN', 'newList', 1, { decided: true }),
    item('B-STG-FILE', 'update', 1),
    item('B-STG-FILE', 'update', 2),
    item('B-STG-FILE', 'newList', 3),
    item('B-STG-FILE', 'matchesExactly', 4),
    item('B-STG-FILE', 'matchesExactly', 5),
    item('B-STG-FILE', 'matchesExactly', 6),
    { ...item('B-STG-FILE', 'needsNhi', 7), key: 'nhi~B-STG-FILE-r7' },
    { ...item('B-SX-HELD', 'held', 0), rowIds: [], openRowIds: [], reason: 'cannot tell who the patient is' },
    item('B-STG-OLD', 'update', 1),
  ]
  return { sources: SOURCES, batches, items, todayISO: TODAY }
}

describe('sourceRows', () => {
  it('gives the three connected or reading sources each with receiving and last sent', () => {
    const rows = sourceRows(fixture())
    expect(rows.map((r) => r.source.id)).toEqual(['SRC-STG', 'SRC-SX', 'SRC-MAILBOX'])
    expect(rows.map((r) => r.receiving)).toEqual(['receiving', 'receiving', 'reading'])
    expect(rows.map((r) => r.lastSentISO)).toEqual([`${TODAY}T06:10:00`, `${TODAY}T08:05:00`, `${TODAY}T07:42:00`])
  })

  it("counts today's messages and what each became, and the held count", () => {
    const [stg, sx, mail] = sourceRows(fixture())
    expect(stg!.todayCount).toBe(1)
    expect(stg!.became).toEqual({ newList: 1, update: 2, cancellation: 0, unchanged: 3, held: 0, unreadable: 0 })
    expect(sx!.todayCount).toBe(2)
    expect(sx!.became).toMatchObject({ cancellation: 1, held: 1 })
    expect(sx!.heldCount).toBe(1)
    expect(mail!.todayCount).toBe(2)
    expect(mail!.became.newList).toBe(2)
  })

  it("does not count yesterday's message today", () => {
    const input = fixture()
    const old = input.batches['B-STG-OLD']!
    const onlyOld = { ...input, batches: { [old.id]: old } }
    const stg = sourceRows(onlyOld)[0]!
    expect(stg.todayCount).toBe(0)
    expect(stg.lastSentISO).toBe('2026-11-23T06:05:00')
    expect(todaysMessages(onlyOld)).toEqual([])
  })

  it('falls back to the stored last received time, and to nothing', () => {
    const input = { ...fixture(), batches: {} }
    const [stg, sx] = sourceRows(input)
    expect(stg!.lastSentISO).toBeUndefined()
    expect(sx!.lastSentISO).toBe('2026-11-20T09:00:00')
  })
})

describe('todaysMessages', () => {
  it('lists five messages today as five rows, newest first, with what each became', () => {
    const rows = todaysMessages(fixture())
    expect(rows.map((r) => r.batchId)).toEqual(['B-SX-CANCEL', 'B-PDF-TAIT', 'B-PDF-SCAN', 'B-STG-FILE', 'B-SX-HELD'])
    expect(rows.map((r) => r.sourceName)).toEqual(['Southern Cross', "Rooms' mailbox", "Rooms' mailbox", "St George's", 'Southern Cross'])
    expect(rows[0]!.became).toBe('Cancellation · Wed 25 Nov AM')
    expect(rows[1]!.became).toBe('New List · Tue 15 Dec AM')
    expect(rows[1]!.message).toBe('Tait list 15 Dec PM.pdf')
    expect(rows[3]!.became).toBe('6 Lists for Wed 25 Nov · 2 updates, 1 new List, 3 unchanged')
    expect(rows[4]!.became).toBe('Held')
    expect(rows.map((r) => r.state)).toEqual(['waiting', 'waiting', 'decided', 'waiting', 'held'])
    expect(rows[3]).toMatchObject({ waiting: 3, unchanged: 3, listCount: 6 })
  })

  it('reads a file of Lists that all match exactly as unchanged', () => {
    const input = fixture()
    const items = input.items.filter((i) => i.batchId !== 'B-STG-FILE').concat([item('B-STG-FILE', 'matchesExactly', 1), item('B-STG-FILE', 'matchesExactly', 2), item('B-STG-FILE', 'matchesExactly', 3)])
    const file = todaysMessages({ ...input, items }).find((m) => m.batchId === 'B-STG-FILE')!
    expect(file.became).toBe('Unchanged · 3 Lists')
  })
})

describe('heldBySource', () => {
  it('puts a held message under its source with its reason', () => {
    const held = heldBySource(fixture())
    expect(Object.keys(held)).toEqual(['SRC-SX'])
    expect(held['SRC-SX']).toEqual([{ batchId: 'B-SX-HELD', receivedAtISO: `${TODAY}T05:52:00`, message: 'Appointment/88190', reason: 'cannot tell who the patient is' }])
  })

  it('drops a dismissed message from held, and shows it in today as dismissed', () => {
    const input = fixture()
    const dismissed = { ...input.batches['B-SX-HELD']!, dismissed: { by: 'Office', atISO: `${TODAY}T09:00:00`, reason: 'Sent again' } }
    const after = { ...input, batches: { ...input.batches, [dismissed.id]: dismissed } }
    expect(heldBySource(after)['SRC-SX']).toBeUndefined()
    expect(sourceRows(after)[1]!.heldCount).toBe(0)
    expect(todaysMessages(after).find((m) => m.batchId === 'B-SX-HELD')!.state).toBe('dismissed')
  })

  it('lists an unreadable PDF under the mailbox, marked unreadable', () => {
    const input = fixture()
    const pdf = batch('B-PDF-BAD', `${TODAY}T09:30:00`, MAIL, { rowIds: [], file: { name: 'Blurry.pdf', facsimile: '' }, unreadableReason: 'The page is too faint to read' })
    const after = { ...input, batches: { ...input.batches, [pdf.id]: pdf } }
    expect(heldBySource(after)['SRC-MAILBOX']).toEqual([{ batchId: 'B-PDF-BAD', receivedAtISO: `${TODAY}T09:30:00`, message: 'Blurry.pdf', reason: 'The page is too faint to read', unreadable: true }])
    const row = todaysMessages(after)[0]!
    expect(row).toMatchObject({ batchId: 'B-PDF-BAD', became: 'Cannot be read', state: 'waiting' })
    expect(sourceRows(after)[2]!.became.unreadable).toBe(1)
  })
})

describe('notConnected', () => {
  it('lists a hospital not connected', () => {
    expect(notConnected(fixture())).toEqual([{ id: 'SRC-FORTE', name: 'Forte Health' }])
  })
})
