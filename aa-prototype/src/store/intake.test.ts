/**
 * Patient intake (the ONE upsert path) + the master-data creation invariants.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { editPatient, upsertPatient } from './intake'
import { createHospital } from './mastersActions'
import { bookingsForList } from './selectors'
import type { Actor } from './mutate'
import { ANAE, PAT, SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = {
  who: 'Dr Melanie Souter',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.souter,
}
const MORRISON: Actor = {
  who: 'Dr Kate Morrison',
  role: 'anaesthetist',
  source: 'anaesthetist',
  anaesthetistId: ANAE.morrison,
}

describe('upsertPatient', () => {
  it('reuses the existing patient for a known current-format NHI and enriches missing fields', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().masters.patients).length
    const outcome = upsertPatient(api, OFFICE, {
      nhi: 'cqy9304',
      name: 'Sarah Mitchell',
      dobISO: '1988-04-12',
      address: '4 Beach Road, Sumner, Christchurch',
    })
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.value.outcome).toBe('reused')
      expect(outcome.value.patient.hiddenInternalId).toBe(PAT.mitchell)
      expect(outcome.value.patient.address).toBe('4 Beach Road, Sumner, Christchurch')
    }
    expect(Object.keys(api.getState().masters.patients).length).toBe(before)
    expect(api.getState().audit.at(-1)?.action).toBe('patient.reuse')
  })

  it('reuses by new-format NHI too (both formats, one patient row)', () => {
    const api = createAppStore()
    const outcome = upsertPatient(api, OFFICE, { nhi: 'MYY54SL', name: 'Priya Nair', dobISO: '1969-11-08' })
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.value.outcome).toBe('reused')
      expect(outcome.value.patient.hiddenInternalId).toBe(PAT.nair)
    }
  })

  it('creates a provisional record when no NHI is supplied', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().masters.patients).length
    const outcome = upsertPatient(api, OFFICE, { name: 'Tom Aldridge', dobISO: '1971-02-02' })
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.value.outcome).toBe('createdProvisional')
      expect(outcome.value.patient.nhi).toBeUndefined()
      expect(outcome.value.patient.hiddenInternalId.startsWith('PT')).toBe(true)
    }
    expect(Object.keys(api.getState().masters.patients).length).toBe(before + 1)
    expect(api.getState().audit.at(-1)?.action).toBe('patient.create')
  })

  it('creates a new full record for an unseen valid NHI', () => {
    const api = createAppStore()
    const outcome = upsertPatient(api, OFFICE, { nhi: 'ACA31FM', name: 'Riki Tamati', dobISO: '1990-03-03' })
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.value.outcome).toBe('created')
      expect(outcome.value.patient.nhi).toBe('ACA31FM')
    }
  })

  it('refuses an invalid NHI outright', () => {
    const api = createAppStore()
    const outcome = upsertPatient(api, OFFICE, { nhi: 'ZAE0311', name: 'X', dobISO: '1980-01-01' })
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.code).toBe('invalidNhi')
  })

  it('stores only validated ethnicity codes; others are quarantined pending correction', () => {
    const api = createAppStore()
    const good = upsertPatient(api, OFFICE, {
      name: 'A Good Code',
      dobISO: '1980-01-01',
      ethnicityCode: '21111',
    })
    expect(good.ok).toBe(true)
    if (good.ok) expect(good.value.patient.ethnicityCode).toBe('21111')

    const bad = upsertPatient(api, OFFICE, {
      name: 'A Bad Code',
      dobISO: '1980-01-01',
      ethnicityCode: '99',
    })
    expect(bad.ok).toBe(true)
    if (bad.ok) {
      expect(bad.value.patient.ethnicityCode).toBeUndefined()
      expect(bad.value.patient.ethnicityPending?.receivedCode).toBe('99')
    }
  })

  it('clears a stale quarantine flag when a valid code is later supplied', () => {
    const api = createAppStore()
    // First intake: unseen NHI, malformed ethnicity -> quarantined, no code.
    const first = upsertPatient(api, OFFICE, {
      nhi: 'ACA31FM',
      name: 'Riki Tamati',
      dobISO: '1990-03-03',
      ethnicityCode: '99',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.patient.ethnicityCode).toBeUndefined()
    expect(first.value.patient.ethnicityPending?.receivedCode).toBe('99')

    // Re-intake the same NHI with a valid code: reused, code set, flag gone.
    const second = upsertPatient(api, OFFICE, {
      nhi: 'ACA31FM',
      name: 'Riki Tamati',
      dobISO: '1990-03-03',
      ethnicityCode: '21111',
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.outcome).toBe('reused')
    expect(second.value.patient.ethnicityCode).toBe('21111')
    expect(second.value.patient.ethnicityPending).toBeUndefined()
  })
})

describe('editPatient', () => {
  const ELLISON_BOOKING = SEED_MARKERS.pendingCaptureBooking!.entityId
  const MORRISON_LIST = SEED_MARKERS.submittedListMorrison!.entityId

  it('edits demographics and writes a patient.update audit entry', () => {
    const api = createAppStore()
    const outcome = editPatient(api, SOUTER, PAT.ellison, { phone: '021 555 9999' }, ELLISON_BOOKING)
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.masters.patients[PAT.ellison]?.phone).toBe('021 555 9999')
    expect(state.audit.at(-1)?.action).toBe('patient.update')
  })

  it('allows the anaesthetist via a booking on their own SUBMITTED list, refuses once AUTHORISED (catch-up Phase 38a)', () => {
    const api = createAppStore()
    const morrisonBooking = bookingsForList(api.getState(), MORRISON_LIST)[0]
    expect(morrisonBooking).toBeDefined()
    const outcome = editPatient(api, MORRISON, morrisonBooking!.patientId, { phone: '021 000 0000' }, morrisonBooking!.id)
    expect(outcome.ok).toBe(true)
    api.setState((s) => ({
      schedule: { ...s.schedule, lists: { ...s.schedule.lists, [MORRISON_LIST]: { ...assigned(s.schedule.lists[MORRISON_LIST]), state: 'AUTHORISED' as const } } },
    }))
    const locked = editPatient(api, MORRISON, morrisonBooking!.patientId, { phone: '021 000 0001' }, morrisonBooking!.id)
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.code).toBe('listAuthorised')
  })
})

describe('master-data invariants', () => {
  it('creating a hospital also creates its hospital Party (catch-up Phase 18)', () => {
    const api = createAppStore()
    const outcome = createHospital(api, OFFICE, 'Rangiora Day Surgery')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { hospital, party } = outcome.value
    const state = api.getState()
    expect(state.masters.hospitals[hospital.id]?.name).toBe('Rangiora Day Surgery')
    expect(state.masters.parties[party.id]).toMatchObject({ kind: 'hospital', hospitalId: hospital.id, name: 'Rangiora Day Surgery', codePrefix: 'RDS' })
    expect(state.audit.slice(-2).map((a) => a.action)).toEqual(['hospital.create', 'party.create'])
    // RV-06: no Contract is created with a hospital.
    expect(Object.values(state.masters.contracts).some((c) => c.holderId === party.id)).toBe(false)
  })

  it('is office-only', () => {
    const api = createAppStore()
    const anaesthetist: Actor = {
      who: 'Dr Melanie Souter',
      role: 'anaesthetist',
      source: 'anaesthetist',
      anaesthetistId: '34821',
    }
    expect(createHospital(api, anaesthetist, 'Nope').ok).toBe(false)
  })
})
