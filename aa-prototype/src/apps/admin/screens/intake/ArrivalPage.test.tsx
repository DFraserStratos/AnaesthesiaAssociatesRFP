/**
 * The opened arrival (27 Nov 2026 rebuild; O1) on the real store: the header's words, Previous, "n of N" and Next in
 * the inbox query's order, J and K, Back and Escape keeping the query, an unknown key, Next arrival once decided, and
 * a Needs NHI arrival's outcome kept after it leaves. The decision's buttons sit in the column's footer, never the header.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_INBOX_QUERY, inboxItems, type InboxQuery } from '../../../../domain/intake/inbox'
import { OKAFOR_ROOMS_PDF, OKAFOR_STORY } from '../../../../domain/intake/hospitalDownloads'
import { SEED_STUB } from '../../../../domain/seed/intakeSeed'
import { plural } from '../../../../shared/format'
import { SurfaceProvider } from '../../../../shared/surface'
import { OFFICE_ACTOR, freshAppState, receiveMailboxPdf, useAppStore } from '../../../../store'
import { receiveFailedMessage } from '../../../../store/intakeIngest'
import { arrivalItemsOf } from '../../../../store/intakeSelectors'
import { ArrivalPage } from './ArrivalPage'
import { receivedWhenText, surgeryWhenText } from './workbench/arrivalText'
import { arrivalPath, inboxPath } from './intakePaths'

function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin/intake">
        <Route index element={<p data-testid="inbox">Inbox</p>} />
        <Route path="arrival/:key" element={<ArrivalPage actor={OFFICE_ACTOR} />} />
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

const q = (sel: string) => document.querySelector<HTMLElement>(sel)
const where = (router: ReturnType<typeof mountAt>) => `${router.state.location.pathname}${router.state.location.search}`
const order = (patch: Partial<InboxQuery> = {}) => {
  const s = useAppStore.getState()
  return inboxItems(arrivalItemsOf(s), { ...DEFAULT_INBOX_QUERY, ...patch }, s.clock.todayISO, s.intake).map((i) => i.key)
}
const press = (key: string, target: Element | Window = window) =>
  act(() => {
    fireEvent.keyDown(target, { key })
  })

function okaforKey(): string {
  const out = receiveMailboxPdf(useAppStore, OKAFOR_ROOMS_PDF)
  if (!out.ok) throw new Error(out.message)
  return arrivalItemsOf(useAppStore.getState()).find((i) => i.batchId === out.value.batchId && i.kind === 'newList')!.key
}

beforeEach(() => {
  useAppStore.setState(freshAppState())
})
afterEach(cleanup)

describe('ArrivalPage: the header', () => {
  it("names the List in words, with one quiet line and no decision in it (Mr Okafor's new List)", () => {
    const key = okaforKey()
    const item = arrivalItemsOf(useAppStore.getState()).find((i) => i.key === key)!
    mountAt(arrivalPath(key))
    const title = screen.getByRole('heading', { level: 1 })
    expect(title.textContent).toMatch(/Okafor, .+, Wednesday 25 November PM$/)
    const page = q('[data-shot="intake-arrival-page"]')!
    expect(page).toHaveAttribute('data-arrival-kind', 'newList')
    expect(page.textContent).toContain(`New List · ${plural(item.counts.rows, 'patient')} · surgery tomorrow · from `)
    expect(page.textContent).not.toMatch(/\.example|by the rooms' mailbox|[–—]/)
    // The header moves you; the decision sits in the decision column's footer.
    const nav = screen.getByTestId('intake-arrival-navigation')
    expect(within(nav).getAllByRole('button').map((b) => b.textContent?.trim())).toEqual(['Previous', 'Next'])
    const footer = q('[data-decision-footer]')!
    expect(within(footer).getByRole('button', { name: 'Reject this List' })).toBeInTheDocument()
    const place = footer.querySelector('[data-shot="intake-place-list-submit"]')!
    expect(place.textContent).toBe("Place in Dr Rutherford's PM")
    // Secondary first, primary last.
    expect(within(footer).getAllByRole('button').map((b) => b.textContent)).toEqual(['Reject this List', "Place in Dr Rutherford's PM"])
    expect(footer.textContent).toContain('Creates the List with 3 Bookings and a stub for Sione Faleolo.')
  })

  it('reads days to surgery and when it was received in words', () => {
    expect(surgeryWhenText(undefined)).toBeUndefined()
    expect(surgeryWhenText(0)).toBe('surgery today')
    expect(surgeryWhenText(1)).toBe('surgery tomorrow')
    expect(surgeryWhenText(22)).toBe('surgery in 22 days')
    expect(receivedWhenText('2026-11-24T08:12:00', '2026-11-24')).toBe('received today at 08:12')
    expect(receivedWhenText('2026-11-23T16:40:00', '2026-11-24')).toBe('received Mon 23 Nov at 16:40')
  })

  it('an unknown key says so and links back to the inbox', () => {
    mountAt(arrivalPath('nope'))
    expect(q('[data-shot="intake-arrival-gone"]')).toHaveTextContent('This arrival is no longer here.')
    expect(screen.getByRole('link', { name: 'Back to Arrivals' })).toHaveAttribute('href', inboxPath())
  })
})

describe("ArrivalPage: Previous, Next and Back follow the inbox's query", () => {
  it('steps in the order of the query in the URL, with n of N, and keeps the query', () => {
    const query: InboxQuery = { ...DEFAULT_INBOX_QUERY, sort: { key: 'received', dir: 'desc' } }
    const keys = order(query)
    expect(keys.length).toBeGreaterThan(3)
    const router = mountAt(arrivalPath(keys[1]!, query))
    expect(q('[data-shot="intake-arrival-position"]')).toHaveTextContent(`2 of ${keys.length}`)
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }))
    expect(where(router)).toBe(arrivalPath(keys[2]!, query))
    expect(q('[data-shot="intake-arrival-position"]')).toHaveTextContent(`3 of ${keys.length}`)
    fireEvent.click(screen.getByRole('button', { name: /^Previous$/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Previous$/ }))
    expect(where(router)).toBe(arrivalPath(keys[0]!, query))
    expect(screen.getByRole('button', { name: /^Previous$/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('link', { name: /Arrivals/ }))
    expect(where(router)).toBe(inboxPath(query))
  })

  it('J and K step; a typed J does not; Escape goes back to the inbox with its query', () => {
    const query: InboxQuery = { ...DEFAULT_INBOX_QUERY, source: 'rooms' }
    const keys = order(query)
    expect(keys.length).toBeGreaterThan(2)
    const router = mountAt(arrivalPath(keys[0]!, query))
    press('j')
    expect(where(router)).toBe(arrivalPath(keys[1]!, query))
    press('k')
    expect(where(router)).toBe(arrivalPath(keys[0]!, query))
    press('j', document.body)
    expect(where(router)).toBe(arrivalPath(keys[1]!, query))
    const field = document.querySelector('input, textarea')
    if (field !== null) {
      press('j', field)
      expect(where(router)).toBe(arrivalPath(keys[1]!, query))
    }
    press('Escape')
    expect(where(router)).toBe(inboxPath(query))
  })
})

describe('ArrivalPage: once decided', () => {
  it('the footer offers Next arrival, and Previous and Next still step from where it stood', () => {
    const out = receiveFailedMessage(useAppStore, OKAFOR_STORY.failedMessage.hospitalId, {
      label: OKAFOR_STORY.failedMessage.label,
      reason: OKAFOR_STORY.failedMessage.reason,
      raw: OKAFOR_STORY.failedMessage.raw,
    })
    if (!out.ok) throw new Error(out.message)
    const key = arrivalItemsOf(useAppStore.getState()).find((a) => a.batchId === out.value.batchId)!.key
    const keys = order()
    const at = keys.indexOf(key)
    expect(at).toBeGreaterThan(0)
    const router = mountAt(arrivalPath(key))

    fireEvent.click(q('[data-shot="intake-held-dismiss"]')!)
    const sheet = q('[data-shot="intake-held-dismiss-sheet"]')!
    fireEvent.change(within(sheet).getByLabelText('Reason'), { target: { value: 'Sent again with the patient' } })
    act(() => {
      fireEvent.click(within(sheet).getByRole('button', { name: 'Dismiss' }))
    })

    // Decided: gone from To decide, the outcome stays and the footer moves on.
    expect(order()).not.toContain(key)
    expect(q('[data-shot="intake-held-dismissed"]')).toHaveTextContent('Sent again with the patient')
    const nextKey = keys[at + 1]
    if (nextKey !== undefined) {
      expect(screen.getByRole('button', { name: /^Previous$/ })).toBeEnabled()
      fireEvent.click(q('[data-shot="intake-next-arrival"]')!)
      expect(where(router)).toBe(arrivalPath(nextKey))
    } else {
      expect(q('[data-shot="intake-next-arrival"]')).toBeNull()
    }
  })

  it('a Needs NHI arrival keeps its bench and the outcome after its NHI is added', () => {
    const key = arrivalItemsOf(useAppStore.getState()).find((i) => i.kind === 'needsNhi' && i.rowIds.includes(SEED_STUB.rowId))!.key
    mountAt(arrivalPath(key, { ...DEFAULT_INBOX_QUERY, show: 'needsNhi' }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(SEED_STUB.patientName)
    const footer = q('[data-decision-footer]')!
    fireEvent.click(within(footer).getByRole('button', { name: 'Add NHI' }))
    const sheet = q('[data-shot="add-nhi-sheet"]')!
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: SEED_STUB.nhiToType } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))

    expect(arrivalItemsOf(useAppStore.getState()).some((i) => i.key === key)).toBe(false)
    expect(q('[data-shot="intake-arrival-gone"]')).toBeNull()
    expect(q('[data-shot="intake-bench-needsNhi"]')).not.toBeNull()
    expect(q('[data-shot="add-nhi-done"]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(SEED_STUB.patientName)
  })
})
