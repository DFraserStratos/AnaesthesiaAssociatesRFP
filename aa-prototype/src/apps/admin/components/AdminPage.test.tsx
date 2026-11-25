import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_RIGHT_RAIL_WIDTH, ADMIN_RIGHT_RAIL_MIN_WIDTH, ADMIN_SUBNAV_WIDTH, adminRailWidth } from '../layout'
import { AdminFrameContext, AdminPage, PageBody, PageToolbar } from './AdminPage'

/** The Admin page frame (docs/admin-layout-audit.md, "Layout decisions"). */
describe('AdminPage', () => {
  afterEach(cleanup)

  it('renders the title as an h1 with its sub, actions and tabs', () => {
    render(
      <AdminPage mode="fluid" title="Invoices" sub="Raised by the billing run." actions={<button type="button">Export</button>} tabs={<nav aria-label="Invoice views">Tabs here</nav>}>
        <p>Body</p>
      </AdminPage>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Invoices' })).toBeInTheDocument()
    expect(screen.getByText('Raised by the billing run.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Invoice views' })).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('a back with onClick is a button that runs it', () => {
    const onClick = vi.fn()
    render(
      <AdminPage mode="document" title="AA-S-002568" back={{ label: 'Invoices', onClick }}>
        <p>Paper</p>
      </AdminPage>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Invoices' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('a back with to is a real link', () => {
    render(
      <MemoryRouter>
        <AdminPage mode="fluid" title="Dr Hale" back={{ label: 'Anaesthetists', to: '/admin/masters' }}>
          <p>Record</p>
        </AdminPage>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Anaesthetists' })).toHaveAttribute('href', '/admin/masters')
  })

  it('carries its mode on data-admin-page, with shot, testId and data attributes', () => {
    const { container, rerender } = render(
      <AdminPage mode="fit" title="Audit" shot="admin-audit" testId="audit-page" data-extra="x">
        <p>List</p>
      </AdminPage>,
    )
    const root = container.querySelector('[data-admin-page]') as HTMLElement
    expect(root).toHaveAttribute('data-admin-page', 'fit')
    expect(root).toHaveAttribute('data-shot', 'admin-audit')
    expect(root).toHaveAttribute('data-testid', 'audit-page')
    expect(root).toHaveAttribute('data-extra', 'x')
    rerender(
      <AdminPage mode="document" title="Audit">
        <p>List</p>
      </AdminPage>,
    )
    expect(container.querySelector('[data-admin-page]')).toHaveAttribute('data-admin-page', 'document')
  })

  it('a fit page tells the shell it fits on mount, and stops on unmount', () => {
    const setFits = vi.fn()
    const { unmount } = render(
      <AdminFrameContext.Provider value={setFits}>
        <AdminPage mode="fit" title="Notifications">
          <p>List</p>
        </AdminPage>
      </AdminFrameContext.Provider>,
    )
    expect(setFits).toHaveBeenCalledTimes(1)
    expect(setFits).toHaveBeenLastCalledWith(true)
    unmount()
    expect(setFits).toHaveBeenCalledTimes(2)
    expect(setFits).toHaveBeenLastCalledWith(false)
  })

  it('a fluid page never calls the shell', () => {
    const setFits = vi.fn()
    const { unmount } = render(
      <AdminFrameContext.Provider value={setFits}>
        <AdminPage mode="fluid" title="Finances">
          <p>Dashboard</p>
        </AdminPage>
      </AdminFrameContext.Provider>,
    )
    unmount()
    expect(setFits).not.toHaveBeenCalled()
  })
})

describe('PageBody', () => {
  afterEach(cleanup)

  it('renders the rail at the one rail width and the nav at the sub-nav width', () => {
    const { container } = render(
      <AdminPage mode="fluid" title="Master data">
        <PageBody nav={<p>Views</p>} rail={<p>Side</p>} railLabel="About this view">
          <p>Main</p>
        </PageBody>
      </AdminPage>,
    )
    const rail = screen.getByRole('complementary', { name: 'About this view' })
    expect(rail).toHaveAttribute('data-page-rail')
    // The full rail where there is room, narrowing to the minimum on a laptop (jsdom drops clamp(), so
    // the width is checked on the helper the rail uses).
    expect(adminRailWidth(756)).toBe(`clamp(${ADMIN_RIGHT_RAIL_MIN_WIDTH}px, calc(100% - 756px), ${ADMIN_RIGHT_RAIL_WIDTH}px)`)
    expect(rail).toHaveTextContent('Side')
    const nav = screen.getByText('Views').parentElement as HTMLElement
    expect(nav).toHaveStyle({ width: `${ADMIN_SUBNAV_WIDTH}px` })
    expect(container.querySelector('[data-page-body]')).toHaveTextContent('Main')
  })
})

describe('PageToolbar', () => {
  afterEach(cleanup)

  it('renders the filters and the end slot at the right', () => {
    const { container } = render(
      <PageToolbar shot="toolbar" end={<span>12 rows</span>}>
        <button type="button">Filter</button>
      </PageToolbar>,
    )
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    const end = container.querySelector('[data-page-toolbar-end]') as HTMLElement
    expect(end).toHaveTextContent('12 rows')
    expect(end).toHaveStyle({ marginLeft: 'auto' })
    expect(container.querySelector('[data-page-toolbar]')).toHaveAttribute('data-shot', 'toolbar')
  })

  it('has no end slot without end', () => {
    const { container } = render(<PageToolbar><span>Only filters</span></PageToolbar>)
    expect(container.querySelector('[data-page-toolbar-end]')).toBeNull()
  })
})
