/**
 * Assign Draft List (catch-up Phase 31; US-01.6.3, US-01.3.5, US-01.3.6): the
 * grouped, tier-ordered picker on Phase 17's helper, the reshuffle, the tier
 * filter, the occupied rows, the warnings and "Assign anyway", a passed day,
 * and the drawer's "Available that session".
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, SEED_DRAFT_LIST_IDS } from '../../../domain/seed'
import { recurringClashListId } from '../../../domain/draftLists'
import { slotIdFor } from '../../../domain/slots'
import { advanceClockDays, freshAppState, simulateIncomingDraftListRequest, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { AssignDraftListSheet } from './AssignDraftListSheet'
import { DraftListDrawer } from '../components/DraftListDrawer'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
/** Seeded recurring clash: Dr Beaumont's Fri 24 AM at CES (RCB022). Dr Ngata's acute Tue 21 AM went with the public List kind (catch-up Phase 32d). */
const CLOSED_CLASH = recurringClashListId('RCB022', '2026-11-27', 'AM')
const BEAUMONT_FRI = recurringClashListId('RCB022', '2026-11-27', 'AM')

function renderSheet(listId: string, initialAnaesthetistId?: string) {
  const onAssigned = vi.fn()
  const ui = (open: boolean) => (
    <SurfaceProvider variant="web">
      <AssignDraftListSheet
        open={open}
        listId={listId}
        actor={OFFICE}
        {...(initialAnaesthetistId !== undefined ? { initialAnaesthetistId } : {})}
        onClose={vi.fn()}
        onAssigned={onAssigned}
        onOpenOccupied={vi.fn()}
      />
    </SurfaceProvider>
  )
  const view = render(ui(true))
  return { ...view, onAssigned, reopen: () => { view.rerender(ui(false)); view.rerender(ui(true)) } }
}

const rowsIn = (container: HTMLElement, shot: string) => {
  const el = container.querySelector(`[data-shot="${shot}"]`)
  return el === null ? [] : Array.from(el.querySelectorAll<HTMLElement>('button[data-candidate]'))
}
const tiersOf = (rows: HTMLElement[]) => rows.map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))
const idsOf = (rows: HTMLElement[]) => rows.map((r) => r.getAttribute('data-candidate'))

describe('AssignDraftListSheet', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows everybody potentially available in headed groups, Everyone by default; Free only hides the last two', () => {
    const { container } = renderSheet(SEED_DRAFT_LIST_IDS.stGeorges)
    expect(screen.getByRole('region', { name: 'Free' })).toBeInTheDocument()
    expect(idsOf(rowsIn(container, 'candidates-clear'))).toEqual(expect.arrayContaining([ANAE.fitzgerald, ANAE.sharma]))
    expect(container.querySelector('[data-shot="candidates-not-available"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-candidate-occupied]').length).toBeGreaterThan(0)
    // An occupied row is never a button and reads why.
    const occupied = container.querySelector('[data-candidate-occupied]') as HTMLElement
    expect(occupied.tagName).not.toBe('BUTTON')
    expect(occupied).toHaveTextContent(/Resolve it in the Day view first\./)
    fireEvent.click(within(container.querySelector('[data-shot="draft-list-reach"]') as HTMLElement).getByText('Free only'))
    expect(container.querySelector('[data-shot="candidates-not-available"]')).toBeNull()
    expect(container.querySelectorAll('[data-candidate-occupied]')).toHaveLength(0)
  })

  it('orders each group by tier, reshuffles within a tier on reopening, and the tier filter narrows every group', () => {
    const view = renderSheet(SEED_DRAFT_LIST_IDS.stGeorges)
    const free = rowsIn(view.container, 'candidates-clear')
    expect(tiersOf(free)).toEqual([...tiersOf(free)].sort((a, b) => a - b))
    const closedTiers = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-shot="candidates-not-available"] [data-candidate-closed]')).map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))
    expect(closedTiers(view.container).length).toBeGreaterThan(0)
    expect(closedTiers(view.container)).toEqual([...closedTiers(view.container)].sort((a, b) => a - b))
    const orders = new Set<string>([idsOf(free).join(',')])
    for (let i = 0; i < 8; i++) {
      view.reopen()
      const again = rowsIn(view.container, 'candidates-clear')
      expect(tiersOf(again)).toEqual(tiersOf(free))
      orders.add(idsOf(again).join(','))
    }
    expect(orders.size).toBeGreaterThan(1)
    fireEvent.click(within(view.container.querySelector('[data-shot="tier-filter"]') as HTMLElement).getByText('Tier 1'))
    expect(tiersOf(rowsIn(view.container, 'candidates-clear')).every((t) => t === 1)).toBe(true)
    expect(closedTiers(view.container).every((t) => t === 1)).toBe(true)
  })

  it('Dr Sharma for Ms Reid\'s request sits apart, still selectable; choosing her warns and reads "Assign anyway"', () => {
    const res = simulateIncomingDraftListRequest(useAppStore, 'ces-reid-thu-pm')
    if (!res.ok) throw new Error(res.message)
    const { container } = renderSheet(res.value.listId)
    expect(screen.getByText('Not preferred with Ms Reid')).toBeInTheDocument()
    // The group is "Not preferred" (US-01.3.5): nothing in the picker calls a pairing a conflict, a hospital closure only.
    expect(screen.getByRole('region', { name: /^Not preferred/ })).toBe(container.querySelector('[data-shot="candidates-not-preferred"]'))
    expect(container.querySelector('[data-shot="draft-list-candidates"]')!.textContent).not.toMatch(/conflict/i)
    const apart = rowsIn(container, 'candidates-not-preferred')
    expect(idsOf(apart)).toEqual([ANAE.sharma])
    fireEvent.click(apart[0]!)
    expect(container.querySelector('[data-shot="assign-draft-list-pairing-warning"]')).toHaveTextContent('Ms A. Reid prefers not to work with Dr Priya Sharma.')
    expect(screen.getByRole('button', { name: 'Assign anyway' })).toBeInTheDocument()
  })

  it('a Preferred pill shows and never warns (Dr Sharma with Mr Whitford)', () => {
    const { container } = renderSheet(BEAUMONT_FRI)
    const sharma = rowsIn(container, 'candidates-clear').find((r) => r.getAttribute('data-candidate') === ANAE.sharma)
    expect(sharma).toBeDefined()
    expect(sharma!).toHaveTextContent('Preferred')
    fireEvent.click(sharma!)
    expect(container.querySelector('[data-shot="assign-draft-list-pairing-warning"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Assign Draft List' })).toBeInTheDocument()
  })

  it('a closed session is shown but never selectable; the colleague stand-in makes it available, then it assigns with the success moment (US-01.6.3, D59)', () => {
    vi.useFakeTimers()
    const { container, onAssigned } = renderSheet(CLOSED_CLASH)
    const row = container.querySelector(`[data-shot="candidates-not-available"] [data-candidate-closed="${ANAE.beaumont}"]`) as HTMLElement
    expect(row).not.toBeNull()
    expect(row.tagName).not.toBe('BUTTON')
    expect(row.getAttribute('role')).toBe('group')
    expect(row.getAttribute('aria-label')).toMatch(/: not available this session$/)
    expect(row).toHaveTextContent('Not available this session')
    expect(container.textContent).not.toMatch(/flags a conflict/)
    expect(rowsIn(container, 'candidates-not-available')).toEqual([])
    fireEvent.click(within(row).getByRole('button', { name: 'Ask Dr Beaumont to make this session available' }))
    const beaumont = rowsIn(container, 'candidates-clear').find((r) => r.getAttribute('data-candidate') === ANAE.beaumont)!
    expect(beaumont).toBeDefined()
    fireEvent.click(beaumont)
    expect(container.querySelector('[data-shot="assign-draft-list-closed-warning"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Assign Draft List' }))
    expect(screen.getByText('Draft List assigned')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1100))
    expect(onAssigned).toHaveBeenCalledWith(CLOSED_CLASH, slotIdFor(ANAE.beaumont, '2026-11-27', 'AM'))
    expect(useAppStore.getState().schedule.lists[CLOSED_CLASH]?.state).toBe('ACTIVE')
  })

  it('a passed day disables assignment and says why', () => {
    advanceClockDays(useAppStore, 1)
    renderSheet(SEED_DRAFT_LIST_IDS.stGeorges)
    expect(screen.getByText(/day has passed\. Change its date or remove it\./)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Free' })).toBeNull()
  })
})

describe('DraftListDrawer: Available that session (US-01.6.3\'s note)', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('lists up to five free, clear anaesthetists in tier order, never a not-preferred one, and Assign opens step 2 for that anaesthetist', () => {
    const res = simulateIncomingDraftListRequest(useAppStore, 'ces-reid-thu-pm')
    if (!res.ok) throw new Error(res.message)
    const { container } = render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <DraftListDrawer listId={res.value.listId} actor={OFFICE} onClose={vi.fn()} onOpenBooking={vi.fn()} onAssigned={vi.fn()} onOpenList={vi.fn()} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    expect(container.querySelector('[data-list-state="DRAFT"]')).not.toBeNull()
    expect(container.querySelector('[data-unassigned="true"]')).not.toBeNull()
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-available]'))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThanOrEqual(5)
    expect(rows.map((r) => r.getAttribute('data-available'))).not.toContain(ANAE.sharma)
    const tiers = rows.map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    fireEvent.click(within(rows[0]!).getByRole('button', { name: 'Assign' }))
    expect(screen.getByText('Anaesthetist')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assign Draft List' })).toBeInTheDocument()
  })

  it('the short list is the first five of the order "See everyone" opens on (one shuffle per opening)', () => {
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <DraftListDrawer listId={SEED_DRAFT_LIST_IDS.stGeorges} actor={OFFICE} onClose={vi.fn()} onOpenBooking={vi.fn()} onAssigned={vi.fn()} onOpenList={vi.fn()} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    const short = Array.from(document.querySelectorAll<HTMLElement>('[data-available]')).map((r) => r.getAttribute('data-available'))
    expect(short.length).toBeGreaterThan(1)
    fireEvent.click(screen.getByRole('button', { name: /^See everyone/ }))
    expect(idsOf(rowsIn(document.body, 'candidates-clear')).slice(0, short.length)).toEqual(short)
  })

  it('Remove is disabled, with the reason, while the Draft List holds Bookings', () => {
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <DraftListDrawer listId={SEED_DRAFT_LIST_IDS.forte} actor={OFFICE} onClose={vi.fn()} onOpenBooking={vi.fn()} onAssigned={vi.fn()} onOpenList={vi.fn()} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    const remove = within(screen.getByTestId('admin-list-actions')).getByRole('button', { name: 'Remove' })
    expect(remove).toBeDisabled()
    expect(remove).toHaveAttribute('title', 'Move or cancel its 2 Bookings first.')
  })
})
