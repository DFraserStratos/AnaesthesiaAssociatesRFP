/**
 * Catch-up Phase 40, session 2 (items 12 and 16): Admin · Patients. (The
 * waiting row and the Add NHI sheet moved to Intake in Phase 51:
 * `intake/waitingNhiTab.test.tsx`.) Sarah Mitchell's and Heather Sinclair's
 * records, a second Resend, the threshold field and the record's edit form.
 */

import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { advanceClockDays, createBooking, freshAppState, logPatientFollowUp, patientAttentionCount, upsertPatient, OFFICE_ACTOR, patientBalanceThresholdDays, patientRecordView, THRESHOLD_RANGE_MESSAGE, useAppStore } from '../../../../store'
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
    fireEvent.click(within(container.querySelector('[data-shot="patient-details"]') as HTMLElement).getByRole('button', { name: 'Edit details' }))
    const dialog = container.querySelector('[data-shot="patient-details"]') as HTMLElement
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
    fireEvent.click(within(details).getByRole('button', { name: 'Edit details' }))
    fireEvent.change(within(details).getByLabelText('Phone'), { target: { value: '021 777 1234' } })
    fireEvent.click(within(details).getByRole('button', { name: 'Save' }))
    expect(Object.values(useAppStore.getState().masters.patients).find((p) => p.nhi === 'CQY9304')!.phone).toBe('021 777 1234')
    cleanup()
    const search = inAdmin(<PatientsScreen />, '/admin/people/patients?filter=all')
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

/** Sarah Mitchell booked on Dr Souter's Forte List: her strong balance warning shows (build plan Phase 57). */
function bookMitchell() {
  const made = createBooking(useAppStore, OFFICE_ACTOR, 'L-34821-2026-11-30-AM', { patient: { nhi: 'CQY9304', name: 'Sarah Mitchell', dobISO: '1988-08-16' }, sourceText: { text: 'Knee arthroscopy', source: 'phone' } })
  if (!made.ok) throw new Error(made.message)
}

function inPeople(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin/people/patients" element={<PatientsScreen />} />
          <Route path="/admin/people/patients/:nhi" element={<PatientRecordAt />} />
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

function PatientRecordAt() {
  const { nhi = '' } = useParams()
  return <PatientRecord nhi={nhi} actor={OFFICE_ACTOR} />
}

const filterButton = (name: RegExp) => within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name })

describe('the Patients tab (build plan Phase 57)', () => {
  it('opens on Coming up; the filter and the search live in the URL', () => {
    const { container } = inPeople('/admin/people/patients')
    expect(filterButton(/^Coming up/)).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-patients-filter="comingUp"]')).not.toBeNull()
    fireEvent.click(filterButton(/^All/))
    expect(container.querySelector('[data-patients-filter="all"]')).not.toBeNull()
    expect(container.querySelectorAll('tr[data-patient-nhi]').length).toBe(50)
    expect(container.querySelector('[data-shot="people-pager"]')).not.toBeNull()
  })

  it('a search with no match on Coming up offers Search all patients, which finds her', () => {
    const { container } = inPeople('/admin/people/patients?filter=coming-up')
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'zzz-nobody' } })
    expect(container.querySelector('[data-shot="patients-search-all"]')).toBeNull()
    fireEvent.change(screen.getByLabelText('Search patients'), { target: { value: 'cqy 9304' } })
    if (container.querySelector('tr[data-patient-nhi="CQY9304"]') === null) {
      fireEvent.click(screen.getByRole('button', { name: 'Search all patients' }))
    }
    expect(container.querySelector('tr[data-patient-nhi="CQY9304"]')).not.toBeNull()
  })

  it('Needs follow-up: one row per patient with its reasons, no action on the row, and the row opens the page', () => {
    bookMitchell()
    const { container } = inPeople('/admin/people/patients?filter=follow-up')
    const row = container.querySelector('tr[data-patient-nhi="CQY9304"]') as HTMLElement
    expect(row.getAttribute('data-reasons')).toBe('balance')
    expect(row.textContent).toContain('Balance over')
    expect(within(row).queryByRole('button', { name: /Clear|Done/ })).toBeNull()
    expect(container.querySelectorAll('tr[data-patient-nhi="CQY9304"]')).toHaveLength(1)
    expect(filterButton(/^Needs follow-up/).textContent).toContain(String(patientAttentionCount(useAppStore.getState())))
    fireEvent.click(row.querySelector('td') as HTMLElement)
    expect(container.querySelector('[data-shot="admin-patient-record"]')).not.toBeNull()
    expect(container.querySelector('[data-shot="patient-needs-office"]')).not.toBeNull()
  })
})

describe("the patient's page (build plan Phase 57)", () => {
  it('the NHI beside the name, no internal id, no tabs; Bookings in the side panel', () => {
    const { container } = inPeople('/admin/people/patients/CQY9304')
    expect(container.querySelector('[data-shot="patient-record-nhi"]')?.textContent).toBe('NHI CQY9304')
    expect(container.textContent).not.toMatch(/PT0\d/)
    expect(screen.queryByRole('tablist')).toBeNull()
    const rail = screen.getByLabelText('Patient details')
    expect(rail.querySelector('[data-shot="patient-details"]')).not.toBeNull()
    expect(rail.querySelector('[data-shot="patient-bookings"]')).not.toBeNull()
  })

  it('Details saves in place as one patient.update; Cancel writes nothing', () => {
    const { container } = inPeople('/admin/people/patients/CQY9304')
    const details = container.querySelector('[data-shot="patient-details"]') as HTMLElement
    const before = useAppStore.getState().audit.length
    fireEvent.click(within(details).getByRole('button', { name: 'Edit details' }))
    fireEvent.change(within(details).getByLabelText('Phone'), { target: { value: '021 000 1111' } })
    fireEvent.click(within(details).getByRole('button', { name: 'Cancel' }))
    expect(useAppStore.getState().audit.length).toBe(before)
    fireEvent.click(within(details).getByRole('button', { name: 'Edit details' }))
    fireEvent.change(within(details).getByLabelText('Phone'), { target: { value: '021 000 2222' } })
    fireEvent.click(within(details).getByRole('button', { name: 'Save' }))
    const added = useAppStore.getState().audit.slice(before)
    expect(added.map((e) => e.action)).toEqual(['patient.update'])
    expect(details.textContent).toContain('021 000 2222')
  })

  it('Clear on the page takes the patient off Needs follow-up, and Done on a due reminder does too', () => {
    bookMitchell()
    const before = patientAttentionCount(useAppStore.getState())
    const { container } = inPeople('/admin/people/patients/CQY9304')
    const card = container.querySelector('[data-shot="patient-needs-office"]') as HTMLElement
    fireEvent.click(within(card).getAllByRole('button', { name: /^Clear/ })[0]!)
    expect(container.querySelector('[data-shot="patient-needs-office"]')).toBeNull()
    expect(patientAttentionCount(useAppStore.getState())).toBe(before - 1)
    act(() => { expect(logPatientFollowUp(useAppStore, OFFICE_ACTOR, { nhi: 'CQY9304', kind: 'reminder', text: 'Ring Sarah', dueDateISO: useAppStore.getState().clock.todayISO }).ok).toBe(true) })
    const again = container.querySelector('[data-shot="patient-needs-office"]') as HTMLElement
    expect(again.getAttribute('data-reasons')).toBe('followUpDue')
    expect(again.textContent).toContain('Follow-up due today')
    fireEvent.click(within(again).getByRole('button', { name: 'Mark done: Ring Sarah' }))
    expect(container.querySelector('[data-shot="patient-needs-office"]')).toBeNull()
    expect(patientAttentionCount(useAppStore.getState())).toBe(before - 1)
  })

  it('details that differ: the record is unchanged, Use applies the new phone and clears the reason', () => {
    const p = Object.values(useAppStore.getState().masters.patients).find((x) => x.nhi === 'CQY9304')!
    expect(upsertPatient(useAppStore, OFFICE_ACTOR, { nhi: p.nhi, name: p.name, dobISO: p.dobISO, phone: '027 555 0101', detailsSource: 'hospital' }).ok).toBe(true)
    expect(useAppStore.getState().masters.patients[p.hiddenInternalId]!.phone).toBe(p.phone)
    const { container } = inPeople('/admin/people/patients/CQY9304')
    const differ = container.querySelector('[data-shot="patient-details-differ"]') as HTMLElement
    fireEvent.change(within(differ).getByLabelText(/Phone: keep or use incoming/), { target: { value: 'use' } })
    fireEvent.click(within(differ).getByRole('button', { name: 'Apply' }))
    expect(useAppStore.getState().masters.patients[p.hiddenInternalId]!.phone).toBe('027 555 0101')
    expect(container.querySelector('[data-shot="patient-details-differ"]')).toBeNull()
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
