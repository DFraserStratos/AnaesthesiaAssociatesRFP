import { useMemo, useState } from 'react'
import { accent, neutral, semantic } from '../../theme/tokens'
import type { AssignedList, Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { editRefusal, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import { procedureFee } from './feeContext'
import { ProcedureCodeCard } from './ProcedureCodeCard'
import { TimesCard } from './TimesCard'
import { UnitsCard } from './UnitsCard'
import { OverrideCard } from './OverrideCard'
import { BillingLinesCard } from './BillingLinesCard'
import { NotesCard } from './NotesCard'
import { Caption, FailureNotes } from './ui'
import { rvgCodeToFill } from '../../domain/billing/contractRail'
import { isRvgKind } from '../../domain/billing/contracts'
import { BillingCard } from '../booking/BillingCard'

/** Fields the Contract row anchors (the step rail and "Contract and payer" own them; catch-up Phase 20). */
const CONTEXT_FIELDS = ['governingContractId', 'enteredPrice', 'billablePartyId', 'prepaymentDetail'] as const

interface BtmCaptureBlockProps {
  procedure: Procedure
  list: AssignedList
  actor: Actor
  /** 1-based position on the Booking: labels it "PROCEDURE n" (no Contract prices by position, catch-up Phase 19a). */
  ordinal: number
  /** True count of procedures (header shows PROCEDURE n only when > 1). */
  procedureCount: number
  canCapture: boolean
  /** This procedure's validation failures; rendered only after the latch. */
  failures: BillingValidationFailure[]
  showValidation: boolean
  /** Open the EditProcedureSheet for THIS procedure. */
  onEdit: () => void
  /** Open the RemoveProcedureSheet for THIS procedure. Never offered on the
   *  Booking's first procedure, which `removeProcedure` refuses to delete. */
  onRemove?: (() => void) | undefined
  onError: (message: string) => void
}

/**
 * One procedure's Outcome/BTM capture block (mockup screen 3 = the skin; the
 * Phase 01 calculator = the maths). Composition: context header → procedure
 * code → times → B/T/M and the itemised modifiers → override → billing lines →
 * notes. The ASA grade is one optional modifier, claimed in the modifiers
 * ledger with its explanation.
 *
 * No money object of its own: Fee mode pins the Booking total in the desktop rail
 * or phone dock, and a per-procedure panel here would duplicate it. Units and
 * Off are presentation choices over the same calculator. Where a Booking has
 * several procedures, the full pinned total names each one's contribution.
 *
 * Write strategy (the logged capture-UX decision):
 * write-through per tap for steppers / modifier removals / nudges / stamps (a modifier
 * claim writes only with its explanation, from the picker's local state) — each
 * tap is one real audited procedure.update and drives the fee tick —
 * commit-on-blur/Save for all free text. Never debounced.
 *
 * The order above is the capture order and never varies. What varies is the
 * grouping: the two short money cards (override, billing lines) go through
 * `useSurface().Pair`,
 * so a desktop sets each pair side by side while the phone keeps them stacked.
 * Times and units stay full width on both — the stamps, the B/T/M rows and the
 * modifier ledger all use the room a desktop gives them.
 */
export function BtmCaptureBlock({
  procedure,
  list,
  actor,
  ordinal,
  procedureCount,
  canCapture,
  failures,
  showValidation,
  onEdit,
  onRemove,
  onError,
}: BtmCaptureBlockProps) {
  const { Pair } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const billingLines = useAppStore((s) => s.schedule.billingLines)
  const patientId = useAppStore((s) => s.schedule.bookings[procedure.bookingId]?.patientId)
  const [sheetHint, setSheetHint] = useState(false)

  const { fee, rvgGroup, contract, nonRvgLines } = useMemo(
    () => procedureFee({ procedure, list, masters, billingLines, patientId }),
    [procedure, list, masters, billingLines, patientId],
  )

  const shown = showValidation ? failures : []
  const forFields = (fields: readonly string[]) => shown.filter((f) => fields.includes(f.field))
  const contextFailures = forFields(CONTEXT_FIELDS)
  const anchored = new Set<string>([
    ...CONTEXT_FIELDS,
    'rvgGroupId',
    'baseUnitsSelected',
    'anaestheticStartISO',
    'handoverISO',
    'billingLines',
    'priceOverride',
    'modifierClaims',
  ])
  const unanchored = shown.filter((f) => !anchored.has(f.field))

  const billablePartyName =
    procedure.billablePartyId !== undefined ? masters.billableParties[procedure.billablePartyId]?.name : undefined
  const contextParts = [billablePartyName !== undefined ? `Payer ${billablePartyName}` : undefined, procedure.billingReference].filter(
    (p): p is string => p !== undefined,
  )
  // Derived, never stored (US-03.3.1): an RVG-kind Contract with no RVG code yet.
  const rvgToFill = contract !== undefined && rvgCodeToFill(masters, procedure, Object.values(billingLines).filter((l) => l.procedureId === procedure.id))

  // The store's edit gate (ACTIVE or SUBMITTED, own List for the anaesthetist; catch-up Phase 38a).
  const editable = procedure !== undefined && editRefusal(actor, list) === null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: PROCEDURE n · description · Edit */}
      <div
        data-testid="procedure-header"
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: procedureCount > 1 && ordinal > 1 ? 8 : 0 }}
      >
        <div style={{ flex: '0 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {procedureCount > 1 && (
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist }}>
              PROCEDURE {ordinal}
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 600, color: procedure.description === '' ? neutral.mist : neutral.ink }}>
            {procedure.description === '' ? 'Operation to capture' : procedure.description}
          </span>
        </div>
        {editable && (
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14, flex: 'none' }}>
            <button
              type="button"
              data-validation-procedure-id={procedure.id}
              data-validation-fields={CONTEXT_FIELDS.join(' ')}
              onClick={onEdit}
              onMouseEnter={() => setSheetHint(true)}
              onMouseLeave={() => setSheetHint(false)}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                color: contextFailures.length > 0 ? semantic.error.onTint : accent.base,
                cursor: 'pointer',
                textDecoration: sheetHint || contextFailures.length > 0 ? 'underline' : 'none',
              }}
            >
              Edit
            </button>
            {/* Additional procedures only: the Booking's first is its anchor and
                `removeProcedure` refuses it, so never show an action that
                cannot work. */}
            {onRemove !== undefined && canCapture && ordinal > 1 && (
              <button
                type="button"
                onClick={onRemove}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                  color: semantic.error.onTint,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {contextParts.length > 0 && <span style={{ fontSize: 12, color: neutral.mist }}>{contextParts.join(' · ')}</span>}

      {/* The Procedure's one Contract (catch-up Phase 20): the Billing card, the
          step rail inline for the office and, mirrored, the anaesthetist. */}
      <BillingCard procedure={procedure} actor={actor} canEdit={editable} ordinal={ordinal} procedureCount={procedureCount} />
      {rvgToFill && (
        <div
          data-shot="rvg-code-to-fill"
          style={{ fontSize: 13, color: neutral.slate, background: neutral.sunken, borderRadius: 10, padding: '8px 12px' }}
        >
          {actor.role === 'anaesthetist' ? 'RVG code to fill in: add it on the code card below.' : 'The anaesthetist fills in the RVG code.'}
        </div>
      )}
      <FailureNotes failures={contextFailures} />

      {procedure.isAdditional && (
        <div data-shot="procedure-additional-note" style={{ background: accent.tint, color: accent.pressed, borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: '18px' }}>
          Additional procedure. It bills for time units only; base and modifier units stay on the
          first procedure.
        </div>
      )}

      <ProcedureCodeCard
        procedure={procedure}
        rvgGroup={rvgGroup}
        rvgGroups={masters.rvgGroups}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['rvgGroupId', 'baseUnitsSelected'])}
        onError={onError}
        {...(rvgToFill ? { codeRole: 'required' as const } : contract !== undefined && !isRvgKind(contract.pricing.kind) ? { codeRole: 'reference' as const } : {})}
      />

      <TimesCard
        procedure={procedure}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['anaestheticStartISO', 'handoverISO'])}
        onError={onError}
      />

      <UnitsCard
        procedure={procedure}
        btm={fee.btm}
        rvgGroup={rvgGroup}
        actor={actor}
        canCapture={canCapture}
        isAdditional={procedure.isAdditional}
        modifierFailures={forFields(['modifierClaims'])}
        onError={onError}
      />

      <Pair>
        <OverrideCard
          procedure={procedure}
          actor={actor}
          canCapture={canCapture}
          failures={forFields(['priceOverride'])}
          onError={onError}
        />

        <BillingLinesCard
          procedure={procedure}
          nonRvgLines={nonRvgLines}
          contract={contract}
          masters={masters}
          actor={actor}
          canCapture={canCapture}
          failures={forFields(['billingLines'])}
        />
      </Pair>

      <NotesCard procedure={procedure} actor={actor} canCapture={canCapture} onError={onError} />

      {unanchored.length > 0 && (
        <>
          <Caption color={semantic.error.onTint}>Also outstanding on this procedure:</Caption>
          <FailureNotes failures={unanchored} />
        </>
      )}
    </div>
  )
}
