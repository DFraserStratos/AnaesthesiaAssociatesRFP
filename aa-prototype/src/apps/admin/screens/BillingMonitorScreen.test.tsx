/**
 * The processing monitor restyle (catch-up Phase 37; US-13.3.1): the filter
 * bar writes the URL and a URL renders the same view, "Open in Review" only
 * navigates (with the monitor's search), no Authorise anywhere, expand and
 * collapse, the expand-all threshold, and `?list=`.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authoriseList, freshAppState, submittedLists, useAppStore, type Actor } from '../../../store'
import { ANAE } from '../../../domain/seed'
import { projectedListId } from '../../../domain/slots'
import { BillingMonitorScreen } from './BillingMonitorScreen'
import { ReviewScreen } from './ReviewScreen'
import { billingMonitorReturn } from '../routes'
import { SurfaceProvider } from '../../../shared'

const threshold = vi.hoisted(() => ({ value: 12 }))
vi.mock('../../../store', async (importOriginal) => {
  const m = await importOriginal<typeof import('../../../store')>()
  return {
    ...m,
    get MONITOR_EXPAND_ALL_UP_TO() {
      return threshold.value
    },
  }
})

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const AM20 = projectedListId(ANAE.souter, '2026-11-23', 'AM')
const PM20 = projectedListId(ANAE.souter, '2026-11-23', 'PM')

function Probe() {
  const loc = useLocation()
  return <div data-testid="probe">{`${loc.pathname}${loc.search}|${JSON.stringify(loc.state)}`}</div>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/admin/billing"
          element={
            <>
              <BillingMonitorScreen actor={OFFICE} />
              <Probe />
            </>
          }
        />
        <Route path="/admin/review/:listId" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

const probe = () => screen.getByTestId('probe').textContent ?? ''

describe('Billing monitor restyle (US-13.3.1)', () => {
  beforeEach(() => {
    threshold.value = 12
    useAppStore.setState(freshAppState())
  })

  it('groups awaiting Lists by anaesthetist with Open in Review, and has no Authorise button', () => {
    renderAt('/admin/billing')
    const submitted = submittedLists(useAppStore.getState())
    for (const l of submitted) expect(document.querySelector(`[data-shot="billing-awaiting-${l.id}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-shot="billing-group-${ANAE.souter}"]`)).not.toBeNull()
    expect(screen.queryByRole('button', { name: /^authorise/i })).toBeNull()
    expect(screen.getByText(/grouped by anaesthetist/)).toBeInTheDocument()
    expect(screen.queryByText(/RFP leaves open/)).toBeNull()
    expect(document.querySelector('[data-shot="billing-tile-awaiting"]')).toHaveTextContent(String(submitted.length))
  })

  it('Open in Review navigates with the monitor search as router state; the return state reads it back', () => {
    renderAt(`/admin/billing?anaesthetist=${ANAE.souter}`)
    fireEvent.click(document.querySelector(`[data-shot="billing-open-in-review-${AM20}"]`)!)
    expect(probe()).toBe(`/admin/review/${AM20}|${JSON.stringify({ from: 'billing', search: `?anaesthetist=${ANAE.souter}` })}`)
    expect(billingMonitorReturn({ from: 'billing', search: '?problems=1' })).toEqual({ from: 'billing', search: '?problems=1' })
    expect(billingMonitorReturn(null)).toBeNull()
    expect(billingMonitorReturn({ from: 'queue' })).toBeNull()
  })

  it("Review opened from the monitor shows Back to Billing monitor; otherwise its breadcrumb", () => {
    const onBack = vi.fn()
    const { unmount } = render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <ReviewScreen listId={AM20} actor={OFFICE} backToBillingMonitor onBack={onBack} onOpen={() => {}} onViewInvoices={() => {}} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Back to Billing monitor' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    unmount()
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <ReviewScreen listId={AM20} actor={OFFICE} onBack={onBack} onOpen={() => {}} onViewInvoices={() => {}} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Back to Billing monitor' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Review queue' })).toBeInTheDocument()
  })

  it('the filter bar writes the URL, and a URL renders the same view', () => {
    renderAt('/admin/billing')
    const filters = document.querySelector('[data-shot="billing-monitor-filters"]') as HTMLElement
    fireEvent.change(within(filters).getByLabelText('Anaesthetist'), { target: { value: ANAE.souter } })
    expect(probe()).toContain(`?anaesthetist=${ANAE.souter}`)
    expect(document.querySelectorAll('[data-shot^="billing-group-"]:not([data-shot^="billing-group-expand"])')).toHaveLength(1)
    fireEvent.click(within(filters).getByRole('button', { name: 'Problems only' }))
    expect(probe()).toContain('problems=1')
    expect(screen.getByText('No problems. Every authorised list has billed, been sent and reached Xero.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!)
    expect(probe().split('|')[0]).toBe('/admin/billing')
  })

  it('sort headers are buttons with aria-sort and write the sort to the URL', () => {
    act(() => {
      authoriseList(useAppStore, OFFICE, AM20)
    })
    renderAt('/admin/billing')
    const group = document.querySelector(`[data-shot="billing-group-${ANAE.souter}"]`) as HTMLElement
    const dateHead = within(group).getByRole('button', { name: /Date · session/ })
    expect(dateHead.closest('th')).toHaveAttribute('aria-sort', 'none')
    fireEvent.click(dateHead)
    expect(probe()).toContain('sort=date-asc')
    expect(within(document.querySelector(`[data-shot="billing-group-${ANAE.souter}"]`) as HTMLElement).getByRole('button', { name: /Date · session/ }).closest('th')).toHaveAttribute('aria-sort', 'ascending')
  })

  it('an authorised List opens expanded at seed scale and collapses on its chevron', () => {
    act(() => {
      authoriseList(useAppStore, OFFICE, AM20)
    })
    renderAt('/admin/billing')
    const block = document.querySelector(`[data-shot="billing-pipeline-${AM20}"]`) as HTMLElement
    expect(within(block).getByRole('list', { name: 'Billing pipeline' })).toBeInTheDocument()
    fireEvent.click(within(block).getByRole('button', { name: /details$/, expanded: true }))
    expect(within(document.querySelector(`[data-shot="billing-pipeline-${AM20}"]`) as HTMLElement).queryByRole('list', { name: 'Billing pipeline' })).toBeNull()
    expect(probe()).toContain(`shut=${AM20}`)
  })

  it('above the threshold non-problem Lists start collapsed, and ?list= opens its List', () => {
    threshold.value = 0
    act(() => {
      authoriseList(useAppStore, OFFICE, AM20)
      authoriseList(useAppStore, OFFICE, PM20)
    })
    renderAt(`/admin/billing?list=${PM20}`)
    const am = document.querySelector(`[data-shot="billing-pipeline-${AM20}"]`) as HTMLElement
    const pm = document.querySelector(`[data-shot="billing-pipeline-${PM20}"]`) as HTMLElement
    expect(within(am).queryByRole('list', { name: 'Billing pipeline' })).toBeNull()
    expect(within(pm).getByRole('list', { name: 'Billing pipeline' })).toBeInTheDocument()
  })
})
