/**
 * Create planners, one path (catch-up Phase 42; US-13.4.3 AC1).
 *
 * Each master the seed load targets has a pure planner beside its create
 * action (`planHospitalCreate` in `mastersActions.ts`, `planContractCreate` in
 * `contractActions.ts`, and so on): it checks the fields with the master's own
 * rules, allocates the id and returns the next slices and the audit metas, or
 * the refusal. The office's single-record action is "plan, then mutate" with
 * it, and the seed load folds the same planners over a working state and
 * commits the result in ONE `mutate()`. So a loaded record passes exactly the
 * guards a hand-made one does, and a rejected row's reason is word for word
 * the manual refusal.
 */

import type { AppState } from './appStore'
import type { Actor, MutationMeta, Outcome } from './mutate'

/** The slices a planner may replace. */
export type PlanSlices = Pick<AppState, 'masters' | 'counters' | 'schedule'>

/** What a planner returns when the record can be made. */
export interface Plan {
  next: PlanSlices
  metas: MutationMeta[]
  /** The id of the record made (a price range's is `<contractId>@<startISO>`). */
  id: string
}

/** Where a planned record came from, written into its create meta's `after` (`{ loadId, rowNumber }`). */
export interface PlanSource {
  loadId: string
  rowNumber: number
}

export type Planner<F> = (state: AppState, actor: Actor, fields: F, source?: PlanSource) => Outcome<Plan>

/** The state after a plan: its slices over the state it was made from. */
export function applyPlan<S extends PlanSlices>(state: S, plan: Plan): S {
  return { ...state, masters: plan.next.masters, counters: plan.next.counters, schedule: plan.next.schedule }
}

/** Mark the first meta (the record's create) with where it was loaded from. */
export function withSource(metas: MutationMeta[], source: PlanSource | undefined): MutationMeta[] {
  if (source === undefined || metas.length === 0) return metas
  const [first, ...rest] = metas
  const after = first!.after !== null && typeof first!.after === 'object' ? (first!.after as Record<string, unknown>) : {}
  return [{ ...first!, after: { ...after, loadId: source.loadId, rowNumber: source.rowNumber } }, ...rest]
}

/** The slices of a state, for a planner's `next`. */
export function slicesOf(state: PlanSlices): PlanSlices {
  return { masters: state.masters, counters: state.counters, schedule: state.schedule }
}
