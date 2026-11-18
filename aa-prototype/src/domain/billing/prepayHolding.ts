/**
 * The AA Holding account (catch-up Phase 27a; US-06.5.1, FT-06.5, US-09.1.3,
 * DM-21; D38, D53, D72). Pure (convention 9): the one place its rules live.
 *
 * A prepayment is not paid to the anaesthetist. Its payable is the AA Holding
 * account (`AA_HOLDING_ACCOUNT`, Phase 27): a creditor in the payables
 * sub-ledger kept like an anaesthetist's account, never a bank account or a
 * Xero ledger account (the trust account is the bank account the money sits
 * in). It receives prepayments and transfers them to the anaesthetist who did
 * the List, but is never paid itself.
 *
 *  - Step one, the collect pair (Phase 27, one per payer's prepayment invoice):
 *    a receivable from that invoice's payer and a payable to the account.
 *  - Step two, the transfer (`PrepayTransfer`): once the List is authorised
 *    (OQ-125 open, D72: the trigger is provisional and lives in one place,
 *    `wireBillingRun`), the account's payable for the prepayment is reduced and
 *    a payable to the anaesthetist created, one entry with both legs. An
 *    accounting move, not an invoice or a payment: no GST moves.
 *  - Money leaves the account only by a transfer or a refund the system raises
 *    (`canPayOutOfHolding`; the refund is Phase 41's); the payment itself is
 *    made in Xero (OQ-111, D53). The payables run never pays the account.
 *  - Its balance and entries are derived here, never stored, so they cannot
 *    drift. A moved Booking needs nothing: no payee is ever repointed.
 *
 * See AR-52 (#holding-account, #pp-transfer, #release-trigger, #trust-bank,
 * #creditors), AR-24 (#prepayment-settlement, #prepayment-move) and AR-58
 * section 5.9. Catch-up Phase 36 promoted these legs into the ledger
 * (`ledger.ts`): the collect pair is a `prePayment` pair whose payable is to
 * the account, and the transfer a `LedgerTransfer` of two payable legs. This
 * module keeps the account's entries and the transfer rule, over those.
 */

import type { AnaesthetistId, BookingLedgerPair, Invoice, LedgerPair, LedgerReceipt, LedgerTransfer, XeroAccPay } from '../types'
import { AA_HOLDING_ACCOUNT } from './prepayment'
import { toCents } from './money'
import { refKey } from './procedurePayer'
import { isBookingPair, isHoldingLeg, transferOfPair } from './ledger'

/** The account itself (Phase 27's constant, the one concept): its name, Xero contact and payee flag. */
export const HOLDING_ACCOUNT = AA_HOLDING_ACCOUNT

/** The one line every surface shows about how money leaves the account. */
export const LEAVES_ONLY_BY_SYSTEM = 'Leaves only by a system transfer or refund'

/** The refusal when anything else tries to pay out of it. */
export const HOLDING_SYSTEM_ONLY = 'Money leaves the AA Holding account only by a transfer or refund the system raises.'

/** The provisional release trigger's caption (OQ-125, D72): one place, so "confirmed and submitted" is a small change. */
export const RELEASE_TRIGGER_CAPTION = 'Moves to the anaesthetist when the List is authorised'

/** A collect payable's state before its transfer, as the anaesthetist's views read it. */
export const HELD_UNTIL_AUTHORISED = 'Held until the List is authorised'

/** True for a payable crediting the AA Holding account: the payables run never pays it. */
export function isHeldPayable(accPay: Pick<XeroAccPay, 'payeeAccount'>): boolean {
  return accPay.payeeAccount === HOLDING_ACCOUNT.payeeAccount
}

/** How money might try to leave the account. */
export type HoldingOutflow = 'transfer' | 'refund' | 'payablesRun' | 'manual'

/** Only a transfer or a refund the system raises may move money out of the account (US-06.5.1). */
export function canPayOutOfHolding(source: HoldingOutflow): boolean {
  return source === 'transfer' || source === 'refund'
}

/** One line of the account's entries table. */
export interface HoldingEntry {
  atISO: string
  kind: 'received' | 'transferred'
  /** Received: the payment. Transferred: the amount held at that moment. */
  amount: number
  bookingId: string
  invoiceId: string
  invoiceNumber: string
  payerKey?: string
  /** Transferred only: who did the List. */
  anaesthetistId?: AnaesthetistId
  /** Received: the receipt. Transferred: the transfer. One of the two, so every entry has its own key. */
  receiptId?: string
  transferId?: string
}

export interface HoldingInput {
  ledger: Readonly<Record<string, LedgerPair>>
  receipts: Readonly<Record<string, LedgerReceipt>>
  transfers: Readonly<Record<string, LedgerTransfer>>
  invoices: Readonly<Record<string, Pick<Invoice, 'id' | 'invoiceNumber' | 'counterparty'>>>
}

/** The `prePayment` pairs whose payable is to the account. */
function heldPairs(ledger: Readonly<Record<string, LedgerPair>>): BookingLedgerPair[] {
  return Object.values(ledger).filter((p): p is BookingLedgerPair => isBookingPair(p) && p.kind === 'prePayment' && p.payable !== undefined && isHoldingLeg(p.payable))
}

function receiptOrder(a: LedgerReceipt, b: LedgerReceipt): number {
  return a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id, undefined, { numeric: true })
}

/**
 * The account's entries, oldest first: a `received` entry per receipt on a
 * collect case that reached the account (those before its transfer, up to the
 * amount it held), and a `transferred` entry per transfer, for the amount held
 * at that moment. Money arriving after a transfer goes straight to the
 * anaesthetist's payable, so it is never an entry here.
 */
export function holdingEntries(input: HoldingInput): HoldingEntry[] {
  const entries: HoldingEntry[] = []
  const receiptsByPair = new Map<string, LedgerReceipt[]>()
  for (const r of Object.values(input.receipts)) {
    const list = receiptsByPair.get(r.pairId)
    if (list === undefined) receiptsByPair.set(r.pairId, [r])
    else list.push(r)
  }
  for (const c of heldPairs(input.ledger)) {
    const invoice = input.invoices[c.invoiceId]
    if (invoice === undefined) continue
    const payerKey = refKey(invoice.counterparty)
    const transfer = transferOfPair(input.transfers, c.id)
    // What reached the account: every receipt before its transfer, never more than it then held.
    let room = transfer !== undefined ? toCents(transfer.out.amount) : Number.POSITIVE_INFINITY
    for (const r of (receiptsByPair.get(c.id) ?? []).sort(receiptOrder)) {
      if (room <= 0) break
      const cents = Math.min(toCents(r.grossAmount), room)
      room -= cents
      entries.push({ atISO: r.atISO, kind: 'received', amount: cents / 100, bookingId: c.bookingId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, payerKey, receiptId: r.id })
    }
    if (transfer !== undefined) {
      const to = transfer.in.payee.kind === 'anaesthetist' ? transfer.in.payee.anaesthetistId : undefined
      entries.push({
        atISO: transfer.createdAtISO,
        kind: 'transferred',
        amount: transfer.out.amount,
        bookingId: c.bookingId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        payerKey,
        ...(to !== undefined ? { anaesthetistId: to } : {}),
        transferId: transfer.id,
      })
    }
  }
  return entries.sort(
    (a, b) => a.atISO.localeCompare(b.atISO) || (a.kind === b.kind ? 0 : a.kind === 'received' ? -1 : 1) || a.invoiceNumber.localeCompare(b.invoiceNumber),
  )
}

/** The account's balance: received less transferred, in cents, never negative. It is the prepayments received for procedures not yet done. */
export function holdingBalance(entries: readonly HoldingEntry[]): number {
  let cents = 0
  for (const e of entries) cents += e.kind === 'received' ? toCents(e.amount) : -toCents(e.amount)
  return Math.max(0, cents) / 100
}

/** The prepaid Bookings the account holds money for now (a received balance and no transfer yet). */
export function heldBookingIds(entries: readonly HoldingEntry[]): string[] {
  const heldByInvoice = new Map<string, { bookingId: string; cents: number }>()
  for (const e of entries) {
    const row = heldByInvoice.get(e.invoiceId) ?? { bookingId: e.bookingId, cents: 0 }
    row.cents += e.kind === 'received' ? toCents(e.amount) : -toCents(e.amount)
    heldByInvoice.set(e.invoiceId, row)
  }
  return [...new Set([...heldByInvoice.values()].filter((r) => r.cents > 0).map((r) => r.bookingId))].sort()
}

/** Why a `prePayment` pair gets no transfer at authorisation. */
export type TransferSkip = 'notCollect' | 'alreadyTransferred' | 'notSent' | 'voided' | 'cancelled' | 'noPayee'

export interface TransferCandidate {
  collectPair: LedgerPair
  invoice: Pick<Invoice, 'kind' | 'approval'> | undefined
  /** Whether the invoice's receivable was voided (a withdrawn invoice). */
  voided: boolean
  bookingCancelled: boolean
  alreadyTransferred: boolean
  /** The payee locked at authorise (catch-up Phase 25), else the List's anaesthetist. */
  payeeAnaesthetistId: AnaesthetistId | undefined
}

/**
 * Whether a `prePayment` pair is transferred at authorisation, and to whom:
 * the sent, non-cancelled prepayment invoices only (a cancelled Booking's is
 * Phase 41's credit or refund), once each, to whoever did the List. An unpaid
 * or part-paid prepayment still moves in full, released as money arrives. The
 * legs are `ledger.ts`'s `newPrepayTransfer`.
 */
export function transferFor(candidate: TransferCandidate): { skip: TransferSkip } | { to: AnaesthetistId } {
  const { collectPair, invoice } = candidate
  if (!isBookingPair(collectPair) || collectPair.kind !== 'prePayment' || invoice === undefined || invoice.kind !== 'prePayment') return { skip: 'notCollect' }
  if (candidate.alreadyTransferred) return { skip: 'alreadyTransferred' }
  if (invoice.approval === undefined) return { skip: 'notSent' }
  if (candidate.voided) return { skip: 'voided' }
  if (candidate.bookingCancelled) return { skip: 'cancelled' }
  if (candidate.payeeAnaesthetistId === undefined) return { skip: 'noPayee' }
  return { to: candidate.payeeAnaesthetistId }
}
