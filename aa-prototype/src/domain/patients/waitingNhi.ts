/**
 * Intake rows waiting for an NHI (catch-up Phase 40; US-11.1.5). Pure.
 *
 * "Urgent when close" is our reading of the story's "when the List date
 * approaches": urgent within `WAITING_NHI_URGENT_WITHIN_DAYS` days of the
 * row's date, or once it has passed.
 */

import { daysBetween } from '../dateDays'
import type { IsoDate } from '../types'

export const WAITING_NHI_URGENT_WITHIN_DAYS = 3

export type WaitingNhiUrgency = 'urgent' | 'normal'

export function waitingNhiUrgency(dateISO: IsoDate, todayISO: IsoDate): WaitingNhiUrgency {
  return daysBetween(todayISO, dateISO) <= WAITING_NHI_URGENT_WITHIN_DAYS ? 'urgent' : 'normal'
}
