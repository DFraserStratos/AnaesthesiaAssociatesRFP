/**
 * The Finances section (build plan Phase 58; D107 to D111, US-13.3.3): one side-nav
 * entry with one amber badge in place of Invoices, the Billing monitor and the
 * Ledger; six routed tabs opening on Billing, each its own address (a reload
 * lands on it); a number on a tab only where something needs doing there (Payments:
 * the events awaiting approval, also in the badge); every
 * old address lands on its new one with a replace, its query and state kept; and
 * an unknown record id falls back to its tab.
 */

import { act, cleanup, render, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE } from '../../../../domain/seed'
import { SEED_EVENT_ID } from '../../../../domain/seed/procedureEvents'
import { freshAppState, useAppStore } from '../../../../store'
import { injectUnmatchedReceipt } from '../../../../store/ledgerDemo'
import { AdminApp } from '../../AdminApp'
import { financeLegacyRoutes, financesRoutes } from '../../../../test/adminRoutes'
import { financeBadge, financeTabCounts } from './financeCounts'
import {
  aaFeeSettingsPath,
  anaesthetistAccountPath,
  creditNotePath,
  financePath,
  invoicePath,
  paymentRunPath,
  remittancePath,
  type FinanceTab,
} from './financePaths'
import { FINANCE_TABS } from './financeTabs'

const DAY = '/admin/day/2026-11-24'

/** The Admin app (side nav and all) at `url`, one entry after the Day view so Back has somewhere to go. */
function mountAt(url: string | { pathname: string; search?: string; state?: unknown }) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        {financesRoutes()}
        {financeLegacyRoutes()}
      </Route>,
    ),
    { initialEntries: [DAY, url], initialIndex: 1 },
  )
  render(<RouterProvider router={router} />)
  return router
}

const here = (router: ReturnType<typeof mountAt>) => router.state.location.pathname + router.state.location.search
const nav = () => document.querySelector('nav[aria-label="Admin"]') as HTMLElement
const strip = () => document.querySelector('[data-shot="finances-tabs"]') as HTMLElement
const tabLink = (tab: FinanceTab) => strip().querySelector(`a[data-finances-tab="${tab}"]`) as HTMLElement

/** Seeded records to open: an invoice, a credit note, an approved payment run and one anaesthetist it paid. */
function seeded() {
  const billing = useAppStore.getState().billing
  const invoiceId = Object.keys(billing.invoices)[0]!
  const creditNoteId = Object.keys(billing.creditNotes)[0]!
  const run = Object.values(billing.payablesRuns).find((r) => r.status !== 'superseded' && r.approvedAtISO !== undefined && r.byAnaesthetist.length > 0)!
  return { invoiceId, creditNoteId, runId: run.id, paidAnaesthetistId: run.byAnaesthetist[0]!.anaesthetistId }
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('the side nav (D107, D109)', () => {
  it('has one Finances entry, after Notifications, in place of Invoices, Billing monitor and Ledger: 9 items', () => {
    mountAt(financePath('billing'))
    const labels = within(nav())
      .getAllByRole('button')
      .map((b) => b.firstElementChild?.textContent)
    expect(labels).toHaveLength(9)
    expect(labels.filter((l) => l === 'Finances')).toHaveLength(1)
    expect(labels.indexOf('Finances')).toBe(labels.indexOf('Notifications') + 1)
    for (const gone of ['Invoices', 'Billing monitor', 'Billing', 'Ledger']) expect(labels).not.toContain(gone)
    expect(within(nav()).getByRole('button', { name: /^Finances/ })).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('[data-shot="nav-badge-billing"]')).toBeNull()
    expect(document.querySelector('[data-shot="nav-badge-ledger"]')).toBeNull()
  })

  it('shows no badge while nothing needs doing', () => {
    // Without the seed's one event awaiting approval (US-13.3.3), nothing needs doing.
    const { [SEED_EVENT_ID]: _seeded, ...procedureEvents } = useAppStore.getState().schedule.procedureEvents
    useAppStore.setState({ schedule: { ...useAppStore.getState().schedule, procedureEvents } })
    expect(financeBadge(useAppStore.getState())).toBe(0)
    mountAt(financePath('billing'))
    expect(document.querySelector('[data-shot="nav-badge-finances"]')).toBeNull()
  })

  it('its amber badge reads financeBadge of the store, live', () => {
    mountAt(financePath('billing'))
    act(() => {
      injectUnmatchedReceipt(useAppStore, 'souter')
    })
    const expected = financeBadge(useAppStore.getState())
    expect(expected).toBeGreaterThan(0)
    const badge = document.querySelector('[data-shot="nav-badge-finances"]') as HTMLElement
    expect(badge.textContent).toBe(String(expected))
    expect(within(nav()).getByRole('button', { name: /^Finances/ })).toContainElement(badge)
  })

  it('the Finances entry opens Billing', () => {
    const router = mountAt(DAY)
    act(() => {
      within(nav()).getByRole('button', { name: /^Finances/ }).click()
    })
    expect(here(router)).toBe(financePath('billing'))
  })
})

describe('the six tabs (D107)', () => {
  it('/admin/finances lands on Billing with a replace, and the strip holds the six tabs in order', async () => {
    const router = mountAt('/admin/finances')
    expect(here(router)).toBe('/admin/finances/billing')
    expect(router.state.historyAction).toBe('REPLACE')
    const links = [...strip().querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('data-finances-tab'))).toEqual(['billing', 'invoices', 'payments', 'ledger', 'xero', 'aa-fees'])
    expect(links.map((a) => a.getAttribute('href'))).toEqual(FINANCE_TABS.map((t) => t.path))
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['billing', 'invoices', 'payments', 'ledger', 'xero', 'aa-fees'].map((t) => `/admin/finances/${t}`))
    await act(async () => {
      await router.navigate(-1)
    })
    expect(router.state.location.pathname).toBe(DAY)
  })

  it.each(FINANCE_TABS.map((t) => [t.tab, t.path] as const))('%s: its own address renders it active on a fresh mount', (tab, path) => {
    const router = mountAt(path)
    expect(here(router)).toBe(path)
    expect(document.querySelector(`[data-finances-page="${tab}"]`)).not.toBeNull()
    for (const t of FINANCE_TABS) {
      if (t.tab === tab) expect(tabLink(t.tab)).toHaveAttribute('aria-current', 'page')
      else expect(tabLink(t.tab)).not.toHaveAttribute('aria-current')
    }
    expect(within(nav()).getByRole('button', { name: /^Finances/ })).toHaveAttribute('aria-current', 'page')
  })

  it('AA fees settings is its own address under the AA fees tab', () => {
    const router = mountAt(aaFeeSettingsPath())
    expect(here(router)).toBe('/admin/finances/aa-fees/settings')
    expect(tabLink('aa-fees')).toHaveAttribute('aria-current', 'page')
  })
})

describe("the strip's numbers (D109)", () => {
  function expectNumbers() {
    const counts = financeTabCounts(useAppStore.getState())
    for (const t of FINANCE_TABS) {
      const count = (counts as Partial<Record<FinanceTab, number>>)[t.tab]
      const text = tabLink(t.tab).textContent
      if (t.tab === 'aa-fees') expect(text, t.tab).toBe(t.label)
      else expect(text, t.tab).toBe(count! > 0 ? `${t.label}${count}` : t.label)
    }
    return counts
  }

  it('shows a number only where its count is above zero, never on AA fees', () => {
    mountAt(financePath('billing'))
    const fresh = expectNumbers()
    expect(fresh.invoices).toBeGreaterThan(0)
    // Payments: the seed's one event awaiting approval (US-13.3.3).
    expect(fresh.payments).toBe(1)
    expect(tabLink('payments').textContent).toBe('Payments1')
    expect(fresh.ledger).toBe(0)
    expect(tabLink('ledger').textContent).toBe('Ledger')
    act(() => {
      injectUnmatchedReceipt(useAppStore, 'souter')
    })
    const after = expectNumbers()
    expect(after.ledger).toBeGreaterThan(0)
    expect(tabLink('ledger').textContent).toBe(`Ledger${after.ledger}`)
  })
})

describe('old links redirect to Finances and stay (D108)', () => {
  it.each([
    ['/admin/invoices', '/admin/finances/invoices'],
    ['/admin/invoices?view=approval', '/admin/finances/invoices?view=approval'],
    ['/admin/billing', '/admin/finances/billing'],
    [`/admin/billing?problems=1&anaesthetist=${ANAE.souter}`, `/admin/finances/billing?problems=1&anaesthetist=${ANAE.souter}`],
    ['/admin/billing/aa-fees', '/admin/finances/aa-fees'],
    ['/admin/billing/aa-fees/settings', '/admin/finances/aa-fees/settings'],
    ['/admin/ledger', '/admin/finances/ledger'],
    [`/admin/ledger/anaesthetists/${ANAE.sharma}`, `/admin/finances/ledger/anaesthetists/${ANAE.sharma}`],
  ])('%s lands on %s, replacing the old entry so Back does not loop', async (from, to) => {
    const router = mountAt(from)
    expect(here(router)).toBe(to)
    expect(router.state.historyAction).toBe('REPLACE')
    await act(async () => {
      await router.navigate(-1)
    })
    expect(router.state.location.pathname).toBe(DAY)
  })

  it('a record keeps its id: invoice, credit note, payment run and remittance', async () => {
    const { invoiceId, creditNoteId, runId, paidAnaesthetistId } = seeded()
    const cases: [string, string][] = [
      [`/admin/invoices/${invoiceId}`, invoicePath(invoiceId)],
      [`/admin/credit-notes/${creditNoteId}`, creditNotePath(creditNoteId)],
      [`/admin/billing/payment-runs/${runId}`, paymentRunPath(runId)],
      [`/admin/billing/payment-runs/${runId}/remittance/${paidAnaesthetistId}`, remittancePath(runId, paidAnaesthetistId)],
    ]
    for (const [from, to] of cases) {
      const router = mountAt(from)
      expect(here(router), from).toBe(to)
      expect(router.state.historyAction).toBe('REPLACE')
      await act(async () => {
        await router.navigate(-1)
      })
      expect(router.state.location.pathname).toBe(DAY)
      cleanup()
    }
  })

  it('the record pages render: the invoice under Invoices with its back link', () => {
    const { invoiceId } = seeded()
    mountAt(`/admin/invoices/${invoiceId}`)
    const page = document.querySelector('[data-testid="invoice-detail-screen"]') as HTMLElement
    expect(page).not.toBeNull()
    expect(within(page).getByRole('link', { name: /Invoices/ })).toHaveAttribute('href', '/admin/finances/invoices')
  })

  it('keeps the router state through the redirect', () => {
    const router = mountAt({ pathname: '/admin/billing', search: '?problems=1', state: { from: 'test' } })
    expect(here(router)).toBe('/admin/finances/billing?problems=1')
    expect(router.state.location.state).toEqual({ from: 'test' })
  })
})

describe('an unknown record id falls back to its tab', () => {
  it.each([
    ['/admin/finances/invoices/NOPE', '/admin/finances/invoices'],
    ['/admin/finances/invoices/credit-notes/NOPE', '/admin/finances/invoices'],
    ['/admin/finances/payments/NOPE', '/admin/finances/payments'],
    ['/admin/finances/ledger/anaesthetists/99999', '/admin/finances/ledger'],
    ['/admin/invoices/NOPE', '/admin/finances/invoices'],
    ['/admin/credit-notes/NOPE', '/admin/finances/invoices'],
    ['/admin/billing/payment-runs/NOPE', '/admin/finances/payments'],
    ['/admin/ledger/anaesthetists/99999', '/admin/finances/ledger'],
  ])('%s lands on %s', (from, to) => {
    const router = mountAt(from)
    expect(here(router)).toBe(to)
  })

  it('a remittance for an anaesthetist the run did not pay falls back to Payments', () => {
    const { runId } = seeded()
    const router = mountAt(remittancePath(runId, 'NOPE'))
    // RequireEntity's `..` is route-relative: the remittance route's parent is the Payments tab.
    expect(here(router)).toBe('/admin/finances/payments')
  })

  it('an anaesthetist account that exists stays put', () => {
    const router = mountAt(anaesthetistAccountPath(ANAE.sharma))
    expect(here(router)).toBe(`/admin/finances/ledger/anaesthetists/${ANAE.sharma}`)
  })
})
