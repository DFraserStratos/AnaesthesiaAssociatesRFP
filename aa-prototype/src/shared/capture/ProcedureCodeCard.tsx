import { useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { Procedure, RvgCode } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor } from '../../store'
import { CodePickerSheet } from './CodePickerSheet'
import { CaptureSection, Caption, FailureNotes, StepperButton } from './ui'

interface ProcedureCodeCardProps {
  procedure: Procedure
  baseCode?: RvgCode | undefined
  rvgCodes: Record<string, RvgCode>
  actor: Actor
  canCapture: boolean
  /** rvgBaseCode / baseUnitsSelected failures (shown post-latch, verbatim). */
  failures: BillingValidationFailure[]
  onError: (message: string) => void
}

/**
 * The RVG base-code card: mockup anatomy (mono code, name, base units,
 * "Change" opening the bottom-sheet picker). Picking a code clears the range
 * choice AND any B override so seeding re-derives from the new code. Range
 * codes prompt for an in-range value (RangeUnitsRow); codes that absorb
 * positioning say so.
 */
export function ProcedureCodeCard({
  procedure,
  baseCode,
  rvgCodes,
  actor,
  canCapture,
  failures,
  onError,
}: ProcedureCodeCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function pick(code: string) {
    setPickerOpen(false)
    const outcome = editProcedure(useAppStore, actor, procedure.id, {
      rvgBaseCode: code,
      baseUnitsSelected: undefined,
      baseUnitsCaptured: undefined,
    })
    if (!outcome.ok) onError(outcome.message)
  }

  function selectRangeUnits(next: number) {
    const outcome = editProcedure(useAppStore, actor, procedure.id, { baseUnitsSelected: next })
    if (!outcome.ok) onError(outcome.message)
  }

  const unitsLabel =
    baseCode === undefined
      ? undefined
      : baseCode.baseUnits.kind === 'single'
        ? `Base ${baseCode.baseUnits.units} units`
        : `Base ${baseCode.baseUnits.min} to ${baseCode.baseUnits.max} units`

  return (
    <CaptureSection label="Procedure code" gap={10}>
      <button
        type="button"
        onClick={canCapture ? () => setPickerOpen(true) : undefined}
        disabled={!canCapture}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          background: neutral.bg,
          border: `1px solid ${neutral.line}`,
          borderRadius: radius.ctl + 2,
          padding: '12px 14px',
          fontFamily: 'inherit',
          cursor: canCapture ? 'pointer' : 'default',
        }}
      >
        {baseCode !== undefined ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>
              {baseCode.code}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{baseCode.description}</span>
            <span style={{ fontSize: 12, color: neutral.mist }}>{unitsLabel}</span>
          </span>
        ) : (
          <span style={{ fontSize: 15, color: neutral.mist }}>
            {procedure.rvgBaseCode !== undefined
              ? `Code ${procedure.rvgBaseCode} is not in the RVG master`
              : 'No procedure code yet'}
          </span>
        )}
        {canCapture && (
          <span style={{ fontSize: 14, fontWeight: 600, color: accent.base, flex: 'none' }}>
            {baseCode !== undefined ? 'Change' : 'Choose'}
          </span>
        )}
      </button>

      {baseCode !== undefined && baseCode.baseUnits.kind === 'range' && (
        <RangeUnitsRow
          min={baseCode.baseUnits.min}
          max={baseCode.baseUnits.max}
          selected={procedure.baseUnitsSelected}
          canCapture={canCapture}
          onSelect={selectRangeUnits}
        />
      )}

      {baseCode !== undefined && baseCode.absorbsModifierCodes.includes('P1') && (
        <Caption>Includes positioning; P1 is not added separately.</Caption>
      )}

      <FailureNotes failures={failures} />

      <CodePickerSheet
        open={pickerOpen}
        {...(procedure.rvgBaseCode !== undefined ? { currentCode: procedure.rvgBaseCode } : {})}
        rvgCodes={rvgCodes}
        onPick={pick}
        onClose={() => setPickerOpen(false)}
      />
    </CaptureSection>
  )
}

/** Range codes prompt for a value within the range (steppers, clamped). */
function RangeUnitsRow({
  min,
  max,
  selected,
  canCapture,
  onSelect,
}: {
  min: number
  max: number
  selected: number | undefined
  canCapture: boolean
  onSelect: (next: number) => void
}) {
  function step(delta: number) {
    const next = selected === undefined ? min : Math.max(min, Math.min(max, selected + delta))
    onSelect(next)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, fontSize: 13, color: neutral.slate }}>
        Base {min} to {max} units ·{' '}
        {selected !== undefined ? (
          <strong style={{ color: neutral.ink }}>{selected} selected</strong>
        ) : (
          'choose a value'
        )}
      </span>
      {canCapture && (
        <>
          <StepperButton glyph="−" onClick={() => step(-1)} disabled={selected !== undefined && selected <= min} />
          <span className="mono" style={{ width: 32, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>
            {selected ?? '·'}
          </span>
          <StepperButton glyph="+" onClick={() => step(1)} disabled={selected !== undefined && selected >= max} />
        </>
      )}
    </div>
  )
}
