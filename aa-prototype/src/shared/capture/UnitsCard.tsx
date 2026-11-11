import { accent, neutral, semantic } from '../../theme/tokens'
import type { CapturedUnits, Procedure, RvgGroup } from '../../domain/types'
import { describeTimeRule, resolveStartingUnits, type BillingValidationFailure, type BtmBreakdown, type ProcedureModifier } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { ModifiersSection } from './ModifiersSection'
import { CaptureSection, StepperButton } from './ui'

type UnitsField = 'baseUnitsCaptured' | 'timeUnitsCaptured' | 'modifierUnitsCaptured'

interface UnitsCardProps {
  procedure: Procedure
  btm: BtmBreakdown
  rvgGroup?: RvgGroup | undefined
  actor: Actor
  canCapture: boolean
  isAdditional: boolean
  /** This Procedure's `modifierClaims` failures (the completion backstop, after the latch). */
  modifierFailures?: readonly BillingValidationFailure[]
  onError: (message: string) => void
}

/**
 * The B / T / M stepper rows and the itemised modifiers (mockup screen 3). Rows read the
 * RESOLVED values from the calculator's BtmBreakdown; a step always writes the
 * whole CapturedUnits from the resolved value ({units: resolved ± 1,
 * source: 'overridden'}, floor 0) — never from local state. Provenance is
 * captured fact: there is NO auto-clear on numeric equality (Phase 07's
 * "adjusted manually" flags key off it); the explicit "Use seeded value"
 * link is the only way back. On an additional procedure B and M render
 * value + caption with no buttons (the split-billing rule is structural).
 */
export function UnitsCard({ procedure, btm, rvgGroup, actor, canCapture, isAdditional, modifierFailures = [], onError }: UnitsCardProps) {
  // The RVG time tiers held as data (catch-up Phase 19a; US-05.2.2): the T caption's title words the rule.
  const timeRule = useAppStore((s) => s.masters.rvgTimeRule)
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

  // The starting modifier units come from the one resolver answer (Phase 19a's), as the fee does.
  const mBreakdown = modifierBreakdown(btm.modifierItems, rvgGroup !== undefined ? resolveStartingUnits({ group: rvgGroup }).modifier.units : 0)

  return (
    <CaptureSection label="Units" gap={14}>
      <StepperRow
        title="B · Base"
        value={btm.base.units}
        overridden={btm.base.source === 'overridden'}
        overriddenLabel={`Set manually${btm.baseOutsideGuide ? ', outside the guide range' : ''}`}
        captionTone={btm.baseOutsideGuide && !isAdditional ? 'warn' : 'quiet'}
        seededCaption={isAdditional ? 'Not charged on an additional procedure' : baseCaption(btm)}
        steppable={canCapture && !isAdditional}
        onStep={(delta) => step('baseUnitsCaptured', btm.base.units, delta)}
        onReset={canCapture && !isAdditional ? () => reset('baseUnitsCaptured') : undefined}
      />
      <StepperRow
        title="T · Time"
        value={btm.time.units}
        overridden={btm.time.source === 'overridden'}
        seededCaption="From start and finish stamps · RVG time tiers"
        captionTitle={describeTimeRule(timeRule)}
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
      <ModifiersSection
        procedure={procedure}
        items={btm.modifierItems}
        actor={actor}
        editable={canCapture && !isAdditional}
        failures={modifierFailures}
        onError={onError}
      />
    </CaptureSection>
  )
}

/**
 * The M row's caption from the itemised modifiers (catch-up Phase 19b;
 * `BtmBreakdown.modifierItems`): "A1 age +1 · P1 included 0 · AS3 +2". A
 * refused duplicate adds nothing and is left out, so the caption never credits
 * units the M total excludes. A starting value from the RVG group is named
 * first when it is not 0.
 */
function modifierBreakdown(items: readonly ProcedureModifier[], start: number): string {
  const parts = items
    .filter((i) => i.refused === undefined)
    .map((i) =>
      i.origin === 'age' ? `${i.code} age +${i.units}` : i.origin === 'included' ? `${i.code} included 0` : `${i.code} +${i.units}`,
    )
  if (start !== 0) parts.unshift(`Starting value ${start} from the RVG group`)
  return parts.length > 0 ? parts.join(' · ') : 'None applied'
}

/**
 * The B row's caption from where its units came from (catch-up Phase 19;
 * `BtmBreakdown.baseSource`): the RVG group, a chosen value on a ranged group,
 * or none. "Set manually" is the overridden label.
 */
function baseCaption(btm: BtmBreakdown): string {
  const outside = btm.baseOutsideGuide ? ', outside the guide range' : ''
  switch (btm.baseSource) {
    case 'rvgGroup':
      return 'From the RVG group'
    case 'chosen':
      return `Chosen${outside}`
    case 'overridden':
      return `Set manually${outside}`
    case 'none':
      return 'No RVG code'
  }
}

function StepperRow({
  title,
  value,
  overridden,
  overriddenLabel = 'Adjusted manually',
  captionTone = 'quiet',
  seededCaption,
  captionTitle,
  steppable,
  onStep,
  onReset,
}: {
  title: string
  value: number
  overridden: boolean
  overriddenLabel?: string
  /** 'warn' tints the caption (a base value outside the RVG guide; never an error). */
  captionTone?: 'quiet' | 'warn'
  seededCaption: string
  /** A fuller wording for the caption, shown as its tooltip. */
  captionTitle?: string
  steppable: boolean
  onStep: (delta: number) => void
  onReset: (() => void) | undefined
}) {
  return (
    <div data-shot={`units-row-${title.charAt(0).toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        {overridden ? (
          <span style={{ fontSize: 12, color: captionTone === 'warn' ? semantic.warning.onTint : neutral.slate }}>
            {overriddenLabel}
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
          <span title={captionTitle} style={{ fontSize: 12, color: captionTone === 'warn' ? semantic.warning.onTint : neutral.mist }}>{seededCaption}</span>
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
