import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { SurfaceProvider } from '../../../shared'
import { SideNav, type NavSection } from './SideNav'

function Harness({ start }: { start: NavSection }) {
  const [active, setActive] = useState<NavSection>(start)
  return (
    <SurfaceProvider variant="web">
      <SideNav active={active} onNavigate={setActive} onHelp={() => {}} />
    </SurfaceProvider>
  )
}

const nav = () => screen.getByRole('navigation', { name: 'Admin' })
const more = () => within(nav()).getByRole('button', { name: 'More' })

describe('the side nav More fold', () => {
  it('keeps Master data and Audit folded away until More opens them, and the same click hides them', () => {
    render(<Harness start="day" />)
    expect(more()).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav()).queryByRole('button', { name: 'Master data' })).toBeNull()
    fireEvent.click(more())
    expect(more()).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(within(nav()).getByRole('button', { name: 'Audit' }))
    expect(within(nav()).getByRole('button', { name: 'Audit' })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(more())
    expect(more()).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav()).queryByRole('button', { name: 'Audit' })).toBeNull()
  })

  it('opens itself on arrival at Master data', () => {
    render(<Harness start="masters" />)
    expect(more()).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav()).getByRole('button', { name: 'Master data' })).toHaveAttribute('aria-current', 'page')
  })
})
