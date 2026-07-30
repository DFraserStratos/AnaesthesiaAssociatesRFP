import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SuccessOverlay } from './SuccessOverlay'

describe('SuccessOverlay', () => {
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
    render(<SuccessOverlay title="List submitted" testId="list-submission-overlay" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('runs the owner dismissal when the flood is tapped', () => {
    const onDismiss = vi.fn()
    render(<SuccessOverlay title="Card complete" onDismiss={onDismiss} />)

    // The valve is a real button, not a click handler on the flood, so
    // assistive tech and keyboards can reach it too.
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
