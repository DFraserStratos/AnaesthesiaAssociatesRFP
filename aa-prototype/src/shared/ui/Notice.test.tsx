import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { neutral, semantic } from '../../theme/tokens'
import { Notice } from './Notice'

/** UI unification U3 (U11): one notice shell, the ConflictCallout's. */
describe('Notice', () => {
  it('warning: the tint shell with the triangle, aria-hidden', () => {
    render(
      <Notice tone="warning" shot="w" title="Southern Cross is closed">
        You can still go ahead.
      </Notice>,
    )
    const box = document.querySelector('[data-shot="w"]')!
    expect(box).toHaveStyle({ background: semantic.warning.tint, color: semantic.warning.onTint, padding: '12px 14px', fontSize: '13px' })
    expect(box.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByText('Southern Cross is closed').tagName).toBe('STRONG')
  })

  it('neutral: the bg with a line border, no icon by default', () => {
    render(<Notice tone="neutral" shot="n">Moved here by Dr Chen</Notice>)
    const box = document.querySelector('[data-shot="n"]')!
    expect(box).toHaveStyle({ background: neutral.bg, border: `1px solid ${neutral.line}`, padding: '10px 12px', color: neutral.ink })
    expect(box.querySelector('svg')).toBeNull()
  })

  it('error and success read their own tints', () => {
    render(
      <>
        <Notice tone="error" shot="e" icon={false}>Booking cancelled.</Notice>
        <Notice tone="success" shot="s">Done.</Notice>
      </>,
    )
    expect(document.querySelector('[data-shot="e"]')).toHaveStyle({ background: semantic.error.tint })
    expect(document.querySelector('[data-shot="e"] svg')).toBeNull()
    expect(document.querySelector('[data-shot="s"]')).toHaveStyle({ background: semantic.success.tint })
  })

  it('live gives the role; without it there is none', () => {
    render(
      <>
        <Notice tone="warning" live="status">Announced</Notice>
        <Notice tone="neutral" shot="quiet">Quiet</Notice>
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Announced')
    expect(document.querySelector('[data-shot="quiet"]')).not.toHaveAttribute('role')
  })

  it('an action sits after the words and stays a real button', () => {
    render(<Notice tone="neutral" action={<button type="button">Resolve</button>}>Alert from Dr Chen</Notice>)
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument()
  })

  it('enter fades the note in; without it there is no animation', () => {
    render(
      <>
        <Notice tone="success" shot="in" enter live="status">Applied</Notice>
        <Notice tone="success" shot="still">Applied</Notice>
      </>,
    )
    expect((document.querySelector('[data-shot="in"]') as HTMLElement).style.animation).toContain('aa-fade-in')
    expect((document.querySelector('[data-shot="still"]') as HTMLElement).style.animation).toBe('')
  })
})
