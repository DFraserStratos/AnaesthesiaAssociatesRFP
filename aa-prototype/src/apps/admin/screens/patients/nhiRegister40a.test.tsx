/**
 * Catch-up Phase 40a on Admin · Patients: the waiting row's Add NHI checks
 * the NHI as typed and reads the register (a mild line when its name or DOB
 * differs from the row's, never a block), and the patient record's refresh
 * shows an enrichment as "Will be added" (Kevin Doherty's missing address).
 */

import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, importHospitalDownload, OFFICE_ACTOR, useAppStore } from '../../../../store'
import { NO_NHI_LIST, NO_NHI_RETURNING_NHI } from '../../../../domain/intake/hospitalDownloads'
import { SurfaceProvider } from '../../../../shared/surface'
import { HUB_TIMING } from '../../../../shared/nhiHub'
import { PatientsScreen } from './PatientsScreen'
import { PatientRecord } from './PatientRecord'
import { REGISTER_DIFFERS_LINE } from './AddNhiSheet'

const noop = () => undefined

function inAdmin(node: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/admin/patients']}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
}

function openAddNhi(name: string): HTMLElement {
  const res = importHospitalDownload(useAppStore, OFFICE_ACTOR, NO_NHI_LIST.id)
  if (!res.ok) throw new Error(res.message)
  const { container } = inAdmin(<PatientsScreen view="waiting" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />)
  const row = [...container.querySelectorAll<HTMLElement>('[data-shot="waiting-nhi-row"]')].find((r) => r.textContent?.includes(name))!
  fireEvent.click(within(row).getByRole('button', { name: 'Add NHI' }))
  return document.querySelector('[data-shot="add-nhi-sheet"]') as HTMLElement
}

const answer = () =>
  act(() => {
    vi.advanceTimersByTime(HUB_TIMING.answerMs)
  })

beforeEach(() => {
  useAppStore.setState(freshAppState())
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Add NHI on a waiting row (catch-up Phase 40a)', () => {
  it('ZAA0068 shows the check-digit reason as typed; ZAA0067 clears it', () => {
    const sheet = openAddNhi('Aroha Ngata')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0068' } })
    expect(sheet.textContent).toContain('The check digit does not match.')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: 'ZAA0067' } })
    expect(sheet.textContent).not.toContain('The check digit does not match.')
    expect(sheet.textContent).toContain('Valid NHI')
  })

  it("a valid NHI is looked up on the register with the AA office's purpose note; the row's own patient shows no caution", () => {
    const sheet = openAddNhi('Losa Tuilagi')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('Checking the NHI register')
    answer()
    expect(sheet.querySelector('[data-shot="nhi-lookup-status"]')?.textContent).toBe('On the NHI register: Losa Tuilagi, 27 JAN 1992.')
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')).toBeNull()
    expect(sheet.querySelector('[data-shot="nhi-purpose"]')?.textContent).toContain('Looked up on behalf of the AA office,')
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })

  it("the register's different name is a mild caution, never a block", () => {
    const sheet = openAddNhi('Aroha Ngata')
    fireEvent.change(within(sheet).getByLabelText('NHI'), { target: { value: NO_NHI_RETURNING_NHI } })
    answer()
    expect(sheet.querySelector('[data-shot="add-nhi-register-differs"]')?.textContent).toBe(REGISTER_DIFFERS_LINE)
    expect(within(sheet).getByRole('button', { name: 'Add NHI' })).toBeEnabled()
  })
})

describe('Refresh from the NHI register on the record (catch-up Phase 40a)', () => {
  it("Kevin Doherty's missing address reads Will be added, and Apply fills it with the stamp", () => {
    inAdmin(<PatientRecord nhi="ZAQ4425" actor={OFFICE_ACTOR} onOpenBooking={noop} />)
    expect(document.querySelector('[data-shot="patient-register-stamp"]')?.textContent).toBe('Not refreshed yet')
    fireEvent.click(document.querySelector('[data-shot="patient-register-refresh-button"]') as HTMLElement)
    answer()
    const table = document.querySelector('[data-shot="patient-register-differences"]') as HTMLElement
    const address = table.querySelector('[data-field="address"]') as HTMLElement
    expect(address.textContent).toContain('41 Harewood Road')
    expect(address.textContent).toContain('Will be added')
    fireEvent.click(document.querySelector('[data-shot="patient-register-apply"]') as HTMLElement)
    expect(document.querySelector('[data-shot="patient-register-stamp"]')?.textContent).toBe('Last refreshed 21 Jul 2026, 08:00')
    expect(useAppStore.getState().masters.patients['PT0153']?.postalAddress).toMatchObject({ line1: '41 Harewood Road' })
  })

  it('Sarah Mitchell: nothing to change, Mark refreshed', () => {
    inAdmin(<PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} onOpenBooking={noop} />)
    fireEvent.click(document.querySelector('[data-shot="patient-register-refresh-button"]') as HTMLElement)
    answer()
    expect(document.querySelector('[data-shot="patient-register-nothing"]')?.textContent).toBe('On the register and on this record, nothing to change.')
    expect(document.querySelector('[data-shot="patient-register-apply"]')?.textContent).toBe('Mark refreshed')
  })
})
