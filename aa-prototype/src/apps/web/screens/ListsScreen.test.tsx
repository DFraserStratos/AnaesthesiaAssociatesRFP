/**
 * The web main view, search and date lookup (catch-up Phase 38a), through the
 * real routes so the URL view state and the back-to-referrer rule run.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { ANAE, SEED_LIST_IDS, SEED_LOOKBACK } from '../../../domain/seed'
import { WebBookingDetailRoute, WebListDetailRoute, WebListsRoute } from '../routes'
import { WeekStrip } from '../components/WeekStrip'

afterEach(cleanup)

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function Where() {
  const { pathname, search } = useLocation()
  return <output data-testid="where">{`${pathname}${search}`}</output>
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route
            path="/web"
            element={
              <>
                <Outlet context={{ actor: SOUTER, anaesthetistId: ANAE.souter, personaName: 'Dr Melanie Souter', todayISO: '2026-07-21' }} />
                <Where />
              </>
            }
          >
            <Route path="lists" element={<WebListsRoute />} />
            <Route path="lists/:listId" element={<WebListDetailRoute />} />
            <Route path="lists/:listId/bookings/:bookingId" element={<WebBookingDetailRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}
const where = () => screen.getByTestId('where').textContent

describe('the web Lists main view (US-07.4.2, US-03.1.4)', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('opens with the earlier group and a Progress column, with no date to set and no From input', () => {
    renderAt('/web/lists')
    expect(screen.queryByText('From', { selector: 'label' })).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'Progress' })).toBeInTheDocument()
    const earlier = document.querySelector('[data-shot="web-main-view-earlier"]') as HTMLElement
    expect(within(earlier).getByText('Earlier, not yet authorised')).toBeInTheDocument()
    for (const id of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm]) {
      const row = earlier.querySelector(`tr[data-list-id="${id}"]`)
      expect(row?.textContent).toContain('Done · unbilled')
      expect(row).toHaveAttribute('data-quiet', 'true')
    }
  })

  it('a row opens its List from its one keyboard handle, found by role and full name (UI unification U6)', () => {
    renderAt('/web/lists')
    const row = document.querySelector(`tr[data-list-id="${SEED_LIST_IDS.souterMon20Am}"]`) as HTMLElement
    expect(row).toHaveClass('aa-clickable-table-row')
    expect(row).not.toHaveAttribute('tabindex')
    const handles = within(row).getAllByRole('button', { name: /^Open List / })
    expect(handles).toHaveLength(1)
    fireEvent.click(handles[0]!)
    expect(where()).toBe(`/web/lists/${SEED_LIST_IDS.souterMon20Am}`)
  })

  it('a search for CQY9304 lists the same three Bookings; Clear search restores the view', () => {
    renderAt('/web/lists?q=CQY9304')
    const table = document.querySelector('[data-shot="web-lookback-search"]') as HTMLElement
    expect(table.querySelectorAll('tr[data-booking-id]')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(where()).toBe('/web/lists')
    expect(document.querySelector('[data-shot="web-main-view-earlier"]')).not.toBeNull()
  })

  it('the day view for 13 March lists its List; Back from List detail returns to the day', () => {
    renderAt(`/web/lists?day=${SEED_LOOKBACK.dateISO}`)
    const day = document.querySelector('[data-shot="web-lookback-day"]') as HTMLElement
    const row = day.querySelector(`tr[data-list-id="${SEED_LOOKBACK.listId}"]`) as HTMLElement
    expect(row.textContent).toContain('Invoiced')
    fireEvent.click(row)
    expect(where()).toBe(`/web/lists/${SEED_LOOKBACK.listId}`)
    // An authorised List shows its invoices.
    expect(document.querySelector('[data-shot="list-invoices"]')?.textContent).toContain('AA-2026-H')
    fireEvent.click(screen.getByRole('button', { name: /Lists/ }))
    expect(where()).toBe(`/web/lists?day=${SEED_LOOKBACK.dateISO}`)
  })

  it('from a search result, Booking detail Back returns to the results', () => {
    renderAt('/web/lists?q=mitchell')
    const first = document.querySelector('tr[data-booking-id]') as HTMLElement
    fireEvent.click(first)
    expect(where()).toMatch(/^\/web\/lists\/[^/]+\/bookings\/[^/]+$/)
    fireEvent.click(screen.getAllByRole('button', { name: /^List$/ })[0]!)
    expect(where()).toBe('/web/lists?q=mitchell')
  })

  it("a submitted List's detail shows no Invoices; a deep link still works and Back falls back to /web/lists", () => {
    renderAt(`/web/lists/${SEED_LIST_IDS.souterMon20Pm}`)
    expect(document.querySelector('[data-shot="list-invoices"]')).toBeNull()
    expect(screen.getAllByText(/Add a booking/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Lists/ }))
    expect(where()).toBe('/web/lists')
  })

  it("a Booking on a colleague's List is not found by URL", () => {
    const sharma = Object.values(useAppStore.getState().schedule.bookings).find((b) => {
      const l = useAppStore.getState().schedule.lists[b.listId]
      return l?.anaesthetistId === ANAE.sharma
    })!
    renderAt(`/web/lists/${sharma.listId}/bookings/${sharma.id}`)
    expect(screen.queryByRole('heading', { level: 1, name: useAppStore.getState().masters.patients[sharma.patientId]!.name })).toBeNull()
  })
})

describe('the week strip marks submitted blocks (US-07.2.1)', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('labels Mon 20 Jul blocks Done · unbilled; an authorised List leaves the strip', () => {
    const { rerender } = render(
      <WeekStrip anaesthetistId={ANAE.souter} weekAnchorISO="2026-07-20" todayISO="2026-07-21" onPrevWeek={vi.fn()} onNextWeek={vi.fn()} onOpenList={vi.fn()} />,
    )
    const am = screen.getByRole('button', { name: /Forte Health.*Done · unbilled/ })
    expect(am).toHaveAttribute('data-progress', 'submitted')
    const s = useAppStore.getState()
    const pm = s.schedule.lists[SEED_LIST_IDS.souterMon20Pm]!
    useAppStore.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [pm.id]: { ...pm, state: 'AUTHORISED' } as typeof pm } } })
    rerender(<WeekStrip anaesthetistId={ANAE.souter} weekAnchorISO="2026-07-20" todayISO="2026-07-21" onPrevWeek={vi.fn()} onNextWeek={vi.fn()} onOpenList={vi.fn()} />)
    expect(document.querySelector(`[data-slot-id="${pm.slotId}"]`)).toBeNull()
  })
  it('draws a hatched (Unavailable) session hatched, through blockFill (UI unification U6, bug 7)', () => {
    const s = useAppStore.getState()
    const hatched = Object.values(s.masters.slotStatuses).find((st) => st.treatment === 'hatched')!
    const listSlots = new Set(Object.values(s.schedule.lists).map((l) => l.slotId))
    const slot = Object.values(s.schedule.slots).find(
      (sl) => sl.anaesthetistId === ANAE.souter && sl.dateISO >= '2026-07-20' && sl.dateISO <= '2026-07-26' && sl.session !== 'OOH' && !listSlots.has(sl.id),
    )!
    useAppStore.setState({ schedule: { ...s.schedule, slots: { ...s.schedule.slots, [slot.id]: { ...slot, status: hatched.key } } } })
    render(<WeekStrip anaesthetistId={ANAE.souter} weekAnchorISO="2026-07-20" todayISO="2026-07-21" onPrevWeek={vi.fn()} onNextWeek={vi.fn()} onOpenList={vi.fn()} />)
    const block = document.querySelector(`[data-slot-id="${slot.id}"]`) as HTMLElement
    expect(block.style.background).toContain('repeating-linear-gradient')
  })
})
