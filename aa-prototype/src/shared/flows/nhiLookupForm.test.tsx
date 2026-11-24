/**
 * The NHI lookup on Add a booking (catch-up Phase 40a; US-14.4.1, US-11.1.2):
 * validated as typed, only a valid NHI looked up through the simulated Hub,
 * its states in the caption slot, the purpose note naming the List's
 * anaesthetist, and 22a's payer following a found patient only while it is
 * the patient.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, freshAppState, OFFICE_ACTOR, proceduresForBooking, setNhiHubMode, SOUTER_ACTOR, useAppStore, type Actor } from '../../store'
import { SEED_DRAFT_LIST_IDS, SEED_LIST_IDS } from '../../domain/seed'
import { HUB_TIMING } from '../nhiHub'
import { useDemoContextStore } from '../demoTriggers/context'
import { SurfaceProvider } from '../surface'
import { AddBookingFlow } from './AddBookingFlow'

const LIST = SEED_LIST_IDS.souterPm21

beforeEach(() => {
  useAppStore.setState(freshAppState())
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

function renderFlow(actor: Actor = SOUTER_ACTOR, listId: string = LIST) {
  return render(
    <SurfaceProvider variant="mobile">
      <AddBookingFlow open listId={listId} actor={actor} onClose={vi.fn()} onCreated={vi.fn()} />
    </SurfaceProvider>,
  )
}

const nhiField = () => screen.getByLabelText('NHI') as HTMLInputElement
const lookUp = () => screen.getByRole('button', { name: /Look up|Checking/ })
function type(nhi: string) {
  fireEvent.change(nhiField(), { target: { value: nhi } })
}
function lookupAndWait(nhi: string) {
  type(nhi)
  fireEvent.click(lookUp())
  act(() => {
    vi.advanceTimersByTime(HUB_TIMING.answerMs)
  })
}
const status = () => document.querySelector('[data-shot="nhi-lookup-status"]')

describe('validation as typed', () => {
  it('ZAA0068 shows the check-digit reason and keeps Look up disabled', () => {
    renderFlow()
    type('ZAA0068')
    expect(screen.getByText('The check digit does not match.')).toBeInTheDocument()
    expect(lookUp()).toBeDisabled()
  })

  it('ABI shows the I and O reason at once', () => {
    renderFlow()
    type('ABI')
    expect(screen.getByText('The letters I and O are never used in an NHI.')).toBeInTheDocument()
    expect(lookUp()).toBeDisabled()
  })

  it('a short NHI shows the shape hint; a valid one reads Valid NHI', () => {
    renderFlow()
    type('ZAA006')
    expect(screen.getByText('7 characters, AAA1234 or AAA12AB')).toBeInTheDocument()
    type('ZAA0067')
    expect(screen.getByText('Valid NHI')).toBeInTheDocument()
    expect(lookUp()).toBeEnabled()
  })
})

describe('the Hub states', () => {
  it('ZBR4417 checks, then finds Mereana Tipene and fills the patient; the payer follows', () => {
    renderFlow()
    type('ZBR4417')
    fireEvent.click(lookUp())
    expect(status()?.textContent).toBe('Checking the NHI register')
    act(() => {
      vi.advanceTimersByTime(HUB_TIMING.answerMs)
    })
    expect(status()?.textContent).toContain('Found Mereana Tipene on the NHI register.')
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Mereana Tipene')
    expect((screen.getByLabelText('Date of birth') as HTMLInputElement).value).toBe('1981-07-13')
    const payer = document.querySelector('[data-shot="add-booking-payer"]') as HTMLElement
    expect(within(payer).getByText('Mereana Tipene')).toBeInTheDocument()
  })

  it('ZBX41AL finds Ana Fifita with New format NHI; ZBW6638 is not on the register', () => {
    renderFlow()
    lookupAndWait('ZBX41AL')
    expect(status()?.textContent).toContain('Found Ana Fifita')
    expect(status()?.textContent).toContain('New format NHI')
    lookupAndWait('ZBW6638')
    expect(status()?.textContent).toBe('No one with NHI ZBW6638 is on the NHI register. Check the number, or enter the details by hand.')
  })

  it('Unavailable shows Retry and the badge; Save with a typed valid NHI still creates the Booking; an empty NHI is refused', () => {
    setNhiHubMode(useAppStore, OFFICE_ACTOR, 'unavailable')
    renderFlow()
    expect(document.querySelector('[data-shot="nhi-hub-mode-badge"]')?.textContent).toContain('Hub simulated as Unavailable')
    lookupAndWait('ZBR4417')
    expect(status()?.textContent).toContain('The Digital Services Hub is not answering.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mereana Tipene' } })
    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '1981-07-13' } })
    fireEvent.change(screen.getByLabelText('Procedure description'), { target: { value: 'Knee arthroscopy' } })
    type('')
    expect(screen.getByRole('button', { name: 'Save booking' })).toBeDisabled()
    type('ZBR4417')
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    const added = bookingsForList(useAppStore.getState(), LIST).filter((b) => !before.has(b.id))
    expect(added).toHaveLength(1)
  })

  it('Slow shows the notice and Stop waiting cancels', () => {
    setNhiHubMode(useAppStore, OFFICE_ACTOR, 'slow')
    renderFlow()
    type('ZBR4417')
    fireEvent.click(lookUp())
    act(() => {
      vi.advanceTimersByTime(HUB_TIMING.slowNoticeMs)
    })
    expect(status()?.textContent).toContain('The Hub is slow to answer.')
    fireEvent.click(screen.getByRole('button', { name: 'Stop waiting' }))
    act(() => {
      vi.advanceTimersByTime(HUB_TIMING.slowAnswerMs)
    })
    expect(status()?.textContent).toBe('Stopped waiting for the Hub. Enter the details by hand.')
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
  })

  it('a phone an earlier lookup filled never sticks to the next patient found', () => {
    renderFlow()
    lookupAndWait('DEM1239')
    expect((screen.getByLabelText('Phone') as HTMLInputElement).value).toBe('021 555 0190')
    lookupAndWait('ZBR4417')
    expect((screen.getByLabelText('Phone') as HTMLInputElement).value).toBe('')
    // A phone typed by hand stays.
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '027 111 2222' } })
    lookupAndWait('ZBT2253')
    expect((screen.getByLabelText('Phone') as HTMLInputElement).value).toBe('027 111 2222')
  })

  it('an NHI edit while checking discards the answer', () => {
    renderFlow()
    type('ZBR4417')
    fireEvent.click(lookUp())
    type('ZBT2253')
    act(() => {
      vi.advanceTimersByTime(HUB_TIMING.answerMs)
    })
    expect(status()).toBeNull()
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
  })

  it('publishes nhiHub.inUse while open', () => {
    const { unmount } = renderFlow()
    expect(useDemoContextStore.getState().values['nhiHub.inUse']).toBe(true)
    unmount()
    expect(useDemoContextStore.getState().values['nhiHub.inUse']).toBeUndefined()
  })
})

describe('the purpose note', () => {
  it("names Dr Melanie Souter with her HPI CPN on her ACTIVE Tue 21 PM List", () => {
    expect(useAppStore.getState().schedule.lists[LIST]?.state).toBe('ACTIVE')
    renderFlow()
    expect(document.querySelector('[data-shot="nhi-purpose"]')?.textContent).toBe(
      'Looked up on behalf of Dr Melanie Souter (HPI CPN 10SOUM), only to identify this patient. Health Information Privacy Code 2020.',
    )
  })

  it('names the AA office on a Draft List', () => {
    renderFlow(OFFICE_ACTOR, SEED_DRAFT_LIST_IDS.stGeorges)
    expect(document.querySelector('[data-shot="nhi-purpose"]')?.textContent).toContain('Looked up on behalf of the AA office,')
  })
})

describe('the payer and the rest of the form', () => {
  it('a Different payer typed as a guardian survives a lookup and a second lookup; the RVG code and description stay', () => {
    renderFlow()
    fireEvent.change(screen.getByLabelText('Procedure description'), { target: { value: 'scope as written' } })
    fireEvent.click(within(document.querySelector('[data-shot="payer-different-tick"]') as HTMLElement).getByRole('checkbox'))
    const other = document.querySelector('[data-shot="payer-other-fields"]') as HTMLElement
    fireEvent.change(within(other).getByLabelText('Name'), { target: { value: 'Hine Tipene' } })
    lookupAndWait('ZBR4417')
    lookupAndWait('ZBT2253')
    expect((within(other).getByLabelText('Name') as HTMLInputElement).value).toBe('Hine Tipene')
    expect((screen.getByLabelText('Procedure description') as HTMLInputElement).value).toBe('scope as written')
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    const [id] = bookingsForList(useAppStore.getState(), LIST).filter((b) => !before.has(b.id)).map((b) => b.id)
    expect(id).toBeDefined()
    const booking = useAppStore.getState().schedule.bookings[id!]!
    expect(useAppStore.getState().masters.patients[booking.patientId]?.name).toBe('Lucas Brennan')
    const [proc] = proceduresForBooking(useAppStore.getState(), id!)
    expect(proc?.payer).toMatchObject({ kind: 'other', name: 'Hine Tipene' })
  })
})
