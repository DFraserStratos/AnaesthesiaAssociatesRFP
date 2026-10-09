import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius } from '../../../theme/tokens'
import { addHospitalHoliday, deleteHospitalHoliday, editHospitalHoliday, listsFlaggedByHoliday, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, FormError, TextField, useSurface } from '../../../shared'
import { selectControlStyle as selectStyle } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Preselected hospital (add mode, from the Hospitals view or its calendar). */
  hospitalId?: string
  /** Preset date (add mode, from a calendar day). */
  dateISO?: string
  /** Edit mode: the holiday row to change or delete. */
  holidayId?: string
  onClose: () => void
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/**
 * A hospital closure (US-01.5.1, FT-01.5; catch-up Phase 30). Add mode takes
 * the hospital, date and name. Edit mode keeps the hospital fixed (moving a
 * closure to another hospital is delete and add), changes the date or name,
 * and deletes behind a confirmation that states how many flags clear. Flags
 * come from the one conflict rule, so the result lines count what the store
 * did.
 */
export function HolidaySheet({ open, actor, hospitalId, dateISO: presetDate, holidayId, onClose }: Props) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const existing = useAppStore((s) => (holidayId !== undefined ? s.masters.holidays[holidayId] : undefined))
  const flaggedNow = useAppStore((s) => (holidayId !== undefined ? listsFlaggedByHoliday(s, holidayId) : 0))
  const editing = holidayId !== undefined
  const [selected, setSelected] = useState(hospitalId ?? '')
  const [dateISO, setDateISO] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    const row = holidayId !== undefined ? useAppStore.getState().masters.holidays[holidayId] : undefined
    setSelected(row?.hospitalId ?? hospitalId ?? '')
    setDateISO(row?.dateISO ?? presetDate ?? '')
    setName(row?.name ?? '')
    setError(null)
    setResult(null)
    setConfirmDelete(false)
  }, [open, hospitalId, presetDate, holidayId])

  function save() {
    if (editing && holidayId !== undefined) {
      const out = editHospitalHoliday(useAppStore, actor, holidayId, { dateISO, name })
      if (!out.ok) {
        setError(out.message)
        return
      }
      setError(null)
      setResult(`Holiday updated. ${plural(out.value.flagged, 'List')} flagged, ${plural(out.value.resolved, 'flag')} cleared.`)
      return
    }
    if (selected === '') {
      setError('Choose a hospital.')
      return
    }
    const outcome = addHospitalHoliday(useAppStore, actor, selected, dateISO, name)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setResult(`Holiday added. ${plural(outcome.value.flaggedListCount, 'List')} flagged.`)
  }

  function remove() {
    if (holidayId === undefined) return
    const out = deleteHospitalHoliday(useAppStore, actor, holidayId)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setConfirmDelete(false)
    setResult(`Holiday deleted. ${plural(out.value.resolved, 'flag')} cleared.`)
  }

  const hospitalName = hospitals[selected]?.name ?? ''
  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot={editing ? 'holiday-edit-sheet' : 'holiday-add-sheet'} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Change a hospital holiday' : 'Add a hospital holiday'}</div>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Hospital</FieldLabel>
            <div style={{ fontSize: 15, color: neutral.ink }}>{hospitalName}</div>
            <div style={{ fontSize: 12, color: neutral.mist }}>To close a different hospital, delete this holiday and add one there.</div>
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Hospital</FieldLabel>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} style={selectStyle}>
              <option value="">Choose a hospital</option>
              {Object.values(hospitals).map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
        )}
        <TextField label="Date" value={dateISO} onChange={setDateISO} type="date" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Planned maintenance closure" />
        {editing && result === null && (
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            It flags {plural(flaggedNow, 'List')} now. Moving or deleting it clears those flags.
          </div>
        )}
        <FormError message={error} />
        {result !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div role="status" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{result}</div>
            <Button variant="primary" block onClick={onClose}>Done</Button>
          </div>
        ) : confirmDelete && existing !== undefined ? (
          <div data-shot="holiday-delete-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: neutral.bg, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, color: neutral.ink }}>
              Deleting {existing.name} on {format(parseISO(existing.dateISO), 'EEE d MMM')} clears {plural(flaggedNow, 'flagged List')}.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>Keep it</Button>
              <Button variant="primary" block onClick={remove}>Delete holiday</Button>
            </div>
          </div>
        ) : editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" block onClick={() => setConfirmDelete(true)}>Delete holiday</Button>
            <Button variant="primary" block onClick={save}>Save changes</Button>
          </div>
        ) : (
          <Button variant="primary" block onClick={save}>Add holiday</Button>
        )}
      </div>
    </Overlay>
  )
}
