/**
 * The Finances section's numbers (build plan Phase 58; D109, US-13.3.3): the
 * one home for its tab counts and its side-nav badge. A tab's number counts
 * what needs doing there, not what it lists; Payments and AA fees never show
 * one, so they have no count here. Pure over state slices; each count reads the
 * store selector that owns its rule.
 */

import type { AppState } from '../../../../store/appStore'
import { billingMonitorView } from '../../../../store/billingMonitorView'
import { billingAttentionCount, ledgerAttentionCount, openXeroDivergences, openXeroQueueItems } from '../../../../store/ledgerSelectors'
import { pendingPrepayments } from '../../../../store/prepaymentSelectors'

/**
 * The slices the tab counts read. `appSettings` and `clock` are optional and
 * unread today: the section passes them so a later re-base (Phase 60) needs no
 * new call shape.
 */
export type FinanceCountsState = Pick<AppState, 'billing' | 'schedule' | 'masters'> & Partial<Pick<AppState, 'appSettings' | 'clock'>>

/** The slices the side-nav badge reads: only what it sums. */
export type FinanceBadgeState = Pick<AppState, 'billing'>

/** The tab strip's numbers. No `payments` or `aa-fees`: those tabs never show one. */
export interface FinanceTabCounts {
  billing: number
  invoices: number
  ledger: number
  xero: number
}

/** Billing: the Lists with a billing problem, from the monitor's rule. */
export function billingTabCount(state: FinanceCountsState): number {
  return billingMonitorView(state).totals.withProblems
}

/** Invoices: what awaits approval (one row per Booking and payer), never what is unpaid. */
export function invoicesTabCount(state: FinanceCountsState): number {
  return pendingPrepayments(state).length
}

/** Ledger: the failed ledger checks, held unmatched receipts among them. */
export function ledgerTabCount(state: FinanceBadgeState): number {
  return ledgerAttentionCount(state)
}

/** Xero: hand-offs that raised an alert, plus the open divergences the poll flagged. */
export function xeroTabCount(state: FinanceBadgeState): number {
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

/**
 * The badge's billing part: today the old Billing monitor badge (open billing
 * exceptions, alerted hand-offs, open divergences). Phase 60 re-bases it on
 * the rebuilt Billing tab.
 */
export function badgeBillingPart(state: FinanceBadgeState): number {
  return billingAttentionCount(state)
}

/**
 * The Finances side-nav badge: the billing part plus the failed ledger checks.
 * Reads only what it sums, so the side nav never builds the monitor view; an
 * alerted hand-off counts once, in the billing part.
 */
export function financeBadge(state: FinanceBadgeState): number {
  return badgeBillingPart(state) + ledgerTabCount(state)
}
