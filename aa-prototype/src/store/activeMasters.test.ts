/**
 * Pickers offer active masters only (catch-up Phase 42 item 16; US-13.4.1):
 * the picker selectors leave a retired record out unless it is the current
 * value, a retired AA modifier stays listed and resolving on a Procedure that
 * claimed it, and the step rail stops offering a Contract linked only to
 * retired surgeons while the Procedure holding it keeps it.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { createHospital } from './mastersActions'
import { addAaModifier, claimModifier } from './modifierActions'
import { retireMaster } from './masterLifecycleActions'
import { activeAaModifiers, activeHospitals, activeSurgeons, railMastersOf } from './selectors'
import { isContractCandidate, linkedOnlyToRetiredSurgeons } from '../domain/billing/contractRail'
import { retiredLabel } from '../domain/masterLifecycle'

const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id)
const ELLISON = 'P0009'

describe('picker selectors (catch-up Phase 42)', () => {
  it('a retired hospital is not offered, except as the current value, labelled', () => {
    const api = createAppStore()
    const made = createHospital(api, OFFICE_ACTOR, 'Rangiora Day Surgery')
    const id = made.ok ? made.value.hospital.id : ''
    expect(ids(activeHospitals(api.getState()))).toContain(id)
    expect(retireMaster(api, OFFICE_ACTOR, 'hospital', id, 'Closed for good').ok).toBe(true)
    const state = api.getState()
    expect(ids(activeHospitals(state))).not.toContain(id)
    expect(ids(activeHospitals(state, id))).toContain(id)
    // Every active hospital is still offered, and a display path still resolves the retired one.
    expect(activeHospitals(state).length).toBe(Object.keys(state.masters.hospitals).length - 1)
    const h = state.masters.hospitals[id]!
    expect(retiredLabel(h.name, h)).toBe('Rangiora Day Surgery (retired)')
  })

  it('surgeons filter on retirement the same way', () => {
    const api = createAppStore()
    const s = api.getState()
    const surgeonId = Object.keys(s.masters.surgeons)[0]!
    const retired = {
      masters: {
        surgeons: { ...s.masters.surgeons, [surgeonId]: { ...s.masters.surgeons[surgeonId]!, retiredAtISO: '2026-11-24' } },
      },
    }
    expect(ids(activeSurgeons(retired))).not.toContain(surgeonId)
    expect(ids(activeSurgeons(retired, surgeonId))).toContain(surgeonId)
  })

  it('a retired AA modifier leaves the picker but stays listed, and resolving, on a Procedure that claimed it', () => {
    const api = createAppStore()
    const added = addAaModifier(api, OFFICE_ACTOR, { code: 'WKND', factor: 'Weekend loading', units: 2 })
    const id = added.ok ? added.value.id : ''
    expect(claimModifier(api, SOUTER_ACTOR, ELLISON, { modifierId: id, explanation: 'Saturday list' }).ok).toBe(true)
    expect(retireMaster(api, OFFICE_ACTOR, 'aaModifier', id, 'Not used').ok).toBe(true)

    const state = api.getState()
    const offered = activeAaModifiers(state)
    expect(ids(offered)).not.toContain(id)
    // Every RVG row is still offered.
    expect(offered.filter((m) => m.source === 'rvg').length).toBe(Object.values(state.masters.modifiers).filter((m) => m.source === 'rvg').length)

    const claimed = state.schedule.procedures[ELLISON]!.modifierClaims.map((c) => c.modifierId)
    expect(claimed).toContain(id)
    expect(ids(activeAaModifiers(state, claimed))).toContain(id)
    // The claim still resolves its modifier.
    expect(state.masters.modifiers[id]).toMatchObject({ code: 'WKND', source: 'aa' })
  })
})

describe('the step rail and retired surgeons (catch-up Phase 42)', () => {
  it('a Contract linked only to retired surgeons is not offered; the Procedure holding it keeps it', () => {
    const s = createAppStore().getState()
    const live = railMastersOf(s)
    const ctxFor = (c: { linkedSurgeonIds: readonly string[] }) => ({ listDateISO: '2026-11-27', surgeonId: c.linkedSurgeonIds[0]! })
    // A surgeon-linked Contract the rail offers today.
    const contract = Object.values(s.masters.contracts).find(
      (c) => c.linkedSurgeonIds.length > 0 && c.linkedAnaesthetistId === undefined && isContractCandidate(live, ctxFor(c), c),
    )!
    expect(contract).toBeDefined()
    const ctx = ctxFor(contract)

    const retiredSurgeons = { ...s.masters.surgeons }
    for (const sid of contract.linkedSurgeonIds) retiredSurgeons[sid] = { ...retiredSurgeons[sid]!, retiredAtISO: '2026-11-24' }
    const retired = { ...live, surgeons: retiredSurgeons }

    expect(linkedOnlyToRetiredSurgeons(live, contract)).toBe(false)
    expect(linkedOnlyToRetiredSurgeons(retired, contract)).toBe(true)
    expect(isContractCandidate(retired, ctx, contract)).toBe(false)
    // As a Disabled Contract already on a Procedure (D81): fits by its other rules, so no review flag.
    expect(isContractCandidate(retired, ctx, contract, { anyStatus: true })).toBe(true)
  })
})
