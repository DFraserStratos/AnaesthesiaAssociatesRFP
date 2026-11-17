import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { neutral, radius } from '../../theme/tokens'
import { AddRowButton } from './AddRowButton'
import { DayChip } from './DayChip'

/** UI unification U6 (U35): the small repeats moved onto one component each. */
describe('DayChip', () => {
  it('closes the day by keyboard under its full name; desktop 32 high', () => {
    const onClose = vi.fn()
    render(<DayChip dateISO="2026-03-13" onClose={onClose} />)
    const chip = screen.getByRole('button', { name: 'Friday 13 March 2026. Close the day and go back to your Lists' })
    expect(chip).toHaveAttribute('type', 'button')
    expect(chip).toHaveStyle({ height: '32px' })
    chip.focus()
    expect(document.activeElement).toBe(chip)
    fireEvent.click(chip)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('touch: 44 high with its test id', () => {
    render(<DayChip dateISO="2026-03-13" onClose={() => {}} size="touch" testId="mobile-lists-day-chip" />)
    expect(screen.getByTestId('mobile-lists-day-chip')).toHaveStyle({ height: '44px', minWidth: '44px' })
  })
})

describe('AddRowButton', () => {
  it('is a type="button" dashed row that adds; desktop radius 10, touch radius 14', () => {
    const onClick = vi.fn()
    const { rerender } = render(<AddRowButton onClick={onClick}>Add a booking</AddRowButton>)
    const button = screen.getByRole('button', { name: 'Add a booking' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveStyle({ border: `1.5px dashed ${neutral.lineStrong}`, borderRadius: `${radius.ctl}px`, fontSize: '14px' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
    rerender(<AddRowButton onClick={onClick} size="touch">Add a booking</AddRowButton>)
    expect(screen.getByRole('button', { name: 'Add a booking' })).toHaveStyle({ borderRadius: `${radius.card}px`, fontSize: '15px' })
  })
})
