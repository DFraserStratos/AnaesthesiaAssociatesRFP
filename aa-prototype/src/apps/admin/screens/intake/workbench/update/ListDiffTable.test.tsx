import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ListChangeRow } from '../../../../../../domain/intake/listChanges'
import { ListDiffTable } from './ListDiffTable'

const ROWS: ListChangeRow[] = [
  {
    rowId: 'r-time',
    change: 'changed',
    status: 'open',
    patientName: 'Peter Lindqvist',
    nhi: 'ZLM2290',
    dobISO: '1958-08-02',
    scheduledTime: '10:45',
    procedureText: 'Arthroscopy left knee',
    bookingId: 'b-peter',
    diffs: [{ key: 'time', label: 'Time', current: '10:30', incoming: '10:45', effect: 'sets' }],
    flags: [],
  },
  { rowId: 'r-added', change: 'added', status: 'open', patientName: 'Hannah Brooks', nhi: 'ZBR5521', scheduledTime: '12:30', procedureText: 'Arthroscopy right knee', diffs: [], flags: [] },
  { rowId: 'r-removed', change: 'removed', status: 'open', patientName: 'Tom Walker', nhi: 'ZWA1100', scheduledTime: '13:00', procedureText: 'Carpal tunnel release', bookingId: 'b-tom', diffs: [], flags: [] },
  { rowId: 'r-stub', change: 'changed', status: 'open', patientName: 'Sina Faleolo', nhi: 'ZFA3306', scheduledTime: '11:00', procedureText: 'ACL recon', diffs: [], flags: [] },
  { rowId: 'r-blocked', change: 'added', status: 'open', patientName: 'Mere Tipene', nhi: 'ZTI8812', scheduledTime: '14:00', diffs: [], flags: [] },
]

const STUBS = {
  'r-stub': [
    { stubId: 's-1', label: 'Sina Faleolo · 30 Jan 1994' },
    { stubId: 's-2', label: 'S Faleolo · 30 Jan 1994' },
  ],
}
const BLOCKERS = { 'r-blocked': 'No wording and no RVG code to add it with' }

function rowOf(rowId: string): HTMLElement {
  const tr = document.querySelector<HTMLElement>(`tr[data-row-id="${rowId}"]`)
  if (tr === null) throw new Error(`no row ${rowId}`)
  return tr
}

function setup(extra: Partial<Parameters<typeof ListDiffTable>[0]> = {}) {
  const onToggle = vi.fn()
  const onStubChoice = vi.fn()
  render(
    <ListDiffTable
      rows={ROWS}
      ticked={new Set(['r-time', 'r-removed', 'r-stub', 'r-blocked'])}
      onToggle={onToggle}
      blockers={BLOCKERS}
      stubs={STUBS}
      onStubChoice={onStubChoice}
      {...extra}
    />,
  )
  return { onToggle, onStubChoice }
}

describe('ListDiffTable', () => {
  it('ticks reflect the ticked set and toggling calls onToggle', () => {
    const { onToggle } = setup()
    const time = screen.getByRole('checkbox', { name: 'Apply the change to Peter Lindqvist' })
    const added = screen.getByRole('checkbox', { name: 'Apply the change to Hannah Brooks' })
    expect(time).toBeChecked()
    expect(added).not.toBeChecked()
    expect(rowOf('r-time').getAttribute('data-ticked')).toBe('true')
    expect(rowOf('r-time').getAttribute('data-booking-id')).toBe('b-peter')
    expect(rowOf('r-added').getAttribute('data-change')).toBe('added')
    fireEvent.click(added)
    expect(onToggle).toHaveBeenCalledWith('r-added', true)
    fireEvent.click(time)
    expect(onToggle).toHaveBeenCalledWith('r-time', false)
  })

  it('shows a time change as the current struck beside the new, under a Time pill', () => {
    setup()
    const row = within(rowOf('r-time'))
    expect(row.getByText('10:30').tagName).toBe('S')
    expect(row.getByText('10:45')).toBeInTheDocument()
    expect(row.getByText('Time')).toBeInTheDocument()
    expect(within(rowOf('r-added')).getByText('Added')).toBeInTheDocument()
  })

  it('strikes a removal through and names its tick as confirming the removal', () => {
    setup()
    const box = screen.getByRole('checkbox', { name: 'Confirm removal of Tom Walker' })
    expect(box).toBeChecked()
    const row = rowOf('r-removed')
    expect(row.querySelectorAll('td[data-struck]').length).toBe(3)
    const name = within(row).getByText('Tom Walker').closest('td')
    expect(name?.style.textDecoration).toBe('line-through')
    expect(within(row).getByText('Removal')).toBeInTheDocument()
  })

  it('disables a blocked row, unticked, with its reason shown', () => {
    setup()
    const box = screen.getByRole('checkbox', { name: 'Apply the change to Mere Tipene' })
    expect(box).toBeDisabled()
    expect(box).not.toBeChecked()
    expect(rowOf('r-blocked').getAttribute('data-ticked')).toBe('false')
    expect(within(rowOf('r-blocked')).getByText(BLOCKERS['r-blocked'])).toBeInTheDocument()
  })

  it('reads a stub row as the stub becoming a Booking and offers its two stubs, unticked until chosen', () => {
    const { onStubChoice } = setup()
    const row = within(rowOf('r-stub'))
    expect(row.getByText('NHI arrives, stub becomes a Booking')).toBeInTheDocument()
    expect(row.getByText('Stub to Booking')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Apply the change to Sina Faleolo' })).toBeDisabled()
    const choices = row.getAllByRole('radio')
    expect(choices.map((c) => c.textContent)).toEqual(STUBS['r-stub'].map((s) => s.label))
    fireEvent.click(choices[1] as HTMLElement)
    expect(onStubChoice).toHaveBeenCalledWith('r-stub', 's-2')
  })

  it('ticks a stub row once its stub is chosen', () => {
    setup({ stubChoice: { 'r-stub': 's-1' } })
    const box = screen.getByRole('checkbox', { name: 'Apply the change to Sina Faleolo' })
    expect(box).not.toBeDisabled()
    expect(box).toBeChecked()
    expect(within(rowOf('r-stub')).getByRole('radio', { name: STUBS['r-stub'][0]?.label })).toHaveAttribute('aria-checked', 'true')
  })

  it('shows the row action and the matcher warnings on their row', () => {
    setup({
      rowAction: (r) => (r.rowId === 'r-time' ? <span data-testid="row-action">View as received</span> : null),
      warnings: { 'r-added': ['Balance check'] },
    })
    expect(within(rowOf('r-time')).getByTestId('row-action')).toHaveTextContent('View as received')
    expect(screen.getAllByTestId('row-action')).toHaveLength(1)
    expect(within(rowOf('r-added')).getByText('Balance check')).toBeInTheDocument()
  })

  it('read only shows no ticks and each row its decision', () => {
    const decided = ROWS.map((r, i) => ({ ...r, status: (['applied', 'leftOut', 'rejected', 'applied', 'leftOut'] as const)[i] ?? 'applied' }))
    render(<ListDiffTable rows={decided} ticked={new Set()} onToggle={() => {}} readOnly />)
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(within(rowOf('r-time')).getByText('Applied')).toBeInTheDocument()
    expect(within(rowOf('r-added')).getByText('Left out')).toBeInTheDocument()
    expect(within(rowOf('r-removed')).getByText('Rejected')).toBeInTheDocument()
  })

  it('puts its shot on the table', () => {
    setup()
    expect(document.querySelector('[data-shot="intake-update-diff"]')).not.toBeNull()
  })
})
