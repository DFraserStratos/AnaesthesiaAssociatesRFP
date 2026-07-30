import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '../../theme/motion'
import { CompletionOverlay } from './CompletionOverlay'

/** When `SuccessOverlay` arms its escape hatch. Read from the tokens for the
 *  same reason its own test does: retuning the complete-tick retunes this. */
const ARM_AFTER = motion.completeTick.drawDelay + motion.completeTick.drawDuration

describe('CompletionOverlay calculation display', () => {
  it('follows the selected off, units and fee modes', () => {
    const view = render(<CompletionOverlay units={3} fee={79.5} mode="fee" />)
    expect(screen.getByText('3 units · $79.50')).toBeInTheDocument()

    view.rerender(<CompletionOverlay units={3} fee={79.5} mode="units" />)
    expect(screen.getByText('3 units')).toBeInTheDocument()
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()

    view.rerender(<CompletionOverlay units={3} fee={79.5} mode="off" />)
    expect(screen.getByText('Card complete')).toBeInTheDocument()
    expect(screen.queryByText(/3 units/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
  })
})

describe('CompletionOverlay dismissal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is inert while the screen owns the timing alone', () => {
    render(<CompletionOverlay units={3} fee={79.5} mode="fee" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('runs the screen dismissal when the flood is tapped', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<CompletionOverlay units={3} fee={79.5} mode="fee" onDismiss={onDismiss} />)

    // The valve is deliberately absent until the complete-tick has drawn, so the
    // finger that just tapped "Mark complete" cannot swallow the moment. Wait it
    // out before tapping; `SuccessOverlay`'s own test pins the timing itself.
    act(() => vi.advanceTimersByTime(ARM_AFTER))

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
