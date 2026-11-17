import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { accent, neutral } from '../../theme/tokens'
import { FilterPills } from './FilterPills'

const OPTIONS = [
  { value: 'all', label: 'All anaesthetists' },
  { value: 'free', label: 'Free only · 4' },
] as const

/** UI unification U5 (U32): one row of filter pills, a labelled group with aria-pressed. */
describe('FilterPills', () => {
  it('is a labelled group whose pressed pill follows the value', () => {
    const onSelect = vi.fn()
    render(<FilterPills value="all" options={OPTIONS} onSelect={onSelect} ariaLabel="Anaesthetists shown" />)
    expect(screen.getByRole('group', { name: 'Anaesthetists shown' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All anaesthetists' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Free only · 4' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Free only · 4' }))
    expect(onSelect).toHaveBeenCalledWith('free')
  })

  it('draws each mockup: 36px web with a teal border, 38px phone with none', () => {
    render(<><FilterPills value="all" options={OPTIONS} onSelect={() => {}} ariaLabel="Web" /><FilterPills size="lg" value="free" options={OPTIONS} onSelect={() => {}} ariaLabel="Phone" /></>)
    const web = screen.getAllByRole('button', { name: 'All anaesthetists' })[0]
    expect(web).toHaveStyle({ height: '36px', background: accent.base, color: neutral.surface, border: `1px solid ${accent.base}` })
    const phone = screen.getAllByRole('button', { name: 'Free only · 4' })[1]
    expect(phone).toHaveStyle({ height: '38px', background: accent.base })
    expect(phone).toHaveStyle({ borderStyle: 'none' })
  })
})
