import { useEffect, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Contract, Procedure } from '../../../domain/types'
import { INDIVIDUAL_ARRANGEMENT_MESSAGE, roundToCents } from '../../../domain/billing'
import { addBillingLine, useAppStore, type Actor } from '../../../store'
import { BottomSheet, MobileButton, TextField } from '../components'
import { Caption } from './ui'

type Basis = 'fixed' | 'rateTime'

interface AddBillingLineSheetProps {
  open: boolean
  procedure: Procedure
  contract?: Contract | undefined
  actor: Actor
  onClose: () => void
}

/**
 * The "add billing line" capture sheet (5th review #1 — the RFP's parallel
 * billing methods reach mobile here). An ancillary fixed amount is always
 * offered; rate x time (Method 3) only under a governing contract carrying
 * `permitsIndividualArrangement` — otherwise the option renders disabled with
 * the validator's exact sentence (the store guard repeats it: defence in
 * depth). The computed hours x rate amount previews live.
 */
export function AddBillingLineSheet({ open, procedure, contract, actor, onClose }: AddBillingLineSheetProps) {
  const rateTimePermitted = contract?.permitsIndividualArrangement === true

  const [basis, setBasis] = useState<Basis>('fixed')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setBasis('fixed')
      setDescription('')
      setAmount('')
      setHours('')
      setRate('')
      setError(null)
    }
  }, [open])

  const parsedAmount = Number(amount)
  const parsedHours = Number(hours)
  const parsedRate = Number(rate)
  const computed =
    Number.isFinite(parsedHours) && Number.isFinite(parsedRate) && parsedHours > 0 && parsedRate > 0
      ? roundToCents(parsedHours * parsedRate)
      : null

  const valid =
    description.trim() !== '' &&
    (basis === 'fixed'
      ? Number.isFinite(parsedAmount) && parsedAmount > 0
      : computed !== null)

  function add() {
    setError(null)
    const outcome = addBillingLine(useAppStore, actor, procedure.id, {
      chargeBasis: basis,
      description: description.trim(),
      ...(basis === 'fixed' ? { amount: parsedAmount } : { hours: parsedHours, rate: parsedRate }),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add billing line</div>

        <BasisOption
          title="Ancillary fixed amount"
          detail="A flat-fee line alongside the procedure, e.g. an ACC pre-op flat fee."
          selected={basis === 'fixed'}
          onSelect={() => setBasis('fixed')}
        />
        <BasisOption
          title="Rate × time (hourly)"
          detail={
            rateTimePermitted
              ? 'Hours × the individually arranged hourly rate (Method 3).'
              : INDIVIDUAL_ARRANGEMENT_MESSAGE
          }
          selected={basis === 'rateTime'}
          disabled={!rateTimePermitted}
          onSelect={() => setBasis('rateTime')}
        />

        <TextField label="Description" value={description} onChange={setDescription} placeholder="What this line charges" />

        {basis === 'fixed' ? (
          <TextField label="Amount $" value={amount} onChange={setAmount} mono placeholder="85.50" />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextField label="Hours" value={hours} onChange={setHours} mono placeholder="3.0" />
              <TextField label="Rate $/hour" value={rate} onChange={setRate} mono placeholder="480.00" />
            </div>
            <Caption color={neutral.slate}>
              {computed !== null ? (
                <>
                  {parsedHours.toFixed(1)} h × ${parsedRate.toFixed(2)} ={' '}
                  <strong className="mono" style={{ color: neutral.ink }}>${computed.toFixed(2)}</strong>
                </>
              ) : (
                'Enter the hours and the agreed hourly rate.'
              )}
            </Caption>
          </>
        )}

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}

        <MobileButton variant="primary" block onClick={add} disabled={!valid}>
          Add line
        </MobileButton>
      </div>
    </BottomSheet>
  )
}

function BasisOption({
  title,
  detail,
  selected,
  disabled,
  onSelect,
}: {
  title: string
  detail: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const inert = disabled === true
  return (
    <button
      type="button"
      disabled={inert}
      onClick={inert ? undefined : onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        textAlign: 'left',
        width: '100%',
        padding: '12px 14px',
        borderRadius: radius.ctl + 2,
        border: `1.5px solid ${selected && !inert ? accent.base : neutral.line}`,
        background: selected && !inert ? accent.tint : neutral.surface,
        fontFamily: 'inherit',
        cursor: inert ? 'default' : 'pointer',
        opacity: inert ? 0.65 : 1,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: inert ? neutral.mist : neutral.ink }}>{title}</span>
      <span style={{ fontSize: 12, lineHeight: '17px', color: inert ? neutral.mist : neutral.slate }}>{detail}</span>
    </button>
  )
}
