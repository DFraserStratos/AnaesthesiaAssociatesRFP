/**
 * Invoice building for the billing run (Phase 08) — pure decisions over the
 * Phase 01 calculator (convention 9). The store's `billingRun.ts` orchestrates
 * (reads state, allocates ids, commits, audits); this module decides:
 *
 *  - which Contract governs each Procedure (catch-up Phase 20, DM-10): the one
 *    stored Contract, whatever its status (a Disabled Contract still prices
 *    and bills a Procedure already on it, D81); none (`noContract`, "Needs an
 *    invoice destination"), a dangling id (`contractMissing`), or no price on
 *    the date (`contractIneffective`: a fixed price with no range in force, or
 *    an open price with no amount typed) is a billing exception the office
 *    resolves in the billing monitor. Nothing is resolved from the List;
 *  - who each Procedure bills to: the Contract says
 *    (`billablePartyForProcedure`, catch-up Phase 21: its holder, or the
 *    Procedure's own payer since 22a), unless the Procedure's fee is split
 *    (catch-up Phase 22, `splitShare.ts`), when each share bills its party;
 *  - how lines group into invoices: one invoice per Booking per distinct
 *    party by `kind:id` (FT-08.2, US-08.2.1), so Procedures sharing a payer
 *    share one invoice and a payer typed in separately (another BP id, even
 *    with the same name and email) gets their own; never matched on name. What each invoice prints is `invoicePresentation.ts`'s.
 */

import type {
  Booking,
  Contract,
  ContractId,
  CounterpartyRef,
  InvoiceBilledTo,
  InvoiceCrossMatch,
  InvoiceSplitInfo,
  Procedure,
  ProcedureId,
} from '../types'
import { feeFor } from './fee'
import { formatMoney, roundToCents, toCents } from './money'
import { btmOf, crossMatchFor, gstOn, invoiceLayoutFor, invoiceLineViews, type InvoiceLayout, type InvoiceLineView } from './invoicePresentation'
import { PARTY_GONE_REASON, resolveSplit, shareLabel, splitDoesNotFitMessage, splitLineText } from './splitShare'
import { splitPartiesOn } from './partyOptions'
import { procedureNeedsPrice } from './contracts'
import { needsPriceMessage } from './priceRanges'
import type { Party } from './parties'
import { billablePartyForProcedure, billedToFor, HOLDER_MISSING_MESSAGE } from './whoIsBilled'
import { feeContextFor, type BookingBillingContext } from './validateBookingForBilling'

export interface InvoiceBuildContext extends BookingBillingContext {
  /** The Booking's patient id (the payer when the "different payer" tick is clear). */
  patientId: string
  /** The List's surgeon, by name: the holder layout's cross-match field (catch-up Phase 22). */
  surgeonName?: string
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

export type ContractResolution =
  | { kind: 'resolved'; contract?: Contract }
  | { kind: 'exception'; code: ContractResolutionExceptionCode; message: string }

/** The run's sentence for a Procedure with no Contract (US-04.3.4). */
export const NEEDS_INVOICE_DESTINATION_MESSAGE = 'This procedure needs an invoice destination.'

/** Which Contract governs this Procedure for billing (see the module header). */
export function resolveContractForProcedure(procedure: Procedure, ctx: InvoiceBuildContext): ContractResolution {
  // No Contract: "Needs an invoice destination". The run fails the Booking as
  // data, never throws (8th review); nothing is derived from the List.
  if (procedure.governingContractId === undefined) {
    return { kind: 'exception', code: 'noContract', message: NEEDS_INVOICE_DESTINATION_MESSAGE }
  }
  const stored = ctx.contracts[procedure.governingContractId]
  // A stored reference to a Contract that is not there is an exception: it
  // must never bill a guessed counterparty (8th review).
  if (stored === undefined) {
    return {
      kind: 'exception',
      code: 'contractMissing',
      message: `The Contract ${procedure.governingContractId} on this procedure could not be found. Choose a Contract and retry.`,
    }
  }
  // "Needs a price" (catch-up Phase 19a): a fixed price with no range in force
  // on the List's date, or an open price with no amount typed, cannot be
  // invoiced, unless the office typed a fixed fee.
  if (procedureNeedsPrice(stored, ctx.listDateISO, procedure)) {
    return { kind: 'exception', code: 'contractIneffective', message: needsPriceMessage(stored, ctx.listDateISO, { named: true }) }
  }
  return { kind: 'resolved', contract: stored }
}

/**
 * Who the Procedure bills to, through the one rule (`billablePartyForProcedure`,
 * catch-up Phase 21): the holder Party when the resolved Contract bills its
 * holder, otherwise the Procedure's own payer (catch-up Phase 22a).
 */
export function counterpartyForProcedure(
  resolvedContract: Contract | undefined,
  procedure: Pick<Procedure, 'payer'>,
  patientId: string,
  parties: Readonly<Record<string, Party>>,
): CounterpartyRef | undefined {
  return billablePartyForProcedure(resolvedContract, procedure, patientId, parties)
}


export type DraftInvoiceLine = InvoiceLineView

export interface DraftInvoice {
  counterparty: CounterpartyRef
  /** The payer's details as at the run (`billedToFor`); only for the patient or another payer. */
  billedTo?: InvoiceBilledTo
  layout: InvoiceLayout
  lines: DraftInvoiceLine[]
  subtotal: number
  gst: number
  total: number
  /** The first Procedure's Contract, in Booking order. */
  contractId?: ContractId
  /** The Procedures this invoice bills, in Booking order. */
  procedureIds: ProcedureId[]
  /** Set when the invoice holds a split share (its first split line's). */
  split?: InvoiceSplitInfo
  /** Indexes, in this result, of the drafts holding the other shares of the same split(s); the run resolves them to ids. */
  splitSiblings?: number[]
  /** The Contract's holder reference code, on the holder's layout (US-04.2.18). */
  holderReference?: string
  /** The holder layout's cross-match fields (US-08.4.1). */
  crossMatch?: InvoiceCrossMatch
}

export type BookingBuildResult =
  | { kind: 'invoices'; invoices: DraftInvoice[] }
  | { kind: 'exception'; procedureId: ProcedureId; code: string; message: string }

interface TaggedLine {
  counterparty: CounterpartyRef
  /** True when this party is the one the Procedure's Contract bills. */
  isContractParty: boolean
  contract: Contract | undefined
  line: DraftInvoiceLine
  split?: InvoiceSplitInfo
}

/**
 * Build the invoice boundaries for one Booking: rate every Procedure with its
 * Contract, bill it to the party the Contract names (or divide it between the
 * parties of its split, US-08.2.3), then group by party: one invoice per
 * Booking per distinct party (FT-08.2, US-08.2.1). Amounts are snapshots;
 * nothing here is recomputed after the run commits.
 *
 * A split party who is also another Procedure's billable party on the same
 * Booking gets one invoice holding both (its `split` then describes the split
 * line); an invoice spanning Procedures takes the first Procedure's layout
 * (both logged readings). `procedures` must be in Booking order. A
 * resolution exception on any Procedure fails the whole Booking (per-booking
 * isolation; the List still completes its run).
 */
export function buildInvoicesForBooking(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): BookingBuildResult {
  // Cancelled Bookings are retained but never billed (7th review B23).
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: TaggedLine[] = []

  for (const procedure of procedures) {
    const resolution = resolveContractForProcedure(procedure, ctx)
    if (resolution.kind === 'exception') {
      return { kind: 'exception', procedureId: procedure.id, code: resolution.code, message: resolution.message }
    }
    const contract = resolution.contract
    const procedureCounterparty = counterpartyForProcedure(contract, procedure, booking.patientId, ctx.parties)
    if (procedureCounterparty === undefined) {
      return { kind: 'exception', procedureId: procedure.id, code: 'noCounterparty', message: HOLDER_MISSING_MESSAGE }
    }

    // Price with the resolved Contract (the stored one).
    const feeCtx = feeContextFor(procedure, ctx)
    if (contract !== undefined) feeCtx.contract = contract
    else delete feeCtx.contract
    const fee = feeFor(procedure, feeCtx)

    // A procedure that was pre-invoiced nets its deposit off the balance below.
    const prePaid = ctx.prePaidByProcedure?.[procedure.id]
    if (prePaid !== undefined) {
      // A split on a prepaid Procedure would make "which party does the
      // deposit reduce" ambiguous (INTERIM until Phase 27, which removes it).
      if (procedure.split !== undefined) {
        return { kind: 'exception', procedureId: procedure.id, code: 'prepaidSplit', message: PREPAID_SPLIT_MESSAGE }
      }
      // The deposit credit must land on the party the deposit was invoiced to.
      if (prePaid.counterparty.kind !== procedureCounterparty.kind || prePaid.counterparty.id !== procedureCounterparty.id) {
        return {
          kind: 'exception',
          procedureId: procedure.id,
          code: 'prepaidCounterpartyChanged',
          message:
            'This procedure was pre-invoiced to a different payer than it now bills to. Reallocate the pre-payment before rebilling the balance.',
        }
      }
    }

    const wording = procedure.invoiceDescription?.text ?? null
    const discount =
      contract?.pricing.kind === 'rvgDiscount' ? { percent: contract.pricing.discountPct, unitValue: ctx.anaesthetist.unitValue } : undefined
    // Full views (BTM included); the patient layout drops the BTM at grouping.
    const views = invoiceLineViews('contractHolder', fee, { procedureId: procedure.id, wording, ...(discount !== undefined ? { discount } : {}) })

    if (procedure.split !== undefined) {
      // US-08.2.3: divide the final fee (after any office override) between
      // the split's parties. A split that no longer fits fails review; it
      // never bills a guess.
      // A share whose party has left the Booking (a renamed or replaced payer) never bills that party.
      if (!splitPartiesOn(procedure, booking.patientId, procedure.split.shares, ctx.parties)) {
        return { kind: 'exception', procedureId: procedure.id, code: 'splitDoesNotFit', message: splitDoesNotFitMessage(fee.total, PARTY_GONE_REASON) }
      }
      const resolved = resolveSplit(fee.total, procedure.split.shares)
      if (!resolved.ok) {
        return { kind: 'exception', procedureId: procedure.id, code: 'splitDoesNotFit', message: splitDoesNotFitMessage(fee.total, resolved.reason) }
      }
      // The share line carries the whole Procedure's breakdown at the rate charged (a discount folded in), for cross-matching.
      const rvgLine = fee.lines.find((l) => l.chargeBasis === 'rvg' && l.rate !== undefined)
      const btm = rvgLine?.rate !== undefined ? btmOf(fee, rvgLine.rate) : undefined
      const lineWording = wording !== null && wording.trim() !== '' ? wording : (fee.lines[0]?.description ?? 'Anaesthesia')
      for (const share of resolved.amounts) {
        const line: DraftInvoiceLine = {
          procedureId: procedure.id,
          kind: 'fee',
          description: splitLineText(lineWording, fee.total, share.basis),
          amount: share.amountExGst,
          ...(btm !== undefined ? { btm } : {}),
        }
        tagged.push({
          counterparty: share.party,
          isContractParty: sameRef(share.party, procedureCounterparty),
          contract,
          line,
          split: { procedureId: procedure.id, feeExGst: fee.total, shareLabel: shareLabel(share.basis), isRest: share.isRest },
        })
      }
      continue
    }

    for (const view of views) tagged.push({ counterparty: procedureCounterparty, isContractParty: true, contract, line: view })

    // Net off any pre-payment already invoiced for this procedure, as a
    // VISIBLE deduction line (not a fee-line mutation: principle 10). The
    // deposit was raised ex GST, so it subtracts from the ex-GST subtotal.
    if (prePaid !== undefined && prePaid.amount > 0) {
      tagged.push({
        counterparty: procedureCounterparty,
        isContractParty: true,
        contract,
        line: { procedureId: procedure.id, kind: 'adjustment', description: 'Less pre-payment deposit already invoiced', amount: -roundToCents(prePaid.amount) },
      })
    }
  }

  // Group by party in first-appearance order (deterministic).
  interface Group {
    first: TaggedLine
    /** The first line billed to this party under its own Contract (for the holder reference and the Contract id). */
    own?: TaggedLine
    lines: DraftInvoiceLine[]
    procedureIds: ProcedureId[]
    split?: InvoiceSplitInfo
    splitProcedureIds: Set<ProcedureId>
  }
  const groups = new Map<string, Group>()
  for (const entry of tagged) {
    const key = refKey(entry.counterparty)
    let group = groups.get(key)
    if (group === undefined) {
      group = { first: entry, lines: [], procedureIds: [], splitProcedureIds: new Set() }
      groups.set(key, group)
    }
    group.lines.push(entry.line)
    if (group.own === undefined && entry.isContractParty && entry.split === undefined) group.own = entry
    const pid = entry.line.procedureId
    if (pid !== undefined && !group.procedureIds.includes(pid)) group.procedureIds.push(pid)
    if (entry.split !== undefined) {
      group.split ??= entry.split
      group.splitProcedureIds.add(entry.split.procedureId)
    }
  }

  const kept: { key: string; group: Group; draft: DraftInvoice }[] = []
  for (const [key, group] of groups) {
    const { counterparty, contract, isContractParty } = group.first
    const subtotal = roundToCents(group.lines.reduce((sum, l) => sum + l.amount, 0))
    // A negative invoice is never raised (a real practice issues a credit
    // note; Xero refuses negative ACCREC totals).
    if (subtotal < 0) {
      return {
        kind: 'exception',
        procedureId: group.lines[0]?.procedureId ?? '',
        code: 'negativeTotal',
        message: `The lines billed to one counterparty add up to a negative amount (${formatMoney(subtotal)}). Review the pre-payment or price override before rebilling; an overpaid pre-payment needs a manual credit.`,
      }
    }
    // A group that nets to $0 raises no invoice (the full-pre-payment case).
    if (toCents(subtotal) === 0) continue
    const gst = gstOn(subtotal)
    const layout = invoiceLayoutFor(contract, counterparty, isContractParty)
    const lines = layout === 'contractHolder' ? group.lines : group.lines.map(withoutBtm)
    // Read from the payers of this invoice's own Procedures (catch-up Phase 22a).
    const billedTo = billedToFor(counterparty, procedures.filter((p) => group.procedureIds.includes(p.id)), booking.patientId, ctx.patient)
    // The party's own Contract, where one of its lines bills under it, names the holder reference and the Contract.
    const ownContract = group.own?.contract ?? contract
    const holderReference = layout === 'contractHolder' ? ownContract?.holderReference : undefined
    const firstProcedure = procedures.find((p) => p.id === group.procedureIds[0])
    const draft: DraftInvoice = {
      counterparty,
      ...(billedTo !== undefined ? { billedTo } : {}),
      layout,
      lines,
      subtotal,
      gst,
      total: roundToCents(subtotal + gst),
      ...(ownContract !== undefined ? { contractId: ownContract.id } : {}),
      procedureIds: group.procedureIds,
      ...(group.split !== undefined ? { split: group.split } : {}),
      ...(holderReference !== undefined && holderReference.trim() !== '' ? { holderReference } : {}),
      ...(layout === 'contractHolder' ? { crossMatch: crossMatchFor(ctx.listDateISO, ctx.surgeonName, firstProcedure?.billingReference) } : {}),
    }
    kept.push({ key, group, draft })
  }

  // Each split share's invoice points at the invoices holding the other shares.
  kept.forEach(({ group, draft }, index) => {
    if (group.splitProcedureIds.size === 0) return
    const siblings = kept
      .map((other, i) => ({ other, i }))
      .filter(({ other, i }) => i !== index && [...group.splitProcedureIds].some((pid) => other.group.splitProcedureIds.has(pid)))
      .map(({ i }) => i)
    if (siblings.length > 0) draft.splitSiblings = siblings
  })

  return { kind: 'invoices', invoices: kept.map((k) => k.draft) }
}

/** The run's sentence for a split on a prepaid Procedure (INTERIM until Phase 27). */
export const PREPAID_SPLIT_MESSAGE = 'A prepaid procedure is billed by its prepayment, so its fee cannot be split. Remove the split before rebilling.'

function refKey(ref: CounterpartyRef): string {
  return `${ref.kind}:${ref.id}`
}

function sameRef(a: CounterpartyRef, b: CounterpartyRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

function withoutBtm(line: DraftInvoiceLine): DraftInvoiceLine {
  if (line.btm === undefined) return line
  const { btm: _btm, ...rest } = line
  return rest
}

/**
 * INTERIM until Phase 27 (catch-up Phase 20; D23, US-04.3.4): a Procedure
 * requires prepayment when its Contract is prepaid, which always bills the
 * payer on the Booking (OQ-73 at Confirm, D23), never a holder.
 */
export function procedureRequiresPrepayment(contract: Pick<Contract, 'prepaid' | 'billsTo'> | undefined): boolean {
  return contract?.prepaid === true && contract.billsTo === 'payer'
}

/**
 * Build the PRE-PAYMENT (pre-procedure) invoice boundaries for one Booking
 * (Phase 09; B7). Covers ONLY the Procedures on a prepaid Contract billed to a
 * person (INTERIM until Phase 27, catch-up Phase 20; D23); a mixed booking's
 * other Procedures are untouched here (they bill normally after
 * authorisation). Two shapes, from `prepaymentDetail` (INTERIM until 27):
 *
 *   - `split`: a flat AGREED deposit line (the `depositAmount` figure, never
 *     via `feeFor` — the deposit is a negotiated number, not a fraction of the
 *     estimated fee);
 *   - `full`:  the full fee via `feeFor` on the prepaid Contract (the same
 *     calculator the balance run uses, so the balance nets to exactly $0).
 *
 * Deposit lines are EX-GST subtotals (an $800 deposit invoices as
 * 800 / GST 120 / total 920); the later balance run subtracts the same ex-GST
 * figure from the ex-GST fee subtotal, so deposit + balance reconciles to the
 * full fee. Grouped by who is billed (each prepaid Procedure's own payer, the
 * patient unless another payer is ticked): one prepayment invoice per payer
 * (US-06.3.1 "One per payer", catch-up Phase 22a); always the patient layout.
 */
export function buildPrePaymentInvoiceForBooking(
  booking: Booking,
  procedures: readonly Procedure[],
  ctx: InvoiceBuildContext,
): BookingBuildResult {
  if (booking.cancellation !== undefined) return { kind: 'invoices', invoices: [] }

  const tagged: { counterparty: CounterpartyRef; contractId: ContractId; line: DraftInvoiceLine }[] = []
  for (const procedure of procedures) {
    const contract = procedure.governingContractId !== undefined ? ctx.contracts[procedure.governingContractId] : undefined
    if (contract === undefined || !procedureRequiresPrepayment(contract)) continue
    // A split fee is never prepaid by one party (catch-up Phase 22): the office removes the split first.
    if (procedure.split !== undefined) {
      return { kind: 'exception', procedureId: procedure.id, code: 'prepaidSplit', message: PREPAID_SPLIT_MESSAGE }
    }
    const counterparty = counterpartyForProcedure(contract, procedure, booking.patientId, ctx.parties)
    if (counterparty === undefined) continue
    const detail = procedure.prepaymentDetail
    if (detail?.type === 'split') {
      // The validator guarantees a positive depositAmount on a split.
      const amount = roundToCents(detail.depositAmount ?? 0)
      if (amount <= 0) continue
      tagged.push({
        counterparty,
        contractId: contract.id,
        line: { procedureId: procedure.id, kind: 'fee', description: 'Pre-payment deposit', amount },
      })
    } else {
      // Full prepayment: the full fee on the prepaid Contract, via the same
      // calculator the balance run uses.
      const fee = feeFor(procedure, feeContextFor(procedure, ctx))
      // No price yet (an open price with no amount typed): nothing to prepay.
      if (fee.needsPrice) {
        return { kind: 'exception', procedureId: procedure.id, code: 'contractIneffective', message: needsPriceMessage(contract, ctx.listDateISO, { named: true }) }
      }
      const amount = roundToCents(fee.total)
      if (amount <= 0) continue
      const line: DraftInvoiceLine = {
        procedureId: procedure.id,
        kind: 'fee',
        description: 'Pre-payment, estimated full fee',
        amount,
      }
      if (fee.billableUnits > 0) line.units = fee.billableUnits
      tagged.push({ counterparty, contractId: contract.id, line })
    }
  }

  const groups = new Map<string, { counterparty: CounterpartyRef; contractId?: ContractId; lines: DraftInvoiceLine[] }>()
  for (const { counterparty, contractId, line } of tagged) {
    const key = `${counterparty.kind}:${counterparty.id}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, { counterparty, contractId, lines: [line] })
    else group.lines.push(line)
  }

  const invoices: DraftInvoice[] = []
  for (const { counterparty, contractId, lines } of groups.values()) {
    const subtotal = roundToCents(lines.reduce((sum, l) => sum + l.amount, 0))
    const gst = gstOn(subtotal)
    const procedureIds = [...new Set(lines.flatMap((l) => (l.procedureId !== undefined ? [l.procedureId] : [])))]
    const billedTo = billedToFor(counterparty, procedures.filter((p) => procedureIds.includes(p.id)), booking.patientId, ctx.patient)
    invoices.push({
      counterparty,
      ...(billedTo !== undefined ? { billedTo } : {}),
      // A prepaid Contract always bills the payer (D23), so this is the patient's layout.
      layout: invoiceLayoutFor(contractId !== undefined ? ctx.contracts[contractId] : undefined, counterparty, true),
      lines,
      subtotal,
      gst,
      total: roundToCents(subtotal + gst),
      ...(contractId !== undefined ? { contractId } : {}),
      procedureIds,
    })
  }
  return { kind: 'invoices', invoices }
}
