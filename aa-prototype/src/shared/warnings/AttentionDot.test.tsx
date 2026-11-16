import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { neutral, semantic } from '../../theme/tokens'
import { AttentionDot, attentionGlyphSize } from './AttentionDot'
import { WarningTriangle } from './WarningTriangle'
import type { Warning } from '../../domain/warnings'

/** UI unification U3 (U26): the one attention disc, a marker never a control. */
describe('AttentionDot', () => {
  it('labelled, it is an image with that name', () => {
    render(<AttentionDot label="Conflict to resolve" />)
    expect(screen.getByRole('img', { name: 'Conflict to resolve' })).toBeInTheDocument()
  })

  it('unlabelled, it is hidden, so a host button\'s name has no "!"', () => {
    render(
      <button type="button" title="Needs the office">
        Dr Moore AM
        <AttentionDot />
      </button>,
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Dr Moore AM')
    expect(screen.getByText('!')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the Admin Day disc: 13px, a 9px glyph, the warning solid', () => {
    render(<AttentionDot shot="dot" />)
    const dot = document.querySelector('[data-shot="dot"]')!
    expect(dot).toHaveStyle({ width: '13px', height: '13px', fontSize: '9px', background: semantic.warning.solid, color: neutral.surface })
    expect(attentionGlyphSize(9)).toBe(7)
    expect(attentionGlyphSize(12)).toBe(8)
    expect(attentionGlyphSize(14)).toBe(9)
  })

  it('takes the error and muted tones', () => {
    render(
      <>
        <AttentionDot tone="error" shot="e" />
        <AttentionDot tone="muted" shot="m" />
      </>,
    )
    expect(document.querySelector('[data-shot="e"]')).toHaveStyle({ background: semantic.error.solid })
    expect(document.querySelector('[data-shot="m"]')).toHaveStyle({ background: neutral.mist })
  })

  it('is never focusable', () => {
    render(<AttentionDot label="x" glyph="triangle" />)
    const dot = screen.getByRole('img')
    expect(dot.tagName).toBe('SPAN')
    expect(dot).not.toHaveAttribute('tabindex')
  })

  it('WarningTriangle composes it and keeps its own role, name, title and hooks', () => {
    const w = { id: 'W1', strength: 'strong', text: 'No consent recorded', clearedBy: undefined } as unknown as Warning
    render(<WarningTriangle warnings={[w]} />)
    const marker = screen.getByRole('img', { name: /1 warning: No consent recorded/ })
    expect(marker).toHaveAttribute('title', 'No consent recorded')
    expect(marker).toHaveAttribute('data-shot', 'booking-warning')
    expect(marker).toHaveAttribute('data-strength', 'strong')
    expect(marker.querySelector('[aria-hidden="true"]')).toHaveStyle({ background: semantic.error.solid, width: '18px' })
  })
})
