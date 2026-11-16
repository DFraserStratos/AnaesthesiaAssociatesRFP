import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { semantic } from '../../theme/tokens'
import { FormError } from './Field'

/** UI unification U3 (U05): every refusal is one announced FormError. */
describe('FormError', () => {
  it('renders nothing for no message', () => {
    const { container } = render(
      <>
        <FormError message={null} />
        <FormError message={undefined} variant="inline" />
      </>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('the box is an alert in the error tint (today\'s look)', () => {
    render(<FormError message="This List is authorised." shot="refusal" />)
    const box = screen.getByRole('alert')
    expect(box).toHaveTextContent('This List is authorised.')
    expect(box).toHaveAttribute('data-shot', 'refusal')
    expect(box).toHaveStyle({ background: semantic.error.tint, color: semantic.error.onTint, padding: '10px 12px', fontSize: '13px' })
  })

  it('the inline line is still an alert: 12px error on-tint text, no box', () => {
    render(<FormError message="Could not clear." variant="inline" />)
    const line = screen.getByRole('alert')
    expect(line).toHaveTextContent('Could not clear.')
    expect(line).toHaveStyle({ color: semantic.error.onTint, fontSize: '12px' })
    expect(line.style.background).toBe('')
  })
})
