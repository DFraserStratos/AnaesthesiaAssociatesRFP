import { isValid, parseISO } from 'date-fns'

/**
 * A date arriving from the URL (a `:dateISO` segment or a `?week=` param) is
 * untrusted: `format(parseISO('nope'))` throws. Anything that is not a real
 * `YYYY-MM-DD` is rejected here and the caller falls back to the demo clock.
 */
export function isISODate(value: string | null | undefined): value is string {
  if (value === null || value === undefined) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return isValid(parseISO(value))
}
