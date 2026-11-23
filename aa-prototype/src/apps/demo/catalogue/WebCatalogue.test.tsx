/**
 * Smoke test for the Web UI component catalogue (/demo/catalogue/web): the
 * page renders on the fresh seed, groups its rows by component family, names
 * a real shared file in every Shared component cell and shows the real
 * components live.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../store'
import { WebCatalogue } from './WebCatalogue'
import { missingSharedFiles } from './CatalogueKit'
import { SRC_FILES, sharedCells } from './sharedCells.testkit'

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

  it('renders its rows under the component families', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Anaesthetist Web App · UI components' })).toBeInTheDocument()
    for (const name of ['WebNav', 'Card (panel)', 'SlidingSegmentedControl', 'StatusLegend (toggle mode)', 'Dialog (web Overlay)', 'Lists table (Th · Td · GroupRow)', 'WeekStrip', 'BookingTotalPanel · useTickingValue', 'TickBadge', 'HistoryTimeline']) {
      expect(row(name), name).not.toBeNull()
    }
    expect(within(document.getElementById('fam-tables') as HTMLElement).getByText('Accounts tables (tfoot totals)')).toBeInTheDocument()
    expect(within(document.getElementById('fam-custom') as HTMLElement).getByText('AvailabilityGrid')).toBeInTheDocument()
    const rows = document.querySelectorAll('[data-catalogue-row]')
    expect(rows.length).toBeGreaterThanOrEqual(40)
    for (const id of ['actions', 'pills', 'fields', 'dates', 'tabs', 'overlays', 'feedback', 'tables', 'cards', 'custom']) {
      expect(document.getElementById(`fam-${id}`), id).not.toBeNull()
    }
    expect(document.querySelectorAll('[id^="lib-"]')).toHaveLength(0)
    expect(screen.getAllByText('Shared component').length).toBeGreaterThan(0)
    expect(screen.queryByText('Replace with')).toBeNull()
    // Every Shared component cell names a real file under src/ (or Stays custom, Demo only).
    expect(sharedCells(document)).toHaveLength(rows.length)
    expect(missingSharedFiles(sharedCells(document), SRC_FILES)).toEqual([])
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
