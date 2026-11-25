import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { accent } from '../../theme/tokens'
import { BackLink } from './BackLink'

/** UI unification U5 (U21): one back link, a real link where a route exists. */
describe('BackLink', () => {
  it('renders a link when given a route', () => {
    render(<MemoryRouter><BackLink to="/admin/people/surgeons">Surgeons</BackLink></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Surgeons' })
    expect(link).toHaveAttribute('href', '/admin/people/surgeons')
    expect(link).toHaveStyle({ color: accent.base, fontSize: '14px', fontWeight: '600' })
  })

  it('renders a button when given onClick, so specs that click it as a button still find it', () => {
    const onClick = vi.fn()
    render(<BackLink onClick={onClick}>Lists</BackLink>)
    fireEvent.click(screen.getByRole('button', { name: 'Lists' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('draws the three sizes: desktop 14, touch 15 with a 44px target, step 13', () => {
    render(<><BackLink onClick={() => {}}>Desk</BackLink><BackLink size="touch" onClick={() => {}}>Phone</BackLink><BackLink size="step" onClick={() => {}}>Step</BackLink></>)
    expect(screen.getByRole('button', { name: 'Desk' })).toHaveStyle({ fontSize: '14px' })
    expect(screen.getByRole('button', { name: 'Phone' })).toHaveStyle({ fontSize: '15px', minHeight: '44px' })
    expect(screen.getByRole('button', { name: 'Step' })).toHaveStyle({ fontSize: '13px' })
  })
})
