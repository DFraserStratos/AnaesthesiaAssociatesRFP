import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WebNav } from './WebNav'
import { SideNav } from '../../admin/components/SideNav'
import { SurfaceProvider } from '../../../shared'

/** UI unification U5 (U32, question 3): each main nav is a labelled landmark with one current item, its items still buttons. */
describe('nav state', () => {
  it('the web nav marks exactly its active tab aria-current="page"', () => {
    render(<WebNav tab="availability" onTab={() => {}} personaName="Dr Melanie Souter" initials="MS" />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const current = within(nav).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Availability')
  })

  it('the Admin side nav marks exactly its active item aria-current="page"', () => {
    render(<SurfaceProvider variant="web"><SideNav active="review" reviewBadge={0} onNavigate={() => {}} /></SurfaceProvider>)
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    const current = within(nav).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Review queue')
  })
})
