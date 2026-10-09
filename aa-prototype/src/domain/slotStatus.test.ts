/**
 * The availability status rules (catch-up Phase 29; US-01.2.1, US-01.2.2):
 * lookups, behaviour by ID, the master's validator, ranges
 * and the seed's starting set.
 */

import { describe, expect, it } from 'vitest'
import {
  activeStatuses,
  anaesthetistChoices,
  defaultSlotStatus,
  displayStatusLabel,
  isClosed,
  isOpenForBooking,
  isOpenSlot,
  LIST_STATE_LABEL_MESSAGE,
  SEED_STATUS,
  slotsInRange,
  statusFor,
  validateAvailabilityRange,
  validateRetireSlotStatus,
  validateSlotStatusDraft,
  type SlotStatusDraft,
} from './slotStatus'
import { LIST_KINDS, LIST_STATES, STATUS_COLOUR_TOKENS, type SlotStatus } from './types'
import { SEED_SLOT_STATUSES, seedSlotStatusRecords } from './seed'

const seeded = seedSlotStatusRecords()
const free = seeded[SEED_STATUS.free]!
const holiday = seeded[SEED_STATUS.holiday]!
const unavailable = seeded[SEED_STATUS.unavailable]!

const draft = (over: Partial<SlotStatusDraft> = {}): SlotStatusDraft => ({
  label: 'Public hospital',
  longLabel: 'At the public hospital',
  description: 'Working at the public hospital. Same effect as Unavailable.',
  colour: 'unavailable',
  treatment: 'hatched',
  bookable: false,
  anaesthetistCanSet: true,
  isDefault: false,
  ...over,
})

describe('the seeded starting set (OQ-64, US-01.2.1)', () => {
  it('is Free (default), On holiday and Unavailable, with today\'s colours and treatments', () => {
    expect(SEED_SLOT_STATUSES.map((s) => [s.key, s.label, s.longLabel, s.colour, s.treatment, s.bookable])).toEqual([
      ['free', 'Free', 'Free', 'free', 'dashed', true],
      ['holiday', 'Holiday', 'On holiday', 'holiday', 'solid', false],
      ['unavailable', 'Unavailable', 'Unavailable', 'unavailable', 'hatched', false],
    ])
  })

  it('has exactly one default, and it is Free and bookable', () => {
    const defaults = SEED_SLOT_STATUSES.filter((s) => s.isDefault === true)
    expect(defaults.map((s) => s.key)).toEqual([SEED_STATUS.free])
    expect(defaultSlotStatus(seeded).bookable).toBe(true)
  })

  it('every colour is one of the six palette tokens', () => {
    for (const s of SEED_SLOT_STATUSES) expect(STATUS_COLOUR_TOKENS).toContain(s.colour)
  })

  it('no status key equals a List kind, and none seeds an emergency or extra kind of unavailable', () => {
    for (const s of SEED_SLOT_STATUSES) expect(LIST_KINDS as readonly string[]).not.toContain(s.key)
    expect(SEED_SLOT_STATUSES).toHaveLength(3)
  })

  it('no seeded key or label is a List state or its label (US-01.2.2)', () => {
    const words = [...LIST_STATES, 'DRAFT', 'DRAFT LIST']
    for (const s of SEED_SLOT_STATUSES) {
      for (const v of [s.key, s.label, s.longLabel]) expect(words).not.toContain(v.toUpperCase())
    }
  })

  it('offers anaesthetists exactly Free, On holiday, Unavailable, in that order', () => {
    expect(anaesthetistChoices(seeded).map((s) => s.longLabel)).toEqual(['Free', 'On holiday', 'Unavailable'])
  })
})

describe('lookups and behaviour by ID', () => {
  it('statusFor is undefined-safe; activeStatuses drops retired ones', () => {
    expect(statusFor(seeded, 'nope')).toBeUndefined()
    expect(statusFor(seeded, undefined)).toBeUndefined()
    const retired = { ...seeded, unavailable: { ...unavailable, retiredAtISO: '2026-07-21T09:00:00' } }
    expect(activeStatuses(retired).map((s) => s.key)).toEqual(['free', 'holiday'])
  })

  it('open and closed come from the bookable flag; an unknown status is closed', () => {
    expect(isOpenForBooking(free)).toBe(true)
    expect(isClosed(holiday)).toBe(true)
    expect(isClosed(unavailable)).toBe(true)
    expect(isClosed(undefined)).toBe(true)
  })

  it('isOpenSlot is no List and an open status', () => {
    expect(isOpenSlot({ status: 'free' }, undefined, seeded)).toBe(true)
    expect(isOpenSlot({ status: 'free' }, { id: 'L1' }, seeded)).toBe(false)
    expect(isOpenSlot({ status: 'holiday' }, undefined, seeded)).toBe(false)
  })

  it('labels: List kinds fixed, statuses from the record, unknown never the raw ID', () => {
    expect(displayStatusLabel('preop', seeded, true)).toBe('Pre-op Assessment')
    expect(displayStatusLabel('holiday', seeded, true)).toBe('On holiday')
    expect(displayStatusLabel('ST0042', seeded)).toBe('Unknown status')
  })
})

describe('US-01.2.2 criterion 1: a rename or recolour changes no rule', () => {
  it('gives the same open and closed results', () => {
    const renamed: SlotStatus = { ...unavailable, label: 'Blocked', longLabel: 'Blocked out', colour: 'holiday', treatment: 'solid' }
    const records = { ...seeded, unavailable: renamed }
    expect(isClosed(renamed)).toBe(isClosed(unavailable))
    expect(isOpenSlot({ status: 'unavailable' }, undefined, records)).toBe(false)
    expect(displayStatusLabel('unavailable', records)).toBe('Blocked')
  })
})

describe('validateSlotStatusDraft', () => {
  it('accepts a sound new status', () => {
    expect(validateSlotStatusDraft(draft(), seeded)).toEqual([])
  })

  it('checks lengths, dashes and the word slot', () => {
    expect(validateSlotStatusDraft(draft({ label: '' }), seeded)).toContain('Enter a label.')
    expect(validateSlotStatusDraft(draft({ label: 'A very long label here' }), seeded)).toContain('Keep the label to 16 characters.')
    expect(validateSlotStatusDraft(draft({ longLabel: 'x'.repeat(33) }), seeded)).toContain('Keep the long label to 32 characters.')
    expect(validateSlotStatusDraft(draft({ label: 'Off — away' }), seeded).join(' ')).toMatch(/long dash/)
    expect(validateSlotStatusDraft(draft({ label: 'Off – away' }), seeded).join(' ')).toMatch(/long dash/)
    const slotIssues = validateSlotStatusDraft(draft({ label: 'Blocked slot' }), seeded)
    expect(slotIssues.join(' ')).toMatch(/call each half-day a session/)
    // No validator message itself says the word (OQ-64).
    for (const issue of slotIssues) expect(issue).not.toMatch(/slot/i)
  })

  it('refuses a duplicate label among statuses in use (case-insensitive) and a List type name', () => {
    expect(validateSlotStatusDraft(draft({ label: 'holiday' }), seeded)).toContain('Another status is already called Holiday.')
    expect(validateSlotStatusDraft(draft({ label: 'Public' }), seeded).join(' ')).toMatch(/List type/)
    // Editing a status may keep its own label.
    expect(validateSlotStatusDraft({ ...draft(), label: 'Holiday', longLabel: 'On holiday' }, seeded, { key: 'holiday' })).toEqual([])
  })

  it('refuses a List state or its label, Draft and Draft List included (US-01.2.2)', () => {
    for (const label of ['Active', 'Submitted', 'Authorised', 'Draft', 'Draft List', 'ACTIVE']) {
      expect(validateSlotStatusDraft(draft({ label }), seeded), label).toContain(LIST_STATE_LABEL_MESSAGE)
    }
    expect(validateSlotStatusDraft(draft({ longLabel: 'submitted' }), seeded)).toContain(LIST_STATE_LABEL_MESSAGE)
  })

  it('keeps one bookable default', () => {
    expect(validateSlotStatusDraft(draft({ isDefault: true, bookable: false }), seeded)).toContain('The default status must be open for bookings.')
    const freeDraft = { ...draft(), label: 'Free', longLabel: 'Free', bookable: true, isDefault: false }
    expect(validateSlotStatusDraft(freeDraft, seeded, { key: 'free' }).join(' ')).toMatch(/one default status/)
  })

  it('checks the colour token and treatment', () => {
    expect(validateSlotStatusDraft(draft({ colour: 'crimson' as never }), seeded)).toContain('Choose one of the six status colours.')
    expect(validateSlotStatusDraft(draft({ treatment: 'dotted' as never }), seeded)).toContain('Choose solid, hatched or dashed.')
  })
})

describe('validateRetireSlotStatus', () => {
  it('never the default, never one an active series uses', () => {
    expect(validateRetireSlotStatus(seeded, 'free', { activeSeriesUsing: 0 }).join(' ')).toMatch(/default status cannot be retired/)
    expect(validateRetireSlotStatus(seeded, 'unavailable', { activeSeriesUsing: 2 })).toEqual(['2 repeating series use this status. Delete them first.'])
    expect(validateRetireSlotStatus(seeded, 'unavailable', { activeSeriesUsing: 0 })).toEqual([])
  })
})

describe('ranges', () => {
  const ctx = { todayISO: '2026-07-21', horizonEndISO: '2026-11-21' }
  it('refuses an end before the start, a past date and a date past the horizon', () => {
    expect(validateAvailabilityRange({ ...ctx, fromISO: '2026-08-10', toISO: '2026-08-09' })).toContain('The end date is before the start date.')
    expect(validateAvailabilityRange({ ...ctx, fromISO: '2026-07-20', toISO: '2026-07-22' }).join(' ')).toMatch(/from today on/)
    expect(validateAvailabilityRange({ ...ctx, fromISO: '2026-11-20', toISO: '2026-11-22' }).join(' ')).toMatch(/The schedule runs to Sat 21 Nov/)
    expect(validateAvailabilityRange({ ...ctx, fromISO: '2026-07-21', toISO: '2026-11-21' })).toEqual([])
  })

  it('enumerates the sessions, date then AM before PM', () => {
    expect(slotsInRange('2026-08-10', '2026-08-11', 'both')).toEqual([
      { dateISO: '2026-08-10', session: 'AM' },
      { dateISO: '2026-08-10', session: 'PM' },
      { dateISO: '2026-08-11', session: 'AM' },
      { dateISO: '2026-08-11', session: 'PM' },
    ])
    expect(slotsInRange('2026-08-10', '2026-08-23', 'both')).toHaveLength(28)
    expect(slotsInRange('2026-08-10', '2026-08-10', 'PM')).toEqual([{ dateISO: '2026-08-10', session: 'PM' }])
  })
})
