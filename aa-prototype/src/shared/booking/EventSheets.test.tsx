import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addBillingEvent, freshAppState, useAppStore, type Actor } from '../../store'
import { SurfaceProvider } from '../surface'
import { ProcedureEventsList } from './ProcedureEventsList'
import { AddBillingEventSheet, AddPrePostOpEventSheet } from './EventSheets'
import { ContractEventFees } from '../../apps/admin/flows/ContractEventFees'
import { ANAE } from '../../domain/seed'

/**
 * Catch-up Phase 39b (US-03.7.1, US-03.7.2, US-05.5.2): the two event sheets,
 * the events list's new rows and buttons, and the Contract editor's Event fees.
 */
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function wrap(node: React.ReactNode, variant: 'web' | 'mobile' = 'mobile') {
  return render(
    <MemoryRouter>
      <SurfaceProvider variant={variant}>{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}
const ownProcedure = () => Object.values(useAppStore.getState().schedule.procedures).find((p) => p.bookingId === 'BK0001')!.id

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the pre-op or post-op sheet', () => {
  it('records a time with no figure, offers no modifier, unit or rate control, and lists the ACC presets with the OQ-12 caption', () => {
    wrap(<AddPrePostOpEventSheet open procedureId={ownProcedure()} actor={SOUTER} onClose={() => undefined} />)
    const sheet = document.querySelector('[data-shot="add-event-sheet"]') as HTMLElement
    expect(sheet).not.toBeNull()
    expect(within(sheet).getByText('The office prices the time at review.')).toBeTruthy()
    expect(sheet.textContent).not.toMatch(/\$|modifier|base unit|rate/i)
    fireEvent.click(within(sheet).getByText('Pre-op'))
    fireEvent.click(within(sheet).getByText('ACC pre-op assessment'))
    expect(sheet.querySelectorAll('[data-shot="acc-preop-preset"]')).toHaveLength(3)
    // OQ-12's open-question caption is the office's (catch-up Phase 43a): the anaesthetist sees the presets alone.
    expect(within(sheet).queryByText("Codes to confirm with AA's accountant (OQ-12).")).toBeNull()
    expect(sheet.textContent).not.toMatch(/[–—]|Our reading/)
  })

  it("the office's sheet keeps the OQ-12 caption and the same-as reading (Phase 43a)", () => {
    wrap(<AddPrePostOpEventSheet open procedureId={ownProcedure()} actor={OFFICE} onClose={() => undefined} />)
    const sheet = document.querySelector('[data-shot="add-event-sheet"]') as HTMLElement
    fireEvent.click(within(sheet).getByText('Pre-op'))
    fireEvent.click(within(sheet).getByText('ACC pre-op assessment'))
    expect(within(sheet).getByText("Codes to confirm with AA's accountant (OQ-12).")).toBeTruthy()
    expect(sheet.textContent).toContain('Our reading')
  })

  it('clearing "same as" requires a party', () => {
    wrap(<AddPrePostOpEventSheet open procedureId={ownProcedure()} actor={SOUTER} onClose={() => undefined} />)
    const sheet = document.querySelector('[data-shot="add-event-sheet"]') as HTMLElement
    fireEvent.click(within(sheet).getByText('Post-op ward review'))
    fireEvent.click(sheet.querySelector('[data-shot="event-same-as"]') as HTMLElement)
    fireEvent.click(sheet.querySelector('[data-shot="add-event-save"]') as HTMLElement)
    expect(within(sheet).getByText('Pick who to bill.')).toBeTruthy()
    expect(Object.values(useAppStore.getState().schedule.procedureEvents).filter((e) => e.kind === 'postOp')).toHaveLength(0)
  })
})

describe('the billing event sheet', () => {
  it('has a free-text field and an amount and no time, rate, unit, type or add-on control', () => {
    wrap(<AddBillingEventSheet open procedureId={ownProcedure()} actor={SOUTER} onClose={() => undefined} />)
    const sheet = document.querySelector('[data-shot="add-billing-event-sheet"]') as HTMLElement
    expect(within(sheet).getByText('What is this for?')).toBeTruthy()
    expect(within(sheet).getByText('Amount, ex GST')).toBeTruthy()
    expect(sheet.textContent).not.toMatch(/minutes|Record a time|rate|unit|add-on|UNIT x RATE|Type/i)
  })
})

describe("the events list's new rows", () => {
  it('a credit reads negative with a plain hyphen; the owner sees totals, never a calculation', () => {
    const pid = ownProcedure()
    expect(addBillingEvent(useAppStore, SOUTER, pid, { direction: 'credit', description: 'Goodwill adjustment', amount: 40, occurredOnISO: '2026-07-21', party: { sameAs: true } }).ok).toBe(true)
    const { container } = wrap(<ProcedureEventsList procedureId={pid} actor={SOUTER} />)
    const row = container.querySelector('[data-kind="billing"]') as HTMLElement
    expect(row.textContent).toContain('-$40.00')
    expect(row.textContent).toContain('Goodwill adjustment')
    expect(row.textContent).not.toMatch(/ x |units/)
  })

  it("on a billed Booking the owner's controls are the two add buttons (beside 38b's Raise additional invoice on the Paid by row)", () => {
    const { container } = wrap(<ProcedureEventsList procedureId="HP03" actor={SOUTER} />)
    expect(container.querySelector('[data-shot="add-pre-post-op-event"]')?.textContent).toBe('Add pre-op or post-op event')
    expect(container.querySelector('[data-shot="add-billing-event"]')?.textContent).toBe('Add billing event')
  })
})

describe('the Contract event fees', () => {
  it("lists St George's ACC's STGACC-PAIN fee and adds one", () => {
    const contract = useAppStore.getState().masters.contracts['CT-STG-ACC']!
    const { container } = wrap(<ContractEventFees contract={contract} actor={OFFICE} onError={() => undefined} />, 'web')
    expect(container.querySelector('[data-shot="contract-event-fees"]')?.textContent).toContain('STGACC-PAIN')
    expect(container.textContent).toContain('$120.00')
    expect(screen.getByText('Fixed fees this Contract charges for a pre-op or post-op event, in place of the time recorded.')).toBeTruthy()
  })
})
