/**
 * Replace a Contract from a date (build plan Phase 49; US-04.1.8's seven
 * criteria, US-04.1.3, DM-01 to DM-03) on the core seed's Unisports Ortho
 * (UNI-001, $93.47 per unit, linked to Mr Hale). The core seed puts no
 * Procedure on it, so each test first moves three of Mr Hale's Tue 1 Dec
 * Procedures onto it by hand (as the office would), plus one dated before
 * the change and one on an authorised List.
 */
import { describe, expect, it } from 'vitest'
import { createAppStore, type AppStoreApi } from './appStore'
import { OFFICE_ACTOR } from './demoActors'
import { NOT_LISTED_MESSAGE, planReplaceRows, replaceContract } from './contractReplaceActions'
import { disableContract, editContract, enableContract } from './contractActions'
import { setProcedureContract } from './contractSelectionActions'
import { addContractEventFee } from './contractEventFeeActions'
import { disableFromISO, stillOnContract } from './contractChangeSelectors'
import { replacedContractsToDisable } from './replacedContractSelectors'
import { advanceClockToDate } from './clockActions'
import { contractHistoryFor, contractReplacements, replacementOf, replacesFor } from '../domain/billing/contractHistory'
import { CONTRACT } from '../domain/seed/contracts'
import { PERSIST_VERSION } from './appStore'
import type { Actor } from './mutate'

const UNI = CONTRACT.unisports
const FROM = '2026-12-01'
/** Mr Hale's Tue 1 Dec AM, three Procedures. */
const TICKED = ['P0069', 'P0070', 'P0071'] as const
/** Mr Hale's Mon 30 Nov AM: before the change date. */
const EARLIER = 'P0159'
/** Mr Hale's authorised Fri 30 Oct List. */
const LOCKED = 'HP01'

/** The store with Unisports on the three 1 Dec Procedures, one 30 Nov one and one locked one. */
function seeded(): AppStoreApi {
  const api = createAppStore()
  for (const id of [...TICKED, EARLIER]) {
    const r = setProcedureContract(api, OFFICE_ACTOR, id, UNI)
    expect(r.ok, `${id}: ${r.ok ? '' : r.message}`).toBe(true)
  }
  // An authorised List is locked: no action can put a Contract on it, so the fixture writes it.
  api.setState((s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [LOCKED]: { ...s.schedule.procedures[LOCKED]!, governingContractId: UNI } } } }))
  return api
}

const at97 = { pricing: { kind: 'rvgContractRate' as const, unitRate: 97 } }

describe('Replace from a date (US-04.1.8)', () => {
  it('Copied: a new Contract with a new UNI code at $97.00 holds every other setting of the old one', () => {
    const api = seeded()
    const old = api.getState().masters.contracts[UNI]!
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const copy = r.value.contract
    expect(copy.id).not.toBe(UNI)
    expect(copy.aaCode).toBe('UNI-002')
    expect(copy.pricing).toEqual({ kind: 'rvgContractRate', unitRate: 97 })
    const { id: _a, aaCode: _b, pricing: _c, ...rest } = copy
    const { id: _d, aaCode: _e, pricing: _f, ...oldRest } = old
    expect(rest).toEqual(oldRest)
    // No field on the Contract carries the link or the date (D94).
    expect(Object.keys(copy)).not.toContain('replaces')
    expect(PERSIST_VERSION).toBeGreaterThanOrEqual(78)
  })

  it('Listed and ticked: lists the three from the date (not the earlier or locked one); only the ticked ones move', () => {
    const api = seeded()
    const listed = stillOnContract(api.getState(), UNI, FROM).map((r) => r.procedureId)
    expect(listed).toEqual([...TICKED])
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: ['P0069', 'P0071'], disableNow: false })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const newId = r.value.contract.id
    const p = api.getState().schedule.procedures
    expect(p.P0069!.governingContractId).toBe(newId)
    expect(p.P0071!.governingContractId).toBe(newId)
    expect(p.P0070!.governingContractId).toBe(UNI)
    expect(p[EARLIER]!.governingContractId).toBe(UNI)
    expect(r.value.rows).toEqual([
      { procedureId: 'P0069', moved: true },
      { procedureId: 'P0071', moved: true },
    ])
  })

  it('Locked left out: a forged id for an authorised-List Procedure is reported and never moves', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: '2026-01-01', moveProcedureIds: [LOCKED, EARLIER], disableNow: false })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.rows[0]).toEqual({ procedureId: LOCKED, moved: false, message: NOT_LISTED_MESSAGE })
    expect(r.value.rows[1]).toEqual({ procedureId: EARLIER, moved: true })
    expect(api.getState().schedule.procedures[LOCKED]!.governingContractId).toBe(UNI)
    expect(stillOnContract(api.getState(), UNI, '2026-01-01').map((x) => x.procedureId)).not.toContain(LOCKED)
  })

  it('Old one left active: it stays Active; the to-do appears on the date and not before', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: [...TICKED], disableNow: false })
    expect(r.ok && r.value.disabled).toBe(false)
    expect(api.getState().masters.contracts[UNI]!.status).toBe('active')
    expect(replacedContractsToDisable(api.getState())).toEqual([])
    advanceClockToDate(api, FROM)
    const rows = replacedContractsToDisable(api.getState())
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ contractId: UNI, aaCode: 'UNI-001', replacementCode: 'UNI-002', fromISO: FROM })
  })

  it('Old one disabled: disabled as it is replaced; Procedures not moved keep it; no to-do', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: ['P0069'], disableNow: true })
    expect(r.ok && r.value.disabled).toBe(true)
    expect(api.getState().masters.contracts[UNI]!.status).toBe('disabled')
    expect(api.getState().schedule.procedures.P0070!.governingContractId).toBe(UNI)
    advanceClockToDate(api, FROM)
    expect(replacedContractsToDisable(api.getState())).toEqual([])
  })

  it('every write shares one change set: the create first (with Replaces and the date), fee copies, each move, the disable last', () => {
    const api = seeded()
    expect(addContractEventFee(api, OFFICE_ACTOR, UNI, { eventType: 'accPreOpAssessment', fixedPrice: 120 }).ok).toBe(true)
    const before = api.getState().audit.length
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: ['P0069', 'P0070'], disableNow: true })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const written = api.getState().audit.slice(before)
    const sets = new Set(written.map((e) => e.changeSetId))
    expect(sets.size).toBe(1)
    expect([...sets][0]).toMatch(/^CS/)
    expect(written[0]!.action).toBe('contract.create')
    expect(written[0]!.changeSetKind).toBe('move')
    expect((written[0]!.after as Record<string, unknown>).replaces).toEqual({ contractId: UNI, fromISO: FROM })
    const actions = written.map((e) => e.action)
    expect(actions.indexOf('contractEventFee.add')).toBeGreaterThan(0)
    expect(actions.filter((a) => a === 'procedure.contract')).toHaveLength(2)
    expect(actions[actions.length - 1]).toBe('contract.disable')
    expect(actions.lastIndexOf('procedure.contract')).toBeLessThan(actions.indexOf('contract.disable'))
    // The fee is copied as it stands.
    const fees = Object.values(api.getState().masters.contractEventFees).filter((f) => f.contractId === r.value.contract.id)
    expect(fees.map((f) => [f.eventType, f.fixedPrice])).toEqual([['accPreOpAssessment', 120]])
  })

  it('a holder change takes the new holder prefix', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: { holderId: 'PY-AA', billsTo: 'payer', linkedSurgeonIds: ['S-HALE'] }, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    const prefix = api.getState().masters.parties['PY-AA']!.codePrefix
    expect(r.value.contract.aaCode.startsWith(`${prefix}-`)).toBe(true)
  })

  it('refuses a system Contract, a Disabled one, a missing date and any actor but the office, writing nothing', () => {
    const api = seeded()
    const audit = api.getState().audit.length
    const noRvg = Object.values(api.getState().masters.contracts).find((c) => c.systemRole !== undefined)!
    const sys = replaceContract(api, OFFICE_ACTOR, noRvg.id, { patch: {}, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    expect(sys.ok ? '' : sys.code).toBe('systemNotReplaced')
    expect(sys.ok ? '' : sys.message).toBe('A system Contract cannot be replaced.')
    const noDate = replaceContract(api, OFFICE_ACTOR, UNI, { patch: {}, fromISO: '', moveProcedureIds: [], disableNow: false })
    expect(noDate.ok).toBe(false)
    const anaesthetist: Actor = { who: 'Dr', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }
    expect(replaceContract(api, anaesthetist, UNI, { patch: {}, fromISO: FROM, moveProcedureIds: [], disableNow: false }).ok).toBe(false)
    expect(api.getState().audit.length).toBe(audit)
    disableContract(api, OFFICE_ACTOR, UNI)
    const afterDisable = api.getState().audit.length
    const disabled = replaceContract(api, OFFICE_ACTOR, UNI, { patch: {}, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    expect(disabled.ok ? '' : disabled.code).toBe('notActive')
    expect(api.getState().audit.length).toBe(afterDisable)
  })

  it('a refused create writes nothing (no Contract, no change set)', () => {
    const api = seeded()
    const before = JSON.stringify({ c: api.getState().masters.contracts, a: api.getState().audit.length, p: api.getState().schedule.procedures })
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: { name: '  ' }, fromISO: FROM, moveProcedureIds: [...TICKED], disableNow: true })
    expect(r.ok ? '' : r.code).toBe('nameRequired')
    expect(JSON.stringify({ c: api.getState().masters.contracts, a: api.getState().audit.length, p: api.getState().schedule.procedures })).toBe(before)
  })

  it('a refused move is reported and the rest still move (a copy linked to another surgeon no longer fits)', () => {
    const api = seeded()
    // Put one 1 Dec Procedure on Mr Hale's List under another Contract in the preview's eyes: link the copy to someone else.
    const other = Object.keys(api.getState().masters.surgeons).find((id) => id !== 'S-HALE')!
    const preview = planReplaceRows(api.getState(), OFFICE_ACTOR, UNI, { patch: { ...at97, linkedSurgeonIds: [other] }, fromISO: FROM })
    expect(preview.aaCode).toBe('UNI-002')
    expect(preview.rows.map((r) => r.row.procedureId)).toEqual([...TICKED])
    expect(preview.rows.every((r) => r.refusal !== null)).toBe(true)
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: { ...at97, linkedSurgeonIds: [other] }, fromISO: FROM, moveProcedureIds: ['P0069'], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    expect(r.value.rows[0]!.moved).toBe(false)
    expect(api.getState().schedule.procedures.P0069!.governingContractId).toBe(UNI)
  })

  it('the preview of an unchanged link lets every row move', () => {
    const api = seeded()
    const preview = planReplaceRows(api.getState(), OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM })
    expect(preview.createRefusal).toBeNull()
    expect(preview.rows.map((r) => r.refusal)).toEqual([null, null, null])
  })
})

describe('the link read both ways (DM-01, US-04.1.3)', () => {
  it('reads the replacement from the audit, both ways, and shows it in both histories', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    const newId = r.value.contract.id
    const audit = api.getState().audit
    expect(contractReplacements(audit)).toHaveLength(1)
    expect(replacementOf(audit, UNI)).toMatchObject({ contractId: newId, replacesId: UNI, fromISO: FROM })
    expect(replacesFor(audit, newId)).toMatchObject({ contractId: newId, replacesId: UNI, fromISO: FROM })
    expect(replacementOf(audit, newId)).toBeNull()
    const oldHistory = contractHistoryFor(audit, UNI)
    expect(oldHistory[0]!.entityId).toBe(newId)
    expect(oldHistory[0]!.after).toEqual({ aaCode: 'UNI-002', name: 'Unisports Ortho', replaces: { contractId: UNI, fromISO: FROM } })
    expect(contractHistoryFor(audit, newId)[0]!.action).toBe('contract.create')
  })
})

describe('the to-do rule (DM-03) and the late disable (DM-04)', () => {
  it('none before the date; one on it; none once disabled; back when re-enabled; gone when the replacement is disabled', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: FROM, moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    expect(replacedContractsToDisable(api.getState())).toHaveLength(0)
    advanceClockToDate(api, FROM)
    expect(replacedContractsToDisable(api.getState())).toHaveLength(1)
    disableContract(api, OFFICE_ACTOR, UNI)
    expect(replacedContractsToDisable(api.getState())).toHaveLength(0)
    enableContract(api, OFFICE_ACTOR, UNI)
    expect(replacedContractsToDisable(api.getState())).toHaveLength(1)
    disableContract(api, OFFICE_ACTOR, r.value.contract.id)
    expect(replacedContractsToDisable(api.getState())).toHaveLength(0)
  })

  it('Late disable: replaced from 1 Jan, a Procedure dated 5 Jan put on it, disabled on 8 Jan: the list names it', () => {
    const api = seeded()
    // Mr Hale's 1 Dec List, moved to Tue 5 Jan 2027 for the story's example.
    api.setState((s) => ({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, 'L-34821-2026-12-01-AM': { ...s.schedule.lists['L-34821-2026-12-01-AM']!, dateISO: '2027-01-05' } } } }))
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: '2027-01-01', moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    advanceClockToDate(api, '2027-01-08')
    const today = api.getState().clock.todayISO
    expect(today).toBe('2027-01-08')
    const from = disableFromISO(api.getState(), UNI, today)
    expect(from).toBe('2027-01-01')
    const listed = stillOnContract(api.getState(), UNI, from).map((x) => x.procedureId)
    expect(listed).toEqual(expect.arrayContaining([...TICKED]))
    // From today alone, the 5 Jan Procedures would be missed.
    expect(stillOnContract(api.getState(), UNI, today)).toEqual([])
  })

  it('reads the change date from replaces.fromISO, not the entry timestamp', () => {
    const api = seeded()
    const r = replaceContract(api, OFFICE_ACTOR, UNI, { patch: at97, fromISO: '2026-11-25', moveProcedureIds: [], disableNow: false })
    if (!r.ok) throw new Error(r.message)
    const entry = api.getState().audit.find((e) => e.entityId === r.value.contract.id && e.action === 'contract.create')!
    expect(entry.atISO.slice(0, 10)).toBe('2026-11-24')
    advanceClockToDate(api, '2026-12-03')
    expect(disableFromISO(api.getState(), UNI, '2026-12-03')).toBe('2026-11-25')
  })

  it('a system Contract never has the to-do, and an edit of the old one does not add one', () => {
    const api = seeded()
    editContract(api, OFFICE_ACTOR, UNI, { name: 'Unisports Ortho 2026' })
    advanceClockToDate(api, '2027-01-08')
    expect(replacedContractsToDisable(api.getState())).toEqual([])
  })
})
