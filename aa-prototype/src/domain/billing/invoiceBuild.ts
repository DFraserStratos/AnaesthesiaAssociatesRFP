/**
 * Invoice building for the billing run (Phase 08) — pure decisions over the
 * Phase 01 calculator (convention 9). The store's `billingRun.ts` orchestrates
 * (reads state, allocates ids, commits, audits); this module decides:
 *
 *  - which contract governs each Procedure on the List (service) date, with
 *    the RFP's exactly-scoped fallback: an expired/absent negotiated contract
 *    HELD BY a hospital or direct-billing insurer falls back to that
 *    counterparty's protected default Type 1 at standard rates, while surgeon,
 *    group or organisation holders carry NO mandated default — a genuine
 *    billing exception (Phase 09's failure demo; 3rd review #9);
 *  - who each Procedure (and each funder-overridden BillingLine) bills to —
 *    resolution is BY CONTRACT HOLDER on the contract-holder route;
 *  - how lines group into invoices: one invoice per Card per distinct
 *    counterparty (§11 labelled reading — the RFP's "two separate invoices"
 *    split outcome arises when funders differ).
 */

import type {
  Card,
  Contract,
  ContractHolderType,
  CounterpartyRef,
  IsoDate,
  Procedure,
  ProcedureId,
} from '../types'
import { feeFor, type FeeLine } from './fee'
import { roundToCents, toCents } from './money'
import { isEffectiveOn, selectContract } from './contracts'
import { feeContextFor, type CardBillingContext } from './validateCardForBilling'

/**
 * ASSUMPTION (demo, discovery item): the RFP is silent on invoice GST
 * mechanics — it speaks only of the GST component of amounts received — so
 * invoice documents here show GST-exclusive line amounts plus GST at the NZ
 * standard rate. AA to confirm the intended treatment.
 */
export const GST_RATE = 0.15

export interface InvoiceBuildContext extends CardBillingContext {
  /** Contract effectiveness is judged on the List (service) date. */
  listDateISO: IsoDate
  /** The List's hospital — resolves the hospital route's default when no contract is stored. */
  listHospitalId?: string
  /** The Card's patient — the Billable Party route's default payer (7th review A1). */
  patientId: string
  /**
   * EX-GST amounts already invoiced ahead of the procedure (Phase 09
   * pre-payment), keyed by procedure id, WITH the counterparty the pre-invoice
   * was raised against. The balance run threads this in and
   * `buildInvoicesForCard` appends one visible deduction line per prepaid
   * procedure so the invoice bills only the remaining balance. A full
   * pre-payment nets that procedure's group to $0 (no balance invoice). The
   * stored counterparty is checked against the procedure's CURRENT counterparty
   * so an office payer-change after the deposit fails the Card for review
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

const HOLDER_LABEL: Record<ContractHolderType, string> = {
  hospital: 'hospital',
  insurer: 'insurer',
  surgeon: 'surgeon',
  organisation: 'group or organisation',
  billableParty: 'billable party',
}

/**
 * The fallback target is the protected DEFAULT Type 1 specifically — never
 * some other surviving negotiated contract (that would silently re-negotiate
 * the arrangement). Candidates are pre-filtered to defaults; `selectContract`
 * then applies the holder match and the effective-date predicate.
 */
function defaultContractFor(
  holderType: ContractHolderType,
  holderId: string,
  ctx: InvoiceBuildContext,
): ContractResolution {
  const fallback = selectContract(
    Object.values(ctx.contracts).filter((c) => c.isDefault),
    {
      holder: { holderType, holderId },
      anaesthetistId: ctx.anaesthetist.registrationNumber,
      dateISO: ctx.listDateISO,
    },
  )
  if (fallback === undefined) {
    return {
      kind: 'exception',
      code: 'noContract',
      message: `No default contract found for the ${HOLDER_LABEL[holderType]} counterparty. Every hospital and direct billing insurer holds a protected default Type 1, so this state needs manual review.`,
    }
  }
  return { kind: 'resolved', contract: fallback }
}

/**
 * Which contract governs this Procedure for billing. The stored
 * `governingContractId` is authoritative while it is in effect on the List
 * date; after that the RFP's scoped guarantee decides (see module header).
 */
export function resolveContractForProcedure(
  procedure: Procedure,
  ctx: InvoiceBuildContext,
): ContractResolution {
  const stored =
    procedure.governingContractId !== undefined
      ? ctx.contracts[procedure.governingContractId]
      : undefined

  // A stored reference to a contract that no longer exists is an exception,
  // never "nothing stored" — a deleted surgeon-held arrangement must not blur
  // into the hospital fallback and bill the wrong counterparty (8th review).
  if (procedure.governingContractId !== undefined && stored === undefined) {
    return {
      kind: 'exception',
      code: 'contractMissing',
      message: `The governing contract ${procedure.governingContractId} no longer exists. This Card needs manual review.`,
    }
  }

  if (stored !== undefined && isEffectiveOn(stored, ctx.listDateISO)) {
    return { kind: 'resolved', contract: stored }
  }

  if (stored !== undefined) {
    if (stored.holderType === 'hospital' || stored.holderType === 'insurer') {
      return defaultContractFor(stored.holderType, stored.holderId, ctx)
    }
    return {
      kind: 'exception',
      code: 'contractIneffective',
      message: `No contract in effect on ${ctx.listDateISO}. ${stored.name} is held by a ${HOLDER_LABEL[stored.holderType]}, which carries no default fallback. This Card needs manual review in the billing monitor (Phase 09).`,
    }
  }

  // Nothing stored: the hospital and insurer routes always resolve to the
  // counterparty's default Type 1 (the RFP's "no contract found branch does
  // not exist" guarantee); the Billable Party route needs no contract at all
  // (standard rates; an individual-arrangement contract is optional).
  if (procedure.billingRoute === 'hospital') {
    if (ctx.listHospitalId === undefined) {
      return {
        kind: 'exception',
        code: 'noContract',
        message: 'No governing contract is stored and the List names no hospital to resolve a default from.',
      }
    }
    return defaultContractFor('hospital', ctx.listHospitalId, ctx)
  }
  if (procedure.billingRoute === 'insurer') {
    if (procedure.insurerId === undefined) {
      return {
        kind: 'exception',
        code: 'noContract',
        message: 'No governing contract is stored and the procedure names no insurer to resolve a default from.',
      }
    }
    return defaultContractFor('insurer', procedure.insurerId, ctx)
  }
  if (procedure.billingRoute === 'billableParty') return { kind: 'resolved' }

  // No route and nothing stored: completion validation normally prevents this,
  // but the office can move an incomplete Card onto a SUBMITTED List (3rd
  // review #7), so the run must fail the Card as data, never throw (8th review).
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
): CounterpartyRef {
  if (procedure.billingRoute === 'insurer' && procedure.insurerId !== undefined) {
    return { kind: 'insurer', id: procedure.insurerId }
  }
  if (procedure.billingRoute === 'billableParty') {
    return procedure.billablePartyId !== undefined
      ? { kind: 'billableParty', id: procedure.billablePartyId }
      : { kind: 'patient', id: patientId }
  }
  if (resolvedContract !== undefined) {
    return { kind: resolvedContract.holderType, id: resolvedContract.holderId }
  }
  // Truly unreachable: `resolveContractForProcedure` returns a contract-less
  // resolution only for the billableParty route (handled above) and fails a
  // route-less procedure as an exception before this is called. Kept as a hard
  // error so a future resolution change can never mis-bill silently.
  throw new Error(`counterpartyForProcedure: no counterparty resolvable for procedure ${procedure.id}`)
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

export type CardBuildResult =
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
 * Build the invoice boundaries for one Card: rate every Procedure with its
 * RESOLVED contract, tag every line with its funder, then group by
 * counterparty — one invoice per Card per distinct counterparty. Amounts are
 * snapshots; nothing here is recomputed after the run commits.
 *
 * `procedures` must be in Card order (ordinal = index + 1, the 2nd-procedure
 * contract pricing key). A resolution exception on any Procedure fails the
 * whole Card (per-card isolation; the List still completes its run).
 */
export function buildInvoicesForCard(
  card: Card,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): CardBuildResult {
  // Cancelled Cards are retained but never billed (7th review B23).
  if (card.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: { counterparty: CounterpartyRef; line: DraftInvoiceLine }[] = []

  for (const [index, procedure] of procedures.entries()) {
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
    const procedureCounterparty = counterpartyForProcedure(procedure, contract, ctx.patientId)

    // Price with the RESOLVED contract — `feeContextFor` injects the STORED
    // one, which may be the very contract that is effective-dated out.
    const feeCtx = feeContextFor(procedure, index + 1, ctx)
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
      // fail the Card for review.
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
      // edit, or the fallback substituting the default), and a stale split
      // must fail the Card for review, never bill silently short (8th review).
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
    // negative override fees, so this belt catches moved/edge cards and a
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
 * Build the PRE-PAYMENT (pre-procedure) invoice boundaries for one Card
 * (Phase 09; B7). Covers ONLY the patient-funded procedures — those on the
 * Billable Party route with the `selfFundedPrepayment` category; a mixed
 * card's contract-holder procedures are untouched here (they bill normally
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
export function buildPrePaymentInvoiceForCard(
  card: Card,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): CardBuildResult {
  if (card.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: { counterparty: CounterpartyRef; line: DraftInvoiceLine }[] = []
  for (const [index, procedure] of procedures.entries()) {
    if (
      procedure.billingRoute !== 'billableParty' ||
      procedure.patientPaymentCategory !== 'selfFundedPrepayment'
    ) {
      continue
    }
    const counterparty = counterpartyForProcedure(procedure, undefined, ctx.patientId)
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
      const feeCtx = feeContextFor(procedure, index + 1, ctx)
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
