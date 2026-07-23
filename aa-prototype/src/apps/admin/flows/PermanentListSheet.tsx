import { useEffect, useState } from 'react'
import { radius, semantic } from '../../../theme/tokens'
import type { ListStatusKey, PermanentList, Session } from '../../../domain/types'
import { addPermanentList, editPermanentList, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { selectControlStyle as selectStyle } from './fieldChrome'

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

const STATUSES: ListStatusKey[] = ['private', 'public', 'preop', 'holiday', 'unavailable', 'free']

export function PermanentListSheet({ open, actor, template, onClose }: Props) {
  const { Overlay } = useSurface()
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const [anaesthetistId, setAnaesthetistId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [session, setSession] = useState<Session>('AM')
  const [statusKey, setStatusKey] = useState<ListStatusKey>('private')
  const [hospitalId, setHospitalId] = useState('')
  const [surgeonId, setSurgeonId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAnaesthetistId(template?.anaesthetistId ?? '')
    setDayOfWeek(template?.dayOfWeek ?? 1)
    setSession(template?.session ?? 'AM')
    setStatusKey(template?.statusKey ?? 'private')
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
      statusKey,
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Status</FieldLabel>
          <select value={statusKey} onChange={(e) => setStatusKey(e.target.value as ListStatusKey)} style={selectStyle}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
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
          <select value={surgeonId} onChange={(e) => setSurgeonId(e.target.value)} style={selectStyle}>
            <option value="">None</option>
            {Object.values(surgeons).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <TextField label="Display note (optional)" value={notes} onChange={setNotes} placeholder="e.g. Elective ortho" />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="primary" block onClick={save}>{template !== undefined ? 'Save changes' : 'Add permanent list'}</Button>
      </div>
    </Overlay>
  )
}
