import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { accent, neutral } from '../../theme/tokens'
import { TextAction } from './TextAction'

/** UI unification U5 (U13): one text action with sizes, flush, inline and a disabled reason. */
describe('TextAction', () => {
  it('defaults to today\'s look: teal 14/600 with 6px of vertical padding', () => {
    render(<TextAction onClick={() => {}}>Edit</TextAction>)
    const b = screen.getByRole('button', { name: 'Edit' })
    expect(b).toHaveStyle({ fontSize: '14px', fontWeight: '600', color: accent.base, padding: '6px 0px' })
    expect(b).toHaveAttribute('type', 'button')
    expect(b).toHaveClass('aa-ctl')
  })

  it('draws sm at 12.5 for tables and lg at 15 with a 44px target on the phone', () => {
    render(<><TextAction size="sm" onClick={() => {}}>Open</TextAction><TextAction size="lg" onClick={() => {}}>Show all</TextAction></>)
    expect(screen.getByRole('button', { name: 'Open' })).toHaveStyle({ fontSize: '12.5px', padding: '4px 0px' })
    expect(screen.getByRole('button', { name: 'Show all' })).toHaveStyle({ fontSize: '15px', minHeight: '44px' })
  })

  it('flush drops the padding; inline underlines and takes the sentence\'s size', () => {
    render(<><TextAction flush onClick={() => {}}>Clear</TextAction><TextAction inline onClick={() => {}}>Amend</TextAction></>)
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveStyle({ padding: '0px' })
    expect(screen.getByRole('button', { name: 'Amend' })).toHaveStyle({ textDecoration: 'underline', padding: '0px' })
  })

  it('a disabled action is mist, inert and prints its reason', () => {
    const onClick = vi.fn()
    render(<TextAction disabled disabledReason="Submitted Lists are locked" onClick={onClick}>Remove</TextAction>)
    const b = screen.getByRole('button', { name: 'Remove' })
    expect(b).toBeDisabled()
    expect(b).toHaveStyle({ color: neutral.mist })
    expect(b).toHaveAccessibleDescription('Submitted Lists are locked')
    fireEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('takes an accessible name, a shot and data-* attributes', () => {
    render(<TextAction label="Remove A1" shot="modifier-remove" data-modifier-code="A1" onClick={() => {}}>Remove</TextAction>)
    const b = screen.getByRole('button', { name: 'Remove A1' })
    expect(b).toHaveAttribute('data-shot', 'modifier-remove')
    expect(b).toHaveAttribute('data-modifier-code', 'A1')
  })

  it('with `to` renders a router link in the same teal look (Phase 40)', () => {
    render(<MemoryRouter><TextAction to="/admin/people/patients/CQY9304" size="sm" flush shot="t-link">Open record</TextAction></MemoryRouter>)
    const a = screen.getByRole('link', { name: 'Open record' })
    expect(a).toHaveAttribute('href', '/admin/people/patients/CQY9304')
    expect(a).toHaveAttribute('data-shot', 't-link')
    expect(a).toHaveStyle({ color: accent.base, fontWeight: '600', fontSize: '12.5px' })
  })
})
