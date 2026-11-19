/**
 * An anaesthetist moves a single Booking (catch-up Phase 32a; US-01.4.7,
 * US-01.4.6, DM-42): the refusals, the receivers offered or blocked, the name
 * search and the name-only order, by availability alone.
 */

import { describe, expect, expectTypeOf, it } from 'vitest'
import { bookingMoveReceivers, bookingMoveRefusal, bookingPlacement, freeColleagues, RECEIVER_LINES, type BookingMoveInput } from './bookingMoves'
import { matchesNameQuery } from './names'
import { seedSlotStatusRecords } from './seed'
import { SEED_STATUS } from './slotStatus'
import { slotIdFor } from './slots'
import type { Anaesthetist, AssignedList, Booking, DraftList, List, Session, Slot } from './types'

const DAY = '2026-07-23'
const TODAY = '2026-07-21'

function anaesthetist(id: string, name: string, active = true): Anaesthetist {
  return { registrationNumber: id, name, phone: `021 ${id}`, email: `${id}@x.example`, unitValue: 25, hpiId: id, bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' }, startDateISO: '2010-01-01', active }
}

function slot(anaesthetistId: string, status: string = SEED_STATUS.free, session: Session = 'AM'): Slot {
  return { id: slotIdFor(anaesthetistId, DAY, session), anaesthetistId, dateISO: DAY, session, status }
}

function list(id: string, anaesthetistId: string, extra: Partial<AssignedList> = {}): AssignedList {
  const session = extra.session ?? 'AM'
  return {
    id, slotId: slotIdFor(anaesthetistId, DAY, session), anaesthetistId, dateISO: DAY, session,
    state: 'ACTIVE', kind: 'private', hospitalId: 'H-STG', surgeonId: 'S-REID', conflicts: [], origin: { kind: 'manual' as const }, ...extra,
  }
}

function booking(id: string, listId: string, extra: Partial<Booking> = {}): Booking {
  return { id, listId, patientId: 'PT1', completed: false, lastModifiedBy: 'seed', lastModifiedAtISO: '2026-07-20T08:00:00', ...extra }
}

/**
 * Souter (A1) holds L1 on Thu 23 AM with B1. Colleagues: Sharma free, Chen free,
 * Hughes unavailable, Beaumont on holiday, Abbott holds an ACTIVE List, Ellis a
 * SUBMITTED one, Ngata inactive, Zane has no Thu AM session.
 */
function fixture(): BookingMoveInput {
  const anaesthetists = Object.fromEntries(
    [
      anaesthetist('A1', 'Dr Melanie Souter'),
      anaesthetist('A2', 'Dr Priya Sharma'),
      anaesthetist('A3', 'Dr Alistair Chen'),
      anaesthetist('A4', 'Dr Rachel Hughes'),
      anaesthetist('A5', 'Dr Tom Beaumont'),
      anaesthetist('A6', 'Dr Zoe Abbott'),
      anaesthetist('A7', 'Dr Sam Ellis'),
      anaesthetist('A8', 'Dr Ana Ngata', false),
      anaesthetist('A9', 'Dr Amy Zane'),
    ].map((a) => [a.registrationNumber, a]),
  )
  const slots = Object.fromEntries(
    [
      slot('A1'), slot('A2'), slot('A3'),
      slot('A4', SEED_STATUS.unavailable), slot('A5', SEED_STATUS.holiday),
      slot('A6'), slot('A7'), slot('A8'), slot('A9', SEED_STATUS.free, 'PM'),
    ].map((s) => [s.id, s]),
  )
  const draft = { id: 'D1', state: 'DRAFT', kind: 'private', hospitalId: 'H-STG', surgeonId: 'S-REID', dateISO: DAY, session: 'AM', conflicts: [] } as unknown as DraftList
  const lists: Record<string, List> = {
    L1: list('L1', 'A1'),
    L6: list('L6', 'A6'),
    L7: list('L7', 'A7', { state: 'SUBMITTED' }),
    D1: draft,
  }
  const bookings = {
    B1: booking('B1', 'L1'),
    B2: booking('B2', 'L1', { cancellation: { atISO: '2026-07-20T09:00:00', by: 'office', reason: 'x' } as Booking['cancellation'] }),
    B6: booking('B6', 'L6'),
    BD: booking('BD', 'D1'),
  }
  return { lists, slots, anaesthetists, bookings, slotStatuses: seedSlotStatusRecords() }
}

describe('matchesNameQuery (the one type-ahead filter)', () => {
  it('matches the full name or surname without the title, case-insensitively, per letter', () => {
    expect(matchesNameQuery('Dr Rawiri Hughes', '')).toBe(true)
    expect(matchesNameQuery('Dr Rawiri Hughes', '  ')).toBe(true)
    expect(matchesNameQuery('Dr Rawiri Hughes', 'h')).toBe(true)
    expect(matchesNameQuery('Dr Rawiri Hughes', 'HUG')).toBe(true)
    expect(matchesNameQuery('Dr Rawiri Hughes', 'rawiri  h')).toBe(true)
    // A title in the query is ignored, as it is in the name.
    expect(matchesNameQuery('Dr Rawiri Hughes', 'Dr Hug')).toBe(true)
    expect(matchesNameQuery('Dr Rawiri Hughes', 'dr')).toBe(true)
    expect(matchesNameQuery('Dr Andrew Smith', 'Dr Hug')).toBe(false)
    expect(matchesNameQuery('Dr Rawiri Hughes', 'chen')).toBe(false)
  })
})

describe('bookingMoveRefusal', () => {
  const input = fixture()
  it('is null for a non-cancelled Booking on her own ACTIVE List dated today or later', () => {
    expect(bookingMoveRefusal(input, 'B1', 'A1', TODAY)).toBeNull()
    expect(bookingMoveRefusal(input, 'B1', 'A1', DAY)).toBeNull()
  })
  it('returns each code with plain words', () => {
    expect(bookingMoveRefusal(input, 'NOPE', 'A1', TODAY)?.code).toBe('notFound')
    expect(bookingMoveRefusal(input, 'B2', 'A1', TODAY)?.code).toBe('cancelled')
    expect(bookingMoveRefusal(input, 'B6', 'A1', TODAY)).toEqual({ code: 'notOwnList', message: 'You can only move Bookings from your own Lists.' })
    expect(bookingMoveRefusal(input, 'B1', undefined, TODAY)?.code).toBe('notOwnList')
    // A Booking on a Draft List reads as not hers: the words "Draft List" never reach her.
    const draft = bookingMoveRefusal(input, 'BD', 'A1', TODAY)
    expect(draft?.code).toBe('notOwnList')
    expect(draft?.message).not.toMatch(/draft/i)
    const submitted = { ...input, lists: { ...input.lists, L1: list('L1', 'A1', { state: 'SUBMITTED' }) } }
    expect(bookingMoveRefusal(submitted, 'B1', 'A1', TODAY)?.code).toBe('listSubmitted')
    const authorised = { ...input, lists: { ...input.lists, L1: list('L1', 'A1', { state: 'AUTHORISED' }) } }
    expect(bookingMoveRefusal(authorised, 'B1', 'A1', TODAY)?.code).toBe('listAuthorised')
    expect(bookingMoveRefusal(input, 'B1', 'A1', '2026-07-24')).toEqual({ code: 'pastDate', message: "This List's day has passed. Ask the office to move it." })
  })
})

describe('bookingMoveReceivers', () => {
  const input = fixture()
  const rows = bookingMoveReceivers(input, 'B1', 'A1', '')
  const byId = Object.fromEntries(rows.map((r) => [r.anaesthetistId, r]))

  it('offers a free, empty session and blocks the rest, never the mover or an inactive colleague', () => {
    expect(byId['A1']).toBeUndefined()
    expect(byId['A8']).toBeUndefined()
    expect(byId['A2']).toMatchObject({ offer: { slotId: slotIdFor('A2', DAY, 'AM') }, line: RECEIVER_LINES.offer })
    expect(byId['A3']?.offer).not.toBeNull()
    expect(byId['A4']).toMatchObject({ offer: null, block: 'notAvailable', line: RECEIVER_LINES.notAvailable })
    expect(byId['A5']).toMatchObject({ offer: null, block: 'notAvailable' })
    expect(byId['A6']).toMatchObject({ offer: null, block: 'hasList', line: 'Already has a List this session' })
    expect(byId['A7']).toMatchObject({ offer: null, block: 'hasList' })
    expect(byId['A9']).toMatchObject({ offer: null, block: 'noSlot' })
  })

  it('sorts by surname alone', () => {
    expect(rows.map((r) => r.name)).toEqual([
      'Dr Zoe Abbott', 'Dr Tom Beaumont', 'Dr Alistair Chen', 'Dr Sam Ellis', 'Dr Rachel Hughes', 'Dr Priya Sharma', 'Dr Amy Zane',
    ])
  })

  it('filters by name as letters are typed: full name, surname, any case, or nothing', () => {
    expect(bookingMoveReceivers(input, 'B1', 'A1', 'h').map((r) => r.anaesthetistId).sort()).toEqual(['A3', 'A4', 'A2'].sort())
    expect(bookingMoveReceivers(input, 'B1', 'A1', 'HUG').map((r) => r.anaesthetistId)).toEqual(['A4'])
    expect(bookingMoveReceivers(input, 'B1', 'A1', 'priya sharma').map((r) => r.anaesthetistId)).toEqual(['A2'])
    expect(bookingMoveReceivers(input, 'B1', 'A1', 'xyz')).toEqual([])
  })

  it('free colleagues are the offered rows only, in name order', () => {
    expect(freeColleagues(input, 'B1', 'A1').map((r) => r.name)).toEqual(['Dr Alistair Chen', 'Dr Priya Sharma'])
  })

  it('no line carries an en or em dash, or the word slot', () => {
    for (const r of rows) expect(r.line).not.toMatch(/[–—]|\bslots?\b/i)
  })

  it('returns nothing for a Booking on a Draft List or a missing Booking', () => {
    expect(bookingMoveReceivers(input, 'BD', 'A1', '')).toEqual([])
    expect(bookingMoveReceivers(input, 'NOPE', 'A1', '')).toEqual([])
  })

  it('takes no preference or tier: the input type is the schedule, the masters and the statuses only', () => {
    expect(Object.keys(input).sort()).toEqual(['anaesthetists', 'bookings', 'lists', 'slotStatuses', 'slots'])
    expectTypeOf<keyof BookingMoveInput>().toEqualTypeOf<'lists' | 'slots' | 'anaesthetists' | 'slotStatuses' | 'bookings'>()
  })
})

describe('bookingPlacement (the one placement rule)', () => {
  const input = fixture()
  it("offers the receiver's free session, or refuses with a plain sentence", () => {
    expect(bookingPlacement(input, 'B1', 'A2')).toEqual({ ok: true, slotId: slotIdFor('A2', DAY, 'AM') })
    expect(bookingPlacement(input, 'B1', 'A4')).toEqual({ ok: false, code: 'notAvailable', message: 'Dr Hughes is not available this session. They need to set it available first.' })
    expect(bookingPlacement(input, 'B1', 'A6')).toEqual({ ok: false, code: 'hasList', message: 'Dr Abbott already has a List this session.' })
    expect(bookingPlacement(input, 'B1', 'A9')).toMatchObject({ ok: false, code: 'noSlot' })
    expect(bookingPlacement(input, 'B1', 'A8')).toMatchObject({ ok: false, code: 'notFound' })
    expect(bookingPlacement(input, 'B1', 'A1')).toMatchObject({ ok: false, code: 'notFound' })
  })
  it('offers a colleague once they set the session available themselves', () => {
    const accepted = { ...input, slots: { ...input.slots, [slotIdFor('A4', DAY, 'AM')]: slot('A4') } }
    expect(bookingPlacement(accepted, 'B1', 'A4').ok).toBe(true)
  })
})
