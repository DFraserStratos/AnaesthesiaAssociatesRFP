import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { neutral, semantic } from '../../theme/tokens'
import { CountBadge } from './CountBadge'

/** UI unification U3 (U26): the one count bubble beside a heading. */
describe('CountBadge', () => {
  it('is hidden at zero by default', () => {
    const { container } = render(<CountBadge count={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows zero with hideAtZero={false}', () => {
    render(<CountBadge count={0} hideAtZero={false} shot="n" srNoun="active" />)
    expect(document.querySelector('[data-shot="n"]')).toHaveTextContent(/^0 active$/)
  })

  it('puts the hidden noun in the accessible text, and the figure alone on screen', () => {
    render(
      <h2>
        To-do
        <CountBadge count={3} srNoun="to do" />
      </h2>,
    )
    expect(screen.getByRole('heading')).toHaveAccessibleName(/To-do\s*3\s*to do/)
    expect(screen.getByText('to do', { exact: false })).toHaveStyle({ position: 'absolute', width: '1px' })
  })

  it('draws the 18px rail bubble, neutral by default and warning on request', () => {
    render(
      <>
        <CountBadge count={2} shot="a" />
        <CountBadge count={5} tone="warning" mono shot="b" />
      </>,
    )
    const a = document.querySelector('[data-shot="a"]')!
    const b = document.querySelector('[data-shot="b"]')!
    expect(a).toHaveStyle({ background: neutral.sunken, color: neutral.slate, fontSize: '11.5px', lineHeight: '18px', padding: '0px 7px' })
    expect(b).toHaveStyle({ background: semantic.warning.tint, color: semantic.warning.onTint })
    expect(a.tagName).toBe('SPAN')
    expect(a).not.toHaveAttribute('role')
  })
})
