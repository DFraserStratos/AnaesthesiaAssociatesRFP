import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { neutral, semantic } from '../../theme/tokens'
import { Pill, PILL_TONES, type PillTone } from './Pill'

/** UI unification U3 (U04): one label pill with tones, sizes and an outline. */
describe('Pill', () => {
  const tones: PillTone[] = ['neutral', 'success', 'warning', 'error']

  it.each(tones)('the %s tone reads its tint and on-tint', (tone) => {
    render(<Pill tone={tone}>Word</Pill>)
    expect(screen.getByText('Word')).toHaveStyle({ background: PILL_TONES[tone].tint, color: PILL_TONES[tone].onTint })
  })

  it('never uses the teal action tint or crimson', () => {
    expect(PILL_TONES.success).toEqual(semantic.success)
    expect(PILL_TONES.neutral.tint).toBe(neutral.sunken)
    for (const t of Object.values(PILL_TONES)) {
      expect([t.tint, t.onTint, t.solid]).not.toContain('#E1F0ED')
      expect([t.tint, t.onTint, t.solid]).not.toContain('#A91E3E')
    }
  })

  it('defaults to today\'s look: neutral, md (1px 8px, 11.5/18)', () => {
    render(<Pill>Default</Pill>)
    expect(screen.getByText('Default')).toHaveStyle({ padding: '1px 8px', fontSize: '11.5px', lineHeight: '18px', fontWeight: '600', background: neutral.sunken })
  })

  it('sizes: sm 0 7px 11/16, lg 4px 10px 11/600 (question 16)', () => {
    render(
      <>
        <Pill size="sm">Small</Pill>
        <Pill size="lg">Large</Pill>
      </>,
    )
    expect(screen.getByText('Small')).toHaveStyle({ padding: '0px 7px', fontSize: '11px', lineHeight: '16px' })
    expect(screen.getByText('Large')).toHaveStyle({ padding: '4px 10px', fontSize: '11px', fontWeight: '600' })
  })

  it('the outline is a white pill ringed in the tone\'s solid at full alpha, with on-tint text', () => {
    render(
      <Pill tone="warning" variant="outline">
        Changed
      </Pill>,
    )
    expect(screen.getByText('Changed')).toHaveStyle({ background: neutral.surface, border: `1px solid ${semantic.warning.solid}`, color: semantic.warning.onTint })
  })

  it('passes shot, title and data attributes to the span, with no role', () => {
    render(
      <Pill shot="a-shot" title="In full" data-tier="T1" data-testid="pill">
        T1
      </Pill>,
    )
    const pill = screen.getByTestId('pill')
    expect(pill.tagName).toBe('SPAN')
    expect(pill).toHaveAttribute('data-shot', 'a-shot')
    expect(pill).toHaveAttribute('data-tier', 'T1')
    expect(pill).toHaveAttribute('title', 'In full')
    expect(pill).not.toHaveAttribute('role')
    expect(pill).not.toHaveAttribute('tabindex')
  })

  it('draws a leading icon or dot before the words, and mono figures on request', () => {
    render(
      <Pill leading={<span data-testid="dot" />} mono>
        12
      </Pill>,
    )
    const pill = screen.getByText('12')
    expect(pill.firstChild).toBe(screen.getByTestId('dot'))
    expect(pill).toHaveStyle({ fontVariantNumeric: 'tabular-nums' })
  })
})
