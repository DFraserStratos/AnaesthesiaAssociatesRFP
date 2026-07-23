import { useEffect, useState } from 'react'
import { accent, radius, semantic } from '../../../theme/tokens'
import { addHospitalHoliday, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { selectControlStyle as selectStyle } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Preselected hospital (from the Hospitals view). */
  hospitalId?: string
  onClose: () => void
}

/**
 * Add a hospital-closure holiday. On save the store reconciles it onto the
 * already-generated canvas, flagging booked lists at that hospital/date (the
 * Phase-06 amber conflict). Reports how many lists were flagged.
 */
export function AddHolidaySheet({ open, actor, hospitalId, onClose }: Props) {
  const { Overlay } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const [selected, setSelected] = useState(hospitalId ?? '')
  const [dateISO, setDateISO] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelected(hospitalId ?? '')
      setDateISO('')
      setName('')
      setError(null)
      setResult(null)
    }
  }, [open, hospitalId])

  function save() {
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
    setResult(`Holiday added. ${outcome.value.flaggedListCount} booked list${outcome.value.flaggedListCount === 1 ? '' : 's'} flagged.`)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add a hospital holiday</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Hospital</FieldLabel>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} style={selectStyle}>
            <option value="">Select a hospital</option>
            {Object.values(hospitals).map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>
        <TextField label="Date" value={dateISO} onChange={setDateISO} type="date" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Planned maintenance closure" />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        {result !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{result}</div>
            <Button variant="primary" block onClick={onClose}>Done</Button>
          </div>
        ) : (
          <Button variant="primary" block onClick={save}>Add holiday</Button>
        )}
      </div>
    </Overlay>
  )
}
