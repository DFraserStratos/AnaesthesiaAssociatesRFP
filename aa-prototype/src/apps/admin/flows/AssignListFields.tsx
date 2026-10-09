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
import { ConflictCallout, useConflictPreview, useHospitalOptionLabel } from '../components/conflicts/ConflictCallout'

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

/**
 * Every kind of List (catch-up Phase 31 supersedes Phase 28's interim "pre-op
 * only from recurring bookings"): a pre-op clinic is held at the AA rooms
 * location and names its surgeon, like any List (US-01.3.1).
 */
const KIND_OPTIONS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'preop', label: 'Pre-op' },
]

/** Switching to Pre-op defaults the location to AA rooms (the office can still change it); other kinds keep the choice. */
export function withKind<D extends { kind: ListKind; hospitalId: string }>(draft: D, kind: ListKind, aaRoomsId: string | undefined): D {
  if (kind === 'preop' && draft.kind !== 'preop' && aaRoomsId !== undefined) return { ...draft, kind, hospitalId: aaRoomsId }
  return { ...draft, kind }
}

export function AssignListFields({
  anaesthetistId,
  dateISO,
  draft,
  onChange,
  withNote = true,
  slotId,
  subject = 'List',
}: {
  anaesthetistId: string
  dateISO: string
  draft: AssignDraft
  onChange: (next: AssignDraft) => void
  withNote?: boolean
  /** The session being filled: its closed status warns before confirm (catch-up Phase 30). */
  slotId?: string
  /** What the warning says is accepted and flagged (phone advice: the Booking). */
  subject?: 'List' | 'Booking'
}) {
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const aaRoomsId = Object.values(hospitals).find((h) => h.locationType === 'aaRooms')?.id
  // Soft warning only (OQ-09): the closure or unavailability this would land
  // on, before confirm, never disabling it (US-01.5.2 AC3).
  const conflicts = useConflictPreview({ dateISO, hospitalId: draft.hospitalId, ...(slotId !== undefined ? { slotId } : {}) })
  const optionLabel = useHospitalOptionLabel(dateISO)
  return (
    <>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <FieldLabel>Hospital</FieldLabel>
        <select value={draft.hospitalId} onChange={(e) => onChange({ ...draft, hospitalId: e.target.value })} style={assignSelectStyle} data-shot="assign-hospital">
          <option value="" disabled>Choose a hospital</option>
          {Object.values(hospitals).map((h) => (
            <option key={h.id} value={h.id}>{optionLabel(h.id, h.name)}</option>
          ))}
        </select>
      </label>
      <ConflictCallout conflicts={conflicts} anaesthetistId={anaesthetistId} hospitalId={draft.hospitalId} subject={subject} shot={subject === 'Booking' ? 'phone-advice-conflict-warning' : 'assign-list-conflict-warning'} />

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

      <Segmented label="Kind of List" value={draft.kind} options={KIND_OPTIONS} onChange={(kind) => onChange(withKind(draft, kind, aaRoomsId))} />

      {withNote && <TextField label="Note (optional)" value={draft.notes} onChange={(notes) => onChange({ ...draft, notes })} placeholder="For the office" />}
    </>
  )
}
