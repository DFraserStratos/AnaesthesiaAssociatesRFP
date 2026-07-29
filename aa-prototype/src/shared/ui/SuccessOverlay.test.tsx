import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
