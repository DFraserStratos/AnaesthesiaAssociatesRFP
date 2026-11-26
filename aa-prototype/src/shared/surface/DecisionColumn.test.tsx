import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DecisionColumn } from './DecisionColumn'

afterEach(cleanup)

describe('DecisionColumn', () => {
  it('pins the note over the buttons, secondary first and primary last', () => {
    render(
      <DecisionColumn shot="col" data-arrival-key="k1" label="Decision" footer={{ note: 'Creates the List.', secondary: <button type="button">Reject</button>, primary: <button type="button">Place</button> }}>
        <p>Body</p>
      </DecisionColumn>,
    )
    const col = document.querySelector('[data-shot="col"]')!
    expect(col.getAttribute('data-arrival-key')).toBe('k1')
    expect(screen.getByRole('region', { name: 'Decision' })).toBe(col)
    const footer = col.querySelector('[data-decision-footer]')!
    expect(footer.querySelector('[data-decision-note]')!.textContent).toBe('Creates the List.')
    expect(Array.from(footer.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Reject', 'Place'])
    // The body comes before the footer, so the buttons sit under the choice.
    expect(col.firstElementChild!.hasAttribute('data-decision-body')).toBe(true)
  })

  it('draws no footer when there is nothing to decide', () => {
    render(
      <DecisionColumn shot="col" footer={{}}>
        <p>Body</p>
      </DecisionColumn>,
    )
    expect(document.querySelector('[data-decision-footer]')).toBeNull()
  })
})
