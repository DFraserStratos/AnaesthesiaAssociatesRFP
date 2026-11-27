/**
 * The out-of-hours session on screen (catch-up Phase 32c; US-01.1.6): the
 * Admin Day row control and the evening block on a longer ruler (unchanged on
 * a day without one), the open sheet, and the anaesthetist's mobile day with
 * the evening List after PM.
 */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assignListToSlot, freshAppState, openOutOfHoursSession, rosterForDate, slotViewsForDate, useAppStore, type Actor, type SlotView } from '../store'
import { SurfaceProvider } from '../shared'
import { ANAE, HOSP, SEED_LIST_IDS, SURG } from '../domain/seed'
import { slotIdFor } from '../domain/slots'
import { DayGrid } from './admin/components/DayGrid'
import { OpenOutOfHoursSheet } from './admin/flows/OpenOutOfHoursSheet'
import { MobileListsRoute } from './mobile/routes'

afterEach(cleanup)

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const TODAY = '2026-11-24'
const SOUTER_OOH = slotIdFor(ANAE.souter, TODAY, 'OOH')

function renderGrid(onOpen = vi.fn()) {
  const state = useAppStore.getState()
  const byAnae: Record<string, SlotView[]> = {}
  for (const v of slotViewsForDate(state, TODAY)) (byAnae[v.slot.anaesthetistId] ??= []).push(v)
  return render(
    <DayGrid anaesthetists={rosterForDate(state, TODAY)} viewsByAnaesthetist={byAnae} masters={state.masters} warningFlags={new Map()} onSelectSlot={vi.fn()} onOpenOutOfHours={onOpen} />,
  )
}
const rulerLabels = (root: HTMLElement) => [...root.querySelectorAll('.mono')].map((n) => n.textContent ?? '').filter((t) => /^\d\d:00$/.test(t))

describe('Admin Day', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('without an evening session: ruler to 18:00, no evening block, the open control on each row', () => {
    const onOpen = vi.fn()
    const { container } = renderGrid(onOpen)
    expect(rulerLabels(container).at(-1)).toBe('18:00')
    expect(container.querySelector('[data-shot="daygrid-evening-block"]')).toBeNull()
    const open = container.querySelector(`[data-day-grid-row="${ANAE.souter}"] [data-shot="out-of-hours-open"]`) as HTMLButtonElement
    expect(open).toHaveAccessibleName(/Open out-of-hours session for Souter/)
    fireEvent.click(open)
    expect(onOpen).toHaveBeenCalledWith(ANAE.souter)
  })

  it('a day without one draws every block exactly as before; an evening session elsewhere changes nothing here', () => {
    const styles = (root: HTMLElement) => [...root.querySelectorAll('[data-slot-id]')].map((n) => (n as HTMLElement).getAttribute('style'))
    const first = renderGrid()
    const before = styles(first.container)
    first.unmount()
    expect(openOutOfHoursSession(useAppStore, OFFICE, ANAE.souter, '2026-11-25').ok).toBe(true)
    expect(styles(renderGrid().container)).toEqual(before)
  })

  it('with one: the ruler runs past 18:00, the evening block sits after PM, and that row offers no second', () => {
    expect(openOutOfHoursSession(useAppStore, OFFICE, ANAE.souter, TODAY).ok).toBe(true)
    const { container } = renderGrid()
    expect(rulerLabels(container)).toContain('18:00')
    expect(rulerLabels(container).at(-1)).toBe('21:00')
    const block = container.querySelector(`[data-day-grid-row="${ANAE.souter}"] [data-shot="daygrid-evening-block"]`) as HTMLElement
    expect(block.dataset.slotId).toBe(SOUTER_OOH)
    expect(block).toHaveTextContent('Out-of-hours')
    const pm = container.querySelector(`[data-list-id="${SEED_LIST_IDS.souterPm21}"]`) as HTMLElement
    expect(parseFloat(block.style.left)).toBeGreaterThan(parseFloat(pm.style.left))
    expect(container.querySelector(`[data-day-grid-row="${ANAE.souter}"] [data-shot="out-of-hours-open"]`)).toBeNull()
  })
})

describe('OpenOutOfHoursSheet', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('starts at the default 18:00 to 21:00 and opens the session, handing back its id', () => {
    const onOpened = vi.fn()
    render(
      <SurfaceProvider variant="web">
        <OpenOutOfHoursSheet open anaesthetistId={ANAE.souter} dateISO={TODAY} actor={OFFICE} onClose={vi.fn()} onOpened={onOpened} />
      </SurfaceProvider>,
    )
    const sheet = document.querySelector('[data-shot="out-of-hours-open-sheet"]') as HTMLElement
    expect(within(sheet).getByLabelText('Start')).toHaveValue('18:00')
    expect(within(sheet).getByLabelText('End')).toHaveValue('21:00')
    expect(sheet.textContent ?? '').not.toMatch(/slot|[–—]/i)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Open out-of-hours session' }))
    expect(onOpened).toHaveBeenCalledWith(SOUTER_OOH)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Open out-of-hours session' }))
    expect(within(sheet).getByRole('alert')).toHaveTextContent('This anaesthetist already has an out-of-hours session that day.')
  })
})

describe('the anaesthetist sees it after PM', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))

  it('mobile Lists: the evening List after PM, a moon and 18:00, "Out-of-hours" leading the subtitle', () => {
    expect(openOutOfHoursSession(useAppStore, OFFICE, ANAE.souter, TODAY).ok).toBe(true)
    const out = assignListToSlot(useAppStore, OFFICE, SOUTER_OOH, { hospitalId: HOSP.sx, surgeonId: SURG.patel, kind: 'private' })
    if (!out.ok) throw new Error(out.message)
    const { container } = render(
      <MemoryRouter initialEntries={['/mobile/lists']}>
        <SurfaceProvider variant="mobile">
          <Routes>
            <Route path="/mobile" element={<Outlet context={{ actor: SOUTER, anaesthetistId: ANAE.souter, personaName: 'Dr Melanie Souter', personaRole: 'Anaesthetist', initials: 'MS' }} />}>
              <Route path="lists/*" element={<MobileListsRoute />} />
            </Route>
          </Routes>
        </SurfaceProvider>
      </MemoryRouter>,
    )
    const ids = [...container.querySelectorAll('[data-list-id]')].map((n) => (n as HTMLElement).dataset.listId)
    expect(ids.indexOf(out.value.listId)).toBe(ids.indexOf(SEED_LIST_IDS.souterPm21) + 1)
    const row = container.querySelector(`[data-shot="out-of-hours-row"][data-list-id="${out.value.listId}"]`) as HTMLElement
    expect(row).toHaveTextContent('18:00')
    expect(row).toHaveTextContent('Out-of-hours · Ms K. Patel')
    expect(screen.queryByText('OOH')).toBeNull()
  })
})
