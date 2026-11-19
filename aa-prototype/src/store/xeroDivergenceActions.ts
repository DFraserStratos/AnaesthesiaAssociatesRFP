/**
 * Voids and amendments made directly in Xero, flagged for the office
 * (catch-up Phase 37; EP-09's divergence case, US-09.2.2's technical
 * discussion). The reconciliation poll compares what the engine issued with
 * what Xero shows (`detectXeroDivergences`, pure) and records each new finding
 * once. The ledger keeps the issued amount: it is the system of record
 * (US-08.3.2), so nothing auto-corrects. The office records a resolution,
 * which moves no money; the policy for each mismatch is AA's to agree, so the
 * resolution is provisional.
 */

import type { XeroDivergence } from '../domain/types'
import { detectXeroDivergences, type EngineReceivable } from '../domain/xero/divergence'
import { isBookingPair } from '../domain/billing/ledger'
import { toCents } from '../domain/billing/money'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const POLL_ACTOR: Actor = { who: 'Reconciliation poll', role: 'system', source: 'system' }

/** The resolution outcomes the office can record (provisional: the policy is AA's to agree, EP-09). */
export const DIVERGENCE_OUTCOMES: readonly { id: NonNullable<XeroDivergence['resolution']>['outcome']; label: string }[] = [
  { id: 'reissueInXero', label: 'Re-issue it in Xero as the engine issued it' },
  { id: 'creditInEngine', label: 'Credit it in the engine' },
  { id: 'noAction', label: 'No action' },
]

/**
 * The engine's mirrored Booking receivables, as the divergence check reads
 * them. A pair the engine credited (catch-up Phase 39) is `creditedByEngine`,
 * so its credit is never read as drift; what Xero holds paid on it that the
 * engine never recorded is a payment after the credit.
 */
function engineReceivables(state: Pick<AppState, 'billing' | 'xero'>): EngineReceivable[] {
  const recorded = new Set(Object.values(state.billing.receipts).map((r) => r.idempotencyKey))
  const disbursed = new Set(Object.values(state.billing.disbursements).map((d) => d.idempotencyKey))
  const out: EngineReceivable[] = []
  for (const pair of Object.values(state.billing.ledger)) {
    if (!isBookingPair(pair) || pair.receivable.xeroAccRecId === undefined) continue
    const accRecId = pair.receivable.xeroAccRecId
    const base = { pairId: pair.id, invoiceId: pair.invoiceId, accRecId, amount: pair.receivable.amount, receivedAmount: pair.receivable.receivedAmount }
    if (pair.credit === undefined) {
      out.push(base)
      continue
    }
    const unrecorded = Object.values(state.xero.payments).filter((p) => p.accRecId === accRecId && !recorded.has(p.idempotencyKey)).reduce((n, p) => n + toCents(p.amount), 0)
    // A bill Xero paid on its ACCPAY that the engine never recorded (the reversed payable takes no disbursement; catch-up Phase 39 review).
    const accPayId = pair.payable?.xeroAccPayId
    const unrecordedOut =
      accPayId === undefined ? 0 : Object.values(state.xero.disbursements).filter((d) => d.accPayId === accPayId && !disbursed.has(d.idempotencyKey)).reduce((n, d) => n + toCents(d.amount), 0)
    out.push({
      ...base,
      creditedByEngine: true,
      ...(unrecorded > 0 ? { paidInXeroAfterCredit: unrecorded / 100 } : {}),
      ...(unrecordedOut > 0 ? { paidOutInXeroAfterCredit: unrecordedOut / 100 } : {}),
    })
  }
  return out
}

/** Run the check and record each new finding (the poll's last step). Returns how many were flagged. */
export function flagXeroDivergences(api: AppStoreApi): number {
  const state = api.getState()
  const findings = detectXeroDivergences(engineReceivables(state), state.xero.accRecs, Object.values(state.billing.xeroDivergences))
  if (findings.length === 0) return 0
  const metas: MutationMeta[] = []
  mutate(api, POLL_ACTOR, metas, (s) => {
    let counters = s.counters
    const flags = { ...s.billing.xeroDivergences }
    const detectedAtISO = clockISO(s.clock)
    for (const f of findings) {
      const allocated = allocateId(counters, 'xeroDivergence')
      counters = allocated.counters
      flags[allocated.id] = { id: allocated.id, ...f, detectedAtISO, status: 'open' }
      metas.push({ entityType: 'ledgerPair', entityId: f.pairId, action: 'xero.divergenceFlagged', after: { divergenceId: allocated.id, kind: f.kind, ...(f.leg !== undefined ? { leg: f.leg } : {}), accRecId: f.accRecId, xeroTotal: f.xeroShows.total, engineAmount: f.engineHolds.amount } })
    }
    return { billing: { ...s.billing, xeroDivergences: flags }, counters }
  })
  return findings.length
}

/** Record the office's resolution of a flag (a note required). Moves no money: the ledger keeps the issued amount. */
export function resolveXeroDivergence(
  api: AppStoreApi,
  actor: Actor,
  divergenceId: string,
  input: { outcome: NonNullable<XeroDivergence['resolution']>['outcome']; note: string },
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can resolve a Xero mismatch.')
  const flag = api.getState().billing.xeroDivergences[divergenceId]
  if (flag === undefined) return refuse('notFound', 'Flag not found.')
  if (flag.status === 'resolved') return refuse('alreadyResolved', 'Already resolved.')
  const note = input.note.trim()
  if (note === '') return refuse('noteRequired', 'Add a note saying what was done.')
  mutate(api, actor, { entityType: 'ledgerPair', entityId: flag.pairId, action: 'xero.divergenceResolved', after: { divergenceId, outcome: input.outcome, note, provisional: true } }, (s) => {
    const now = s.billing.xeroDivergences[divergenceId]!
    return { billing: { ...s.billing, xeroDivergences: { ...s.billing.xeroDivergences, [divergenceId]: { ...now, status: 'resolved', resolution: { outcome: input.outcome, note, who: actor.who, atISO: clockISO(s.clock) } } } } }
  })
  return ok(undefined)
}
