/**
 * The inline conflict warning before confirm (catch-up Phase 30; US-01.5.2
 * AC3, OQ-09 soft warning): the closure or the unavailability an assignment,
 * phone booking, edit or move would land on, in the warning tint. It never
 * disables the confirm: the office goes ahead and the List is flagged.
 */

import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { conflictPreview, describeConflict, type ExpectedConflict } from '../../../../domain/conflicts'
import { useAppStore, useConflictLookups } from '../../../../store'
import { radius, semantic } from '../../../../theme/tokens'

/** The conflicts a target would raise (`conflictPreview` over the live records). */
export function useConflictPreview(target: { dateISO: string; hospitalId?: string; slotId?: string } | null): ExpectedConflict[] {
  const slots = useAppStore((s) => s.schedule.slots)
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const holidays = useAppStore((s) => s.masters.holidays)
  const dateISO = target?.dateISO
  const hospitalId = target?.hospitalId
  const slotId = target?.slotId
  return useMemo(() => {
    if (dateISO === undefined) return []
    const slot = slotId !== undefined ? slots[slotId] : undefined
    return conflictPreview({ dateISO, hospitalId: hospitalId === '' ? undefined : hospitalId, slot, statuses, holidays })
  }, [dateISO, hospitalId, slotId, slots, statuses, holidays])
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
  anaesthetistId,
  hospitalId,
  subject = 'List',
  shot = 'conflict-warning',
}: {
  conflicts: readonly ExpectedConflict[]
  anaesthetistId: string | undefined
  hospitalId?: string
  /** What is accepted and flagged: the List, or a Booking on it. */
  subject?: 'List' | 'Booking'
  shot?: string
}) {
  const lookups = useConflictLookups()
  if (conflicts.length === 0) return null
  const tail = subject === 'Booking' ? 'The Booking will be accepted and the List flagged as a conflict.' : 'The List will be accepted and flagged as a conflict.'
  return (
    <div
      role="status"
      data-shot={shot}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: '12px 14px', fontSize: 13, lineHeight: '18px' }}
    >
      <TriangleAlert size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: semantic.warning.solid }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {conflicts.map((c) => (
          <strong key={c.cause} style={{ fontWeight: 600 }}>
            {describeConflict(c, { anaesthetistId, hospitalId: hospitalId ?? '' }, lookups).detail}
          </strong>
        ))}
        <span>{tail} You can still go ahead.</span>
      </div>
    </div>
  )
}
