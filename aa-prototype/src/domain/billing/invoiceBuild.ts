/**
 * Invoice building for the billing run (Phase 08) — pure decisions over the
 * Phase 01 calculator (convention 9). The store's `billingRun.ts` orchestrates
 * (reads state, allocates ids, commits, audits); this module decides:
 *
 *  - which Contract governs each Procedure (catch-up Phase 18): the stored
 *    Contract, whatever its status (a Disabled Contract still prices and bills
 *    a Procedure already on it, D81); a dangling id, or a primary Procedure on
 *    a fixed-price Contract with no price for it, is a billing exception the
 *    office resolves in the billing monitor; with nothing stored, the hospital
 *    and insurer routes bill under that Party's plain RVG Contract (INTERIM
 *    until Phase 20's step rail);
 *  - who each Procedure (and each funder-overridden BillingLine) bills to —
 *    on the contract-holder route, the resolved Contract's holder Party,
 *    through its interim counterparty (INTERIM until Phase 21, which bills by
 *    the Contract's `billsTo`);
 *  - how lines group into invoices: one invoice per Booking per distinct
 *    counterparty (§11 labelled reading — the RFP's "two separate invoices"
 *    split outcome arises when funders differ).
 */

import type {
  Booking,
  Contract,
  CounterpartyRef,
  Procedure,
  ProcedureId,
} from '../types'
import { feeFor, type FeeLine } from './fee'
import { roundToCents, toCents } from './money'
import { interimRouteContract, noRouteContractMessage, procedureNeedsPrice } from './contracts'
import { needsPriceMessage } from './priceRanges'
import { hospitalPartyFor, insurerPartyFor, noRouteCounterpartyMessage, routeCounterpartyForParty, type Party } from './parties'
import { feeContextFor, type BookingBillingContext } from './validateBookingForBilling'

/**
 * ASSUMPTION (demo, discovery item): the RFP is silent on invoice GST
 * mechanics — it speaks only of the GST component of amounts received — so
 * invoice documents here show GST-exclusive line amounts plus GST at the NZ
 * standard rate. AA to confirm the intended treatment.
 */
export const GST_RATE = 0.15

export interface InvoiceBuildContext extends BookingBillingContext {
  /** The Booking's patient — the Billable Party route's default payer (7th review A1). */
  patientId: string
  /**
   * EX-GST amounts already invoiced ahead of the procedure (Phase 09
   * pre-payment), keyed by procedure id, WITH the counterparty the pre-invoice
   * was raised against. The balance run threads this in and
   * `buildInvoicesForBooking` appends one visible deduction line per prepaid
   * procedure so the invoice bills only the remaining balance. A full
   * pre-payment nets that procedure's group to $0 (no balance invoice). The
   * stored counterparty is checked against the procedure's CURRENT counterparty
   * so an office payer-change after the deposit fails the Booking for review
   * rather than crediting the wrong party.
   */
  prePaidByProcedure?: Record<ProcedureId, { amount: number; counterparty: CounterpartyRef }>
}

export type ContractResolutionExceptionCode =
  | 'contractIneffective'
  | 'contractMissing'
  | 'noContract'
  | 'noBillingRoute'

export type ContractResolution =
  | { kind: 'resolved'; contract?: Contract }
  | { kind: 'exception'; code: ContractResolutionExceptionCode; message: string }

/**
 * Nothing stored on the hospital or insurer route (INTERIM until Phase 20):
 * the Party's plain RVG Contract.
 */
function routeContractFor(holder: Party | undefined, ctx: InvoiceBuildContext): ContractResolution {
  const contract = interimRouteContract(ctx.contracts, holder?.id)
  if (contract === undefined) {
    return {
      kind: 'exception',
      code: 'noContract',
      message: noRouteContractMessage(holder?.name ?? 'the counterparty'),
    }
  }
  return { kind: 'resolved', contract }
}

/** Which Contract governs this Procedure for billing (see the module header). */
export function resolveContractForProcedure(procedure: Procedure, ctx: InvoiceBuildContext): ContractResolution {
  const stored =
    procedure.governingContractId !== undefined
      ? ctx.contracts[procedure.governingContractId]
      : undefined

  // A stored reference to a Contract that is not there is an exception, never
  // "nothing stored": it must not blur into the route's Contract and bill the
  // wrong counterparty (8th review).
  if (procedure.governingContractId !== undefined && stored === undefined) {
    return {
      kind: 'exception',
      code: 'contractMissing',
      message: `The Contract ${procedure.governingContractId} on this procedure could not be found. Choose a Contract and retry.`,
    }
  }

  if (stored !== undefined) {
    // "Needs a price" (catch-up Phase 19a): a Procedure on a fixed-price
    // Contract with no range in force on the List's date (or on an open
    // price) cannot be invoiced, unless the office typed a fixed fee.
    if (procedureNeedsPrice(stored, ctx.listDateISO, procedure)) {
      return { kind: 'exception', code: 'contractIneffective', message: needsPriceMessage(stored, ctx.listDateISO, { named: true }) }
    }
    return { kind: 'resolved', contract: stored }
  }

  // Nothing stored: the hospital and insurer routes bill under that Party's
  // plain RVG Contract (INTERIM until Phase 20); the Billable Party route needs
  // no Contract at all (standard rates).
  if (procedure.billingRoute === 'hospital') {
    if (ctx.listHospitalId === undefined) {
      return {
        kind: 'exception',
        code: 'noContract',
        message: 'No Contract is chosen and the List names no hospital to bill under.',
      }
    }
    return routeContractFor(hospitalPartyFor(ctx.parties, ctx.listHospitalId), ctx)
  }
  if (procedure.billingRoute === 'insurer') {
    if (procedure.insurerId === undefined) {
      return {
        kind: 'exception',
        code: 'noContract',
        message: 'No Contract is chosen and the procedure names no insurer to bill under.',
      }
    }
    return routeContractFor(insurerPartyFor(ctx.parties, procedure.insurerId), ctx)
  }
  if (procedure.billingRoute === 'billableParty') return { kind: 'resolved' }

  // No route and nothing stored: completion validation normally prevents this,
  // but the office can move an incomplete Booking onto a SUBMITTED List (3rd
  // review #7), so the run must fail the Booking as data, never throw (8th review).
  return {
    kind: 'exception',
    code: 'noBillingRoute',
    message: 'No billing route is set on this procedure. Complete its billing setup before rebilling.',
  }
}

/**
 * Who the Procedure bills to. On the contract-holder route the counterparty
 * is the resolved contract's HOLDER — usually a hospital, but surgeon-held
 * (bariatric), group-held (TMJ, COS) and organisation-held contracts bill
 * their holder (1st review #5). The Billable Party route defaults to the
 * patient; a typed BillableParty record is the override (7th review A1).
 */
export function counterpartyForProcedure(
  procedure: Procedure,
  resolvedContract: Contract | undefined,
  patientId: string,
  parties: Readonly<Record<string, Party>>,
): CounterpartyRef | undefined {
  if (procedure.billingRoute === 'insurer' && procedure.insurerId !== undefined) {
    return { kind: 'insurer', id: procedure.insurerId }
  }
  if (procedure.billingRoute === 'billableParty') {
    return procedure.billablePartyId !== undefined
      ? { kind: 'billableParty', id: procedure.billablePartyId }
      : { kind: 'patient', id: patientId }
  }
  // INTERIM until Phase 21: the route bills the resolved Contract's holder
  // Party through its interim counterparty; never reads `billsTo`.
  if (resolvedContract !== undefined) return routeCounterpartyForParty(parties[resolvedContract.holderId])
  return undefined
}

/** Recipient class drives the document layout (RFP: two invoice layouts). */
export function layoutFor(counterparty: CounterpartyRef): 'contractHolder' | 'patient' {
  return counterparty.kind === 'patient' || counterparty.kind === 'billableParty'
    ? 'patient'
    : 'contractHolder'
}

export interface DraftInvoiceLine {
  procedureId?: ProcedureId
  description: string
  units?: number
  amount: number
}

export interface DraftInvoice {
  counterparty: CounterpartyRef
  layout: 'contractHolder' | 'patient'
  lines: DraftInvoiceLine[]
  subtotal: number
  gst: number
  total: number
}

export type BookingBuildResult =
  | { kind: 'invoices'; invoices: DraftInvoice[] }
  | { kind: 'exception'; procedureId: ProcedureId; code: string; message: string }

/**
 * Snapshot the rate detail into the line description — `InvoiceLine` carries
 * no rate/hours fields, and an invoice must be reproducible against what was
 * true when it was raised (RFP design principle 10).
 */
function describeFeeLine(line: FeeLine): string {
  if (line.chargeBasis === 'rvg' && line.units !== undefined && line.rate !== undefined) {
    return `${line.description}, ${line.units} units at $${line.rate.toFixed(2)} per unit`
  }
  return line.description
}

/**
 * Build the invoice boundaries for one Booking: rate every Procedure with its
 * RESOLVED contract, tag every line with its funder, then group by
 * counterparty — one invoice per Booking per distinct counterparty. Amounts are
 * snapshots; nothing here is recomputed after the run commits.
 *
 * `procedures` must be in Booking order (ordinal = index + 1, the 2nd-procedure
 * contract pricing key). A resolution exception on any Procedure fails the
 * whole Booking (per-booking isolation; the List still completes its run).
 */
export function buildInvoicesForBooking(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): BookingBuildResult {
  // Cancelled Bookings are retained but never billed (7th review B23).
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: { counterparty: CounterpartyRef; line: DraftInvoiceLine }[] = []

  for (const procedure of procedures) {
    const resolution = resolveContractForProcedure(procedure, ctx)
    if (resolution.kind === 'exception') {
      return {
        kind: 'exception',
        procedureId: procedure.id,
        code: resolution.code,
        message: resolution.message,
      }
    }
    const contract = resolution.contract
    const procedureCounterparty = counterpartyForProcedure(procedure, contract, ctx.patientId, ctx.parties)
    if (procedureCounterparty === undefined) {
      return {
        kind: 'exception',
        procedureId: procedure.id,
        code: 'noCounterparty',
        message: noRouteCounterpartyMessage(contract?.name ?? 'This Contract'),
      }
    }

    // Price with the RESOLVED contract — `feeContextFor` injects the STORED
    // one; with nothing stored, the resolved one is the route's plain RVG Contract.
    const feeCtx = feeContextFor(procedure, ctx)
    if (contract !== undefined) feeCtx.contract = contract
    else delete feeCtx.contract
    const fee = feeFor(procedure, feeCtx)

    const storedLines = ctx.billingLines.filter((l) => l.procedureId === procedure.id)

    // A procedure that was pre-invoiced nets its deposit off the balance below
    // (non-override branch only).
    const prePaid = ctx.prePaidByProcedure?.[procedure.id]
    if (prePaid !== undefined) {
      // A funder split on the same procedure would make "which funder does the
      // deposit reduce" ambiguous, so refuse it to review.
      if (storedLines.some((l) => l.funderOverride !== undefined)) {
        return {
          kind: 'exception',
          procedureId: procedure.id,
          code: 'prepaidFunderOverride',
          message:
            'This procedure was pre-invoiced but also carries a funder split. Resolve the allocation before rebilling the balance.',
        }
      }
      // The deposit credit must land on the party the deposit was invoiced to.
      // If the payer changed after the deposit was raised (an office edit),
      // netting against the new party would orphan the old party's deposit, so
      // fail the Booking for review.
      if (
        prePaid.counterparty.kind !== procedureCounterparty.kind ||
        prePaid.counterparty.id !== procedureCounterparty.id
      ) {
        return {
          kind: 'exception',
          procedureId: procedure.id,
          code: 'prepaidCounterpartyChanged',
          message:
            'This procedure was pre-invoiced to a different payer than it now bills to. Reallocate the pre-payment before rebilling the balance.',
        }
      }
    }

    if (storedLines.some((l) => l.funderOverride !== undefined)) {
      // Once any line carries a funder override, the stored lines ARE the
      // explicit allocation of the WHOLE fee (validator-conserved to the cent
      // at completion). An un-overridden line bills the procedure's resolved
      // counterparty — the typed semantic of `funderOverride`.
      //
      // Conservation is RE-CHECKED here against the fee under the RESOLVED
      // contract: masters can change between completion and billing (a rate
      // edit in place, or a different Contract chosen), and a stale split
      // must fail the Booking for review, never bill silently short (8th review).
      const allocated = storedLines.reduce((sum, l) => sum + l.amount, 0)
      if (toCents(allocated) !== toCents(fee.total)) {
        return {
          kind: 'exception',
          procedureId: procedure.id,
          code: 'allocationStale',
          message: `The stored funder allocation adds up to $${allocated.toFixed(2)} but the fee under the governing arrangement is $${fee.total.toFixed(2)}. Reallocate before rebilling.`,
        }
      }
      for (const line of storedLines) {
        const draft: DraftInvoiceLine = {
          procedureId: procedure.id,
          description: line.description,
          amount: roundToCents(line.amount),
        }
        if (line.units !== undefined) draft.units = line.units
        tagged.push({ counterparty: line.funderOverride ?? procedureCounterparty, line: draft })
      }
      continue
    }

    for (const feeLine of fee.lines) {
      const draft: DraftInvoiceLine = {
        procedureId: procedure.id,
        description: describeFeeLine(feeLine),
        amount: feeLine.amount,
      }
      if (feeLine.units !== undefined) draft.units = feeLine.units
      tagged.push({ counterparty: feeLine.funderOverride ?? procedureCounterparty, line: draft })
    }
    if (fee.override !== null) {
      tagged.push({
        counterparty: procedureCounterparty,
        line: {
          procedureId: procedure.id,
          description: `Price override, ${fee.override.override.reason}`,
          amount: roundToCents(fee.override.after - fee.override.before),
        },
      })
    }

    // Net off any pre-payment already invoiced for this procedure, as a
    // VISIBLE deduction line on the procedure's resolved counterparty group
    // (not a fee-line mutation — preserves the principle-10 rate snapshot).
    // The deposit was raised as an ex-GST subtotal, so it subtracts from the
    // ex-GST fee subtotal here and the two reconcile to the full fee.
    if (prePaid !== undefined && prePaid.amount > 0) {
      tagged.push({
        counterparty: procedureCounterparty,
        line: {
          procedureId: procedure.id,
          description: 'Less pre-payment deposit already invoiced',
          amount: -roundToCents(prePaid.amount),
        },
      })
    }
  }

  // Group by counterparty in first-appearance order (deterministic).
  const groups = new Map<string, { counterparty: CounterpartyRef; lines: DraftInvoiceLine[] }>()
  for (const { counterparty, line } of tagged) {
    const key = `${counterparty.kind}:${counterparty.id}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, { counterparty, lines: [line] })
    else group.lines.push(line)
  }

  const invoices: DraftInvoice[] = []
  for (const { counterparty, lines } of groups.values()) {
    const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
    // A negative invoice is never raised (a real practice issues a credit
    // note; Xero refuses negative ACCREC totals). Completion validation gates
    // negative override fees, so this belt catches moved/edge bookings and a
    // pre-payment (deposit or full estimate) that exceeds the final rated fee.
    if (subtotal < 0) {
      return {
        kind: 'exception',
        procedureId: lines[0]?.procedureId ?? '',
        code: 'negativeTotal',
        message: `The lines billed to one counterparty add up to a negative amount ($${subtotal.toFixed(2)}). Review the pre-payment or price override before rebilling; an overpaid pre-payment needs a manual credit.`,
      }
    }
    // A group that nets to $0 raises no invoice — the full-pre-payment case
    // (deposit == fee) has nothing left to bill, cleaner than a $0 invoice.
    if (toCents(subtotal) === 0) continue
    const gst = roundToCents(subtotal * GST_RATE)
    invoices.push({
      counterparty,
      layout: layoutFor(counterparty),
      lines,
      subtotal,
      gst,
      total: roundToCents(subtotal + gst),
    })
  }
  return { kind: 'invoices', invoices }
}

/**
 * Build the PRE-PAYMENT (pre-procedure) invoice boundaries for one Booking
 * (Phase 09; B7). Covers ONLY the patient-funded procedures — those on the
 * Billable Party route with the `selfFundedPrepayment` category; a mixed
 * booking's contract-holder procedures are untouched here (they bill normally
 * after authorisation). Two shapes:
 *
 *   - `split`: a flat AGREED deposit line (the `depositAmount` figure, never
 *     via `feeFor` — the deposit is a negotiated number, not a fraction of the
 *     estimated fee);
 *   - `full`:  the estimated full fee via `feeFor` (the same calculator the
 *     balance run uses, so the balance nets to exactly $0).
 *
 * Deposit lines are EX-GST subtotals (an $800 deposit invoices as
 * 800 / GST 120 / total 920); the later balance run subtracts the same ex-GST
 * figure from the ex-GST fee subtotal, so deposit + balance reconciles to the
 * full fee. Grouped by counterparty (the typed BillableParty else the
 * patient); always the patient layout.
 */
export function buildPrePaymentInvoiceForBooking(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): BookingBuildResult {
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: { counterparty: CounterpartyRef; line: DraftInvoiceLine }[] = []
  for (const procedure of procedures) {
    if (
      procedure.billingRoute !== 'billableParty' ||
      procedure.patientPaymentCategory !== 'selfFundedPrepayment'
    ) {
      continue
    }
    const counterparty = counterpartyForProcedure(procedure, undefined, ctx.patientId, ctx.parties)
    if (counterparty === undefined) continue
    const detail = procedure.prepaymentDetail
    if (detail?.type === 'split') {
      // The validator guarantees a positive depositAmount on a split.
      const amount = roundToCents(detail.depositAmount ?? 0)
      if (amount <= 0) continue
      tagged.push({
        counterparty,
        line: { procedureId: procedure.id, description: 'Pre-payment deposit', amount },
      })
    } else {
      // Full pre-payment: the estimated full fee via the same calculator the
      // balance run uses.
      const feeCtx = feeContextFor(procedure, ctx)
      delete feeCtx.contract
      const fee = feeFor(procedure, feeCtx)
      const amount = roundToCents(fee.total)
      if (amount <= 0) continue
      const line: DraftInvoiceLine = {
        procedureId: procedure.id,
        description: 'Pre-payment, estimated full fee',
        amount,
      }
      if (fee.billableUnits > 0) line.units = fee.billableUnits
      tagged.push({ counterparty, line })
    }
  }

  const groups = new Map<string, { counterparty: CounterpartyRef; lines: DraftInvoiceLine[] }>()
  for (const { counterparty, line } of tagged) {
    const key = `${counterparty.kind}:${counterparty.id}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, { counterparty, lines: [line] })
    else group.lines.push(line)
  }

  const invoices: DraftInvoice[] = []
  for (const { counterparty, lines } of groups.values()) {
    const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
    const gst = roundToCents(subtotal * GST_RATE)
    invoices.push({
      counterparty,
      layout: 'patient',
      lines,
      subtotal,
      gst,
      total: roundToCents(subtotal + gst),
    })
  }
  return { kind: 'invoices', invoices }
}
