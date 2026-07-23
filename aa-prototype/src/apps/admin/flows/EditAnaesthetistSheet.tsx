import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { Anaesthetist, GstPeriod } from '../../../domain/types'
import { editAnaesthetist, useAppStore, type Actor } from '../../../store'
import { Button, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { GST_OPTIONS } from './fieldChrome'

interface Props {
  open: boolean
  anaesthetist: Anaesthetist
  actor: Actor
  onClose: () => void
}

/** Edit an anaesthetist's unit value / contact / GST period / active flag (office-only). */
export function EditAnaesthetistSheet({ open, anaesthetist, actor, onClose }: Props) {
  const { Overlay } = useSurface()
  const [unitValue, setUnitValue] = useState(String(anaesthetist.unitValue))
  const [phone, setPhone] = useState(anaesthetist.phone)
  const [email, setEmail] = useState(anaesthetist.email)
  const [gstPeriod, setGstPeriod] = useState<GstPeriod>(anaesthetist.gstPeriod)
  const [active, setActive] = useState<'active' | 'inactive'>(anaesthetist.active ? 'active' : 'inactive')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setUnitValue(String(anaesthetist.unitValue))
      setPhone(anaesthetist.phone)
      setEmail(anaesthetist.email)
      setGstPeriod(anaesthetist.gstPeriod)
      setActive(anaesthetist.active ? 'active' : 'inactive')
      setError(null)
    }
  }, [open, anaesthetist])

  function save() {
    const uv = Number(unitValue)
    if (!Number.isFinite(uv) || uv <= 0) {
      setError('The unit value must be a number greater than zero.')
      return
    }
    const outcome = editAnaesthetist(useAppStore, actor, anaesthetist.registrationNumber, {
      unitValue: uv,
      phone,
      email,
      gstPeriod,
      active: active === 'active',
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{anaesthetist.name}</div>
        <div className="mono" style={{ fontSize: 12, color: neutral.mist }}>Registration {anaesthetist.registrationNumber} · HPI {anaesthetist.hpiId || 'not set'}</div>
        <TextField label="Unit value ($)" value={unitValue} onChange={setUnitValue} mono />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <Segmented label="GST period" value={gstPeriod} options={GST_OPTIONS} onChange={setGstPeriod} />
        <Segmented label="Status" value={active} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} onChange={setActive} />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="primary" block onClick={save}>Save changes</Button>
      </div>
    </Overlay>
  )
}
