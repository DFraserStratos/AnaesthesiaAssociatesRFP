/**
 * Local-naive ISO time helpers ('YYYY-MM-DDTHH:mm:ss', the demo clock's
 * shape). All shifts are STRING maths on the time-of-day — never
 * Date → toISOString, which would convert through UTC and corrupt stamps near
 * the NZ daylight-saving date (Sun 27 Sep 2026, inside the demo horizon).
 */

/** 'HH:mm' from a local-naive ISO datetime. */
export function isoTimeLabel(iso: string): string {
  return iso.slice(11, 16)
}

/** Shift a local-naive ISO datetime by whole minutes, clamped to its own day. */
export function shiftIsoMinutes(iso: string, deltaMin: number): string {
  const date = iso.slice(0, 10)
  const minutes = Number(iso.slice(11, 13)) * 60 + Number(iso.slice(14, 16)) + deltaMin
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes))
  const h = String(Math.floor(clamped / 60)).padStart(2, '0')
  const m = String(clamped % 60).padStart(2, '0')
  return `${date}T${h}:${m}:00`
}

/**
 * Elapsed whole minutes between two local-naive ISO datetimes. Uses the same
 * Date.parse arithmetic as the fee calculator's capturedMinutes, so the
 * duration strip always agrees with the calculator's time units.
 */
export function minutesBetweenIso(startIso: string, endIso: string): number {
  const span = (Date.parse(endIso) - Date.parse(startIso)) / 60000
  return Number.isFinite(span) ? span : 0
}

/** 'Xh Ym' duration label, e.g. "1 h 15 m". */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h} h ${m} m`
}
