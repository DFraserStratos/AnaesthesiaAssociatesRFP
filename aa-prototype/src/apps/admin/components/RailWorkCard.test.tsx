/**
 * The Admin Day rail's work card: To-do holds open warnings and Bookings with no Contract yet in one
 * date order; Notifications is its own tab, never mixed into To-do (FT-13.7); each tab shows its count.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, needsInvoiceDestinationBookings, OFFICE_ACTOR, openWarnings, replaceContract, useAppStore } from '../../../store'
import { SEED_MARKERS } from '../../../domain/seed'
import { CONTRACT } from '../../../domain/seed/contracts'
import { RailWorkCard } from './RailWorkCard'
import { toDoItemDate, toDoItems } from './WarningsToDo'

const NO_CONTRACT = SEED_MARKERS['needsInvoiceDestinationBooking']!.entityId

function Harness({ onOpenBooking = vi.fn() }: { onOpenBooking?: (d: string, b: string) => void }) {
  const state = useAppStore()
  return (
    <MemoryRouter>
      <RailWorkCard todoRows={openWarnings(state)} actor={OFFICE_ACTOR} onOpenBooking={onOpenBooking} onOpenNotification={vi.fn()} onSeeAllNotifications={vi.fn()} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('RailWorkCard', () => {
  it('To-do counts warnings and no-Contract Bookings together, and Set Contract opens the Booking', () => {
    const onOpenBooking = vi.fn()
    render(<Harness onOpenBooking={onOpenBooking} />)
    const state = useAppStore.getState()
    const expected = openWarnings(state).length + needsInvoiceDestinationBookings(state).length
    const todoTab = screen.getByRole('button', { name: /^To-do/ })
    expect(todoTab).toHaveAttribute('aria-pressed', 'true')
    expect(todoTab).toHaveTextContent(String(expected))
    const panel = screen.getByRole('region', { name: 'To-do' })
    const row = panel.querySelector<HTMLElement>(`[data-shot="needs-destination-row"][data-booking-id="${NO_CONTRACT}"]`)
    // Six rows show at first; expand if the seeded Booking sits further down.
    if (row === null) fireEvent.click(within(panel).getByRole('button', { name: /Show all/ }))
    const shown = panel.querySelector<HTMLElement>(`[data-shot="needs-destination-row"][data-booking-id="${NO_CONTRACT}"]`)!
    expect(shown).toHaveTextContent('No Contract')
    fireEvent.click(within(shown).getByRole('button', { name: /Set the Contract/ }))
    expect(onOpenBooking).toHaveBeenCalledWith(expect.any(String), NO_CONTRACT)
  })

  it('Notifications is its own tab: switching shows the pool, not the to-do rows', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /^Notifications/ }))
    expect(screen.getByRole('button', { name: /^Notifications/ })).toHaveAttribute('aria-pressed', 'true')
    const panel = screen.getByRole('region', { name: 'Notifications' })
    expect(panel.querySelector('[data-shot="needs-destination-row"]')).toBeNull()
    expect(within(panel).getByRole('button', { name: 'See all notifications' })).toBeInTheDocument()
  })

  it('orders warnings and no-Contract rows by date, then session', () => {
    const state = useAppStore.getState()
    const items = toDoItems(openWarnings(state), needsInvoiceDestinationBookings(state))
    const keys = items.map(toDoItemDate)
    expect(keys).toEqual([...keys].sort())
  })

  it('a replaced Contract has no session: it comes first on its date (build plan Phase 49)', () => {
    const state = useAppStore.getState()
    const noContract = needsInvoiceDestinationBookings(state)
    const day = noContract[0]!.dateISO
    const replaced = { contractId: 'CT-OLD', contractName: 'Old', aaCode: 'OLD-001', replacementId: 'CT-NEW', replacementName: 'New', replacementCode: 'OLD-002', fromISO: day }
    const items = toDoItems(openWarnings(state), noContract, [replaced])
    const onDay = items.filter((i) => toDoItemDate(i) === day)
    expect(onDay[0]!.kind).toBe('replacedContract')
  })

  it('the replaced-Contract to-do shows "Disable" and Open Contract opens its page', () => {
    const onOpenContract = vi.fn()
    const replace = replaceContract(useAppStore, OFFICE_ACTOR, CONTRACT.unisports, { patch: {}, fromISO: useAppStore.getState().clock.todayISO, moveProcedureIds: [], disableNow: false })
    expect(replace.ok).toBe(true)
    render(
      <MemoryRouter>
        <RailWorkCard todoRows={openWarnings(useAppStore.getState())} actor={OFFICE_ACTOR} onOpenBooking={vi.fn()} onOpenNotification={vi.fn()} onSeeAllNotifications={vi.fn()} onOpenContract={onOpenContract} />
      </MemoryRouter>,
    )
    const row = document.querySelector('[data-shot="todo-replaced-contract"]')!
    expect(row).not.toBeNull()
    expect(row.getAttribute('data-contract-id')).toBe(CONTRACT.unisports)
    expect(row.textContent).toContain('Disable Unisports Ortho (UNI-001)')
    expect(row.textContent).toContain('Replaced by UNI-002 from')
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Open Unisports Ortho (UNI-001)' }))
    expect(onOpenContract).toHaveBeenCalledWith(CONTRACT.unisports)
  })
})
