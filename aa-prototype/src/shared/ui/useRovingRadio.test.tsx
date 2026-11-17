import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useRovingRadio } from './useRovingRadio'

/** UI unification U4 (U34): one radio keyboard model. */
function Group({ selectOnMove = true, onPick }: { selectOnMove?: boolean; onPick?: (v: string) => void }) {
  const values = ['a', 'b', 'c', 'd'] as const
  const [value, setValue] = useState<string | undefined>('b')
  const radio = useRovingRadio({
    values,
    value,
    onChange: (v) => {
      setValue(v)
      onPick?.(v)
    },
    isDisabled: (v) => v === 'c',
    selectOnMove,
  })
  return (
    <div {...radio.groupProps} aria-label="Letters">
      {values.map((v, i) => (
        <button key={v} type="button" {...radio.itemProps(i)} onClick={() => setValue(v)}>
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

describe('useRovingRadio', () => {
  it('gives the group one Tab stop: the checked option', () => {
    render(<Group />)
    const radios = screen.getAllByRole('radio')
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1])
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true')
  })

  it('arrows move and select, skipping a disabled option', () => {
    render(<Group />)
    const b = screen.getByRole('radio', { name: 'B' })
    b.focus()
    fireEvent.keyDown(b, { key: 'ArrowDown' })
    const d = screen.getByRole('radio', { name: 'D' })
    expect(d).toHaveFocus()
    expect(d).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(d, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus()
  })

  it('Home and End jump to the ends', () => {
    render(<Group />)
    const b = screen.getByRole('radio', { name: 'B' })
    b.focus()
    fireEvent.keyDown(b, { key: 'End' })
    expect(screen.getByRole('radio', { name: 'D' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('radio', { name: 'D' }), { key: 'Home' })
    expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus()
  })

  it('selectOnMove false moves focus only', () => {
    const onPick = vi.fn()
    render(<Group selectOnMove={false} onPick={onPick} />)
    const b = screen.getByRole('radio', { name: 'B' })
    b.focus()
    fireEvent.keyDown(b, { key: 'ArrowUp' })
    expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus()
    expect(onPick).not.toHaveBeenCalled()
    expect(b).toHaveAttribute('aria-checked', 'true')
  })
})
