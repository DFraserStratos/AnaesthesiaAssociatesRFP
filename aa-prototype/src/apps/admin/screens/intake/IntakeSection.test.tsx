/**
 * The Intake section (build plan Phase 68; D117): the title and its line, the two routed tabs, the quiet
 * sources strip with "Inbound only", the one disabled "Add a PDF by hand" in the feed's foot, no import or
 * upload button and no dash in the copy; and Arrivals keeping its filter and pick in the URL.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OFFICE_ACTOR, freshAppState, useAppStore } from '../../../../store'
import { intakeSources } from '../../../../store/intakeSelectors'
import { ArrivalsView } from './ArrivalsView'
import { IntakeSection } from './IntakeSection'
import { arrivalsPath, sourcesPath } from './intakePaths'
import { SourcesView } from './SourcesView'

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin/intake" element={<IntakeSection actor={OFFICE_ACTOR} />}>
        <Route index element={<ArrivalsView actor={OFFICE_ACTOR} />} />
        <Route path="sources" element={<SourcesView />} />
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const tabs = () => document.querySelector('[data-shot="intake-tabs"]') as HTMLElement
const search = (router: ReturnType<typeof mountAt>) => new URLSearchParams(router.state.location.search)

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('IntakeSection', () => {
  it('is titled Intake with its line, and has two tabs: Arrivals (current) and Sources', () => {
    mountAt(arrivalsPath())
    expect(screen.getByRole('heading', { level: 1, name: 'Intake' })).toBeInTheDocument()
    expect(screen.getByText('From the rooms and hospitals. Nothing changes until you apply it.')).toBeInTheDocument()
    const links = within(tabs()).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('data-intake-tab'))).toEqual(['arrivals', 'sources'])
    expect(links[0]).toHaveAttribute('aria-current', 'page')
    expect(links[1]).toHaveAttribute('href', sourcesPath())
    expect(document.querySelector('[data-shot="intake-section"]')).toHaveAttribute('data-admin-page', 'fit')
  })

  it('shows the quiet sources strip with Inbound only, and a disabled Add a PDF by hand', () => {
    mountAt(arrivalsPath())
    const strip = document.querySelector('[data-shot="intake-sources-strip"]') as HTMLElement
    expect(strip).toHaveTextContent('Inbound only')
    const connected = intakeSources(useAppStore.getState()).filter((s) => s.state !== 'notConnected')
    expect(connected.length).toBeGreaterThan(0)
    for (const source of connected) expect(strip).toHaveTextContent(source.name)
    const add = screen.getByRole('button', { name: 'Add a PDF by hand' })
    expect(add).toBeDisabled()
    expect(add).toHaveAttribute('data-shot', 'intake-add-pdf')
  })

  it('has no import or upload button, and no dash in its copy', () => {
    mountAt(arrivalsPath())
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

describe('ArrivalsView', () => {
  it('picks the first item when none is in the URL, writes a pick with replace, and drops it on a new filter', () => {
    const router = mountAt(arrivalsPath())
    const options = screen.queryAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(search(router).get('item')).toBeNull()
    const last = options[options.length - 1]!
    act(() => {
      fireEvent.click(last)
    })
    expect(search(router).get('item')).toBe(last.getAttribute('data-arrival-key'))
    expect(router.state.historyAction).toBe('REPLACE')
    act(() => {
      fireEvent.click(within(screen.getByRole('group', { name: 'Show arrivals' })).getByRole('button', { name: /^Decided/ }))
    })
    expect(search(router).get('filter')).toBe('decided')
    expect(search(router).get('item')).toBeNull()
  })
})
