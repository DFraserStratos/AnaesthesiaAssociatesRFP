/**
 * Public as a Slot status (catch-up Phase 32d; DM-71, RV-43, D86: OQ-139
 * answered). Public works like Unavailable: closed for bookings and cover, set
 * by the anaesthetist or the office, with an optional note, under a key no List
 * kind can equal.
 */

import { describe, expect, it } from 'vitest'
import {
  anaesthetistChoices,
  isClosedKey,
  isListKind,
  isOpenSlot,
  SEED_STATUS,
  statusLine,
  validateSlotStatusDraft,
  type SlotStatusDraft,
} from './slotStatus'
import { vacatedChoices } from './listMoves'
import { LIST_KINDS } from './types'
import { seedSlotStatusRecords } from './seed'

const statuses = seedSlotStatusRecords()

describe('Public as a Slot status (catch-up Phase 32d)', () => {
  it('no seeded status ID is a List kind, and the retired kind is gone', () => {
    for (const key of Object.values(SEED_STATUS)) expect((LIST_KINDS as readonly string[]).includes(key), key).toBe(false)
    for (const key of Object.keys(statuses)) expect(isListKind(key), key).toBe(false)
    expect(LIST_KINDS).toEqual(['private', 'preop'])
  })

  it('the record: Public, Public hospital, not open for bookings, anaesthetists can set it, after Unavailable, the public colour, solid', () => {
    const rec = statuses[SEED_STATUS.publicHospital]!
    expect(rec).toMatchObject({
      key: 'publicHospital',
      label: 'Public',
      longLabel: 'Public hospital',
      description: 'Working at a public hospital. Not open for bookings or cover.',
      colour: 'public',
      treatment: 'solid',
      bookable: false,
      anaesthetistCanSet: true,
    })
    expect(rec.order).toBeGreaterThan(statuses[SEED_STATUS.unavailable]!.order)
  })

  it('is closed: never open for a List or cover; back to Free reopens it', () => {
    expect(isClosedKey(statuses, SEED_STATUS.publicHospital)).toBe(true)
    expect(isOpenSlot({ status: SEED_STATUS.publicHospital }, undefined, statuses)).toBe(false)
    expect(isOpenSlot({ status: SEED_STATUS.free }, undefined, statuses)).toBe(true)
  })

  it('the anaesthetist can choose it', () => {
    expect(anaesthetistChoices(statuses).map((s) => s.key)).toEqual(['free', 'holiday', 'unavailable', 'publicHospital'])
  })

  it('setting Public on a session holding a List offers Public or Free for the session left behind (32b)', () => {
    expect(vacatedChoices(SEED_STATUS.publicHospital)).toEqual(['publicHospital', 'free'])
  })

  it('reads "Public · CPH" from one helper, the label alone without a note', () => {
    expect(statusLine({ status: SEED_STATUS.publicHospital, note: 'CPH' }, statuses)).toBe('Public · CPH')
    expect(statusLine({ status: SEED_STATUS.publicHospital }, statuses)).toBe('Public')
    expect(statusLine({ status: SEED_STATUS.publicHospital, note: '  ' }, statuses)).toBe('Public')
    expect(statusLine({ status: SEED_STATUS.publicHospital, note: 'CPH' }, statuses, true)).toBe('Public hospital · CPH')
  })

  it('"Public" is refused only as a duplicate label; Private and Pre-op are still List types', () => {
    const draft = (label: string): SlotStatusDraft => ({
      label,
      longLabel: label,
      description: 'A test status.',
      colour: 'unavailable',
      treatment: 'hatched',
      bookable: false,
      anaesthetistCanSet: true,
      isDefault: false,
    })
    expect(validateSlotStatusDraft(draft('Public'), statuses)).toEqual(['Another status is already called Public.'])
    expect(validateSlotStatusDraft(draft('Private'), statuses)).toEqual(['Private is a List type, not availability.'])
    expect(validateSlotStatusDraft(draft('Teaching'), statuses)).toEqual([])
  })
})
