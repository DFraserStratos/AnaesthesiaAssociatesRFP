/**
 * The Finances section's URLs (build plan Phase 58; D107, D108, US-13.3.3): its
 * six tabs and the records under them. The one home every in-app link builds
 * them from. The fixed query shapes (`?view=approval`, `?problems=1`, `?list=`,
 * `?pair=`) are read by the tabs Wave 5 rebuilds and never change. The old
 * Invoices, Billing monitor, credit note, payment run and Ledger addresses map
 * here through `financePathFromLegacy` and redirect with replace (`routes.tsx`'s
 * `FinanceLegacyRedirect`).
 */

export type FinanceTab = 'billing' | 'invoices' | 'payments' | 'ledger' | 'xero' | 'aa-fees'

export const FINANCES_BASE = '/admin/finances'

const FINANCE_TAB_IDS: readonly FinanceTab[] = ['billing', 'invoices', 'payments', 'ledger', 'xero', 'aa-fees']

export function isFinanceTab(value: string): value is FinanceTab {
  return (FINANCE_TAB_IDS as readonly string[]).includes(value)
}

function withQuery(path: string, query: Readonly<Record<string, string>> | URLSearchParams | string = {}): string {
  const search = typeof query === 'string' ? query.replace(/^\?/, '') : new URLSearchParams(query as Record<string, string>).toString()
  return `${path}${search === '' ? '' : `?${search}`}`
}

/** A Finances tab, with any list state as its query. */
export function financePath(tab: FinanceTab, query: Readonly<Record<string, string>> = {}): string {
  return withQuery(`${FINANCES_BASE}/${tab}`, query)
}

const seg = (id: string): string => encodeURIComponent(id)

/** An invoice's page, under Invoices. */
export function invoicePath(invoiceId: string): string {
  return `${FINANCES_BASE}/invoices/${seg(invoiceId)}`
}

/** A credit note's page, under Invoices. */
export function creditNotePath(creditNoteId: string): string {
  return `${FINANCES_BASE}/invoices/credit-notes/${seg(creditNoteId)}`
}

/** A payment run's page, under Payments. */
export function paymentRunPath(runId: string): string {
  return `${FINANCES_BASE}/payments/${seg(runId)}`
}

/** One anaesthetist's remittance advice in a payment run, under the run. */
export function remittancePath(runId: string, anaesthetistId: string): string {
  return `${paymentRunPath(runId)}/remittance/${seg(anaesthetistId)}`
}

/** An anaesthetist's account, under Ledger. */
export function anaesthetistAccountPath(anaesthetistId: string): string {
  return `${FINANCES_BASE}/ledger/anaesthetists/${seg(anaesthetistId)}`
}

/** AA fees' settings. */
export function aaFeeSettingsPath(): string {
  return `${FINANCES_BASE}/aa-fees/settings`
}

/** Invoices, showing the prepayment invoices awaiting approval. */
export function awaitingApprovalPath(): string {
  return financePath('invoices', { view: 'approval' })
}

/** Billing, showing only the Lists with a problem. */
export function billingProblemsPath(): string {
  return financePath('billing', { problems: '1' })
}

/** Billing, opened on one List. */
export function billingListPath(listId: string): string {
  return financePath('billing', { list: listId })
}

/** Ledger, with one pair picked out. */
export function ledgerPairPath(pairId: string): string {
  return financePath('ledger', { pair: pairId })
}

/**
 * Where an old finance address lives now (D108), its query kept: `/admin/invoices` and
 * `/admin/invoices/:id`, `/admin/credit-notes/:id`, `/admin/billing` with `aa-fees`,
 * `aa-fees/settings`, `payment-runs/:runId` and its remittance, `/admin/ledger` and
 * `/admin/ledger/anaesthetists/:id`. A shape it does not know lands on its tab.
 */
export function financePathFromLegacy(pathname: string, search = ''): string {
  const parts = pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter((p) => p !== '')
  const [head, a, b, c, d] = parts
  const q = (path: string) => withQuery(path, search)
  const raw = (s: string | undefined) => decodeURIComponent(s ?? '')
  switch (head) {
    case 'invoices':
      return a === undefined ? q(financePath('invoices')) : q(invoicePath(raw(a)))
    case 'credit-notes':
      return a === undefined ? q(financePath('invoices')) : q(creditNotePath(raw(a)))
    case 'billing':
      if (a === 'aa-fees') return q(b === 'settings' ? aaFeeSettingsPath() : financePath('aa-fees'))
      if (a === 'payment-runs' && b !== undefined) {
        if (c === 'remittance' && d !== undefined) return q(remittancePath(raw(b), raw(d)))
        return q(paymentRunPath(raw(b)))
      }
      if (a === 'payment-runs') return q(financePath('payments'))
      return q(financePath('billing'))
    case 'ledger':
      if (a === 'anaesthetists' && b !== undefined) return q(anaesthetistAccountPath(raw(b)))
      return q(financePath('ledger'))
    default:
      return q(financePath('billing'))
  }
}
