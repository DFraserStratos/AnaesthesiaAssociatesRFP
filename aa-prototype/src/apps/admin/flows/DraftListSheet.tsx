/**
 * New Draft List (catch-up Phase 31; US-01.6.1, OQ-44 answered): the office
 * logs a request that has no anaesthetist yet. Hospital, surgeon, day and
 * session are all required; the kind defaults to Private (Pre-op defaults the
 * location to AA rooms); the source records how it came in. Saving changes
 * nobody's schedule. Inline errors are the store's refusals.
 */

import { useEffect, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { createDraftList, scheduleHorizon, useAppStore, type Actor } from '../../../store'
import type { ListKind, RequestSource, Session } from '../../../domain/types'
import { Button, FieldLabel, FormError, Segmented, TextField } from '../../../shared/ui'
import { useSurface } from '../../../shared/surface'
import { DRAFT_LIST, SOURCE_LABELS } from '../../../shared/scheduleTerms'
import { assignSelectStyle, withKind } from './AssignListFields'
import { useHospitalOptionLabel } from '../components/conflicts/ConflictCallout'

const KIND_OPTIONS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'preop', label: 'Pre-op' },
]
const SESSION_OPTIONS: { value: Session; label: string }[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]
const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as RequestSource[]).map((value) => ({ value, label: SOURCE_LABELS[value] }))

interface Draft {
  hospitalId: string
  surgeonId: string
  dateISO: string
  session: Session
  kind: ListKind
  source: RequestSource
  note: string
}

export function DraftListSheet({
  open,
  actor,
  initialDateISO,
  onClose,
  onCreated,
}: {
  open: boolean
  actor: Actor
  /** The Day view's date when opened from there. */
  initialDateISO: string
  onClose: () => void
  onCreated: (listId: string) => void
}) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const today = useAppStore((s) => s.clock.todayISO)
  const horizonEnd = useAppStore((s) => scheduleHorizon(s).endISO)
  const aaRoomsId = Object.values(hospitals).find((h) => h.locationType === 'aaRooms')?.id
  const blank = (): Draft => ({ hospitalId: '', surgeonId: '', dateISO: initialDateISO, session: 'AM', kind: 'private', source: 'phone', note: '' })
  const [draft, setDraft] = useState<Draft>(blank)
  const [error, setError] = useState<string | null>(null)
  // Closures are marked for the day chosen, not the day the sheet opened on.
  const optionLabel = useHospitalOptionLabel(draft.dateISO)

  useEffect(() => {
    if (open) {
      setDraft(blank())
      setError(null)
    }
    // Reset on opening only (a clock move while it is open keeps the form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const update = (next: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...next }))
    setError(null)
  }

  function save() {
    const out = createDraftList(useAppStore, actor, {
      hospitalId: draft.hospitalId,
      surgeonId: draft.surgeonId,
      dateISO: draft.dateISO,
      session: draft.session,
      kind: draft.kind,
      source: draft.source,
      ...(draft.note.trim() !== '' ? { note: draft.note } : {}),
    })
    if (!out.ok) {
      setError(out.message)
      return
    }
    onCreated(out.value.listId)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="admin-new-draft-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>New {DRAFT_LIST}</div>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>A request with no anaesthetist yet.</div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Hospital</FieldLabel>
          <select value={draft.hospitalId} onChange={(e) => update({ hospitalId: e.target.value })} style={assignSelectStyle} data-shot="draft-list-hospital">
            <option value="" disabled>Choose a hospital</option>
            {Object.values(hospitals).map((h) => (
              <option key={h.id} value={h.id}>{optionLabel(h.id, h.name)}</option>
            ))}
          </select>
        </label>

        {/* No anaesthetist yet, so no preference group: a plain list, by name. */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Surgeon</FieldLabel>
          <select value={draft.surgeonId} onChange={(e) => update({ surgeonId: e.target.value })} style={assignSelectStyle} data-shot="draft-list-surgeon">
            <option value="" disabled>Choose a surgeon</option>
            {Object.values(surgeons)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.specialty !== undefined ? ` (${s.specialty})` : ''}</option>
              ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <FieldLabel>Day</FieldLabel>
            <input type="date" value={draft.dateISO} min={today} max={horizonEnd} onChange={(e) => update({ dateISO: e.target.value })} style={assignSelectStyle} data-shot="draft-list-date" />
          </label>
          <Segmented label="Session" value={draft.session} options={SESSION_OPTIONS} onChange={(session) => update({ session })} />
        </div>

        <Segmented label="Kind of List" value={draft.kind} options={KIND_OPTIONS} onChange={(kind) => setDraft((d) => withKind(d, kind, aaRoomsId))} />
        <Segmented label="Came in by" value={draft.source} options={SOURCE_OPTIONS} onChange={(source) => update({ source })} />
        <TextField label="Note (optional)" value={draft.note} onChange={(note) => update({ note })} placeholder="What the rooms asked for" />

        <div style={{ fontSize: 13, color: neutral.slate }}>Saving does not change anyone's schedule. You can add Bookings before an anaesthetist is assigned.</div>
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" block onClick={save}>Save {DRAFT_LIST}</Button>
        </div>
      </div>
    </Overlay>
  )
}
