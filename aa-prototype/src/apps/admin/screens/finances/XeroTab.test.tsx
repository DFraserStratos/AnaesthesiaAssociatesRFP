/**
 * The Xero tab (build plan Phase 61; US-13.3.2, US-13.3.3, D109), rendered
 * inside the Admin app at `/admin/finances/xero`: it opens on Needs action
 * with the failing hand-offs first, then the waiting ones, then the invoices
 * changed directly in Xero; Retry now with Xero back takes the row off and the
 * Booking reads as in Xero in the billing status model (the Billing tab's),
 * while during the outage the same Booking is a problem under its List there
 * too (stuck at Xero shows twice); Resolve asks for a note, records the
 * outcome and the row leaves; the pills and the search write the URL.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  advanceClockMinutes,
  authoriseList,
  freshAppState,
  pairsForList,
  processXeroQueue,
  runReconciliationPoll,
  setXeroOutage,
  useAppStore,
  voidAccRecInXero,
  wireBillingRun,
  XERO_STAFF_ACTOR,
  type Actor,
} from '../../../../store'
import { openXeroQueueItems } from '../../../../store/ledgerSelectors'
import { ANAE, SEED_LIST_IDS } from '../../../../domain/seed'
import { projectedListId } from '../../../../domain/slots'
import { AdminApp } from '../../AdminApp'
import { financesRoutes } from '../../../../test/adminRoutes'
import { billingStatusesFor } from './financeCounts'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const XERO = '/admin/finances/xero'
/** Changed directly in Xero: authorised while Xero answers, then voided there and polled. */
const CHANGED_LIST = SEED_LIST_IDS.morrisonMon20
/** Hand-offs failing: authorised during the outage and retried until the alert. */
const FAILING_LIST = projectedListId(ANAE.souter, '2026-11-23', 'AM')
/** Hand-offs waiting: authorised during the outage after the alert. */
const WAITING_LIST = projectedListId(ANAE.souter, '2026-11-23', 'PM')

function mountAt(url: string) {
  const router = createMemoryRouter(createRoutesFromElements(<Route path="/admin" element={<AdminApp />}>{financesRoutes()}</Route>), { initialEntries: [url] })
  render(<RouterProvider router={router} />)
  return router
}

const search = (router: ReturnType<typeof mountAt>) => new URLSearchParams(router.state.location.search)
const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null
const pill = (name: string) => within(document.querySelector('[role="group"][aria-label="Which Xero items"]') as HTMLElement).getByRole('button', { name })
const searchBox = () => screen.getByLabelText('Search by invoice, payer or anaesthetist')

/** The table's rows in order, each as the group it belongs to (from the store), with its id. */
function tableRows(): { group: 'failing' | 'waiting' | 'changed'; id: string }[] {
  const table = shot('xero-table')
  if (table === null) return []
  const queue = useAppStore.getState().billing.xeroQueue
  return Array.from(table.querySelectorAll('tr[data-queue-item], tr[data-divergence-id]')).map((tr) => {
    const div = tr.getAttribute('data-divergence-id')
    if (div !== null) return { group: 'changed' as const, id: div }
    const id = tr.getAttribute('data-queue-item')!
    return { group: queue[id]?.status === 'alerted' ? ('failing' as const) : ('waiting' as const), id }
  })
}

const groupsInOrder = () => tableRows().map((r) => r.group).filter((g, i, all) => i === 0 || all[i - 1] !== g)

interface Staged {
  divergenceId: string
  invoiceNumber: string
  failingIds: string[]
  waitingIds: string[]
}

/** A change made in Xero (poll flagged), then an outage: one List's hand-offs alert, a second List's wait. */
function stage(): Staged {
  act(() => {
    expect(authoriseList(useAppStore, OFFICE, CHANGED_LIST).ok).toBe(true)
  })
  const pair = pairsForList(useAppStore.getState(), CHANGED_LIST).find((p) => p.receivable.xeroAccRecId !== undefined)!
  act(() => {
    expect(voidAccRecInXero(useAppStore, XERO_STAFF_ACTOR, pair.receivable.xeroAccRecId!).ok).toBe(true)
    runReconciliationPoll(useAppStore)
  })
  const divergence = Object.values(useAppStore.getState().billing.xeroDivergences).find((d) => d.status === 'open' && d.pairId === pair.id)!
  expect(divergence).toBeDefined()

  act(() => {
    setXeroOutage(useAppStore, OFFICE, true)
    expect(authoriseList(useAppStore, OFFICE, FAILING_LIST).ok).toBe(true)
    for (let i = 0; i < 6; i += 1) {
      advanceClockMinutes(useAppStore, 60)
      processXeroQueue(useAppStore)
    }
  })
  const failingIds = openXeroQueueItems(useAppStore.getState()).filter((q) => q.status === 'alerted').map((q) => q.id)
  act(() => {
    expect(authoriseList(useAppStore, OFFICE, WAITING_LIST).ok).toBe(true)
  })
  const waitingIds = openXeroQueueItems(useAppStore.getState()).filter((q) => q.status !== 'alerted').map((q) => q.id)
  expect(failingIds.length).toBeGreaterThan(0)
  expect(waitingIds.length).toBeGreaterThan(0)
  return { divergenceId: divergence.id, invoiceNumber: useAppStore.getState().billing.invoices[divergence.invoiceId]!.invoiceNumber, failingIds, waitingIds }
}

/** A failing hand-off whose Booking has only that one pair, so sending it puts the whole Booking in Xero. */
function loneFailingHandoff(failingIds: readonly string[]): { itemId: string; bookingId: string; listId: string } {
  const state = useAppStore.getState()
  const pairs = pairsForList(state, FAILING_LIST)
  for (const itemId of failingIds) {
    const item = state.billing.xeroQueue[itemId]!
    if (item.kind !== 'handoff') continue
    const pair = pairs.find((p) => p.id === item.target.pairId)
    if (pair === undefined || !('bookingId' in pair) || pair.bookingId === undefined) continue
    if (pairs.filter((p) => 'bookingId' in p && p.bookingId === pair.bookingId).length === 1) return { itemId, bookingId: pair.bookingId, listId: FAILING_LIST }
  }
  throw new Error('no failing hand-off with a Booking of its own')
}

/** The Booking's billing status in the Billing tab's model (59's), and its List's. */
function billingStatusOf(listId: string, bookingId: string) {
  const list = billingStatusesFor(useAppStore.getState()).find((l) => l.listId === listId)!
  return { list, booking: list.bookings.find((b) => b.bookingId === bookingId)! }
}

let unwire: () => void = () => {}
beforeEach(() => {
  useAppStore.setState(freshAppState())
  unwire = wireBillingRun(useAppStore)
})
afterEach(() => {
  cleanup()
  unwire()
})

describe('the Xero tab (US-13.3.2, US-13.3.3)', () => {
  it('opens on Needs action, empty when nothing waits, with the connection and what happens here in the rail', () => {
    mountAt(XERO)
    expect(pill('Needs action')).toHaveAttribute('aria-pressed', 'true')
    expect(shot('xero-table')).toBeNull()
    expect(shot('xero-empty')).toHaveTextContent('Nothing needs action in Xero.')
    expect(shot('xero-count-line')).toHaveTextContent('Nothing needs action')
    expect(screen.getByRole('complementary', { name: 'Connection to Xero' })).toHaveTextContent('What happens here')
  })

  it('lists the failing hand-offs first, then the waiting ones, then the invoices changed in Xero', () => {
    const staged = stage()
    mountAt(XERO)
    expect(groupsInOrder()).toEqual(['failing', 'waiting', 'changed'])
    const rows = tableRows()
    expect(rows.filter((r) => r.group === 'failing').map((r) => r.id).sort()).toEqual([...staged.failingIds].sort())
    expect(rows.filter((r) => r.group === 'waiting').map((r) => r.id).sort()).toEqual([...staged.waitingIds].sort())
    expect(rows.filter((r) => r.group === 'changed').map((r) => r.id)).toEqual([staged.divergenceId])
    expect(shot('xero-count-line')).toHaveTextContent(
      `${staged.failingIds.length + staged.waitingIds.length + 1} need action: ${staged.failingIds.length} hand-offs failing, ${staged.waitingIds.length} hand-offs waiting, 1 changed in Xero`,
    )
    // The failing hand-offs alert; the divergence row offers Resolve.
    expect(shot('billing-xero-alert')).not.toBeNull()
    expect(shot(`billing-xero-resolve-${staged.divergenceId}`)).toHaveTextContent('Resolve')
  })

  it('stuck at Xero shows twice: the waiting Booking is a problem under its List; Retry now with Xero back sends it and it reads in Xero', () => {
    const staged = stage()
    const { itemId, bookingId, listId } = loneFailingHandoff(staged.failingIds)
    mountAt(XERO)
    expect(tableRows().map((r) => r.id)).toContain(itemId)

    // The second showing: the same Booking is a problem under its List in the Billing tab's model.
    const during = billingStatusOf(listId, bookingId)
    expect(during.list.hasProblem).toBe(true)
    expect(during.booking.problem?.kind).toBe('xeroAlert')
    expect(during.booking.problem?.queueItemId).toBe(itemId)
    expect(during.booking.steps.inXero).not.toBe('done')

    // Xero answers again (without the restore draining the queue): Retry now sends this one.
    act(() => {
      useAppStore.setState({ settings: { ...useAppStore.getState().settings, xeroOutage: undefined } })
    })
    fireEvent.click(shot(`billing-xero-retry-${itemId}`)!)
    expect(useAppStore.getState().billing.xeroQueue[itemId]!.status).toBe('sent')
    expect(tableRows().map((r) => r.id)).not.toContain(itemId)
    expect(document.body).toHaveTextContent('sent to Xero')

    const after = billingStatusOf(listId, bookingId)
    expect(after.booking.steps.inXero).toBe('done')
    expect(after.booking.problems.some((p) => p.queueItemId === itemId)).toBe(false)
  })

  it('Resolve needs a note, records the outcome and the row leaves; no money moves', () => {
    const staged = stage()
    mountAt(XERO)
    const pairId = useAppStore.getState().billing.xeroDivergences[staged.divergenceId]!.pairId
    const before = useAppStore.getState().billing.ledger[pairId]
    fireEvent.click(shot(`billing-xero-resolve-${staged.divergenceId}`)!)
    const panel = shot('billing-xero-resolve-panel')!
    expect(panel).toHaveTextContent('Recording a resolution moves no money')
    expect(panel).toHaveTextContent('Provisional: the policy for each mismatch is to be agreed with AA.')
    fireEvent.click(within(panel).getByRole('button', { name: 'Record resolution' }))
    expect(shot('billing-xero-resolve-panel')).not.toBeNull()
    expect(useAppStore.getState().billing.xeroDivergences[staged.divergenceId]!.status).toBe('open')

    fireEvent.change(within(panel).getByLabelText('Note'), { target: { value: 'Re-issued in Xero by Kirsty' } })
    fireEvent.click(within(panel).getByRole('button', { name: 'Record resolution' }))
    expect(shot('billing-xero-resolve-panel')).toBeNull()
    const resolved = useAppStore.getState().billing.xeroDivergences[staged.divergenceId]!
    expect(resolved.status).toBe('resolved')
    expect(resolved.resolution).toMatchObject({ outcome: 'reissueInXero', note: 'Re-issued in Xero by Kirsty', who: OFFICE.who })
    expect(tableRows().some((r) => r.group === 'changed')).toBe(false)
    expect(useAppStore.getState().billing.ledger[pairId]).toEqual(before)
  })

  it('Waiting narrows to the waiting hand-offs, All shows every group, and each write drops the page', () => {
    stage()
    const router = mountAt(`${XERO}?page=3`)
    expect(groupsInOrder()).toEqual(['failing', 'waiting', 'changed'])

    fireEvent.click(pill('Waiting'))
    expect(search(router).get('show')).toBe('waiting')
    expect(search(router).has('page')).toBe(false)
    expect(groupsInOrder()).toEqual(['waiting'])

    fireEvent.click(pill('All'))
    expect(search(router).get('show')).toBe('all')
    expect(groupsInOrder()).toEqual(['failing', 'waiting', 'changed'])

    // Needs action is the default, so it leaves the URL.
    fireEvent.click(pill('Needs action'))
    expect(search(router).has('show')).toBe(false)
  })

  it('search by invoice number finds the invoice changed in Xero; nothing matching offers to clear the search', () => {
    const staged = stage()
    const router = mountAt(XERO)
    fireEvent.change(searchBox(), { target: { value: staged.invoiceNumber.toLowerCase() } })
    expect(search(router).get('q')).toBe(staged.invoiceNumber.toLowerCase())
    expect(tableRows()).toEqual([{ group: 'changed', id: staged.divergenceId }])

    fireEvent.change(searchBox(), { target: { value: 'zzzz nobody' } })
    expect(shot('xero-table')).toBeNull()
    expect(shot('xero-empty')).toHaveTextContent('Nothing matches.')
    fireEvent.click(shot('xero-empty-clear')!)
    expect(search(router).has('q')).toBe(false)
    expect(groupsInOrder()).toEqual(['failing', 'waiting', 'changed'])
  })

  it('the anaesthetist filter narrows both kinds; Sent after waiting opens its folded list', () => {
    const staged = stage()
    const souter = useAppStore.getState().schedule.lists[FAILING_LIST]!.anaesthetistId
    const router = mountAt(XERO)
    fireEvent.change(screen.getByLabelText('Anaesthetist'), { target: { value: souter } })
    expect(search(router).get('anaesthetist')).toBe(souter)
    expect(groupsInOrder()).toEqual(['failing', 'waiting'])

    // Retry one with Xero back: it drains into Sent after waiting, which its pill opens.
    act(() => {
      useAppStore.setState({ settings: { ...useAppStore.getState().settings, xeroOutage: undefined } })
    })
    fireEvent.click(shot(`billing-xero-retry-${staged.failingIds[0]!}`)!)
    expect(shot('xero-sent')).toBeNull()
    fireEvent.click(pill('Sent after waiting'))
    expect(search(router).get('show')).toBe('sent')
    expect(shot('billing-xero-sent-toggle')).toHaveAttribute('aria-expanded', 'true')
    expect(shot('xero-sent')!.querySelector(`[data-queue-item="${staged.failingIds[0]!}"]`)).not.toBeNull()
    expect(shot('xero-table')).toBeNull()
  })
})
