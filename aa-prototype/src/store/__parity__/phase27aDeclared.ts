/**
 * Catch-up Phase 27a's declared parity difference (the AA Holding account),
 * set aside by the earlier phases' parity suites, whose fixtures never change.
 * One move only: a prepayment's payable credits the AA Holding account and is
 * no longer a BCTI (`BCTI_COUNT_RULE.prepaymentPairs` off, OQ-29 provisional),
 * so Dr Souter's July 2026 count falls by one (Nair's INV0001, paid 14 July).
 * Her May and June fee history, every other month and every other
 * anaesthetist are unchanged. Imported only by tests.
 */

import { ANAE } from '../../domain/seed'

export const PHASE_27A_REASON = "a prepayment's payable credits the AA Holding account and is not a BCTI, Phase 27a"

/** The one BCTI count that moves: Dr Souter, July 2026, one fewer. */
export const PHASE_27A_BCTI_MOVE = { anaesthetistId: ANAE.souter, monthISO: '2026-07', delta: -1 } as const

/** A baseline's BCTI rows with 27a's declared move applied (a row reaching zero is dropped, as the captures drop them). */
export function withPhase27aBctis<T extends { anaesthetistId: string; monthISO: string; count: number }>(rows: readonly T[]): T[] {
  return rows
    .map((r) => (r.anaesthetistId === PHASE_27A_BCTI_MOVE.anaesthetistId && r.monthISO === PHASE_27A_BCTI_MOVE.monthISO ? { ...r, count: r.count + PHASE_27A_BCTI_MOVE.delta } : r))
    .filter((r) => r.count > 0)
}
