import { accent, neutral } from '../../../theme/tokens'
import type { CapturedUnits, Procedure, RvgCode } from '../../../domain/types'
import { ASA_SEED_UNITS, getModifierCode, type BtmBreakdown } from '../../../domain/billing'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../../store'
import { ModifierChips } from './ModifierChips'
import { MODIFIER_CHIP_LABELS } from './modifierLabels'
import { CaptureSection, StepperButton } from './ui'

type UnitsField = 'baseUnitsCaptured' | 'timeUnitsCaptured' | 'modifierUnitsCaptured'

interface UnitsCardProps {
  procedure: Procedure
  btm: BtmBreakdown
  baseCode?: RvgCode | undefined
  actor: Actor
  canCapture: boolean
  isAdditional: boolean
  onError: (message: string) => void
}

/**
 * The B / T / M stepper rows + modifier chips (mockup screen 3). Rows read the
 * RESOLVED values from the calculator's BtmBreakdown; a step always writes the
 * whole CapturedUnits from the resolved value ({units: resolved ± 1,
 * source: 'overridden'}, floor 0) — never from local state. Provenance is
 * captured fact: there is NO auto-clear on numeric equality (Phase 07's
 * "adjusted manually" flags key off it); the explicit "Use seeded value"
 * link is the only way back. On an additional procedure B and M render
 * value + caption with no buttons (the split-billing rule is structural).
 */
export function UnitsCard({ procedure, btm, baseCode, actor, canCapture, isAdditional, onError }: UnitsCardProps) {
  function write(patch: ProcedurePatch) {
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) onError(outcome.message)
  }

  function step(field: UnitsField, resolved: number, delta: number) {
    const captured: CapturedUnits = { units: Math.max(0, resolved + delta), source: 'overridden' }
    write({ [field]: captured })
  }

  function reset(field: UnitsField) {
    write({ [field]: undefined })
  }

  const mBreakdown = modifierBreakdown(procedure)

  return (
    <CaptureSection label="Units" gap={14}>
      <StepperRow
        title="B · Base"
        value={btm.base.units}
        overridden={btm.base.source === 'overridden'}
        seededCaption={isAdditional ? 'Not charged on an additional procedure' : 'From procedure code'}
        steppable={canCapture && !isAdditional}
        onStep={(delta) => step('baseUnitsCaptured', btm.base.units, delta)}
        onReset={canCapture && !isAdditional ? () => reset('baseUnitsCaptured') : undefined}
      />
      <StepperRow
        title="T · Time"
        value={btm.time.units}
        overridden={btm.time.source === 'overridden'}
        seededCaption="From start / finish stamps · part intervals round up (assumption)"
        steppable={canCapture}
        onStep={(delta) => step('timeUnitsCaptured', btm.time.units, delta)}
        onReset={canCapture ? () => reset('timeUnitsCaptured') : undefined}
      />
      <StepperRow
        title="M · Modifiers"
        value={btm.modifiers.units}
        overridden={btm.modifiers.source === 'overridden'}
        seededCaption={isAdditional ? 'Not charged on an additional procedure' : mBreakdown}
        steppable={canCapture && !isAdditional}
        onStep={(delta) => step('modifierUnitsCaptured', btm.modifiers.units, delta)}
        onReset={canCapture && !isAdditional ? () => reset('modifierUnitsCaptured') : undefined}
      />
      <ModifierChips
        procedure={procedure}
        baseCode={baseCode}
        actor={actor}
        disabled={!canCapture || isAdditional}
        onError={onError}
      />
    </CaptureSection>
  )
}

/** "AS1 +0 · A1 very old +1" — the M row's seeded composition. */
function modifierBreakdown(procedure: Procedure): string {
  const parts: string[] = []
  if (procedure.asaClass !== undefined) {
    parts.push(`${procedure.asaClass} +${ASA_SEED_UNITS[procedure.asaClass]}`)
  }
  for (const code of procedure.selectedModifierCodes) {
    if (code === procedure.asaClass) continue
    const modifier = getModifierCode(code)
    if (modifier === undefined) continue
    const label = MODIFIER_CHIP_LABELS[code]
    parts.push(`${code}${label !== undefined ? ` ${label.toLowerCase()}` : ''} +${modifier.units}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'None applied'
}

function StepperRow({
  title,
  value,
  overridden,
  seededCaption,
  steppable,
  onStep,
  onReset,
}: {
  title: string
  value: number
  overridden: boolean
  seededCaption: string
  steppable: boolean
  onStep: (delta: number) => void
  onReset: (() => void) | undefined
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        {overridden ? (
          <span style={{ fontSize: 12, color: neutral.slate }}>
            Adjusted manually
            {onReset !== undefined && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={onReset}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 600,
                    color: accent.base,
                    cursor: 'pointer',
                  }}
                >
                  Use seeded value
                </button>
              </>
            )}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: neutral.mist }}>{seededCaption}</span>
        )}
      </span>
      {steppable && <StepperButton glyph="−" onClick={() => onStep(-1)} disabled={value <= 0} />}
      <span className="mono" style={{ width: 36, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>
        {value}
      </span>
      {steppable && <StepperButton glyph="+" onClick={() => onStep(1)} />}
    </div>
  )
}
