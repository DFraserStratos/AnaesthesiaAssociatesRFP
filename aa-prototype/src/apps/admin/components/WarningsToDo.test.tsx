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

function Harness({ onOpen = vi.fn() }: { onOpen?: (d: string, b: string) => void }) {
  const state = useAppStore()
  return <WarningsToDo rows={openWarnings(state)} actor={OFFICE_ACTOR} onOpenBooking={onOpen} />
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
    expect(rows[0]).toHaveTextContent('Prepayment required')
    expect(rows[0]).toHaveTextContent('Annette Riley')
    expect(rows[0]).toHaveTextContent('Dr Souter')
    expect(rows[0]).toHaveTextContent('Fri 24 Jul AM')
    expect(card).not.toHaveTextContent(/Provisional/)
    fireEvent.click(within(card).getByRole('button', { name: "Open Annette Riley's Booking" }))
    expect(onOpen).toHaveBeenCalledWith('2026-07-24', RILEY)
  })

  it('a new warning appears (Appears)', () => {
    render(<Harness />)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    act(() => { raiseDaySamples(useAppStore) })
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
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
