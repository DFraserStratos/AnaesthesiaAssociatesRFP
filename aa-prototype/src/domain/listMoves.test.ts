/**
 * An anaesthetist's own List move (catch-up Phase 32; US-01.4.3, US-01.4.5,
 * US-01.5.5): the one receive rule, the owner's refusals and the colleagues
 * offered, by availability alone.
 */

import { describe, expect, it } from 'vitest'
import { canReceiveList, isMovableByOwner, movableListsFor, ownMoveRefusal, pushTargets, receiveRefusal, VACATED_SESSION_DEFAULT, type ListMoveInput } from './listMoves'
import { titledSurname } from './names'
import { seedSlotStatusRecords } from './seed'
import { SEED_STATUS } from './slotStatus'
import { slotIdFor } from './slots'
import type { Anaesthetist, AssignedList, DraftList, List, Session, Slot } from './types'

const DAY = '2026-07-23'
const TODAY = '2026-07-21'

function anaesthetist(id: string, name: string, active = true): Anaesthetist {
  return { registrationNumber: id, name, phone: `021 ${id}`, email: `${id}@x.example`, unitValue: 25, gstPeriod: 'monthly', hpiId: id, startDateISO: '2010-01-01', active }
}

function slot(anaesthetistId: string, session: Session = 'AM', status: string = SEED_STATUS.free, dateISO = DAY): Slot {
  return { id: slotIdFor(anaesthetistId, dateISO, session), anaesthetistId, dateISO, session, status }
}

function list(id: string, anaesthetistId: string, extra: Partial<AssignedList> = {}): AssignedList {
  const dateISO = extra.dateISO ?? DAY
  const session = extra.session ?? 'AM'
  return {
    id,
    slotId: slotIdFor(anaesthetistId, dateISO, session),
    anaesthetistId,
    dateISO,
    session,
    state: 'ACTIVE',
    kind: 'private',
    hospitalId: 'H-STG',
    surgeonId: 'S-REID',
    conflicts: [],
    ...extra,
  }
}

/** Owner Souter (A1) holds L1 on Thu 23 AM; colleagues are free, closed, booked, inactive or have no session. */
function fixture(): ListMoveInput {
  const anaesthetists = Object.fromEntries(
    [
      anaesthetist('A1', 'Dr Melanie Souter'),
      anaesthetist('A2', 'Dr Priya Sharma'),
      anaesthetist('A3', 'Dr Alistair Chen'),
      anaesthetist('A4', 'Dr Rachel Hughes'),
      anaesthetist('A5', 'Dr Tom Beaumont'),
      anaesthetist('A6', 'Dr Ana Ngata', false),
      anaesthetist('A7', 'Dr Zoe Abbott'),
    ].map((a) => [a.registrationNumber, a]),
  )
  const slots = Object.fromEntries(
    [
      slot('A1'),
      slot('A2'),
      slot('A3'),
      slot('A4', 'AM', SEED_STATUS.unavailable),
      slot('A5'),
      slot('A6'),
      // A7 has no Thu AM session (only PM).
      slot('A7', 'PM'),
      slot('A1', 'PM'),
    ].map((s) => [s.id, s]),
  )
  const lists: Record<string, List> = {
    L1: list('L1', 'A1'),
    L5: list('L5', 'A5'),
  }
  return { lists, slots, anaesthetists, slotStatuses: seedSlotStatusRecords() }
}

describe('receiveRefusal (the one receive rule)', () => {
  const input = fixture()
  const from = input.slots[slotIdFor('A1', DAY, 'AM')]!

  it('refuses a missing, the same, another day or session, and an occupied session', () => {
    expect(receiveRefusal(input, from, 'S-NOPE', { requireOpen: false })?.code).toBe('notFound')
    expect(receiveRefusal(input, from, from.id, { requireOpen: false })?.code).toBe('sameSlot')
    expect(receiveRefusal(input, from, slotIdFor('A1', DAY, 'PM'), { requireOpen: false })?.code).toBe('differentSession')
    expect(receiveRefusal(input, from, slotIdFor('A5', DAY, 'AM'), { requireOpen: false })?.code).toBe('slotOccupied')
  })

  it("accepts a closed session for the office, but not for an anaesthetist's own move", () => {
    const closed = slotIdFor('A4', DAY, 'AM')
    expect(receiveRefusal(input, from, closed, { requireOpen: false })).toBeNull()
    expect(receiveRefusal(input, from, closed, { requireOpen: true })).toEqual({ code: 'targetNotOpen', message: "Dr Hughes's session cannot take a List." })
    expect(canReceiveList(input, from, closed)).toBe(false)
  })

  it('refuses an inactive colleague on an own move', () => {
    expect(receiveRefusal(input, from, slotIdFor('A6', DAY, 'AM'), { requireOpen: true })?.code).toBe('targetNotOpen')
    expect(canReceiveList(input, from, slotIdFor('A2', DAY, 'AM'))).toBe(true)
  })
})

describe('ownMoveRefusal', () => {
  it('is null for the owner of an ACTIVE List dated today or later', () => {
    const input = fixture()
    expect(ownMoveRefusal(input, 'L1', 'A1', TODAY)).toBeNull()
    expect(ownMoveRefusal(input, 'L1', 'A1', DAY)).toBeNull()
    expect(isMovableByOwner(input, 'L1', 'A1', TODAY)).toBe(true)
  })

  it('returns each code for its case', () => {
    const draft: DraftList = {
      id: 'LD1',
      dateISO: DAY,
      session: 'AM',
      state: 'DRAFT',
      kind: 'private',
      hospitalId: 'H-STG',
      surgeonId: 'S-REID',
      conflicts: [],
      draft: { origin: 'request', sinceISO: `${TODAY}T08:00:00`, by: 'Kirsty W.' },
    }
    const input = {
      lists: {
        ...fixture().lists,
        LD1: draft,
        LS: list('LS', 'A1', { state: 'SUBMITTED', session: 'PM' }),
        LA: list('LA', 'A1', { state: 'AUTHORISED', dateISO: '2026-07-24' }),
        LP: list('LP', 'A1', { dateISO: '2026-07-20' }),
      },
    }
    expect(ownMoveRefusal(input, 'NOPE', 'A1', TODAY)?.code).toBe('notFound')
    expect(ownMoveRefusal(input, 'LD1', 'A1', TODAY)).toEqual({ code: 'draftList', message: 'This List has no anaesthetist yet. Only the office can assign it.' })
    expect(ownMoveRefusal(input, 'L5', 'A1', TODAY)?.code).toBe('notOwnList')
    expect(ownMoveRefusal(input, 'L1', undefined, TODAY)?.code).toBe('notOwnList')
    expect(ownMoveRefusal(input, 'LS', 'A1', TODAY)?.code).toBe('listSubmitted')
    expect(ownMoveRefusal(input, 'LA', 'A1', TODAY)?.code).toBe('listAuthorised')
    expect(ownMoveRefusal(input, 'LP', 'A1', TODAY)).toEqual({ code: 'pastDate', message: "This List's day has passed." })
  })

  it('never uses a dash or the word "slot"', () => {
    const input = { lists: { ...fixture().lists, LP: list('LP', 'A1', { dateISO: '2026-07-20' }) } }
    for (const [id, who] of [['NOPE', 'A1'], ['L5', 'A1'], ['LP', 'A1']] as const) {
      const message = ownMoveRefusal(input, id, who, TODAY)?.message ?? ''
      expect(message).not.toMatch(/[–—]/)
      expect(message).not.toMatch(/\bslots?\b/i)
    }
  })
})

describe('pushTargets (US-01.4.5 "Availability only")', () => {
  it('offers active colleagues whose session is open and empty, in surname order, with nothing else', () => {
    const targets = pushTargets(fixture(), 'L1')
    // Excluded: Souter (owner), Hughes (unavailable), Beaumont (holds a List),
    // Ngata (inactive), Abbott (no AM session).
    expect(targets).toEqual([
      { anaesthetistId: 'A3', name: 'Dr Alistair Chen', phone: '021 A3', slotId: slotIdFor('A3', DAY, 'AM') },
      { anaesthetistId: 'A2', name: 'Dr Priya Sharma', phone: '021 A2', slotId: slotIdFor('A2', DAY, 'AM') },
    ])
  })

  it('agrees with the receive rule on every session that day', () => {
    const input = fixture()
    const from = input.slots[slotIdFor('A1', DAY, 'AM')]!
    const offered = new Set(pushTargets(input, 'L1').map((t) => t.slotId))
    for (const s of Object.values(input.slots)) {
      if (s.anaesthetistId === 'A1') continue
      expect(offered.has(s.id), s.id).toBe(receiveRefusal(input, from, s.id, { requireOpen: true }) === null)
    }
  })

  it('is the same with or without pairing preferences and tiers anywhere in the state (it takes none)', () => {
    const clean = pushTargets(fixture(), 'L1')
    // A state that also carries the office's private slice: pushTargets has no
    // parameter for it, so it cannot read it. Same members, same order.
    const withPrivate = { ...fixture(), officeOnly: { notPreferred: [{ anaesthetistId: 'A2', surgeonId: 'S-REID' }], tiers: { A2: 1, A3: 3 } } }
    expect(pushTargets(withPrivate, 'L1')).toEqual(clean)
    expect(pushTargets.length).toBe(2)
  })

  it('is empty for a Draft List or an unknown List', () => {
    expect(pushTargets(fixture(), 'NOPE')).toEqual([])
  })
})

describe('movableListsFor and the vacated default', () => {
  it("lists the persona's movable Lists in a window, by date then session", () => {
    const input = { lists: { ...fixture().lists, L2: list('L2', 'A1', { dateISO: '2026-07-22', session: 'PM' }), LX: list('LX', 'A1', { dateISO: '2026-08-30' }) } }
    expect(movableListsFor(input, 'A1', TODAY, '2026-07-27').map((l) => l.id)).toEqual(['L2', 'L1'])
  })

  it('defaults the vacated session to Free (OQ-84 recommendation)', () => {
    expect(VACATED_SESSION_DEFAULT).toBe(SEED_STATUS.free)
  })

  it('shortens master names with their title', () => {
    expect(titledSurname('Dr Priya Sharma')).toBe('Dr Sharma')
    expect(titledSurname('Ms A. Reid')).toBe('Ms Reid')
    expect(titledSurname('Jane Smith')).toBe('Jane Smith')
  })
})
