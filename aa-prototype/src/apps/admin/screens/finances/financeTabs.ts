/**
 * The Finances section's tabs in one registry (build plan Phase 58; D107,
 * US-13.3.3): each tab's label and path, in the strip's order. Finances opens on
 * Billing.
 */

import { financePath, type FinanceTab } from './financePaths'

export interface FinanceTabEntry {
  tab: FinanceTab
  label: string
  path: string
}

export const FINANCE_TABS: readonly FinanceTabEntry[] = [
  { tab: 'billing', label: 'Billing', path: financePath('billing') },
  { tab: 'invoices', label: 'Invoices', path: financePath('invoices') },
  { tab: 'payments', label: 'Payments', path: financePath('payments') },
  { tab: 'ledger', label: 'Ledger', path: financePath('ledger') },
  { tab: 'xero', label: 'Xero', path: financePath('xero') },
  { tab: 'aa-fees', label: 'AA fees', path: financePath('aa-fees') },
]
