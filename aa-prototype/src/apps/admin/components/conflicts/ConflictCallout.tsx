/**
 * The inline conflict warning before confirm (catch-up Phase 30; US-01.5.2,
 * OQ-09 soft warning): the hospital closure an assignment, phone booking or
 * edit would land on, in the warning tint. It never disables the confirm: the
 * office goes ahead and the List is flagged. A closed session is never a
 * conflict (D59): the store refuses it instead (catch-up Phase 32b).
 */

import { useMemo } from 'react'
import { conflictPreview, describeConflict, type ExpectedConflict } from '../../../../domain/conflicts'
import { useAppStore, useConflictLookups } from '../../../../store'
import { Notice } from '../../../../shared/ui/Notice'

/** The conflicts a target would raise (`conflictPreview` over the live records). */
export function useConflictPreview(target: { dateISO: string; hospitalId?: string } | null): ExpectedConflict[] {
  const holidays = useAppStore((s) => s.masters.holidays)
  const dateISO = target?.dateISO
  const hospitalId = target?.hospitalId
  return useMemo(() => {
    if (dateISO === undefined) return []
    return conflictPreview({ dateISO, hospitalId: hospitalId === '' ? undefined : hospitalId, holidays })
  }, [dateISO, hospitalId, holidays])
}

/** "Southern Cross · closed" in a hospital select when that hospital is closed on the date. */
export function useHospitalOptionLabel(dateISO: string | undefined): (hospitalId: string, name: string) => string {
  const holidays = useAppStore((s) => s.masters.holidays)
  const closed = useMemo(() => {
    const set = new Set<string>()
    if (dateISO !== undefined) for (const h of Object.values(holidays)) if (h.dateISO === dateISO) set.add(h.hospitalId)
    return set
  }, [holidays, dateISO])
  return (hospitalId, name) => (closed.has(hospitalId) ? `${name} · closed` : name)
}

export function ConflictCallout({
  conflicts,
  hospitalId,
  subject = 'List',
  shot = 'conflict-warning',
}: {
  conflicts: readonly ExpectedConflict[]
  hospitalId?: string
  /** What is accepted and flagged: the List, or a Booking on it. */
  subject?: 'List' | 'Booking'
  shot?: string
}) {
  const lookups = useConflictLookups()
  if (conflicts.length === 0) return null
  const tail = subject === 'Booking' ? 'The Booking will be accepted and the List flagged as a conflict.' : 'The List will be accepted and flagged as a conflict.'
  return (
    <Notice tone="warning" live="status" shot={shot}>
      {conflicts.map((c) => (
        <strong key={c.cause} style={{ fontWeight: 600 }}>
          {describeConflict(c, { hospitalId: hospitalId ?? '' }, lookups).detail}
        </strong>
      ))}
      <span>{tail} You can still go ahead.</span>
    </Notice>
  )
}
