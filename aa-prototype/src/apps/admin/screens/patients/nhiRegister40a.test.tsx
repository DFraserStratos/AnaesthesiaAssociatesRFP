/**
 * Catch-up Phase 40a on Admin · Patients: the patient record's refresh
 * shows an enrichment as "Will be added" (Kevin Doherty's missing address).
 */

import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { freshAppState, OFFICE_ACTOR, useAppStore } from '../../../../store'
import { SurfaceProvider } from '../../../../shared/surface'
import { HUB_TIMING } from '../../../../shared/nhiHub'
import { PatientRecord } from './PatientRecord'

const noop = () => undefined

function inAdmin(node: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/admin/people/patients']}>
      <SurfaceProvider variant="web">{node}</SurfaceProvider>
    </MemoryRouter>,
  )
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
    expect(document.querySelector('[data-shot="patient-register-stamp"]')?.textContent).toBe('Last refreshed 24 Nov 2026, 08:00')
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
