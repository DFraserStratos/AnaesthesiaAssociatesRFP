import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Anaesthetist, AssignedList, ListKind, SlotStatusKey } from '../../../domain/types'
import { isOpenSlot } from '../../../domain/slotStatus'
import { bookingCountsByList, draftListsForDate, freshAppState, useAppStore, type SlotView } from '../../../store'
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
function view(anaesthetistId: string, contents: { kind: ListKind; id: string; patch?: Partial<AssignedList> } | { status: SlotStatusKey; note?: string }): SlotView {
  const slot = {
    id: slotIdFor(anaesthetistId, DATE, 'AM'),
    anaesthetistId,
    dateISO: DATE,
    session: 'AM' as const,
    status: 'status' in contents ? contents.status : 'free',
    ...('note' in contents && contents.note !== undefined ? { note: contents.note } : {}),
  }
  // Every List names its hospital and surgeon (US-01.3.1, catch-up Phase 31).
  const masters = useAppStore.getState().masters
  const list: AssignedList | undefined =
    'kind' in contents
      ? {
          id: contents.id,
          slotId: slot.id,
          dateISO: DATE,
          anaesthetistId,
          session: 'AM',
          state: 'ACTIVE',
          kind: contents.kind,
          hospitalId: Object.keys(masters.hospitals)[0]!,
          surgeonId: Object.keys(masters.surgeons)[0]!,
          conflicts: [],
          ...contents.patch,
        }
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
  // A List needs attention for a live conflict (no List lacks a surgeon since catch-up Phase 31).
  const attention = view('A1', {
    kind: 'public',
    id: 'attention',
    patch: { conflicts: [{ kind: 'holiday', cause: 'holiday:HHX', holidayId: 'HHX', raisedAtISO: '2026-07-21T08:00:00' }] },
  })
  // A private List's note is an office annotation (a public or pre-op List's note is its subtitle).
  const noted = view('A2', { kind: 'private', id: 'noted', patch: { surgeonId, notes: 'Called hospital' } })
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
    expect(container.querySelector('[data-list-id="noted"]')).not.toBeNull()

    fireEvent.click(privateFilter)

    expect(privateFilter).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelector('[data-list-id="noted"]')).toBeNull()
    expect(screen.getByText('Beta, Bea')).toBeInTheDocument()
    expect(screen.getByText('3 of 4 anaesthetists have matching blocks. Showing 3 of 4 blocks.', { exact: false })).toBeInTheDocument()
    const filteredRows = Array.from(container.querySelectorAll('[data-day-grid-row]'))
    expect(filteredRows.map((row) => row.getAttribute('data-day-grid-row'))).toEqual(['A1', 'A3', 'A4', 'A2'])
    expect(filteredRows[3]).toHaveAttribute('data-filter-match', 'false')
    expect(filteredRows[3]).toHaveAttribute('data-filter-divider', 'true')
    expect(container.querySelector('[data-filter-footer-divider]')).toHaveAttribute('data-filter-footer-divider', 'true')

    fireEvent.click(privateFilter)
    expect(container.querySelector('[data-list-id="noted"]')).not.toBeNull()
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
    expect(container.querySelector('[data-list-id="attention"]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /open for cover/ })).not.toBeInTheDocument()
    expect(screen.getByText('Gamma, Cia')).toBeInTheDocument()
    expect(screen.getByText('1 of 4 anaesthetists has matching blocks. Showing 1 of 4 blocks.', { exact: false })).toBeInTheDocument()
    const focusedRows = Array.from(container.querySelectorAll('[data-day-grid-row]'))
    expect(focusedRows.map((row) => row.getAttribute('data-day-grid-row'))).toEqual(['A1', 'A2', 'A3', 'A4'])
    expect(focusedRows[1]).toHaveAttribute('data-filter-divider', 'true')

    fireEvent.click(noteFilter)
    expect(screen.getByTitle(/^Note: Called hospital/)).toBeInTheDocument()
    expect(screen.getByText('2 of 4 anaesthetists have matching blocks. Showing 2 of 4 blocks.', { exact: false })).toBeInTheDocument()

    fireEvent.click(attentionFilter)
    expect(container.querySelector('[data-list-id="attention"]')).toBeNull()
    expect(screen.getByTitle(/^Note: Called hospital/)).toBeInTheDocument()

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
    // The List-level `!` stays on the conflicted block only, never on a warning block.
    const attention = container.querySelector('[data-list-id="attention"]') as HTMLElement
    expect(attention.textContent).toContain('!')
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

describe('DayGrid conflicts (catch-up Phase 30: the List changes colour)', () => {
  function renderConflictGrid() {
    const masters = useAppStore.getState().masters
    const hospitalId = Object.keys(masters.hospitals)[0]!
    const surgeonId = Object.keys(masters.surgeons)[0]!
    const conflicted = view('A1', {
      kind: 'private',
      id: 'conflicted',
      patch: { hospitalId, surgeonId, conflicts: [{ kind: 'holiday', cause: 'holiday:HHX', holidayId: 'HHX', raisedAtISO: '2026-07-21T08:00:00' }] },
    })
    const surgeonOnly = view('A2', { kind: 'private', id: 'surgeon-only', patch: { hospitalId } })
    return render(
      <DayGrid
        anaesthetists={[anaesthetist('A1', 'Dr Ana Alpha'), anaesthetist('A2', 'Dr Bea Beta')]}
        viewsByAnaesthetist={{ A1: [conflicted], A2: [surgeonOnly] }}
        masters={masters}
        warningFlags={new Map()}
        onSelectSlot={vi.fn()}
      />,
    )
  }

  it('a conflicted block takes the warning tint and the reason line, keeping its kind\'s left bar; a surgeon-only block does not', () => {
    const { container } = renderConflictGrid()
    const conflicted = container.querySelector('[data-list-id="conflicted"]') as HTMLElement
    const surgeonOnly = container.querySelector('[data-list-id="surgeon-only"]') as HTMLElement
    expect(conflicted).toHaveAttribute('data-conflict', 'true')
    expect(conflicted.textContent).toContain('Hospital closed')
    expect(conflicted.textContent).toContain('!')
    expect(conflicted.style.background).not.toBe(surgeonOnly.style.background)
    expect(conflicted.style.boxShadow).toBe(surgeonOnly.style.boxShadow)
    expect(surgeonOnly).not.toHaveAttribute('data-conflict')
    expect(surgeonOnly.textContent).toContain(useAppStore.getState().masters.surgeons[Object.keys(useAppStore.getState().masters.surgeons)[0]!]!.name)
    expect(container.textContent).not.toContain('Surgeon TBC')
  })

  it('the Conflict chip shows only conflicted blocks', () => {
    const { container } = renderConflictGrid()
    fireEvent.click(screen.getByRole('button', { name: 'Conflict' }))
    expect(container.querySelector('[data-list-id="conflicted"]')).not.toBeNull()
    expect(container.querySelector('[data-list-id="surgeon-only"]')).toBeNull()
  })
})

describe('DayGrid pairing (catch-up Phase 31: every List names a hospital and a surgeon)', () => {
  it('an acute or pre-op block keeps its template label and carries its surgeon in the tooltip; no block reads Surgeon TBC', () => {
    const masters = useAppStore.getState().masters
    const acute = view('A1', { kind: 'public', id: 'acute', patch: { hospitalId: 'H-CPH', surgeonId: 'S-OKAFOR', notes: 'Acute theatre' } })
    const preop = view('A2', { kind: 'preop', id: 'preop', patch: { hospitalId: 'H-AAROOMS', surgeonId: 'S-PATEL', notes: 'Pre-op clinic / AA rooms' } })
    const { container } = render(
      <DayGrid
        anaesthetists={[anaesthetist('A1', 'Dr Ana Alpha'), anaesthetist('A2', 'Dr Bea Beta')]}
        viewsByAnaesthetist={{ A1: [acute], A2: [preop] }}
        masters={masters}
        warningFlags={new Map()}
        onSelectSlot={vi.fn()}
      />,
    )
    const acuteBlock = container.querySelector('[data-list-id="acute"]') as HTMLElement
    expect(acuteBlock.textContent).toContain('Christchurch Public')
    expect(acuteBlock.textContent).toContain('Acute theatre')
    expect(acuteBlock.getAttribute('title')).toContain('Mr C. Okafor')
    const preopBlock = container.querySelector('[data-list-id="preop"]') as HTMLElement
    expect(preopBlock.textContent).toContain('Pre-op clinic / AA rooms')
    expect(preopBlock.getAttribute('title')).toContain('Ms K. Patel')
    // A template label is the subtitle, not an office note: no note dot.
    expect(screen.queryByTitle(/^Note:/)).toBeNull()
    expect(container.textContent).not.toContain('Surgeon TBC')
  })
})

describe('DayGrid Draft Lists band and booking counts (catch-up Phase 31; US-13.1.1)', () => {
  function renderWithDrafts(withDrafts: boolean) {
    useAppStore.setState(freshAppState())
    const state = useAppStore.getState()
    const drafts = withDrafts ? draftListsForDate(state, '2026-07-21') : []
    const counts = bookingCountsByList(state.schedule.bookings)
    const list = view('A1', { kind: 'private', id: 'counted' })
    return render(
      <DayGrid
        anaesthetists={[anaesthetist('A1', 'Dr Ana Alpha')]}
        viewsByAnaesthetist={{ A1: [list] }}
        masters={state.masters}
        warningFlags={new Map()}
        onSelectSlot={vi.fn()}
        draftLists={drafts}
        bookingCounts={new Map([...counts, ['counted', 3]])}
        onOpenDraftList={vi.fn()}
      />,
    )
  }

  it('shows the day\'s Draft Lists in a band, flagged Unassigned, with the waiting time and booking count; the footer counts them', () => {
    const { container } = renderWithDrafts(true)
    const band = container.querySelector('[data-shot="daygrid-draft-band"]') as HTMLElement
    expect(band).not.toBeNull()
    expect(band.getAttribute('data-draft-band-count')).toBe('2')
    const stg = container.querySelector('[data-draft-block="LD-001"]') as HTMLElement
    expect(stg).toHaveTextContent('UNASSIGNED')
    expect(stg).toHaveTextContent("St George's · Mr S. Tan")
    expect(stg).toHaveTextContent('16 h')
    expect(container.querySelector('[data-draft-block="LD-RCB016-2026-07-21-AM"]')).toHaveTextContent('Dr Ngata unavailable')
    expect(screen.getByText(/2 Draft Lists unassigned/)).toBeInTheDocument()
  })

  it('has no band on a day without Draft Lists', () => {
    const { container } = renderWithDrafts(false)
    expect(container.querySelector('[data-shot="daygrid-draft-band"]')).toBeNull()
  })

  it('every List block shows its booking count', () => {
    const { container } = renderWithDrafts(false)
    expect(container.querySelector('[data-list-id="counted"] [data-shot="daygrid-block-count"]')?.getAttribute('data-booking-count')).toBe('3')
  })
})
