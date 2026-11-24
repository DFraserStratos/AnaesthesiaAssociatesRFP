import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addProcedureEvent, declineProcedureEvent, freshAppState, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { ProcedureEventsList } from './ProcedureEventsList'
import { AdditionalInvoiceButton } from './AdditionalInvoiceButton'
import { ANAE } from '../../domain/seed'

/**
 * Catch-up Phase 38b (US-03.7.3, US-08.6.3 "Button"): what the office and the
 * anaesthetist see on a Procedure's events, and who gets the button. The
 * seeded EV0001 is Dr Souter's on her own HP03.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const SHARMA: Actor = { who: 'Dr Priya Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }

function renderList(actor: Actor, procedureId = 'HP03', variant: 'web' | 'mobile' = 'web') {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant={variant}>
        <ProcedureEventsList procedureId={procedureId} actor={actor} {...(actor.role === 'office' ? { onReview: () => undefined, onOpenInvoice: () => undefined } : {})} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

function renderButton(actor: Actor, procedureId = 'HP03') {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant="web">
        <AdditionalInvoiceButton procedureId={procedureId} actor={actor} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('ProcedureEventsList', () => {
  it('the owner sees the total and party, Edit and Remove, and no review action or invoice link', () => {
    const { container } = renderList(SOUTER)
    const row = container.querySelector('[data-shot="procedure-event-row"]')!
    expect(row.textContent).toContain('$85.00')
    expect(row.textContent).toContain("Raised by you · St George's")
    expect(row.querySelector('[data-shot="procedure-event-review"]')).toBeNull()
    expect(row.querySelector('[data-shot="procedure-event-invoice"]')).toBeNull()
    expect(row.querySelector('[data-shot="procedure-event-edit"]')).not.toBeNull()
    expect(row.querySelector('[data-shot="procedure-event-remove"]')).not.toBeNull()
  })

  it('the office sees everything with Review, Edit and Remove', () => {
    const { container } = renderList(OFFICE)
    const row = container.querySelector('[data-shot="procedure-event-row"]')!
    expect(row.textContent).toContain('$85.00')
    expect(row.textContent).toContain('Raised by Dr Souter')
    for (const shot of ['procedure-event-review', 'procedure-event-edit', 'procedure-event-remove']) expect(row.querySelector(`[data-shot="${shot}"]`)).not.toBeNull()
  })

  it('Edit shows for the anaesthetist only on what they raised, awaiting review or declined; the decline reason shows', () => {
    expect(declineProcedureEvent(useAppStore, OFFICE, 'EV0001', 'Split the time').ok).toBe(true)
    const { container } = renderList(SOUTER)
    expect(container.querySelector('[data-shot="procedure-event-edit"]')).not.toBeNull()
    expect(screen.getByText('Declined: Split the time')).toBeTruthy()
  })

  it("a colleague sees no money and no actions; with no events the owner's apps show only the add buttons, a colleague's nothing, and Admin the empty line", () => {
    const { container } = renderList(SHARMA)
    const row = container.querySelector('[data-shot="procedure-event-row"]')!
    expect(row.textContent).not.toContain('$85.00')
    expect(row.querySelector('[data-shot="procedure-event-edit"]')).toBeNull()
    cleanup()
    const empty = Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === 'BK0001')!.id
    // Catch-up Phase 39b: the owner's Procedure always shows the section, so the add buttons have a home.
    const owner = renderList(SOUTER, empty, 'mobile').container
    expect(owner.querySelector('[data-shot="procedure-event-row"]')).toBeNull()
    expect(owner.querySelector('[data-shot="add-pre-post-op-event"]')).not.toBeNull()
    expect(owner.querySelector('[data-shot="add-billing-event"]')).not.toBeNull()
    cleanup()
    expect(renderList(SHARMA, empty, 'mobile').container.querySelector('[data-shot="procedure-events"]')).toBeNull()
    cleanup()
    expect(renderList(OFFICE, empty).container.textContent).toContain('No events on this Procedure yet.')
  })

  it('orders rows by date, then id', () => {
    const later = addProcedureEvent(useAppStore, OFFICE, 'HP03', { kind: 'additionalInvoice', occurredOnISO: '2026-06-22', party: { sameAs: true }, lines: [{ description: 'Earlier charge', quantity: 1, unitAmount: 10 }] })
    expect(later.ok).toBe(true)
    const { container } = renderList(OFFICE)
    const ids = [...container.querySelectorAll('[data-shot="procedure-event-row"]')].map((r) => r.getAttribute('data-event-id'))
    expect(ids).toEqual(['EV0002', 'EV0001'])
  })
})

describe('AdditionalInvoiceButton', () => {
  it('reads Create for the office, Raise for the owner, and is absent for a colleague', () => {
    expect(renderButton(OFFICE).container.textContent).toBe('Create additional invoice')
    cleanup()
    expect(renderButton(SOUTER).container.textContent).toBe('Raise additional invoice')
    cleanup()
    expect(renderButton(SHARMA).container.textContent).toBe('')
  })

  it('is absent on a List not yet authorised', () => {
    const active = Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === 'BK0001')!.id
    expect(renderButton(OFFICE, active).container.textContent).toBe('')
  })
})

describe('raisedByText (catch-up Phase 44 QA)', () => {
  it('names the system plainly, never "Dr System"', async () => {
    const { raisedByText } = await import('../procedureEventCopy')
    expect(raisedByText({ role: 'system', who: 'System' })).toBe('Raised automatically')
    expect(raisedByText({ role: 'office', who: 'Kirsty W.' })).toBe('Raised by the office')
    expect(raisedByText({ role: 'anaesthetist', who: 'Dr Melanie Souter', anaesthetistId: 'X' })).toBe('Raised by Dr Souter')
  })
})
