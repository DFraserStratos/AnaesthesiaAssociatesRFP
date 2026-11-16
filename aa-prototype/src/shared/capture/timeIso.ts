/**
 * Local-naive ISO time helpers ('YYYY-MM-DDTHH:mm:ss', the demo clock's
 * shape). All shifts are STRING maths on the time-of-day — never
 * Date → toISOString, which would convert through UTC and corrupt stamps near
 * the NZ daylight-saving date (Sun 27 Sep 2026, inside the demo horizon).
 */

import { hhmm } from '../../domain/dateText'

/** Shift a local-naive ISO datetime by whole minutes, clamped to its own day. */
export function shiftIsoMinutes(iso: string, deltaMin: number): string {
  const date = iso.slice(0, 10)
  const minutes = Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)) + deltaMin
  return `${date}T${hhmm(Math.max(0, Math.min(23 * 60 + 59, minutes)))}:00`
}

/**
 * Elapsed whole minutes between two local-naive ISO datetimes. Uses the same
 * Date.parse arithmetic as the fee calculator's capturedMinutes.
 */
export function minutesBetweenIso(startIso: string, endIso: string): number {
  const span = (Date.parse(endIso) - Date.parse(startIso)) / 60000
  return Number.isFinite(span) ? span : 0
}
