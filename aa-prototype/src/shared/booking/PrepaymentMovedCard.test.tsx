/**
 * The moved prepaid Booking's card (catch-up Phase 41; US-06.5.4): a moved
 * Riley shows the card and, to the office, the email; it sends and shows the
 * emailed line; the anaesthetist reads the card without the action; an
 * unmoved Booking shows nothing.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SurfaceProvider } from '../surface'
import { approvePrepayment, emailPatientAnaesthetistChanged, freshAppState, prepaymentStatusFor, reassignBooking, useAppStore, type Actor } from '../../store'
import { SEED_MARKERS } from '../../domain/seed'
import { EMAIL_PATIENT_CHANGED_LABEL, PrepaymentMovedCard } from './PrepaymentMovedCard'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const RILEY = SEED_MARKERS.prepaymentBooking!.entityId

function shot(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-shot="${name}"]`)
}

function sendRiley(): string {
  const payerKey = prepaymentStatusFor(useAppStore.getState(), RILEY).groups.find((g) => g.status === 'awaitingApproval')!.payerKey
  const out = approvePrepayment(useAppStore, OFFICE, RILEY, payerKey)
  if (!out.ok) throw new Error(out.message)
  return out.value.invoiceId
}

/** The office moves Riley to a colleague's List: that colleague's id. */
function moveRiley(): string {
  const s = useAppStore.getState()
  const from = s.schedule.lists[s.schedule.bookings[RILEY]!.listId]!.anaesthetistId
  const target = Object.values(s.schedule.lists)
    .filter((l) => l.anaesthetistId !== undefined && l.anaesthetistId !== from && l.state === 'ACTIVE' && l.dateISO >= '2026-07-21')
    .sort((a, b) => a.id.localeCompare(b.id))
    .find((l) => reassignBooking(useAppStore, OFFICE, RILEY, l.id).ok)
  if (target === undefined) throw new Error('no List to move Riley to')
  return target.anaesthetistId!
}

function renderCard(actor: Actor) {
  return render(
    <SurfaceProvider variant="web">
      <PrepaymentMovedCard bookingId={RILEY} actor={actor} />
    </SurfaceProvider>,
  )
}

describe('PrepaymentMovedCard', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows nothing on an unmoved Booking with a sent prepayment', () => {
    sendRiley()
    renderCard(OFFICE)
    expect(shot('prepayment-moved')).toBeNull()
    expect(screen.queryByRole('button', { name: EMAIL_PATIENT_CHANGED_LABEL })).toBeNull()
  })

  it('a moved Riley: the card names the new anaesthetist and the unchanged invoice; the office emails the patient', () => {
    const invoiceId = sendRiley()
    const to = moveRiley()
    const s = useAppStore.getState()
    const surname = s.masters.anaesthetists[to]!.name.split(' ').pop()!
    const number = s.billing.invoices[invoiceId]!.invoiceNumber
    renderCard(OFFICE)
    const card = shot('prepayment-moved')!
    expect(card).not.toBeNull()
    expect(card.textContent).toContain(`Prepayment kept at the agreed amount · now with Dr ${surname}`)
    expect(shot('prepayment-moved-invoice')?.textContent).toBe(`Invoice ${number} unchanged`)
    expect(shot('patient-emailed')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: EMAIL_PATIENT_CHANGED_LABEL }))
    expect(shot('patient-email')).not.toBeNull()
    expect(shot('patient-email-template')?.textContent).toContain('Anaesthetist changed')
    expect(shot('patient-email-preview')?.textContent).toContain(surname)
    expect(shot('patient-email-provisional')?.textContent).toBe('Provisional (OQ-120)')
    fireEvent.click(shot('patient-email-send')!)
    expect(shot('patient-email')).toBeNull()

    const notices = useAppStore.getState().schedule.bookings[RILEY]!.patientNotices ?? []
    expect(notices).toHaveLength(1)
    const line = shot('patient-emailed')!
    expect(line.textContent).toMatch(/^Patient emailed \d{1,2} \w{3} \d{2}:\d{2} to \S+@\S+$/)
    expect(line.textContent).toContain(notices[0]!.to)
  })

  it("the anaesthetist reads the card and the emailed line, never the action", () => {
    sendRiley()
    const to = moveRiley()
    expect(emailPatientAnaesthetistChanged(useAppStore, OFFICE, RILEY).ok).toBe(true)
    const name = useAppStore.getState().masters.anaesthetists[to]!.name
    renderCard({ who: name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: to })
    expect(shot('prepayment-moved')).not.toBeNull()
    expect(shot('patient-emailed')).not.toBeNull()
    expect(screen.queryByRole('button', { name: EMAIL_PATIENT_CHANGED_LABEL })).toBeNull()
  })
})
