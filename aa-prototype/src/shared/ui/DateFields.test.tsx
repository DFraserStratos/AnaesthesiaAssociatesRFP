import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { acceptedJumpDate, DateJumpInput, FilterDateInput, TimeRangeFields } from './DateFields'

/** UI unification U4 (U27): the date and time parts. */
describe('acceptedJumpDate (the jump guard)', () => {
  it('drops partial years typed into a native date input', () => {
    expect(acceptedJumpDate('0002-03-13')).toBeNull()
    expect(acceptedJumpDate('0202-03-13', '2026-01-01')).toBeNull()
    expect(acceptedJumpDate('2026-3-13')).toBeNull()
  })
  it('drops dates outside the bounds and takes a full date inside them', () => {
    expect(acceptedJumpDate('2025-12-31', '2026-01-01', '2026-12-31')).toBeNull()
    expect(acceptedJumpDate('2027-01-01', '2026-01-01', '2026-12-31')).toBeNull()
    expect(acceptedJumpDate('2026-07-21', '2026-01-01', '2026-12-31')).toBe('2026-07-21')
    expect(acceptedJumpDate('2026-07-21', undefined, '2026-11-21')).toBe('2026-07-21')
  })
})

describe('DateJumpInput', () => {
  it('is always named: by its visible label, or by aria-label when hidden', () => {
    render(
      <>
        <DateJumpInput label="Go to date" value="" onPick={() => undefined} height={36} max="2026-11-21" />
        <DateJumpInput label="Jump here" labelVisible value="" onPick={() => undefined} height={38} testId="jump" />
      </>,
    )
    expect(screen.getByLabelText('Go to date')).toHaveAttribute('max', '2026-11-21')
    expect(screen.getByLabelText('Jump here')).toHaveAttribute('data-testid', 'jump')
  })

  it('emits only full in-bounds dates, and null when cleared', () => {
    const onPick = vi.fn()
    render(<DateJumpInput label="Go to date" value="2026-07-21" min="2026-01-01" max="2026-11-21" onPick={onPick} height={38} />)
    const input = screen.getByLabelText('Go to date')
    fireEvent.change(input, { target: { value: '2027-01-05' } })
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '2026-08-03' } })
    expect(onPick).toHaveBeenLastCalledWith('2026-08-03')
    fireEvent.change(input, { target: { value: '' } })
    expect(onPick).toHaveBeenLastCalledWith(null)
  })
})

describe('FilterDateInput', () => {
  it('is a compact white date with its label', () => {
    render(<FilterDateInput label="From" value="" onChange={() => undefined} />)
    expect(screen.getByLabelText('From')).toHaveStyle({ height: '36px', background: '#FFFFFF' })
  })
})

describe('TimeRangeFields', () => {
  it('ties both labels and the hint to each time', () => {
    render(<TimeRangeFields value={{ start: '08:00', end: '12:00' }} onChange={() => undefined} startLabel="AM start" endLabel="AM end" optional hint="Leave blank for the default session times." />)
    const start = screen.getByLabelText('AM start (optional)')
    const end = screen.getByLabelText('AM end (optional)')
    expect(start).toHaveAttribute('type', 'time')
    expect(start).toHaveClass('aa-field')
    expect(start).toHaveAccessibleDescription('Leave blank for the default session times.')
    expect(end).toHaveAccessibleDescription('Leave blank for the default session times.')
  })
})

describe('DateJumpInput beyondMax (Admin Day)', () => {
  it('takes a full date past max, still drops a partial year', () => {
    const onPick = vi.fn()
    render(<DateJumpInput label="Go to date" value="2026-07-21" max="2026-11-21" onPick={onPick} height={36} beyondMax />)
    const input = screen.getByLabelText('Go to date')
    fireEvent.change(input, { target: { value: '0002-03-13' } })
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '2027-02-01' } })
    expect(onPick).toHaveBeenLastCalledWith('2027-02-01')
  })
})
