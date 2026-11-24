/**
 * Catch-up Phase 40, session 2 (items 12 and 16): Admin · Patients. The
 * waiting row and the Add NHI sheet, Sarah Mitchell's and Heather Sinclair's
 * records, a second Resend, the threshold field and the record's edit form.
 */

import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { advanceClockDays, freshAppState, importHospitalDownload, OFFICE_ACTOR, patientBalanceThresholdDays, patientRecordView, THRESHOLD_RANGE_MESSAGE, useAppStore, waitingNhiRows } from '../../../../store'
import { NO_NHI_LIST, NO_NHI_RETURNING_NHI } from '../../../../domain/intake/hospitalDownloads'
import { SurfaceProvider } from '../../../../shared/surface'
import { PatientsScreen } from './PatientsScreen'
import { PatientRecord } from './PatientRecord'
import { balanceText } from './patientParts'
import { PatientBalanceThresholdView } from '../masters/PatientBalanceThresholdView'

const noop = () => undefined

function inAdmin(node: ReactNode, path = '/admin/patients') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

function receiveMissingNhiList() {
  const res = importHospitalDownload(useAppStore, OFFICE_ACTOR, NO_NHI_LIST.id)
  if (!res.ok) throw new Error(res.message)
}

function waitingRow(container: HTMLElement, name: string): HTMLElement {
  const rows = [...container.querySelectorAll<HTMLElement>('[data-shot="waiting-nhi-row"]')]
  const row = rows.find((r) => r.textContent?.includes(name))
  if (row === undefined) throw new Error(`no waiting row for ${name}`)
  return row
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe('Waiting for NHI', () => {
  it('a row shows the address to chase, the Urgent pill on a close row, and Add NHI', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<PatientsScreen view="waiting" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
    const rows = waitingNhiRows(useAppStore.getState())
    const aroha = rows.find((r) => r.patientName === 'Aroha Ngata')!
    const row = waitingRow(container, 'Aroha Ngata')
    expect(row.getAttribute('data-urgent')).toBe('true')
    expect(within(row).getByText('Urgent')).toBeInTheDocument()
    expect(aroha.chase.to).not.toBe('')
    expect(row.querySelector('[data-shot="waiting-nhi-chase"]')?.textContent).toContain(aroha.chase.to)
    expect(within(row).getByRole('button', { name: 'Add NHI' })).toBeInTheDocument()
    // Email for the NHI is a real mailto link.
    expect(row.querySelector('a[data-shot="waiting-nhi-email"]')?.getAttribute('href')).toMatch(/^mailto:/)
    const tuilagi = waitingRow(container, 'Losa Tuilagi')
    expect(tuilagi.getAttribute('data-urgent')).toBe('false')
    expect(within(tuilagi).queryByText('Urgent')).toBeNull()
  })

  it('Email for the NHI audits the request and the row reads Requested', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<PatientsScreen view="waiting" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
    const row = waitingRow(container, 'Losa Tuilagi')
    expect(row.textContent).toContain('Not yet')
    fireEvent.click(row.querySelector('a[data-shot="waiting-nhi-email"]')!)
    expect(useAppStore.getState().audit.at(-1)?.action).toBe('importRow.nhiRequested')
    expect(waitingRow(container, 'Losa Tuilagi').textContent).not.toContain('Not yet')
  })

  it('the Add NHI sheet shows the existing record and adds the NHI through addNhiToWaitingRow', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<PatientsScreen view="waiting" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
    const before = Object.keys(useAppStore.getState().masters.patients).length
    fireEvent.click(within(waitingRow(container, 'Losa Tuilagi')).getByRole('button', { name: 'Add NHI' }))
    const sheet = document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
    expect(sheet).not.toBeNull()
    const save = within(sheet).getByRole('button', { name: 'Add NHI' })
    expect(save).toBeDisabled()
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="add-nhi-preview"]')?.textContent).toMatch(/^Matches Losa Tuilagi, born 1 JUN 1992, \d+ earlier Bookings?\. The row uses this record; no second one is made\.$/)
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add NHI' }))
    expect(waitingNhiRows(useAppStore.getState()).some((r) => r.patientName === 'Losa Tuilagi')).toBe(false)
    expect(Object.keys(useAppStore.getState().masters.patients).length).toBe(before)
    expect(document.querySelector('[data-shot="add-nhi-done"]')?.textContent).toContain('Added. The Booking is on')
  })

  it('an invalid NHI shows its reason and keeps Add NHI disabled', () => {
    receiveMissingNhiList()
    const { container } = inAdmin(<PatientsScreen view="waiting" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
    fireEvent.click(within(waitingRow(container, 'Aroha Ngata')).getByRole('button', { name: 'Add NHI' }))
    const sheet = document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAE0311' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeDisabled()
  })
})

describe('the patient record', () => {
  it("Sarah Mitchell: Paid (Sharma) and Unpaid (Souter), billed to her $610.00 strong, and the Balance counts every payer", () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
    const { container } = inAdmin(<PatientRecord nhi={sinclair.nhi} actor={OFFICE_ACTOR} />, `/admin/patients/${sinclair.nhi}`)
    const tiles = container.querySelector('[data-shot="patient-balance"]') as HTMLElement
    expect(tiles.querySelector('[data-tile="balance"]')?.textContent).toContain('In credit $260.00')
    expect(tiles.querySelector('[data-strength="mild"]')?.textContent).toBe('Mild')
    expect(container.querySelector('[data-shot="patient-invoices"] [data-invoice-status="credited"]')?.textContent).toBe('Credited')
  })

  it('a second Resend appends to the send history and logs both resends', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
    const search = inAdmin(<PatientsScreen view="search" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'mitchell' } })
    expect(search.container.querySelector('[data-patient-nhi="CQY9304"]')?.textContent).toContain('Not supplied')
  })

  it('the Invoices table says Billed to, and offers Resend only on a sent invoice that is not credited', () => {
    const sinclair = Object.values(useAppStore.getState().masters.patients).find((p) => p.name === 'Heather Sinclair')!
    const { container } = inAdmin(<PatientRecord nhi={sinclair.nhi} actor={OFFICE_ACTOR} />, `/admin/patients/${sinclair.nhi}`)
    const table = container.querySelector('[data-shot="patient-invoices"]') as HTMLElement
    expect(within(table).getByRole('columnheader', { name: 'Billed to' })).toBeInTheDocument()
    expect(table.textContent).not.toContain('Billable party')
    const credited = patientRecordView(useAppStore.getState(), sinclair.nhi)!.invoices.find((i) => i.status === 'credited')!
    expect(screen.queryByRole('button', { name: `Resend ${credited.invoiceNumber}` })).toBeNull()
  })

  it('a reminder saved after the demo clock moves on takes the new today', () => {
    const { container } = inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} />, '/admin/patients/CQY9304')
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
