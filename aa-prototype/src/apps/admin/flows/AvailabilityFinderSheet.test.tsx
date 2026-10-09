/**
 * The office availability finder (catch-up Phase 28; US-01.4.2, US-01.3.5,
 * US-01.3.6): open sessions only, through Phase 17's candidates (tier order,
 * shuffled within a tier per opening, the filter, not-preferred apart once a
 * surgeon is chosen), and a pick that names the session and the surgeon.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, HOSP, SURG } from '../../../domain/seed'
import { slotIdFor } from '../../../domain/slots'
import { assignListToSlot, freshAppState, setAvailability, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { AvailabilityFinderSheet } from './AvailabilityFinderSheet'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const TUE21 = '2026-07-21'

function renderFinder(onPick = vi.fn()) {
  const ui = (open: boolean) => (
    <SurfaceProvider variant="web">
      <AvailabilityFinderSheet open={open} dateISO={TUE21} initialSession="PM" onClose={vi.fn()} onPick={onPick} />
    </SurfaceProvider>
  )
  const view = render(ui(true))
  return { ...view, onPick, reopen: () => { view.rerender(ui(false)); view.rerender(ui(true)) } }
}

function rows(container: HTMLElement, shot: string): HTMLElement[] {
  const el = container.querySelector(`[data-shot="${shot}"]`)
  return el === null ? [] : Array.from(el.querySelectorAll<HTMLElement>('button[data-candidate]'))
}
const ids = (rs: HTMLElement[]) => rs.map((r) => r.getAttribute('data-candidate'))
const tiers = (rs: HTMLElement[]) => rs.map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))

describe('AvailabilityFinderSheet', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('lists exactly the anaesthetists with an open PM session, in tier order', () => {
    const { container } = renderFinder()
    // The seed's open Tue 21 PM sessions: Sharma, Delaney, Hughes and Strand.
    const clear = rows(container, 'candidates-clear')
    expect(new Set(ids(clear))).toEqual(new Set([ANAE.sharma, ANAE.delaney, ANAE.hughes, ANAE.strand]))
    expect(screen.getByText('4 anaesthetists free this PM')).toBeInTheDocument()
    expect(tiers(clear)).toEqual([...tiers(clear)].sort((a, b) => a - b))
    expect(rows(container, 'candidates-not-preferred')).toEqual([])
  })

  it('drops a session once a List is assigned or it is marked unavailable', () => {
    expect(assignListToSlot(useAppStore, OFFICE, slotIdFor(ANAE.strand, TUE21, 'PM'), { hospitalId: HOSP.stg, surgeonId: SURG.hale, kind: 'private' }).ok).toBe(true)
    expect(setAvailability(useAppStore, OFFICE, ANAE.delaney, TUE21, 'PM', 'unavailable').ok).toBe(true)
    const { container } = renderFinder()
    expect(screen.getByText('2 anaesthetists free this PM')).toBeInTheDocument()
    const listed = ids(rows(container, 'candidates-clear'))
    expect(listed).not.toContain(ANAE.strand)
    expect(listed).not.toContain(ANAE.delaney)
    expect(listed).toContain(ANAE.sharma)
  })

  it('with Ms Reid chosen, Dr Sharma sits in the separate not-preferred group, still selectable, and the pick carries the surgeon', () => {
    const { container, onPick } = renderFinder()
    fireEvent.change(container.querySelector('select[data-shot="finder-surgeon"]') as HTMLSelectElement, { target: { value: SURG.reid } })
    expect(screen.getByText('Not preferred with Ms Reid')).toBeInTheDocument()
    const apart = rows(container, 'candidates-not-preferred')
    expect(ids(apart)).toEqual([ANAE.sharma])
    expect(ids(rows(container, 'candidates-clear'))).not.toContain(ANAE.sharma)
    expect(tiers(rows(container, 'candidates-clear'))).toEqual([...tiers(rows(container, 'candidates-clear'))].sort((a, b) => a - b))
    fireEvent.click(apart[0]!)
    expect(onPick).toHaveBeenCalledWith(slotIdFor(ANAE.sharma, TUE21, 'PM'), SURG.reid)
  })

  it('filters by tier, and switches session', () => {
    const { container } = renderFinder()
    fireEvent.click(within(container.querySelector('[data-shot="tier-filter"]') as HTMLElement).getByText('Tier 1'))
    expect(tiers(rows(container, 'candidates-clear')).every((t) => t === 1)).toBe(true)
    fireEvent.click(within(container.querySelector('[data-shot="tier-filter"]') as HTMLElement).getByText('All'))
    fireEvent.click(within(screen.getByRole('group', { name: 'Session' })).getByRole('button', { name: 'AM' }))
    expect(screen.getByText('1 anaesthetist free this AM')).toBeInTheDocument()
    expect(ids(rows(container, 'candidates-clear'))).toEqual([ANAE.hughes])
  })

  it('reshuffles within a tier on each opening, never across, and replays the same orders after Reset', () => {
    const first = renderFinder()
    const orders: string[][] = [ids(rows(first.container, 'candidates-clear')) as string[]]
    const tierShape = tiers(rows(first.container, 'candidates-clear'))
    for (let i = 0; i < 6; i++) {
      first.reopen()
      orders.push(ids(rows(first.container, 'candidates-clear')) as string[])
      expect(tiers(rows(first.container, 'candidates-clear'))).toEqual(tierShape)
    }
    expect(new Set(orders.map((o) => o.join('|'))).size).toBeGreaterThan(1)
    first.unmount()
    useAppStore.setState(freshAppState())
    const again = renderFinder()
    const replay: string[][] = [ids(rows(again.container, 'candidates-clear')) as string[]]
    for (let i = 0; i < 6; i++) {
      again.reopen()
      replay.push(ids(rows(again.container, 'candidates-clear')) as string[])
    }
    expect(replay).toEqual(orders)
  })
})
