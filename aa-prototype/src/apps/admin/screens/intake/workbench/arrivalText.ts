/**
 * The opened arrival's header words (27 Nov 2026 rebuild; O1): the List's name, how far off surgery is and when it
 * arrived. Plain functions, so the page only lays them out.
 */

import { longDayNoYear } from '../../../../../domain/dateText'
import type { ArrivalItem } from '../../../../../domain/intake/arrivals'
import { hhmm, receivedDay } from '../../../../../shared/format'

const SESSION_WORDS = { AM: 'AM', PM: 'PM', OOH: 'out of hours' } as const

/** "surgery in 22 days", "surgery tomorrow", "surgery today", "surgery was 2 days ago"; undefined with no date. */
export function surgeryWhenText(days: number | undefined): string | undefined {
  if (days === undefined) return undefined
  if (days === 0) return 'surgery today'
  if (days === 1) return 'surgery tomorrow'
  if (days > 1) return `surgery in ${days} days`
  return days === -1 ? 'surgery was yesterday' : `surgery was ${-days} days ago`
}

/** "received today at 08:12", "received Mon 23 Nov at 16:40". */
export function receivedWhenText(iso: string, todayISO: string): string {
  return iso.slice(0, 10) === todayISO.slice(0, 10) ? `received today at ${hhmm(iso)}` : `received ${receivedDay(iso)} at ${hhmm(iso)}`
}

/** The page title: "Mr Nand, Forte Health, Wednesday 16 December PM"; an unreadable PDF or held message, its file or message. */
export function arrivalTitleText(item: ArrivalItem, hospitalName: string | undefined): string {
  if (item.kind === 'unreadable' || item.kind === 'held' || item.dateISO === undefined) return item.title
  const who = item.title.split(' · ')[0] ?? item.title
  const when = `${longDayNoYear(item.dateISO)}${item.session !== undefined ? ` ${SESSION_WORDS[item.session]}` : ''}`
  return [who, hospitalName, when].filter((p) => p !== undefined && p !== '').join(', ')
}

