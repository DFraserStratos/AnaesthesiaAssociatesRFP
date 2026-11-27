/**
 * The profile pages' Usual week card: the grid from the store, the Public session on the anaesthetist
 * side only, stacked entries on a surgeon's shared half-day, the list view, and the recurring booking
 * sheet opened to edit or prefilled to add.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ANAE, SURG } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { UsualWeekCard } from './UsualWeekCard'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

function renderCard(perspective: 'anaesthetist' | 'surgeon', subjectId: string) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <UsualWeekCard perspective={perspective} subjectId={subjectId} actor={OFFICE} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

function cellAt(day: number, session: 'AM' | 'PM'): HTMLElement {
  return document.querySelector(`[data-shot="usual-week-cell"][data-day="${day}"][data-session="${session}"]`) as HTMLElement
}

describe('UsualWeekCard', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it("draws Dr Souter's week: six recurring bookings, the Thursday AM Public session, the rest free", () => {
    renderCard('anaesthetist', ANAE.souter)
    expect(screen.getByRole('heading', { name: 'Usual week' })).toBeInTheDocument()
    expect(document.querySelector('[data-shot="usual-week-count"]')).toHaveTextContent('6 recurring bookings')
    expect(document.querySelectorAll('[data-shot="usual-week-cell"][data-cell="recurring"]')).toHaveLength(6)
    const thuAm = cellAt(4, 'AM')
    expect(thuAm.dataset.cell).toBe('public')
    expect(thuAm.tagName).toBe('DIV')
    expect(thuAm).toHaveTextContent('Public')
    expect(cellAt(4, 'PM')).toHaveTextContent('Pre-op')
    expect(cellAt(4, 'PM')).toHaveTextContent('13:00 to 17:00')
    expect(document.querySelectorAll('[data-cell="free"][data-shot="usual-week-cell"]')).toHaveLength(3)
    expect(cellAt(3, 'PM')).toHaveTextContent('Free')
    expect(screen.getByText('Public session (availability)')).toBeInTheDocument()
  })

  it('opens the sheet to edit a recurring booking, and prefilled to add on a free half-day', () => {
    renderCard('anaesthetist', ANAE.souter)
    fireEvent.click(cellAt(1, 'AM'))
    expect(screen.getByRole('heading', { name: 'Edit recurring booking' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    fireEvent.click(cellAt(3, 'PM'))
    expect(screen.getByRole('heading', { name: 'Add recurring booking' })).toBeInTheDocument()
    expect((screen.getByLabelText('Anaesthetist') as HTMLSelectElement).value).toBe(ANAE.souter)
    expect((screen.getByLabelText('Day of week') as HTMLSelectElement).value).toBe('3')
    expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'true')
  })

  it("stacks Ms Patel's Wednesday PM, one button per anaesthetist, with no Public legend", () => {
    renderCard('surgeon', SURG.patel)
    const wedPm = cellAt(3, 'PM')
    expect(within(wedPm).getAllByRole('button')).toHaveLength(2)
    expect(document.querySelector('[data-shot="usual-week-count"]')?.textContent).toMatch(/recurring bookings · \d+ anaesthetists/)
    expect(screen.queryByText('Public session (availability)')).toBeNull()
    expect(screen.getAllByText('No recurring booking').length).toBeGreaterThan(0)
  })

  it('lists the recurring bookings, with an Edit on each live row', () => {
    renderCard('anaesthetist', ANAE.souter)
    fireEvent.click(screen.getByRole('button', { name: /^List/ }))
    const rows = document.querySelectorAll('[data-shot="usual-week-row"]')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveTextContent('Mondays')
    expect(rows[0]).toHaveTextContent('Ongoing')
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('button', { name: /Edit recurring booking/ }))
    expect(screen.getByRole('heading', { name: 'Edit recurring booking' })).toBeInTheDocument()
  })
})
