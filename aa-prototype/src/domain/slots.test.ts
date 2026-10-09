/**
 * The pure Slot module (catch-up Phase 28): the one displayed-status
 * derivation, the effective times, the open-session test, the start-date gate
 * and the ids.
 */

import { describe, expect, it } from 'vitest'
import {
  defaultScheduleSettings,
  displayStatusKey,
  effectiveSlotTimes,
  isWallTime,
  projectedListId,
  slotDatesFor,
  slotIdFor,
} from './slots'
import { LIST_KINDS, type ScheduleSettings } from './types'
import { displayStatusLabel, isOpenSlot, SEED_STATUS } from './slotStatus'
import { seedSlotStatusRecords } from './seed'

const SLOT_STATUSES = Object.values(SEED_STATUS)
const statuses = seedSlotStatusRecords()

describe('displayStatusKey (US-01.2.3: a List shows in place of the status; no Bookings in)', () => {
  it('an empty Slot shows its own status', () => {
    for (const status of SLOT_STATUSES) expect(displayStatusKey({ status }, undefined)).toBe(status)
  })

  it('a Slot holding a List shows the List\'s kind, whatever the Slot\'s status', () => {
    for (const status of SLOT_STATUSES) {
      for (const kind of LIST_KINDS) expect(displayStatusKey({ status }, { kind })).toBe(kind)
    }
  })

  it('takes exactly a Slot and an optional List: no Booking can reach it', () => {
    expect(displayStatusKey.length).toBe(2)
  })

  it('labels every key through the one lookup', () => {
    expect(displayStatusLabel('free', statuses)).toBe('Free')
    expect(displayStatusLabel('unavailable', statuses)).toBe('Unavailable')
    expect(displayStatusLabel('holiday', statuses)).toBe('Holiday')
    expect(displayStatusLabel('holiday', statuses, true)).toBe('On holiday')
    expect(displayStatusLabel('preop', statuses)).toBe('Pre-op')
  })
})

describe('effectiveSlotTimes (US-01.1.4)', () => {
  const settings = defaultScheduleSettings()

  it('follows the session default without an override', () => {
    expect(effectiveSlotTimes({ session: 'AM' }, settings)).toEqual({ startTime: '07:30', endTime: '12:30', overridden: false })
    expect(effectiveSlotTimes({ session: 'PM' }, settings)).toEqual({ startTime: '13:00', endTime: '17:30', overridden: false })
  })

  it('a Slot\'s own time wins, per field', () => {
    expect(effectiveSlotTimes({ session: 'PM', startTime: '13:30' }, settings)).toEqual({ startTime: '13:30', endTime: '17:30', overridden: true })
  })

  it('a settings change moves the defaulted sessions and leaves the overridden ones', () => {
    const changed: ScheduleSettings = { ...settings, defaultTimes: { ...settings.defaultTimes, PM: { startTime: '13:15', endTime: '17:45' } } }
    expect(effectiveSlotTimes({ session: 'PM' }, changed)).toMatchObject({ startTime: '13:15', endTime: '17:45' })
    expect(effectiveSlotTimes({ session: 'PM', startTime: '14:00', endTime: '17:00' }, changed)).toMatchObject({ startTime: '14:00', endTime: '17:00' })
  })
})

describe('isOpenSlot (US-01.4.2)', () => {
  it('is open for bookings and holding no List', () => {
    expect(isOpenSlot({ status: 'free' }, undefined, statuses)).toBe(true)
    expect(isOpenSlot({ status: 'free' }, { id: 'LG0001' }, statuses)).toBe(false)
    expect(isOpenSlot({ status: 'unavailable' }, undefined, statuses)).toBe(false)
    expect(isOpenSlot({ status: 'holiday' }, undefined, statuses)).toBe(false)
  })
})

describe('slotDatesFor (US-01.1.3)', () => {
  const dates = ['2026-08-02', '2026-08-03', '2026-08-04']
  it('keeps the dates on or after the start date', () => {
    expect(slotDatesFor('2026-08-03', dates)).toEqual(['2026-08-03', '2026-08-04'])
    expect(slotDatesFor('2026-08-01', dates)).toEqual(dates)
    expect(slotDatesFor('2026-08-05', dates)).toEqual([])
  })
})

describe('ids and settings', () => {
  it('Slot and projected List ids are deterministic and distinct', () => {
    expect(slotIdFor('34821', '2026-07-21', 'AM')).toBe('S-34821-2026-07-21-AM')
    expect(projectedListId('34821', '2026-07-21', 'AM')).toBe('L-34821-2026-07-21-AM')
  })

  it('seeds four months and today\'s default times', () => {
    expect(defaultScheduleSettings()).toEqual({
      horizonMonths: 4,
      defaultTimes: { AM: { startTime: '07:30', endTime: '12:30' }, PM: { startTime: '13:00', endTime: '17:30' } },
    })
  })

  it('validates wall times', () => {
    expect(isWallTime('07:30')).toBe(true)
    expect(isWallTime('7:30')).toBe(false)
    expect(isWallTime('24:00')).toBe(false)
    expect(isWallTime('')).toBe(false)
  })
})
