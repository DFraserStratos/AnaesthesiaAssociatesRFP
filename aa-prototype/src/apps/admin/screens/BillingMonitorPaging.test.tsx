/**
 * The Billing monitor at full scale (catch-up Phase 43; US-13.3.1, US-15.0.4):
 * no pager at demo scale; at 85 anaesthetists the groups page at 20 with the
 * toolbar count counting everything the filters keep; Problems only applies before
 * paging; a filter returns to page 1; `?list=` lands on the page holding it;
 * a long group shows 25 Lists with "Show all N".
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeAll, describe, expect, it } from 'vitest'
import { billingMonitorView, freshAppState, useAppStore, type Actor, type AppState } from '../../../store'
import { buildFullScaleDataset } from '../../../domain/seed/fullScale'
import { BillingMonitorScreen } from './BillingMonitorScreen'

/** The anaesthetist group cards on the page (not their expand, pager or show-all controls). */
function groupCards(container: HTMLElement): number {
  return Array.from(container.querySelectorAll('[data-shot^="billing-group-"]')).filter((el) => /^billing-group-\d+$/.test(el.getAttribute('data-shot') ?? '')).length
}

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
let full: AppState

function Probe() {
  const loc = useLocation()
  return <div data-testid="probe">{loc.search}</div>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/admin/finances/billing" element={<><BillingMonitorScreen actor={OFFICE} /><Probe /></>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeAll(() => {
  full = buildFullScaleDataset(freshAppState(), { todayISO: '2026-11-24' }).state
}, 120_000)

describe('the Billing monitor pages at full scale', () => {
  it('shows no pager at demo scale', () => {
    useAppStore.setState(freshAppState())
    const { container } = renderAt('/admin/finances/billing')
    expect(container.querySelector('[data-shot="billing-monitor-pager"]')).toBeNull()
  })

  it('pages 85 anaesthetist groups at 20, the toolbar count counting every kept List', () => {
    useAppStore.setState(full)
    const view = billingMonitorView(full)
    const { container } = renderAt('/admin/finances/billing')
    const pager = container.querySelector('[data-shot="billing-monitor-pager"]')
    expect(pager?.getAttribute('data-pages')).toBe(String(Math.ceil(view.groups.length / 20)))
    expect(groupCards(container)).toBe(20)
    expect(screen.getAllByText(`Anaesthetists 1 to 20 of ${view.groups.length}`).length).toBeGreaterThan(0)
    // The toolbar count (the tiles' successor, Phase 58; D110) counts every kept List, never the page.
    expect(view.listsInView).toBe(view.totals.awaiting + view.totals.authorised)
    expect(container.querySelector('[data-shot="billing-monitor-count"]')?.textContent).toBe(`${view.listsInView} lists`)
  }, 60_000)

  it('Problems only applies before paging and a filter returns to page 1', () => {
    useAppStore.setState(full)
    const problems = billingMonitorView(full, { problemsOnly: true })
    expect(problems.totals.withProblems).toBeGreaterThan(0)
    const { container } = renderAt('/admin/finances/billing?page=3')
    fireEvent.click(screen.getByRole('button', { name: 'Problems only' }))
    expect(screen.getByTestId('probe').textContent).not.toContain('page=')
    expect(groupCards(container)).toBe(Math.min(20, problems.groups.length))
    expect(container.querySelector('[data-shot="billing-monitor-pager"]') !== null).toBe(problems.groups.length > 20)
  }, 60_000)

  it('?list= lands on the page and group page that hold the List', () => {
    useAppStore.setState(full)
    const view = billingMonitorView(full)
    const group = view.groups[45]!
    const listId = group.authorised[30]!.listId
    const { container } = renderAt(`/admin/finances/billing?list=${listId}`)
    expect(container.querySelector('[data-shot="billing-monitor-pager"]')?.getAttribute('data-page')).toBe('3')
    expect(container.querySelector(`[data-shot="billing-pipeline-${listId}"]`)).not.toBeNull()
  }, 60_000)

  it('a group with a year of Lists shows 25 and "Show all N"', () => {
    useAppStore.setState(full)
    const view = billingMonitorView(full)
    const group = view.groups.slice(0, 20).find((g) => g.authorised.length > 25)!
    const { container } = renderAt('/admin/finances/billing')
    // By the group's own hook: two groups can hold the same number of Lists.
    expect(container.querySelector(`[data-shot="billing-group-show-all-${group.anaesthetistId}"]`)?.textContent).toContain(`Show all ${group.authorised.length}`)
  }, 60_000)
})
