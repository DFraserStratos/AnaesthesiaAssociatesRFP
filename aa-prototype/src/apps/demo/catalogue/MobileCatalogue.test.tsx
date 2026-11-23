/**
 * Smoke test for the Mobile UI catalogue page: it renders inside the router and
 * a fresh store, lists the components as rows, and a sheet opens inside its
 * phone stage.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, useAppStore } from '../../../store'
import { MobileCatalogue } from './MobileCatalogue'
import { missingSharedFiles } from './CatalogueKit'
import { SRC_FILES, sharedCells } from './sharedCells.testkit'

afterEach(cleanup)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/demo/catalogue/mobile']}>
      <MobileCatalogue />
    </MemoryRouter>,
  )
}

describe('the Mobile UI catalogue', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('renders one row per component, grouped by component family', { timeout: 20000 }, () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /Anaesthetist Mobile App/ })).toBeInTheDocument()
    for (const name of ['BottomSheet', 'ListOptionsSheet', 'SlideStack', 'BottomTabBar', 'MonthGrid (LookbackDateSheet)', 'SuccessOverlay', 'UpdatePrompt', 'BookingDetailBody', 'HalfBlock', 'useTickingValue', 'InlineConfirm', 'DoneStep']) {
      expect(document.querySelector(`[data-catalogue-row="${name}"]`), name).not.toBeNull()
    }
    const rows = document.querySelectorAll('[data-catalogue-row]')
    expect(rows.length).toBeGreaterThanOrEqual(30)
    for (const id of ['actions', 'pills', 'fields', 'dates', 'tabs', 'overlays', 'feedback', 'cards', 'custom', 'demo']) {
      expect(document.getElementById(`fam-${id}`), id).not.toBeNull()
    }
    expect(document.querySelectorAll('[id^="lib-"]')).toHaveLength(0)
    expect(within(document.getElementById('fam-custom') as HTMLElement).getByText('SlideStack')).toBeInTheDocument()
    expect(screen.getAllByText('Shared component').length).toBeGreaterThan(0)
    expect(screen.queryByText('Replace with')).toBeNull()
    // Every Shared component cell names a real file under src/ (or Stays custom, Demo only).
    expect(sharedCells(document)).toHaveLength(rows.length)
    expect(missingSharedFiles(sharedCells(document), SRC_FILES)).toEqual([])
  })

  it('opens a bottom sheet inside the phone stage', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Open a bottom sheet' }))
    expect(screen.getByText('A bottom sheet')).toBeInTheDocument()
  })

  it('has no en or em dashes in its visible text', () => {
    renderPage()
    expect(document.body.textContent ?? '').not.toMatch(/[–—]/)
  })
})
