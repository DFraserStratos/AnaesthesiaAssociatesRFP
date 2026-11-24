/**
 * The phone's main view, search and date lookup (catch-up Phase 38a), through
 * the real `MobileListsRoute` so the URL view state and the pops are exercised.
 */

import { cleanup, act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { freshAppState, uncompleteBooking, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared'
import { ANAE, SEED_LIST_IDS, SEED_LOOKBACK } from '../../../domain/seed'
import { MobileListsRoute } from '../routes'

afterEach(cleanup)

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function Where() {
  const { pathname, search } = useLocation()
  return <output data-testid="where">{`${pathname}${search}`}</output>
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <SurfaceProvider variant="mobile">
        <Routes>
          <Route
            path="/mobile"
            element={
              <>
                <Outlet context={{ actor: SOUTER, anaesthetistId: ANAE.souter, personaName: 'Dr Melanie Souter', personaRole: 'Anaesthetist', initials: 'MS' }} />
                <Where />
              </>
            }
          >
            <Route path="lists/*" element={<MobileListsRoute />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const where = () => screen.getByTestId('where').textContent

describe('the mobile main view (US-07.4.2)', () => {
  const realOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
  beforeEach(() => {
    useAppStore.setState(freshAppState())
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset['testid'] === 'mobile-lists-today' ? 400 : 0
      },
    })
  })
  afterEach(() => {
    if (realOffsetTop !== undefined) Object.defineProperty(HTMLElement.prototype, 'offsetTop', realOffsetTop)
  })

  it("shows Mon 23 Nov's submitted Lists in the earlier group above Today, quieter, Done · unbilled", () => {
    renderAt('/mobile/lists')
    const earlier = screen.getByRole('region', { name: 'Earlier Lists not yet authorised' })
    for (const id of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm]) {
      const row = earlier.querySelector(`[data-list-id="${id}"]`)
      expect(row, id).not.toBeNull()
      expect(row).toHaveAttribute('data-quiet', 'true')
      expect(row?.textContent).toContain('Done · unbilled')
    }
    // The earlier group comes before the Today anchor in the scroller.
    const today = screen.getByTestId('mobile-lists-today')
    expect(earlier.compareDocumentPosition(today) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // No backdrop List and none of the empty 7 to 16 July Lists.
    expect(document.querySelector('[data-list-id^="L-HIST"]')).toBeNull()
    expect(document.querySelector('[data-list-id="L-34821-2026-11-17-AM"]')).toBeNull()
  })

  it('opens with Today at the top of the scroller and the hint scrolls back', () => {
    renderAt('/mobile/lists')
    const scroller = screen.getByTestId('mobile-lists-scroll')
    // Scrolled down to the Today anchor (the exact position is Playwright's to check).
    expect(scroller.scrollTop).toBeGreaterThan(0)
    // Mon 13 Jul AM (catch-up Phase 23) and Mon 20 Jul AM and PM.
    const hint = screen.getByRole('button', { name: /3 earlier Lists not yet authorised/ })
    fireEvent.click(hint)
    expect(scroller.scrollTop).toBe(0)
  })

  it('a Booking reopened on a submitted List shows it as to finish, under To-Do, not Done (owner, 2026-11-10)', () => {
    const pm = SEED_LIST_IDS.souterMon20Pm
    const booking = Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === pm && b.cancellation === undefined)!
    act(() => {
      uncompleteBooking(useAppStore, SOUTER, booking.id)
    })
    renderAt('/mobile/lists')
    const row = document.querySelector(`[data-list-id="${pm}"]`)
    expect(row?.textContent).toContain('1 to finish')
    expect(row).not.toHaveAttribute('data-quiet')
    fireEvent.click(screen.getByRole('button', { name: 'To-Do' }))
    expect(document.querySelector(`[data-list-id="${pm}"]`)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(document.querySelector(`[data-list-id="${pm}"]`)).toBeNull()
    expect(document.querySelector(`[data-list-id="${SEED_LIST_IDS.souterMon20Am}"]`)).not.toBeNull()
  })

  it('Done shows the submitted Lists; an authorised List appears under no chip', () => {
    act(() => {
      const s = useAppStore.getState()
      const l = s.schedule.lists[SEED_LIST_IDS.souterMon20Pm]!
      useAppStore.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [l.id]: { ...l, state: 'AUTHORISED' } as typeof l } } })
    })
    renderAt('/mobile/lists')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(document.querySelector(`[data-list-id="${SEED_LIST_IDS.souterMon20Am}"]`)).not.toBeNull()
    expect(document.querySelector(`[data-list-id="${SEED_LIST_IDS.souterMon20Pm}"]`)).toBeNull()
    // Done holds only earlier Lists here: no "nothing waiting" copy contradicts them.
    expect(screen.queryByText('No submitted Lists waiting for the office.')).toBeNull()
    for (const chip of ['Week', 'Month', 'To-Do']) {
      fireEvent.click(screen.getByRole('button', { name: chip }))
      expect(document.querySelector(`[data-list-id="${SEED_LIST_IDS.souterMon20Pm}"]`), chip).toBeNull()
    }
  })
})

describe('mobile search and date lookup (US-03.1.6, US-03.1.7)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('typing "mitch" shows Upcoming and Past, and writes ?q= with replace', () => {
    renderAt('/mobile/lists')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search your Bookings' }), { target: { value: 'mitch' } })
    expect(where()).toBe('/mobile/lists?q=mitch')
    const results = document.querySelector('[data-shot="mobile-lookback-search"]') as HTMLElement
    expect(within(results).getByRole('region', { name: 'Upcoming Bookings' }).querySelectorAll('button')).toHaveLength(1)
    expect(within(results).getByRole('region', { name: 'Past Bookings' }).querySelectorAll('button')).toHaveLength(2)
    expect(screen.getByTestId('mobile-lists-search-count').textContent).toBe('3 Bookings for mitch')
  })

  it('tapping a result opens the Booking route; back goes to its List, then to the results', () => {
    renderAt('/mobile/lists?q=mitch')
    const past = screen.getByRole('region', { name: 'Past Bookings' })
    fireEvent.click(within(past).getAllByRole('button')[1]!)
    expect(where()).toMatch(new RegExp(`^/mobile/lists/${SEED_LOOKBACK.listId}/bookings/HBK\\d+$`))
    fireEvent.click(screen.getAllByRole('button', { name: /^List$/ })[0]!)
    expect(where()).toBe(`/mobile/lists/${SEED_LOOKBACK.listId}`)
    fireEvent.click(screen.getAllByRole('button', { name: /^Lists$/ })[0]!)
    expect(where()).toBe('/mobile/lists?q=mitch')
  })

  it('?day=2026-03-13 shows that day\'s history List under the day chip; closing it returns to the main view', () => {
    renderAt(`/mobile/lists?day=${SEED_LOOKBACK.dateISO}`)
    const chip = screen.getByTestId('mobile-lists-day-chip')
    expect(chip.textContent).toContain('Fri 13 Mar 2026')
    const row = document.querySelector(`[data-list-id="${SEED_LOOKBACK.listId}"]`)
    expect(row?.textContent).toContain('Invoiced')
    fireEvent.click(chip)
    expect(where()).toBe('/mobile/lists')
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('closing the day chip returns to the chip that was chosen before', () => {
    renderAt('/mobile/lists')
    fireEvent.click(screen.getByRole('button', { name: 'Month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to a date' }))
    const sheet = document.querySelector('[data-shot="mobile-lookback-calendar"]') as HTMLElement
    fireEvent.click(within(sheet).getByRole('button', { name: /^Monday 23 November 2026/ }))
    expect(where()).toBe('/mobile/lists?day=2026-11-23')
    fireEvent.click(screen.getByTestId('mobile-lists-day-chip'))
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a junk ?day= is ignored', () => {
    renderAt('/mobile/lists?day=not-a-date')
    expect(screen.queryByTestId('mobile-lists-day-chip')).toBeNull()
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument()
  })

  it('the calendar button opens the date sheet; picking a day sets ?day=', () => {
    renderAt('/mobile/lists')
    fireEvent.click(screen.getByRole('button', { name: 'Go to a date' }))
    const sheet = document.querySelector('[data-shot="mobile-lookback-calendar"]') as HTMLElement
    expect(sheet).not.toBeNull()
    fireEvent.click(within(sheet).getByRole('button', { name: /^Tuesday 24 November 2026/ }))
    expect(where()).toBe('/mobile/lists?day=2026-11-24')
  })
})

describe("a submitted List's Booking stays editable (US-07.2.1)", () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('Mon 23 Nov PM shows Add a booking and the Booking its Amend control', () => {
    const booking = Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === SEED_LIST_IDS.souterMon20Pm)!
    renderAt(`/mobile/lists/${SEED_LIST_IDS.souterMon20Pm}`)
    expect(screen.getAllByText('Add a booking').length).toBeGreaterThan(0)
    renderAt(`/mobile/lists/${SEED_LIST_IDS.souterMon20Pm}/bookings/${booking.id}`)
    expect(screen.getAllByRole('button', { name: /Amend/ }).length).toBeGreaterThan(0)
  })

  it("a colleague's Booking under her own List's URL falls back to her List", () => {
    const sharma = Object.values(useAppStore.getState().schedule.bookings).find(
      (b) => useAppStore.getState().schedule.lists[b.listId]?.anaesthetistId === ANAE.sharma,
    )!
    renderAt(`/mobile/lists/${SEED_LIST_IDS.souterMon20Pm}/bookings/${sharma.id}`)
    expect(where()).toBe(`/mobile/lists/${SEED_LIST_IDS.souterMon20Pm}`)
  })

  it('an authorised List shows its Invoices and no Add a booking', () => {
    renderAt(`/mobile/lists/${SEED_LOOKBACK.listId}`)
    expect(screen.getByRole('region', { name: 'Invoices' }).textContent).toContain('AA-2026-H')
    expect(screen.queryByText('Add a booking')).toBeNull()
    expect(screen.getAllByText(/Invoiced · read only/).length).toBeGreaterThan(0)
  })
})
