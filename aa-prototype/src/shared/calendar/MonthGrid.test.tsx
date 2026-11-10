import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MonthGrid } from './MonthGrid'

afterEach(cleanup)

const BOUNDS = { firstISO: '2026-01-12', lastISO: '2026-11-21' }

function Harness({ onPick = vi.fn(), start = '2026-07' }: { onPick?: (d: string) => void; start?: string }) {
  const [month, setMonth] = useState(start)
  return (
    <MonthGrid
      monthISO={month}
      onMonthChange={setMonth}
      bounds={BOUNDS}
      todayISO="2026-07-21"
      dayLabel={(d) => `Day ${d}`}
      renderDay={(d) => <span>{Number(d.slice(8))}</span>}
      onPickDay={onPick}
    />
  )
}

describe('MonthGrid', () => {
  it('labels every day, marks today, and picks a day', () => {
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)
    const today = screen.getByRole('button', { name: 'Day 2026-07-21' })
    expect(today).toHaveAttribute('aria-current', 'date')
    expect(today).toHaveAttribute('tabindex', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Day 2026-07-14' }))
    expect(onPick).toHaveBeenCalledWith('2026-07-14')
  })

  it('stops previous at the first month and makes days before the bound inert', () => {
    render(<Harness start="2026-01" />)
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Day 2026-01-05' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Day 2026-01-12' })).not.toBeDisabled()
  })

  it('stops next at the horizon month', () => {
    render(<Harness start="2026-11" />)
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Day 2026-11-22' })).toBeDisabled()
  })

  it('jumps by month and year through the title', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /July 2026\. Choose a month and year/ }))
    expect(screen.getByRole('button', { name: 'December 2026' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'March 2026' }))
    expect(screen.getByRole('button', { name: 'Day 2026-03-13' })).toBeInTheDocument()
  })

  it('an arrow key at a bound stays put and does not later pull focus into the grid', () => {
    render(<Harness start="2026-01" />)
    const first = screen.getByRole('button', { name: 'Day 2026-01-12' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(first)
    const next = screen.getByRole('button', { name: 'Next month' })
    next.focus()
    fireEvent.click(next)
    expect(document.activeElement).toBe(next)
  })

  it('moves focus with the arrow keys, Home, End and PageUp, across months', () => {
    render(<Harness />)
    const today = screen.getByRole('button', { name: 'Day 2026-07-21' })
    today.focus()
    fireEvent.keyDown(today, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Day 2026-07-22' }))
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Day 2026-07-29' }))
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Day 2026-07-27' }))
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Day 2026-08-02' }))
    fireEvent.keyDown(document.activeElement!, { key: 'PageUp' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Day 2026-07-02' }))
  })
})
