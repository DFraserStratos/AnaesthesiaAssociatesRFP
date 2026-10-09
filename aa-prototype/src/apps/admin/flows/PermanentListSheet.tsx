import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { ListKind, PermanentList, Session } from '../../../domain/types'
import { addPermanentList, editPermanentList, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { selectControlStyle as selectStyle } from './fieldChrome'
import { NotPreferredWarning, SurgeonPicker, useNotPreferredWarning } from '../components/pairing'

interface Props {
  open: boolean
  actor: Actor
  /** Present = edit; absent = add. */
  template?: PermanentList
  onClose: () => void
}

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

/** A recurring booking projects a private, public or pre-op List (catch-up Phase 28: free and leave are session statuses, never a template). */
const KINDS: { value: ListKind; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'preop', label: 'Pre-op' },
]

export function PermanentListSheet({ open, actor, template, onClose }: Props) {
  const { Overlay } = useSurface()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)

  const [anaesthetistId, setAnaesthetistId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [session, setSession] = useState<Session>('AM')
  const [kind, setKind] = useState<ListKind>('private')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Catch-up Phase 17: a not-preferred usual surgeon warns and never blocks;
  // on an edit, only a changed pairing warns (as only it is acknowledged).
  const pairingChanged = template === undefined || anaesthetistId !== template.anaesthetistId || surgeonId !== (template.surgeonId ?? '')
  const pairingWarning = useNotPreferredWarning(anaesthetistId !== '' ? anaesthetistId : undefined, pairingChanged ? surgeonId : undefined)

  useEffect(() => {
    if (!open) return
    setAnaesthetistId(template?.anaesthetistId ?? '')
    setDayOfWeek(template?.dayOfWeek ?? 1)
    setSession(template?.session ?? 'AM')
    setKind(template?.kind ?? 'private')
    setStartTime(template?.startTime ?? '')
    setEndTime(template?.endTime ?? '')
    setHospitalId(template?.hospitalId ?? '')
    setSurgeonId(template?.surgeonId ?? '')
    setNotes(template?.notes ?? '')
    setError(null)
  }, [open, template])

  function save() {
    if (anaesthetistId === '') {
      setError('Choose an anaesthetist.')
      return
    }
    const fields = {
      anaesthetistId,
      dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      session,
      kind,
      startTime,
      endTime,
      hospitalId: hospitalId === '' ? null : hospitalId,
      surgeonId: surgeonId === '' ? null : surgeonId,
      notes,
    }
    const outcome = template !== undefined
      ? editPermanentList(useAppStore, actor, template.id, fields)
      : addPermanentList(useAppStore, actor, fields)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{template !== undefined ? 'Edit permanent list' : 'Add permanent list'}</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Anaesthetist</FieldLabel>
          <select value={anaesthetistId} onChange={(e) => setAnaesthetistId(e.target.value)} style={selectStyle}>
            <option value="">Select an anaesthetist</option>
            {Object.values(anaesthetists).map((a) => (
              <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Day of week</FieldLabel>
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} style={selectStyle}>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <Segmented label="Session" value={session} options={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]} onChange={setSession} />
        <Segmented label="Kind of List" value={kind} options={KINDS} onChange={setKind} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Start (optional)</FieldLabel>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={selectStyle} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>End (optional)</FieldLabel>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={selectStyle} />
            </label>
          </div>
          <span style={{ fontSize: 12, color: neutral.slate }}>Leave blank for the default session times.</span>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Hospital (usual)</FieldLabel>
          <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} style={selectStyle}>
            <option value="">None (AA rooms)</option>
            {Object.values(hospitals).map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Usual surgeon</FieldLabel>
          <SurgeonPicker anaesthetistId={anaesthetistId !== '' ? anaesthetistId : undefined} value={surgeonId} onChange={setSurgeonId} emptyLabel="None" style={selectStyle} />
        </label>
        <TextField label="Display note (optional)" value={notes} onChange={setNotes} placeholder="e.g. Elective ortho" />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <NotPreferredWarning warning={pairingWarning} shot="permanent-list-pairing-warning" />
        <Button variant="primary" block onClick={save}>
          {pairingWarning !== null ? (template !== undefined ? 'Save anyway' : 'Add anyway') : template !== undefined ? 'Save changes' : 'Add permanent list'}
        </Button>
      </div>
    </Overlay>
  )
}
