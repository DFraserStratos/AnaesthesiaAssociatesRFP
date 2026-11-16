import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { brand, neutral } from '../theme/tokens'
import { Avatar, avatarFontSize } from './Avatar'
import { PersonaChip } from './PersonaChip'

/** UI unification U3 (U25): one avatar on the mockups' font steps. */
describe('Avatar', () => {
  it.each([
    [28, 11],
    [30, 11],
    [34, 12],
    [36, 13],
    [44, 15],
  ])('at %ipx the initials are %ipx', (size, font) => {
    expect(avatarFontSize(size)).toBe(font)
    render(<Avatar initials="AB" size={size} />)
    expect(screen.getByText('AB')).toHaveStyle({ fontSize: `${font}px`, fontWeight: '700' })
  })

  it('is hidden from assistive tech (a name is always printed beside it)', () => {
    render(<Avatar initials="MS" />)
    expect(screen.getByText('MS')).toHaveAttribute('aria-hidden', 'true')
  })

  it('takes initials from a name, dropping a title', () => {
    render(
      <>
        <Avatar name="Dr Melanie Souter" size={36} variant="tint" />
        <Avatar name="Ms Fiona Reid" size={36} variant="neutral" />
      </>,
    )
    expect(screen.getByText('MS')).toHaveStyle({ background: brand.tint, color: brand.base })
    expect(screen.getByText('FR')).toHaveStyle({ background: neutral.sunken, color: neutral.ink })
  })

  it('elevated white is the default; neutral muted is dashed', () => {
    render(
      <>
        <Avatar initials="EW" />
        <Avatar initials="NM" variant="neutral" muted />
      </>,
    )
    expect(screen.getByText('EW')).toHaveStyle({ background: neutral.surface, color: brand.base })
    expect(screen.getByText('NM')).toHaveStyle({ border: `1px dashed ${neutral.lineStrong}`, color: neutral.mist })
  })

  it('PersonaChip prints the name and role beside a hidden tint avatar', () => {
    render(<PersonaChip persona={{ name: 'Kirsty W.', initials: 'KW', role: 'Office' }} />)
    expect(screen.getByText('Kirsty W.')).toBeInTheDocument()
    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getByText('KW')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('KW')).toHaveStyle({ width: '30px', fontSize: '11px', background: brand.tint })
  })
})
