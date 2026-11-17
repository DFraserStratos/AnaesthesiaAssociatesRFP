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
    for (const name of ['Button', 'SlotDrawer', 'DayGrid', 'CodePickerSheet', 'SuccessOverlay', 'InvoiceDocument', 'MiniCalendar (RightRail)', 'AuditViewer', 'SidePanel', 'PopoverPanel', 'OverlayHeader', 'SheetActions', 'ConfirmSheet']) {
      expect(container.querySelector(`[data-catalogue-row="${name}"]`)).not.toBeNull()
    }
    const rows = container.querySelectorAll('[data-catalogue-row]')
    expect(rows.length).toBeGreaterThanOrEqual(35)
    for (const id of ['shadcn', 'sonner', 'tanstack', 'forms', 'daypicker', 'motion', 'custom']) {
      expect(container.querySelector(`#lib-${id}`)).not.toBeNull()
    }
    // About 90 live rows render here (U4 added 15): give the whole page room under a loaded full run.
  }, 20_000)

  it('opens the shared Overlay from its row and keeps the text local', () => {
    const { container } = renderPage()
    const row = container.querySelector('[data-catalogue-row="Dialog (useSurface().Overlay)"]') as HTMLElement
    fireEvent.click(within(row).getByRole('button', { name: 'Open dialog' }))
    expect(screen.getByText('Add a note')).toBeInTheDocument()
  })
})
