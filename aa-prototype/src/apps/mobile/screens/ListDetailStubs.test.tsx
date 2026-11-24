/**
 * Catch-up Phase 33a: the stub on the phone's List (US-02.6.1, US-02.6.2):
 * drawn in time order and marked, never counted, its sheet read only.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, importHospitalDownload, OFFICE_ACTOR, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { SEED_STUB } from '../../../domain/seed/intakeSeed'
import { ListDetailScreen } from './ListDetailScreen'

afterEach(cleanup)

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

function renderList(listId: string, onOpenBooking: (id: string) => void = () => undefined) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="mobile">
        <ListDetailScreen listId={listId} actor={SOUTER} onBack={() => undefined} onOpenBooking={onOpenBooking} onAddBooking={() => undefined} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

describe('a stub on the phone\'s List', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows the seeded stub, marked, with "1 waiting at intake"; the count excludes it', () => {
    const { container } = renderList(SEED_STUB.listId)
    const stub = container.querySelector('[data-shot="list-stub"]') as HTMLElement
    expect(stub).toHaveTextContent('Mere Tipene')
    expect(stub).toHaveTextContent('Lap chole')
    expect(stub).toHaveTextContent('Waiting at intake: no NHI')
    expect(container.querySelector('[data-shot="list-stub-note"]')).toHaveTextContent('1 waiting at intake')
    expect(screen.getByText('0 of 0 complete')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/[–—]/)
    expect(container.textContent?.toLowerCase()).not.toContain('stub booking')
  })

  it('opens the sheet with what was received and the readings caption, never a Booking', () => {
    let opened: string | undefined
    const { container } = renderList(SEED_STUB.listId, (id) => (opened = id))
    fireEvent.click(container.querySelector('[data-shot="list-stub"] button') as HTMLElement)
    const sheet = container.ownerDocument.querySelector('[data-shot="stub-sheet"]') as HTMLElement
    expect(within(sheet).getByText('Booking waiting at intake')).toBeInTheDocument()
    expect(sheet).toHaveTextContent('Southern Cross')
    expect(sheet).toHaveTextContent('How a stub reads is our reading, to confirm with AA.')
    expect(opened).toBeUndefined()
  })

  it("Southern Cross R4's stub sits in time order among the Bookings, and the bar is held, never done green", () => {
    importHospitalDownload(useAppStore, OFFICE_ACTOR, 'SAMPLE_SX')
    const { container } = renderList('L-34821-2026-12-01-PM')
    const rows = [...container.querySelectorAll('[data-testid="mobile-list-scroll"] > button, [data-testid="mobile-list-scroll"] > [data-shot="list-stub"]')]
    const stubAt = rows.findIndex((r) => r.getAttribute('data-shot') === 'list-stub')
    expect(stubAt).toBe(2) // after 13:00 and 14:00, before "Add a booking"
    expect(rows[stubAt]).toHaveTextContent('Tama Henare')
    expect(container.querySelector('[role="progressbar"]')).toHaveAttribute('data-tone', 'held')
  })
})
