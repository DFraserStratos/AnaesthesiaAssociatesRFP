/** "Reach the change date" (build plan Phase 49; US-04.1.8, DM-03): the bar trigger on the Contracts section. */
import { describe, expect, it } from 'vitest'
import { createAppStore } from '../../store/appStore'
import { OFFICE_ACTOR } from '../../store/demoActors'
import { replaceContract } from '../../store/contractReplaceActions'
import { replacedContractsToDisable } from '../../store/replacedContractSelectors'
import { CONTRACT } from '../../domain/seed/contracts'
import { DEMO_TRIGGERS } from './registry'
import { demoTriggersFor } from './match'
import type { DemoContextValues } from './context'

const trigger = DEMO_TRIGGERS.find((t) => t.id === 'contract-reach-change-date')!
const ctx = (pathname: string, published: Partial<DemoContextValues>) => ({ pathname, params: {}, published })
const UNI = CONTRACT.unisports

describe('contract-reach-change-date', () => {
  it('shows on the Contract list and a Contract page only, on the bar', () => {
    const api = createAppStore()
    const ids = (path: string, published: Partial<DemoContextValues>) => demoTriggersFor(api.getState(), path, 'bar', published).map((m) => m.trigger.id)
    expect(ids('/admin/contracts', { 'adminContracts.tab': 'contracts' })).toContain(trigger.id)
    expect(ids(`/admin/contracts/${UNI}`, { 'adminContracts.openContractId': UNI })).toContain(trigger.id)
    expect(ids('/admin/day/2026-11-24', {})).not.toContain(trigger.id)
    expect(demoTriggersFor(api.getState(), '/admin/contracts', 'pwa', { 'adminContracts.tab': 'contracts' }).map((m) => m.trigger.id)).not.toContain(trigger.id)
  })

  it('is disabled with no replacement date ahead; moves the clock to it, then the to-do shows and it is disabled again', () => {
    const api = createAppStore()
    const c = ctx(`/admin/contracts/${UNI}`, { 'adminContracts.openContractId': UNI })
    expect(trigger.disabledReason(api.getState(), c)).toBe('No replacement date ahead')
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: {}, fromISO: '2026-12-01', moveProcedureIds: [], disableNow: false })
    expect(r.ok).toBe(true)
    expect(trigger.disabledReason(api.getState(), c)).toBeNull()
    const res = trigger.run(api, c)
    expect(res.ok).toBe(true)
    expect(res.message).toContain('UNI-001 replaced by UNI-002 from 1 Dec 2026')
    expect(api.getState().clock.todayISO).toBe('2026-12-01')
    expect(replacedContractsToDisable(api.getState()).map((x) => x.contractId)).toEqual([UNI])
    expect(trigger.disabledReason(api.getState(), c)).toBe('No replacement date ahead')
  })

  it("on another Contract's page, only that Contract's replacement counts", () => {
    const api = createAppStore()
    replaceContract(api, OFFICE_ACTOR, UNI, { patch: {}, fromISO: '2026-12-01', moveProcedureIds: [], disableNow: false })
    const other = ctx('/admin/contracts/CT-MER-FACELIFT', { 'adminContracts.openContractId': 'CT-MER-FACELIFT' })
    expect(trigger.disabledReason(api.getState(), other)).toBe('No replacement date ahead')
    expect(trigger.disabledReason(api.getState(), ctx('/admin/contracts', { 'adminContracts.tab': 'contracts' }))).toBeNull()
  })
})
