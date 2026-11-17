import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { neutral } from '../../theme/tokens'
import { LineTab, LineTabLink, LineTabs } from './LineTabs'

/** UI unification U5 (U17): the underline strip, its route links and its local tabs. */
describe('LineTabs', () => {
  it('a route strip is a labelled navigation of links, the current one marked aria-current="page"', () => {
    render(
      <MemoryRouter>
        <LineTabs label="Availability page">
          <LineTabLink to="/web/availability" active>Find cover</LineTabLink>
          <LineTabLink to="/web/availability/mine" active={false}>My availability</LineTabLink>
        </LineTabs>
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Availability page' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Find cover' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'My availability' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'My availability' })).toHaveAttribute('href', '/web/availability/mine')
  })

  it('keeps today\'s look: 14px, 600 active with the ink underline, 500 inactive', () => {
    render(
      <MemoryRouter>
        <LineTabs label="AA fees">
          <LineTabLink to="/a" active>Fee invoices</LineTabLink>
          <LineTabLink to="/b" active={false}>Fee settings</LineTabLink>
        </LineTabs>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Fee invoices' })).toHaveStyle({ fontSize: '14px', fontWeight: '600', color: neutral.ink, boxShadow: `inset 0 -2px 0 ${neutral.ink}` })
    expect(screen.getByRole('link', { name: 'Fee settings' })).toHaveStyle({ fontWeight: '500', color: neutral.slate })
  })

  it('renders a badge and passes data-* through to the link', () => {
    render(
      <MemoryRouter>
        <LineTabs label="Draft Lists">
          <LineTabLink to="/x?tab=history" active={false} badge={<span>3</span>} data-draft-tab="history">History</LineTabLink>
        </LineTabs>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /^History\s*3$/ })
    expect(link).toHaveAttribute('data-draft-tab', 'history')
  })

  it('a local strip is a labelled group of buttons with aria-pressed (question 3)', () => {
    const onClick = vi.fn()
    render(
      <LineTabs label="Contract panel" kind="group">
        <LineTab active onClick={() => {}}>Details</LineTab>
        <LineTab active={false} onClick={onClick}>History</LineTab>
      </LineTabs>,
    )
    expect(screen.getByRole('group', { name: 'Contract panel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
