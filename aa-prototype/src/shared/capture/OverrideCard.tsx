import { useEffect, useState } from 'react'
import { neutral, semantic } from '../../theme/tokens'
import type { PriceOverride, Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor } from '../../store'
import { Button, Segmented, TextField } from '../ui'
import { CaptureSection, Caption, FailureNotes } from './ui'

type OverrideMode = 'none' | 'adjustment' | 'charge'

interface OverrideCardProps {
  procedure: Procedure
  actor: Actor
  canCapture: boolean
  /** priceOverride failures (shown post-latch, verbatim). */
  failures: BillingValidationFailure[]
  onError: (message: string) => void
}

function modeOf(override: PriceOverride | undefined): OverrideMode {
  if (override === undefined) return 'none'
  if (override.kind === 'fixedFee') return 'charge'
  return 'adjustment'
}

/**
 * The legacy Outcome panel's Adj $ / Charge $ fields, modernised: they write
 * the Procedure's TYPED priceOverride (dollarAdjustment / fixedFee) with the
 * MANDATORY reason (7th review A6/B5 — "overrides should carry a reason").
 * Commits on Save, never per keystroke; the % variant is office-side
 * (Phase 06 carries the full typed editor).
 */
export function OverrideCard({ procedure, actor, canCapture, failures, onError }: OverrideCardProps) {
  const override = procedure.priceOverride
  const officePercent = override?.kind === 'percentAdjustment'

  const [mode, setMode] = useState<OverrideMode>(modeOf(override))
  const [amount, setAmount] = useState(
    override !== undefined && override.kind !== 'percentAdjustment' ? String(override.amount) : '',
  )
  const [reason, setReason] = useState(override?.reason ?? '')

  useEffect(() => {
    setMode(modeOf(procedure.priceOverride))
    setAmount(
      procedure.priceOverride !== undefined && procedure.priceOverride.kind !== 'percentAdjustment'
        ? String(procedure.priceOverride.amount)
        : '',
    )
    setReason(procedure.priceOverride?.reason ?? '')
  }, [procedure.id, procedure.priceOverride])

  const parsed = Number(amount)
  const amountValid =
    mode === 'none' ||
    (Number.isFinite(parsed) && (mode === 'charge' ? parsed > 0 : parsed !== 0))
  const reasonValid = mode === 'none' || reason.trim() !== ''
  const dirty =
    mode !== modeOf(override) ||
    (mode !== 'none' &&
      override !== undefined &&
      override.kind !== 'percentAdjustment' &&
      (parsed !== override.amount || reason.trim() !== override.reason)) ||
    (mode !== 'none' && override === undefined)

  function save() {
    const patch =
      mode === 'none'
        ? { priceOverride: undefined }
        : {
            priceOverride: {
              kind: mode === 'charge' ? ('fixedFee' as const) : ('dollarAdjustment' as const),
              amount: parsed,
              reason: reason.trim(),
            },
          }
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
  }

  if (officePercent) {
    return (
      <CaptureSection label="Adjustment and charge" gap={10}>
        <Caption color={neutral.slate}>
          A percentage adjustment set by the office applies ({override.percent > 0 ? '+' : ''}
          {override.percent}%): {override.reason}
        </Caption>
        <Caption>Percentage adjustments are set by the office.</Caption>
      </CaptureSection>
    )
  }

  if (!canCapture) {
    return (
      <CaptureSection label="Adjustment and charge" gap={10}>
        {override === undefined ? (
          <Caption>No price override.</Caption>
        ) : (
          <Caption color={neutral.slate}>
            {override.kind === 'fixedFee' ? 'Charge' : 'Adjustment'} ${override.amount.toFixed(2)} ·{' '}
            {override.reason}
          </Caption>
        )}
      </CaptureSection>
    )
  }

  return (
    <CaptureSection label="Adjustment and charge" gap={12}>
      <Segmented<OverrideMode>
        value={mode}
        options={[
          { value: 'none', label: 'None' },
          { value: 'adjustment', label: 'Adjustment $' },
          { value: 'charge', label: 'Charge $' },
        ]}
        onChange={setMode}
      />
      {mode !== 'none' && (
        <>
          <TextField
            label={mode === 'charge' ? 'Charge amount $' : 'Adjustment $ (negative reduces)'}
            value={amount}
            onChange={setAmount}
            mono
            placeholder={mode === 'charge' ? '450.00' : '-25.00'}
          />
          <TextField label="Reason (required)" value={reason} onChange={setReason} placeholder="Why the price differs" />
          {reason.trim() === '' && (
            <Caption color={semantic.warning.onTint}>A reason is required before the override can be saved.</Caption>
          )}
        </>
      )}
      <Button variant="secondary" block onClick={save} disabled={!amountValid || !reasonValid || !dirty}>
        {mode === 'none' ? 'Save (no override)' : 'Save override'}
      </Button>
      <Caption>Percentage adjustments are set by the office.</Caption>
      <FailureNotes failures={failures} />
    </CaptureSection>
  )
}
