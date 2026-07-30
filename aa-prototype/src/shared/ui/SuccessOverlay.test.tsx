import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motion } from '../../theme/motion'
import { SuccessOverlay } from './SuccessOverlay'

/**
 * When the escape hatch arms. Read from the tokens rather than written as 420,
 * so retuning the complete-tick retunes the test with it.
 */
const ARM_AFTER = motion.completeTick.drawDelay + motion.completeTick.drawDuration

describe('SuccessOverlay', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('announces its title and supporting message as a status', () => {
    render(
      <SuccessOverlay title="List submitted" testId="list-submission-overlay">
        <span>Sent to the office for review</span>
      </SuccessOverlay>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('List submitted')
    expect(screen.getByText('Sent to the office for review')).toBeInTheDocument()
    expect(screen.getByTestId('list-submission-overlay')).toBeInTheDocument()
  })

  it('offers no dismiss control when the owner keeps sole control of the timing', () => {
    vi.useFakeTimers()
    render(<SuccessOverlay title="List submitted" testId="list-submission-overlay" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    // No arming timer either: with no handler to run, the overlay stays inert
    // for as long as the owner leaves it up.
    act(() => vi.advanceTimersByTime(ARM_AFTER * 2))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('holds the escape hatch back until the tick has drawn, then runs the owner dismissal', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<SuccessOverlay title="Card complete" onDismiss={onDismiss} />)

    // The full-bleed valve lands where the finger that opened the overlay
    // already is, so while the tick draws there must be nothing to hit — an
    // impatient second tap cannot swallow the completion moment.
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(ARM_AFTER - 1))
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))

    // The valve is a real button, not a click handler on the flood, so
    // assistive tech and keyboards can reach it too — and it arms with ~600ms
    // still to run on the owner's own 1050ms timer.
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('arms at the reduced-motion fade when the user asked for less motion', () => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    render(<SuccessOverlay title="Card complete" onDismiss={vi.fn()} />)

    act(() => vi.advanceTimersByTime(motion.reducedMotionFade))

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('drops its pending timers when the owner unmounts it first', () => {
    vi.useFakeTimers()
    const view = render(<SuccessOverlay title="Card complete" onDismiss={vi.fn()} />)

    view.unmount()

    // Neither the arming timer nor the completion haptic may fire into a
    // torn-down overlay.
    expect(vi.getTimerCount()).toBe(0)
  })
})
