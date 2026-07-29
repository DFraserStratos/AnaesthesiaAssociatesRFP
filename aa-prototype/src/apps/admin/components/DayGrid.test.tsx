import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Anaesthetist, List } from '../../../domain/types'
import { useAppStore } from '../../../store'
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
    active: true,
  }
}

function list(
  id: string,
  anaesthetistId: string,
  statusKey: List['statusKey'],
  patch: Partial<List> = {},
): List {
  return {
    id,
    dateISO: DATE,
    anaesthetistId,
    session: 'AM',
    state: 'DRAFT',
    statusKey,
    conflicts: [],
    ...patch,
  }
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
  const attention = list('attention', 'A1', 'private')
  const noted = list('noted', 'A2', 'public', { surgeonId, notes: 'Called hospital' })
  const prepaid = list('prepaid', 'A3', 'free', { notes: 'Free / open for cover' })
  const holiday = list('holiday', 'A4', 'holiday', { notes: 'Annual leave' })

  return render(
    <DayGrid
      anaesthetists={anaesthetists}
      listsByAnaesthetist={{
        A1: [attention],
        A2: [noted],
        A3: [prepaid],
        A4: [holiday],
      }}
      masters={masters}
      activeCardCounts={{}}
      prepaymentFlags={new Map([['prepaid', 'outstanding']])}
      onSelectList={vi.fn()}
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
    const prepaymentFilter = screen.getByRole('button', { name: 'Pre-payment flagged' })

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
    expect(screen.getByRole('button', { name: /open for cover/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(attentionFilter).toHaveAttribute('aria-pressed', 'false')
    expect(noteFilter).toHaveAttribute('aria-pressed', 'false')
    expect(prepaymentFilter).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('4 of 4 anaesthetists have matching blocks. Showing 4 of 4 blocks.', { exact: false })).toBeInTheDocument()
  })
})
