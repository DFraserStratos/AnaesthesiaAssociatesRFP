/**
 * The Intake section (build plan Phase 68; D117; 27 Nov 2026 rebuild): the title, the two routed tabs, "Add a PDF by
 * hand" in the header, no sources strip, no import or upload button and no dash in the copy; and Arrivals as an inbox:
 * grouped by date of surgery with tomorrow first, narrowed by each drop-down and the checkbox, re-sorted from a header
 * (which drops the day headings), a row opening its arrival, and the whole query kept in the URL.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_INBOX_QUERY, inboxItems, needsText, type InboxQuery } from '../../../../domain/intake/inbox'
import { OFFICE_ACTOR, freshAppState, useAppStore } from '../../../../store'
import { arrivalItemsOf } from '../../../../store/intakeSelectors'
import { SurfaceProvider } from '../../../../shared/surface'
import { InboxView } from './InboxView'
import { IntakeSection } from './IntakeSection'
import { inboxPath, inboxQueryFromParams, sourcesPath } from './intakePaths'
import { SourcesView } from './SourcesView'

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin/intake" element={<IntakeSection actor={OFFICE_ACTOR} />}>
        <Route index element={<InboxView actor={OFFICE_ACTOR} />} />
        <Route path="sources" element={<SourcesView />} />
        <Route path="arrival/:key" element={<p data-testid="opened">Opened</p>} />
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(
    <SurfaceProvider variant="web">
      <RouterProvider router={router} />
    </SurfaceProvider>,
  )
  return router
}

const tabs = () => document.querySelector('[data-shot="intake-tabs"]') as HTMLElement
const query = (router: ReturnType<typeof mountAt>) => inboxQueryFromParams(new URLSearchParams(router.state.location.search))
const rows = () => [...document.querySelectorAll<HTMLElement>('[data-shot="intake-inbox-row"]')]
const rowKeys = () => rows().map((r) => r.getAttribute('data-arrival-key'))
const dayRows = () => [...document.querySelectorAll<HTMLElement>('[data-shot="intake-inbox-day"]')]
const expected = (patch: Partial<InboxQuery> = {}) => {
  const s = useAppStore.getState()
  return inboxItems(arrivalItemsOf(s), { ...DEFAULT_INBOX_QUERY, ...patch }, s.clock.todayISO, s.intake)
}
const pick = (name: string, value: string) =>
  act(() => {
    fireEvent.change(screen.getByRole('combobox', { name }), { target: { value } })
  })

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('IntakeSection', () => {
  it('is titled Intake with two tabs, Arrivals (current) and Sources, and no line or sources strip', () => {
    mountAt(inboxPath())
    expect(screen.getByRole('heading', { level: 1, name: 'Intake' })).toBeInTheDocument()
    expect(screen.queryByText('From the rooms and hospitals. Nothing changes until you apply it.')).toBeNull()
    expect(document.querySelector('[data-shot="intake-sources-strip"]')).toBeNull()
    expect(screen.queryByText('Inbound only')).toBeNull()
    const links = within(tabs()).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('data-intake-tab'))).toEqual(['arrivals', 'sources'])
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links[1]).toHaveAttribute('href', sourcesPath())
    expect(document.querySelector('[data-shot="intake-section"]')).toHaveAttribute('data-admin-page', 'fit')
  })

  it('puts Add a PDF by hand in the page header, and it opens its sheet', () => {
    mountAt(inboxPath())
    const add = screen.getByRole('button', { name: 'Add a PDF by hand' })
    expect(add).toBeEnabled()
    expect(add).toHaveAttribute('data-shot', 'intake-add-pdf')
    expect(document.querySelector('[data-shot="intake-inbox-filters"]')?.contains(add)).toBe(false)
    act(() => {
      fireEvent.click(add)
    })
    expect(document.querySelector('[data-shot="intake-add-pdf-dialog"]')).not.toBeNull()
  })

  it('has no import or upload button, and no dash in its copy', () => {
    mountAt(inboxPath())
    const text = document.body.textContent ?? ''
    const dashes = new RegExp('[\\u2013\\u2014]')
    expect(text).not.toMatch(/\b(import|upload)/i)
    expect(text).not.toMatch(dashes)
    cleanup()
    mountAt(sourcesPath())
    expect(document.body.textContent ?? '').not.toMatch(dashes)
  })

  it('Sources is its own tab, with the inbound-only sentence', () => {
    mountAt(sourcesPath())
    expect(within(tabs()).getByRole('link', { name: 'Sources' })).toHaveAttribute('aria-current', 'page')
    expect(document.querySelector('[data-shot="intake-sources-inbound"]')).toHaveTextContent('AA reads from these sources and never writes back to them')
  })
})

describe('InboxView', () => {
  it('shows every arrival to decide, grouped by date of surgery with tomorrow first and Date not read last', () => {
    mountAt(inboxPath())
    const want = expected()
    expect(rowKeys()).toEqual(want.map((i) => i.key))
    const days = dayRows()
    expect(days[0]).toHaveTextContent(/^Tomorrow, Wednesday 25 November/)
    expect(days[days.length - 1]).toHaveTextContent(/^Date not read/)
    expect(screen.getByText(`${want.length} to decide`)).toBeInTheDocument()
    // Under a day heading the Surgery cell is the session alone.
    expect(rows()[0]!.querySelector('td')).toHaveTextContent(/^(AM|PM|Out-of-hours)$/)
  })

  it('is quiet: no pills in the rows', () => {
    mountAt(inboxPath())
    expect(document.querySelector('[data-shot="intake-inbox"] [data-pill], [data-shot="intake-inbox"] [data-source-kind]')).toBeNull()
  })

  it('each drop-down narrows the rows, written to the URL with replace', () => {
    const router = mountAt(inboxPath())
    pick('Show', 'decided')
    expect(query(router).show).toBe('decided')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(rowKeys()).toEqual(expected({ show: 'decided' }).map((i) => i.key))
    expect(screen.getByText(`${expected({ show: 'decided' }).length} decided`)).toBeInTheDocument()

    pick('Show', 'toDecide')
    pick('Kind', 'newList')
    expect(rows().length).toBeGreaterThan(0)
    expect(rows().every((r) => r.getAttribute('data-arrival-kind') === 'newList')).toBe(true)

    pick('Kind', 'all')
    pick('Source', 'rooms')
    expect(rowKeys()).toEqual(expected({ source: 'rooms' }).map((i) => i.key))
    expect(rows().length).toBeLessThan(expected().length)

    pick('Source', 'all')
    pick('Date of surgery', 'tomorrow')
    expect(rowKeys()).toEqual(expected({ surgery: 'tomorrow' }).map((i) => i.key))
    expect(dayRows()).toHaveLength(1)
  })

  it('Needs a look keeps only the arrivals that need something', () => {
    const router = mountAt(inboxPath())
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Needs a look' }))
    })
    expect(query(router).look).toBe(true)
    const want = expected({ look: true })
    expect(want.length).toBeLessThan(expected().length)
    expect(want.every((i) => needsText(i) !== undefined)).toBe(true)
    expect(rowKeys()).toEqual(want.map((i) => i.key))
  })

  it('a header sorts, flips on a second click, and drops the day headings', () => {
    const router = mountAt(inboxPath())
    const received = () => screen.getByRole('button', { name: 'Received' })
    act(() => {
      fireEvent.click(received())
    })
    expect(query(router).sort).toEqual({ key: 'received', dir: 'desc' })
    expect(received().closest('th')).toHaveAttribute('aria-sort', 'descending')
    expect(dayRows()).toHaveLength(0)
    expect(rowKeys()).toEqual(expected({ sort: { key: 'received', dir: 'desc' } }).map((i) => i.key))
    act(() => {
      fireEvent.click(received())
    })
    expect(query(router).sort).toEqual({ key: 'received', dir: 'asc' })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Surgery' }))
    })
    expect(router.state.location.search).toBe('')
    expect(dayRows().length).toBeGreaterThan(0)
  })

  it('a row click opens the arrival on its own page, the query riding along', () => {
    const router = mountAt(inboxPath({ ...DEFAULT_INBOX_QUERY, source: 'rooms' }))
    const first = rows()[0]!
    const key = first.getAttribute('data-arrival-key')!
    act(() => {
      fireEvent.click(first.querySelectorAll('td')[2]!)
    })
    expect(router.state.historyAction).toBe('PUSH')
    expect(router.state.location.pathname).toBe(`/admin/intake/arrival/${encodeURIComponent(key)}`)
    expect(query(router).source).toBe('rooms')
    expect(screen.getByTestId('opened')).toBeInTheDocument()
  })

  it('the List cell is the keyboard handle', () => {
    const router = mountAt(inboxPath())
    const first = rows()[0]!
    act(() => {
      fireEvent.click(within(first).getByRole('button'))
    })
    expect(router.state.location.pathname).toBe(`/admin/intake/arrival/${encodeURIComponent(first.getAttribute('data-arrival-key')!)}`)
  })

  it('reads its whole query back from the URL', () => {
    const q: InboxQuery = { show: 'toDecide', kind: 'newList', source: 'rooms', surgery: '30d', look: true, sort: { key: 'patients', dir: 'desc' }, q: 'okafor' }
    const router = mountAt(inboxPath(q))
    expect(query(router)).toEqual(q)
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveValue('newList')
    expect(screen.getByRole('combobox', { name: 'Source' })).toHaveValue('rooms')
    expect(screen.getByRole('combobox', { name: 'Date of surgery' })).toHaveValue('30d')
    expect(screen.getByRole('checkbox', { name: 'Needs a look' })).toBeChecked()
    expect(screen.getByRole('searchbox', { name: 'Search patient, NHI, surgeon' })).toHaveValue('okafor')
    expect(screen.getByRole('button', { name: 'Patients' }).closest('th')).toHaveAttribute('aria-sort', 'descending')
    expect(rowKeys()).toEqual(expected(q).map((i) => i.key))
  })

  it('the search narrows and says when nothing matches', () => {
    const router = mountAt(inboxPath())
    act(() => {
      fireEvent.change(screen.getByRole('searchbox', { name: 'Search patient, NHI, surgeon' }), { target: { value: 'zzqx ' } })
    })
    expect(query(router).q).toBe('zzqx')
    expect(rows()).toHaveLength(0)
    expect(document.querySelector('[data-shot="intake-inbox-empty"]')).toHaveTextContent('No arrivals match "zzqx".')
  })
})
