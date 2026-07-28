import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlidingSegmentedControl } from './SlidingSegmentedControl'

const OPTIONS = [
  { value: 'one', label: 'One' },
  { value: 'two', label: <span>Two rich</span> },
  { value: 'three', label: 'Three', disabled: true },
] as const

describe('SlidingSegmentedControl', () => {
  it('exposes the selected segment and calls immediately for new and repeated selections', () => {
    const onSelect = vi.fn()
    render(
      <SlidingSegmentedControl
        value="one"
        options={OPTIONS}
        onSelect={onSelect}
        ariaLabel="Example choice"
      />,
    )

    expect(screen.getByRole('group', { name: 'Example choice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'One' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Two rich' })).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('[data-sliding-segment-indicator]')).toHaveStyle({
      opacity: '1',
      transition: 'none',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Two rich' }))
    expect(onSelect).toHaveBeenLastCalledWith('two')

    fireEvent.click(screen.getByRole('button', { name: 'One' }))
    expect(onSelect).toHaveBeenLastCalledWith('one')
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it('keeps disabled options inert', () => {
    const onSelect = vi.fn()
    render(<SlidingSegmentedControl value="one" options={OPTIONS} onSelect={onSelect} />)

    const disabled = screen.getByRole('button', { name: 'Three' })
    expect(disabled).toBeDisabled()
    fireEvent.click(disabled)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('supports a nullable selection and hides its highlight', () => {
    const { container } = render(
      <SlidingSegmentedControl value={undefined} options={OPTIONS} onSelect={() => undefined} />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(3)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
    expect(container.querySelector('[data-sliding-segment-indicator]')).toHaveStyle({ opacity: '0' })
  })

  it('disables the complete control without losing its visible selection', () => {
    render(
      <SlidingSegmentedControl
        value="two"
        options={OPTIONS}
        onSelect={() => undefined}
        disabled
      />,
    )

    expect(screen.getByRole('button', { name: 'Two rich' })).toHaveAttribute('aria-pressed', 'true')
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
