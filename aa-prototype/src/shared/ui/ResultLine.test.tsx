import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { semantic } from '../../theme/tokens'
import { ResultLine } from './ResultLine'

/** UI unification U3 (U12): the one "it worked" line, in success green, always announced. */
describe('ResultLine', () => {
  it('the live region is present before any line, hidden and empty', () => {
    render(<ResultLine line={null} shot="r" />)
    const region = screen.getByRole('status')
    expect(region).not.toHaveAttribute('data-shot')
    expect(region).toBeEmptyDOMElement()
    expect(region).toHaveStyle({ position: 'absolute', width: '1px' })
  })

  it('the text arrives inside the same region, in the success tint', () => {
    const { rerender } = render(<ResultLine line={null} shot="r" />)
    const region = screen.getByRole('status')
    rerender(<ResultLine line="Your three days off are saved." shot="r" />)
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Your three days off are saved.')
    expect(region).toHaveAttribute('data-shot', 'r')
    expect(region).toHaveStyle({ background: semantic.success.tint, color: semantic.success.onTint })
  })

  it('a line that mounts with its text still lands in the region', () => {
    render(<ResultLine line="Applied." />)
    expect(screen.getByRole('status')).toHaveTextContent('Applied.')
  })

  it('actions and dismiss are named buttons', () => {
    const onDismiss = vi.fn()
    render(<ResultLine line="Assigned." actions={<button type="button">Open List</button>} onDismiss={onDismiss} />)
    expect(screen.getByRole('button', { name: 'Open List' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('plain is the text-only line in success on-tint', () => {
    render(<ResultLine plain line="Series deleted." />)
    expect(screen.getByRole('status')).toHaveStyle({ color: semantic.success.onTint, fontSize: '12.5px' })
    expect(screen.getByRole('status').style.background).toBe('')
  })
})
