/**
 * The Admin Day rail's work card: To-do holds open warnings only; Contracts holds the Lists still
 * needing Contracts, one row per List (US-04.3.12); Notifications is its own tab, never mixed into
 * To-do (FT-13.7); each tab shows its count.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, listsNeedingContracts, needsInvoiceDestinationBookings, OFFICE_ACTOR, openWarnings, replaceContract, useAppStore } from '../../../store'
import { SEED_MARKERS } from '../../../domain/seed'
import { CONTRACT } from '../../../domain/seed/contracts'
import { RailWorkCard } from './RailWorkCard'
import { toDoItemDate, toDoItems } from './WarningsToDo'

const NO_CONTRACT = SEED_MARKERS['needsInvoiceDestinationBooking']!.entityId

function Harness({ onOpenBooking = vi.fn(), onOpenList = vi.fn() }: { onOpenBooking?: (d: string, b: string) => void; onOpenList?: (listId: string) => void }) {
  const state = useAppStore()
  return (
    <MemoryRouter>
      <RailWorkCard todoRows={openWarnings(state)} actor={OFFICE_ACTOR} onOpenBooking={onOpenBooking} onOpenList={onOpenList} onOpenNotification={vi.fn()} onSeeAllNotifications={vi.fn()} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('RailWorkCard', () => {
  it('To-do holds warnings only: no Booking with no Contract is a to-do (US-13.7.2)', () => {
    render(<Harness />)
    const state = useAppStore.getState()
    expect(needsInvoiceDestinationBookings(state).length).toBeGreaterThan(0)
    const todoTab = screen.getByRole('button', { name: /^To-do/ })
    expect(todoTab).toHaveAttribute('aria-pressed', 'true')
    expect(todoTab).toHaveTextContent(String(openWarnings(state).length))
    const panel = screen.getByRole('region', { name: 'To-do' })
    expect(panel.querySelector('[data-shot="contracts-to-set-row"]')).toBeNull()
    expect(panel.textContent).not.toContain('No Contract')
  })

  it('Contracts holds one row per List with how many are set; Set Contracts and Open List open them (US-04.3.12)', () => {
    const onOpenBooking = vi.fn()
    const onOpenList = vi.fn()
    render(<Harness onOpenBooking={onOpenBooking} onOpenList={onOpenList} />)
    const state = useAppStore.getState()
    const lists = listsNeedingContracts(state)
    const seeded = lists.find((l) => l.toSet.some((p) => p.bookingId === NO_CONTRACT))!
    expect(seeded).toBeDefined()
    const tab = screen.getByRole('button', { name: /^Contracts/ })
    expect(tab).toHaveTextContent(String(lists.length))
    fireEvent.click(tab)
    const panel = screen.getByRole('region', { name: 'Contracts' })
    if (panel.querySelector(`[data-list-id="${seeded.listId}"]`) === null) fireEvent.click(within(panel).getByRole('button', { name: /Show all/ }))
    const row = panel.querySelector<HTMLElement>(`[data-shot="contracts-to-set-row"][data-list-id="${seeded.listId}"]`)!
    expect(row).toHaveTextContent(`${seeded.set} of ${seeded.total} set`)
    fireEvent.click(within(row).getByRole('button', { name: /^Set the Contract/ }))
    expect(onOpenBooking).toHaveBeenCalledWith(seeded.dateISO, seeded.toSet[0]!.bookingId)
    fireEvent.click(within(row).getByRole('button', { name: /^Open the/ }))
    expect(onOpenList).toHaveBeenCalledWith(seeded.listId)
  })

  it('Notifications is its own tab: switching shows the pool, not the to-do rows', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /^Notifications/ }))
    expect(screen.getByRole('button', { name: /^Notifications/ })).toHaveAttribute('aria-pressed', 'true')
    const panel = screen.getByRole('region', { name: 'Notifications' })
    expect(panel.querySelector('[data-shot="needs-destination-row"]')).toBeNull()
    expect(within(panel).getByRole('button', { name: 'See all notifications' })).toBeInTheDocument()
  })

  it('orders warnings by date, then session, and a replaced Contract (no session) first on its date (build plan Phase 49)', () => {
    const state = useAppStore.getState()
    const warnings = openWarnings(state)
    const day = warnings[0]!.dateISO
    const replaced = { contractId: 'CT-OLD', contractName: 'Old', aaCode: 'OLD-001', replacementId: 'CT-NEW', replacementName: 'New', replacementCode: 'OLD-002', fromISO: day }
    const items = toDoItems(warnings, [replaced])
    const keys = items.map(toDoItemDate)
    expect(keys).toEqual([...keys].sort())
    expect(items.filter((i) => toDoItemDate(i) === day)[0]!.kind).toBe('replacedContract')
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
