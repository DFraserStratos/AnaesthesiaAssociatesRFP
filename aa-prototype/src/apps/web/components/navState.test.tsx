import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WebNav } from './WebNav'
import { SideNav } from '../../admin/components/SideNav'
import { SurfaceProvider } from '../../../shared'

/** UI unification U5 (U32, question 3): each main nav is a labelled landmark with one current item, its items still buttons. */
describe('nav state', () => {
  it('the web nav marks exactly its active tab aria-current="page"', () => {
    render(<WebNav tab="availability" onTab={() => {}} personaName="Dr Melanie Souter" initials="MS" profileActive={false} onProfile={() => {}} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const current = within(nav).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Availability')
  })

  it('on the profile page no tab is current and the persona block is (catch-up Phase 26), the four tabs unchanged', () => {
    const opened: string[] = []
    render(<WebNav tab={null} onTab={() => {}} personaName="Dr Melanie Souter" initials="MS" profileActive onProfile={() => opened.push('profile')} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(['Dashboard', 'Lists', 'Availability', 'Accounts'])
    expect(within(nav).getAllByRole('button').some((b) => b.getAttribute('aria-current') === 'page')).toBe(false)
    const persona = screen.getByRole('button', { name: 'Your profile, Dr Melanie Souter' })
    expect(persona).toHaveAttribute('aria-current', 'page')
    persona.click()
    expect(opened).toEqual(['profile'])
  })

  it('the Admin side nav marks exactly its active item aria-current="page"', () => {
    render(<SurfaceProvider variant="web"><SideNav active="lists" onNavigate={() => {}} /></SurfaceProvider>)
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    const current = within(nav).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Lists')
  })
})
