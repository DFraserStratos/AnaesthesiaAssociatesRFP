import { useEffect, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { GstPeriod } from '../../../domain/types'
import { addAnaesthetist, useAppStore, type Actor } from '../../../store'
import { Button, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { GST_OPTIONS } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  onClose: () => void
}

/**
 * Add an anaesthetist. On save the store extends the canvas forward for them
 * (2 Lists per day across the horizon), so the day grid immediately gains their
 * rows (D1). Reports the store `Outcome` refusal verbatim.
 */
export function AddAnaesthetistFlow({ open, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [unitValue, setUnitValue] = useState('30')
  const [gstPeriod, setGstPeriod] = useState<GstPeriod>('monthly')
  const [hpiId, setHpiId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRegistrationNumber('')
      setName('')
      setPhone('')
      setEmail('')
      setUnitValue('30')
      setGstPeriod('monthly')
      setHpiId('')
      setError(null)
      setResult(null)
    }
  }, [open])

  function save() {
    const uv = Number(unitValue)
    if (!Number.isFinite(uv) || uv <= 0) {
      setError('The unit value must be a number greater than zero.')
      return
    }
    const outcome = addAnaesthetist(useAppStore, actor, { registrationNumber, name, phone, email, unitValue: uv, gstPeriod, hpiId })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    setResult(`Added. ${outcome.value.generatedLists} forward list slots generated (2 per day).`)
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add an anaesthetist</div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Adding an anaesthetist extends the canvas forward for them, two list slots a day.</div>
        <TextField label="Registration number (ID)" value={registrationNumber} onChange={setRegistrationNumber} mono placeholder="e.g. 41552" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Dr Aroha Ngata" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Unit value ($)" value={unitValue} onChange={setUnitValue} mono />
        <Segmented label="GST period" value={gstPeriod} options={GST_OPTIONS} onChange={setGstPeriod} />
        <TextField label="HPI id (optional)" value={hpiId} onChange={setHpiId} />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        {result !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{result}</div>
            <Button variant="primary" block onClick={onClose}>Done</Button>
          </div>
        ) : (
          <Button variant="primary" block onClick={save}>Add anaesthetist</Button>
        )}
      </div>
    </Overlay>
  )
}
