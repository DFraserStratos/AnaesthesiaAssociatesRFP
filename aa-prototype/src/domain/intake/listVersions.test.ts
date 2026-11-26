/** Build plan Phase 68: a List's versions (DM-12). */
import { describe, expect, it } from 'vitest'
import type { ArrivalSource, ImportBatch, ImportDecision, ImportRow, ImportRowStatus } from '../types'
import { listVersions } from './listVersions'

const batch = (id: string, receivedAtISO: string, arrivalSource: ArrivalSource, rowIds: string[]): ImportBatch => ({
  id,
  channel: arrivalSource.kind === 'hospitalFeed' ? 'download' : 'pdfList',
  source: arrivalSource.kind === 'hospitalFeed' ? 'hospital' : 'rooms',
  hospitalId: 'H-SG',
  label: id,
  arrivalSource,
  receivedAtISO,
  rowIds,
})

const row = (id: string, batchId: string, status: ImportRowStatus, decision?: ImportDecision, extra: Partial<ImportRow> = {}): ImportRow => ({
  id,
  batchId,
  channel: 'download',
  source: 'hospital',
  receivedAtISO: '2026-11-20T09:00:00',
  incoming: { hospitalId: 'H-SG', dateISO: '2026-11-25', session: 'AM', patient: { name: id }, hospitalStatus: 'booked' },
  status,
  ...(decision !== undefined ? { decision } : {}),
  ...extra,
})

const LIST = 'L1'
const bookingListIds = { B1: 'L1', B2: 'L1', B3: 'L1', B9: 'L9' }
const names = { hospitals: { 'H-SG': "St George's" } }

const MAILBOX: ArrivalSource = { kind: 'mailbox', senderEmail: 'leanne.pa@avonsidesurgical.example' }
const FEED: ArrivalSource = { kind: 'hospitalFeed', hospitalId: 'H-SG' }

const intake = {
  batches: {
    // Listed out of time order on purpose.
    BAT3: batch('BAT3', '2026-11-23T08:00:00', FEED, ['R7', 'R8']),
    BAT1: batch('BAT1', '2026-11-20T09:00:00', MAILBOX, ['R1', 'R2', 'R3']),
    BAT2: batch('BAT2', '2026-11-22T10:00:00', { kind: 'byHand', by: 'Sarah Kelly', senderEmail: 'admin@avonsidesurgical.example' }, ['R4', 'R5', 'R6']),
    BAT4: batch('BAT4', '2026-11-24T08:00:00', FEED, ['R9']),
  },
  rows: {
    R2: row('R2', 'BAT1', 'applied', { kind: 'createBooking', listId: LIST, bookingId: 'B2' }),
    R1: row('R1', 'BAT1', 'applied', { kind: 'createList', slotId: 'S1', listId: LIST, bookingId: 'B1' }),
    R3: row('R3', 'BAT1', 'open'),
    // A match by Booking (no listId), a change; a match naming the List, a cancellation; a removal confirmed.
    R4: row('R4', 'BAT2', 'applied', { kind: 'match', bookingId: 'B1', changeType: 'modification', fieldsApplied: ['time'] }),
    R5: row('R5', 'BAT2', 'applied', { kind: 'match', bookingId: 'B2', changeType: 'cancellation', fieldsApplied: [], listId: LIST }),
    R6: row('R6', 'BAT2', 'applied', { kind: 'match', bookingId: 'B3', changeType: 'cancellation', fieldsApplied: [] }, { removalOfBookingId: 'B3' }),
    // A removal left out (unchanged), and a no-change match.
    R7: row('R7', 'BAT3', 'leftOut', { kind: 'leftOut' }, { removalOfBookingId: 'B1' }),
    R8: row('R8', 'BAT3', 'applied', { kind: 'match', bookingId: 'B2', changeType: 'noChange', fieldsApplied: [] }),
    // Another List's row only.
    R9: row('R9', 'BAT4', 'applied', { kind: 'match', bookingId: 'B9', changeType: 'modification', fieldsApplied: ['time'] }),
    R10: row('R10', 'BAT4', 'rejected', { kind: 'reject', reason: 'Not ours' }),
  },
}

describe('listVersions', () => {
  const versions = listVersions({ id: LIST, origin: { kind: 'pdf', senderEmail: 'leanne.pa@avonsidesurgical.example' }, createdAtISO: '2026-11-20T09:30:00' }, intake, bookingListIds, names)

  it('puts the origin first, then each arrival with a decided row on the List, in time order', () => {
    expect(versions.map((v) => v.kind)).toEqual(['origin', 'arrival', 'arrival', 'arrival'])
    expect(versions.map((v) => v.batchId)).toEqual([undefined, 'BAT1', 'BAT2', 'BAT3'])
    expect(versions[0]).toMatchObject({ atISO: '2026-11-20T09:30:00', source: 'rooms', label: 'Rooms PDF from leanne.pa@avonsidesurgical.example', rowIds: [] })
  })

  it('marks only the last version current', () => {
    expect(versions.map((v) => v.current)).toEqual([false, false, false, true])
  })

  it('counts what each arrival did, from its decided rows only, in the arrival order', () => {
    expect(versions[1]).toMatchObject({ rowIds: ['R1', 'R2'], counts: { added: 2, changed: 0, cancelled: 0, removed: 0, unchanged: 0 } })
    expect(versions[2]).toMatchObject({ rowIds: ['R4', 'R5', 'R6'], counts: { added: 0, changed: 1, cancelled: 1, removed: 1, unchanged: 0 } })
    expect(versions[3]).toMatchObject({ rowIds: ['R7', 'R8'], counts: { added: 0, changed: 0, cancelled: 0, removed: 0, unchanged: 2 } })
  })

  it('labels each arrival by its source, in words with no dashes', () => {
    expect(versions[1]).toMatchObject({ source: 'rooms', label: 'Rooms PDF from leanne.pa@avonsidesurgical.example' })
    expect(versions[2]).toMatchObject({ source: 'rooms', label: 'Rooms PDF from admin@avonsidesurgical.example · added by hand' })
    expect(versions[3]).toMatchObject({ source: 'hospital', label: "St George's feed" })
    for (const v of versions) expect(v.label).not.toMatch(/[–—]/)
  })

  it('labels each origin', () => {
    const origin = (o: Parameters<typeof listVersions>[0]['origin'], n?: typeof names) => listVersions({ id: 'LX', origin: o }, intake, bookingListIds, n)[0]!
    expect(origin({ kind: 'hospital', hospitalId: 'H-SG' }, names)).toMatchObject({ source: 'hospital', label: "St George's feed" })
    expect(origin({ kind: 'hospital', hospitalId: 'H-SG' })).toMatchObject({ label: 'H-SG feed' })
    expect(origin({ kind: 'manual' })).toMatchObject({ source: 'office', label: 'Made by hand' })
    expect(origin({ kind: 'recurring' })).toMatchObject({ source: 'recurring', label: 'Recurring' })
  })

  it('is the origin alone, current, for a List no arrival touched', () => {
    const only = listVersions({ id: 'LX', origin: { kind: 'manual' } }, intake, bookingListIds)
    expect(only).toHaveLength(1)
    expect(only[0]).toMatchObject({ kind: 'origin', current: true, atISO: '' })
  })

  it('dates the origin from the first arrival when the List has no creation time', () => {
    const v = listVersions({ id: LIST, origin: { kind: 'manual' } }, intake, bookingListIds)
    expect(v[0]!.atISO).toBe('2026-11-20T09:00:00')
  })
})
