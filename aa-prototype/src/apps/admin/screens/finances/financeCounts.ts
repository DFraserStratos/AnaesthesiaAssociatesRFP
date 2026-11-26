/**
 * The Finances section's numbers (build plan Phases 58 and 60; D109, US-13.3.3):
 * the one home for its tab counts and its side-nav badge. A tab's number counts
 * what needs doing there, not what it lists; Payments and AA fees never show
 * one, so they have no count here. Pure over state slices.
 *
 * The Billing count is the Lists with a billing problem, from the billing
 * status model (`domain/billing/billingStatus.ts`), built once per change of
 * the schedule, billing and masters slices and shared by the side-nav badge
 * and the Billing tab (`billingStatusesFor`). The other tabs' counts read the
 * store selector that owns their rule.
 */

import type { AppState } from '../../../../store/appStore'
import { bookingsByList, pairsByBooking } from '../../../../store/indexes'
import { ledgerAttentionCount, openXeroDivergences, openXeroQueueItems } from '../../../../store/ledgerSelectors'
import { pendingPrepayments } from '../../../../store/prepaymentSelectors'
import {
  listBillingStatuses,
  problemListCount,
  xeroItemsOnLists,
  type BillingStatusInput,
  type ListBillingStatus,
  type XeroListItem,
} from '../../../../domain/billing/billingStatus'

/**
 * The slices the tab counts read. `appSettings` and `clock` are optional and
 * unread today; the section passes them.
 */
export type FinanceCountsState = Pick<AppState, 'billing' | 'schedule' | 'masters'> & Partial<Pick<AppState, 'appSettings' | 'clock'>>

/** The slice the Ledger and Xero counts read. */
export type FinanceBillingSliceState = Pick<AppState, 'billing'>

/** The slices the side-nav badge and the Billing count read: the billing status model's three (D109). */
export type FinanceBadgeState = Pick<AppState, 'billing' | 'schedule' | 'masters'>

/** The tab strip's numbers. No `payments` or `aa-fees`: those tabs never show one. */
export interface FinanceTabCounts {
  billing: number
  invoices: number
  ledger: number
  xero: number
}

// ---------------------------------------------------------------------------
// The billing status model, built once per change
// ---------------------------------------------------------------------------

/** The billing status model's input, from the store's slices and indexes (US-13.3.1). */
export function billingStatusInput(state: FinanceBadgeState): BillingStatusInput {
  return {
    lists: state.schedule.lists,
    bookingsByList: bookingsByList(state.schedule.bookings),
    invoices: state.billing.invoices,
    ledger: state.billing.ledger,
    pairsByBooking: pairsByBooking(state.billing.ledger),
    transfers: state.billing.transfers,
    exceptions: state.billing.exceptions,
    xeroQueue: state.billing.xeroQueue,
    xeroDivergences: state.billing.xeroDivergences,
    patients: state.masters.patients,
    anaesthetists: state.masters.anaesthetists,
    hospitals: state.masters.hospitals,
  }
}

interface BillingModel {
  input: BillingStatusInput
  statuses: ListBillingStatus[]
  /** Filled on the badge's first read. */
  badgeBillingPart?: number
}

/**
 * Memoised on the identity of the three slices (a WeakMap chain): every write
 * goes through `mutate()`, which replaces a slice it changes, so the model is
 * rebuilt exactly when one of them changes. The side nav (every render) and the
 * Billing tab share one build at practice scale.
 */
const modelCache = new WeakMap<AppState['schedule'], WeakMap<AppState['billing'], WeakMap<AppState['masters'], BillingModel>>>()

function billingModel(state: FinanceBadgeState): BillingModel {
  let byBilling = modelCache.get(state.schedule)
  if (byBilling === undefined) {
    byBilling = new WeakMap()
    modelCache.set(state.schedule, byBilling)
  }
  let byMasters = byBilling.get(state.billing)
  if (byMasters === undefined) {
    byMasters = new WeakMap()
    byBilling.set(state.billing, byMasters)
  }
  const hit = byMasters.get(state.masters)
  if (hit !== undefined) return hit
  const input = billingStatusInput(state)
  const model: BillingModel = { input, statuses: listBillingStatuses(input) }
  byMasters.set(state.masters, model)
  return model
}

/** Every authorised List's billing status, built once per change of the schedule, billing and masters slices (US-13.3.1). Shared: copy before sorting. */
export function billingStatusesFor(state: FinanceBadgeState): ListBillingStatus[] {
  return billingModel(state).statuses
}

// ---------------------------------------------------------------------------
// The tab counts
// ---------------------------------------------------------------------------

/** Billing: the Lists with a billing problem (D109; a List with a Booking failed or stuck at Xero is among them). */
export function billingTabCount(state: FinanceBadgeState): number {
  return problemListCount(billingStatusesFor(state))
}

/** Invoices: what awaits approval (one row per Booking and payer), never what is unpaid. */
export function invoicesTabCount(state: FinanceCountsState): number {
  return pendingPrepayments(state).length
}

/** Ledger: the failed ledger checks, held unmatched receipts among them. */
export function ledgerTabCount(state: FinanceBillingSliceState): number {
  return ledgerAttentionCount(state)
}

/** Xero: hand-offs that raised an alert, plus the open divergences the poll flagged. */
export function xeroTabCount(state: FinanceBillingSliceState): number {
  return openXeroQueueItems(state).filter((q) => q.status === 'alerted').length + openXeroDivergences(state).length
}

/** Every tab's number, for the strip. */
export function financeTabCounts(state: FinanceCountsState): FinanceTabCounts {
  return {
    billing: billingTabCount(state),
    invoices: invoicesTabCount(state),
    ledger: ledgerTabCount(state),
    xero: xeroTabCount(state),
  }
}

// ---------------------------------------------------------------------------
// The badge
// ---------------------------------------------------------------------------

/** Whether the Xero tab counts an open item: every divergence, and a hand-off only once it raised an alert (`xeroTabCount`'s rule). */
const countedOnXeroTab = (item: XeroListItem): boolean => item.kind === 'divergence' || item.alerted

/**
 * The badge's billing part (D109): the Billing tab's number, plus the Xero
 * tab's items that sit under no problem List (invoices changed directly in
 * Xero and alerts not tied to a Booking on a List, and the rare one whose List
 * reads no problem). A Booking stuck at Xero makes its List a problem, so it
 * counts once, with the List.
 */
export function badgeBillingPart(state: FinanceBadgeState): number {
  const model = billingModel(state)
  if (model.badgeBillingPart !== undefined) return model.badgeBillingPart
  const problemLists = new Set<string>()
  for (const l of model.statuses) if (l.hasProblem) problemLists.add(l.listId)
  const { byList, unattached } = xeroItemsOnLists(model.input)
  let extra = unattached.filter(countedOnXeroTab).length
  for (const [listId, items] of byList) if (!problemLists.has(listId)) extra += items.filter(countedOnXeroTab).length
  model.badgeBillingPart = problemLists.size + extra
  return model.badgeBillingPart
}

/**
 * The Finances side-nav badge (D109): the billing part plus the failed ledger
 * checks. A Booking stuck at Xero shows on the Billing and Xero tabs but counts
 * once, in the billing part.
 */
export function financeBadge(state: FinanceBadgeState): number {
  return badgeBillingPart(state) + ledgerTabCount(state)
}
