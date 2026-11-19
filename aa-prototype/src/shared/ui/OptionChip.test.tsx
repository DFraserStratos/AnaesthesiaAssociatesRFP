import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OptionChip } from './OptionChip'

afterEach(cleanup)

describe('OptionChip', () => {
  it('is a toggle button whose aria-pressed follows pressed, with its data-* hooks', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <OptionChip pressed={false} onClick={onClick} shot="reason-chip" data-reason="wrong">
        Wrong amount
      </OptionChip>,
    )
    const chip = screen.getByRole('button', { name: 'Wrong amount' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(chip).toHaveAttribute('data-shot', 'reason-chip')
    expect(chip).toHaveAttribute('data-reason', 'wrong')
    fireEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <OptionChip pressed onClick={onClick}>
        Wrong amount
      </OptionChip>,
    )
    expect(screen.getByRole('button', { name: 'Wrong amount' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('as role="radio" reads aria-checked, not aria-pressed', () => {
    render(
      <div role="radiogroup" aria-label="Funder">
        <OptionChip role="radio" pressed onClick={() => undefined}>
          nib
        </OptionChip>
        <OptionChip role="radio" pressed={false} onClick={() => undefined}>
          None
        </OptionChip>
      </div>,
    )
    const nib = screen.getByRole('radio', { name: 'nib' })
    expect(nib).toHaveAttribute('aria-checked', 'true')
    expect(nib).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('radio', { name: 'None' })).toHaveAttribute('aria-checked', 'false')
  })
})
