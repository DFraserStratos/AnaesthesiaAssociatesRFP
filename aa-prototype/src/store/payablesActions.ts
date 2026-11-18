/**
 * Payables run & disbursement (Phase 10; WI4, X5, D-controls) — the second of
 * the RFP's two separately-tracked money states ("disbursed to anaesthetist").
 * An UNBADGED office action (the payables run is proposed product, not a
 * simulation trigger): AA disburses to each anaesthetist the amount authorised
 * but not yet paid out (`amountAuthorised − amountDisbursed`), so a run pays only
 * the INCREMENT since the last run and can never double-pay (7th review A16).
 *
 * A payable is fully paid out only when its cumulative disbursement reaches the
 * full payable (`XeroAccPay.amountPayable`, which equals the receivable); a
 * partial payment authorises (and this run disburses) exactly the amount
 * received, and the balance follows on later payments + runs. AA's own fee is a
 * separate monthly invoice and is never deducted here (FT-10.3). Audited `source:'system'` (`xero.disbursed`).
 *
 * The run reads every payable through one adapter (`payableLegsFrom`, catch-up
 * Phase 27a): an ACCPAY to an anaesthetist, or a transferred prepayment. A
 * payable crediting the AA Holding account is never one (`isHeldPayable`):
 * money leaves the account only by a transfer or refund the system raises
 * (`canPayOutOfHolding`, US-06.5.1). The payment itself is Xero's (D53): this
 * run stands in until Phase 37 moves it to the Xero simulator, behind the same
 * adapter.
 */

import type { BillingCase, Disbursement, PrepayTransfer, XeroAccPay } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { canPayOutOfHolding, HOLDING_SYSTEM_ONLY, isHeldPayable, legIncrement, payableLegsFrom, type PayableLeg } from '../domain/billing/prepayHolding'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const PAYABLES_ACTOR: Actor = { who: 'Payables run', role: 'system', source: 'system' }

export interface PayablesRunResult {
  payablesRunId?: string
  disbursedCount: number
  totalDisbursed: number
  /** The ACCPAY ids paid; a transferred prepayment's transfer id. */
  accPayIds: string[]
}

export interface PayablesDue {
  count: number
  total: number
}

/** Every payable the run may pay: anaesthetists' ACCPAYs and transferred prepayments, never the AA Holding account's. */
function legsOf(state: Pick<AppState, 'xero' | 'billing'>): PayableLeg[] {
  return payableLegsFrom(state.xero.accPays, state.billing.transfers, (caseId) => state.billing.cases[caseId]?.accPayId)
}

/** The payables due right now: count of payables and the total increment to disburse. */
export function payablesDue(state: Pick<AppState, 'xero' | 'billing'>): PayablesDue {
  let count = 0
  let total = 0
  for (const leg of legsOf(state)) {
    const increment = legIncrement(leg)
    if (toCents(increment) > 0) {
      count += 1
      total = roundToCents(total + increment)
    }
  }
  return { count, total }
}

/**
 * Run the payables (office action). Disburses released less disbursed on every
 * payable that has anything to pay, records a Disbursement per pay (naming the
 * transfer when it pays one), and mirrors the cumulative disbursed amount and a
 * fully-paid-out timestamp onto an ACCPAY's BillingCase. Returns
 * `disbursedCount:0` (no run id, no mutation) when there is nothing to pay.
 */
function disbursePayables(
  api: AppStoreApi,
  eligibleIds: ReadonlySet<string>,
): Outcome<PayablesRunResult> {
  const state = api.getState()
  const eligible = new Set(legsOf(state).filter((leg) => eligibleIds.has(leg.id) && toCents(legIncrement(leg)) > 0).map((leg) => leg.id))
  if (eligible.size === 0) {
    return ok({ disbursedCount: 0, totalDisbursed: 0, accPayIds: [] })
  }

  const metas: MutationMeta[] = []
  const result: PayablesRunResult = { disbursedCount: 0, totalDisbursed: 0, accPayIds: [] }

  mutate(api, PAYABLES_ACTOR, metas, (s) => {
    let counters = s.counters
    const pr = allocateId(counters, 'payablesRun')
    counters = pr.counters
    const payablesRunId = pr.id
    result.payablesRunId = payablesRunId

    const atISO = clockISO(s.clock)
    const accPays = { ...s.xero.accPays }
    const transfers = { ...s.billing.transfers }
    const disbursements = { ...s.xero.disbursements }
    const cases = { ...s.billing.cases }
    // case lookup by accPayId (one case per pair).
    const caseByAccPay = new Map<string, BillingCase>()
    for (const c of Object.values(cases)) if (c.accPayId !== undefined) caseByAccPay.set(c.accPayId, c)

    for (const leg of legsOf(s)) {
      if (!eligible.has(leg.id)) continue
      const increment = legIncrement(leg)
      if (toCents(increment) <= 0) continue

      const dsb = allocateId(counters, 'disbursement')
      counters = dsb.counters
      disbursements[dsb.id] = {
        id: dsb.id,
        ...(leg.kind === 'transfer' ? { transferId: leg.id } : { accPayId: leg.id }),
        amount: increment,
        atISO,
        payablesRunId,
      } satisfies Disbursement

      const newDisbursed = roundToCents(leg.disbursed + increment)
      // Fully paid out = cumulative disbursement reaches the FULL payable,
      // not merely the currently-authorised slice.
      const fullyPaidOut = toCents(newDisbursed) >= toCents(leg.payable)

      if (leg.kind === 'transfer') {
        // A transferred prepayment: the anaesthetist's payable is the transfer's own leg. The collect
        // pair (its ACCPAY to the AA Holding account, its case) is never paid (US-06.5.1).
        const transfer = transfers[leg.id]!
        transfers[leg.id] = { ...transfer, disbursed: newDisbursed } satisfies PrepayTransfer
        metas.push({
          entityType: 'billingCase',
          entityId: transfer.collectCaseId,
          action: 'xero.disbursed',
          after: { transferId: leg.id, increment, cumulative: newDisbursed, payablesRunId, fullyPaidOut },
        })
      } else {
        const original = accPays[leg.id]!
        accPays[leg.id] = {
          ...original,
          amountDisbursed: newDisbursed,
          status: fullyPaidOut ? 'paid' : 'authorised',
        } satisfies XeroAccPay

        const linkedCase = caseByAccPay.get(leg.id)
        if (linkedCase !== undefined) {
          const caseNow = cases[linkedCase.id] ?? linkedCase
          const next: BillingCase = {
            ...caseNow,
            disbursedAmount: newDisbursed,
            ...(fullyPaidOut ? { status: 'disbursed' as const } : {}),
          }
          if (fullyPaidOut && next.disbursedAtISO === undefined) next.disbursedAtISO = atISO
          cases[linkedCase.id] = next
        }
        metas.push({
          entityType: 'xeroAccPay',
          entityId: leg.id,
          action: 'xero.disbursed',
          after: { increment, cumulative: newDisbursed, payablesRunId, fullyPaidOut },
        })
      }

      result.disbursedCount += 1
      result.totalDisbursed = roundToCents(result.totalDisbursed + increment)
      result.accPayIds.push(leg.id)
    }

    return {
      xero: { ...s.xero, accPays, disbursements },
      billing: { ...s.billing, cases, transfers },
      counters,
    }
  })

  return ok(result)
}

export function runPayables(api: AppStoreApi, actor: Actor): Outcome<PayablesRunResult> {
  const state = api.getState()
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can run payables.')

  const eligibleIds = new Set(legsOf(state).filter((leg) => toCents(legIncrement(leg)) > 0).map((leg) => leg.id))
  return disbursePayables(api, eligibleIds)
}

/**
 * Disburse one selected payable. This is used by the invoice-detail demo
 * shortcut; the normal office payables run remains available for batch work.
 * A payable crediting the AA Holding account is refused: money leaves the
 * account only by a transfer or refund the system raises (catch-up Phase 27a;
 * US-06.5.1, D38, D53).
 */
export function disbursePayable(
  api: AppStoreApi,
  actor: Actor,
  accPayId: string,
): Outcome<PayablesRunResult> {
  const state = api.getState()
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can disburse a payable.')
  const accPay = state.xero.accPays[accPayId]
  if (accPay === undefined) return refuse('notFound', 'ACCPAY not found.')
  if (isHeldPayable(accPay) && !canPayOutOfHolding('manual')) return refuse('holdingSystemOnly', HOLDING_SYSTEM_ONLY)
  return disbursePayables(api, new Set([accPayId]))
}
