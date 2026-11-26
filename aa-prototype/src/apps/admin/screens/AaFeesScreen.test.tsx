/**
 * Finances' AA fees tab (build plan Phase 67; US-10.3.1 to US-10.3.3), rendered through the Admin
 * routes: the fee invoices open on Unpaid (oldest month first) with search, the state filter, the
 * month select and the pager in the URL; the run card and its preview follow the month select; the
 * fee settings card summarises at rest and opens its form behind Change (or at the settings
 * address, in view); Earlier runs sets the month.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE } from '../../../domain/seed'
import { freshAppState, resetDomainState, runMonthlyFeeInvoices, useAppStore, type Actor } from '../../../store'
import { financesRoutes } from '../../../test/adminRoutes'
import { AdminApp } from '../AdminApp'

const DAY = '/admin/day/2026-11-24'
const TAB = '/admin/finances/aa-fees'
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        <Route path="day/:dateISO" element={<div data-testid="day" />} />
        {financesRoutes()}
      </Route>,
    ),
    { initialEntries: [DAY, url], initialIndex: 1 },
  )
  render(<RouterProvider router={router} />)
  return router
}

const here = (router: ReturnType<typeof mountAt>) => router.state.location.pathname + router.state.location.search
const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement
const rows = () => screen.queryAllByTestId(/^aa-fee-row-/)
const rowNumbers = () => rows().map((r) => r.getAttribute('data-testid')!.replace('aa-fee-row-', ''))
const runCard = () => shot('aa-fee-run-card')
const settingsCard = () => screen.getByTestId('admin-aa-fee-settings')
const monthSelect = () => shot('aa-fee-month') as HTMLSelectElement
const activeCount = () => Object.values(useAppStore.getState().masters.anaesthetists).filter((a) => a.lastDayISO === null).length

/** Raise fee invoices for each month, so the book holds more than a page. */
function runMonths(months: string[]) {
  for (const monthISO of months) {
    const res = runMonthlyFeeInvoices(useAppStore, OFFICE, { monthISO })
    if (!res.ok) throw new Error(res.message)
  }
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('the fee invoices', () => {
  it('opens on Unpaid with the seeded history, and All shows the paid invoice after the unpaid', () => {
    const router = mountAt(TAB)
    expect(shot('aa-fee-filter')).toHaveAttribute('data-aa-fee-show', 'unpaid')
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H02'])
    expect(screen.getByTestId('aa-fee-row-AA-FEE-2026-H02')).toHaveTextContent('Unpaid')
    expect(shot('aa-fee-totals')).toHaveTextContent('1 unpaid')

    fireEvent.click(within(shot('aa-fee-filter')).getByRole('button', { name: 'All' }))
    expect(here(router)).toBe(`${TAB}?show=all`)
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H02', 'AA-FEE-2026-H01'])
    expect(screen.getByTestId('aa-fee-row-AA-FEE-2026-H01')).toHaveTextContent('Paid 9 Oct 2026')

    fireEvent.click(within(shot('aa-fee-filter')).getByRole('button', { name: 'Paid' }))
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H01'])
    fireEvent.click(within(shot('aa-fee-filter')).getByRole('button', { name: 'Unpaid' }))
    expect(here(router)).toBe(TAB)
  })

  it('unfolds a row to its lines and counted BCTIs', () => {
    mountAt(`${TAB}?show=all`)
    expect(screen.queryByTestId('aa-fee-detail-AA-FEE-2026-H01')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show AA-FEE-2026-H01 details' }))
    const detail = screen.getByTestId('aa-fee-detail-AA-FEE-2026-H01')
    expect(detail).toHaveTextContent('Counted BCTIs (2)')
    expect(detail).toHaveTextContent('BCTIs paid in September 2026: 2 x $5.00')
    fireEvent.click(screen.getByRole('button', { name: 'Hide AA-FEE-2026-H01 details' }))
    expect(screen.queryByTestId('aa-fee-detail-AA-FEE-2026-H01')).toBeNull()
  })

  it('searches by invoice number and by anaesthetist surname, in the URL', () => {
    runMonths(['2026-11'])
    const router = mountAt(`${TAB}?show=all`)
    const search = within(shot('aa-fee-search')).getByRole('searchbox', { name: 'Search fee invoices' })

    fireEvent.change(search, { target: { value: 'h01' } })
    expect(here(router)).toBe(`${TAB}?show=all&q=h01`)
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H01'])

    fireEvent.change(search, { target: { value: 'Souter' } })
    expect(rows().length).toBe(3)
    for (const row of rows()) expect(row).toHaveTextContent('Dr Souter')

    fireEvent.change(search, { target: { value: 'rutherford' } })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Dr Rutherford')
    expect(rows()[0]).toHaveTextContent('November 2026')

    fireEvent.change(search, { target: { value: 'nobody-matches' } })
    expect(rows()).toHaveLength(0)
    expect(screen.getByText('No fee invoice matches.')).toBeInTheDocument()
  })

  it('pages 50 at a time, and any change but paging goes back to page 1', () => {
    runMonths(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'])
    const unpaid = Object.values(useAppStore.getState().billing.aaFeeInvoices).length - 1 // H01 is paid
    expect(unpaid).toBeGreaterThan(50)
    const router = mountAt(TAB)
    const pager = shot('aa-fee-pager')
    expect(pager).toHaveAttribute('data-page', '1')
    expect(pager).toHaveAttribute('data-pages', String(Math.ceil(unpaid / 50)))
    expect(rows()).toHaveLength(50)
    // Unpaid opens on the month owed longest.
    expect(rows()[0]).toHaveTextContent('January 2026')

    fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))
    expect(here(router)).toBe(`${TAB}?page=2`)
    expect(shot('aa-fee-pager')).toHaveAttribute('data-page', '2')

    fireEvent.click(within(shot('aa-fee-filter')).getByRole('button', { name: 'All' }))
    expect(here(router)).toBe(`${TAB}?show=all`)
    expect(shot('aa-fee-pager')).toHaveAttribute('data-page', '1')
  })

  it('shows no pager while the book fits on one page', () => {
    mountAt(`${TAB}?show=all`)
    expect(rows()).toHaveLength(2)
    expect(shot('aa-fee-pager')).toBeNull()
  })
})

describe('the run card and its preview', () => {
  it('previews every active anaesthetist for the month, and a run adds their invoices', () => {
    mountAt(TAB)
    const active = activeCount()
    expect(runCard()).toHaveAttribute('data-month', '2026-11')
    expect(screen.queryByTestId('aa-fee-preview')).toBeNull()

    fireEvent.click(shot('aa-fee-preview-open'))
    const preview = screen.getByTestId('aa-fee-preview')
    expect(within(preview).getAllByTestId(/^aa-fee-preview-/)).toHaveLength(active)
    // The preview takes the table's place.
    expect(screen.queryByTestId('aa-fee-invoices')).toBeNull()

    // The preview's own Run, in its foot row (the run card's is the other).
    const runs = screen.getAllByRole('button', { name: 'Run monthly fee invoices' })
    expect(runs).toHaveLength(2)
    fireEvent.click(runs.find((b) => !runCard().contains(b))!)
    expect(shot('aa-fee-run-result')).toHaveTextContent(`Raised ${active} fee invoices for November 2026`)
    // Back on the list, on Unpaid: the seeded H02 and the month's new invoices.
    expect(screen.queryByTestId('aa-fee-preview')).toBeNull()
    expect(rows()).toHaveLength(1 + active)
    const run = within(runCard()).getByRole('button', { name: 'Run monthly fee invoices' })
    expect(run).toBeDisabled()
    expect(run).toHaveAccessibleDescription('Every active anaesthetist already has a fee invoice for November 2026.')
  })

  it('goes back from the preview to the fee invoices', () => {
    mountAt(TAB)
    fireEvent.click(shot('aa-fee-preview-open'))
    expect(shot('aa-fee-preview-open')).toBeDisabled()
    fireEvent.click(shot('aa-fee-preview-back'))
    expect(screen.queryByTestId('aa-fee-preview')).toBeNull()
    expect(screen.getByTestId('aa-fee-invoices')).toBeInTheDocument()
  })

  it('lists January 2026 to the demo month in the month select, and the month drives the list and the run card', () => {
    const router = mountAt(TAB)
    const values = [...monthSelect().options].map((o) => o.value)
    expect(values).toEqual(['', '2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'])
    expect(monthSelect()).toHaveValue('')

    fireEvent.change(monthSelect(), { target: { value: '2026-10' } })
    expect(here(router)).toBe(`${TAB}?month=2026-10`)
    expect(runCard()).toHaveAttribute('data-month', '2026-10')
    expect(runCard()).toHaveTextContent('October 2026 run')
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H02'])
    // Dr Souter already has October's fee invoice.
    fireEvent.click(shot('aa-fee-preview-open'))
    expect(screen.getByTestId(`aa-fee-preview-${ANAE.souter}`)).toHaveTextContent('AA-FEE-2026-H02')

    fireEvent.change(monthSelect(), { target: { value: '' } })
    expect(here(router)).toBe(TAB)
    expect(runCard()).toHaveAttribute('data-month', '2026-11')
  })

  it('refuses to run a month that has not started, or one before the first fee month, with the reason', () => {
    mountAt(`${TAB}?month=2026-12`)
    expect(runCard()).toHaveAttribute('data-month', '2026-12')
    const run = () => within(runCard()).getByRole('button', { name: 'Run monthly fee invoices' })
    expect(run()).toBeDisabled()
    expect(run()).toHaveAccessibleDescription('December 2026 has not started yet.')

    fireEvent.change(monthSelect(), { target: { value: '2026-11' } })
    expect(run()).toBeEnabled()
  })

  it('refuses a month with nothing pending', () => {
    runMonths(['2026-08'])
    mountAt(`${TAB}?month=2026-08`)
    const run = within(runCard()).getByRole('button', { name: 'Run monthly fee invoices' })
    expect(run).toBeDisabled()
    expect(run).toHaveAccessibleDescription('Every active anaesthetist already has a fee invoice for August 2026.')
    expect(runCard()).toHaveTextContent('August 2026 run')
  })
})

describe('Earlier runs', () => {
  it('lists the months holding fee invoices, and a row sets the month filter', () => {
    const router = mountAt(TAB)
    const card = shot('aa-fee-earlier-runs')
    expect([...card.querySelectorAll('li[data-month]')].map((li) => li.getAttribute('data-month'))).toEqual(['2026-10', '2026-09'])
    fireEvent.click(within(card).getByRole('button', { name: "Show September 2026's fee invoices" }))
    expect(here(router)).toBe(`${TAB}?month=2026-09`)
    expect(runCard()).toHaveAttribute('data-month', '2026-09')
    expect(monthSelect()).toHaveValue('2026-09')
    expect(within(card).getByRole('button', { name: "Show September 2026's fee invoices" })).toHaveAttribute('data-selected')
  })

  it('shows five months, then all of them, then fewer', () => {
    runMonths(['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'])
    mountAt(TAB)
    const card = shot('aa-fee-earlier-runs')
    const listed = () => card.querySelectorAll('li[data-month]').length
    expect(listed()).toBe(5)
    fireEvent.click(shot('aa-fee-earlier-runs-all'))
    expect(listed()).toBe(8)
    fireEvent.click(shot('aa-fee-earlier-runs-fewer'))
    expect(listed()).toBe(5)
  })
})

describe('the fee settings card', () => {
  const change = () => fireEvent.click(within(settingsCard()).getByRole('button', { name: 'Change fee settings' }))

  it('summarises the schedule at rest and opens the form behind Change', () => {
    mountAt(TAB)
    expect(settingsCard()).toHaveTextContent('Per BCTI paid that month')
    expect(settingsCard()).toHaveTextContent('$5.00')
    expect(screen.queryByTestId('aa-fee-example')).toBeNull()
    change()
    expect(settingsCard()).toHaveAttribute('data-editing')
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('$500.00 + $5.00 x 40 = $700.00')
  })

  it('adds and removes an item, refuses an invalid amount, and saves audited', () => {
    mountAt(TAB)
    change()
    fireEvent.click(screen.getByRole('button', { name: /Add item/ }))
    expect(within(settingsCard()).getByRole('alert')).toHaveTextContent('Fixed item 3 needs a description.')
    fireEvent.change(screen.getByLabelText('Fixed item 3 description'), { target: { value: 'Software licence' } })
    fireEvent.change(screen.getByLabelText('Fixed item 3 amount'), { target: { value: '-4' } })
    expect(within(settingsCard()).getByRole('alert')).toHaveTextContent('zero or more')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Fixed item 3 amount'), { target: { value: '25' } })
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('$525.00 + $5.00 x 40 = $725.00')

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    // Save closes the form on the summary, with its result.
    expect(screen.queryByTestId('aa-fee-example')).toBeNull()
    expect(shot('aa-fee-settings-result')).toHaveTextContent('Fee settings saved')
    expect(settingsCard()).toHaveTextContent('Software licence')
    expect(useAppStore.getState().appSettings.aaFee.fixedItems).toHaveLength(3)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('aaFee.settingsChanged')

    change()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Software licence' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(useAppStore.getState().appSettings.aaFee.fixedItems).toHaveLength(2)
    expect(settingsCard()).not.toHaveTextContent('Software licence')
  })

  it('removing an item hands focus to the next remove button, then the last one left, then Add item', () => {
    mountAt(TAB)
    change()
    const removes = () => screen.queryAllByRole('button', { name: /^Remove / })
    expect(removes()).toHaveLength(2)
    const [first, second] = removes()
    first!.focus()
    fireEvent.click(first!)
    expect(removes()).toEqual([second])
    expect(second).toHaveFocus()
    fireEvent.click(second!)
    expect(removes()).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Add item/ })).toHaveFocus()
  })

  it('re-syncs the form when the stored settings change, for example after a Reset', () => {
    mountAt(TAB)
    const perBcti = () => screen.getByLabelText('Charge per BCTI paid that month (ex GST)')
    change()
    fireEvent.change(perBcti(), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(settingsCard()).toHaveTextContent('$9.00')
    change()
    expect(perBcti()).toHaveValue('9.00')
    // A Reset while the form is open brings it back to the stored settings.
    act(() => resetDomainState(useAppStore))
    expect(perBcti()).toHaveValue('5.00')
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('= $700.00')
  })

  it('Cancel puts the draft away and hands focus back to Change', () => {
    mountAt(TAB)
    change()
    fireEvent.change(screen.getByLabelText('Charge per BCTI paid that month (ex GST)'), { target: { value: '9' } })
    fireEvent.click(shot('aa-fee-settings-cancel'))
    expect(screen.queryByTestId('aa-fee-example')).toBeNull()
    expect(useAppStore.getState().appSettings.aaFee.perBctiCharge).toBe(5)
    expect(within(settingsCard()).getByRole('button', { name: 'Change fee settings' })).toHaveFocus()
    change()
    expect(screen.getByLabelText('Charge per BCTI paid that month (ex GST)')).toHaveValue('5.00')
  })
})

describe('the settings address', () => {
  const original = Element.prototype.scrollIntoView
  let scrolled: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled as unknown as typeof Element.prototype.scrollIntoView
  })
  afterEach(() => {
    Element.prototype.scrollIntoView = original
  })

  it('opens the settings form and brings the card into view; Cancel leaves for the tab, keeping the query', () => {
    const router = mountAt(`${TAB}/settings?show=all`)
    expect(settingsCard()).toHaveAttribute('data-editing')
    expect(screen.getByTestId('aa-fee-example')).toHaveTextContent('$500.00 + $5.00 x 40 = $700.00')
    expect(scrolled).toHaveBeenCalled()
    expect(scrolled.mock.contexts).toContain(settingsCard())
    // The list is there beside it, on the query's filter.
    expect(rowNumbers()).toEqual(['AA-FEE-2026-H02', 'AA-FEE-2026-H01'])

    fireEvent.click(shot('aa-fee-settings-cancel'))
    expect(here(router)).toBe(`${TAB}?show=all`)
    expect(screen.queryByTestId('aa-fee-example')).toBeNull()
    expect(settingsCard()).not.toHaveAttribute('data-editing')
  })

  it('Save leaves for the tab once the settings are saved', () => {
    const router = mountAt(`${TAB}/settings`)
    fireEvent.change(screen.getByLabelText('Charge per BCTI paid that month (ex GST)'), { target: { value: '6' } })
    fireEvent.click(shot('aa-fee-settings-save'))
    expect(useAppStore.getState().appSettings.aaFee.perBctiCharge).toBe(6)
    expect(here(router)).toBe(TAB)
    expect(screen.queryByTestId('aa-fee-example')).toBeNull()
    expect(settingsCard()).toHaveTextContent('$6.00')
  })
})
