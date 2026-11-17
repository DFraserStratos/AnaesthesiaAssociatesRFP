import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NumberStepper } from './ui'

/** UI unification U4 (U34): the one whole-number stepper. */
function Harness({ typeable, onOuterKey }: { typeable?: boolean; onOuterKey?: () => void }) {
  const [n, setN] = useState(2)
  return (
    <div onKeyDown={onOuterKey}>
      <NumberStepper value={n} onChange={setN} min={1} max={3} label="units" {...(typeable === true ? { typeable: { name: 'Units' } } : {})} />
    </div>
  )
}

describe('NumberStepper', () => {
  it('names its buttons and disables them at the bounds', () => {
    render(<Harness />)
    const more = screen.getByRole('button', { name: 'More units' })
    fireEvent.click(more)
    expect(more).toBeDisabled()
    expect(screen.getByText('3')).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: 'Fewer units' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fewer units' }))
    expect(screen.getByRole('button', { name: 'Fewer units' })).toBeDisabled()
  })

  it('the typed edit saves on Enter and returns focus to the value', () => {
    render(<Harness typeable />)
    fireEvent.click(screen.getByRole('button', { name: 'Units 2. Type a value' }))
    const input = screen.getByRole('textbox', { name: 'Units' })
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('button', { name: 'Units 3. Type a value' })).toHaveFocus()
  })

  it('Enter does not reopen the edit it just saved (the press is consumed)', () => {
    render(<Harness typeable />)
    fireEvent.click(screen.getByRole('button', { name: 'Units 2. Type a value' }))
    const input = screen.getByRole('textbox', { name: 'Units' })
    fireEvent.change(input, { target: { value: '3' } })
    const notCancelled = fireEvent.keyDown(input, { key: 'Enter' })
    expect(notCancelled).toBe(false)
    expect(screen.queryByRole('textbox', { name: 'Units' })).toBeNull()
  })

  it('Escape cancels and does not reach the sheet behind', () => {
    const outer = vi.fn()
    render(<Harness typeable onOuterKey={outer} />)
    fireEvent.click(screen.getByRole('button', { name: 'Units 2. Type a value' }))
    const input = screen.getByRole('textbox', { name: 'Units' })
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Units 2. Type a value' })).toBeInTheDocument()
    expect(outer).not.toHaveBeenCalled()
  })

  it('a typed number out of bounds is not taken', () => {
    render(<Harness typeable />)
    fireEvent.click(screen.getByRole('button', { name: 'Units 2. Type a value' }))
    const input = screen.getByRole('textbox', { name: 'Units' })
    fireEvent.change(input, { target: { value: '9' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('button', { name: 'Units 2. Type a value' })).toBeInTheDocument()
  })
})
