/**
 * Add a booking opens straight on the manual form (catch-up Phase 15b): manual
 * entry is the one way in (US-02.4.1), photo capture is Future Work (US-02.4.4)
 * reachable only through the badged demo action (`initialMode="photo"`), and
 * both prongs stamp `admin` for the office or `anaesthetistAdHoc` otherwise.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bookingsForList, freshAppState, OFFICE_ACTOR, SOUTER_ACTOR, useAppStore, type Actor } from '../../store'
import { SEED_LIST_IDS } from '../../domain/seed'
import { SurfaceProvider } from '../surface'
import { AddBookingFlow } from './AddBookingFlow'
import { DETAILS_DIFFER_LINE, NHI_NEEDED_TO_SAVE } from './nhiCopy'

const LIST = SEED_LIST_IDS.souterPm21

beforeEach(() => {
  useAppStore.setState(freshAppState())
})

afterEach(() => {
  vi.useRealTimers()
})

function renderFlow(actor: Actor, initialMode?: 'manual' | 'photo') {
  return render(
    <SurfaceProvider variant="mobile">
      <AddBookingFlow open listId={LIST} actor={actor} initialMode={initialMode} onClose={vi.fn()} onCreated={vi.fn()} />
    </SurfaceProvider>,
  )
}

function newBookingIds(before: Set<string>): string[] {
  return bookingsForList(useAppStore.getState(), LIST)
    .map((b) => b.id)
    .filter((id) => !before.has(id))
}

function saveManual() {
  fireEvent.change(screen.getByLabelText('NHI'), { target: { value: 'ZZZ9005' } })
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ad Hoc Patient' } })
  fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '1990-05-05' } })
  fireEvent.change(screen.getByLabelText('Procedure description'), { target: { value: 'Diagnostic laparoscopy' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
}

describe('AddBookingFlow', () => {
  it('opens on the manual form under its title, with no chooser, photo choice or back control', () => {
    renderFlow(SOUTER_ACTOR)
    expect(screen.getByRole('heading', { name: 'Add a booking' })).toBeInTheDocument()
    expect(screen.getByText('Patient')).toBeInTheDocument()
    expect(screen.queryByText('Photo of paper list')).toBeNull()
    expect(screen.queryByText('Enter manually')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Back to Add a booking' })).toBeNull()
    expect(screen.queryByText('Future scope')).toBeNull()
  })

  it.each([
    ['an anaesthetist', SOUTER_ACTOR, 'anaesthetistAdHoc'],
    ['the office', OFFICE_ACTOR, 'admin'],
  ] as const)('stamps the manual Booking from %s as %s', (_who, actor, source) => {
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(actor)
    saveManual()
    const created = newBookingIds(before)
    expect(created).toHaveLength(1)
    expect(useAppStore.getState().schedule.bookings[created[0]!]?.source).toBe(source)
    expect(screen.getByText('Booking added')).toBeInTheDocument()
  })

  it.each([
    ['an anaesthetist', SOUTER_ACTOR, 'anaesthetistAdHoc'],
    ['the office', OFFICE_ACTOR, 'admin'],
  ] as const)('the Future-scope photo prong is badged, keeps one title, and stamps %s as %s', (_who, actor, source) => {
    vi.useFakeTimers()
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(actor, 'photo')
    expect(screen.getByText('Future scope')).toBeInTheDocument()
    expect(screen.getByText('Photo of the paper list')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Add a booking' })).toBeNull()

    fireEvent.click(screen.getAllByRole('img', { name: /^Sample paper card/ })[0]!)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))

    const created = newBookingIds(before)
    expect(created).toHaveLength(1)
    const booking = useAppStore.getState().schedule.bookings[created[0]!]
    expect(booking?.source).toBe(source)
    // The photo demo only prefills the form (catch-up Phase 20a: attachments removed, RV-01).
    expect(booking).not.toHaveProperty('attachments')
    const first = Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === created[0])
    // An anaesthetist's entry is the anaesthetist's; the office's defaults to Told by Phone.
    expect(first?.procedureText).toMatchObject({ source: actor.role === 'office' ? 'phone' : 'anaesthetist' })
  })

  it('a repeat Future-scope request while the photo prong is open restarts it at the card picker', () => {
    vi.useFakeTimers()
    const props = { open: true, listId: LIST, actor: SOUTER_ACTOR, initialMode: 'photo' as const, onClose: vi.fn(), onCreated: vi.fn() }
    const view = render(
      <SurfaceProvider variant="mobile">
        <AddBookingFlow {...props} resetKey={1} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getAllByRole('img', { name: /^Sample paper card/ })[0]!)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('button', { name: 'Save booking' })).toBeInTheDocument()

    view.rerender(
      <SurfaceProvider variant="mobile">
        <AddBookingFlow {...props} resetKey={2} />
      </SurfaceProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Save booking' })).toBeNull()
    expect(screen.getAllByRole('img', { name: /^Sample paper card/ }).length).toBeGreaterThan(0)
  })
})

describe('the Procedure description field (catch-up Phase 20a; US-02.4.1)', () => {
  function fillPatient() {
    fireEvent.change(screen.getByLabelText('NHI'), { target: { value: 'ZZZ9005' } })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Typed Patient' } })
    fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: '1990-05-05' } })
  }
  const newestProcedure = (before: Set<string>) => {
    const created = newBookingIds(before)
    expect(created).toHaveLength(1)
    return Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === created[0])!
  }

  it("an anaesthetist's save stores the text exactly as typed, leading and trailing spaces kept, with Anaesthetist", () => {
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(SOUTER_ACTOR)
    fillPatient()
    fireEvent.change(screen.getByLabelText('Procedure description'), { target: { value: ' L TKJR ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    const p = newestProcedure(before)
    expect(p.procedureText).toMatchObject({ text: ' L TKJR ', source: 'anaesthetist', from: SOUTER_ACTOR.who })
    expect(p.invoiceDescription).toEqual({ text: ' L TKJR ', origin: 'entered' })
  })

  it('the office chooses Told by Email', () => {
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(OFFICE_ACTOR)
    fillPatient()
    fireEvent.change(screen.getByLabelText('Procedure description'), { target: { value: 'RTK' } })
    fireEvent.click(screen.getByRole('button', { name: 'Email' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    expect(newestProcedure(before).procedureText).toMatchObject({ text: 'RTK', source: 'email' })
  })

  it('refuses a save with neither a description nor an RVG code', () => {
    const before = new Set(bookingsForList(useAppStore.getState(), LIST).map((b) => b.id))
    renderFlow(SOUTER_ACTOR)
    fillPatient()
    fireEvent.click(screen.getByRole('button', { name: 'Save booking' }))
    expect(screen.getByText('Type the procedure as told, or choose an RVG code.')).toBeInTheDocument()
    expect(newBookingIds(before)).toHaveLength(0)
  })
})

describe('the mandatory NHI and the matched record (catch-up Phase 40; D11, US-03.1.5, US-11.1.4)', () => {
  // The three add-booking forms: the mobile sheet and the web dialog (an anaesthetist), and Admin's (the office).
  const FORMS = [
    ['mobile', 'mobile', SOUTER_ACTOR],
    ['web', 'web', SOUTER_ACTOR],
    ['Admin', 'web', OFFICE_ACTOR],
  ] as const

  function renderOn(variant: 'mobile' | 'web', actor: Actor) {
    return render(
      <SurfaceProvider variant={variant}>
        <AddBookingFlow open listId={LIST} actor={actor} onClose={vi.fn()} onCreated={vi.fn()} />
      </SurfaceProvider>,
    )
  }
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  const saveButton = () => screen.getByRole('button', { name: 'Save booking' })

  it.each(FORMS)('the %s form disables Save with a blank NHI, says why, and enables it with a valid one', (_app, variant, actor) => {
    renderOn(variant, actor)
    type('Name', 'Ad Hoc Patient')
    type('Date of birth', '1990-05-05')
    expect(saveButton()).toBeDisabled()
    expect(saveButton()).toHaveAccessibleDescription(NHI_NEEDED_TO_SAVE)

    // An invalid NHI keeps Save disabled and shows validateNhi's reason live.
    type('NHI', 'ZZZ9004')
    expect(saveButton()).toBeDisabled()
    expect(screen.getByLabelText('NHI')).toHaveAttribute('aria-invalid', 'true')

    type('NHI', 'ZZZ9005')
    expect(saveButton()).toBeEnabled()
    expect(screen.queryByText(NHI_NEEDED_TO_SAVE)).toBeNull()
    expect(screen.getByLabelText('NHI')).not.toHaveAttribute('aria-invalid')
  })

  it('a matched NHI whose details differ says so in the form and on the saved step', () => {
    renderOn('mobile', SOUTER_ACTOR)
    type('NHI', 'CQY9304')
    expect(screen.getByText(/Matches an existing record: Sarah Mitchell/)).toBeInTheDocument()
    expect(screen.queryByText(DETAILS_DIFFER_LINE)).toBeNull()

    type('Name', 'Sarah Mitchell')
    type('Date of birth', '1988-04-12')
    expect(screen.queryByText(DETAILS_DIFFER_LINE)).toBeNull()
    type('Phone', '027 000 1111')
    expect(screen.getByText(DETAILS_DIFFER_LINE)).toBeInTheDocument()

    type('Procedure description', 'Diagnostic laparoscopy')
    fireEvent.click(saveButton())
    expect(screen.getByText(`Linked to an existing patient record by NHI. No duplicate was created. ${DETAILS_DIFFER_LINE}`)).toBeInTheDocument()
    const mitchell = Object.values(useAppStore.getState().masters.patients).find((p) => p.nhi === 'CQY9304')
    expect(mitchell?.pendingDetails?.differences.map((d) => d.field)).toEqual(['phone'])
  })

  it("the Admin form previews Sarah Mitchell's strong balance warning while the patient pays, and hides it for another payer", () => {
    renderOn('web', OFFICE_ACTOR)
    type('NHI', 'CQY9304')
    const preview = document.querySelector('[data-shot="manual-balance-preview"]')
    expect(preview).not.toBeNull()
    expect(preview).toHaveAttribute('data-strength', 'strong')
    expect(preview).toHaveTextContent('Sarah Mitchell owes $610.00 on 1 invoice')
    expect(preview).toHaveTextContent('Strong')

    fireEvent.click(screen.getByLabelText(/Different payer/))
    expect(document.querySelector('[data-shot="manual-balance-preview"]')).toBeNull()
  })

  it.each([
    ['mobile', 'mobile'],
    ['web', 'web'],
  ] as const)('the %s form never shows the balance preview', (_app, variant) => {
    renderOn(variant, SOUTER_ACTOR)
    type('NHI', 'CQY9304')
    expect(screen.getByText(/Matches an existing record: Sarah Mitchell/)).toBeInTheDocument()
    expect(document.querySelector('[data-shot="manual-balance-preview"]')).toBeNull()
    expect(screen.queryByText(/owes \$610\.00/)).toBeNull()
  })
})
