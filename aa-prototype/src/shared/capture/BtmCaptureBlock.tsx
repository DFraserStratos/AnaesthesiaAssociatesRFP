import { useMemo } from 'react'
import { semantic } from '../../theme/tokens'
import type { AssignedList, Procedure } from '../../domain/types'
import type { CompletionFailure } from '../../domain/billing/completion'
import { editRefusal, procedureStackViewFor, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import type { ProcedureFeeView } from './feeContext'
import { TimesCard } from './TimesCard'
import { UnitsCard } from './UnitsCard'
import { BillingLinesCard } from './BillingLinesCard'
import { PriceCard } from './PriceCard'
import { NotesCard } from './NotesCard'
import { Caption, FailureNotes } from './ui'
import { BILLING_FAILURE_FIELDS, BillingCard } from '../booking/BillingCard'
import { ProcedureStack } from '../booking/ProcedureStack'
import { ContractApprovalLine } from '../booking/ContractApprovalLine'
import { Notice } from '../ui/Notice'
import { TextAction } from '../ui/TextAction'
import { Pill } from '../ui/Pill'
import { rvgDetailFor } from '../../domain/billing/rvgDetail'
import { priceStatusFor } from '../../domain/billing/priceStatus'
import { needsPriceMessage } from '../../domain/billing/priceRanges'

/** Fields the Contract row anchors (the step rail and "Contract and reference" own them; catch-up Phase 20). */
// The Contract fields' failures, shown under the Billing card, which Mark complete focuses.
const CONTEXT_FIELDS = BILLING_FAILURE_FIELDS

interface BtmCaptureBlockProps {
  procedure: Procedure
  list: AssignedList
  actor: Actor
  /** Its fee and place in the Booking, from the one assembler (`bookingFee`, catch-up Phase 23): no pricing of its own. */
  view: ProcedureFeeView
  /** Its number in display order, the primary first: labels it "PROCEDURE n" (no pricing reads it). */
  displayNumber: number
  /** True count of procedures (header shows PROCEDURE n only when > 1). */
  procedureCount: number
  canCapture: boolean
  /** This procedure's validation failures; rendered only after the latch. */
  failures: CompletionFailure[]
  showValidation: boolean
  /** Open the RemoveProcedureSheet for THIS procedure. Never offered on the
   *  primary, which `removeProcedure` refuses to delete. */
  onRemove?: (() => void) | undefined
  /** Open the MakePrimarySheet for THIS procedure (additional procedures only, catch-up Phase 23). */
  onMakePrimary?: (() => void) | undefined
  onError: (message: string) => void
}

/**
 * One procedure's Outcome/BTM capture block (mockup screen 3 = the skin; the
 * Phase 01 calculator = the maths). Composition: procedure stack → Billing
 * card (Contract and price, the RVG code inside it) → times → B/T/M and the itemised modifiers → the price line (catch-up Phase 24, session 2) → billing lines →
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
 * grouping: the short money cards (the price line, billing lines) go through
 * `useSurface().Pair`,
 * so a desktop sets each pair side by side while the phone keeps them stacked.
 * Times and units stay full width on both — the stamps, the B/T/M rows and the
 * modifier ledger all use the room a desktop gives them.
 */
export function BtmCaptureBlock({
  procedure,
  list,
  actor,
  view,
  displayNumber,
  procedureCount,
  canCapture,
  failures,
  showValidation,
  onRemove,
  onMakePrimary,
  onError,
}: BtmCaptureBlockProps) {
  const { Pair } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const billingLines = useAppStore((s) => s.schedule.billingLines)
  const completed = useAppStore((s) => s.schedule.bookings[procedure.bookingId]?.completed === true)

  const { fee, allocation, rvgGroup, contract, nonRvgLines } = view

  // What this Procedure asks for follows its Contract's pricing kind (catch-up Phase 21a, US-03.3.9):
  // the one predicate (`rvgDetail.ts`). On a fixed or open price the times, units and modifiers are
  // not rendered; anything recorded stays on the Procedure and shows again on an RVG kind.
  const detail = rvgDetailFor(contract)
  const priceStatus = priceStatusFor(procedure, contract, list.dateISO)

  const shown = showValidation ? failures : []
  const forFields = (fields: readonly string[]) => shown.filter((f) => fields.includes(f.field))
  // "Needs a price" shows once, as the price status notice below the card.
  const contextFailures = forFields(CONTEXT_FIELDS).filter((f) => f.code !== 'needsPrice')
  const anchored = new Set<string>([
    ...CONTEXT_FIELDS,
    'rvgGroupId',
    'baseUnitsSelected',
    'anaestheticStartISO',
    'handoverISO',
    'billingLines',
    'enteredPrice',
    'modifierClaims',
  ])
  const unanchored = shown.filter((f) => !anchored.has(f.field))

  // The store's edit gate (ACTIVE or SUBMITTED, own List for the anaesthetist; catch-up Phase 38a).
  const editable = procedure !== undefined && editRefusal(actor, list) === null
  const several = procedureCount > 1
  // Make primary (US-03.2.2): anyone with edit rights while the Booking is editable; the anaesthetist
  // amends a completed Booking first, the office corrects it at review (`setPrimaryProcedure`).
  const canMakePrimary = several && !procedure.isPrimary && editable && onMakePrimary !== undefined && (actor.role !== 'anaesthetist' || !completed)
  const canRemove = several && !procedure.isPrimary && editable && onRemove !== undefined && canCapture

  // The procedure stack's view (catch-up Phase 20a): the one pure module, through the store's selector.
  // Only the three records the view reads, so a write elsewhere does not rebuild it.
  const procedures = useAppStore((s) => s.schedule.procedures)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const lists = useAppStore((s) => s.schedule.lists)
  // The invoices too: a held price is what a split divides (catch-up Phase 24).
  const invoices = useAppStore((s) => s.billing.invoices)
  const invoiceLines = useAppStore((s) => s.billing.invoiceLines)
  const locks = useAppStore((s) => s.billing.locks)
  const stackSurface = actor.role === 'office' ? 'office' : 'anaesthetist'
  const stackView = useMemo(
    () => procedureStackViewFor({ masters, schedule: { procedures, bookings, lists, billingLines }, billing: { invoices, invoiceLines, locks } }, procedure.id, stackSurface),
    [masters, procedures, bookings, lists, billingLines, invoices, invoiceLines, locks, procedure.id, stackSurface],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* The procedure stack (catch-up Phase 20a; US-03.1.9): the procedure text, the invoice
          description, the Contract and the RVG code, from one view. Its heading row keeps
          `procedure-header` with Edit and Remove in its actions. */}
      <ProcedureStack
        view={stackView!}
        density="full"
        surface={stackSurface}
        heading={several ? `Procedure ${displayNumber}` : 'Procedure'}
        {...(several && procedure.isPrimary ? { badge: <Pill size="sm" shot="procedure-primary-pill">Primary</Pill> } : {})}
        {...(canMakePrimary || canRemove
          ? {
              actions: (
                <>
                  {/* Additional procedures only: the primary is not removable (`removeProcedure`
                      refuses it), so never show an action that cannot work. */}
                  {canMakePrimary && (
                    <TextAction flush shot="make-primary" onClick={onMakePrimary}>
                      Make primary
                    </TextAction>
                  )}
                  {canRemove && (
                    <TextAction flush onClick={onRemove}>
                      Remove
                    </TextAction>
                  )}
                </>
              ),
            }
          : {})}
      />

      {/* The Procedure's one Contract and its price (catch-up Phase 20): the Billing card, the
          step rail inline for the office and, mirrored, the anaesthetist. The RVG code is
          filled in inside it (owner review, 2026-11-12): no separate code card. */}
      <BillingCard
        procedure={procedure}
        actor={actor}
        canEdit={editable}
        canCapture={canCapture}
        rvgGroup={rvgGroup}
        codeFailures={forFields(['rvgGroupId', 'baseUnitsSelected'])}
        onError={onError}
        displayNumber={displayNumber}
        procedureCount={procedureCount}
      />
      {/* The anaesthetist's own Contract change and the office's approval (catch-up Phase 21a). */}
      {stackSurface === 'anaesthetist' && <ContractApprovalLine procedureId={procedure.id} />}
      <FailureNotes failures={contextFailures} />

      {allocation.role === 'additional' && (
        <Notice tone="neutral" shot="procedure-additional-note">
          {allocation.rvgPriced
            ? "Additional procedure. Base units are charged on the primary procedure only. It earns its own time units, and an equal share of the Booking's modifiers once they total more than 4."
            : "Additional procedure on a fixed price. Its Contract's price is the whole price; its units are recorded for reference."}
        </Notice>
      )}


      {/* "Needs a price" is a state, never a figure. */}
      {priceStatus?.status === 'needsPrice' && contract !== undefined && (
        <Notice tone="warning" icon={false} shot="capture-price-status">
          {needsPriceMessage(contract, list.dateISO)}
        </Notice>
      )}

      {detail.times !== 'hidden' && (
        <div data-shot="capture-rvg-detail" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TimesCard
            procedure={procedure}
            actor={actor}
            canCapture={canCapture}
            required={detail.times === 'required'}
            showValidation={showValidation}
            failures={forFields(['anaestheticStartISO', 'handoverISO'])}
            onError={onError}
          />

          <UnitsCard
            procedure={procedure}
            btm={fee.btm}
            rvgGroup={rvgGroup}
            actor={actor}
            canCapture={canCapture}
            allocation={allocation}
            modifiersRequired={detail.modifiers === 'required'}
            showValidation={showValidation}
            modifierFailures={forFields(['modifierClaims'])}
            onError={onError}
          />
        </div>
      )}

      {/* A fixed or open price primary of a multi-procedure Booking still records the Booking's
          modifiers, which the RVG-priced Procedures share above 4 (catch-up Phase 23): its units
          card shows B 0 (OQ-132, provisional) and the Modifiers section; no times are asked. */}
      {detail.times === 'hidden' && several && procedure.isPrimary && !allocation.rvgPriced && (
        <div data-shot="capture-booking-modifiers">
          <UnitsCard
            procedure={procedure}
            btm={fee.btm}
            rvgGroup={rvgGroup}
            actor={actor}
            canCapture={canCapture}
            allocation={allocation}
            showValidation={showValidation}
            modifierFailures={forFields(['modifierClaims'])}
            onError={onError}
          />
        </div>
      )}

      <Pair>
        {/* What the price comes to (catch-up Phase 24, US-03.3.10): the reasoned Adjustment and charge card is gone (RV-04). */}
        <PriceCard
          procedure={procedure}
          actor={actor}
          fee={fee}
          contract={contract}
          canCapture={canCapture}
          // The "Needs a price" sentence shows once, in the price status notice (the card shows its pill).
          failures={forFields(['enteredPrice']).filter((f) => f.code !== 'needsPrice')}
          onError={onError}
        />

        <BillingLinesCard
          procedure={procedure}
          nonRvgLines={nonRvgLines}
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
