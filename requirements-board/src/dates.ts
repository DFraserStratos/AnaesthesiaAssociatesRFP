/**
 * Dates and times as the board writes them, always New Zealand English: a 24-hour clock, the year
 * only when it is not this one.
 */

const LOCALE = 'en-NZ'

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** A day heading: Today, Yesterday, else "Wed 5 Nov". */
export function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (sameDay(d, now)) return 'Today'
  if (sameDay(d, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return 'Yesterday'
  return d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

/** A time of day: "14:03". */
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })

/** A day and time on one line, for a commit: "5 Nov, 14:03". */
export function dateTimeLabel(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })
  return `${day}, ${timeLabel(iso)}`
}
