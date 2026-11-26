/**
 * The Intake section (build plan Phase 68; D117): the title and its line, the two routed tabs, the quiet
 * sources strip with "Inbound only", the one disabled "Add a PDF by hand" in the feed's foot, no import or
 * upload button and no dash in the copy; and Arrivals keeping its filter and pick in the URL, and keeping a decided
 * item's bench (with its decision) until the office moves on.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OFFICE_ACTOR, freshAppState, useAppStore } from '../../../../store'
import { rejectArrivalList } from '../../../../store/intakePlace'
import { arrivalFeed, arrivalItemsOf, intakeSources } from '../../../../store/intakeSelectors'
import { SEED_STUB } from '../../../../domain/seed/intakeSeed'
import { SurfaceProvider } from '../../../../shared/surface'
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
  render(
    <SurfaceProvider variant="web">
      <RouterProvider router={router} />
    </SurfaceProvider>,
  )
  return router
}

const tabs = () => document.querySelector('[data-shot="intake-tabs"]') as HTMLElement
const search = (router: ReturnType<typeof mountAt>) => new URLSearchParams(router.state.location.search)
const workbench = () => document.querySelector('[data-shot="intake-workbench"]') as HTMLElement
const shownKeys = () => screen.queryAllByRole('option').map((o) => o.getAttribute('data-arrival-key'))

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

  it('shows the quiet sources strip with Inbound only, and Add a PDF by hand', () => {
    mountAt(arrivalsPath())
    const strip = document.querySelector('[data-shot="intake-sources-strip"]') as HTMLElement
    expect(strip).toHaveTextContent('Inbound only')
    const connected = intakeSources(useAppStore.getState()).filter((s) => s.state !== 'notConnected')
    expect(connected.length).toBeGreaterThan(0)
    for (const source of connected) expect(strip).toHaveTextContent(source.name)
    const add = screen.getByRole('button', { name: 'Add a PDF by hand' })
    // Phase 70 fills Add a PDF by hand and flips ADD_PDF_BY_HAND_READY, so it is enabled.
    expect(add).toBeEnabled()
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

  it('keeps a decided item picked with its decision shown, though it has left To decide, until the office moves on', () => {
    const toDecide = arrivalFeed(useAppStore.getState(), { kind: 'toDecide' }, '').flatMap((g) => g.items)
    const list = toDecide.find((i) => i.kind === 'newList')
    expect(list).toBeDefined()
    const router = mountAt(arrivalsPath())
    act(() => {
      fireEvent.click(document.querySelector(`[role="option"][data-arrival-key="${list!.key}"]`)!)
    })
    act(() => {
      const out = rejectArrivalList(useAppStore, OFFICE_ACTOR, list!.key, 'Sent in error')
      expect(out.ok).toBe(true)
    })
    expect(shownKeys()).not.toContain(list!.key)
    expect(search(router).get('item')).toBe(list!.key)
    expect(workbench()).toHaveAttribute('data-arrival-key', list!.key)
    expect(workbench().querySelector('[data-shot="intake-newlist-decided"]')).not.toBeNull()
    expect(screen.queryAllByRole('option').some((o) => o.getAttribute('aria-selected') === 'true')).toBe(false)

    // J from an item no longer listed goes to the first one shown.
    act(() => {
      fireEvent.keyDown(window, { key: 'j' })
    })
    const first = shownKeys()[0]!
    expect(search(router).get('item')).toBe(first)
    expect(workbench()).toHaveAttribute('data-arrival-key', first)
  })

  it('Add NHI on the first item: the item is written to the URL and its bench keeps the outcome after it leaves the feed', () => {
    const key = arrivalItemsOf(useAppStore.getState()).find((i) => i.kind === 'needsNhi' && i.rowIds.includes(SEED_STUB.rowId))!.key
    const router = mountAt(arrivalsPath({ filter: { kind: 'needsNhi' }, q: SEED_STUB.patientName }))
    expect(search(router).get('item')).toBeNull()
    expect(workbench()).toHaveAttribute('data-arrival-key', key)
    act(() => {
      fireEvent.click(within(workbench()).getByRole('button', { name: 'Add NHI' }))
    })
    const sheet = document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
    act(() => {
      fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: SEED_STUB.nhiToType } })
    })
    act(() => {
      fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))
    })
    expect(arrivalItemsOf(useAppStore.getState()).some((i) => i.key === key)).toBe(false)
    expect(shownKeys()).not.toContain(key)
    expect(search(router).get('item')).toBe(key)
    expect(workbench()).toHaveAttribute('data-arrival-key', key)
    expect(document.querySelector('[data-shot="add-nhi-done"]')?.textContent).toBe("Mere Tipene is now on Dr Souter's List.")
    expect(document.querySelector('[data-shot="waiting-nhi-empty"]')).not.toBeNull()
  })
})
