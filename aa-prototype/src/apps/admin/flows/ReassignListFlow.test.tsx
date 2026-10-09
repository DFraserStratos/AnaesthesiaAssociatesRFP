import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, listIdForSlot } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { ReassignListFlow } from './ReassignListFlow'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOURCE_ID = listIdForSlot(ANAE.rutherford, '2026-07-22', 'AM')
// Dr Chen's Tue 21 PM Christchurch Eye Surgery List is Ms A. Reid's; Reid has a
// seeded not-preferred entry with Dr Sharma, who is free that PM (Phase 17).
const CHEN_PM = listIdForSlot(ANAE.chen, '2026-07-21', 'PM')

function renderFlow(listId: string, open = true) {
  const list = useAppStore.getState().schedule.lists[listId]!
  const ui = (isOpen: boolean) => (
    <SurfaceProvider variant="web">
      <ReassignListFlow open={isOpen} list={list} actor={OFFICE} onClose={vi.fn()} onReassigned={vi.fn()} />
    </SurfaceProvider>
  )
  const view = render(ui(open))
  return { ...view, reopen: () => { view.rerender(ui(false)); view.rerender(ui(true)) } }
}

function group(container: HTMLElement, shot: string): HTMLElement[] {
  const el = container.querySelector(`[data-shot="${shot}"]`)
  return el === null ? [] : Array.from(el.querySelectorAll<HTMLElement>('button[data-candidate]'))
}

function tiersOf(rows: HTMLElement[]): number[] {
  return rows.map((r) => Number(r.querySelector('[data-tier]')?.getAttribute('data-tier')))
}

describe('ReassignListFlow', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the success fanfare before completing the flow', () => {
    vi.useFakeTimers()
    const onReassigned = vi.fn()
    const source = useAppStore.getState().schedule.lists[SOURCE_ID]!

    render(
      <SurfaceProvider variant="web">
        <ReassignListFlow
          open
          list={source}
          actor={OFFICE}
          onClose={vi.fn()}
          onReassigned={onReassigned}
        />
      </SurfaceProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Sharma, Priya.*Free AM/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reassignment' }))

    expect(screen.getByRole('status')).toHaveTextContent('List reassigned')
    expect(screen.getByTestId('list-reassignment-overlay')).toHaveTextContent('Moved to Sharma, Priya')
    expect(onReassigned).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1050))
    expect(onReassigned).toHaveBeenCalledOnce()
  })

  it('lists the free candidates in tier order, Sharma with a Preferred pill and no warning (S2 Beat 3)', () => {
    const { container } = renderFlow(SOURCE_ID)
    const clear = group(container, 'candidates-clear')
    expect(clear.length).toBe(6)
    const tiers = tiersOf(clear)
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
    expect(tiers[0]).toBe(1)
    expect(group(container, 'candidates-not-preferred')).toEqual([])
    const sharma = clear.find((r) => r.textContent?.includes('Sharma, Priya'))!
    expect(sharma).toHaveTextContent('Preferred')
    expect(sharma).toHaveTextContent('Tier 2')
    fireEvent.click(sharma)
    expect(screen.queryByText(/prefers not to work with/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Confirm reassignment' })).toBeInTheDocument()
  })

  it('puts a not-preferred candidate apart, still selectable, and warns before confirming', () => {
    vi.useFakeTimers()
    const { container } = renderFlow(CHEN_PM)
    expect(screen.getByText('Not preferred with Ms Reid')).toBeInTheDocument()
    const apart = group(container, 'candidates-not-preferred')
    expect(apart.map((r) => r.textContent?.includes('Sharma, Priya'))).toEqual([true])
    expect(apart[0]).toHaveTextContent('Not preferred')
    const clear = group(container, 'candidates-clear')
    expect(clear.map((r) => r.querySelector('span')?.textContent)).toEqual(expect.arrayContaining(['Hughes, Rawiri', 'Delaney, Mark', 'Strand, Oliver']))
    expect(tiersOf(clear)).toEqual([1, 1, 3])

    fireEvent.click(apart[0]!)
    expect(container.querySelector('[data-shot="reassign-pairing-warning"]')).toHaveTextContent(
      "Ms A. Reid prefers not to work with Dr Priya Sharma.Reason: Surgeon's preference",
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reassignment anyway' }))
    expect(useAppStore.getState().schedule.lists[CHEN_PM]?.anaesthetistId).toBe(ANAE.sharma)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('list.regenerate')
    expect(useAppStore.getState().audit.some((a) => a.action === 'list.pairingAcknowledged' && a.entityId === CHEN_PM)).toBe(true)
  })

  it('filters both groups by tier', () => {
    const { container } = renderFlow(CHEN_PM)
    fireEvent.click(within(container.querySelector('[data-shot="tier-filter"]') as HTMLElement).getByText('Tier 1'))
    expect(tiersOf(group(container, 'candidates-clear'))).toEqual([1, 1])
    expect(group(container, 'candidates-not-preferred')).toEqual([])
    fireEvent.click(within(container.querySelector('[data-shot="tier-filter"]') as HTMLElement).getByText('Tier 2'))
    expect(group(container, 'candidates-clear')).toEqual([])
    expect(group(container, 'candidates-not-preferred')).toHaveLength(1)
  })

  it('reshuffles within a tier on each opening, never across, and replays after Reset', () => {
    const names = (c: HTMLElement) => group(c, 'candidates-clear').map((r) => r.querySelector('span')?.textContent ?? '')
    const first = renderFlow(SOURCE_ID)
    const orders: string[][] = [names(first.container)]
    for (let i = 0; i < 7; i++) {
      first.reopen()
      orders.push(names(first.container))
      expect(tiersOf(group(first.container, 'candidates-clear'))).toEqual([1, 1, 2, 3, 4, 4])
    }
    expect(useAppStore.getState().shell.suggestionSeq).toBe(8)
    expect(new Set(orders.map((o) => o.join('|'))).size).toBeGreaterThan(1)
    first.unmount()

    useAppStore.setState(freshAppState())
    const again = renderFlow(SOURCE_ID)
    const replay: string[][] = [names(again.container)]
    for (let i = 0; i < 7; i++) {
      again.reopen()
      replay.push(names(again.container))
    }
    expect(replay).toEqual(orders)
  })
})
