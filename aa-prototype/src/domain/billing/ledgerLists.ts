/**
 * The Ledger tab's lists and its one sentence (Phase 64). Pure (convention 9),
 * exact to the cent, over the same inputs as `ledger.ts`.
 *
 * `anaesthetistLedgerRows` is `anaesthetistPosition` for every anaesthetist in
 * ONE pass over the pairs, transfers and unmatched receipts (and one
 * `ledgerChecks` call), bucketing by anaesthetist: calling the position per
 * anaesthetist is O(anaesthetists x pairs), the slow open at practice scale.
 * Its scope is the position's exactly (parity is pinned by test): a
 * `procedure` pair by its payable's stamped payee, a transfer by its `in`
 * leg's payee, an AA fee pair by its anaesthetist, a held receipt by the
 * anaesthetist it names. A `prePayment` pair is in no one's row until its
 * transfer exists.
 *
 * `ledgerSentence` turns the Day view's reconciliation status (never a check of
 * its own) plus two figures into the Ledger's notice.
 */

import type { AnaesthetistId, LedgerPair, LedgerTransfer, PairCredit, PayableLeg, UnmatchedReceipt, XeroQueueItem } from '../types'
import { dueOn, isAaFeePair, isBookingPair, ledgerChecks, payeeAnaesthetistOf, recoveryOpenOn, type LedgerCheck } from './ledger'
import { formatMoney, roundToCents, toCents } from './money'
import type { ReconciliationStatus, UnresolvedItemSource } from './reconciliation'

// ---------------------------------------------------------------------------
// Per-anaesthetist rows
// ---------------------------------------------------------------------------

export interface AnaesthetistLedgerRow {
  anaesthetistId: AnaesthetistId
  /**
   * What AA billed on their behalf: the payable amounts on their procedure
   * pairs plus the `in` legs of the prepayment transfers paying them, each net
   * of a credit's reversal (`amount - reversedAmount`). A credited pair counts
   * $0.00 (its replacement, if any, is its own pair); a transferred prepayment
   * counts for whoever did the List, once, on its transfer, never on the
   * prepayment pair's own payable to the AA Holding account. AA fee pairs are
   * not billed for them.
   */
  billed: number
  /** Money the payers paid into AA on their invoices: the position's `collected`. */
  paidIntoAa: number
  /** Paid out to them in cash: the position's `paidOut`. */
  disbursed: number
  /** AA owes them, due now plus awaiting collection: the position's `owedToThem`. */
  aaOwesThem: number
  /** Their unpaid monthly AA fee invoices: the position's `theyOweAa`. */
  theyOweAa: number
  inBalance: boolean
  /** Signed, as the position's `imbalance`. */
  imbalance: number
  checks: LedgerCheck[]
}

/** Cents accumulators for one anaesthetist. */
interface Bucket {
  billed: number
  due: number
  awaiting: number
  collected: number
  paidOut: number
  owesAa: number
  heldForPayers: number
  recovery: number
  held: number
  checks: LedgerCheck[]
}

const emptyBucket = (): Bucket => ({ billed: 0, due: 0, awaiting: 0, collected: 0, paidOut: 0, owesAa: 0, heldForPayers: 0, recovery: 0, held: 0, checks: [] })

/** A payable leg's billed amount: its amount net of a credit's reversal. */
function billedOn(leg: Pick<PayableLeg, 'amount' | 'reversedAmount'>): number {
  return roundToCents(leg.amount - (leg.reversedAmount ?? 0))
}

/** Mirrors `ledger.ts`'s private `awaitingOn`: nothing awaited once reversed. */
function awaitingOn(leg: Pick<PayableLeg, 'amount' | 'releasedAmount' | 'reversedAmount'>): number {
  return leg.reversedAmount !== undefined ? 0 : roundToCents(leg.amount - leg.releasedAmount)
}

/**
 * Every anaesthetist's ledger row, in the order of `anaesthetistIds` (one row
 * each, a zero row for anyone with nothing in the ledger; ids in the ledger but
 * not passed are left out). Equal, field for field, to `anaesthetistPosition`
 * for each id, in one pass.
 */
export function anaesthetistLedgerRows(
  pairs: readonly LedgerPair[],
  transfers: Readonly<Record<string, LedgerTransfer>>,
  unmatched: readonly UnmatchedReceipt[],
  anaesthetistIds: readonly AnaesthetistId[],
): AnaesthetistLedgerRow[] {
  const buckets = new Map<AnaesthetistId, Bucket>()
  for (const id of anaesthetistIds) if (!buckets.has(id)) buckets.set(id, emptyBucket())
  const creditedCollect = new Map<string, PairCredit>()
  for (const pair of pairs) {
    if (isAaFeePair(pair)) {
      const b = buckets.get(pair.anaesthetistId)
      if (b !== undefined) b.owesAa += toCents(Math.max(0, roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)))
      continue
    }
    if (isBookingPair(pair) && pair.kind === 'prePayment' && pair.credit !== undefined) creditedCollect.set(pair.id, pair.credit)
    const p = pair.payable
    if (pair.kind !== 'procedure' || p === undefined) continue
    const who = payeeAnaesthetistOf(p)
    const b = who !== undefined ? buckets.get(who) : undefined
    if (b === undefined) continue
    b.billed += toCents(billedOn(p))
    b.collected += toCents(pair.receivable.receivedAmount)
    b.paidOut += toCents(p.disbursedAmount)
    b.due += toCents(dueOn(p))
    b.awaiting += toCents(awaitingOn(p))
    if (pair.credit !== undefined) {
      b.heldForPayers += toCents(pair.credit.heldForPayer)
      b.recovery += toCents(recoveryOpenOn(pair.credit))
    }
  }
  for (const t of Object.values(transfers)) {
    const who = payeeAnaesthetistOf(t.in)
    const b = who !== undefined ? buckets.get(who) : undefined
    if (b === undefined) continue
    const credit = creditedCollect.get(t.collectPairId)
    b.billed += toCents(billedOn(t.in))
    b.collected += toCents(credit !== undefined ? credit.heldForPayer : t.in.releasedAmount)
    b.paidOut += toCents(t.in.disbursedAmount)
    b.due += toCents(dueOn(t.in))
    b.awaiting += toCents(awaitingOn(t.in))
    if (credit !== undefined) {
      b.heldForPayers += toCents(credit.heldForPayer)
      b.recovery += toCents(recoveryOpenOn(credit))
    }
  }
  for (const u of unmatched) {
    if (u.status !== 'held' || u.anaesthetistId === undefined) continue
    const b = buckets.get(u.anaesthetistId)
    if (b !== undefined) b.held += toCents(u.amount)
  }
  for (const c of ledgerChecks(pairs, transfers, unmatched)) {
    if (c.anaesthetistId === undefined) continue
    buckets.get(c.anaesthetistId)?.checks.push(c)
  }
  const seen = new Set<AnaesthetistId>()
  const rows: AnaesthetistLedgerRow[] = []
  for (const id of anaesthetistIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const b = buckets.get(id)!
    const imbalanceCents = b.collected + b.held - b.paidOut - b.due - b.heldForPayers + b.recovery
    rows.push({
      anaesthetistId: id,
      billed: b.billed / 100,
      paidIntoAa: b.collected / 100,
      disbursed: b.paidOut / 100,
      aaOwesThem: (b.due + b.awaiting) / 100,
      theyOweAa: b.owesAa / 100,
      inBalance: imbalanceCents === 0 && b.checks.length === 0,
      imbalance: imbalanceCents / 100,
      checks: b.checks,
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// Receipts to place
// ---------------------------------------------------------------------------

export interface ReceiptsToPlace {
  /** The held receipts that matched no invoice, oldest first (ties by id). */
  receipts: UnmatchedReceipt[]
  total: number
  count: number
}

/** The receipts still held because they matched no invoice: what the office has to place or refund. */
export function receiptsToPlace(unmatched: readonly UnmatchedReceipt[]): ReceiptsToPlace {
  const receipts = unmatched.filter((u) => u.status === 'held').sort((a, b) => a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id))
  let cents = 0
  for (const u of receipts) cents += toCents(u.amount)
  return { receipts, total: cents / 100, count: receipts.length }
}

// ---------------------------------------------------------------------------
// The sentence
// ---------------------------------------------------------------------------

export type LedgerSentenceTone = 'success' | 'warning' | 'error'

/** What one detail line counts. */
export type LedgerSentencePartKind =
  | 'unmatchedReceipt'
  | 'pairNotInXero'
  | 'creditNotInXero'
  | 'transferNotInXero'
  | 'paymentNotInXero'
  | 'waitingForXero'
  | 'changedInXero'
  | 'bankLine'
  | 'accountsOutOfBalance'
  | 'accountsSquare'

export interface LedgerSentencePart {
  kind: LedgerSentencePartKind
  count: number
  /** The items' amounts summed (0 on the accounts line). */
  amount: number
  text: string
}

export interface LedgerSentence {
  tone: LedgerSentenceTone
  /** The Day view's status: true only when it reads square. */
  square: boolean
  title: string
  /** One line per kind of item, then the accounts line. */
  detail: string[]
  parts: LedgerSentencePart[]
}

export interface LedgerSentenceFigures {
  /** The whole ledger's imbalance (`ledgerPosition(...).imbalance`), signed. */
  ledgerImbalance: number
  /** How many anaesthetists' accounts are out of balance. */
  anaesthetistsOutOfBalance: number
  /** The Xero queue's item kinds by id, so a queued item is named by what it is; without it a queued item reads "waiting for Xero". */
  xeroQueueKinds?: ReadonlyMap<string, XeroQueueItem['kind']>
}

const PART_ORDER: readonly LedgerSentencePartKind[] = ['unmatchedReceipt', 'pairNotInXero', 'creditNotInXero', 'transferNotInXero', 'paymentNotInXero', 'waitingForXero', 'changedInXero', 'bankLine']

const PART_WORDS: Record<Exclude<LedgerSentencePartKind, 'accountsOutOfBalance' | 'accountsSquare'>, (n: number) => string> = {
  unmatchedReceipt: (n) => (n === 1 ? '1 receipt that matches no invoice' : `${n} receipts that match no invoice`),
  pairNotInXero: (n) => `${n} ${n === 1 ? 'pair' : 'pairs'} not yet in Xero`,
  creditNotInXero: (n) => `${n} ${n === 1 ? 'credit' : 'credits'} not yet in Xero`,
  transferNotInXero: (n) => `${n} ${n === 1 ? 'transfer' : 'transfers'} not yet in Xero`,
  paymentNotInXero: (n) => `${n} ${n === 1 ? 'payment' : 'payments'} not yet recorded in Xero`,
  waitingForXero: (n) => `${n} ${n === 1 ? 'item' : 'items'} waiting for Xero`,
  changedInXero: (n) => `${n} ${n === 1 ? 'change' : 'changes'} made in Xero`,
  bankLine: (n) => `${n} bank ${n === 1 ? 'line' : 'lines'} Xero could not match`,
}

function partKindOf(source: UnresolvedItemSource, id: string, kinds: ReadonlyMap<string, XeroQueueItem['kind']> | undefined): Exclude<LedgerSentencePartKind, 'accountsOutOfBalance' | 'accountsSquare'> {
  switch (source) {
    case 'unmatchedReceipt':
      return 'unmatchedReceipt'
    case 'xeroDivergence':
      return 'changedInXero'
    case 'bankLine':
      return 'bankLine'
    case 'xeroQueue':
      switch (kinds?.get(id)) {
        case 'handoff':
          return 'pairNotInXero'
        case 'correction':
          return 'creditNotInXero'
        case 'journal':
          return 'transferNotInXero'
        case 'paymentSync':
        case 'disbursementSync':
        case 'offsetSync':
          return 'paymentNotInXero'
        default:
          return 'waitingForXero'
      }
  }
}

/**
 * The Ledger's notice, from the Day view's reconciliation status and two
 * figures; it adds no check of its own.
 *
 * Square (`status.status === 'square'`): "The books are square", tone success,
 * with the accounts line ("Every account is square", or, if the figure says
 * some are out, "N accounts are out of balance" and tone warning).
 * Otherwise the title names the ledger's own difference when there is one
 * ("The books are out by $120.00"), else "The books are not square"; the
 * detail counts the open items by what they are, then the accounts line. Tone
 * is warning, as the Day view's card; error only when the ledger is out by an
 * amount no receipt that matches no invoice explains (an imbalance with no held
 * receipt among the items).
 */
export function ledgerSentence(status: ReconciliationStatus, figures: LedgerSentenceFigures): LedgerSentence {
  const outCount = Math.max(0, figures.anaesthetistsOutOfBalance)
  const accounts: LedgerSentencePart =
    outCount === 0
      ? { kind: 'accountsSquare', count: 0, amount: 0, text: 'Every account is square' }
      : { kind: 'accountsOutOfBalance', count: outCount, amount: 0, text: outCount === 1 ? '1 account is out of balance' : `${outCount} accounts are out of balance` }
  if (status.status === 'square') {
    return { tone: outCount === 0 ? 'success' : 'warning', square: true, title: 'The books are square', detail: [accounts.text], parts: [accounts] }
  }
  const tally = new Map<LedgerSentencePartKind, { count: number; cents: number }>()
  for (const item of status.items) {
    const kind = partKindOf(item.source, item.id, figures.xeroQueueKinds)
    const t = tally.get(kind) ?? { count: 0, cents: 0 }
    t.count += 1
    t.cents += toCents(item.amount)
    tally.set(kind, t)
  }
  const parts: LedgerSentencePart[] = []
  for (const kind of PART_ORDER) {
    const t = tally.get(kind)
    if (t === undefined) continue
    parts.push({ kind, count: t.count, amount: t.cents / 100, text: PART_WORDS[kind as keyof typeof PART_WORDS](t.count) })
  }
  parts.push(accounts)
  const imbalanceCents = toCents(figures.ledgerImbalance)
  const title = imbalanceCents !== 0 ? `The books are out by ${formatMoney(Math.abs(imbalanceCents) / 100)}` : 'The books are not square'
  const unexplained = imbalanceCents !== 0 && !tally.has('unmatchedReceipt')
  return { tone: unexplained ? 'error' : 'warning', square: false, title, detail: parts.map((p) => p.text), parts }
}
