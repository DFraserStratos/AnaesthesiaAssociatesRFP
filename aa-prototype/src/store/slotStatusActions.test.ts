/**
 * The availability status master's actions (catch-up Phase 29; US-01.2.2):
 * office only, fixed IDs, validated, audited; a rename changes no rule and an
 * added status is usable at once.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { addSlotStatus, editSlotStatus, restoreSlotStatus, retireSlotStatus } from './slotStatusActions'
import { createAvailabilitySeries, deleteAvailabilitySeries, setAvailabilityRange } from './availabilityActions'
import { openSlotViews, slotViewsForDate } from './selectors'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { ANAE } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { isClosedKey, LIST_STATE_LABEL_MESSAGE, type SlotStatusDraft } from '../domain/slotStatus'

const OFFICE = OFFICE_ACTOR
const SOUTER = SOUTER_ACTOR

const publicHospital: SlotStatusDraft = {
  label: 'Public hospital',
  longLabel: 'At the public hospital',
  description: 'Working at the public hospital. Same effect as Unavailable.',
  colour: 'unavailable',
  treatment: 'hatched',
  bookable: false,
  anaesthetistCanSet: true,
  isDefault: false,
}

const draftOf = (key: string, api: ReturnType<typeof createAppStore>): SlotStatusDraft => {
  const s = api.getState().masters.slotStatuses[key]!
  return { label: s.label, longLabel: s.longLabel, description: s.description, colour: s.colour, treatment: s.treatment, bookable: s.bookable, anaesthetistCanSet: s.anaesthetistCanSet, isDefault: s.isDefault === true }
}

describe('availability status master actions', () => {
  it('is office only', () => {
    const api = createAppStore()
    const out = addSlotStatus(api, SOUTER, publicHospital)
    expect(out.ok ? 'ok' : out.code).toBe('officeOnly')
    expect(editSlotStatus(api, SOUTER, 'holiday', draftOf('holiday', api)).ok).toBe(false)
    expect(retireSlotStatus(api, SOUTER, 'holiday').ok).toBe(false)
  })

  it('an added status gets ST0001 and is usable at once, with the same effect as Unavailable (criterion 2)', () => {
    const api = createAppStore()
    const out = addSlotStatus(api, OFFICE, publicHospital)
    expect(out.ok && out.value.key).toBe('ST0001')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'availabilityStatus.create', entityId: 'ST0001' })
    const freeBefore = openSlotViews(api.getState(), '2026-08-14', 'PM').length
    const set = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-14', toISO: '2026-08-14', sessions: 'PM', statusKey: 'ST0001' })
    expect(set.ok).toBe(true)
    expect(api.getState().schedule.slots[slotIdFor(ANAE.souter, '2026-08-14', 'PM')]!.status).toBe('ST0001')
    expect(openSlotViews(api.getState(), '2026-08-14', 'PM').length).toBe(freeBefore - 1)
    expect(isClosedKey(api.getState().masters.slotStatuses, 'ST0001')).toBe(true)
    expect(addSlotStatus(api, OFFICE, { ...publicHospital, label: 'Lecturing', longLabel: 'Lecturing' }).ok && 'ST0002').toBe('ST0002')
  })

  it('an edit round-trips every editable field and never the key; a rename changes no rule (criterion 1)', () => {
    const api = createAppStore()
    const openBefore = slotViewsForDate(api.getState(), '2026-07-21').map((v) => [v.slot.id, v.open])
    const next: SlotStatusDraft = { ...draftOf('unavailable', api), label: 'Blocked', longLabel: 'Blocked out', description: 'Blocked.', colour: 'holiday', treatment: 'solid', anaesthetistCanSet: false }
    expect(editSlotStatus(api, OFFICE, 'unavailable', next).ok).toBe(true)
    const s = api.getState().masters.slotStatuses['unavailable']!
    expect(s).toMatchObject({ key: 'unavailable', label: 'Blocked', longLabel: 'Blocked out', description: 'Blocked.', colour: 'holiday', treatment: 'solid', anaesthetistCanSet: false, bookable: false })
    expect(slotViewsForDate(api.getState(), '2026-07-21').map((v) => [v.slot.id, v.open])).toEqual(openBefore)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'availabilityStatus.update', before: { label: 'Unavailable' }, after: { label: 'Blocked' } })
    // No change writes nothing.
    const n = api.getState().audit.length
    expect(editSlotStatus(api, OFFICE, 'unavailable', next).ok).toBe(true)
    expect(api.getState().audit.length).toBe(n)
  })

  it('surfaces the validator: List states, duplicates, dashes, "slot", one bookable default', () => {
    const api = createAppStore()
    for (const label of ['Active', 'Submitted', 'Authorised', 'Draft', 'Draft List']) {
      const out = addSlotStatus(api, OFFICE, { ...publicHospital, label })
      expect(out.ok ? '' : out.message, label).toContain(LIST_STATE_LABEL_MESSAGE)
    }
    const dup = addSlotStatus(api, OFFICE, { ...publicHospital, label: 'Holiday' })
    expect(dup.ok ? '' : dup.message).toMatch(/already called Holiday/)
    const dash = addSlotStatus(api, OFFICE, { ...publicHospital, label: 'Away — out' })
    expect(dash.ok ? '' : dash.message).toMatch(/long dash/)
    const word = addSlotStatus(api, OFFICE, { ...publicHospital, label: 'Blocked slot' })
    expect(word.ok ? '' : word.message).toMatch(/call each half-day a session/)
    expect(word.ok ? '' : word.message).not.toMatch(/slot/i)
    const notBookableDefault = editSlotStatus(api, OFFICE, 'free', { ...draftOf('free', api), bookable: false })
    expect(notBookableDefault.ok ? '' : notBookableDefault.message).toMatch(/default status must be open/)
  })

  it('making another status the default moves the default (exactly one)', () => {
    const api = createAppStore()
    addSlotStatus(api, OFFICE, { ...publicHospital, label: 'Open', longLabel: 'Open', bookable: true, colour: 'free', treatment: 'dashed', isDefault: true })
    const defaults = Object.values(api.getState().masters.slotStatuses).filter((s) => s.isDefault === true)
    expect(defaults.map((s) => s.key)).toEqual(['ST0001'])
  })

  it('retire then restore; never the default; never one an active series uses (with the count)', () => {
    const api = createAppStore()
    const free = retireSlotStatus(api, OFFICE, 'free')
    expect(free.ok ? '' : free.message).toMatch(/default status cannot be retired/)
    addSlotStatus(api, OFFICE, publicHospital)
    createAvailabilitySeries(api, SOUTER, { anaesthetistId: ANAE.souter, statusKey: 'ST0001', sessions: 'PM', weekdays: [5], everyWeeks: 2, startISO: '2026-07-31' })
    const used = retireSlotStatus(api, OFFICE, 'ST0001')
    expect(used.ok ? '' : used.message).toBe('1 repeating series uses this status. Delete it first.')
    deleteAvailabilitySeries(api, SOUTER, 'AS0001')
    setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-21', toISO: '2026-08-21', sessions: 'PM', statusKey: 'ST0001' })
    expect(retireSlotStatus(api, OFFICE, 'ST0001').ok).toBe(true)
    const st = api.getState()
    expect(st.masters.slotStatuses['ST0001']!.retiredAtISO).toBeDefined()
    // A session already carrying it keeps it; it is no longer offered.
    expect(st.schedule.slots[slotIdFor(ANAE.souter, '2026-08-21', 'PM')]!.status).toBe('ST0001')
    const refused = setAvailabilityRange(api, SOUTER, { anaesthetistId: ANAE.souter, fromISO: '2026-08-28', toISO: '2026-08-28', sessions: 'PM', statusKey: 'ST0001' })
    expect(refused.ok ? '' : refused.code).toBe('statusRetired')
    expect(restoreSlotStatus(api, OFFICE, 'ST0001').ok).toBe(true)
    expect(api.getState().masters.slotStatuses['ST0001']!.retiredAtISO).toBeUndefined()
    expect(api.getState().audit.slice(-2).map((a) => a.action)).toEqual(['availabilityStatus.retire', 'availabilityStatus.restore'])
  })
})
