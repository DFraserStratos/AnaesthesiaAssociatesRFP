/**
 * The fields that turn a free session into a List (catch-up Phase 28;
 * US-01.3.3): hospital and surgeon, both required, the kind and an optional
 * note. Shared by Assign List and Book (phone advice), so the two can never
 * ask differently. The surgeon choice is Phase 17's `SurgeonPicker` (the
 * not-preferred surgeons for this anaesthetist in their own group); a
 * not-preferred choice warns in the caller, never blocks.
 */

import { neutral, radius } from '../../../theme/tokens'
import type { ListKind } from '../../../domain/types'
import { useAppStore } from '../../../store'
import { FieldLabel, Segmented, TextField } from '../../../shared/ui'
import { SurgeonPicker } from '../components/pairing'

export interface AssignDraft {
  hospitalId: string
  surgeonId: string
  kind: ListKind
  notes: string
}

export function emptyAssignDraft(initialSurgeonId?: string): AssignDraft {
  return { hospitalId: '', surgeonId: initialSurgeonId ?? '', kind: 'private', notes: '' }
}

/** The inline errors, in field order (the store refuses the same cases). */
export function assignDraftError(draft: AssignDraft): string | null {
  if (draft.hospitalId === '') return 'Choose the hospital.'
  if (draft.surgeonId === '') return 'Choose the surgeon.'
  return null
}

export const assignSelectStyle = {
  minHeight: 44,
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 14,
} as const

/** Pre-op Lists come only from recurring bookings until Phase 31's pairing decision. */
const KIND_OPTIONS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
]

export function AssignListFields({
  anaesthetistId,
  dateISO,
  draft,
  onChange,
  withNote = true,
}: {
  anaesthetistId: string
  dateISO: string
  draft: AssignDraft
  onChange: (next: AssignDraft) => void
  withNote?: boolean
}) {
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const holiday = useAppStore((s) =>
    draft.hospitalId === '' ? undefined : Object.values(s.masters.holidays).find((h) => h.hospitalId === draft.hospitalId && h.dateISO === dateISO),
  )
  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Hospital</FieldLabel>
        <select value={draft.hospitalId} onChange={(e) => onChange({ ...draft, hospitalId: e.target.value })} style={assignSelectStyle} data-shot="assign-hospital">
          <option value="">Choose a hospital</option>
          {Object.values(hospitals).map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        {holiday !== undefined && (
          <span style={{ fontSize: 12, color: neutral.slate }}>
            Closed that day ({holiday.name}). The List is flagged for the office, not blocked.
          </span>
        )}
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Surgeon</FieldLabel>
        <SurgeonPicker
          anaesthetistId={anaesthetistId}
          value={draft.surgeonId}
          onChange={(surgeonId) => onChange({ ...draft, surgeonId })}
          emptyLabel="Choose a surgeon"
          optionLabel={(s) => `${s.name}${s.specialty !== undefined ? ` (${s.specialty})` : ''}`}
          style={assignSelectStyle}
        />
      </label>

      <Segmented label="Kind of List" value={draft.kind} options={KIND_OPTIONS} onChange={(kind) => onChange({ ...draft, kind })} />

      {withNote && <TextField label="Note (optional)" value={draft.notes} onChange={(notes) => onChange({ ...draft, notes })} placeholder="For the office" />}
    </>
  )
}
