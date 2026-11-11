/**
 * Smoke test for the Web UI component catalogue (/demo/catalogue/web): the
 * page renders on the fresh seed, groups its rows by replacement library and
 * shows the real components live.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../store'
import { WebCatalogue } from './WebCatalogue'

afterEach(cleanup)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/demo/catalogue/web']}>
      <WebCatalogue />
    </MemoryRouter>,
  )
}

const row = (name: string) => document.querySelector(`[data-catalogue-row="${name}"]`) as HTMLElement | null

describe('the Web component catalogue', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('renders its rows under the replacement-library groups', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Anaesthetist Web App · UI components' })).toBeInTheDocument()
    for (const name of ['WebNav', 'Panel', 'SlidingSegmentedControl', 'StatusLegend (toggle mode)', 'Dialog (web Overlay)', 'Lists table (Th · Td · GroupRow)', 'WeekStrip', 'BookingTotalPanel · useTickingValue', 'TickBadge', 'HistoryTimeline']) {
      expect(row(name), name).not.toBeNull()
    }
    expect(within(document.getElementById('lib-tanstack') as HTMLElement).getByText('Accounts tables (tfoot totals)')).toBeInTheDocument()
    expect(within(document.getElementById('lib-custom') as HTMLElement).getByText('AvailabilityGrid')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-catalogue-row]').length).toBeGreaterThanOrEqual(40)
  })

  it('mounts the real components and keeps their state local', () => {
    renderPage()
    // The real WebNav: clicking a tab moves the underline, without navigating.
    const nav = row('WebNav') as HTMLElement
    fireEvent.click(within(nav).getByRole('button', { name: 'Accounts' }))
    expect(within(nav).getByRole('button', { name: 'Accounts' })).toHaveStyle({ fontWeight: '600' })
    // SubmitAction switches between its states.
    const submit = row('SubmitAction') as HTMLElement
    fireEvent.click(within(submit).getByRole('button', { name: 'Submitted' }))
    expect(within(submit).getByText('Submitted to office')).toBeInTheDocument()
    // The real web Dialog opens from its row.
    fireEvent.click(within(row('Dialog (web Overlay)') as HTMLElement).getByRole('button', { name: 'Open the Which List? dialog' }))
    expect(screen.getByText('Which List?')).toBeInTheDocument()
  })
})
