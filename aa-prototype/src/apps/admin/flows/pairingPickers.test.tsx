import { MemoryRouter } from 'react-router-dom'
/**
 * The surgeon pickers on the office's session paths (catch-up Phase 17;
 * US-01.3.5 "Separated", "Still selectable", "Warned"): Edit list and Book
 * (phone advice). Not preferred sits in its own labelled group, stays
 * selectable, warns before save, and going ahead is acknowledged once.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANAE, SURG } from '../../../domain/seed'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { SurfaceProvider } from '../../../shared/surface'
import { EditListSheet } from './EditListSheet'
import { PhoneAdviceBooking } from './PhoneAdviceBooking'
import { RecurringBookingSheet } from './RecurringBookingSheet'
import { AssignListSheet } from './AssignListSheet'
import { projectedListId, slotIdFor } from '../../../domain/slots'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SHARMA_AM = projectedListId(ANAE.sharma, '2026-07-21', 'AM')
/** Sharma's free Tue 21 PM session (catch-up Phase 28: an empty Slot, no List). */
const SHARMA_PM_SLOT = slotIdFor(ANAE.sharma, '2026-07-21', 'PM')

function surgeonSelect(): HTMLSelectElement {
  return document.querySelector('select[data-shot="surgeon-picker"]') as HTMLSelectElement
}

describe('surgeon pickers', () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('Edit list: Reid apart, Whitford marked, a warning and "Save list anyway" that saves with one acknowledgement', () => {
    const list = useAppStore.getState().schedule.lists[SHARMA_AM]!
    const onClose = vi.fn()
    render(
      <SurfaceProvider variant="web">
        <EditListSheet open list={list} actor={OFFICE} onClose={onClose} />
      </SurfaceProvider>,
    )
    const select = surgeonSelect()
    const groups = Array.from(select.querySelectorAll('optgroup')).map((g) => g.label)
    expect(groups).toEqual(['Surgeons', 'Not preferred with Dr Sharma'])
    const apart = select.querySelector('optgroup[label="Not preferred with Dr Sharma"]')!
    expect(Array.from(apart.querySelectorAll('option')).map((o) => o.textContent)).toEqual(['Ms A. Reid (Ophthalmology) · not preferred'])
    expect(Array.from(select.querySelectorAll('option')).some((o) => o.textContent === 'Mr J. Whitford (Ophthalmology) · preferred')).toBe(true)
    expect(screen.getByRole('button', { name: 'Save list' })).toBeInTheDocument()

    fireEvent.change(select, { target: { value: SURG.reid } })
    expect(screen.getByRole('status')).toHaveTextContent('Ms A. Reid prefers not to work with Dr Priya Sharma.')
    fireEvent.change(select, { target: { value: SURG.whitford } })
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.change(select, { target: { value: SURG.reid } })
    fireEvent.click(screen.getByRole('button', { name: 'Save list anyway' }))
    expect(onClose).toHaveBeenCalled()
    expect(useAppStore.getState().schedule.lists[SHARMA_AM]?.surgeonId).toBe(SURG.reid)
    expect(useAppStore.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(1)
  })

  it('Book (phone advice): the surgeon is required; Reid warns with "Continue anyway"; Hale (the S2 path) never does', () => {
    render(
      <SurfaceProvider variant="web">
        <PhoneAdviceBooking open slotId={SHARMA_PM_SLOT} actor={OFFICE} onClose={vi.fn()} onBooked={vi.fn()} />
      </SurfaceProvider>,
    )
    const select = surgeonSelect()
    expect(select.querySelector('option')?.textContent).toBe('Choose a surgeon')
    fireEvent.change(select, { target: { value: SURG.reid } })
    expect(screen.getByRole('status')).toHaveTextContent("Reason: Surgeon's preference")
    expect(screen.getByRole('button', { name: 'Continue anyway' })).toBeInTheDocument()
    fireEvent.change(select, { target: { value: SURG.hale } })
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Continue to add booking' })).toBeInTheDocument()
    // Nothing is written until the office continues (the assignment).
    expect(useAppStore.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(0)
  })

  it('Book (phone advice): continuing with Reid assigns the List and records the acknowledgement once, at assignment', () => {
    render(
      <SurfaceProvider variant="web">
        <PhoneAdviceBooking open slotId={SHARMA_PM_SLOT} actor={OFFICE} onClose={vi.fn()} onBooked={vi.fn()} />
      </SurfaceProvider>,
    )
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'H-STG' } })
    fireEvent.change(surgeonSelect(), { target: { value: SURG.reid } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue anyway' }))
    const list = Object.values(useAppStore.getState().schedule.lists).find((l) => l.slotId === SHARMA_PM_SLOT)
    expect(list?.state).toBe('ACTIVE')
    expect(list?.surgeonId).toBe(SURG.reid)
    expect(useAppStore.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(1)
  })

  it('Assign List: hospital and surgeon required, Reid apart and warned, "Assign anyway" creates an ACTIVE List with one acknowledgement', () => {
    const onAssigned = vi.fn()
    render(
      <SurfaceProvider variant="web">
        <AssignListSheet open slotId={SHARMA_PM_SLOT} actor={OFFICE} onClose={vi.fn()} onAssigned={onAssigned} />
      </SurfaceProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Assign List' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose the hospital.')
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: 'H-STG' } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign List' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose the surgeon.')
    const groups = Array.from(surgeonSelect().querySelectorAll('optgroup')).map((g) => g.label)
    expect(groups).toEqual(['Surgeons', 'Not preferred with Dr Sharma'])
    fireEvent.change(surgeonSelect(), { target: { value: SURG.reid } })
    fireEvent.click(screen.getByRole('button', { name: 'Assign anyway' }))
    expect(onAssigned).toHaveBeenCalled()
    const list = Object.values(useAppStore.getState().schedule.lists).find((l) => l.slotId === SHARMA_PM_SLOT)
    expect(list?.state).toBe('ACTIVE')
    expect(list?.kind).toBe('private')
    expect(list?.id.startsWith('LG')).toBe(true)
    expect(useAppStore.getState().audit.filter((a) => a.action === 'list.pairingAcknowledged')).toHaveLength(1)
  })

  it('Recurring booking sheet: the usual surgeon regroups for the chosen anaesthetist and "Apply anyway" saves', () => {
    render(
      <SurfaceProvider variant="web">
        <MemoryRouter>
          <RecurringBookingSheet open actor={OFFICE} onClose={vi.fn()} />
        </MemoryRouter>
      </SurfaceProvider>,
    )
    const select = surgeonSelect()
    expect(select.querySelectorAll('optgroup')).toHaveLength(0)
    fireEvent.change(screen.getAllByRole('combobox')[0]!, { target: { value: ANAE.sharma } })
    expect(Array.from(surgeonSelect().querySelectorAll('optgroup')).map((g) => g.label)).toEqual(['Surgeons', 'Not preferred with Dr Sharma'])
    fireEvent.change(surgeonSelect(), { target: { value: SURG.reid } })
    expect(screen.getByText('Ms A. Reid prefers not to work with Dr Priya Sharma.')).toBeInTheDocument()
    // A recurring booking needs its hospital too (US-01.3.1, catch-up Phase 31).
    const hospitalSelect = screen.getAllByRole('combobox').find((el) => el.querySelector('option[value="H-FORTE"]') !== null)!
    fireEvent.change(hospitalSelect, { target: { value: 'H-FORTE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply anyway' }))
    expect(useAppStore.getState().audit.filter((a) => a.action === 'recurringBooking.pairingAcknowledged')).toHaveLength(1)
  })
})
