/**
 * Catch-up Phase 40 (item 16): the anaesthetist's balance colour code on the
 * List row and in the Booking detail, on mobile and web (strong for Sarah
 * Mitchell, mild for Losa Tuilagi; no amount, no name in the chip, no Clear,
 * and never the office's balance warning row), and the shared note written by
 * one side showing to the other.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addSharedNote, clearWarning, createBooking, freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore, warningsForBooking, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { SharedNotes } from '../../../shared/notes'
import { RVG_GROUP, SEED_LIST_IDS } from '../../../domain/seed'
import { ListDetailScreen } from './ListDetailScreen'
import { BookingDetailScreen } from './BookingDetailScreen'
import { ListDetailView } from '../../web/screens/ListDetailView'
import { BookingDetailView } from '../../web/screens/BookingDetailView'

afterEach(cleanup)

const SOUTER: Actor = SOUTER_ACTOR
const LIST = SEED_LIST_IDS.souterPm21

function addBookingFor(patient: { nhi: string; name: string; dobISO: string }): string {
  const out = createBooking(useAppStore, SOUTER, LIST, {
    patient,
    sourceText: { text: 'Laparoscopic cholecystectomy', source: 'anaesthetist' },
    rvgGroupId: RVG_GROUP.a3!,
  })
  if (!out.ok) throw new Error(out.message)
  return out.value.bookingId
}

const SARAH = { nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-08-16' }
const LOSA = { nhi: 'JKL1188', name: 'Losa Tuilagi', dobISO: '1992-06-01' }

function chipIn(root: HTMLElement): HTMLElement {
  const chip = root.querySelector('[data-shot="balance-alert-chip"]') as HTMLElement | null
  if (chip === null) throw new Error('no balance chip')
  return chip
}

function expectNoAmountOrName(el: HTMLElement, name: string) {
  expect(el.textContent).not.toMatch(/\$/)
  expect(el.textContent).not.toContain(name)
  expect(el.getAttribute('title') ?? '').not.toMatch(/\$/)
}

function rowFor(container: HTMLElement, name: string): HTMLElement {
  const nameEl = within(container).getAllByText(name)[0]!
  return ((nameEl.closest('tr') ?? nameEl.closest('button')) as HTMLElement | null) ?? nameEl.parentElement!
}

describe('the balance colour code (catch-up Phase 40)', () => {
  let sarah = ''
  let losa = ''
  beforeEach(() => {
    useAppStore.setState(freshAppState())
    sarah = addBookingFor(SARAH)
    losa = addBookingFor(LOSA)
  })

  it('mobile List rows: strong for Sarah Mitchell, mild for Losa Tuilagi, no amount, no Clear', () => {
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="mobile">
          <ListDetailScreen listId={LIST} actor={SOUTER} onBack={() => undefined} onOpenBooking={() => undefined} onAddBooking={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const sarahChip = chipIn(rowFor(container, 'Sarah Mitchell'))
    expect(sarahChip).toHaveAttribute('data-strength', 'strong')
    expect(sarahChip).toHaveTextContent('Owes AA')
    expectNoAmountOrName(sarahChip, 'Sarah Mitchell')
    const losaChip = chipIn(rowFor(container, 'Losa Tuilagi'))
    expect(losaChip).toHaveAttribute('data-strength', 'mild')
    expectNoAmountOrName(losaChip, 'Losa Tuilagi')
    expect(screen.queryByText(/^Clear/)).toBeNull()
  })

  it('web List rows: the same strengths', () => {
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <ListDetailView listId={LIST} actor={SOUTER} todayISO="2026-11-24" onBack={() => undefined} onOpenBooking={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    expect(chipIn(rowFor(container, 'Sarah Mitchell'))).toHaveAttribute('data-strength', 'strong')
    expect(chipIn(rowFor(container, 'Losa Tuilagi'))).toHaveAttribute('data-strength', 'mild')
    expect(screen.queryByText(/^Clear/)).toBeNull()
  })

  it('mobile Booking detail: the strong chip with the no-amount sentence, no warning row, no Clear, no patient link', () => {
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="mobile">
          <BookingDetailScreen bookingId={sarah} actor={SOUTER} onBack={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const chip = chipIn(container)
    expect(chip).toHaveAttribute('data-strength', 'strong')
    expect(chip).toHaveTextContent('This patient owes AA money. The office is following up.')
    expectNoAmountOrName(chip, 'Sarah Mitchell')
    expect(container.textContent).not.toContain('$610.00')
    expect(container.querySelector('[data-warning-key*="patientBalance"]')).toBeNull()
    expect(screen.queryByText(/^Clear/)).toBeNull()
    expect(container.querySelector('a[href^="/admin/patients"]')).toBeNull()
  })

  it('web Booking detail: the mild chip for Losa Tuilagi, and it ignores the office\'s Clear', () => {
    const w = warningsForBooking(useAppStore.getState(), losa).find((x) => x.ruleId === 'patientBalance')!
    expect(clearWarning(useAppStore, OFFICE_ACTOR, losa, w.key).ok).toBe(true)
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <BookingDetailView bookingId={losa} actor={SOUTER} todayISO="2026-11-24" onBack={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    expect(chipIn(container)).toHaveAttribute('data-strength', 'mild')
    expect(screen.queryByText(/^Clear/)).toBeNull()
  })
})

describe('the shared note (catch-up Phase 40; US-11.3.3)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('a note Dr Souter adds on her mobile List shows to the office, with author; the office\'s reply shows on web; a blank note is refused', () => {
    const mobile = render(
      <MemoryRouter>
        <SurfaceProvider variant="mobile">
          <ListDetailScreen listId={LIST} actor={SOUTER} onBack={() => undefined} onOpenBooking={() => undefined} onAddBooking={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const notes = mobile.container.querySelector('[data-shot="shared-notes"]') as HTMLElement
    fireEvent.click(within(notes).getByText('Add note'))
    expect(within(notes).getByRole('alert')).toHaveTextContent('Write the note first.')
    fireEvent.change(within(notes).getByRole('textbox'), { target: { value: 'Patient 3 is latex allergic' } })
    fireEvent.click(within(notes).getByText('Add note'))
    expect(useAppStore.getState().schedule.lists[LIST]!.noteLog?.map((n) => n.text)).toEqual(['Patient 3 is latex allergic'])
    mobile.unmount()

    const office = render(<SharedNotes target={{ listId: LIST }} actor={OFFICE_ACTOR} size="compact" />)
    expect(office.container).toHaveTextContent('Patient 3 is latex allergic')
    expect(office.container).toHaveTextContent(SOUTER.who)
    office.unmount()

    expect(addSharedNote(useAppStore, OFFICE_ACTOR, { listId: LIST }, 'Noted, the theatre knows').ok).toBe(true)
    const web = render(
      <MemoryRouter>
        <SurfaceProvider variant="web">
          <ListDetailView listId={LIST} actor={SOUTER} todayISO="2026-11-24" onBack={() => undefined} onOpenBooking={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const items = [...web.container.querySelectorAll('[data-shot="shared-notes"] li')].map((li) => li.textContent ?? '')
    // Newest first.
    expect(items[0]).toContain('Noted, the theatre knows')
    expect(items[0]).toContain(OFFICE_ACTOR.who)
    expect(items[1]).toContain('Patient 3 is latex allergic')
  })

  it('a note the office adds on a Booking shows in the anaesthetist\'s mobile Booking detail', () => {
    const bookingId = Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === LIST && b.cancellation === undefined)!.id
    expect(addSharedNote(useAppStore, OFFICE_ACTOR, { bookingId }, 'Bring the consent form').ok).toBe(true)
    const { container } = render(
      <MemoryRouter>
        <SurfaceProvider variant="mobile">
          <BookingDetailScreen bookingId={bookingId} actor={SOUTER} onBack={() => undefined} />
        </SurfaceProvider>
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-shot="shared-notes"]')).toHaveTextContent('Bring the consent form')
  })
})
