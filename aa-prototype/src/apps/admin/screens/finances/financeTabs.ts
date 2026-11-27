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
  /** The one-line sub under the Finances title. Every tab has one, kept to one line, so the tab strip never moves between tabs. */
  sub: string
}

export const FINANCE_TABS: readonly FinanceTabEntry[] = [
  { tab: 'billing', label: 'Billing', path: financePath('billing'), sub: "Each authorised List's Bookings through billing, with any problem and its fix." },
  { tab: 'invoices', label: 'Invoices', path: financePath('invoices'), sub: 'Every invoice and credit note, and what is still owed on each.' },
  { tab: 'payments', label: 'Payments', path: financePath('payments'), sub: "Events to approve, the payment cycle, its runs and each anaesthetist's remittance." },
  { tab: 'ledger', label: 'Ledger', path: financePath('ledger'), sub: "AA's system of record: what each payer owes and what each anaesthetist is owed." },
  { tab: 'xero', label: 'Xero', path: financePath('xero'), sub: 'What the Billing Engine hands to Xero, and anything changed directly in Xero.' },
  { tab: 'aa-fees', label: 'AA fees', path: financePath('aa-fees'), sub: "AA's monthly fee to each anaesthetist: a separate invoice, never deducted from a payment." },
]
