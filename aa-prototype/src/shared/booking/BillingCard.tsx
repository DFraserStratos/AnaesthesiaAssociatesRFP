import { useBookingApi, useBookingStore, useBookingStoreMode } from './draft'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronDown, RotateCcw, Search } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { Contract, ContractId, Procedure, RailAnswers, RvgGroup } from '../../domain/types'
import { childPayerOn, payerContactMissing, payerCounterparty, payerDetails, type BillingValidationFailure } from '../../domain/billing'
import { NEEDS_PRICE_LABEL, rangeInForce } from '../../domain/billing/priceRanges'
import { RvgCodeField } from '../capture/ProcedureCodeCard'
import { TextAction } from '../ui/TextAction'
import { formatCurrency, parseAmount } from '../format'
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl'
import {
  OFFICE_TYPES_AMOUNT_MESSAGE,
  contractRailFor,
  railAnswersText,
} from '../../domain/billing/contractRail'
import { contractMatchesQuery, isRvgKind } from '../../domain/billing/contracts'
import {
  procedureStackViewFor,
  railActorOf,
  railContextForList,
  railMastersOf,
  prepaymentRecheckLine,
  prepaymentStatusFor,
  railStartFor,
  setProcedureContract,
  setRailAnswers,
  type Actor,
} from '../../store'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { CaptureSection, FailureNotes } from '../capture/ui'
import { Button } from '../ui/Button'
import { PopoverPanel } from '../ui/PopoverPanel'
import { usePopover } from '../ui/usePopover'
import { Notice } from '../ui/Notice'
import { BackstopAmountField, ContractGroupHeading, NoContractGroup, RailOptionGroup, StepRail, type RailStep } from '../contracts/railParts'
import { backstopPriceText, contractPriceText, railBackstops, railContractLabel } from '../contracts/railText'
import { FormError } from '../ui'
import { LockBadge } from './LockBadge'
import { PaidByRow, type PaidByRowProps } from './PaidByRow'

/**
 * The Booking's Billing card (catch-up Phase 20; US-04.3.8, US-04.3.9,
 * US-04.3.2, US-04.3.3, US-03.4.1): the step rail, inline on the Booking, one
 * card per Procedure. The look follows the contract picker mock's "A. Step
 * rail": the steps as a compact numbered rail down the left (Invoice to, the
 * step that narrows it, the Contract), each answer shown under its label and
 * clickable to change it; the rest of the card is the current question, its
 * answers as tiles with their counts; the last step a "Choose the Contract"
 * field that drops down the Contracts on offer, searchable; "Start again".
 * Answers save as they are given (the answers so far, until a Contract is
 * chosen), so whoever opens the Booking next carries on from there.
 *
 * The last step is the price, as the mock's price step (owner review,
 * 2026-11-12): a lone Contract on the path is picked as the answer is given;
 * several are chosen in the "Choose the Contract" field. An RVG Contract's price
 * is the RVG code, typed in here (left blank, the anaesthetist fills it in), with
 * "RVG code | Fixed price" to price it at a typed amount instead (the
 * destination's Other price); a fixed price shows its agreed fee on the rail.
 * There is no separate RVG code card.
 *
 * On the phone the card is a short summary (Invoice to, Contract, Price); a tap
 * anywhere on it opens the Billing sheet, which holds the same steps, "Price by"
 * and the RVG code (owner review, 2026-11-16).
 *
 * Every rule is `contractRailFor`'s; the store applies the guards.
 */

type Step = 1 | 2 | 3

/**
 * The Contract fields a completion failure points at: Mark complete focuses the
 * Billing card for any of them (the Booking's procedure card has no Edit since
 * catch-up Phase 20a's owner review).
 */
export const BILLING_FAILURE_FIELDS = ['governingContractId', 'enteredPrice'] as const

interface BillingCardProps {
  procedure: Procedure
  actor: Actor
  /** The actor may edit this Booking (38a's window). */
  canEdit: boolean
  /** The actor may record capture on this Booking: the RVG code is theirs to fill in (catch-up Phase 20, owner review). */
  canCapture: boolean
  /** The Procedure's RVG group row (from `procedureFee`). */
  rvgGroup?: RvgGroup | undefined
  /** rvgGroupId / baseUnitsSelected failures (shown post-latch, verbatim). */
  codeFailures: BillingValidationFailure[]
  onError: (message: string) => void
  /** "Procedure n" when the Booking has more than one. */
  displayNumber?: number
  procedureCount?: number
}

export const NEEDS_INVOICE_DESTINATION = 'Needs an invoice destination'
export const CONTRACT_CHANGE_CAPTION = 'The office sees any change to the Contract at review.'

export function BillingCard(props: BillingCardProps) {
  const { variant } = useSurface()
  return variant === 'mobile' ? <MobileBillingCard {...props} /> : <InlineBillingCard {...props} />
}

function useBilling(procedure: Procedure) {
  const masters = useBookingStore((s) => s.masters)
  const schedule = useBookingStore((s) => s.schedule)
  const booking = schedule.bookings[procedure.bookingId]
  const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
  const context = useMemo(() => (list !== undefined ? railContextForList({ masters }, list, booking) : undefined), [masters, list, booking])
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const start = railStartFor({ masters, schedule }, procedure.id)
  return { masters, schedule, context, contract, start, list }
}

/** The card's title. */
function cardLabel(displayNumber?: number, count?: number): string {
  return count !== undefined && count > 1 && displayNumber !== undefined ? `Billing · procedure ${displayNumber}` : 'Billing'
}

// ---------------------------------------------------------------------------
// Web and Admin: the inline card
// ---------------------------------------------------------------------------

function InlineBillingCard(props: BillingCardProps) {
  const paidBy = usePaidBy(props)
  return (
    <CaptureSection
      label={cardLabel(props.displayNumber, props.procedureCount)}
      shot="billing"
      validationTarget={{ procedureId: props.procedure.id, fields: BILLING_FAILURE_FIELDS }}
    >
      <BillingSteps {...props} layout="side" />
      {paidBy !== null && <PaidByRow {...paidBy} variant="line" />}
      {/* Once the List is AUTHORISED: the Contract and price are locked (catch-up Phase 25). */}
      <LockBadge bookingId={props.procedure.bookingId} detail />
    </CaptureSection>
  )
}

/**
 * "Paid by" (catch-up Phase 22, idea 6; the payer per Procedure since 22a):
 * who the fee is invoiced to, the payer's name and pills where the Contract
 * bills the payer, or its split, from the stack view and `whoIsBilled.ts`;
 * "Payer: not billed yet" until the Procedure has a Contract.
 */
function usePaidBy({ procedure, actor, canEdit }: BillingCardProps): Omit<PaidByRowProps, 'variant'> | null {
  const masters = useBookingStore((s) => s.masters)
  const procedures = useBookingStore((s) => s.schedule.procedures)
  const bookings = useBookingStore((s) => s.schedule.bookings)
  const lists = useBookingStore((s) => s.schedule.lists)
  const invoices = useBookingStore((s) => s.billing.invoices)
  const invoiceLines = useBookingStore((s) => s.billing.invoiceLines)
  const locks = useBookingStore((s) => s.billing.locks)
  const surface = actor.role === 'office' ? 'office' : 'anaesthetist'
  const view = useMemo(
    () => procedureStackViewFor({ masters, schedule: { procedures, bookings, lists }, billing: { invoices, invoiceLines, locks } }, procedure.id, surface),
    [masters, procedures, bookings, lists, invoices, invoiceLines, locks, procedure.id, surface],
  )
  if (view === undefined) return null
  const booking = bookings[procedure.bookingId]
  const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
  const dateISO = booking !== undefined ? lists[booking.listId]?.dateISO : undefined
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const cancelled = booking?.cancellation !== undefined
  const invoicedKind = view.contract?.invoiced?.kind
  // The payer where the Contract bills them, or where a split share does (Change then reaches their contact).
  const payerRef = booking !== undefined ? payerCounterparty(procedure, booking.patientId) : undefined
  const splitBillsPayer = payerRef !== undefined && (procedure.split?.shares.some((s) => s.person === undefined && s.party.kind === payerRef.kind && s.party.id === payerRef.id) ?? false)
  const details = invoicedKind === 'patient' || invoicedKind === 'payer' || splitBillsPayer ? payerDetails(procedure.payer, patient) : undefined
  return {
    contract: view.contract,
    procedureId: procedure.id,
    actor,
    canEdit: canEdit && !cancelled,
    ...(details !== undefined ? { payer: { name: details.name, ...(details.relationship !== undefined ? { relationship: details.relationship } : {}) } } : {}),
    contactMissing: payerContactMissing(procedure, patient, contract),
    child: dateISO !== undefined && childPayerOn(procedure, patient, contract, dateISO),
  }
}

/**
 * The steps and the price: the Billing card's body on the web and Admin
 * (`side`, the rail down the left), and the whole of the phone's Billing sheet
 * (`sheet`, the rail across the top), so both edit through the same flow.
 */
function BillingSteps({ procedure, actor, canEdit, canCapture, rvgGroup, codeFailures, onError, layout }: BillingCardProps & { layout: 'side' | 'sheet' }) {
  const bookingApi = useBookingApi()
  const { masters, context, contract, start } = useBilling(procedure)
  const sheet = layout === 'sheet'
  const railActor = railActorOf(actor)
  const officeOnly = railActor === 'anaesthetist' && contract?.prepaid === true
  const editable = canEdit && !officeOnly && context !== undefined

  const [given, setGiven] = useState<RailAnswers | undefined>(start)
  const [editing, setEditing] = useState<Step | null>(null)
  const [otherOn, setOtherOn] = useState(contract?.pricing.kind === 'open')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  // The re-check made visible (catch-up Phase 27, US-06.3.5): one line when the pick changes the prepayment.
  const [recheck, setRecheck] = useState<string | null>(null)
  /** Run a change and say what it did to the prepayment. */
  const withRecheck = <T,>(run: () => T): T => {
    const before = prepaymentStatusFor(bookingApi.getState(), procedure.bookingId)
    const out = run()
    // A pick that changes nothing keeps the line the step before set (a release, then the new Contract).
    const line = prepaymentRecheckLine(before, prepaymentStatusFor(bookingApi.getState(), procedure.bookingId))
    setRecheck((prev) => line ?? prev)
    return out
  }

  // Follow the Procedure when its Contract or answers change elsewhere.
  const startKey = JSON.stringify([procedure.governingContractId, procedure.railAnswers, procedure.enteredPrice])
  useEffect(() => {
    setGiven(start)
    setEditing(null)
    setOtherOn(contract?.pricing.kind === 'open')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey])

  const view = useMemo(
    () => (context !== undefined ? contractRailFor(railMastersOf({ masters }), context, given, { actor: railActor }) : undefined),
    [masters, context, given, railActor],
  )
  if (view === undefined || context === undefined) return null

  const step: Step = editing ?? (view.destination.answer === undefined ? 1 : view.narrow?.answer === undefined ? 2 : 3)
  const fallback = view.contract?.otherPrice
  const onThisPath = contract !== undefined && view.contract?.rows.some((r) => r.contract.id === contract.id)
  const onThisFallback = contract !== undefined && fallback?.contract.id === contract.id
  const onBackstop = contract !== undefined && view.contract?.rvgBackstop?.id === contract.id
  // A Contract kept from before a move that this List does not offer stays the Procedure's Contract (US-04.3.11,
  // catch-up Phase 21a): shown as it is, with a note, never replaced by the List's own options.
  const keptOffList = contract !== undefined && !(onThisPath || onThisFallback || onBackstop)

  /** Answers so far are kept on a Procedure with no Contract (US-04.3.8). */
  const keep = (next: RailAnswers | undefined) => {
    setGiven(next)
    setEditing(null)
    setError(null)
    setNote(null)
    setRecheck(null)
    setOtherOn(false)
    // Every answer is saved as it is given (owner review, 2026-11-16), so the other side sees how far it has got.
    // An answer that still leads to the Contract (the same path, or the start of it) keeps it; one that does not releases it.
    const onPath = next === undefined || (start !== undefined && next.destination === start.destination && (next.narrow === undefined || next.narrow === start.narrow))
    if (procedure.governingContractId === undefined) {
      const res = setRailAnswers(bookingApi, actor, procedure.id, next)
      if (!res.ok) setError(res.message)
    } else if (!onPath) {
      const res = withRecheck(() => setRailAnswers(bookingApi, actor, procedure.id, next, { releaseContract: true }))
      if (!res.ok) {
        setError(res.message)
        return
      }
    }
    // A lone Contract on the new path is the answer: picked at once, as the mock does.
    if (next !== undefined && context !== undefined) {
      const only = contractRailFor(railMastersOf({ masters }), context, next, { actor: railActor }).contract?.autoPick
      if (only !== undefined && !only.viaOtherPrice && only.contractId !== procedure.governingContractId) choose(only.contractId)
    }
  }

  const choose = (contractId: ContractId, enteredPrice?: number) => {
    const changing = procedure.governingContractId !== undefined && procedure.governingContractId !== contractId
    const res = withRecheck(() => setProcedureContract(bookingApi, actor, procedure.id, contractId, enteredPrice !== undefined ? { enteredPrice } : {}))
    if (!res.ok) {
      setError(res.message)
      return
    }
    setError(null)
    setOtherOn(masters.contracts[contractId]?.pricing.kind === 'open')
    setNote(changing && procedure.enteredPrice !== undefined && enteredPrice === undefined ? 'Any typed price was cleared for the new Contract.' : null)
  }
  const rows = view.contract?.rows ?? []
  const loneRvg = rows.length === 1 && isRvgKind(rows[0]!.contract.pricing.kind) ? rows[0]!.contract : undefined
  /** "RVG code | Fixed price": Fixed price shows the amount; back to RVG returns to the lone RVG Contract. */
  const priceBy = (by: PriceBy) => {
    if (by === 'amount') return setOtherOn(true)
    setOtherOn(false)
    if (onThisFallback && loneRvg !== undefined) choose(loneRvg.id)
  }

  const destLabel = view.destination.options.find((o) => o.value === view.destination.answer)?.label
  const narrowLabel = view.narrow?.options.find((o) => o.value === view.narrow?.answer)?.label
  const priceLine = contract !== undefined && editing === null ? priceSummary(contract, procedure, rvgGroup, context.listDateISO, railActor) : undefined
  const slots: { n: Step; label: string; value?: string; auto: boolean }[] = [
    { n: 1, label: 'Invoice to', ...(destLabel !== undefined ? { value: destLabel } : {}), auto: view.destination.autoFilled },
    { n: 2, label: view.narrow?.title ?? 'Payment type', ...(narrowLabel !== undefined && (editing === null || editing > 1) ? { value: narrowLabel } : {}), auto: view.narrow?.autoFilled === true },
    { n: 3, label: 'Price', ...(priceLine !== undefined && (onThisPath || onThisFallback || onBackstop || keptOffList) ? { value: priceLine } : {}), auto: false },
  ]
  const price = (c: Contract | undefined, opts: { toggle?: boolean; amount?: boolean } = {}) => (
    <PriceBlock
      mode={priceModeOf(c, opts.amount === true)}
      contract={c}
      procedure={procedure}
      rvgGroup={rvgGroup}
      actor={actor}
      canCapture={canCapture}
      codeFailures={codeFailures}
      onError={onError}
      look={sheet ? 'sheet' : 'inline'}
      editable={editable}
      toggle={opts.toggle === true}
      {...(fallback !== undefined ? { fallback } : {})}
      onPriceBy={priceBy}
      onAmount={(n) => fallback !== undefined && choose(fallback.contract.id, n)}
    />
  )

  const reachable = (n: Step) => n === 1 || (n === 2 && view.destination.answer !== undefined) || (n === 3 && view.narrow?.answer !== undefined)
  const jump = (n: Step) => {
    if (!editable) return
    setError(null)
    setNote(null)
    if (n === 3) return setEditing(null)
    const dest = view.destination.answer as RailAnswers['destination'] | undefined
    setGiven(n === 1 ? undefined : dest !== undefined ? { destination: dest } : undefined)
    setEditing(n)
  }
  const restart = () => {
    setOtherOn(false)
    keep(undefined)
    setEditing(1)
  }

  let body: ReactNode
  if (!editable) {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ReadOnlySummary
          contract={contract}
          answersText={railAnswersText(masters, context, procedure.railAnswers)}
          officeOnly={officeOnly}
        />
        {contract !== undefined && price(contract)}
      </div>
    )
  } else if (step === 1) {
    body = (
      <StepFrame question="Where does the invoice go?" aside={<StartAgain onClick={restart} hidden={given === undefined} />}>
        <RailOptionGroup layout="tiles" label="Where does the invoice go?" options={view.destination.options} value={view.destination.answer} stacked={sheet} onPick={(v) => keep({ destination: v as RailAnswers['destination'] })} />
      </StepFrame>
    )
  } else if (step === 2 && view.narrow !== undefined) {
    const dest = view.destination.answer as RailAnswers['destination']
    const q = dest === 'patient' ? 'Standard or prepaid?' : dest === 'hospital' ? `Under which of ${destLabel ?? 'the hospital'}'s funding tags?` : 'Which holder?'
    body = (
      <StepFrame question={q} aside={<StartAgain onClick={restart} hidden={false} />}>
        <RailOptionGroup layout="tiles" label={q} options={view.narrow.options} value={view.narrow.answer} stacked={sheet} onPick={(v) => keep({ destination: dest, narrow: v })} />
      </StepFrame>
    )
  } else {
    const c = view.contract
    // Patient › Standard with No contract · RVG its one Contract keeps the mock's lone pick and "RVG code | Fixed price"
    // (owner review, 2026-11-16). Every other path lists its Contracts under a "No contract" heading holding the
    // destination's two backstops, No contract · RVG and No contract · Fixed price; there is no "Other price" switch.
    const pinned = c?.rows.find((r) => r.pinned)
    const loneStandard = pinned !== undefined && rows.length === 1
    const backstops = railBackstops(c)
    const current = contract !== undefined && (onThisPath || onThisFallback || onBackstop || keptOffList) ? contract : undefined
    const suggested = loneStandard && current === undefined && c?.autoPick !== undefined && !c.autoPick.viaOtherPrice ? masters.contracts[c.autoPick.contractId] : undefined
    const amountMode = loneStandard ? otherOn || onThisFallback : current?.pricing.kind === 'open'
    const toggle = loneStandard && fallback !== undefined && current !== undefined && (isRvgKind(current.pricing.kind) || onThisFallback)
    const question = loneStandard ? 'Price' : current !== undefined ? 'Contract and price' : 'Which Contract?'
    body = (
      <StepFrame question={question} aside={<StartAgain onClick={restart} hidden={false} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!loneStandard && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={FIELD_LABEL}>Contract</span>
              <ContractCombo
                rows={rows.filter((r) => !r.pinned)}
                backstops={backstops}
                {...(current !== undefined ? { value: current } : {})}
                dateISO={context.listDateISO}
                onPick={(id) => choose(id)}
                inFlow={sheet}
              />
            </div>
          )}
          {keptOffList && (
            <Notice tone="warning" shot="billing-contract-kept">
              This List does not offer {contract!.name}. The Booking keeps it; the office checks it at review.
            </Notice>
          )}
          {suggested !== undefined && !amountMode && (
            <div data-shot="contract-rail-only-contract" style={{ display: 'flex', flexDirection: sheet ? 'column' : 'row', alignItems: sheet ? 'stretch' : 'center', justifyContent: 'space-between', gap: 10, background: accent.tint, borderRadius: radius.ctl, padding: sheet ? 12 : '8px 8px 8px 14px' }}>
              <span style={{ fontSize: 13.5, color: neutral.ink }}>
                <strong>{suggested.name}</strong> is the only option here.
              </span>
              <Button variant="primary" onClick={() => choose(suggested.id)} {...(sheet ? { style: { minHeight: 44 } } : {})}>Use it</Button>
            </div>
          )}
          {loneStandard && current !== undefined && !keptOffList && (
            <span data-shot="contract-rail-lone" style={{ fontSize: 12.5, color: neutral.slate }}>
              <span style={{ fontWeight: 600, color: neutral.ink }}>{rows[0]!.contract.name}</span> <span className="mono">{rows[0]!.contract.aaCode}</span> · the only Contract here
            </span>
          )}
          {(current !== undefined || amountMode) && price(current, { toggle, amount: amountMode })}
        </div>
      </StepFrame>
    )
  }

  const railSteps: RailStep[] = slots.map((s) => {
    // A Contract set on this path finishes the rail: every step ticked, as the mock's finished path.
    const complete = s.n === 3 && s.value !== undefined && editing === null
    return {
      n: s.n,
      label: s.label,
      ...(s.value !== undefined ? { value: s.value } : {}),
      auto: s.auto,
      done: s.value !== undefined && (s.n !== step || complete),
      current: editable && s.n === step && !complete,
      ...(editable && reachable(s.n) && s.n !== step ? { onJump: () => jump(s.n) } : {}),
    }
  })

  return (
    <div className="aa-rail-scope" data-shot="contract-picker" style={{ display: 'flex', flexDirection: 'column', gap: sheet ? 16 : 12 }}>
      {sheet ? (
        <>
          <StepRail steps={railSteps} orientation="compact" label="Billing steps" />
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>{body}</div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(168px, 28%, 236px) minmax(0, 1fr)' }}>
          <StepRail steps={railSteps} orientation="vertical" label="Billing steps" />
          <div style={{ paddingLeft: 18, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>{body}</div>
        </div>
      )}
      <FormError message={error} />
      {note !== null && <span data-shot="contract-price-cleared" style={{ fontSize: 12.5, color: neutral.slate }}>{note}</span>}
      {recheck !== null && <span data-shot="prepayment-recheck" role="status" style={{ fontSize: 12.5, color: neutral.slate }}>{recheck}</span>}
    </div>
  )
}

function StepFrame({ question, aside, children }: { question: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h4 style={{ flex: 1, margin: 0, fontSize: 17, lineHeight: '24px', fontWeight: 600, color: neutral.ink }}>{question}</h4>
        {aside}
      </div>
      {children}
    </div>
  )
}

function StartAgain({ onClick, hidden }: { onClick: () => void; hidden: boolean }) {
  return (
    <button
      type="button"
      className="aa-ctl"
      data-shot="contract-rail-start-again"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      style={{ visibility: hidden ? 'hidden' : 'visible', display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: neutral.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, whiteSpace: 'nowrap', fontFamily: 'inherit' }}
    >
      <RotateCcw size={13} aria-hidden /> Start again
    </button>
  )
}

/** "Choose the Contract": a field that drops down the step's Contracts, searchable, grouped by holder. */
function ContractCombo({
  rows,
  value,
  dateISO,
  onPick,
  backstops,
  inFlow = false,
}: {
  rows: readonly { contract: Contract; pinned: boolean }[]
  /** The destination's No contract · RVG and No contract · Fixed price, listed first under "No contract", never searched away. */
  backstops: readonly Contract[]
  value?: Contract
  dateISO: string
  onPick: (id: ContractId) => void
  /** Drop the list down in the page flow (inside the phone's sheet) rather than floating. */
  inFlow?: boolean
}) {
  const parties = useBookingStore((s) => s.masters.parties)
  const rvgGroups = useBookingStore((s) => s.masters.rvgGroups)
  // The one popover behaviour (U2): outside click closes; Escape closes this
  // list only (never the sheet under it) and puts focus back on the combo.
  const { open, setOpen, rootRef, panelId, triggerProps } = usePopover()
  const [q, setQ] = useState('')

  // The step's own Contracts, grouped by holder; the search narrows them through the one matcher
  // (`contractMatchesQuery`, catch-up 18/19a). The backstops head the list and are never searched away.
  const groups = useMemo(() => {
    const out = new Map<string, { title: string; rows: Contract[] }>()
    for (const r of rows) {
      if (!r.pinned && !contractMatchesQuery(r.contract, q, rvgGroups)) continue
      const title = parties[r.contract.holderId]?.name ?? r.contract.holderId
      const g = out.get(title) ?? { title, rows: [] }
      g.rows.push(r.contract)
      out.set(title, g)
    }
    return [...out.values()]
  }, [rows, q, parties, rvgGroups])
  const matched = groups.reduce((n, g) => n + g.rows.length, 0)

  const option = (contract: Contract, priceText: string) => {
    const selected = value?.id === contract.id
    return (
      <button
        key={contract.id}
        type="button"
        className="aa-ctl"
        role="option"
        aria-selected={selected}
        data-contract-id={contract.id}
        onClick={() => {
          setOpen(false)
          onPick(contract.id)
        }}
        style={{ display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 10, width: '100%', textAlign: 'left', border: 'none', background: selected ? accent.tint : 'transparent', padding: '9px 14px', fontFamily: 'inherit', cursor: 'pointer' }}
      >
        <span aria-hidden style={{ color: accent.base, display: 'flex' }}>{selected && <Check size={15} strokeWidth={3} />}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: neutral.ink }}>{railContractLabel(contract)}</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11.5, color: neutral.slate }}>{contract.aaCode}</span>
            {contract.holderReference !== undefined && <span className="mono" style={{ fontSize: 11.5, color: neutral.mist }}>{contract.holderReference}</span>}
          </span>
        </span>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap' }}>{priceText}</span>
      </button>
    )
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        {...triggerProps}
        type="button"
        className="aa-ctl"
        data-shot="contract-combo"
        aria-haspopup="listbox"
        onClick={() => {
          setOpen(!open)
          setQ('')
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, boxSizing: 'border-box', borderRadius: radius.ctl, border: `1px solid ${open ? accent.base : neutral.lineStrong}`, background: neutral.surface, padding: '8px 12px', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
      >
        {value !== undefined ? (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: neutral.ink }}>{railContractLabel(value)}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{value.aaCode}</span>
          </span>
        ) : (
          <span style={{ flex: 1, fontSize: 14.5, color: neutral.mist }}>Choose the Contract</span>
        )}
        <ChevronDown size={18} color={neutral.slate} aria-hidden />
      </button>
      {open && (
        <PopoverPanel id={panelId} shot="contract-combo-list" placement={inFlow ? 'inline' : 'fill'} padding={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${neutral.line}` }}>
            <Search size={16} color={neutral.mist} aria-hidden />
            <input
              autoFocus={!inFlow}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a name or code"
              aria-label="Type a name or code"
              className="aa-field"
              style={{ flex: 1, border: 'none', borderRadius: radius.xs, fontSize: 14.5, fontFamily: 'inherit', color: neutral.ink, background: 'transparent' }}
            />
          </div>
          <div role="listbox" aria-label="Contracts" style={{ maxHeight: 340, overflow: 'auto', padding: '4px 0' }}>
            <NoContractGroup backstops={backstops} renderRow={(c) => option(c, backstopPriceText(c))} />
            {groups.map((g) => (
              <div key={g.title}>
                <ContractGroupHeading>{g.title}</ContractGroupHeading>
                {g.rows.slice(0, 50).map((c) => option(c, contractPriceText(c, dateISO)))}
              </div>
            ))}
            {q.trim() !== '' && matched === 0 && <div style={{ padding: '10px 14px', fontSize: 13.5, color: neutral.mist }}>No Contract matches "{q.trim()}".</div>}
            {rows.length === 0 && <div style={{ padding: '10px 14px', fontSize: 13.5, color: neutral.mist }}>No Contract of its own fits this List.</div>}
          </div>
        </PopoverPanel>
      )}
    </div>
  )
}

/** The Price slot's answer in a few words, as the mock's rail ("RVG H6a", "Agreed fee $357.39"). */
function priceSummary(contract: Contract, procedure: Procedure, rvgGroup: RvgGroup | undefined, dateISO: string, railActor: 'office' | 'anaesthetist'): string {
  if (contract.pricing.kind === 'open') return procedure.enteredPrice !== undefined ? `Fixed price ${formatCurrency(procedure.enteredPrice)}` : NEEDS_PRICE_LABEL
  if (isRvgKind(contract.pricing.kind)) return rvgGroup !== undefined ? `RVG ${rvgGroup.code}` : railActor === 'office' ? 'To the anaesthetist' : 'RVG code to fill in'
  const range = rangeInForce(contract, dateISO)
  if (range === null) return 'Needs a price'
  return `${contract.prepaid ? 'Prepaid' : 'Agreed fee'} ${formatCurrency(range.price)}`
}

type PriceMode = 'none' | 'rvg' | 'fixed' | 'amount'
type PriceBy = 'rvg' | 'amount'

const PRICE_BY = [
  { value: 'rvg', label: 'RVG code' },
  { value: 'amount', label: 'Fixed price' },
] as const

const FIELD_LABEL = { fontSize: 12.5, lineHeight: '18px', fontWeight: 600, color: neutral.slate } as const

function priceModeOf(contract: Contract | undefined, amount: boolean): PriceMode {
  if (amount) return 'amount'
  if (contract === undefined) return 'none'
  if (contract.pricing.kind === 'open') return 'amount'
  return isRvgKind(contract.pricing.kind) ? 'rvg' : 'fixed'
}

/**
 * The price, as the contract picker mock's price step (US-04.3.8, US-03.3.1):
 * "RVG code | Fixed price" where the destination has an Other price; then the RVG
 * code field (left blank, the anaesthetist fills it in) or the fixed price's
 * amount. A fixed or prepaid price shows its agreed fee on the rail, with an RVG
 * code for reference only. With no Contract yet, the RVG code may still be
 * recorded. No line repeats the price in words (owner review, 2026-11-16).
 */
function PriceBlock({
  mode,
  contract,
  procedure,
  rvgGroup,
  actor,
  canCapture,
  codeFailures,
  onError,
  look,
  editable,
  toggle,
  fallback,
  onPriceBy,
  onAmount,
}: {
  mode: PriceMode
  /** None yet ("Needs an invoice destination"): the RVG code may still be filled in, its price follows the Contract. */
  contract: Contract | undefined
  procedure: Procedure
  rvgGroup: RvgGroup | undefined
  actor: Actor
  canCapture: boolean
  codeFailures: BillingValidationFailure[]
  onError: (message: string) => void
  /** `sheet`: the phone's Billing sheet, with thumb-sized controls. */
  look: 'inline' | 'sheet'
  editable: boolean
  toggle: boolean
  fallback?: { contract: Contract; mayTypeAmount: boolean }
  onPriceBy: (by: PriceBy) => void
  /** Price at the Other price: a typed amount, or none where the office types it. */
  onAmount: (amount: number | undefined) => void
}) {
  const rvgGroups = useBookingStore((s) => s.masters.rvgGroups)
  const [referenceOpen, setReferenceOpen] = useState(false)
  const mobile = look === 'sheet'
  const coded = procedure.rvgGroupId !== undefined
  const field = (role: 'required' | 'reference' | undefined, emptyHint?: string) => (
    <RvgCodeField
      procedure={procedure}
      rvgGroup={rvgGroup}
      rvgGroups={rvgGroups}
      actor={actor}
      canCapture={canCapture}
      failures={codeFailures}
      onError={onError}
      look="inline"
      listInFlow={mobile}
      {...(role !== undefined ? { codeRole: role } : {})}
      {...(emptyHint !== undefined ? { emptyHint } : {})}
    />
  )

  return (
    <div data-shot={contract !== undefined ? 'contract-rail-outcome' : 'billing-rvg-code'} style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 8 }}>
      {toggle && editable && (
        <div data-shot="contract-rail-other-price" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mobile && <span style={FIELD_LABEL}>Price by</span>}
          <SlidingSegmentedControl
            ariaLabel="Price by"
            layout="two-column"
            value={mode === 'amount' ? 'amount' : 'rvg'}
            options={PRICE_BY}
            onSelect={onPriceBy}
            buttonStyle={{ minHeight: mobile ? 44 : 40, fontSize: mobile ? 16 : 14, fontWeight: 600 }}
          />
        </div>
      )}
      {mode === 'amount' && (
        <AmountEntry
          procedure={procedure}
          onFallback={contract !== undefined && contract.pricing.kind === 'open'}
          mayType={editable && fallback?.mayTypeAmount === true}
          editable={editable}
          mobile={mobile}
          onAmount={onAmount}
        />
      )}
      {/* Ben's second route (US-03.3.9): a typed price with an RVG code kept for reference. */}
      {mode === 'amount' &&
        contract !== undefined &&
        (coded || referenceOpen ? (
          field('reference')
        ) : canCapture ? (
          <span style={{ alignSelf: 'flex-start' }}>
            <TextAction size="sm" shot="rvg-code-add-reference" onClick={() => setReferenceOpen(true)}>
              Add an RVG code for reference
            </TextAction>
          </span>
        ) : null)}
      {mode === 'rvg' && field(coded ? undefined : 'required')}
      {mode === 'none' && field(undefined, 'Its price follows the Contract, once one is chosen.')}
      {mode === 'fixed' &&
        (coded || referenceOpen ? (
          field('reference')
        ) : canCapture ? (
          <span style={{ alignSelf: 'flex-start' }}>
            <TextAction size="sm" shot="rvg-code-add-reference" onClick={() => setReferenceOpen(true)}>
              Add an RVG code for reference
            </TextAction>
          </span>
        ) : null)}
    </div>
  )
}

/**
 * The fixed price's amount (the destination's Other price; the mock's "Fixed
 * price" field): saved when the field is left or Enter is pressed. Where only the
 * office types it, the anaesthetist can still choose it and leave the amount.
 */
function AmountEntry({
  procedure,
  onFallback,
  mayType,
  editable,
  mobile,
  onAmount,
}: {
  procedure: Procedure
  onFallback: boolean
  mayType: boolean
  editable: boolean
  mobile: boolean
  onAmount: (amount: number | undefined) => void
}) {
  const saved = onFallback ? procedure.enteredPrice : undefined
  // In the Admin draft (catch-up Phase 35) the amount writes to the draft as typed, so the save bar and
  // the leave guard see it at once; elsewhere it saves on blur or Enter.
  const draftMode = useBookingStoreMode() === 'draft'
  const [text, setText] = useState(saved !== undefined ? saved.toFixed(2) : '')
  useEffect(() => {
    const formatted = saved !== undefined ? saved.toFixed(2) : ''
    // A draft write of what is being typed keeps the text as typed (no "1" to "1.00" mid-entry).
    setText((prev) => (draftMode && prev.trim() !== '' && parseAmount(prev) === saved ? prev : formatted))
  }, [saved, draftMode])
  const typed = parseAmount(text)
  const commit = () => {
    if (typed !== undefined && typed !== saved) onAmount(typed)
  }
  const change = (value: string) => {
    setText(value)
    if (!draftMode) return
    const next = parseAmount(value)
    if (next !== undefined && next !== saved) onAmount(next)
  }
  const todo = saved === undefined && editable
  const label = (
    <span style={{ ...FIELD_LABEL, color: todo && mobile ? accent.base : neutral.slate }}>
      Fixed price{todo && mobile ? ' · to do' : ''}
    </span>
  )
  // The typed amount is the rail's one amount field (UI unification U4, README U24: 44px, a hint line, aria-invalid).
  if (mayType) {
    return (
      <BackstopAmountField
        label={label}
        ariaLabel="Fixed price, ex GST"
        value={text}
        onChange={change}
        onCommit={commit}
        invalid={text.trim() !== '' && typed === undefined}
        block={mobile}
      />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label}
      {saved !== undefined ? (
        <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{formatCurrency(saved)}</span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: neutral.slate }}>{OFFICE_TYPES_AMOUNT_MESSAGE}</span>
          {editable && !onFallback && (
            <Button variant="primary" onClick={() => onAmount(undefined)}>
              Use Fixed price
            </Button>
          )}
        </span>
      )}
    </div>
  )
}

function ReadOnlySummary({ contract, answersText, officeOnly }: { contract?: Contract; answersText: string; officeOnly: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {contract !== undefined ? (
        <>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{railContractLabel(contract)}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>
          </span>
        </>
      ) : (
        <span style={{ fontSize: 13.5, color: neutral.slate }}>So far: {answersText}</span>
      )}
      {officeOnly && <span data-shot="contract-set-by-office" style={{ fontSize: 12.5, color: neutral.slate }}>Set by the office</span>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phone: a summary of how the Procedure is billed; tapping it opens the sheet
// ---------------------------------------------------------------------------

/**
 * The phone's Billing card (owner review, 2026-11-16): a short summary (Invoice
 * to, Contract, Price) that opens the Billing sheet, and a fourth row, Paid by
 * (catch-up Phase 22, owner review 2026-11-17), that opens the Split sheet; where every step, "Price by" and the RVG code are edited through the
 * same flow as the web and Admin card.
 */
function MobileBillingCard(props: BillingCardProps) {
  const { procedure, actor, canEdit, canCapture, rvgGroup, codeFailures, displayNumber, procedureCount } = props
  const { masters, context, contract, start } = useBilling(procedure)
  const paidBy = usePaidBy(props)
  const { Overlay } = useSurface()
  const [open, setOpen] = useState(false)
  if (context === undefined) return null
  const railActor = railActorOf(actor)
  const officeOnly = railActor === 'anaesthetist' && contract?.prepaid === true
  const editable = (canEdit && !officeOnly) || canCapture
  const answers = contract !== undefined ? railAnswersText(masters, context, start) : procedure.railAnswers !== undefined ? railAnswersText(masters, context, procedure.railAnswers) : undefined
  const priceLine = contract !== undefined ? priceSummary(contract, procedure, rvgGroup, context.listDateISO, railActor) : rvgGroup !== undefined ? `RVG ${rvgGroup.code}` : undefined
  const rvgTodo = contract !== undefined && isRvgKind(contract.pricing.kind) && procedure.rvgGroupId === undefined && canCapture
  const label = cardLabel(displayNumber, procedureCount)

  const rows = (
    <>
      <SummaryRow label="Invoice to" value={answers} todo={answers === undefined ? 'Where the invoice goes' : undefined} />
      <SummaryRow label="Contract" value={contract !== undefined ? railContractLabel(contract) : undefined} todo={contract === undefined ? (answers === undefined ? 'After where the invoice goes' : 'Not chosen yet') : undefined} />
      <SummaryRow
        label="Price"
        value={priceLine}
        {...(rvgGroup !== undefined && procedure.rvgGroupId !== undefined ? { sub: rvgGroup.description } : {})}
        todo={rvgTodo ? 'Choose the RVG code' : priceLine === undefined ? 'Follows the Contract' : undefined}
        todoAccent={rvgTodo}
        last
      />
    </>
  )

  return (
    // The card holds two tap targets (idea 6): the summary opens the Billing sheet, Paid by opens the Split sheet.
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16 }}>
      <button
        type="button"
        className="aa-ctl"
        data-shot="capture-billing"
        aria-label={`${label}. ${editable ? 'Edit' : 'Read only'}`}
        disabled={!editable}
        onClick={() => setOpen(true)}
        tabIndex={editable ? 0 : -1}
        data-validation-procedure-id={procedure.id}
        data-validation-fields={['rvgGroupId', 'baseUnitsSelected', ...BILLING_FAILURE_FIELDS].join(' ')}
        style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: radius.ctl, padding: 0, fontFamily: 'inherit', cursor: editable ? 'pointer' : 'default', color: 'inherit' }}
      >
        <span style={{ display: 'flex', alignItems: 'baseline', width: '100%' }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</span>
          {editable && <span style={{ fontSize: 14, fontWeight: 600, color: accent.base }}>Edit</span>}
        </span>
        <span data-shot="billing-contract-rows" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>{rows}</span>
        {officeOnly && <span data-shot="contract-set-by-office" style={{ fontSize: 12.5, color: neutral.slate }}>Set by the office</span>}
        {codeFailures.length > 0 && (
          <span style={{ width: '100%' }}>
            <FailureNotes failures={codeFailures} />
          </span>
        )}
      </button>
      {paidBy !== null && <PaidByRow {...paidBy} variant="summary" />}
      <LockBadge bookingId={procedure.bookingId} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
      <Overlay open={open} onClose={() => setOpen(false)}>
        <div data-shot="billing-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OverlayHeader title={label} />
          <BillingSteps {...props} layout="sheet" />
          <Button onClick={() => setOpen(false)} style={{ width: '100%', minHeight: 48 }}>
            Done
          </Button>
        </div>
      </Overlay>
    </div>
  )
}

function SummaryRow({ label, value, sub, todo, todoAccent, last }: { label: string; value?: string | undefined; sub?: string; todo?: string | undefined; todoAccent?: boolean; last?: boolean }) {
  const shown = value ?? todo
  return (
    <span
      data-shot={`billing-row-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      style={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', columnGap: 12, alignItems: 'baseline', padding: '10px 0', borderBottom: last === true ? 'none' : `1px solid ${neutral.line}` }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }}>{label}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: value !== undefined ? 600 : 500, color: value !== undefined ? neutral.ink : todoAccent === true ? accent.base : neutral.mist }}>{shown}</span>
        {value !== undefined && todo !== undefined && todoAccent === true && <span style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>{todo}</span>}
        {sub !== undefined && <span style={{ fontSize: 13, color: neutral.slate }}>{sub}</span>}
      </span>
    </span>
  )
}
