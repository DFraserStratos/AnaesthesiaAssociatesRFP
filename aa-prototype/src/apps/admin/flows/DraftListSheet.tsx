/**
 * New Draft List (catch-up Phase 31; US-01.6.1, OQ-44 answered): the office
 * logs a request that has no anaesthetist yet. Hospital, surgeon, day and
 * session are all required; the kind defaults to Private (Pre-op defaults the
 * location to AA rooms); the source records how it came in. Saving changes
 * nobody's schedule. Inline errors are the store's refusals.
 */

import { useEffect, useMemo, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { activeHospitals, activeSurgeons, createDraftList, scheduleHorizon, useAppStore, type Actor } from '../../../store'
import type { ListKind, RequestSource, Session } from '../../../domain/types'
import { Button, FormError, Segmented, SelectField, TextField } from '../../../shared/ui'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { DRAFT_LIST, SOURCE_LABELS } from '../../../shared/scheduleTerms'
import { withKind } from './AssignListFields'
import { useHospitalOptionLabel } from '../components/conflicts/ConflictCallout'
import { surgeonSpecialtyLabel, withSpecialties } from '../../../domain/specialties'
import { retiredLabel } from '../../../domain/masterLifecycle'

const KIND_OPTIONS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'preop', label: 'Pre-op' },
]
const SESSION_OPTIONS: { value: Session; label: string }[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
  // A Draft List can be for the evening (catch-up Phase 32c): it is assigned into an opened out-of-hours session.
  { value: 'OOH', label: 'Out-of-hours' },
]
const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as RequestSource[]).map((value) => ({ value, label: SOURCE_LABELS[value] }))

interface Draft {
  hospitalId: string
  surgeonId: string
  dateISO: string
  session: Session
  kind: ListKind
  source: RequestSource
  /** The address a PDF request arrived from (catch-up Phase 34; US-02.2.4): asked only when it came in by PDF. */
  senderEmail: string
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
  const specialties = useAppStore((s) => s.masters.specialties)
  const today = useAppStore((s) => s.clock.todayISO)
  const horizonEnd = useAppStore((s) => scheduleHorizon(s).endISO)
  const aaRoomsId = Object.values(hospitals).find((h) => h.locationType === 'aaRooms')?.id
  const blank = (): Draft => ({ hospitalId: '', surgeonId: '', dateISO: initialDateISO, session: 'AM', kind: 'private', source: 'phone', senderEmail: '', note: '' })
  const [draft, setDraft] = useState<Draft>(blank)
  const [error, setError] = useState<string | null>(null)
  // Closures are marked for the day chosen, not the day the sheet opened on.
  const optionLabel = useHospitalOptionLabel(draft.dateISO)
  // Pickers offer active masters only (catch-up Phase 42): a new request never names a retired record.
  const hospitalOptions = useMemo(() => activeHospitals({ masters: { hospitals } }, draft.hospitalId), [hospitals, draft.hospitalId])
  const surgeonOptions = useMemo(
    () => activeSurgeons({ masters: { surgeons } }, draft.surgeonId).sort((a, b) => a.name.localeCompare(b.name)),
    [surgeons, draft.surgeonId],
  )

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
      // The List records a PDF origin with this address (listOrigin.ts); other sources send none.
      ...(draft.source === 'pdf' && draft.senderEmail.trim() !== '' ? { senderEmail: draft.senderEmail } : {}),
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
          <OverlayHeader title={<>New {DRAFT_LIST}</>} />
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>A request with no anaesthetist yet.</div>
        </div>

        <SelectField label="Hospital" value={draft.hospitalId} onChange={(hospitalId) => update({ hospitalId })} shot="draft-list-hospital">
          <option value="" disabled>Choose a hospital</option>
          {hospitalOptions.map((h) => (
            <option key={h.id} value={h.id}>{optionLabel(h.id, retiredLabel(h.name, h))}</option>
          ))}
        </SelectField>

        {/* No anaesthetist yet, so no preference group: a plain list, by name. */}
        <SelectField label="Surgeon" value={draft.surgeonId} onChange={(surgeonId) => update({ surgeonId })} shot="draft-list-surgeon">
          <option value="" disabled>Choose a surgeon</option>
          {surgeonOptions.map((s) => (
            <option key={s.id} value={s.id}>{withSpecialties(retiredLabel(s.name, s), surgeonSpecialtyLabel({ specialties }, s))}</option>
          ))}
        </SelectField>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextField label="Day" type="date" value={draft.dateISO} min={today} max={horizonEnd} onChange={(dateISO) => update({ dateISO })} shot="draft-list-date" />
          </div>
          {/* `wrap` sizes each segment to its word, so "Out-of-hours" keeps one line and the row its 48px (U5). */}
          <Segmented label="Session" layout="wrap" value={draft.session} options={SESSION_OPTIONS} onChange={(session) => update({ session })} />
        </div>

        <Segmented label="Kind of List" value={draft.kind} options={KIND_OPTIONS} onChange={(kind) => setDraft((d) => withKind(d, kind, aaRoomsId))} />
        <Segmented label="Came in by" value={draft.source} options={SOURCE_OPTIONS} onChange={(source) => update({ source })} />
        {draft.source === 'pdf' && (
          <TextField
            label="Sent from"
            type="email"
            value={draft.senderEmail}
            onChange={(senderEmail) => update({ senderEmail })}
            placeholder="name@practice.example"
            hint="The address the PDF arrived from. Replies about this List go back to it."
            shot="draft-list-sender"
          />
        )}
        <TextField label="Note (optional)" value={draft.note} onChange={(note) => update({ note })} placeholder="What the rooms asked for" />

        <div style={{ fontSize: 13, color: neutral.slate }}>Saving does not change anyone's schedule. You can add Bookings before an anaesthetist is assigned.</div>
        <FormError message={error} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save}>Save {DRAFT_LIST}</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}
