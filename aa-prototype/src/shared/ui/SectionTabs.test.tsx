import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useDemoContextStore } from '../demoTriggers/context'
import { SectionTabs } from './SectionTabs'

const TABS = [
  { tab: 'draft-lists', label: 'Draft Lists', path: '/admin/lists/draft-lists' },
  { tab: 'conflicts', label: 'Conflicts', path: '/admin/lists/conflicts' },
  { tab: 'to-authorise', label: 'To authorise', path: '/admin/lists/to-authorise' },
] as const

describe('SectionTabs', () => {
  it('draws the registry as route links in order, the shown one current, each with its data attribute', () => {
    render(
      <MemoryRouter>
        <SectionTabs label="Lists" name="lists" tabs={TABS} active="conflicts" context="adminLists.tab" shot="lists-tabs" />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Lists' })
    expect(nav).toHaveAttribute('data-shot', 'lists-tabs')
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('data-lists-tab'))).toEqual(['draft-lists', 'conflicts', 'to-authorise'])
    expect(screen.getByRole('link', { name: 'Conflicts' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Conflicts' })).toHaveAttribute('href', '/admin/lists/conflicts')
  })

  it('shows a count only where one is given, hidden at zero unless told otherwise', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SectionTabs label="Lists" name="lists" tabs={TABS} active="draft-lists" context="adminLists.tab" counts={{ 'draft-lists': 4, conflicts: 0 }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Draft Lists 4' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conflicts' })).toHaveTextContent(/^Conflicts$/)
    expect(screen.getByRole('link', { name: 'To authorise' })).toHaveTextContent(/^To authorise$/)
    rerender(
      <MemoryRouter>
        <SectionTabs label="Lists" name="lists" tabs={TABS} active="draft-lists" context="adminLists.tab" counts={{ conflicts: 0 }} hideAtZero={false} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Conflicts 0' })).toBeInTheDocument()
  })

  it('publishes the shown tab for the demo triggers while mounted', () => {
    const { unmount } = render(
      <MemoryRouter>
        <SectionTabs label="Lists" name="lists" tabs={TABS} active="to-authorise" context="adminLists.tab" />
      </MemoryRouter>,
    )
    expect(useDemoContextStore.getState().values['adminLists.tab']).toBe('to-authorise')
    unmount()
    expect(useDemoContextStore.getState().values['adminLists.tab']).toBeUndefined()
  })
})
