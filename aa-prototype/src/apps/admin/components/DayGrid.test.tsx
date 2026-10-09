import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Anaesthetist, List, ListKind, SlotStatusKey } from '../../../domain/types'
import { isOpenSlot } from '../../../domain/slotStatus'
import { useAppStore, type SlotView } from '../../../store'
import { displayStatusKey, effectiveSlotTimes, slotIdFor } from '../../../domain/slots'
import { DayGrid } from './DayGrid'

const DATE = '2026-07-21'

function anaesthetist(id: string, name: string): Anaesthetist {
  return {
    registrationNumber: id,
    name,
    phone: '021 555 0100',
    email: `${id}@example.test`,
    unitValue: 100,
    gstPeriod: 'biMonthly',
    hpiId: `HPI-${id}`,
    startDateISO: '2020-01-06',
    active: true,
  }
}

/** A session (catch-up Phase 28): a Slot, with a List of `kind` in it or empty with `status`. */
function view(anaesthetistId: string, contents: { kind: ListKind; id: string; patch?: Partial<List> } | { status: SlotStatusKey; note?: string }): SlotView {
  const slot = {
    id: slotIdFor(anaesthetistId, DATE, 'AM'),
    anaesthetistId,
    dateISO: DATE,
    session: 'AM' as const,
    status: 'status' in contents ? contents.status : 'free',
    ...('note' in contents && contents.note !== undefined ? { note: contents.note } : {}),
  }
  const list: List | undefined =
    'kind' in contents
      ? { id: contents.id, slotId: slot.id, dateISO: DATE, anaesthetistId, session: 'AM', state: 'ACTIVE', kind: contents.kind, conflicts: [], ...contents.patch }
      : undefined
  const settings = useAppStore.getState().appSettings.schedule
  const statuses = useAppStore.getState().masters.slotStatuses
  return { slot, ...(list !== undefined ? { list } : {}), displayKey: displayStatusKey(slot, list), times: effectiveSlotTimes(slot, settings), open: isOpenSlot(slot, list, statuses) }
}

function renderGrid() {
  const masters = useAppStore.getState().masters
  const surgeonId = Object.keys(masters.surgeons)[0]!
  const anaesthetists = [
    anaesthetist('A1', 'Dr Ana Alpha'),
    anaesthetist('A2', 'Dr Bea Beta'),
    anaesthetist('A3', 'Dr Cia Gamma'),
    anaesthetist('A4', 'Dr Dia Delta'),
  ]
  const hospitalId = Object.keys(masters.hospitals)[0]!
  const attention = view('A1', { kind: 'private', id: 'attention' })
  const noted = view('A2', { kind: 'public', id: 'noted', patch: { surgeonId, notes: 'Called hospital' } })
  const warned = view('A3', { kind: 'public', id: 'warned', patch: { hospitalId } })
  const holiday = view('A4', { status: 'holiday', note: 'Annual leave' })

  return render(
    <DayGrid
      anaesthetists={anaesthetists}
      viewsByAnaesthetist={{
        A1: [attention],
        A2: [noted],
        A3: [warned],
        A4: [holiday],
      }}
      masters={masters}
      warningFlags={new Map([['warned', { open: 2, strongest: 'strong' as const }]])}
      onSelectSlot={vi.fn()}
    />,
  )
}

describe('DayGrid filters', () => {
  it('lets status pills hide and restore matching rows', () => {
    const { container } = renderGrid()

    const privateFilter = screen.getByRole('button', { name: 'Private status' })
    expect(privateFilter).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Surgeon TBC/ })).toBeInTheDocument()

    fireEvent.click(privateFilter)

    expect(privateFilter).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: /Surgeon TBC/ })).not.toBeInTheDocument()
    expect(screen.getByText('Alpha, Ana')).toBeInTheDocument()
    expect(screen.getByText('3 of 4 anaesthetists have matching blocks. Showing 3 of 4 blocks.', { exact: false })).toBeInTheDocument()
    const filteredRows = Array.from(container.querySelectorAll('[data-day-grid-row]'))
    expect(filteredRows.map((row) => row.getAttribute('data-day-grid-row'))).toEqual(['A2', 'A3', 'A4', 'A1'])
    expect(filteredRows[3]).toHaveAttribute('data-filter-match', 'false')
    expect(filteredRows[3]).toHaveAttribute('data-filter-divider', 'true')
    expect(container.querySelector('[data-filter-footer-divider]')).toHaveAttribute('data-filter-footer-divider', 'true')

    fireEvent.click(privateFilter)
    expect(screen.getByRole('button', { name: /Surgeon TBC/ })).toBeInTheDocument()
    const restoredRows = Array.from(container.querySelectorAll('[data-day-grid-row]'))
    expect(restoredRows.map((row) => row.getAttribute('data-day-grid-row'))).toEqual(['A1', 'A2', 'A3', 'A4'])
    expect(container.querySelector('[data-filter-divider]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-filter-footer-divider]')).not.toBeInTheDocument()
  })

  it('combines focus signals with OR semantics and resets to the full day', () => {
    const { container } = renderGrid()

    const attentionFilter = screen.getByRole('button', { name: 'Needs attention' })
    const noteFilter = screen.getByRole('button', { name: 'Has note' })
    const prepaymentFilter = screen.getByRole('button', { name: 'Has warnings' })

    fireEvent.click(attentionFilter)
    expect(attentionFilter).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Surgeon TBC/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open for cover/ })).not.toBeInTheDocument()
    expect(screen.getByText('Gamma, Cia')).toBeInTheDocument()
    expect(screen.getByText('1 of 4 anaesthetists has matching blocks. Showing 1 of 4 blocks.', { exact: false })).toBeInTheDocument()
    const focusedRows = Array.from(container.querySelectorAll('[data-day-grid-row]'))
    expect(focusedRows.map((row) => row.getAttribute('data-day-grid-row'))).toEqual(['A1', 'A2', 'A3', 'A4'])
    expect(focusedRows[1]).toHaveAttribute('data-filter-divider', 'true')

    fireEvent.click(noteFilter)
    expect(screen.getByTitle('Note: Called hospital')).toBeInTheDocument()
    expect(screen.getByText('2 of 4 anaesthetists have matching blocks. Showing 2 of 4 blocks.', { exact: false })).toBeInTheDocument()

    fireEvent.click(attentionFilter)
    expect(screen.queryByRole('button', { name: /Surgeon TBC/ })).not.toBeInTheDocument()
    expect(screen.getByTitle('Note: Called hospital')).toBeInTheDocument()

    fireEvent.click(prepaymentFilter)
    expect(container.querySelector('[data-list-id="warned"]')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(attentionFilter).toHaveAttribute('aria-pressed', 'false')
    expect(noteFilter).toHaveAttribute('aria-pressed', 'false')
    expect(prepaymentFilter).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('4 of 4 anaesthetists have matching blocks. Showing 4 of 4 blocks.', { exact: false })).toBeInTheDocument()
  })

  it('marks a List with open warnings: triangle with the count, the capture hook (US-13.7.3)', () => {
    const { container } = renderGrid()
    const block = container.querySelector('[data-shot="daygrid-block-warnings"]') as HTMLElement
    expect(block).not.toBeNull()
    expect(block.getAttribute('data-list-id')).toBe('warned')
    expect(screen.getByRole('img', { name: '2 open warnings' })).toBeInTheDocument()
    // The List-level `!` stays on the surgeon-TBC block only, never on a warning block.
    const tbc = screen.getByRole('button', { name: /Surgeon TBC/ })
    expect(tbc.textContent).toContain('!')
    expect(block.textContent).not.toContain('!')
  })
})

describe('DayGrid sessions (catch-up Phase 28)', () => {
  it('paints an empty free session as Free with its note, keyed and clicked by session', () => {
    const masters = useAppStore.getState().masters
    const onSelectSlot = vi.fn()
    const free = view('A1', { status: 'free', note: 'Free / open for cover' })
    render(
      <DayGrid
        anaesthetists={[anaesthetist('A1', 'Dr Ana Alpha')]}
        viewsByAnaesthetist={{ A1: [free] }}
        masters={masters}
        warningFlags={new Map()}
        onSelectSlot={onSelectSlot}
      />,
    )
    const block = screen.getByRole('button', { name: /open for cover/ })
    expect(block).toHaveAttribute('data-slot-id', free.slot.id)
    expect(block).not.toHaveAttribute('data-list-id')
    fireEvent.click(block)
    expect(onSelectSlot).toHaveBeenCalledWith(free.slot.id)
  })
})
