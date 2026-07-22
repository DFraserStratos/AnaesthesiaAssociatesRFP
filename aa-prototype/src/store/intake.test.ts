/**
 * Patient intake (the ONE upsert path) + the master-data creation invariants.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { upsertPatient } from './intake'
import { createHospital, setInsurerDirectClaims } from './mastersActions'
import type { Actor } from './mutate'
import { INS, PAT } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

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
    if (good.ok) expect(good.value.patient.ethnicityCode).toBe('21111')

    const bad = upsertPatient(api, OFFICE, {
      name: 'A Bad Code',
      dobISO: '1980-01-01',
      ethnicityCode: '99',
    })
    if (bad.ok) {
      expect(bad.value.patient.ethnicityCode).toBeUndefined()
      expect(bad.value.patient.ethnicityPending?.receivedCode).toBe('99')
    }
  })
})

describe('master-data invariants', () => {
  it('creating a hospital atomically creates its protected default Type 1 contract', () => {
    const api = createAppStore()
    const outcome = createHospital(api, OFFICE, 'Rangiora Day Surgery')
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { hospital, defaultContract } = outcome.value
    const state = api.getState()
    expect(state.masters.hospitals[hospital.id]?.name).toBe('Rangiora Day Surgery')
    const contract = state.masters.contracts[defaultContract.id]
    expect(contract?.isDefault).toBe(true)
    expect(contract?.type).toBe(1)
    expect(contract?.holderType).toBe('hospital')
    expect(contract?.holderId).toBe(hospital.id)
    const actions = state.audit.slice(-2).map((a) => a.action)
    expect(actions).toEqual(['hospital.create', 'contract.create'])
  })

  it('flipping an insurer to direct claims atomically creates its default Type 1', () => {
    const api = createAppStore()
    const before = Object.values(api.getState().masters.contracts).filter(
      (c) => c.holderType === 'insurer' && c.holderId === INS.aia,
    )
    expect(before.length).toBe(0)

    const outcome = setInsurerDirectClaims(api, OFFICE, INS.aia, true)
    expect(outcome.ok).toBe(true)
    const state = api.getState()
    expect(state.masters.insurers[INS.aia]?.acceptsDirectClaims).toBe(true)
    const created = Object.values(state.masters.contracts).filter(
      (c) => c.holderType === 'insurer' && c.holderId === INS.aia && c.isDefault,
    )
    expect(created.length).toBe(1)

    // Flipping back never deletes the default (Phase 07 owns protection).
    expect(setInsurerDirectClaims(api, OFFICE, INS.aia, false).ok).toBe(true)
    expect(
      Object.values(api.getState().masters.contracts).filter(
        (c) => c.holderType === 'insurer' && c.holderId === INS.aia,
      ).length,
    ).toBe(1)
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
    expect(setInsurerDirectClaims(api, anaesthetist, INS.aia, true).ok).toBe(false)
  })
})
