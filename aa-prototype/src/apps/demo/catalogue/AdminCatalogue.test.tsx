/**
 * Smoke test for the Admin UI component catalogue (demo only): the page mounts
 * every live example against the fresh seed without throwing, and the rows and
 * groups are there.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../store'
import { AdminCatalogue } from './AdminCatalogue'

afterEach(cleanup)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/demo/catalogue/admin']}>
      <AdminCatalogue />
    </MemoryRouter>,
  )
}

describe('AdminCatalogue', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('renders the rows, grouped by replacement library', () => {
    const { container } = renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Admin Web App · UI components' })).toBeInTheDocument()
    for (const name of ['Button', 'SlotDrawer', 'DayGrid', 'CodePickerSheet', 'SuccessOverlay', 'InvoiceDocument', 'MiniCalendar (RightRail)', 'AuditViewer', 'SidePanel', 'PopoverPanel', 'OverlayHeader', 'SheetActions', 'ConfirmSheet', 'RowField', 'RadioCard', 'DecisionCards (Matching)', 'OptionRow', 'DiffTable (Matching)']) {
      expect(container.querySelector(`[data-catalogue-row="${name}"]`)).not.toBeNull()
    }
    const rows = container.querySelectorAll('[data-catalogue-row]')
    expect(rows.length).toBeGreaterThanOrEqual(35)
    for (const id of ['shadcn', 'sonner', 'tanstack', 'forms', 'daypicker', 'motion', 'custom']) {
      expect(container.querySelector(`#lib-${id}`)).not.toBeNull()
    }
    // About 90 live rows render here (U4 added 15): give the whole page room under a loaded full run.
  }, 20_000)

  it('has the Master data pattern rows (catch-up Phase 42), with no legacy masters Table row', { timeout: 20000 }, () => {
    const { container } = renderPage()
    for (const name of ['MasterTable / EditCell', 'MasterHeader', 'ShowRetiredToggle / RetiredPill', 'RetireSection', 'LoadResultBanner', 'LoadResultPanel', 'PublicHolidaySheet', 'RvgTimeRuleSheet']) {
      expect(container.querySelector(`[data-catalogue-row="${name}"]`), name).not.toBeNull()
    }
    expect(container.querySelector('[data-catalogue-row="Table / Header / TextAction / EditCell"]')).toBeNull()
  })

  it('stages the sample hospitals sheet from the LoadResultPanel row, and the banner row shows it waiting', { timeout: 20000 }, () => {
    const { container } = renderPage()
    const panelRow = container.querySelector('[data-catalogue-row="LoadResultPanel"]') as HTMLElement
    const bannerRow = container.querySelector('[data-catalogue-row="LoadResultBanner"]') as HTMLElement
    expect(bannerRow.querySelector('[data-shot="load-banner"]')).toBeNull()
    fireEvent.click(within(panelRow).getByRole('button', { name: 'Check the sample hospitals.csv' }))
    expect(panelRow.querySelector('[data-shot="master-load-result"]')?.textContent).toContain('hospitals.csv: 6 rows · 2 valid · 4 rejected')
    expect(within(panelRow).getByRole('button', { name: 'Load 2 valid rows' })).toBeInTheDocument()
    expect(bannerRow.querySelector('[data-shot="load-banner"]')).not.toBeNull()
  })

  it('opens the shared Overlay from its row and keeps the text local', { timeout: 20000 }, () => {
    const { container } = renderPage()
    const row = container.querySelector('[data-catalogue-row="Dialog (useSurface().Overlay)"]') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Open dialog' }))
    expect(screen.getByText('Add a note')).toBeInTheDocument()
  })
})
