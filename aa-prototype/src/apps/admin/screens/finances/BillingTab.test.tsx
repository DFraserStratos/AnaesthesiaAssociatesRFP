/**
 * The Billing tab (build plan Phase 60; US-13.3.1, US-13.3.2, D116), rendered
 * inside the Admin app at `/admin/finances/billing`: it opens on Problems,
 * where a List shows only its failed Booking (Show all adds the rest), the
 * reason sits under the patient's name and the fix beside it; Fix the payer
 * then Retry bills the Booking; Mark resolved asks for a note and moves the
 * Booking to Done; the filters, search and anaesthetist write the URL (two
 * quick edits both land) and reset the page; the Awaiting approval rail opens
 * Review with the way back, and nothing on the tab approves.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, createRoutesFromElements, MemoryRouter, Route, RouterProvider, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authoriseList, freshAppState, runBillingForList, useAppStore, type Actor } from '../../../../store'
import { toAuthoriseOrder } from '../lists/toAuthoriseRows'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../../../domain/seed'
import { projectedListId } from '../../../../domain/slots'
import { payerLosesBillingEmailTarget, stagePayerLosesBillingEmail } from '../../../../shared/demoTriggers/payerLosesBillingEmail'
import { SurfaceProvider } from '../../../../shared'
import { AdminApp } from '../../AdminApp'
import { billingMonitorReturn } from '../../routes'
import { ReviewScreen } from '../ReviewScreen'
import { financesRoutes } from '../../../../test/adminRoutes'
import { billingStatusesFor } from './financeCounts'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const BILLING = '/admin/finances/billing'

function Probe() {
  const loc = useLocation()
  return <div data-testid="probe">{`${loc.pathname}${loc.search}|${JSON.stringify(loc.state)}`}</div>
}

/** The Admin app at `url`, with Review and the Day view as probes. */
function mountAt(url: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path="/admin" element={<AdminApp />}>
        {financesRoutes()}
        <Route path="lists/to-authorise/:listId" element={<Probe />} />
        <Route path="day/:dateISO/bookings/:bookingId" element={<Probe />} />
      </Route>,
    ),
    { initialEntries: [url] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const search = (router: ReturnType<typeof mountAt>) => new URLSearchParams(router.state.location.search)
const shot = (name: string) => document.querySelector(`[data-shot="${name}"]`) as HTMLElement | null
const rowIds = () => Array.from(document.querySelectorAll('tr[data-booking-id]')).map((el) => el.getAttribute('data-booking-id'))
const listIds = () => Array.from(document.querySelectorAll('tr[data-list-id]')).map((el) => el.getAttribute('data-list-id'))
const pill = (name: string) => within(document.querySelector('[role="group"][aria-label="Which Bookings"]') as HTMLElement).getByRole('button', { name })

/** A payer with nowhere to send to (the demo trigger): its Booking fails whole with `payerNoAddress`. */
function stagePayerFailure(): { listId: string; bookingId: string } {
  const target = payerLosesBillingEmailTarget(useAppStore.getState())
  if (target === undefined) throw new Error('no Booking for the trigger')
  expect(stagePayerLosesBillingEmail(useAppStore).ok).toBe(true)
  return { listId: target.listId, bookingId: target.bookingId }
}

/** The S4 List authorised and run with Losa's lock dropped: her Booking fails with `lockMissing` (Retry, Mark resolved). */
function stageLockFailure(): { listId: string; bookingId: string } {
  const listId = SEED_LIST_IDS.billingFailure
  const bookingId = SEED_MARKERS.billingFailureBooking!.entityId
  expect(authoriseList(useAppStore, OFFICE, listId).ok).toBe(true)
  const { [bookingId]: _dropped, ...locks } = useAppStore.getState().billing.locks
  useAppStore.setState({ billing: { ...useAppStore.getState().billing, locks } })
  if (useAppStore.getState().schedule.lists[listId]?.billedAtISO === undefined) expect(runBillingForList(useAppStore, listId).ok).toBe(true)
  return { listId, bookingId }
}

describe('the Billing tab (US-13.3.1, US-13.3.2)', () => {
  beforeEach(() => useAppStore.setState(freshAppState()))
  afterEach(cleanup)

  it('opens on Problems; with none it says so and offers every List', () => {
    const router = mountAt(BILLING)
    expect(pill('Problems')).toHaveAttribute('aria-pressed', 'true')
    expect(shot('billing-empty')).toHaveTextContent('No billing problems.')
    expect(shot('billing-summary')).toHaveTextContent('0 Lists with a problem, 0 anaesthetists')
    fireEvent.click(shot('billing-empty-show-all')!)
    expect(search(router).get('show')).toBe('all')
    expect(shot('billing-table')).not.toBeNull()
    expect(rowIds().length).toBeGreaterThan(0)
  })

  it("a List shows only its failed Booking, the reason under the patient's name and the fix beside it; Show all adds the rest", () => {
    const { listId, bookingId } = stagePayerFailure()
    const status = billingStatusesFor(useAppStore.getState()).find((l) => l.listId === listId)!
    const failed = status.bookings.find((b) => b.bookingId === bookingId)!
    expect(status.bookings.length).toBeGreaterThan(1)

    mountAt(BILLING)
    expect(listIds()).toEqual([listId])
    expect(rowIds()).toEqual([bookingId])
    expect(shot(`billing-group-${status.anaesthetistId}`)).toHaveTextContent('1 with problems')
    expect(shot('billing-summary')).toHaveTextContent('1 List with a problem, 1 anaesthetist')

    const row = shot(`billing-row-${bookingId}`)!
    expect(row).toHaveAttribute('data-problem', 'billingException')
    const reason = within(row).getByText(failed.problem!.reason)
    expect(reason).toHaveAttribute('data-shot', `billing-reason-${bookingId}`)
    expect(reason.parentElement).toHaveTextContent(failed.patientName)
    expect(within(row).getByText('Billing failed')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Fix the payer' })).toHaveAttribute('data-shot', `billing-fix-payer-${bookingId}`)
    expect(within(row).getByRole('button', { name: 'Retry' })).toHaveAttribute('data-shot', `billing-retry-${bookingId}`)
    expect(within(row).getByRole('button', { name: 'Mark resolved' })).toHaveAttribute('data-shot', `billing-mark-resolved-${bookingId}`)

    fireEvent.click(shot(`billing-show-all-${listId}`)!)
    expect(rowIds()).toEqual(status.bookings.map((b) => b.bookingId))
    expect(shot(`billing-show-all-${listId}`)).toBeNull()
    fireEvent.click(shot(`billing-show-fewer-${listId}`)!)
    expect(rowIds()).toEqual([bookingId])
  })

  it('Fix the payer saves the details and retries: the Booking bills and leaves Problems', () => {
    const { bookingId } = stagePayerFailure()
    mountAt(BILLING)
    // Retry alone still refuses, in place: the payer has nowhere to be sent to.
    fireEvent.click(shot(`billing-retry-${bookingId}`)!)
    expect(shot(`billing-retry-error-${bookingId}`)?.textContent ?? '').not.toBe('')
    expect(rowIds()).toEqual([bookingId])

    fireEvent.click(shot(`billing-fix-payer-${bookingId}`)!)
    const sheet = shot('billing-fix-payer-sheet')!.closest('[role="dialog"]') as HTMLElement
    fireEvent.change(within(sheet).getByLabelText('Billing email'), { target: { value: 'accounts@example.co.nz' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save and retry' }))
    expect(shot('billing-fix-payer-sheet')).toBeNull()
    expect(Object.values(useAppStore.getState().billing.invoices).some((i) => i.bookingId === bookingId)).toBe(true)
    expect(shot(`billing-row-${bookingId}`)).toBeNull()
    expect(shot('billing-empty')).toHaveTextContent('No billing problems.')
  })

  it('Mark resolved asks for a note and moves the Booking to Done, where it reads Resolved by hand', () => {
    const { listId, bookingId } = stageLockFailure()
    const router = mountAt(BILLING)
    expect(rowIds()).toEqual([bookingId])
    const row = shot(`billing-row-${bookingId}`)!
    // A failure that is not the payer's offers Retry and Mark resolved, not Fix the payer.
    expect(within(row).queryByRole('button', { name: 'Fix the payer' })).toBeNull()
    expect(within(row).getByRole('button', { name: 'Retry' })).toBeInTheDocument()

    fireEvent.click(shot(`billing-mark-resolved-${bookingId}`)!)
    const sheet = shot('billing-mark-resolved-sheet')!.closest('[role="dialog"]') as HTMLElement
    fireEvent.click(within(sheet).getByRole('button', { name: 'Mark resolved' }))
    expect(shot('billing-mark-resolved-error')?.textContent ?? '').not.toBe('')
    expect(shot('billing-mark-resolved-sheet')).not.toBeNull()
    fireEvent.change(within(sheet).getByLabelText('Note'), { target: { value: 'Billed by hand in Xero' } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Mark resolved' }))
    expect(shot('billing-mark-resolved-sheet')).toBeNull()
    expect(shot(`billing-row-${bookingId}`)).toBeNull()
    expect(shot('billing-empty')).toHaveTextContent('No billing problems.')

    // The Booking reads Done; its List follows its other Bookings (here still In progress: 59's List buckets).
    fireEvent.click(pill('In progress'))
    expect(search(router).get('show')).toBe('in-progress')
    expect(listIds()).toContain(listId)
    const done = shot(`billing-row-${bookingId}`)!
    expect(within(done).getByText('Done')).toBeInTheDocument()
    expect(shot(`billing-resolved-${bookingId}`)).toHaveTextContent('Resolved by hand · Billed by hand in Xero')
    expect(within(done).queryByRole('button', { name: 'Retry' })).toBeNull()
  })

  it('the filters, the search (a Booking id) and the anaesthetist write the URL and return to page 1', () => {
    const payer = stagePayerFailure()
    const lock = stageLockFailure()
    const payerAnaesthetist = useAppStore.getState().schedule.lists[payer.listId]!.anaesthetistId
    const router = mountAt(`${BILLING}?page=3`)
    expect(listIds().sort()).toEqual([payer.listId, lock.listId].sort())

    fireEvent.click(pill('All'))
    expect(search(router).get('show')).toBe('all')
    expect(search(router).has('page')).toBe(false)
    expect(rowIds()).toContain(lock.bookingId)
    expect(rowIds().length).toBeGreaterThan(2)

    fireEvent.click(pill('In progress'))
    expect(search(router).get('show')).toBe('in-progress')
    expect(rowIds()).not.toContain(payer.bookingId)

    // Search by Booking id narrows the Lists and their Bookings to that one.
    fireEvent.click(pill('All'))
    fireEvent.change(screen.getByLabelText('Search by patient, Booking, payer, hospital or anaesthetist'), { target: { value: payer.bookingId } })
    expect(search(router).get('q')).toBe(payer.bookingId)
    expect(listIds()).toEqual([payer.listId])
    expect(rowIds()).toEqual([payer.bookingId])

    // The anaesthetist select: one group only.
    fireEvent.change(screen.getByLabelText('Search by patient, Booking, payer, hospital or anaesthetist'), { target: { value: '' } })
    expect(search(router).has('q')).toBe(false)
    fireEvent.change(screen.getByLabelText('Anaesthetist'), { target: { value: payerAnaesthetist } })
    expect(search(router).get('anaesthetist')).toBe(payerAnaesthetist)
    expect(document.querySelectorAll('tr[data-anaesthetist-id]')).toHaveLength(1)
    expect(shot(`billing-group-${payerAnaesthetist}`)).not.toBeNull()

    // Nothing matches: the empty state clears the search and the anaesthetist.
    fireEvent.change(screen.getByLabelText('Search by patient, Booking, payer, hospital or anaesthetist'), { target: { value: 'zzzz nobody' } })
    expect(shot('billing-empty')).toHaveTextContent('No Lists match.')
    fireEvent.click(shot('billing-empty-clear')!)
    expect(search(router).has('q')).toBe(false)
    expect(search(router).has('anaesthetist')).toBe(false)
    expect(search(router).get('show')).toBe('all')
  })

  it('two quick edits both land in the URL', () => {
    const payer = stagePayerFailure()
    const anaesthetistId = useAppStore.getState().schedule.lists[payer.listId]!.anaesthetistId
    const router = mountAt(`${BILLING}?show=all&page=2`)
    const box = screen.getByLabelText('Search by patient, Booking, payer, hospital or anaesthetist')
    const select = screen.getByLabelText('Anaesthetist')
    // Both handlers come from the same render: the second must not drop the first.
    act(() => {
      fireEvent.change(box, { target: { value: payer.bookingId } })
      fireEvent.change(select, { target: { value: anaesthetistId } })
    })
    const params = search(router)
    expect(params.get('q')).toBe(payer.bookingId)
    expect(params.get('anaesthetist')).toBe(anaesthetistId)
    expect(params.get('show')).toBe('all')
    expect(params.has('page')).toBe(false)
  })

  it('Awaiting approval rows open Review with the way back to Billing; nothing on the tab approves', () => {
    const router = mountAt(`${BILLING}?show=all`)
    // In To authorise's order: oldest submitted first.
    const awaiting = toAuthoriseOrder(useAppStore.getState())
      .filter((id) => !id.startsWith('L-HIST'))
      .map((id) => ({ id }))
    expect(awaiting.length).toBeGreaterThan(0)
    const rail = shot('billing-awaiting')!
    expect([...rail.querySelectorAll('[data-list-id]')].map((li) => li.getAttribute('data-list-id'))).toEqual(awaiting.slice(0, 5).map((l) => l.id))
    // See all opens the To authorise tab.
    expect(rail.querySelector('[data-shot="billing-awaiting-all"]')?.getAttribute('href')).toBe('/admin/lists/to-authorise')
    expect(screen.queryByRole('button', { name: /authorise|approve/i })).toBeNull()

    const first = awaiting[0]!
    fireEvent.click(rail.querySelector(`[data-shot="billing-awaiting-${first.id}"] a`)!)
    expect(router.state.location.pathname).toBe(`/admin/lists/to-authorise/${first.id}`)
    expect(router.state.location.state).toEqual({ from: 'billing', search: '?show=all' })
    expect(billingMonitorReturn(router.state.location.state)).toEqual({ from: 'billing', search: '?show=all' })
    expect(billingMonitorReturn(null)).toBeNull()
    expect(billingMonitorReturn({ from: 'queue' })).toBeNull()
  })

  it('Review opened from the Billing tab goes back to Billing; otherwise to To authorise', () => {
    const listId = projectedListId(ANAE.souter, '2026-11-23', 'AM')
    const onBack = vi.fn()
    const { unmount } = render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <ReviewScreen listId={listId} actor={OFFICE} backToBillingMonitor onBack={onBack} onOpen={() => {}} onViewInvoices={() => {}} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Billing' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    unmount()
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <ReviewScreen listId={listId} actor={OFFICE} onBack={onBack} onOpen={() => {}} onViewInvoices={() => {}} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Billing' })).toBeNull()
    expect(screen.getByRole('button', { name: 'To authorise' })).toBeInTheDocument()
  })
})
