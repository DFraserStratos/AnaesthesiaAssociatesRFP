/**
 * The Slot module (catch-up Phase 28; EP-01, FT-01.1, FT-01.2, US-01.2.3,
 * US-01.1.4, US-01.4.2; OQ-17, OQ-27 and OQ-64, answered). Pure: no React, no
 * store, no clock reads.
 *
 * A Slot is the AM or PM half-day an active anaesthetist has on every day of
 * the schedule horizon, from their start date. It is a box with a status (free
 * by default) and can be empty. A List is put into exactly one Slot and then
 * shows in place of the Slot's status. "Slot" is a code and planning word: the
 * UI says session, AM or PM, and never "slot" (OQ-64).
 */

import type { DisplayKey, List, ScheduleSettings, Session, Slot } from './types'
import { DEFAULT_HORIZON_MONTHS } from './clock'

/**
 * The seeded schedule settings (FT-01.1, US-01.1.4): four months, and the
 * default session times the generator used to write (AM 07:30 to 12:30, PM
 * 13:00 to 17:30). The one home for these values.
 */
export function defaultScheduleSettings(): ScheduleSettings {
  return {
    horizonMonths: DEFAULT_HORIZON_MONTHS,
    defaultTimes: {
      AM: { startTime: '07:30', endTime: '12:30' },
      PM: { startTime: '13:00', endTime: '17:30' },
    },
  }
}

/** Deterministic Slot id: `S-<registration>-<date>-<AM|PM>`. Never parsed to infer an entity type. */
export function slotIdFor(anaesthetistId: string, dateISO: string, session: Session): string {
  return `S-${anaesthetistId}-${dateISO}-${session}`
}

/**
 * The id of a List the recurring-booking projection (or the seed) creates:
 * `L-<registration>-<date>-<AM|PM>`. It names the Slot the List was BORN in,
 * so a reassigned List keeps an id that no longer matches its Slot. Used only
 * by the projection and the seed; never parse it to find a List's current Slot
 * (read `list.slotId`). Lists created at runtime take `LG####` instead.
 */
export function projectedListId(anaesthetistId: string, dateISO: string, session: Session): string {
  return `L-${anaesthetistId}-${dateISO}-${session}`
}

/**
 * THE displayed status of a session, in all three apps and every finder: the
 * List's kind when a List is in the Slot (the List shows in place of the
 * status, US-01.2.3 and FT-01.2), the Slot's own status otherwise. It takes no
 * Bookings, so the status can never be derived from booking activity. The
 * labels, colours and "open" test live with the status master in
 * `domain/slotStatus.ts` (`displayStatusLabel`, `isOpenSlot`; catch-up Phase 29).
 */
export function displayStatusKey(slot: Pick<Slot, 'status'>, list: Pick<List, 'kind'> | undefined): DisplayKey {
  return list !== undefined ? list.kind : slot.status
}

export interface EffectiveSlotTimes {
  startTime: string
  endTime: string
  /** True when the Slot carries its own times rather than the settings default. */
  overridden: boolean
}

/**
 * A session's times (US-01.1.4): the Slot's own override where set, else the
 * schedule settings' default for its session. Slots without an override follow
 * a default change at once.
 */
export function effectiveSlotTimes(
  slot: Pick<Slot, 'session' | 'startTime' | 'endTime'>,
  settings: Pick<ScheduleSettings, 'defaultTimes'>,
): EffectiveSlotTimes {
  const defaults = settings.defaultTimes[slot.session]
  const overridden = slot.startTime !== undefined || slot.endTime !== undefined
  return {
    startTime: slot.startTime ?? defaults.startTime,
    endTime: slot.endTime ?? defaults.endTime,
    overridden,
  }
}

/** The dates on or after an anaesthetist's start date (US-01.1.3). */
export function slotDatesFor(startDateISO: string, datesISO: readonly string[]): string[] {
  return datesISO.filter((d) => d >= startDateISO)
}

/** `HH:mm`, 00:00 to 23:59. */
export function isWallTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}
