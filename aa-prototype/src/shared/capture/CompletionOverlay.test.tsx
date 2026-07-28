import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompletionOverlay } from './CompletionOverlay'

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
