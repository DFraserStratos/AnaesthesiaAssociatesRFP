import { accent, neutral, semantic } from '../../theme/tokens'
import type { CapturedUnits, Procedure, RvgGroup } from '../../domain/types'
import { describeTimeRule, resolveStartingUnits, type BillingValidationFailure, type BtmBreakdown, type ProcedureAllocation, type ProcedureModifier } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { ModifiersSection } from './ModifiersSection'
import { Caption, CaptureSection, NumberStepper } from './ui'

type UnitsField = 'baseUnitsCaptured' | 'timeUnitsCaptured' | 'modifierUnitsCaptured'

interface UnitsCardProps {
  procedure: Procedure
  btm: BtmBreakdown
  rvgGroup?: RvgGroup | undefined
  actor: Actor
  canCapture: boolean
  /**
   * Its place in the Booking under the multi-procedure rule (catch-up Phase 23):
   * base and modifiers are recorded on the primary only; an additional
   * Procedure's B and M rows read their figure with no stepper.
   */
  allocation: ProcedureAllocation
  /** On an RVG kind the modifiers step is required (catch-up Phase 21a): "None apply" and the "Required" caption. */
  modifiersRequired?: boolean
  /** Mark complete's validation latch. */
  showValidation?: boolean
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
 * value + caption with no stepper, and its Modifiers section is one caption
 * row: the store refuses a base value or a modifier there (the
 * multi-procedure rule is structural, catch-up Phase 23). Units only, never a
 * fee.
 */
export function UnitsCard({ procedure, btm, rvgGroup, actor, canCapture, allocation, modifiersRequired = false, showValidation = false, modifierFailures = [], onError }: UnitsCardProps) {
  const additional = allocation.role === 'additional'
  // OQ-132's default, provisional: a primary on a fixed or open price bills no base units.
  const unbilledBase = !additional && !allocation.rvgPriced
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
        unit="base units"
        value={unbilledBase ? 0 : btm.base.units}
        overridden={!unbilledBase && btm.base.source === 'overridden'}
        overriddenLabel={`Set manually${btm.baseOutsideGuide ? ', outside the guide range' : ''}`}
        captionTone={btm.baseOutsideGuide && !additional ? 'warn' : 'quiet'}
        seededCaption={additional ? 'Base units are on the primary procedure' : unbilledBase ? 'No base units billed on a fixed price (provisional, OQ-132)' : baseCaption(btm)}
        steppable={canCapture && !additional && !unbilledBase}
        onStep={(delta) => step('baseUnitsCaptured', btm.base.units, delta)}
        onReset={canCapture && !additional ? () => reset('baseUnitsCaptured') : undefined}
      />
      <StepperRow
        title="T · Time"
        unit="time units"
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
        unit="modifier units"
        value={btm.modifiers.units}
        overridden={!additional && btm.modifiers.source === 'overridden'}
        seededCaption={additional ? additionalModifierCaption(allocation) : primaryModifierCaption(mBreakdown, allocation)}
        steppable={canCapture && !additional}
        onStep={(delta) => step('modifierUnitsCaptured', btm.modifiers.units, delta)}
        onReset={canCapture && !additional ? () => reset('modifierUnitsCaptured') : undefined}
      />
      {additional ? (
        <>
          {/* US-05.1.4 holds per Procedure: its own included P1 shows at 0 units; the engine never counts it. */}
          {btm.modifierItems.length > 0 && <Caption>{btm.modifierItems.map((i) => `${i.code} included 0`).join(' · ')}</Caption>}
          <div data-shot="modifiers-on-primary">
            <Caption>Modifiers are recorded once for the Booking, on the primary procedure.</Caption>
          </div>
        </>
      ) : (
        <ModifiersSection
          procedure={procedure}
          items={btm.modifierItems}
          actor={actor}
          editable={canCapture}
          required={modifiersRequired}
          latched={showValidation}
          failures={modifierFailures}
          onError={onError}
        />
      )}
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

/** The primary's M caption: its items, and the split when the Booking's modifiers are shared (catch-up Phase 23). */
function primaryModifierCaption(items: string, allocation: ProcedureAllocation): string {
  if (allocation.splitAcross <= 1) return items
  return `${items}. Booking total ${allocation.bookingModifierUnits}, split ${allocation.splitShares.join(' · ')}. This procedure carries ${allocation.modifierShare}.`
}

/** An additional Procedure's M caption: its share, none at 4 or fewer, or not shared on a fixed price (catch-up Phase 23). */
function additionalModifierCaption(allocation: ProcedureAllocation): string {
  if (!allocation.rvgPriced) return "Not shared · priced by its Contract's fixed price"
  // A share whenever it holds one: also the whole total, when it is the only RVG-priced Procedure beside a fixed-price primary.
  if (allocation.modifierShare > 0) return `Share of the Booking's ${allocation.bookingModifierUnits} modifier units`
  if (allocation.bookingModifierUnits === 0) return 'None'
  return `None · the Booking's ${allocation.bookingModifierUnits} modifier units stay on the primary`
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
    case 'additional':
      return 'Base units are on the primary procedure'
  }
}

function StepperRow({
  title,
  unit,
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
  /** The plural noun the stepper's buttons name ("base units"). */
  unit: string
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
      {steppable ? (
        <NumberStepper value={value} label={unit} onChange={(next) => onStep(next - value)} />
      ) : (
        <span className="mono" style={{ width: 32, textAlign: 'center', fontSize: 18, fontWeight: 700 }}>
          {value}
        </span>
      )}
    </div>
  )
}
