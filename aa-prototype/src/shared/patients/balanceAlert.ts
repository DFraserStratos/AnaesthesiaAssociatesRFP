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
import { strongerOf, type Warning } from '../../domain/warnings'

export type BalanceAlertState = Pick<AppState, 'schedule' | 'billing' | 'appSettings' | 'clock' | 'masters'>

export interface BalanceAlert {
  strength: 'none' | 'mild' | 'strong'
  /** The anaesthetist's wording (no name or amount); absent when there is no alert. */
  text?: string
}

const NONE: BalanceAlert = { strength: 'none' }

/** The alert on one Booking for the anaesthetist viewing it, or none on another anaesthetist's List. */
export function balanceAlertForBooking(state: BalanceAlertState, bookingId: string, viewerAnaesthetistId: string | undefined): BalanceAlert {
  if (!viewerSeesAlert(state, bookingId, viewerAnaesthetistId)) return NONE
  return balanceAlertFromWarnings(state, bookingId, viewerAnaesthetistId, warningsForBooking(state, bookingId))
}

function viewerSeesAlert(state: Pick<AppState, 'schedule'>, bookingId: string, viewerAnaesthetistId: string | undefined): boolean {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined || booking.balanceCheck === undefined) return false
  const list = state.schedule.lists[booking.listId]
  return list !== undefined && viewerAnaesthetistId !== undefined && list.anaesthetistId === viewerAnaesthetistId
}

/**
 * The same alert from warnings already evaluated (a List's `useListWarnings`), so a List row never
 * runs the rules a second time.
 */
export function balanceAlertFromWarnings(
  state: Pick<AppState, 'schedule'>,
  bookingId: string,
  viewerAnaesthetistId: string | undefined,
  warnings: readonly Warning[],
): BalanceAlert {
  if (!viewerSeesAlert(state, bookingId, viewerAnaesthetistId)) return NONE
  const findings = warnings.filter((w) => w.ruleId === 'patientBalance' && w.bookingId === bookingId)
  if (findings.length === 0) return NONE
  const strongest = findings.reduce((s, w) => strongerOf(s, w.strength), findings[0]!.strength)
  const shown = findings.find((w) => w.strength === strongest)!
  return { strength: strongest, text: shown.shortText ?? shown.text }
}
