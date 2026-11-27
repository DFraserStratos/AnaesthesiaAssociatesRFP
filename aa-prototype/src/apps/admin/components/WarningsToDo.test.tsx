/**
 * The dashboard to-do list (US-13.7.2): a new warning appears ("Appears"), and
 * Clear removes it and writes the audit row ("Cleared").
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, OFFICE_ACTOR, openWarnings, raiseDaySamples, useAppStore } from '../../../store'
import { SEED_MARKERS } from '../../../domain/seed'
import { TODO_VISIBLE_ROWS, WarningsToDo } from './WarningsToDo'

const RILEY = SEED_MARKERS['prepaymentBooking']!.entityId

/** The payer review List's seeded child payer and missing approval number (catch-up Phase 21), set aside so these cases read Riley's alone. */
const REVIEW_LIST = new Set([SEED_MARKERS['childPayer']!.entityId, SEED_MARKERS['approvalMissing']!.entityId])

function Harness({ onOpen = vi.fn() }: { onOpen?: (d: string, b: string) => void }) {
  const state = useAppStore()
  return <WarningsToDo rows={openWarnings(state).filter((r) => !REVIEW_LIST.has(r.bookingId))} actor={OFFICE_ACTOR} onOpenBooking={onOpen} />
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

describe('WarningsToDo', () => {
  it('lists Riley’s open warning with Open and Clear, and no Provisional pill', () => {
    const onOpen = vi.fn()
    render(<Harness onOpen={onOpen} />)
    const card = screen.getByRole('region', { name: /To-do/ })
    const rows = within(card).getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    // Catch-up Phase 27: awaiting approval, three days out, so mild.
    expect(rows[0]).toHaveTextContent('Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices')
    expect(rows[0]).toHaveTextContent('Annette Riley')
    expect(rows[0]).toHaveTextContent('Dr Souter')
    expect(rows[0]).toHaveTextContent('Fri 27 Nov AM')
    expect(card).not.toHaveTextContent(/Provisional/)
    fireEvent.click(within(card).getByRole('button', { name: "Open Annette Riley's Booking" }))
    expect(onOpen).toHaveBeenCalledWith('2026-11-27', RILEY)
  })

  it('a new warning appears (Appears)', () => {
    render(<Harness />)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    act(() => { raiseDaySamples(useAppStore) })
    // Two samples on each of the two pinned targets, the child payer sample on Grace Park's Booking and
    // the approval number sample on the first seeded NIB Booking (catch-up Phase 21): six rows shown.
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
  })

  it('Clear removes the row at once and writes the audit row (Cleared)', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear warning for Annette Riley' }))
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('Nothing needs attention.')).toBeInTheDocument()
    expect(useAppStore.getState().audit.at(-1)).toMatchObject({ action: 'booking.warningCleared', entityId: RILEY, who: 'Kirsty W.' })
  })

  it('shows the first six rows, then "Show all (n)" expands in place', () => {
    const rows = openWarnings(useAppStore.getState())
    const many = Array.from({ length: TODO_VISIBLE_ROWS + 2 }, (_, i) => ({ ...rows[0]!, warning: { ...rows[0]!.warning, key: `k${i}` } }))
    render(<WarningsToDo rows={many} actor={OFFICE_ACTOR} onOpenBooking={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(TODO_VISIBLE_ROWS)
    fireEvent.click(screen.getByRole('button', { name: `Show all (${many.length})` }))
    expect(screen.getAllByRole('listitem')).toHaveLength(many.length)
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(TODO_VISIBLE_ROWS)
  })
})
