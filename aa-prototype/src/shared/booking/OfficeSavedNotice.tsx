/**
 * "Kirsty W. saved changes to this Booking: Time. View history" (catch-up
 * Phase 35): when another actor's save lands on the Booking while its screen
 * is open, one dismissible neutral line says so, on every surface. A notice,
 * not concurrency handling (US-02.5.6 is Future Work).
 */

import { useMemo, useRef, useState } from 'react'
import { useAppStore, lastChangeSetFor, type Actor } from '../../store'
import { Notice } from '../ui/Notice'
import { TextAction } from '../ui/TextAction'
import { fieldLabel } from '../audit/fieldLabels'

const NOTICE_LABELS: Record<string, string> = { scheduledTime: 'Time', notes: 'Notes', governingContractId: 'Contract', nhi: 'NHI' }

export function OfficeSavedNotice({ bookingId, actor, onViewHistory }: { bookingId: string; actor: Actor; onViewHistory: () => void }) {
  const audit = useAppStore((s) => s.audit)
  const latest = useMemo(() => lastChangeSetFor({ audit }, bookingId), [audit, bookingId])
  const header = latest === undefined ? undefined : audit[latest.index]
  const atMount = useRef(latest?.changeSetId ?? null)
  const [dismissed, setDismissed] = useState<string | null>(null)
  if (latest === undefined || latest.changeSetId === atMount.current || latest.changeSetId === dismissed || latest.who === actor.who) return null
  const fields = ((header?.after as { fields?: { field: string }[] } | undefined)?.fields ?? []).map((f) => NOTICE_LABELS[f.field] ?? fieldLabel(f.field))
  const unique = [...new Set(fields)]
  return (
    <Notice
      tone="neutral"
      live="status"
      shot="booking-office-saved"
      action={
        <TextAction size="sm" flush onClick={() => setDismissed(latest.changeSetId)}>
          Dismiss
        </TextAction>
      }
    >
      <span>
        {latest.who} saved changes to this Booking{unique.length > 0 ? `: ${unique.join(', ')}` : ''}.{' '}
        <TextAction size="sm" flush onClick={onViewHistory}>
          View history
        </TextAction>
      </span>
    </Notice>
  )
}
