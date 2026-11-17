import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { monthCells } from '../availability/monthCells'
import { calendarKeyTarget, clampToBounds } from './useCalendarKeys'
import { useCalendarKeys } from './useCalendarKeys'
import { MonthHeaderRow } from './MonthHeaderRow'

/** UI unification U4 (U33): the one calendar key model and the month header. */
describe('calendarKeyTarget', () => {
  it('moves by day, week, within the week, by month and by year', () => {
    expect(calendarKeyTarget('ArrowRight', false, '2026-07-21')).toBe('2026-07-22')
    expect(calendarKeyTarget('ArrowUp', false, '2026-07-21')).toBe('2026-07-14')
    expect(calendarKeyTarget('Home', false, '2026-07-23')).toBe('2026-07-20')
    expect(calendarKeyTarget('End', false, '2026-07-21')).toBe('2026-07-26')
    expect(calendarKeyTarget('PageDown', false, '2026-07-21')).toBe('2026-08-21')
    expect(calendarKeyTarget('PageUp', true, '2026-07-21')).toBe('2025-07-21')
    expect(calendarKeyTarget('Enter', false, '2026-07-21')).toBeNull()
  })
  it('clamps only when bounds are given', () => {
    expect(clampToBounds('2026-12-25', { firstISO: '2026-07-01', lastISO: '2026-11-21' })).toBe('2026-11-21')
    expect(clampToBounds('2026-12-25', undefined)).toBe('2026-12-25')
  })
})

function Calendar({ bounded }: { bounded: boolean }) {
  const [month, setMonth] = useState('2026-07')
  const [focus, setFocus] = useState('2026-07-21')
  const keys = useCalendarKeys({
    monthISO: month,
    focusISO: focus,
    onFocusMove: setFocus,
    onMonthChange: setMonth,
    ...(bounded ? { bounds: { firstISO: '2026-07-01', lastISO: '2026-07-31' } } : {}),
  })
  return (
    <div>
      <span data-testid="month">{month}</span>
      {monthCells(month).map((d, i) => (d === null ? <span key={i} /> : <button key={d} type="button" {...keys.dayProps(d)} aria-label={d}>{d.slice(8)}</button>))}
    </div>
  )
}

describe('useCalendarKeys', () => {
  it('one tab stop; arrows move focus; a move past the month changes the month', () => {
    render(<Calendar bounded={false} />)
    const day = screen.getByRole('button', { name: '2026-07-21' })
    expect(day).toHaveAttribute('tabindex', '0')
    expect(screen.getAllByRole('button').filter((b) => b.tabIndex === 0)).toHaveLength(1)
    day.focus()
    fireEvent.keyDown(day, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: '2026-07-28' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('button', { name: '2026-07-28' }), { key: 'PageDown' })
    expect(screen.getByTestId('month')).toHaveTextContent('2026-08')
    expect(screen.getByRole('button', { name: '2026-08-28' })).toHaveFocus()
  })

  it('with bounds, a move past the bound stays put', () => {
    render(<Calendar bounded />)
    const day = screen.getByRole('button', { name: '2026-07-21' })
    day.focus()
    fireEvent.keyDown(day, { key: 'PageDown' })
    expect(screen.getByTestId('month')).toHaveTextContent('2026-07')
    expect(screen.getByRole('button', { name: '2026-07-31' })).toHaveFocus()
  })
})

describe('MonthHeaderRow', () => {
  it('is hidden from screen readers and Monday first', () => {
    const { container } = render(<MonthHeaderRow variant="short" />)
    const row = container.firstElementChild!
    expect(row).toHaveAttribute('aria-hidden')
    expect(row.textContent).toMatch(/^Mon/)
  })
})
