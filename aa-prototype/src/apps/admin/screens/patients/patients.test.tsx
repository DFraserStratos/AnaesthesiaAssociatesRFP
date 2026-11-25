/**
 * Catch-up Phase 40, session 2 (items 12 and 16): Admin · Patients. (The
 * waiting row and the Add NHI sheet moved to Intake in Phase 51:
 * `intake/waitingNhiTab.test.tsx`.) Sarah Mitchell's and Heather Sinclair's
 * records, a second Resend, the threshold field and the record's edit form.
 */

import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { advanceClockDays, freshAppState, OFFICE_ACTOR, patientBalanceThresholdDays, patientRecordView, THRESHOLD_RANGE_MESSAGE, useAppStore } from '../../../../store'
import { SurfaceProvider } from '../../../../shared/surface'
import { PatientsScreen } from './PatientsScreen'
import { PatientRecord } from './PatientRecord'
import { balanceText } from './patientParts'
import { PatientBalanceThresholdView } from '../masters/PatientBalanceThresholdView'


function inAdmin(node: ReactNode, path = '/admin/people/patients') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('the patient record', () => {
  it("Sarah Mitchell: Paid (Sharma) and Unpaid (Souter), billed to her $610.00 strong, and the Balance counts every payer", () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    const table = container.querySelector('[data-shot="patient-invoices"]') as HTMLElement
    const rows = [...table.querySelectorAll<HTMLElement>('tbody tr[data-invoice-id]')]
    expect(rows.some((r) => r.textContent?.includes('Sharma') && r.querySelector('[data-invoice-status="paid"]') !== null)).toBe(true)
    expect(rows.some((r) => r.textContent?.includes('Souter') && r.querySelector('[data-invoice-status="unpaid"]') !== null)).toBe(true)
    const tiles = container.querySelector('[data-shot="patient-balance"]') as HTMLElement
    const own = tiles.querySelector('[data-tile="billedToPatient"]') as HTMLElement
    expect(own.textContent).toContain('$610.00')
    expect(own.querySelector('[data-strength="strong"]')?.textContent).toBe('Strong')
    const view = patientRecordView(useAppStore.getState(), 'CQY9304')!
    const balance = tiles.querySelector('[data-tile="balance"]') as HTMLElement
    expect(balance.textContent).toContain(balanceText(view.balance.outstandingTotal))
    // Every payer: more than what she owes herself (St George's unpaid invoice counts too).
    expect(view.balance.outstandingTotal).toBeGreaterThan(view.billedToPatient.owingTotal)
    // The internal id never shows.
    expect(container.textContent).not.toContain('PT0005')
  })

  it('Heather Sinclair: In credit $260.00, the Credited pill and the mild pill', () => {
    const sinclair = Object.values(useAppStore.getState().masters.patients).find((p) => p.name === 'Heather Sinclair')!
    const { container } = inAdmin(<PatientRecord nhi={sinclair.nhi} actor={OFFICE_ACTOR} />, `/admin/people/patients/${sinclair.nhi}`)
    const tiles = container.querySelector('[data-shot="patient-balance"]') as HTMLElement
    expect(tiles.querySelector('[data-tile="balance"]')?.textContent).toContain('In credit $260.00')
    expect(tiles.querySelector('[data-strength="mild"]')?.textContent).toBe('Mild')
    expect(container.querySelector('[data-shot="patient-invoices"] [data-invoice-status="credited"]')?.textContent).toBe('Credited')
  })

  it('a second Resend appends to the send history and logs both resends', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    const view = patientRecordView(useAppStore.getState(), 'CQY9304')!
    const own = view.invoices.find((i) => i.countsTowardBalance && i.status === 'unpaid')!
    const resend = () => fireEvent.click(screen.getByRole('button', { name: `Resend ${own.invoiceNumber}` }))
    resend()
    resend()
    const sends = container.querySelectorAll(`tr[data-shot="patient-invoice-sends"][data-invoice-id="${own.invoiceId}"] li`)
    expect(sends).toHaveLength(own.sends.length + 2)
    const log = container.querySelector('[data-shot="patient-follow-up-log"]') as HTMLElement
    expect(log.querySelectorAll('li[data-kind="resend"]')).toHaveLength(2)
  })

  it('logs a call and sets a reminder for today, which can be ticked done', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    const log = container.querySelector('[data-shot="patient-follow-up-log"]') as HTMLElement
    fireEvent.change(within(log).getByLabelText('What was said'), { target: { value: 'Left a voicemail' } })
    fireEvent.click(within(log).getByRole('button', { name: 'Log call' }))
    fireEvent.click(within(log).getByRole('button', { name: 'Reminder' }))
    fireEvent.change(within(log).getByLabelText('What to do'), { target: { value: 'Call again' } })
    fireEvent.click(within(log).getByRole('button', { name: 'Set reminder' }))
    expect(log.querySelectorAll('li[data-follow-up-id]')).toHaveLength(2)
    fireEvent.click(within(log).getByRole('button', { name: 'Mark done: Call again' }))
    expect(log.textContent).toContain('Done by')
  })

  it('the record form shows no required marker on demographics or ethnicity', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    fireEvent.click(within(container.querySelector('[data-shot="patient-details"]') as HTMLElement).getByRole('button', { name: 'Edit patient details' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Ethnicity code')).toBeInTheDocument()
    for (const input of dialog.querySelectorAll('input, select, textarea')) {
      expect(input.hasAttribute('required')).toBe(false)
      expect(input.getAttribute('aria-required')).not.toBe('true')
    }
    expect(dialog.textContent).not.toMatch(/\*|required/i)
    // The live check names the code.
    fireEvent.change(within(dialog).getByLabelText('Ethnicity code'), { target: { value: '11111' } })
    expect(dialog.textContent).toContain('New Zealand European')
  })
})

describe('the patient record: review fixes', () => {
  it('a record with no date of birth reads Not supplied, renders on search and saves from Edit', () => {
    useAppStore.setState((st) => {
      const id = Object.values(st.masters.patients).find((p) => p.nhi === 'CQY9304')!.hiddenInternalId
      return { masters: { ...st.masters, patients: { ...st.masters.patients, [id]: { ...st.masters.patients[id]!, dobISO: '' } } } }
    })
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    const details = container.querySelector('[data-shot="patient-details"]') as HTMLElement
    expect(details.textContent).toContain('Not supplied')
    fireEvent.click(within(details).getByRole('button', { name: 'Edit patient details' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Phone'), { target: { value: '021 777 1234' } })
    const save = within(dialog).getAllByRole('button').find((b) => /Save|Apply/.test(b.textContent ?? ''))!
    expect(save).not.toBeDisabled()
    fireEvent.click(save)
    expect(Object.values(useAppStore.getState().masters.patients).find((p) => p.nhi === 'CQY9304')!.phone).toBe('021 777 1234')
    cleanup()
    const search = inAdmin(<PatientsScreen actor={OFFICE_ACTOR} />)
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'mitchell' } })
    expect(search.container.querySelector('[data-patient-nhi="CQY9304"]')?.textContent).toContain('Not supplied')
  })

  it('the Invoices table says Billed to, and offers Resend only on a sent invoice that is not credited', () => {
    const sinclair = Object.values(useAppStore.getState().masters.patients).find((p) => p.name === 'Heather Sinclair')!
    const { container } = inAdmin(<PatientRecord nhi={sinclair.nhi} actor={OFFICE_ACTOR} />, `/admin/people/patients/${sinclair.nhi}`)
    const table = container.querySelector('[data-shot="patient-invoices"]') as HTMLElement
    expect(within(table).getByRole('columnheader', { name: 'Billed to' })).toBeInTheDocument()
    expect(table.textContent).not.toContain('Billable party')
    const credited = patientRecordView(useAppStore.getState(), sinclair.nhi)!.invoices.find((i) => i.status === 'credited')!
    expect(screen.queryByRole('button', { name: `Resend ${credited.invoiceNumber}` })).toBeNull()
  })

  it('a reminder saved after the demo clock moves on takes the new today', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/people/patients/CQY9304')
    advanceClockDays(useAppStore, 1)
    const log = container.querySelector('[data-shot="patient-follow-up-log"]') as HTMLElement
    fireEvent.click(within(log).getByRole('button', { name: 'Reminder' }))
    fireEvent.change(within(log).getByLabelText('What to do'), { target: { value: 'Call again' } })
    fireEvent.click(within(log).getByRole('button', { name: 'Set reminder' }))
    expect(log.textContent).not.toContain('Pick today or a later day')
    expect(Object.values(useAppStore.getState().patientCare.followUps).map((f) => f.dueDateISO)).toEqual([useAppStore.getState().clock.todayISO])
  })
})

describe('Master data · Patient balance warning', () => {
  it('the field refuses 0 and 731 and saves 120', () => {
    const { container } = inAdmin(<PatientBalanceThresholdView actor={OFFICE_ACTOR} />, '/admin/masters?view=patientBalance')
    const view = container.querySelector('[data-shot="master-patient-balance-threshold"]') as HTMLElement
    const field = within(view).getByLabelText('Patient balance warning after N days')
    const save = within(view).getByRole('button', { name: 'Save' })
    for (const bad of ['0', '731']) {
      fireEvent.change(field, { target: { value: bad } })
      expect(view.textContent).toContain(THRESHOLD_RANGE_MESSAGE)
      expect(save).toBeDisabled()
    }
    fireEvent.change(field, { target: { value: '120' } })
    expect(save).not.toBeDisabled()
    fireEvent.click(save)
    expect(patientBalanceThresholdDays(useAppStore.getState())).toBe(120)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('settings.patientBalanceThreshold')
  })
})
