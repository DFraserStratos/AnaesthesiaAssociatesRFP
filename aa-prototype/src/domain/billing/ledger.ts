/**
 * The internal ledger (catch-up Phase 36; FT-08.3, US-08.3.1, US-08.3.2,
 * US-08.3.4, US-08.3.5, US-13.2.1, DM-22, DM-23). Pure (convention 9): the one
 * place its rules and its maths live, exact to the cent.
 *
 * Every invoice the engine raises is a ledger pair, made in the same mutate as
 * the invoice: a receivable from the billable party and a payable (the BCTI on
 * a procedure invoice) to the anaesthetist stamped at authorise, or to the AA
 * Holding account on a prepayment invoice. The payable equals the receivable
 * and is released exactly as money is received (`payableReleasedFor`, 16's
 * rule). A prepayment's transfer (27a) is two payable legs: the account's
 * payable reduced and a payable to whoever did the List, never a receivable,
 * neither money in nor money out. AA's monthly fee invoice is an `aaFee` pair
 * with a receivable and no payable: AA's own income, outside the balance.
 *
 * The balance (US-13.2.1):
 *   receiptsHeld   = received + unmatched held - disbursed
 *   holdingBalance = released to the AA Holding account - transferred out
 *   imbalance      = receiptsHeld - payablesDue - holdingBalance
 * A healthy ledger is in balance with no checks; a receipt that matches no
 * invoice is the one way the demo goes out of balance.
 *
 * No payee is ever repointed (D38), nothing is raised automatically after a
 * prepaid procedure (OQ-61) and there is no prepaid excess or deduction (D57).
 * Amounts are signed numbers so Phase 39's credits and 39a's negative
 * invoices can enter; this phase writes only positive ones.
 */

import type {
  AaFeeInvoice,
  AaFeeLedgerPair,
  AnaesthetistId,
  BookingLedgerPair,
  CounterpartyRef,
  Invoice,
  InvoiceLine,
  IsoDateTime,
  LedgerPair,
  LedgerTransfer,
  PayableLeg,
  PayeeRef,
  ProcedureShare,
  UnmatchedReceipt,
} from '../types'
import { roundToCents, toCents } from './money'
import { payableReleasedFor } from './payableRelease'
import { BCTI_COUNT_RULE, type BctiCountRule, type BctiRecord } from './bcti'
import { GST_RATE } from './invoicePresentation'

/** The GST component of a GST-inclusive amount received (3/23 of the gross): each receipt carries it for the GST report. */
export function gstComponentOf(gross: number): number {
  return roundToCents((gross * GST_RATE) / (1 + GST_RATE))
}

// ---------------------------------------------------------------------------
// Kinds and payees
// ---------------------------------------------------------------------------

export function isBookingPair(pair: LedgerPair): pair is BookingLedgerPair {
  return pair.kind === 'procedure' || pair.kind === 'prePayment'
}

export function isAaFeePair(pair: LedgerPair): pair is AaFeeLedgerPair {
  return pair.kind === 'aaFee'
}

export function anaesthetistPayee(anaesthetistId: AnaesthetistId): PayeeRef {
  return { kind: 'anaesthetist', anaesthetistId }
}

export const HOLDING_PAYEE: PayeeRef = { kind: 'holding' }

/** The anaesthetist a payable leg pays, or undefined for the AA Holding account. */
export function payeeAnaesthetistOf(leg: Pick<PayableLeg, 'payee'>): AnaesthetistId | undefined {
  return leg.payee.kind === 'anaesthetist' ? leg.payee.anaesthetistId : undefined
}

export function isHoldingLeg(leg: Pick<PayableLeg, 'payee'>): boolean {
  return leg.payee.kind === 'holding'
}

/** Whether a pair (or a transfer) has its Xero mirror. A transfer is mirrored by its journal. */
export function isInXero(pair: LedgerPair): boolean {
  return pair.receivable.xeroAccRecId !== undefined
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Per Procedure, the invoice lines' amounts ex GST and units summed (US-05.3.5). A prepaid Procedure has no line (D57). */
export function procedureSharesFrom(lines: readonly Pick<InvoiceLine, 'procedureId' | 'amount' | 'units'>[]): ProcedureShare[] {
  const byId = new Map<string, { cents: number; units?: number }>()
  for (const line of lines) {
    if (line.procedureId === undefined) continue
    const row = byId.get(line.procedureId) ?? { cents: 0 }
    row.cents += toCents(line.amount)
    if (line.units !== undefined) row.units = roundToCents((row.units ?? 0) + line.units)
    byId.set(line.procedureId, row)
  }
  return [...byId.entries()].map(([procedureId, r]) => ({ procedureId, ...(r.units !== undefined ? { units: r.units } : {}), amountExGst: r.cents / 100 }))
}

export interface NewBookingPairInput {
  id: string
  kind: BookingLedgerPair['kind']
  invoice: Pick<Invoice, 'id' | 'invoiceNumber' | 'counterparty' | 'total' | 'procedureIds' | 'noCharge'>
  lines: readonly Pick<InvoiceLine, 'procedureId' | 'amount' | 'units'>[]
  bookingId: string
  listId: string
  /** From 25's lock on a procedure pair; the AA Holding account on a prepayment's. */
  payee: PayeeRef
  patientId: string
  atISO: IsoDateTime
}

/**
 * A Booking's pair, built with its invoice: both legs, the payable equal to the
 * receivable, exactly one payable leg whatever the number of Procedures. A
 * no-charge invoice (24) has a $0.00 receivable, nothing owed, and no payable.
 */
export function newBookingPair(input: NewBookingPairInput): BookingLedgerPair {
  const { invoice } = input
  const noCharge = invoice.noCharge === true
  const payeeId = input.payee.kind === 'anaesthetist' ? input.payee.anaesthetistId : undefined
  return {
    id: input.id,
    kind: input.kind,
    invoiceId: invoice.id,
    bookingId: input.bookingId,
    listId: input.listId,
    ...(payeeId !== undefined && !noCharge ? { anaesthetistId: payeeId } : {}),
    patientId: input.patientId,
    procedureIds: [...(invoice.procedureIds ?? [])],
    procedureShares: procedureSharesFrom(input.lines),
    createdAtISO: input.atISO,
    receivable: {
      number: invoice.invoiceNumber,
      counterparty: invoice.counterparty,
      amount: noCharge ? 0 : invoice.total,
      receivedAmount: 0,
      ...(noCharge ? { paidInAtISO: input.atISO } : {}),
    },
    ...(noCharge
      ? {}
      : {
          payable: {
            number: `${invoice.invoiceNumber}-P`,
            payee: input.payee,
            amount: invoice.total,
            releasedAmount: 0,
            disbursedAmount: 0,
            issuedAtISO: input.atISO,
          },
        }),
  }
}

/** AA's monthly fee invoice's pair: a receivable from the anaesthetist, no payable. */
export function newAaFeePair(input: { id: string; aaFeeInvoice: Pick<AaFeeInvoice, 'id' | 'invoiceNumber' | 'anaesthetistId' | 'total'>; atISO: IsoDateTime }): AaFeeLedgerPair {
  const fee = input.aaFeeInvoice
  return {
    id: input.id,
    kind: 'aaFee',
    aaFeeInvoiceId: fee.id,
    anaesthetistId: fee.anaesthetistId,
    createdAtISO: input.atISO,
    receivable: { number: fee.invoiceNumber, counterparty: { kind: 'anaesthetist', id: fee.anaesthetistId }, amount: fee.total, receivedAmount: 0 },
  }
}

export interface NewTransferInput {
  id: string
  collectPair: BookingLedgerPair
  listId: string
  payerKey?: string
  /** Who did the List: the payee locked at authorise (25). */
  payeeAnaesthetistId: AnaesthetistId
  atISO: IsoDateTime
  /** The transfers already in the ledger: a prepayment is transferred once. */
  transfers: Readonly<Record<string, LedgerTransfer>>
}

/** The transfer of a `prePayment` pair, if one was written. */
export function transferOfPair(transfers: Readonly<Record<string, LedgerTransfer>>, pairId: string): LedgerTransfer | undefined {
  return Object.values(transfers).find((t) => t.collectPairId === pairId)
}

/**
 * 27a's transfer as two payable legs (US-06.4.1, US-06.5.1): `out` reduces the
 * AA Holding account's payable by what it held (what had been released to it),
 * `in` is a payable to the anaesthetist for the invoice total, released by 16's
 * rule from what the payer has paid. Neither money in nor money out. Refuses a
 * pair that is not a held prepayment, or one already transferred.
 */
export function newPrepayTransfer(input: NewTransferInput): { ok: true; transfer: LedgerTransfer } | { ok: false; code: 'notPrepayment' | 'alreadyTransferred' } {
  const pair = input.collectPair
  if (pair.kind !== 'prePayment' || pair.payable === undefined || !isHoldingLeg(pair.payable)) return { ok: false, code: 'notPrepayment' }
  if (transferOfPair(input.transfers, pair.id) !== undefined) return { ok: false, code: 'alreadyTransferred' }
  return {
    ok: true,
    transfer: {
      id: input.id,
      kind: 'prepayTransfer',
      collectPairId: pair.id,
      invoiceId: pair.invoiceId,
      bookingId: pair.bookingId,
      listId: input.listId,
      patientId: pair.patientId,
      ...(input.payerKey !== undefined ? { payerKey: input.payerKey } : {}),
      createdAtISO: input.atISO,
      out: { amount: pair.payable.releasedAmount },
      in: {
        number: input.id,
        payee: anaesthetistPayee(input.payeeAnaesthetistId),
        amount: pair.payable.amount,
        releasedAmount: payableReleasedFor(pair.receivable.receivedAmount, pair.payable.amount),
        disbursedAmount: 0,
        issuedAtISO: input.atISO,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Movements
// ---------------------------------------------------------------------------

export interface ReceiptApplied<P extends LedgerPair> {
  pair: P
  /** The transfer, when a transferred prepayment's money now releases to the anaesthetist. */
  transfer?: LedgerTransfer
  /** What was applied after clamping to the receivable's balance (0: nothing to do). */
  added: number
  /** The released increment on the leg that moved. */
  releasedIncrement: number
}

/**
 * Money in on a pair: clamped to the receivable's balance; the payable is
 * released by 16's rule (both legs move together). A prepayment already
 * transferred releases on the transfer's `in` leg instead: the account's
 * payable stays at what it held. Stamps `paidInAtISO` once, at full.
 */
export function applyReceipt<P extends LedgerPair>(pair: P, amount: number, atISO: IsoDateTime, transfer?: LedgerTransfer): ReceiptApplied<P> {
  const balance = roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)
  const added = roundToCents(Math.max(0, Math.min(amount, balance)))
  if (toCents(added) <= 0) return { pair, ...(transfer !== undefined ? { transfer } : {}), added: 0, releasedIncrement: 0 }
  const received = roundToCents(pair.receivable.receivedAmount + added)
  const full = toCents(received) >= toCents(pair.receivable.amount)
  const receivable = { ...pair.receivable, receivedAmount: received, ...(full && pair.receivable.paidInAtISO === undefined ? { paidInAtISO: atISO } : {}) }
  if (!isBookingPair(pair) || pair.payable === undefined) {
    return { pair: { ...pair, receivable }, added, releasedIncrement: 0 }
  }
  if (transfer !== undefined && transfer.collectPairId === pair.id) {
    const released = payableReleasedFor(received, transfer.in.amount)
    const next = { ...transfer, in: { ...transfer.in, releasedAmount: released } }
    return { pair: { ...pair, receivable }, transfer: next, added, releasedIncrement: roundToCents(released - transfer.in.releasedAmount) }
  }
  const released = payableReleasedFor(received, pair.payable.amount)
  return {
    pair: { ...pair, receivable, payable: { ...pair.payable, releasedAmount: released } },
    added,
    releasedIncrement: roundToCents(released - pair.payable.releasedAmount),
  }
}

/** What a payable leg has to pay out now: released less paid out. */
export function dueOn(leg: Pick<PayableLeg, 'releasedAmount' | 'disbursedAmount'>): number {
  return roundToCents(leg.releasedAmount - leg.disbursedAmount)
}

export type DisbursementRefusal = 'holdingSystemOnly' | 'aboveReleased' | 'invalidAmount'

/**
 * Money out on a payable leg. Refused on the AA Holding account (money leaves
 * it only by a transfer or a refund the system raises, 27a) and above what is
 * released. Stamps `paidOutAtISO` when paid out in full.
 */
export function applyDisbursement(leg: PayableLeg, amount: number, atISO: IsoDateTime): { ok: true; leg: PayableLeg } | { ok: false; code: DisbursementRefusal } {
  if (isHoldingLeg(leg)) return { ok: false, code: 'holdingSystemOnly' }
  if (!Number.isFinite(amount) || toCents(amount) <= 0) return { ok: false, code: 'invalidAmount' }
  if (toCents(amount) > toCents(dueOn(leg))) return { ok: false, code: 'aboveReleased' }
  const disbursed = roundToCents(leg.disbursedAmount + amount)
  const full = toCents(disbursed) >= toCents(leg.amount)
  return { ok: true, leg: { ...leg, disbursedAmount: disbursed, ...(full && leg.paidOutAtISO === undefined ? { paidOutAtISO: atISO } : {}) } }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type PairStatus = 'invoiced' | 'handedOff' | 'handoffFailed' | 'partPaid' | 'paid' | 'partPaidOut' | 'disbursed'

/** The derived label the monitor and the Ledger show (never stored). */
export function pairStatusLabel(pair: LedgerPair, transfer?: LedgerTransfer): PairStatus {
  if (!isInXero(pair)) return pair.handoffFailure !== undefined ? 'handoffFailed' : 'invoiced'
  const out = isBookingPair(pair) ? (transfer?.in ?? pair.payable) : undefined
  if (out !== undefined && toCents(out.disbursedAmount) > 0) return toCents(out.disbursedAmount) >= toCents(out.amount) ? 'disbursed' : 'partPaidOut'
  if (toCents(pair.receivable.receivedAmount) >= toCents(pair.receivable.amount)) return 'paid'
  return toCents(pair.receivable.receivedAmount) > 0 ? 'partPaid' : 'handedOff'
}

// ---------------------------------------------------------------------------
// Checks and positions
// ---------------------------------------------------------------------------

export type LedgerCheckCode = 'unmatchedReceiptHeld' | 'pairAmountMismatch' | 'transferMismatch' | 'releasedNotReceived' | 'disbursedAboveReleased' | 'receivedAboveAmount'

/** One explanation of an imbalance: an amount, what it is about, and the anaesthetist it belongs to where it has one. */
export interface LedgerCheck {
  code: LedgerCheckCode
  amount: number
  /** The pair, transfer or unmatched receipt. */
  targetId: string
  anaesthetistId?: AnaesthetistId
}

function checksForPair(pair: BookingLedgerPair, transfer: LedgerTransfer | undefined): LedgerCheck[] {
  const out: LedgerCheck[] = []
  const r = pair.receivable
  const who = pair.anaesthetistId !== undefined ? { anaesthetistId: pair.anaesthetistId } : {}
  if (toCents(r.receivedAmount) > toCents(r.amount)) out.push({ code: 'receivedAboveAmount', amount: roundToCents(r.receivedAmount - r.amount), targetId: pair.id, ...who })
  const p = pair.payable
  if (p === undefined) return out
  if (toCents(p.amount) !== toCents(r.amount)) out.push({ code: 'pairAmountMismatch', amount: roundToCents(p.amount - r.amount), targetId: pair.id, ...who })
  if (transfer === undefined) {
    const expected = payableReleasedFor(r.receivedAmount, p.amount)
    if (toCents(p.releasedAmount) !== toCents(expected)) out.push({ code: 'releasedNotReceived', amount: roundToCents(p.releasedAmount - expected), targetId: pair.id, ...who })
  } else {
    const expected = payableReleasedFor(r.receivedAmount, transfer.in.amount)
    const to = payeeAnaesthetistOf(transfer.in)
    if (toCents(transfer.in.releasedAmount) !== toCents(expected)) out.push({ code: 'releasedNotReceived', amount: roundToCents(transfer.in.releasedAmount - expected), targetId: transfer.id, ...(to !== undefined ? { anaesthetistId: to } : {}) })
    if (toCents(transfer.out.amount) !== toCents(p.releasedAmount)) out.push({ code: 'transferMismatch', amount: roundToCents(p.releasedAmount - transfer.out.amount), targetId: transfer.id, ...(to !== undefined ? { anaesthetistId: to } : {}) })
  }
  if (toCents(p.disbursedAmount) > toCents(p.releasedAmount)) out.push({ code: 'disbursedAboveReleased', amount: roundToCents(p.disbursedAmount - p.releasedAmount), targetId: pair.id, ...who })
  return out
}

/** Why the ledger is out of balance: each check with its amount, target and anaesthetist. A healthy ledger returns none. */
export function ledgerChecks(pairs: readonly LedgerPair[], transfers: Readonly<Record<string, LedgerTransfer>>, unmatched: readonly UnmatchedReceipt[]): LedgerCheck[] {
  const out: LedgerCheck[] = []
  for (const u of unmatched) {
    if (u.status !== 'held') continue
    out.push({ code: 'unmatchedReceiptHeld', amount: u.amount, targetId: u.id, ...(u.anaesthetistId !== undefined ? { anaesthetistId: u.anaesthetistId } : {}) })
  }
  for (const pair of pairs) {
    if (!isBookingPair(pair)) continue
    out.push(...checksForPair(pair, pair.kind === 'prePayment' ? transferOfPair(transfers, pair.id) : undefined))
  }
  for (const t of Object.values(transfers)) {
    if (toCents(t.in.disbursedAmount) > toCents(t.in.releasedAmount)) {
      const to = payeeAnaesthetistOf(t.in)
      out.push({ code: 'disbursedAboveReleased', amount: roundToCents(t.in.disbursedAmount - t.in.releasedAmount), targetId: t.id, ...(to !== undefined ? { anaesthetistId: to } : {}) })
    }
  }
  return out
}

export interface LedgerPosition {
  receivablesOutstanding: number
  received: number
  unmatchedHeld: number
  disbursed: number
  receiptsHeld: number
  /** Prepayments received for procedures not yet done: owed, never due. */
  holdingBalance: number
  payablesDue: number
  /** Billed for anaesthetists, not yet paid by the payer (payables not yet released). */
  awaitingCollection: number
  imbalance: number
  inBalance: boolean
  /** AA's own monthly fee invoices: never part of the balance. */
  aaFees: { invoiced: number; received: number; outstanding: number }
  checks: LedgerCheck[]
  /** Pairs not yet mirrored in Xero. */
  notInXero: number
}

/** Cents sums, so the equation is exact. */
class Cents {
  private c = 0
  add(amount: number): this {
    this.c += toCents(amount)
    return this
  }
  get value(): number {
    return this.c / 100
  }
  get cents(): number {
    return this.c
  }
}

/** The whole ledger's position (US-13.2.1, US-08.3.4), over every Booking pair and transfer. */
export function ledgerPosition(pairs: readonly LedgerPair[], transfers: Readonly<Record<string, LedgerTransfer>>, unmatched: readonly UnmatchedReceipt[]): LedgerPosition {
  const outstanding = new Cents()
  const received = new Cents()
  const disbursed = new Cents()
  const holdingReleased = new Cents()
  const due = new Cents()
  const awaiting = new Cents()
  const feeInvoiced = new Cents()
  const feeReceived = new Cents()
  const feeOutstanding = new Cents()
  let notInXero = 0
  for (const pair of pairs) {
    if (!isInXero(pair)) notInXero += 1
    const r = pair.receivable
    if (isAaFeePair(pair)) {
      feeInvoiced.add(r.amount)
      feeReceived.add(r.receivedAmount)
      feeOutstanding.add(Math.max(0, roundToCents(r.amount - r.receivedAmount)))
      continue
    }
    outstanding.add(Math.max(0, roundToCents(r.amount - r.receivedAmount)))
    received.add(r.receivedAmount)
    const p = pair.payable
    if (p === undefined) continue
    disbursed.add(p.disbursedAmount)
    if (isHoldingLeg(p)) holdingReleased.add(p.releasedAmount)
    else {
      due.add(dueOn(p))
      awaiting.add(roundToCents(p.amount - p.releasedAmount))
    }
  }
  const out = new Cents()
  for (const t of Object.values(transfers)) {
    out.add(t.out.amount)
    disbursed.add(t.in.disbursedAmount)
    due.add(dueOn(t.in))
    awaiting.add(roundToCents(t.in.amount - t.in.releasedAmount))
  }
  const unmatchedHeld = new Cents()
  for (const u of unmatched) if (u.status === 'held') unmatchedHeld.add(u.amount)
  const receiptsHeldCents = received.cents + unmatchedHeld.cents - disbursed.cents
  const holdingCents = holdingReleased.cents - out.cents
  const imbalanceCents = receiptsHeldCents - due.cents - holdingCents
  const checks = ledgerChecks(pairs, transfers, unmatched)
  return {
    receivablesOutstanding: outstanding.value,
    received: received.value,
    unmatchedHeld: unmatchedHeld.value,
    disbursed: disbursed.value,
    receiptsHeld: receiptsHeldCents / 100,
    holdingBalance: holdingCents / 100,
    payablesDue: due.value,
    awaitingCollection: awaiting.value,
    imbalance: imbalanceCents / 100,
    inBalance: imbalanceCents === 0 && checks.length === 0,
    aaFees: { invoiced: feeInvoiced.value, received: feeReceived.value, outstanding: feeOutstanding.value },
    checks,
    notInXero,
  }
}

export interface AnaesthetistPosition {
  anaesthetistId: AnaesthetistId
  /** AA owes them now: released, not yet paid out. */
  dueNow: number
  /** Billed for them, not yet paid by the payer. */
  awaitingCollection: number
  /** dueNow + awaitingCollection. */
  owedToThem: number
  collected: number
  paidOut: number
  /** Their unpaid monthly AA fee invoices. */
  theyOweAa: number
  /** Held receipts attributed to them. */
  unmatchedHeld: number
  /** Their receipts held (with `unmatchedHeld`) less their payables due. */
  imbalance: number
  inBalance: boolean
  checks: LedgerCheck[]
}

/**
 * One anaesthetist's position (US-08.3.5; US-13.2.1 "the same balance view,
 * scoped"): their procedure pairs (by the stamped payee), the transfers to
 * them, their AA fee pairs and the held receipts attributed to them. A
 * `prePayment` pair is in no anaesthetist's scope until its transfer exists.
 */
export function anaesthetistPosition(
  pairs: readonly LedgerPair[],
  transfers: Readonly<Record<string, LedgerTransfer>>,
  unmatched: readonly UnmatchedReceipt[],
  anaesthetistId: AnaesthetistId,
): AnaesthetistPosition {
  const due = new Cents()
  const awaiting = new Cents()
  const collected = new Cents()
  const paidOut = new Cents()
  const owesAa = new Cents()
  for (const pair of pairs) {
    if (isAaFeePair(pair)) {
      if (pair.anaesthetistId === anaesthetistId) owesAa.add(Math.max(0, roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)))
      continue
    }
    const p = pair.payable
    if (pair.kind !== 'procedure' || p === undefined || payeeAnaesthetistOf(p) !== anaesthetistId) continue
    collected.add(pair.receivable.receivedAmount)
    paidOut.add(p.disbursedAmount)
    due.add(dueOn(p))
    awaiting.add(roundToCents(p.amount - p.releasedAmount))
  }
  for (const t of Object.values(transfers)) {
    if (payeeAnaesthetistOf(t.in) !== anaesthetistId) continue
    collected.add(t.in.releasedAmount)
    paidOut.add(t.in.disbursedAmount)
    due.add(dueOn(t.in))
    awaiting.add(roundToCents(t.in.amount - t.in.releasedAmount))
  }
  const held = new Cents()
  for (const u of unmatched) if (u.status === 'held' && u.anaesthetistId === anaesthetistId) held.add(u.amount)
  const imbalanceCents = collected.cents + held.cents - paidOut.cents - due.cents
  const checks = ledgerChecks(pairs, transfers, unmatched).filter((c) => c.anaesthetistId === anaesthetistId)
  return {
    anaesthetistId,
    dueNow: due.value,
    awaitingCollection: awaiting.value,
    owedToThem: (due.cents + awaiting.cents) / 100,
    collected: collected.value,
    paidOut: paidOut.value,
    theyOweAa: owesAa.value,
    unmatchedHeld: held.value,
    imbalance: imbalanceCents / 100,
    inBalance: imbalanceCents === 0 && checks.length === 0,
    checks,
  }
}

export interface OutOfBalanceRow {
  anaesthetistId: AnaesthetistId
  imbalance: number
  checks: LedgerCheck[]
}

/** The anaesthetists whose ledger is out of balance (Greg, 2026-10-02: "It's just a list"), largest imbalance first. */
export function anaesthetistsOutOfBalance(
  pairs: readonly LedgerPair[],
  transfers: Readonly<Record<string, LedgerTransfer>>,
  unmatched: readonly UnmatchedReceipt[],
  anaesthetistIds: readonly AnaesthetistId[],
): OutOfBalanceRow[] {
  const rows: OutOfBalanceRow[] = []
  anaesthetistIds.forEach((id) => {
    const p = anaesthetistPosition(pairs, transfers, unmatched, id)
    if (!p.inBalance) rows.push({ anaesthetistId: id, imbalance: p.imbalance, checks: p.checks })
  })
  // Stable: ties keep the roster order the caller passed.
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => Math.abs(toCents(b.row.imbalance)) - Math.abs(toCents(a.row.imbalance)) || a.index - b.index)
    .map(({ row }) => row)
}

export type PatientRowStatus = 'paid' | 'partPaid' | 'unpaid'

export interface PatientPositionRow {
  pairId: string
  kind: BookingLedgerPair['kind']
  invoiceId: string
  invoiceNumber: string
  /** The payee anaesthetist; absent on a prepayment held in the AA Holding account. */
  anaesthetistId?: AnaesthetistId
  bookingId: string
  /** Who is billed, with its kind, so Phase 40 can choose the rows its warning reads (US-11.3.2). */
  billedTo: CounterpartyRef
  /** The invoice date: D24's threshold counts from it. */
  raisedAtISO: IsoDateTime
  total: number
  outstanding: number
  status: PatientRowStatus
}

export interface PatientPosition {
  rows: PatientPositionRow[]
  /** Signed: Phase 39's credits can make it a credit balance. */
  outstandingTotal: number
  oldestUnpaidRaisedAtISO?: IsoDateTime
}

/** Every invoice linked to a patient, across every anaesthetist and every payer (US-13.2.2, DM-23): Phase 40's source. */
export function patientPosition(pairs: readonly LedgerPair[], patientId: string): PatientPosition {
  const rows: PatientPositionRow[] = []
  const total = new Cents()
  let oldest: string | undefined
  for (const pair of pairs) {
    if (!isBookingPair(pair) || pair.patientId !== patientId) continue
    const r = pair.receivable
    const outstanding = roundToCents(r.amount - r.receivedAmount)
    const status: PatientRowStatus = toCents(outstanding) <= 0 ? 'paid' : toCents(r.receivedAmount) > 0 ? 'partPaid' : 'unpaid'
    total.add(outstanding)
    if (status !== 'paid' && (oldest === undefined || pair.createdAtISO < oldest)) oldest = pair.createdAtISO
    rows.push({
      pairId: pair.id,
      kind: pair.kind,
      invoiceId: pair.invoiceId,
      invoiceNumber: r.number,
      ...(pair.anaesthetistId !== undefined ? { anaesthetistId: pair.anaesthetistId } : {}),
      bookingId: pair.bookingId,
      billedTo: r.counterparty as CounterpartyRef,
      raisedAtISO: pair.createdAtISO,
      total: r.amount,
      outstanding: Math.max(0, outstanding),
      status,
    })
  }
  rows.sort((a, b) => a.raisedAtISO.localeCompare(b.raisedAtISO) || a.invoiceNumber.localeCompare(b.invoiceNumber))
  return { rows, outstandingTotal: total.value, ...(oldest !== undefined ? { oldestUnpaidRaisedAtISO: oldest } : {}) }
}

// ---------------------------------------------------------------------------
// The BCTI records (16's one count re-read from the ledger)
// ---------------------------------------------------------------------------

/**
 * 16's BCTI record list, read from the payable legs (FT-10.3, US-10.3.1): one
 * BCTI per receivable invoice, its payable leg, counted against the stamped
 * payee (never a List join). A procedure pair's leg counts from the moment the
 * invoice is raised, mirrored in Xero or not (the BCTI was issued with the
 * invoice); under 16's `paidOnly` rule it counts only once its receivable is
 * paid, which needs the ACCREC, so a pair not yet in Xero changes no paid-only
 * count. AA fee pairs have no payable; a prepayment's payable to the AA Holding
 * account and its transfer are left out unless `rule.prepaymentPairs` is on
 * (27a's default, provisional, OQ-29). `bctisFor` reads only this list.
 */
export function bctiRecordsOf(pairs: readonly LedgerPair[], transfers: Readonly<Record<string, LedgerTransfer>> = {}, rule: BctiCountRule = BCTI_COUNT_RULE): BctiRecord[] {
  const records: BctiRecord[] = []
  for (const pair of pairs) {
    if (!isBookingPair(pair) || pair.payable === undefined) continue
    if (pair.kind === 'prePayment' && rule.prepaymentPairs !== true) continue
    // A prepayment's payable (counted only with the switch on) charges whoever its transfer pays.
    const transfer = pair.kind === 'prePayment' ? transferOfPair(transfers, pair.id) : undefined
    const anaesthetistId = payeeAnaesthetistOf(pair.payable) ?? (transfer !== undefined ? payeeAnaesthetistOf(transfer.in) : undefined)
    if (anaesthetistId === undefined) continue
    records.push({
      accPayId: pair.payable.xeroAccPayId ?? pair.id,
      billNumber: pair.payable.number,
      receivableInvoiceNumber: pair.receivable.number,
      anaesthetistId,
      issuedAtISO: pair.payable.issuedAtISO,
      ...(pair.receivable.paidInAtISO !== undefined ? { receivablePaidAtISO: pair.receivable.paidInAtISO } : {}),
      voided: false,
    })
  }
  return records.sort((a, b) => a.accPayId.localeCompare(b.accPayId))
}
