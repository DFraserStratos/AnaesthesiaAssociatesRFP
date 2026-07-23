import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { PriceOverride, Procedure } from '../../domain/types'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { Button, Segmented, TextField } from '../ui'
import { useSurface } from '../surface'

interface PriceOverrideSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

type Mode = 'none' | 'fixedFee' | 'dollarAdjustment' | 'percentAdjustment'

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fixedFee', label: 'Fixed fee' },
  { value: 'dollarAdjustment', label: '$ adjust' },
  { value: 'percentAdjustment', label: '% adjust' },
]

function modeOf(override: PriceOverride | undefined): Mode {
  return override?.kind ?? 'none'
}

/**
 * The office's FULL typed price-override editor (7th review A6/B5): fixed fee,
 * $ adjustment, or % adjustment, each demanding its mandatory reason. Mobile's
 * `OverrideCard` carries only the $ / fixed pair (% is office-side); this sheet
 * is the complete set, written to `priceOverride` via `editProcedure`.
 */
export function PriceOverrideSheet({ open, procedure, actor, onClose }: PriceOverrideSheetProps) {
  const { Overlay } = useSurface()
  const override = procedure.priceOverride
  const [mode, setMode] = useState<Mode>(modeOf(override))
  const [value, setValue] = useState(initialValue(override))
  const [reason, setReason] = useState(override?.reason ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode(modeOf(procedure.priceOverride))
      setValue(initialValue(procedure.priceOverride))
      setReason(procedure.priceOverride?.reason ?? '')
      setError(null)
    }
  }, [open, procedure])

  const parsed = Number(value)
  const numberValid =
    mode === 'none' ||
    (Number.isFinite(parsed) && (mode === 'fixedFee' ? parsed > 0 : parsed !== 0))
  const reasonValid = mode === 'none' || reason.trim() !== ''

  function save() {
    setError(null)
    let priceOverride: PriceOverride | undefined
    if (mode === 'fixedFee') priceOverride = { kind: 'fixedFee', amount: parsed, reason: reason.trim() }
    else if (mode === 'dollarAdjustment') priceOverride = { kind: 'dollarAdjustment', amount: parsed, reason: reason.trim() }
    else if (mode === 'percentAdjustment') priceOverride = { kind: 'percentAdjustment', percent: parsed, reason: reason.trim() }
    const patch: ProcedurePatch = { priceOverride }
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const numberLabel =
    mode === 'fixedFee'
      ? 'Fixed fee $'
      : mode === 'dollarAdjustment'
        ? 'Adjustment $ (negative reduces)'
        : 'Adjustment % (negative reduces)'

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Price override</div>
        <Segmented<Mode> label="Type" value={mode} options={MODE_OPTIONS} onChange={setMode} />
        {mode !== 'none' && (
          <>
            <TextField
              label={numberLabel}
              value={value}
              onChange={setValue}
              mono
              placeholder={mode === 'percentAdjustment' ? '-10' : mode === 'fixedFee' ? '450.00' : '-25.00'}
            />
            <TextField label="Reason (required)" value={reason} onChange={setReason} placeholder="Why the price differs" />
            {reason.trim() === '' && (
              <div style={{ fontSize: 12, color: semantic.warning.onTint }}>
                A reason is required before the override can be saved.
              </div>
            )}
          </>
        )}
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={save} disabled={!numberValid || !reasonValid}>
          {mode === 'none' ? 'Save (no override)' : 'Save override'}
        </Button>
        {mode === 'none' && override !== undefined && (
          <div style={{ fontSize: 12, color: neutral.mist }}>Saving with None removes the existing override.</div>
        )}
      </div>
    </Overlay>
  )
}

function initialValue(override: PriceOverride | undefined): string {
  if (override === undefined) return ''
  if (override.kind === 'percentAdjustment') return String(override.percent)
  return String(override.amount)
}
