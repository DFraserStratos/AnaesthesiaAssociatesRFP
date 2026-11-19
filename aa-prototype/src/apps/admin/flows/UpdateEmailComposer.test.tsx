/**
 * The update email composer and where it opens from (catch-up Phase 35;
 * US-02.3.3, US-01.4.1 note, US-13.8.2; OQ-69, OQ-46, OQ-65): the Booking
 * detail's on-demand button, the List drawer after a reassignment, and the
 * notification pool after an anaesthetist's own move. Nothing is sent; Open
 * in mail client writes one `updateEmail.drafted` entry and nothing else.
 */

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS } from '../../../domain/seed'
import {
  editBooking,
  freshAppState,
  moveListToOffice,
  OFFICE_ACTOR,
  reassignList,
  saveBookingPatch,
  stageColleagueMoveToPersona,
  useAppStore,
} from '../../../store'
import { anaesthetistActor } from '../../../store/demoActors'
import { SEED_STATUS } from '../../../domain/slotStatus'
import { SurfaceProvider } from '../../../shared/surface'
import { BookingDraftProvider, useBookingApi } from '../../../shared/booking'
import { BookingUpdateEmailButton, NotificationEmailAction, SAVE_FIRST_REASON, useListUpdateEmail } from './UpdateEmailActions'
import { notificationPool } from '../../../store'

const BOOKING_ID = SEED_MARKERS.pendingCaptureBooking!.entityId

// jsdom cannot follow a mailto: link; the click handler still runs.
const stopNavigation = (e: Event) => {
  if ((e.target as Element | null)?.closest?.('a[href^="mailto:"]') != null) e.preventDefault()
}
beforeEach(() => document.addEventListener('click', stopNavigation))
afterEach(() => {
  document.removeEventListener('click', stopNavigation)
  cleanup()
})

function web(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">{ui}</SurfaceProvider>
    </MemoryRouter>,
  )
}

function composer(): HTMLElement {
  return document.querySelector('[data-shot="update-email-composer"]') as HTMLElement
}

function ticked(): string[] {
  return Array.from(composer().querySelectorAll<HTMLInputElement>('input[data-pick-key]'))
    .filter((i) => i.checked)
    .map((i) => i.getAttribute('data-pick-key')!)
}

function openLink(): HTMLAnchorElement | null {
  return composer().querySelector('a[data-shot="update-email-open"]')
}

function toLine(): string {
  return composer().querySelector('[data-shot="update-email-preview"]')!.textContent ?? ''
}

function saveTimes() {
  const b = useAppStore.getState().schedule.bookings[BOOKING_ID]!
  expect(saveBookingPatch(useAppStore, OFFICE_ACTOR, BOOKING_ID, { booking: { scheduledTime: '10:15' } }).ok).toBe(true)
  expect(saveBookingPatch(useAppStore, OFFICE_ACTOR, BOOKING_ID, { booking: { scheduledTime: '10:45' } }).ok).toBe(true)
  return b
}

describe('Draft update email on the Admin Booking', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('opens the composer with the newest saved change ticked; unticking every row disables Open', () => {
    saveTimes()
    web(<BookingUpdateEmailButton bookingId={BOOKING_ID} actor={OFFICE_ACTOR} />)
    fireEvent.click(document.querySelector('[data-shot="booking-update-email"]')!)
    const rows = Array.from(composer().querySelectorAll<HTMLInputElement>('input[data-pick-key]'))
    expect(rows.length).toBeGreaterThanOrEqual(2)
    // Newest first: the first emailable row is the one ticked.
    const newest = rows.find((i) => !i.disabled)!
    expect(ticked()).toEqual([newest.getAttribute('data-pick-key')])
    expect(composer().querySelector('[data-shot="update-email-body"]')!.textContent).toContain('Time: was 10:15, now 10:45')
    expect(openLink()?.getAttribute('href')).toMatch(/^mailto:/)

    fireEvent.click(newest)
    expect(ticked()).toEqual([])
    expect(openLink()).toBeNull()
    const button = within(composer()).getByRole('button', { name: /Open in mail client/ })
    expect(button).toBeDisabled()
  })

  it('switching Send to changes To', () => {
    saveTimes()
    web(<BookingUpdateEmailButton bookingId={BOOKING_ID} actor={OFFICE_ACTOR} />)
    fireEvent.click(document.querySelector('[data-shot="booking-update-email"]')!)
    const office = toLine()
    fireEvent.click(within(composer()).getByRole('button', { name: 'Hospital' }))
    const hospital = toLine()
    expect(hospital).not.toBe(office)
    const href = openLink()!.getAttribute('href')!
    const state = useAppStore.getState()
    const list = state.schedule.lists[state.schedule.bookings[BOOKING_ID]!.listId]!
    const hospitalEmail = state.masters.hospitals[list.hospitalId]!.contactEmail!
    expect(hospitalEmail).not.toBe('')
    expect(href.startsWith(`mailto:${hospitalEmail}?`)).toBe(true)
    expect(hospital).toContain(hospitalEmail)
  })

  it('Open writes exactly one updateEmail.drafted entry and nothing else; the row then carries the earlier-draft hint', () => {
    saveTimes()
    web(<BookingUpdateEmailButton bookingId={BOOKING_ID} actor={OFFICE_ACTOR} />)
    fireEvent.click(document.querySelector('[data-shot="booking-update-email"]')!)
    const before = useAppStore.getState()
    const picked = ticked()
    // Ticking and switching write nothing.
    fireEvent.click(within(composer()).getByRole('button', { name: 'Both' }))
    expect(useAppStore.getState().audit).toHaveLength(before.audit.length)

    fireEvent.click(openLink()!)
    const after = useAppStore.getState()
    expect(after.audit).toHaveLength(before.audit.length + 1)
    expect(after.audit.at(-1)).toMatchObject({ action: 'updateEmail.drafted', who: 'Kirsty W.', after: { pickedKeys: picked, templateId: 'ET004', recipient: 'both' } })
    expect(after.schedule).toBe(before.schedule)
    expect(after.masters).toBe(before.masters)
    expect(after.notifications).toBe(before.notifications)
    expect(composer().querySelector('[data-shot="update-email-earlier-draft"]')).toHaveTextContent(/In an earlier draft at \d\d:\d\d/)
  })

  it('a cover row defaults to the Change of anaesthetist template and the hospital, naming both anaesthetists', () => {
    const listId = SEED_LIST_IDS.rutherfordPm21
    const bookingId = Object.values(useAppStore.getState().schedule.bookings).find((b) => b.listId === listId && b.cancellation === undefined)!.id
    expect(reassignList(useAppStore, OFFICE_ACTOR, listId, ANAE.strand).ok).toBe(true)
    web(<BookingUpdateEmailButton bookingId={bookingId} actor={OFFICE_ACTOR} />)
    fireEvent.click(document.querySelector('[data-shot="booking-update-email"]')!)
    const template = composer().querySelector('select[data-shot="update-email-template"]') as HTMLSelectElement
    expect(template.value).toBe('ET001')
    expect(within(composer()).getByRole('button', { name: 'Hospital' })).toHaveAttribute('aria-pressed', 'true')
    const body = composer().querySelector('[data-shot="update-email-body"]')!.textContent ?? ''
    const names = useAppStore.getState().masters.anaesthetists
    expect(body).toContain(names[ANAE.rutherford]!.name)
    expect(body).toContain(names[ANAE.strand]!.name)
  })

  it('is disabled while the page has unsaved changes', () => {
    saveTimes()
    let api: ReturnType<typeof useBookingApi> | null = null
    function Probe() {
      api = useBookingApi()
      return null
    }
    web(
      <BookingDraftProvider bookingId={BOOKING_ID}>
        <Probe />
        <BookingUpdateEmailButton bookingId={BOOKING_ID} actor={OFFICE_ACTOR} />
      </BookingDraftProvider>,
    )
    const button = document.querySelector('[data-shot="booking-update-email"]') as HTMLButtonElement
    expect(button).not.toBeDisabled()
    act(() => {
      expect(editBooking(api!, OFFICE_ACTOR, BOOKING_ID, { notes: 'Drafted, not saved' }).ok).toBe(true)
    })
    expect(document.querySelector('[data-shot="booking-update-email"]')).toBeDisabled()
    expect(screen.getByText(SAVE_FIRST_REASON)).toBeInTheDocument()
  })

  it('with no emailable saved change it is disabled with its reason', () => {
    // Every seeded Booking has its creation to email; an empty history has nothing.
    useAppStore.setState({ audit: [] })
    web(<BookingUpdateEmailButton bookingId={BOOKING_ID} actor={OFFICE_ACTOR} />)
    expect(document.querySelector('[data-shot="booking-update-email"]')).toBeDisabled()
    expect(document.querySelector('[data-shot="booking-update-email-reason"]')).toHaveTextContent('No saved changes to email yet')
  })
})

function DrawerHarness({ listId }: { listId: string }) {
  const email = useListUpdateEmail(listId, OFFICE_ACTOR)
  return (
    <>
      <div data-testid="footer">{email.button}</div>
      {email.composer}
    </>
  )
}

describe('Draft update email in the List drawer', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('appears after a reassignment and opens a hospital email naming both anaesthetists and the Booking count, with no patient names', () => {
    const listId = SEED_LIST_IDS.rutherfordPm21
    web(<DrawerHarness listId={listId} />)
    expect(document.querySelector('[data-shot="drawer-update-email"]')).toBeNull()

    act(() => {
      expect(reassignList(useAppStore, OFFICE_ACTOR, listId, ANAE.strand).ok).toBe(true)
    })
    fireEvent.click(document.querySelector('[data-shot="drawer-update-email"]')!)
    expect(ticked()).toHaveLength(1)
    expect((composer().querySelector('select[data-shot="update-email-template"]') as HTMLSelectElement).value).toBe('ET001')
    expect(within(composer()).getByRole('button', { name: 'Hospital' })).toHaveAttribute('aria-pressed', 'true')

    const state = useAppStore.getState()
    const body = composer().querySelector('[data-shot="update-email-body"]')!.textContent ?? ''
    expect(body).toContain(state.masters.anaesthetists[ANAE.rutherford]!.name)
    expect(body).toContain(state.masters.anaesthetists[ANAE.strand]!.name)
    const bookings = Object.values(state.schedule.bookings).filter((b) => b.listId === listId && b.cancellation === undefined)
    expect(body).toContain(`has ${bookings.length} booking(s)`)
    for (const b of Object.values(state.schedule.bookings).filter((x) => x.listId === listId)) {
      expect(body).not.toContain(state.masters.patients[b.patientId]!.name)
    }
  })
})

function PoolHarness() {
  const state = useAppStore()
  const pool = notificationPool(state, { page: 1, showResolved: true })
  const onOpen = vi.fn()
  return (
    <ul>
      {pool.rows.map((r) => (
        <li key={r.notification.id} data-row={r.notification.id}>
          <NotificationEmailAction notification={r.notification} target={r.target} actor={OFFICE_ACTOR} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

describe('Draft cover-change email from the notification pool', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('a List moved into a colleague session opens the composer with the move ticked and To the hospital', () => {
    const moved = stageColleagueMoveToPersona(useAppStore, ANAE.souter)
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    const before = useAppStore.getState().notifications
    web(<PoolHarness />)
    fireEvent.click(document.querySelector('[data-shot="pool-cover-email"]')!)
    expect(ticked()).toHaveLength(1)
    const ownerMove = useAppStore.getState().audit.find((e) => e.action === 'list.ownerMove' && (e.after as { notificationId?: string }).notificationId === moved.value.notificationId)!
    expect(ticked()[0]).toBe(ownerMove.changeSetId !== undefined ? `cs:${ownerMove.changeSetId}` : `a:${ownerMove.id}`)
    expect(within(composer()).getByRole('button', { name: 'Hospital' })).toHaveAttribute('aria-pressed', 'true')

    const state = useAppStore.getState()
    const list = state.schedule.lists[moved.value.listId]!
    const hospitalEmail = state.masters.hospitals[list.hospitalId]!.contactEmail!
    expect(hospitalEmail).not.toBe('')
    expect(openLink()!.getAttribute('href')!.startsWith(`mailto:${hospitalEmail}?`)).toBe(true)
    const body = composer().querySelector('[data-shot="update-email-body"]')!.textContent ?? ''
    expect(body).toContain(state.masters.anaesthetists[moved.value.fromAnaesthetistId]!.name)
    expect(body).toContain(state.masters.anaesthetists[ANAE.souter]!.name)
    for (const b of Object.values(state.schedule.bookings).filter((x) => x.listId === list.id)) {
      expect(body).not.toContain(state.masters.patients[b.patientId]!.name)
    }
    // Drafting changes nothing about the notification.
    fireEvent.click(openLink()!)
    expect(useAppStore.getState().notifications).toBe(before)
  })

  it('a return to the office offers no email and points to the Draft List', () => {
    const state = useAppStore.getState()
    const list = state.schedule.lists[SEED_LIST_IDS.rutherfordPm21]!
    const actor = anaesthetistActor(state, ANAE.rutherford)!
    expect(moveListToOffice(useAppStore, actor, list.id, { vacatedStatus: SEED_STATUS.unavailable }).ok).toBe(true)
    web(<PoolHarness />)
    expect(document.querySelector('[data-shot="pool-cover-email"]')).toBeNull()
    expect(document.querySelector('[data-shot="pool-returned-hint"]')).toHaveTextContent('Assign this Draft List first. Its cover email is drafted from the List drawer after.')
    expect(within(document.querySelector('[data-shot="pool-returned-hint"]') as HTMLElement).getByRole('button', { name: /Open Draft List/ })).toBeInTheDocument()
  })
})
