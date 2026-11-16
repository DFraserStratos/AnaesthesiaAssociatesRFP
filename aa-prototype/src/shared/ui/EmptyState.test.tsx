import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { neutral, radius } from '../../theme/tokens'
import { EmptyState } from './EmptyState'

/** UI unification U3 (U29): one empty state in three looks; the words are each screen's own. */
describe('EmptyState', () => {
  it('inline is the mist line', () => {
    render(<EmptyState>No notes for this day.</EmptyState>)
    expect(screen.getByText('No notes for this day.')).toHaveStyle({ color: neutral.mist, fontSize: '12.5px' })
  })

  it('card is the RvgGroupsView card, with a title and keeps its shot', () => {
    render(
      <EmptyState variant="card" title="No RVG groups match." shot="conflicts-empty">
        Check the code.
      </EmptyState>,
    )
    const card = document.querySelector('[data-shot="conflicts-empty"]')!
    expect(card).toHaveStyle({ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: `${radius.card}px`, padding: '28px 20px' })
    expect(screen.getByText('No RVG groups match.')).toHaveStyle({ fontWeight: '600' })
    expect(card).toHaveTextContent('Check the code.')
  })

  it('centred is the phone list screens\' line', () => {
    render(<EmptyState variant="centred" shot="c">No free sessions on this day.</EmptyState>)
    expect(document.querySelector('[data-shot="c"]')).toHaveStyle({ textAlign: 'center', fontSize: '14px', color: neutral.mist })
  })

  it('an action is a real button, and the state itself takes no role', () => {
    render(
      <EmptyState variant="card" shot="e" action={<button type="button">Search every group</button>}>
        Nothing here.
      </EmptyState>,
    )
    expect(screen.getByRole('button', { name: 'Search every group' })).toBeInTheDocument()
    expect(document.querySelector('[data-shot="e"]')).not.toHaveAttribute('role')
  })
})
