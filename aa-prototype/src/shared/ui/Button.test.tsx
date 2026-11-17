import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import { Button } from './Button'

/** UI unification U5 (U08, U36): one button with variants, sizes, a printed disabled reason and hooks. */
describe('Button', () => {
  it('defaults to today\'s touch primary: 54px, card radius, 17/700, teal', () => {
    render(<Button>Save</Button>)
    const b = screen.getByRole('button', { name: 'Save' })
    expect(b).toHaveStyle({ minHeight: '54px', borderRadius: `${radius.card}px`, fontSize: '17px', fontWeight: '700', background: accent.base, color: neutral.surface })
    expect(b).toHaveAttribute('type', 'button')
    expect(b).toHaveClass('aa-ctl')
  })

  it('keeps the touch secondary at 48 and the pill at 44', () => {
    render(<><Button variant="secondary">Back</Button><Button variant="pill">Add</Button></>)
    expect(screen.getByRole('button', { name: 'Back' })).toHaveStyle({ minHeight: '48px', color: neutral.ink, background: neutral.surface })
    expect(screen.getByRole('button', { name: 'Add' })).toHaveStyle({ minHeight: '44px', borderRadius: `${radius.pill}px`, background: accent.tint })
  })

  it('draws the desktop size (44, radius 12, 14/600) and the compact size (36, radius 10, 13/600)', () => {
    render(<><Button size="desktop">Authorise</Button><Button size="compact" variant="outline">Today</Button></>)
    expect(screen.getByRole('button', { name: 'Authorise' })).toHaveStyle({ minHeight: '44px', borderRadius: `${radius.md}px`, fontSize: '14px', fontWeight: '600' })
    expect(screen.getByRole('button', { name: 'Today' })).toHaveStyle({ minHeight: '36px', borderRadius: `${radius.ctl}px`, fontSize: '13px', color: accent.base, border: `1px solid ${accent.base}`, background: neutral.surface })
  })

  it('the desktop secondary reads slate, as the Admin Day mockup draws it', () => {
    render(<Button size="compact" variant="secondary">-4w</Button>)
    expect(screen.getByRole('button', { name: '-4w' })).toHaveStyle({ color: neutral.slate, border: `1px solid ${neutral.line}` })
  })

  it('keeps the one red outline in the danger variant', () => {
    render(<Button variant="danger">Cancel booking</Button>)
    expect(screen.getByRole('button', { name: 'Cancel booking' })).toHaveStyle({ color: semantic.error.onTint, border: `1px solid ${semantic.error.solid}55` })
  })

  it('draws every disabled variant on one treatment and never runs onClick', () => {
    const onClick = vi.fn()
    render(<><Button disabled onClick={onClick}>One</Button><Button variant="outline" disabled onClick={onClick}>Two</Button></>)
    for (const name of ['One', 'Two']) {
      const b = screen.getByRole('button', { name })
      expect(b).toBeDisabled()
      expect(b).toHaveStyle({ background: neutral.line, color: neutral.mist })
      fireEvent.click(b)
    }
    expect(onClick).not.toHaveBeenCalled()
  })

  it('prints a disabled reason beside the button and ties it by aria-describedby', () => {
    render(<Button disabled disabledReason="Move its List first">Close session</Button>)
    const b = screen.getByRole('button', { name: 'Close session' })
    expect(b).toBeDisabled()
    expect(b).toHaveAccessibleDescription('Move its List first')
    expect(screen.getByText('Move its List first')).toBeVisible()
  })

  it('prints no reason while enabled', () => {
    render(<Button disabledReason="Move its List first">Close session</Button>)
    expect(screen.queryByText('Move its List first')).toBeNull()
    expect(screen.getByRole('button', { name: 'Close session' })).not.toHaveAttribute('aria-describedby')
  })

  it('emits data-shot from shot and passes data-* attributes through', () => {
    render(<Button shot="list-move" data-validation-procedure-id="P1" data-validation-fields="rvg">Add billing line</Button>)
    const b = screen.getByRole('button', { name: 'Add billing line' })
    expect(b).toHaveAttribute('data-shot', 'list-move')
    expect(b).toHaveAttribute('data-validation-procedure-id', 'P1')
    expect(b).toHaveAttribute('data-validation-fields', 'rvg')
  })

  it('submits when asked', () => {
    render(<Button type="submit">Send</Button>)
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit')
  })
})
