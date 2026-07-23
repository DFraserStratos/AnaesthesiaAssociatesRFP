/**
 * Payables run & disbursement (Phase 10; WI4, X5, D-controls) — the second of
 * the RFP's two separately-tracked money states ("disbursed to anaesthetist").
 * An UNBADGED office action (the payables run is proposed product, not a
 * simulation trigger): AA disburses to each anaesthetist the amount authorised
 * but not yet paid out (`amountAuthorised − amountDisbursed`), so a run pays only
 * the INCREMENT since the last run and can never double-pay (7th review A16).
 *
 * A payable is fully paid out only when its cumulative disbursement reaches the
 * full payable (the paired ACCREC's `amountDue`); a partial payment authorises
 * (and this run disburses) only its proportional share, and the balance follows
 * on later payments + runs. Audited `source:'system'` (`xero.disbursed`).
 */

import type { BillingCase, Disbursement, XeroAccPay } from '../domain/types'
import { roundToCents, toCents } from '../domain/billing/money'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const PAYABLES_ACTOR: Actor = { who: 'Payables run', role: 'system', source: 'system' }

export interface PayablesRunResult {
  payablesRunId?: string
  disbursedCount: number
  totalDisbursed: number
  accPayIds: string[]
}

export interface PayablesDue {
  count: number
  total: number
}

/** The payables due right now: count of ACCPAYs and the total increment to disburse. */
export function payablesDue(state: Pick<AppState, 'xero'>): PayablesDue {
  let count = 0
  let total = 0
  for (const p of Object.values(state.xero.accPays)) {
    const increment = roundToCents(p.amountAuthorised - p.amountDisbursed)
    if (toCents(increment) > 0) {
      count += 1
      total = roundToCents(total + increment)
    }
  }
  return { count, total }
}

/**
 * Run the payables (office action). Disburses `amountAuthorised − amountDisbursed`
 * on every ACCPAY that has anything to pay, records a Disbursement per pay,
 * and mirrors the cumulative disbursed amount + a fully-paid-out timestamp onto
 * the BillingCase. Returns `disbursedCount:0` (no run id, no mutation) when there
 * is nothing to pay.
 */
export function runPayables(api: AppStoreApi, actor: Actor): Outcome<PayablesRunResult> {
  const state = api.getState()
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can run payables.')

  const eligible = Object.values(state.xero.accPays).filter(
    (p) => toCents(p.amountAuthorised - p.amountDisbursed) > 0,
  )
  if (eligible.length === 0) {
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
    const disbursements = { ...s.xero.disbursements }
    const cases = { ...s.billing.cases }
    // case lookup by accPayId (one case per pair).
    const caseByAccPay = new Map<string, BillingCase>()
    for (const c of Object.values(cases)) if (c.accPayId !== undefined) caseByAccPay.set(c.accPayId, c)

    for (const original of Object.values(s.xero.accPays)) {
      const increment = roundToCents(original.amountAuthorised - original.amountDisbursed)
      if (toCents(increment) <= 0) continue

      const dsb = allocateId(counters, 'disbursement')
      counters = dsb.counters
      disbursements[dsb.id] = {
        id: dsb.id,
        accPayId: original.id,
        amount: increment,
        atISO,
        payablesRunId,
      } satisfies Disbursement

      const newDisbursed = roundToCents(original.amountDisbursed + increment)
      // Fully paid out = cumulative disbursement reaches the FULL payable (the
      // paired ACCREC's amountDue), not merely the currently-authorised slice.
      const accRec = s.xero.accRecs[original.accRecId]
      const fullPayable = accRec?.amountDue ?? original.amountAuthorised
      const fullyPaidOut = toCents(newDisbursed) >= toCents(fullPayable)
      accPays[original.id] = {
        ...original,
        amountDisbursed: newDisbursed,
        status: fullyPaidOut ? 'paid' : 'authorised',
      } satisfies XeroAccPay

      const linkedCase = caseByAccPay.get(original.id)
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

      result.disbursedCount += 1
      result.totalDisbursed = roundToCents(result.totalDisbursed + increment)
      result.accPayIds.push(original.id)

      metas.push({
        entityType: 'xeroAccPay',
        entityId: original.id,
        action: 'xero.disbursed',
        after: { increment, cumulative: newDisbursed, payablesRunId, fullyPaidOut },
      })
    }

    return {
      xero: { ...s.xero, accPays, disbursements },
      billing: { ...s.billing, cases },
      counters,
    }
  })

  return ok(result)
}
