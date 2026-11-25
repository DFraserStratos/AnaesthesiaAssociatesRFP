import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { accent } from '../../../theme/tokens'
import { GroupIndex } from './GroupIndex'

const ITEMS = [
  { key: 'PY-AA', label: 'Anaesthesia Associates', count: 3 },
  { key: 'PY-STG', label: "St George's", count: 31, section: 'Hospitals' },
  { key: 'PY-SX', label: 'Southern Cross', count: 1205, section: 'Hospitals' },
  { key: 'PY-NIB', label: 'nib', count: 2, section: 'Insurers' },
]

describe('GroupIndex (build plan Phase 47)', () => {
  it('lists All first, then each group with its count, a caption where the section changes, and the note', () => {
    let picked = 'unset'
    render(<GroupIndex label="Groups" items={ITEMS} value="PY-STG" allLabel="All Contracts" allCount={1241} onSelect={(k) => (picked = k)} note="A note." shot="idx" data-x="1" />)
    const nav = screen.getByRole('navigation', { name: 'Groups' })
    expect(nav).toHaveAttribute('data-shot', 'idx')
    expect(nav).toHaveAttribute('data-x', '1')
    const buttons = within(nav).getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('data-group-key'))).toEqual(['', 'PY-AA', 'PY-STG', 'PY-SX', 'PY-NIB'])
    expect(buttons[0]).toHaveTextContent('All Contracts1,241')
    expect(buttons[3]).toHaveTextContent('1,205')
    // One caption per change of section, none for AA.
    expect(nav.querySelectorAll('[data-group-section]')).toHaveLength(2)
    expect(screen.getByText('A note.')).toBeInTheDocument()
    // The picked group is current, teal on the accent tint.
    expect(buttons[2]).toHaveAttribute('aria-current', 'true')
    expect(buttons[2]).toHaveStyle({ background: accent.tint })
    expect(buttons[1]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).toHaveAttribute('title', "St George's")
    fireEvent.click(buttons[4]!)
    expect(picked).toBe('PY-NIB')
    fireEvent.click(buttons[0]!)
    expect(picked).toBe('')
  })

  it('marks All current when no group is picked, and has no note line without a note', () => {
    render(<GroupIndex label="Groups" items={ITEMS} value="" allLabel="All Contracts" allCount={4} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /All Contracts/ })).toHaveAttribute('aria-current', 'true')
    expect(document.querySelector('[data-group-note]')).toBeNull()
  })
})
