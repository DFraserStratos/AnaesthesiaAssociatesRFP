import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { SplitFeeSection, type SplitDraft } from './SplitFeeSection'

type Rows = SplitDraft['rows']

const START: Rows = [
  { key: 0, party: null, person: null, text: '', rest: true },
  { key: 1, party: null, person: null, text: '40%', rest: false },
  { key: 2, party: null, person: null, text: '', rest: false },
]

/** The section over a hand-held draft: `chooseRest` toggles as `useSplitDraft`'s does. */
function Harness() {
  const [rows, setRows] = useState<Rows>(START)
  const noop = () => {}
  const draft: SplitDraft = {
    feeTotal: 300,
    options: [],
    rows,
    active: true,
    hadSplit: false,
    change: undefined,
    problem: null,
    blocked: false,
    showsProblem: false,
    start: noop,
    remove: noop,
    update: (key, patch) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r))),
    chooseRest: (key) => setRows((rs) => rs.map((r) => ({ ...r, rest: r.key === key ? !r.rest : false }))),
    addRow: noop,
    removeRow: noop,
  }
  return <SplitFeeSection draft={draft} />
}

/** UI unification U7: "Who takes the rest" on the shared radio keyboard model (useRovingRadio). */
describe('SplitFeeSection: who takes the rest', () => {
  it('is one radio group with one Tab stop, the row that takes the rest', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup', { name: 'Who takes the rest' })).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1])
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
  })

  it('arrows move and choose; Home never clears the row that has it', () => {
    render(<Harness />)
    const first = screen.getByRole('radio', { name: 'Party 1 takes the rest' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    const second = screen.getByRole('radio', { name: 'Party 2 takes the rest' })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Party 1 takes the rest' })).toHaveAttribute('aria-checked', 'false')
    fireEvent.keyDown(second, { key: 'Home' })
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Party 1 takes the rest' }), { key: 'Home' })
    expect(screen.getByRole('radio', { name: 'Party 1 takes the rest' })).toHaveAttribute('aria-checked', 'true')
  })

  it('a click on the chosen row still clears it', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('radio', { name: 'Party 1 takes the rest' }))
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false'])
  })

  it('leaves the arrow keys to a share field inside the list', () => {
    render(<Harness />)
    const share = screen.getByLabelText('Share 2, $ or %')
    share.focus()
    fireEvent.keyDown(share, { key: 'ArrowLeft' })
    expect(share).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Party 1 takes the rest' })).toHaveAttribute('aria-checked', 'true')
  })
})
