/**
 * Prepayment, the one place (catch-up Phase 27; EP-06, FT-06.2, FT-06.3,
 * US-06.2.2, US-06.2.6, US-06.3.1, US-06.3.2, US-06.3.5, US-08.2.2, DM-20).
 *
 * A Procedure needs prepayment when the office has picked for it a Contract
 * under Patient › Payment type: Prepaid (18's `prepaid` setting, fixed for the
 * Contract's life): an anaesthetist's or a surgeon's prepaid price list, or No
 * contract · Fixed price (the Prepaid · Fixed price backstop) with an amount
 * typed. Never an RVG kind. Detection is per Procedure and derived, never
 * stored: a move changes no Contract, so it changes nothing here.
 *
 * Everything runs per payer group (D85): a Booking and one payer's prepaid
 * Procedures not yet on an issued invoice form one pending group; each issued
 * prepayment invoice is a group of its own, so an issued invoice never grows
 * and a Procedure added later gets an invoice of its own. The amount is the
 * Procedure's price when the invoice is raised (24's price: the range in force
 * on the procedure date, or the typed amount), in full and above zero; once
 * raised it is the invoice line's, read-only for everyone (A16, D30, D47).
 *
 * Artifacts: AR-58 (section 2.2, A2, A16, A17), AR-61 (#procedure,
 * #who-is-billed), AR-24 (#prepayment-invoicing, #prepayment-pair,
 * #prepaid-left-off), AR-52 (#pp-approved, #pp-pair).
 *
 * Pure (enforced by `domainPurity.test.ts`).
 */

import type { Booking, Contract, ContractId, CounterpartyRef, InvoiceId, Patient, Procedure, ProcedureId } from '../types'
import { roundToCents, toCents } from './money'
import { gstOn, invoiceLayoutFor } from './invoicePresentation'
import { billedToFor, payerContactMissing, payerCounterparty } from './whoIsBilled'
import { refKey } from './procedurePayer'
import { defaultInvoiceDescriptionFor } from './procedureStack'
import { inDisplayOrder } from './multiProcedure'
import { PREPAID_SPLIT_MESSAGE, type DraftInvoice, type DraftInvoiceLine } from './lock'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Whether the prepayment invoice names the anaesthetist, as other AA invoices
 * do (OQ-120 open, D68's default): one constant, so dropping the name is one
 * line. Approve and send passes it to the invoice (`namesSupplier`); 41's letter reads it too.
 */
export const PREPAYMENT_NAMES_ANAESTHETIST = true

/**
 * The AA Holding account (FT-06.3, US-06.5.1; D38): the payee a prepayment's
 * payable credits instead of the anaesthetist, and its Xero contact. The
 * payables run never pays it. Its balance, entries and the transfer to
 * whoever did the List live in `prepayHolding.ts` (catch-up Phase 27a).
 */
export const AA_HOLDING_ACCOUNT = {
  payeeAccount: 'aaHoldingAccount',
  contactKey: 'aaHoldingAccount',
  contactNumber: 'AA-HOLDING',
  name: 'AA Holding account',
} as const

/** Approve and send waits for a way to reach the payer (22's delivery). */
export const PAYER_CONTACT_FIRST = "Add the payer's email or postal address first"

/** Approve and send refused on a group with a Procedure that has no price yet (US-06.2.6). */
export const TYPE_AN_AMOUNT_FIRST = 'Type an amount above zero first'
// A17 (only the office moves a Procedure onto or off a prepaid Contract) is 20's `contractChangeRefusal` (contractRail.ts).

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** Whether a Contract makes its Procedure prepaid: 18's setting, which always bills the payer (D23). */
export function isPrepaidContract(contract: Pick<Contract, 'prepaid' | 'billsTo'> | undefined): boolean {
  return contract?.prepaid === true && contract.billsTo === 'payer'
}

type ContractsById = Readonly<Record<string, Contract>>

function contractOf(procedure: Pick<Procedure, 'governingContractId'>, contracts: ContractsById): Contract | undefined {
  return procedure.governingContractId !== undefined ? contracts[procedure.governingContractId] : undefined
}

/**
 * Every Procedure on the Booking whose Contract is prepaid, in display order.
 * The setting is fixed for the Contract's life, so no version or date is read.
 * A cancelled Booking has none.
 */
export function prepaidProceduresFor(booking: Pick<Booking, 'cancellation'>, procedures: readonly Procedure[], contracts: ContractsById): Procedure[] {
  if (booking.cancellation !== undefined) return []
  return inDisplayOrder(procedures).filter((p) => isPrepaidContract(contractOf(p, contracts)))
}

/**
 * Who a prepaid Procedure's prepayment is invoiced to: the Procedure's payer
 * (22a's `Procedure.payer`), always. OQ-73 (at Confirm, D23): a prepaid
 * Contract always bills the Procedure's payer, our reading (AR-58 A2); no
 * holder branch and no person-only guard.
 */
export function prepaymentPartyFor(procedure: Pick<Procedure, 'payer'>, patientId: string): CounterpartyRef {
  return payerCounterparty(procedure, patientId)
}

// ---------------------------------------------------------------------------
// The amount
// ---------------------------------------------------------------------------

export type PrepaidAmount =
  | { kind: 'priced'; contractId: ContractId; amount: number; source: 'range' | 'typed' | 'invoiced' }
  | { kind: 'noPrice' }

/**
 * The Procedure's prepaid amount (US-06.2.2, D27), ex GST: the issued
 * invoice's line once raised; before then 24's price now (`price`: the range
 * in force on the procedure date, or the amount typed on Prepaid · Fixed
 * price, null for "Needs a price"). Nothing above zero is `noPrice`. Never an
 * estimate, the RVG or a unit value.
 */
export function prepaidAmountFor(
  procedure: Pick<Procedure, 'governingContractId' | 'enteredPrice'>,
  price: number | null,
  issuedLine?: { contractId?: ContractId; amount: number },
): PrepaidAmount {
  if (issuedLine !== undefined) {
    return { kind: 'priced', contractId: issuedLine.contractId ?? procedure.governingContractId ?? '', amount: roundToCents(issuedLine.amount), source: 'invoiced' }
  }
  if (procedure.governingContractId === undefined || price === null || toCents(price) <= 0) return { kind: 'noPrice' }
  return { kind: 'priced', contractId: procedure.governingContractId, amount: roundToCents(price), source: procedure.enteredPrice !== undefined ? 'typed' : 'range' }
}

// ---------------------------------------------------------------------------
// Payer groups
// ---------------------------------------------------------------------------

/** An issued prepayment invoice as the groups read it. */
export interface IssuedPrepayment {
  invoiceId: InvoiceId
  invoiceNumber: string
  payer: CounterpartyRef
  lines: readonly { procedureId: ProcedureId; contractId?: ContractId; amount: number }[]
}

/**
 * A group's state: `awaitingApproval` (pending; `ready` false on a `noPrice`
 * Procedure or a payer with no email or postal address); `issued` (its
 * invoice matches); `notNeeded` (no Procedure on it is still prepaid, or the
 * Booking is cancelled) or `changedAfterSending` (a Procedure on it changed
 * Contract or left prepaid). After sending, either is the interim until 41's
 * cancellation handling (US-06.3.7, OQ-119 answered, D67): the invoice is
 * never rewritten and the office is warned.
 */
export type PrepaymentGroupState = 'awaitingApproval' | 'issued' | 'notNeeded' | 'changedAfterSending'

export interface PrepaymentGroupLine {
  procedureId: ProcedureId
  amount: PrepaidAmount
  /** Still on a prepaid Contract (an issued line can have left it). */
  stillPrepaid: boolean
}

export interface PrepaymentGroup {
  /** `pending:<payerKey>` or the issued invoice's id. */
  key: string
  payer: CounterpartyRef
  /** 22a's payer identity (`refKey`): the BP id or the patient, never a name. */
  payerKey: string
  state: PrepaymentGroupState
  procedureIds: ProcedureId[]
  lines: PrepaymentGroupLine[]
  /** The sum ex GST, or null while a line has no price. */
  amount: number | null
  ready: boolean
  /** Why a pending group is not ready, in the words every surface shows (no price, no payer contact, a split). */
  notReadyReason?: string
  invoice?: IssuedPrepayment
}

export interface PrepaymentGroupsInput {
  booking: Pick<Booking, 'id' | 'cancellation' | 'patientId'>
  procedures: readonly Procedure[]
  contracts: ContractsById
  /** The Booking's issued prepayment invoices. */
  issued: readonly IssuedPrepayment[]
  /** 24's price for each Procedure now (null: "Needs a price"). */
  priceOf: (procedure: Procedure) => number | null
  patient?: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'>
}

/**
 * The Booking's prepayment, per payer group (US-06.3.1 "One per payer").
 * OQ-140 (answered 18 November by Donald for the build, D85): payers are
 * grouped by identity through 22a's `refKey` over `payerCounterparty`, never
 * by name or email, so going back to one payer per Booking changes nothing
 * here. Issued groups first, by invoice number; then pending ones in display
 * order. A Booking with no prepaid Procedure and nothing issued has none.
 */
export function prepaymentGroupsFor(input: PrepaymentGroupsInput): PrepaymentGroup[] {
  const { booking, procedures, contracts } = input
  const byId = new Map(procedures.map((p) => [p.id, p]))
  const prepaid = prepaidProceduresFor(booking, procedures, contracts)
  const prepaidIds = new Set(prepaid.map((p) => p.id))
  const covered = new Set<ProcedureId>()
  const groups: PrepaymentGroup[] = []

  for (const issued of [...input.issued].sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))) {
    const lines: PrepaymentGroupLine[] = []
    let changed = false
    for (const line of issued.lines) {
      covered.add(line.procedureId)
      const procedure = byId.get(line.procedureId)
      const stillPrepaid = prepaidIds.has(line.procedureId)
      if (!stillPrepaid || (line.contractId !== undefined && procedure?.governingContractId !== line.contractId)) changed = true
      lines.push({ procedureId: line.procedureId, amount: prepaidAmountFor(procedure ?? {}, null, line), stillPrepaid })
    }
    const state: PrepaymentGroupState = lines.every((l) => !l.stillPrepaid) ? 'notNeeded' : changed ? 'changedAfterSending' : 'issued'
    groups.push({
      key: issued.invoiceId,
      payer: issued.payer,
      payerKey: refKey(issued.payer),
      state,
      procedureIds: lines.map((l) => l.procedureId),
      lines,
      amount: roundToCents(lines.reduce((s, l) => s + (l.amount.kind === 'priced' ? l.amount.amount : 0), 0)),
      ready: true,
      invoice: issued,
    })
  }

  const pending = new Map<string, { payer: CounterpartyRef; procedures: Procedure[] }>()
  for (const procedure of prepaid) {
    if (covered.has(procedure.id)) continue
    const payer = prepaymentPartyFor(procedure, booking.patientId)
    const key = refKey(payer)
    const group = pending.get(key)
    if (group === undefined) pending.set(key, { payer, procedures: [procedure] })
    else group.procedures.push(procedure)
  }
  for (const [payerKey, { payer, procedures: members }] of pending) {
    const lines = members.map((p) => ({ procedureId: p.id, amount: prepaidAmountFor(p, input.priceOf(p)), stillPrepaid: true }))
    const priced = lines.every((l) => l.amount.kind === 'priced')
    const contactOk = members.every((p) => !payerContactMissing(p, input.patient, contractOf(p, contracts)))
    // A split fee is never prepaid by one payer (22's rule): the office removes the split first.
    const unsplit = members.every((p) => p.split === undefined)
    groups.push({
      key: `pending:${payerKey}`,
      payer,
      payerKey,
      state: 'awaitingApproval',
      procedureIds: members.map((p) => p.id),
      lines,
      amount: priced ? roundToCents(lines.reduce((s, l) => s + (l.amount.kind === 'priced' ? l.amount.amount : 0), 0)) : null,
      ready: priced && contactOk && unsplit,
      ...(!priced ? { notReadyReason: TYPE_AN_AMOUNT_FIRST } : !unsplit ? { notReadyReason: PREPAID_SPLIT_MESSAGE } : !contactOk ? { notReadyReason: PAYER_CONTACT_FIRST } : {}),
    })
  }
  return groups
}

/** The pending group for a payer, if any. */
export function pendingGroupFor(groups: readonly PrepaymentGroup[], payerKey: string): PrepaymentGroup | undefined {
  return groups.find((g) => g.state === 'awaitingApproval' && g.payerKey === payerKey)
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/**
 * A payer group's status as people read it: pending is `awaitingApproval`;
 * an issued invoice is `unpaid`, `partPaid` or `paid` from mirror money
 * (received against its total), unless it is `notNeeded` or
 * `changedAfterSending`.
 */
export type PrepaymentStatus = 'awaitingApproval' | 'unpaid' | 'partPaid' | 'paid' | 'notNeeded' | 'changedAfterSending'

export function prepaymentStatusOf(state: PrepaymentGroupState, money?: { total: number; received: number }): PrepaymentStatus {
  if (state === 'awaitingApproval' || state === 'notNeeded' || state === 'changedAfterSending') return state
  const total = toCents(money?.total ?? 0)
  const received = toCents(money?.received ?? 0)
  if (total > 0 && received >= total) return 'paid'
  return received > 0 ? 'partPaid' : 'unpaid'
}

const SETTLED_RANK: Record<PrepaymentStatus, number> = {
  awaitingApproval: 0,
  unpaid: 1,
  partPaid: 2,
  changedAfterSending: 3,
  notNeeded: 4,
  paid: 5,
}

/** The least settled of a Booking's group statuses (the triangle and the rail pill), or `none`. */
export function leastSettled(statuses: readonly PrepaymentStatus[]): PrepaymentStatus | 'none' {
  if (statuses.length === 0) return 'none'
  return [...statuses].sort((a, b) => SETTLED_RANK[a] - SETTLED_RANK[b])[0]!
}

/** Whether a status is still owed before the procedure (the escalating warning's states). */
export function isOutstanding(status: PrepaymentStatus | 'none'): boolean {
  return status === 'awaitingApproval' || status === 'unpaid' || status === 'partPaid'
}

// ---------------------------------------------------------------------------
// The invoice
// ---------------------------------------------------------------------------

/**
 * A prepayment line's text (D37): the Procedure's invoice description from
 * 20a's chain (an admin's edit shows; a blank Contract description falls
 * through to the hospital's or rooms' text), never the Contract's directly.
 */
export function prepaymentLineDescription(procedure: Procedure, contracts: ContractsById): string {
  const own = procedure.invoiceDescription?.text
  if (own !== undefined && own.trim() !== '') return own
  return defaultInvoiceDescriptionFor(procedure, contracts)?.text ?? 'Anaesthesia'
}

/**
 * The draft of one payer group's prepayment invoice: one line per Procedure
 * at its prepaid amount (ex GST, with its Contract), GST by 22's rule, the
 * patient layout (a prepaid Contract bills the payer). Null unless the group
 * is pending and ready.
 */
export function prepaymentInvoiceDraftFor(
  group: PrepaymentGroup,
  procedures: readonly Procedure[],
  ctx: { contracts: ContractsById; patientId: string; patient?: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> },
): DraftInvoice | null {
  if (group.state !== 'awaitingApproval' || !group.ready) return null
  const members = group.procedureIds.flatMap((id) => {
    const p = procedures.find((x) => x.id === id)
    return p !== undefined ? [p] : []
  })
  const lines: DraftInvoiceLine[] = []
  for (const line of group.lines) {
    const procedure = members.find((p) => p.id === line.procedureId)
    if (procedure === undefined || line.amount.kind !== 'priced') return null
    lines.push({ procedureId: procedure.id, kind: 'fee', description: prepaymentLineDescription(procedure, ctx.contracts), amount: line.amount.amount, contractId: line.amount.contractId })
  }
  const subtotal = roundToCents(lines.reduce((s, l) => s + l.amount, 0))
  const gst = gstOn(subtotal)
  const firstContract = members[0] !== undefined ? contractOf(members[0], ctx.contracts) : undefined
  const billedTo = billedToFor(group.payer, members, ctx.patientId, ctx.patient)
  return {
    counterparty: group.payer,
    ...(billedTo !== undefined ? { billedTo } : {}),
    layout: invoiceLayoutFor(firstContract, group.payer, true),
    lines,
    subtotal,
    gst,
    total: roundToCents(subtotal + gst),
    ...(firstContract !== undefined ? { contractId: firstContract.id } : {}),
    procedureIds: members.map((p) => p.id),
  }
}
