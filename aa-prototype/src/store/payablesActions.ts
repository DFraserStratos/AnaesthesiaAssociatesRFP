/**
 * Payables run & disbursement (Phase 10; WI4, X5, D-controls): the second of
 * the RFP's two separately-tracked money states ("disbursed to anaesthetist").
 * An UNBADGED office action (the payables run is proposed product, not a
 * simulation trigger).
 *
 * Since catch-up Phase 36 it is computed from the LEDGER's payable legs
 * (US-08.3.2, US-10.1.2), never from `state.xero`: each anaesthetist payable
 * on a Booking pair and each transfer's `in` leg to the anaesthetist who did
 * the List pays what it has released less what it has paid out, so a run pays
 * only the increment since the last and can never double-pay. A payable to the
 * AA Holding account is never due and never paid: money leaves the account only
 * by a transfer or a refund the system raises (27a). AA's own fee is never
 * netted (16): an `aaFee` pair has no payable.
 *
 * `payablesDue` is the ONE source of what is due: Phase 39a's weekly run reads
 * it, with no second copy. The run is an on-demand office action here (OQ-47
 * Proposed). Each disbursement is the ledger's record of a payment made in Xero
 * (OQ-111, D53), written through one function (`disburseLegs`) that Phase
 * 37's detection will call too, so only the caller changes. Audited
 * `ledger.disbursed` then `xero.disbursed`.
 */

import type { AnaesthetistId, LedgerDisbursement, PayableLeg } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { applyDisbursement, dueOn, isBookingPair, isHoldingLeg, payeeAnaesthetistOf } from '../domain/billing/ledger'
import { HOLDING_SYSTEM_ONLY } from '../domain/billing/prepayHolding'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const PAYABLES_ACTOR: Actor = { who: 'Payables run', role: 'system', source: 'system' }

export interface PayablesRunResult {
  payablesRunId?: string
  disbursedCount: number
  totalDisbursed: number
  /** The pairs and transfers paid. */
  paidIds: string[]
  /** Legs released but with no Xero mirror (cannot occur: a receipt needs the ACCREC); skipped and counted. */
  skippedNotInXero: number
}

export interface PayablesDueRow {
  anaesthetistId: AnaesthetistId
  count: number
  /** Signed: Phase 39a's negative legs net here. */
  total: number
}

export interface PayablesDue {
  count: number
  total: number
  /** Per stamped payee, roster-agnostic, by id. Never a row for the AA Holding account. */
  byAnaesthetist: PayablesDueRow[]
}

export interface PayablesFilter {
  /** One anaesthetist's legs only. */
  anaesthetistId?: AnaesthetistId
  /** Only these pairs and transfers (Phase 39a holds anomalies out of a cycle with this). */
  only?: readonly string[]
}

/** One payable leg the run may pay: its owner (a pair or transfer) and the leg. */
interface DueLeg {
  id: string
  kind: 'pair' | 'transfer'
  anaesthetistId: AnaesthetistId
  leg: PayableLeg
}

/** Every anaesthetist payable leg in the ledger: Booking pairs' and transfers' `in` legs, never the AA Holding account's. */
function legsOf(state: Pick<AppState, 'billing'>, filter: PayablesFilter = {}): DueLeg[] {
  const only = filter.only !== undefined ? new Set(filter.only) : undefined
  const legs: DueLeg[] = []
  for (const pair of Object.values(state.billing.ledger)) {
    if (!isBookingPair(pair) || pair.payable === undefined || isHoldingLeg(pair.payable)) continue
    const anaesthetistId = payeeAnaesthetistOf(pair.payable)!
    legs.push({ id: pair.id, kind: 'pair', anaesthetistId, leg: pair.payable })
  }
  for (const t of Object.values(state.billing.transfers)) {
    const anaesthetistId = payeeAnaesthetistOf(t.in)
    if (anaesthetistId !== undefined) legs.push({ id: t.id, kind: 'transfer', anaesthetistId, leg: t.in })
  }
  return legs
    .filter((l) => (filter.anaesthetistId === undefined || l.anaesthetistId === filter.anaesthetistId) && (only === undefined || only.has(l.id)))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** The payables due right now, from the ledger alone: count, total and per payee. */
export function payablesDue(state: Pick<AppState, 'billing'>, filter: PayablesFilter = {}): PayablesDue {
  let count = 0
  let cents = 0
  const by = new Map<string, { count: number; cents: number }>()
  for (const l of legsOf(state, filter)) {
    const due = toCents(dueOn(l.leg))
    if (due === 0) continue
    // Signed: a negative leg (Phase 39a) nets against the payee's positive ones; only positive legs count as payables to pay.
    if (due > 0) count += 1
    cents += due
    const row = by.get(l.anaesthetistId) ?? { count: 0, cents: 0 }
    if (due > 0) row.count += 1
    row.cents += due
    by.set(l.anaesthetistId, row)
  }
  return {
    count,
    total: cents / 100,
    byAnaesthetist: [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([anaesthetistId, r]) => ({ anaesthetistId, count: r.count, total: r.cents / 100 })),
  }
}

/**
 * Pay out every leg in `ids` with something due (the one write path for a
 * disbursement): applies `applyDisbursement` on the leg, writes a
 * `LedgerDisbursement`, mirrors a Xero `Disbursement` and the ACCPAY's paid
 * out amount and status. Returns `disbursedCount:0` (no run id, no mutation)
 * when there is nothing to pay.
 */
function disburseLegs(api: AppStoreApi, ids: ReadonlySet<string>): Outcome<PayablesRunResult> {
  const state = api.getState()
  const eligible = legsOf(state).filter((l) => ids.has(l.id) && toCents(dueOn(l.leg)) > 0)
  const result: PayablesRunResult = { disbursedCount: 0, totalDisbursed: 0, paidIds: [], skippedNotInXero: 0 }
  if (eligible.length === 0) return ok(result)

  const metas: MutationMeta[] = []
  mutate(api, PAYABLES_ACTOR, metas, (s) => {
    let counters = s.counters
    const pr = allocateId(counters, 'payablesRun')
    counters = pr.counters
    const payablesRunId = pr.id
    result.payablesRunId = payablesRunId
    const atISO = clockISO(s.clock)
    const ledger = { ...s.billing.ledger }
    const transfers = { ...s.billing.transfers }
    const ledgerDisbursements = { ...s.billing.disbursements }
    const accPays = { ...s.xero.accPays }
    const xeroDisbursements = { ...s.xero.disbursements }

    for (const l of legsOf(s)) {
      if (!ids.has(l.id)) continue
      const increment = dueOn(l.leg)
      if (toCents(increment) <= 0) continue
      // A pair's leg is mirrored by its ACCPAY; a released leg with none cannot occur (a receipt needs the ACCREC).
      const accPayId = l.kind === 'pair' ? l.leg.xeroAccPayId : undefined
      if (l.kind === 'pair' && (accPayId === undefined || accPays[accPayId] === undefined)) {
        result.skippedNotInXero += 1
        continue
      }
      const moved = applyDisbursement(l.leg, increment, atISO)
      if (!moved.ok) continue
      const leg = moved.leg
      if (l.kind === 'pair') {
        const pair = ledger[l.id]!
        ledger[l.id] = { ...pair, payable: leg } as typeof pair
      } else {
        transfers[l.id] = { ...transfers[l.id]!, in: leg }
      }

      const dsb = allocateId(counters, 'disbursement')
      counters = dsb.counters
      xeroDisbursements[dsb.id] = { id: dsb.id, ...(l.kind === 'transfer' ? { transferId: l.id } : { accPayId: accPayId! }), amount: increment, atISO, payablesRunId }
      const ld = allocateId(counters, 'ledgerDisbursement')
      counters = ld.counters
      ledgerDisbursements[ld.id] = { id: ld.id, pairId: l.id, anaesthetistId: l.anaesthetistId, amount: increment, atISO, payablesRunId, xeroDisbursementId: dsb.id } satisfies LedgerDisbursement

      const fullyPaidOut = toCents(leg.disbursedAmount) >= toCents(leg.amount)
      metas.push({
        entityType: 'ledgerPair',
        entityId: l.kind === 'pair' ? l.id : transfers[l.id]!.collectPairId,
        action: 'ledger.disbursed',
        after: { ...(l.kind === 'transfer' ? { transferId: l.id } : {}), increment, cumulative: leg.disbursedAmount, payablesRunId, fullyPaidOut },
      })
      if (accPayId !== undefined) {
        const original = accPays[accPayId]!
        accPays[accPayId] = { ...original, amountDisbursed: leg.disbursedAmount, status: fullyPaidOut ? 'paid' : 'authorised' }
        metas.push({ entityType: 'xeroAccPay', entityId: accPayId, action: 'xero.disbursed', after: { increment, cumulative: leg.disbursedAmount, payablesRunId, fullyPaidOut } })
      } else {
        metas.push({ entityType: 'ledgerPair', entityId: transfers[l.id]!.collectPairId, action: 'xero.disbursed', after: { transferId: l.id, increment, cumulative: leg.disbursedAmount, payablesRunId, fullyPaidOut } })
      }
      result.disbursedCount += 1
      result.totalDisbursed = roundToCents(result.totalDisbursed + increment)
      result.paidIds.push(l.id)
    }
    if (result.disbursedCount === 0) {
      metas.push({ entityType: 'ledgerPair', entityId: payablesRunId, action: 'ledger.disburseNoop' })
      return {}
    }
    return {
      billing: { ...s.billing, ledger, transfers, disbursements: ledgerDisbursements },
      xero: { ...s.xero, accPays, disbursements: xeroDisbursements },
      counters,
    }
  })
  if (result.disbursedCount === 0) delete result.payablesRunId
  return ok(result)
}

/** Run the payables (office action): pay every leg with something due, or one anaesthetist's, or a chosen subset. */
export function runPayables(api: AppStoreApi, actor: Actor, filter: PayablesFilter = {}): Outcome<PayablesRunResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can run payables.')
  const ids = new Set(legsOf(api.getState(), filter).filter((l) => toCents(dueOn(l.leg)) > 0).map((l) => l.id))
  return disburseLegs(api, ids)
}

/**
 * Disburse one pair's (or transfer's) payable: the Xero simulation's shortcut;
 * the office's run is for batch work. A payable to the AA Holding account is
 * refused: money leaves the account only by a transfer or refund the system
 * raises (catch-up Phase 27a; US-06.5.1, D38, D53).
 */
export function disbursePayable(api: AppStoreApi, actor: Actor, pairId: string): Outcome<PayablesRunResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can disburse a payable.')
  const state = api.getState()
  const pair = state.billing.ledger[pairId]
  const transfer = state.billing.transfers[pairId]
  if (pair === undefined && transfer === undefined) return refuse('notFound', 'Payable not found.')
  if (pair !== undefined && (!isBookingPair(pair) || pair.payable === undefined)) return refuse('noPayable', 'This invoice has no payable.')
  if (pair !== undefined && isBookingPair(pair) && pair.payable !== undefined && isHoldingLeg(pair.payable)) return refuse('holdingSystemOnly', HOLDING_SYSTEM_ONLY)
  return disburseLegs(api, new Set([pairId]))
}
