import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { GstPeriod } from '../../../domain/types'
import { addAnaesthetist, useAppStore, useToday, type Actor } from '../../../store'
import { Button, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { GST_OPTIONS } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  onClose: () => void
}

/**
 * Add an anaesthetist. On save the store creates their sessions, an AM and a
 * PM a day, all free, from their start date (default the demo clock's today)
 * to the end of the schedule horizon (catch-up Phase 28; US-01.1.3), so the
 * day grid gains their row from that date. Reports the store `Outcome`
 * refusal verbatim.
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
  const todayISO = useToday()
  const [startDateISO, setStartDateISO] = useState(todayISO)
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
      setStartDateISO(todayISO)
      setError(null)
      setResult(null)
    }
  }, [open, todayISO])

  function save() {
    const uv = Number(unitValue)
    if (!Number.isFinite(uv) || uv <= 0) {
      setError('The unit value must be a number greater than zero.')
      return
    }
    const outcome = addAnaesthetist(useAppStore, actor, { registrationNumber, name, phone, email, unitValue: uv, gstPeriod, hpiId, startDateISO })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    const from = format(parseISO(outcome.value.fromISO), 'd MMM')
    setResult(
      outcome.value.generatedSlots > 0
        ? `Added. ${outcome.value.generatedSlots} forward sessions created from ${from}.`
        : `Added. Sessions start on ${format(parseISO(startDateISO), 'd MMM yyyy')}, when the schedule horizon reaches it.`,
    )
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add an anaesthetist</div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>Adding an anaesthetist creates their AM and PM sessions, free, from their start date.</div>
        <TextField label="Registration number (ID)" value={registrationNumber} onChange={setRegistrationNumber} mono placeholder="e.g. 41552" />
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Dr Nadia Kerr" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Unit value ($)" value={unitValue} onChange={setUnitValue} mono />
        <Segmented label="GST period" value={gstPeriod} options={GST_OPTIONS} onChange={setGstPeriod} />
        <TextField label="HPI CPN (optional)" value={hpiId} onChange={setHpiId} mono />
        <div data-shot="admin-add-anaesthetist-start">
          <TextField
            label="Start date"
            type="date"
            value={startDateISO}
            onChange={setStartDateISO}
            hint="Sessions are created from this date to the end of the schedule horizon."
          />
        </div>
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
