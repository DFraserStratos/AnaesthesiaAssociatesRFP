/**
 * Build plan Phase 68's join (DM-15): the data-quality flag on the patient's page. An ethnicity code
 * held for review shows in Needs the office with Apply code; a valid code stores and clears the flag.
 */

import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dataQualityItems, freshAppState, OFFICE_ACTOR, useAppStore } from '../../../../store'
import { SurfaceProvider } from '../../../../shared/surface'
import { PatientRecord } from './PatientRecord'

const NHI = 'CQY9304' // Sarah Mitchell

function holdCode(receivedCode: string) {
  const state = useAppStore.getState()
  const patient = Object.values(state.masters.patients).find((p) => p.nhi === NHI)!
  const { ethnicityCode: _stored, ...rest } = patient
  useAppStore.setState({
    masters: {
      ...state.masters,
      patients: { ...state.masters.patients, [patient.hiddenInternalId]: { ...rest, ethnicityPending: { receivedCode, reason: 'An NZHIS Level 4 ethnicity code is 5 digits.' } } },
    },
  })
  return patient.hiddenInternalId
}

function renderRecord() {
  return render(
    <MemoryRouter initialEntries={[`/admin/people/patients/${NHI}`]}>
      <SurfaceProvider variant="web">
        <PatientRecord nhi={NHI} actor={OFFICE_ACTOR} />
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => useAppStore.setState(freshAppState()))
afterEach(() => cleanup())

describe("the patient's data-quality flag", () => {
  it('shows nothing when the ethnicity code is fine', () => {
    const { container } = renderRecord()
    expect(container.querySelector('[data-shot="patient-data-quality"]')).toBeNull()
  })

  it('shows a held code in Needs the office, refuses a bad one, and Apply code with a valid one clears it', () => {
    const patientId = holdCode('7777')
    expect(dataQualityItems(useAppStore.getState()).some((i) => i.patientId === patientId)).toBe(true)
    const { container } = renderRecord()
    const card = container.querySelector('[data-shot="patient-needs-office"]') as HTMLElement
    expect(card.getAttribute('data-reasons')).toContain('dataQuality')
    const flag = card.querySelector('[data-shot="patient-data-quality"]') as HTMLElement
    expect(flag.textContent).toContain('Ethnicity code not recognised')
    expect(flag.textContent).toContain('7777')

    const field = within(flag).getByLabelText('Valid NZHIS ethnicity code')
    const apply = flag.querySelector('[data-shot="patient-data-quality-apply"]') as HTMLButtonElement
    fireEvent.change(field, { target: { value: '123' } })
    fireEvent.click(apply)
    expect(flag.textContent).toContain('5 digits')
    expect(useAppStore.getState().masters.patients[patientId]!.ethnicityPending).toBeDefined()

    fireEvent.change(field, { target: { value: '11111' } })
    fireEvent.click(apply)
    const after = useAppStore.getState().masters.patients[patientId]!
    expect(after.ethnicityCode).toBe('11111')
    expect(after.ethnicityPending).toBeUndefined()
    expect(dataQualityItems(useAppStore.getState()).some((i) => i.patientId === patientId)).toBe(false)
    expect(container.querySelector('[data-shot="patient-data-quality"]')).toBeNull()
  })
})
