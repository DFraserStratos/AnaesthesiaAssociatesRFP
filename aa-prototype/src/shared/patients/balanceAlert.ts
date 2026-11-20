/**
 * The anaesthetist's balance alert (catch-up Phase 40; US-11.3.2, FT-11.3,
 * US-15.0.6): the live `patientBalance` finding on a Booking in the viewer's
 * own List, with its strength and the short text that carries no name and no
 * amount. It ignores the office's clearance ("the alert stays until the
 * balance is paid"): Clear is the office's wave-through, not the
 * anaesthetist's. Read-only. In `src/shared` so the PWA ships it.
 */

import type { AppState } from '../../store/appStore'
import { warningsForBooking } from '../../store/warnings'
import { strongerOf } from '../../domain/warnings'

export type BalanceAlertState = Pick<AppState, 'schedule' | 'billing' | 'appSettings' | 'clock' | 'masters'>

export interface BalanceAlert {
  strength: 'none' | 'mild' | 'strong'
  /** The anaesthetist's wording (no name or amount); absent when there is no alert. */
  text?: string
}

const NONE: BalanceAlert = { strength: 'none' }

/** The alert on one Booking for the anaesthetist viewing it, or none on another anaesthetist's List. */
export function balanceAlertForBooking(state: BalanceAlertState, bookingId: string, viewerAnaesthetistId: string | undefined): BalanceAlert {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined || booking.balanceCheck === undefined) return NONE
  const list = state.schedule.lists[booking.listId]
  if (list === undefined || viewerAnaesthetistId === undefined || list.anaesthetistId !== viewerAnaesthetistId) return NONE
  const findings = warningsForBooking(state, bookingId).filter((w) => w.ruleId === 'patientBalance')
  if (findings.length === 0) return NONE
  const strongest = findings.reduce((s, w) => strongerOf(s, w.strength), findings[0]!.strength)
  const shown = findings.find((w) => w.strength === strongest)!
  return { strength: strongest, text: shown.shortText ?? shown.text }
}
