/**
 * One List's row on the phone's Lists tab (catch-up Phase 38a): the title,
 * subtitle, right-hand progress and quietness, built once so the main view and
 * the day view read the same List the same way (a pre-op List counts
 * appointments; a public List keeps its template label).
 */

import type { AssignedList, Booking, Hospital, Surgeon } from '../../../domain/types'
import type { ListProgress } from '../../../domain/listProgress'
import type { ListRowRight } from '../components'
import { locationName } from '../../../shared/format'
import { surgeonSpecialtyLabel, type Specialty } from '../../../domain/specialties'

export interface ListRowModel {
  title: string
  subtitle?: string
  right: ListRowRight
  /** A submitted List: less prominent, still editable. */
  quiet: boolean
}

function surgeonLine(l: AssignedList, surgeons: Readonly<Record<string, Surgeon>>, specialties: Readonly<Record<string, Specialty>>): string {
  // A public List keeps its template label ("Acute theatre"); a private one names its surgeon.
  const surgeon = l.kind !== 'private' && l.notes !== undefined ? undefined : surgeons[l.surgeonId]
  if (surgeon !== undefined) return [surgeon.name, surgeonSpecialtyLabel({ specialties }, surgeon)].filter((p) => p !== '').join(' · ')
  return l.notes ?? ''
}

export function listRowModel(
  l: AssignedList,
  activeBookings: readonly Pick<Booking, 'completed'>[],
  progress: ListProgress,
  masters: { hospitals: Readonly<Record<string, Hospital>>; surgeons: Readonly<Record<string, Surgeon>>; specialties: Readonly<Record<string, Specialty>> },
): ListRowModel {
  const total = activeBookings.length
  const done = activeBookings.filter((b) => b.completed).length
  const isPreop = l.kind === 'preop'
  const hospitalName = locationName(l.hospitalId, masters.hospitals)

  let right: ListRowRight
  let countInSubtitle = true
  if (progress === 'toFinish') right = { kind: 'toFinish', count: total - done }
  else if (progress === 'upcoming') {
    right = { kind: 'count', count: total, statusKey: l.kind }
    countInSubtitle = false
  } else right = { kind: 'progress', progress }

  const base = isPreop ? hospitalName : surgeonLine(l, masters.surgeons, masters.specialties)
  const unit = isPreop ? 'appointments' : 'bookings'
  const subtitle = countInSubtitle
    ? [base, `${total} ${total === 1 ? unit.replace(/s$/, '') : unit}`].filter(Boolean).join(' · ')
    : base || undefined
  return {
    title: isPreop ? 'Pre-op assessment' : hospitalName,
    ...(subtitle !== undefined ? { subtitle } : {}),
    right,
    quiet: progress === 'submitted',
  }
}
