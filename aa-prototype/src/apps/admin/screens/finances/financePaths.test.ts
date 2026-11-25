/**
 * The Finances section's URLs (build plan Phase 58; D107, D108, US-13.3.3):
 * every builder, and every old finance address landing on its new home with
 * its query kept.
 */

import { describe, expect, it } from 'vitest'
import {
  FINANCES_BASE,
  aaFeeSettingsPath,
  anaesthetistAccountPath,
  awaitingApprovalPath,
  billingListPath,
  billingProblemsPath,
  creditNotePath,
  financePath,
  financePathFromLegacy,
  invoicePath,
  isFinanceTab,
  ledgerPairPath,
  paymentRunPath,
  remittancePath,
} from './financePaths'

describe('the builders', () => {
  it('isFinanceTab knows the six tabs and nothing else', () => {
    for (const tab of ['billing', 'invoices', 'payments', 'ledger', 'xero', 'aa-fees']) expect(isFinanceTab(tab)).toBe(true)
    for (const other of ['', 'Billing', 'credit-notes', 'aa_fees', 'finances']) expect(isFinanceTab(other)).toBe(false)
  })

  it('financePath builds a tab, with any list state as its query', () => {
    expect(FINANCES_BASE).toBe('/admin/finances')
    expect(financePath('billing')).toBe('/admin/finances/billing')
    expect(financePath('aa-fees')).toBe('/admin/finances/aa-fees')
    expect(financePath('xero', {})).toBe('/admin/finances/xero')
    expect(financePath('billing', { problems: '1', list: 'L1' })).toBe('/admin/finances/billing?problems=1&list=L1')
    expect(financePath('ledger', { q: 'a b&c' })).toBe('/admin/finances/ledger?q=a+b%26c')
  })

  it('the record pages sit under their tab, ids encoded', () => {
    expect(invoicePath('INV0001')).toBe('/admin/finances/invoices/INV0001')
    expect(invoicePath('a/b c')).toBe('/admin/finances/invoices/a%2Fb%20c')
    expect(creditNotePath('CN0001')).toBe('/admin/finances/invoices/credit-notes/CN0001')
    expect(paymentRunPath('RUN-1')).toBe('/admin/finances/payments/RUN-1')
    expect(remittancePath('RUN-1', '34821')).toBe('/admin/finances/payments/RUN-1/remittance/34821')
    expect(anaesthetistAccountPath('34821')).toBe('/admin/finances/ledger/anaesthetists/34821')
    expect(aaFeeSettingsPath()).toBe('/admin/finances/aa-fees/settings')
  })

  it('the fixed query shapes', () => {
    expect(awaitingApprovalPath()).toBe('/admin/finances/invoices?view=approval')
    expect(billingProblemsPath()).toBe('/admin/finances/billing?problems=1')
    expect(billingListPath('L-1')).toBe('/admin/finances/billing?list=L-1')
    expect(ledgerPairPath('P1')).toBe('/admin/finances/ledger?pair=P1')
  })
})

describe('financePathFromLegacy (D108)', () => {
  const cases: [string, string][] = [
    ['/admin/invoices', '/admin/finances/invoices'],
    ['/admin/invoices/INV0001', '/admin/finances/invoices/INV0001'],
    ['/admin/credit-notes/CN0001', '/admin/finances/invoices/credit-notes/CN0001'],
    ['/admin/billing', '/admin/finances/billing'],
    ['/admin/billing/aa-fees', '/admin/finances/aa-fees'],
    ['/admin/billing/aa-fees/settings', '/admin/finances/aa-fees/settings'],
    ['/admin/billing/payment-runs/RUN-1', '/admin/finances/payments/RUN-1'],
    ['/admin/billing/payment-runs/RUN-1/remittance/34821', '/admin/finances/payments/RUN-1/remittance/34821'],
    ['/admin/ledger', '/admin/finances/ledger'],
    ['/admin/ledger/anaesthetists/34821', '/admin/finances/ledger/anaesthetists/34821'],
  ]

  it.each(cases)('%s lands on %s', (from, to) => {
    expect(financePathFromLegacy(from)).toBe(to)
    expect(financePathFromLegacy(`${from}/`)).toBe(to)
  })

  it.each(cases)('%s keeps its query', (from, to) => {
    expect(financePathFromLegacy(from, '?x=1')).toBe(`${to}?x=1`)
    expect(financePathFromLegacy(from, 'x=1')).toBe(`${to}?x=1`)
  })

  it('keeps the fixed query shapes', () => {
    expect(financePathFromLegacy('/admin/invoices', '?view=approval')).toBe(awaitingApprovalPath())
    expect(financePathFromLegacy('/admin/billing', '?problems=1&list=L1')).toBe('/admin/finances/billing?problems=1&list=L1')
    expect(financePathFromLegacy('/admin/ledger', '?pair=P1')).toBe(ledgerPairPath('P1'))
    expect(financePathFromLegacy('/admin/invoices/INV0001', '')).toBe(invoicePath('INV0001'))
  })

  it('decodes an encoded id once, then encodes it once', () => {
    expect(financePathFromLegacy('/admin/invoices/a%2Fb')).toBe(invoicePath('a/b'))
    expect(financePathFromLegacy('/admin/ledger/anaesthetists/a%20b')).toBe(anaesthetistAccountPath('a b'))
  })

  it('a shape it does not know lands on its tab', () => {
    expect(financePathFromLegacy('/admin/credit-notes')).toBe(financePath('invoices'))
    expect(financePathFromLegacy('/admin/billing/payment-runs')).toBe(financePath('payments'))
    expect(financePathFromLegacy('/admin/billing/somewhere/else')).toBe(financePath('billing'))
    expect(financePathFromLegacy('/admin/ledger/anaesthetists')).toBe(financePath('ledger'))
    expect(financePathFromLegacy('/admin/ledger/other', '?pair=P1')).toBe(ledgerPairPath('P1'))
    expect(financePathFromLegacy('/admin/nowhere')).toBe(financePath('billing'))
  })
})
