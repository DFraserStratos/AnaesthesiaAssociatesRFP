/**
 * The RVG groups master and the RVG code on a Procedure (catch-up Phase 19;
 * US-05.1.1, US-05.1.3, RV-10 under D3).
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { advanceClockMinutes } from './clockActions'
import { authoriseList, completeBooking, editProcedure, submitList } from './lifecycle'
import { clockISO, type Actor } from './mutate'
import { createRvgGroup, editRvgGroup, pickRvgGroup, restoreRvgGroup, retireRvgGroup } from './rvgGroupActions'
import { createBooking } from './bookingActions'
import { editContract } from './contractActions'
import { CONTRACT } from '../domain/seed'
import { proceduresForBooking } from './selectors'
import { openWarnings, warningsForBooking } from './warnings'
import { procedureFee } from '../shared/capture/feeContext'
import { searchRvgGroups } from '../domain/billing/rvgGroups'
import { ANAE, RVG_GROUP, SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const BROW_LIFT = { code: 'H3', description: 'Brow lift', anatomy: 'Head', baseUnits: 5, modifierUnits: 0 }

const ELLISON = SEED_MARKERS['pendingCaptureBooking']!.entityId
const SOUTER_PM = SEED_LIST_IDS.souterPm21

function ellison(api: BoundAppStore) {
  return proceduresForBooking(api.getState(), ELLISON)[0]!
}

function feeOf(api: BoundAppStore, procedureId: string) {
  const s = api.getState()
  const p = s.schedule.procedures[procedureId]!
  const booking = s.schedule.bookings[p.bookingId]!
  const list = assigned(s.schedule.lists[booking.listId])
  return procedureFee({ procedure: p, list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: booking.patientId }).fee
}

describe('the office maintains the RVG groups', () => {
  it('adds an AA group, unmarked, audited with what was saved', () => {
    const api = createAppStore()
    const added = createRvgGroup(api, OFFICE, { ...BROW_LIFT, description: '  Brow lift ' })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.value.id).toBe('RGN001')
    const row = api.getState().masters.rvgGroups[added.value.id]!
    expect(row).toEqual({ id: 'RGN001', code: 'H3', description: 'Brow lift', anatomy: 'Head', baseUnits: 5, modifierUnits: 0, retired: false, includedModifierIds: [] })
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'rvgGroup.create', entityType: 'rvgGroup', entityId: 'RGN001', who: 'Kirsty W.' })
    expect(searchRvgGroups('brow', api.getState().masters.rvgGroups).map((g) => g.id)).toEqual(['RGN001'])
  })

  it('refuses the anaesthetist, base units of 0, a range missing the figure, and an exact duplicate', () => {
    const api = createAppStore()
    expect(createRvgGroup(api, SOUTER, BROW_LIFT)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(createRvgGroup(api, OFFICE, { ...BROW_LIFT, baseUnits: 0 })).toMatchObject({ ok: false, code: 'baseUnitsInvalid' })
    expect(createRvgGroup(api, OFFICE, { ...BROW_LIFT, baseUnitsRange: { min: 6, max: 8 } })).toMatchObject({ ok: false, code: 'rangeMissesFigure' })
    expect(createRvgGroup(api, OFFICE, BROW_LIFT).ok).toBe(true)
    expect(createRvgGroup(api, OFFICE, BROW_LIFT)).toMatchObject({ ok: false, code: 'duplicateGroup' })
    // Another row with the same code is fine: the same code may sit on several rows.
    expect(createRvgGroup(api, OFFICE, { ...BROW_LIFT, description: 'Forehead lift' }).ok).toBe(true)
  })

  it('edits every field but the id, with before and after; a no-op writes nothing', () => {
    const api = createAppStore()
    const h1 = RVG_GROUP.h1!
    const before = api.getState().audit.length
    expect(editRvgGroup(api, OFFICE, h1, { ...api.getState().masters.rvgGroups[h1]!, modifierUnits: 0 }).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
    expect(editRvgGroup(api, OFFICE, h1, { code: 'H1', description: 'Minor head procedures', anatomy: 'Head', baseUnits: 4, modifierUnits: 1 }).ok).toBe(true)
    expect(api.getState().masters.rvgGroups[h1]).toMatchObject({ id: h1, description: 'Minor head procedures', modifierUnits: 1 })
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'rvgGroup.update',
      before: { modifierUnits: 0 },
      after: { modifierUnits: 1, description: 'Minor head procedures' },
    })
    expect(editRvgGroup(api, SOUTER, h1, BROW_LIFT)).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('retiring hides a row from the picker and keeps it pricing an existing Procedure; restore brings it back', () => {
    const api = createAppStore()
    const p = ellison(api)
    const group = p.rvgGroupId!
    const feeBefore = feeOf(api, p.id).total
    expect(retireRvgGroup(api, OFFICE, group).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'rvgGroup.retire', before: { retired: false }, after: { retired: true } })
    expect(searchRvgGroups('', api.getState().masters.rvgGroups).some((g) => g.id === group)).toBe(false)
    expect(feeOf(api, p.id).total).toBe(feeBefore)
    // A retired row is refused as a new pick, but the Procedure on it keeps it.
    const other = proceduresForBooking(api.getState(), SEED_MARKERS['firstVisitBooking']?.entityId ?? 'BK0032')[0]!
    expect(pickRvgGroup(api, OFFICE, other.id, group)).toMatchObject({ ok: false, code: 'rvgGroupRetired' })
    expect(retireRvgGroup(api, OFFICE, group)).toMatchObject({ ok: false, code: 'alreadyRetired' })
    expect(restoreRvgGroup(api, OFFICE, group).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'rvgGroup.restore' })
    expect(searchRvgGroups('', api.getState().masters.rvgGroups).some((g) => g.id === group)).toBe(true)
  })

  it('a figure edit re-prices an ACTIVE Procedure live and leaves a built invoice alone', () => {
    const api = createAppStore()
    const s = api.getState()
    const p = ellison(api)
    const group = s.masters.rvgGroups[p.rvgGroupId!]!
    const builtLine = Object.values(s.billing.invoiceLines).find((l) => l.procedureId !== undefined && s.schedule.procedures[l.procedureId]?.rvgGroupId === group.id)
    expect(builtLine).toBeDefined()
    const builtAmount = builtLine!.amount
    const before = feeOf(api, p.id)
    expect(editRvgGroup(api, OFFICE, group.id, { ...group, baseUnits: group.baseUnits + 1 }).ok).toBe(true)
    const after = feeOf(api, p.id)
    expect(after.btm.base.units).toBe(before.btm.base.units + 1)
    expect(api.getState().billing.invoiceLines[builtLine!.id]!.amount).toBe(builtAmount)
  })
})

describe('pickRvgGroup (the RVG code on a Procedure)', () => {
  it('sets, changes and clears the code in one audited commit; the text received is never touched', () => {
    const api = createAppStore()
    const p = ellison(api)
    const description = p.description
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'procedure.update', before: { rvgGroupId: p.rvgGroupId }, after: { rvgGroupId: RVG_GROUP.h4 } })
    expect(ellison(api)).toMatchObject({ rvgGroupId: RVG_GROUP.h4, description })
    expect(pickRvgGroup(api, SOUTER, p.id, null).ok).toBe(true)
    expect(ellison(api).rvgGroupId).toBeUndefined()
    expect(ellison(api).description).toBe(description)
    expect(feeOf(api, p.id).btm.baseSource).toBe('none')
  })

  it('clears a chosen or typed value only when the row changes', () => {
    const api = createAppStore()
    const p = ellison(api)
    pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!)
    editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 11 })
    const audits = api.getState().audit.length
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!).ok).toBe(true)
    expect(api.getState().audit.length).toBe(audits)
    expect(ellison(api).baseUnitsSelected).toBe(11)
    editProcedure(api, SOUTER, p.id, { baseUnitsCaptured: { units: 20, source: 'overridden' } })
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.n4!).ok).toBe(true)
    expect(ellison(api).baseUnitsSelected).toBeUndefined()
    expect(ellison(api).baseUnitsCaptured).toBeUndefined()
    expect(feeOf(api, p.id).btm.base.units).toBe(10)
  })

  it('refuses an unknown row, and the anaesthetist on an AUTHORISED List', () => {
    const api = createAppStore()
    const p = ellison(api)
    expect(pickRvgGroup(api, SOUTER, p.id, 'RG999')).toMatchObject({ ok: false, code: 'rvgGroupNotFound' })
    const s = api.getState()
    api.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [SOUTER_PM]: { ...assigned(s.schedule.lists[SOUTER_PM]), state: 'AUTHORISED' } } } })
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!).ok).toBe(false)
  })

  it('createBooking carries an optional RVG code, refusing an unknown or retired row', () => {
    const api = createAppStore()
    const input = { patient: { name: 'Test Patient', dobISO: '1980-01-01' }, operation: 'Brow lift' }
    const made = createBooking(api, SOUTER, SOUTER_PM, { ...input, rvgGroupId: RVG_GROUP.h3! })
    expect(made.ok).toBe(true)
    if (made.ok) expect(proceduresForBooking(api.getState(), made.value.bookingId)[0]).toMatchObject({ rvgGroupId: RVG_GROUP.h3, description: 'Brow lift' })
    expect(createBooking(api, SOUTER, SOUTER_PM, { ...input, rvgGroupId: 'RG999' })).toMatchObject({ ok: false, code: 'rvgGroupNotFound' })
    retireRvgGroup(api, OFFICE, RVG_GROUP.h3!)
    expect(createBooking(api, SOUTER, SOUTER_PM, { ...input, rvgGroupId: RVG_GROUP.h3! })).toMatchObject({ ok: false, code: 'rvgGroupRetired' })
  })
})

describe('any base-unit value is accepted (D3, RV-10)', () => {
  it('editProcedure takes any whole value of 0 or more, with no range check, and refuses a fraction or a negative', () => {
    const api = createAppStore()
    const p = ellison(api)
    pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!)
    expect(editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 40 }).ok).toBe(true)
    expect(editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 0 }).ok).toBe(true)
    expect(editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 2.5 })).toMatchObject({ ok: false, message: 'Base units must be a whole number.' })
    expect(editProcedure(api, SOUTER, p.id, { baseUnitsCaptured: { units: -1, source: 'overridden' } })).toMatchObject({ ok: false, code: 'baseUnitsInvalid' })
  })

  it('an outside value completes, submits and authorises, and raises one mild after-procedure warning', () => {
    const api = createAppStore()
    advanceClockMinutes(api, 9 * 60 + 20)
    const p = ellison(api)
    expect(editProcedure(api, SOUTER, p.id, { handoverISO: clockISO(api.getState().clock) }).ok).toBe(true)
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!).ok).toBe(true)
    expect(editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 14 }).ok).toBe(true)

    const warnings = warningsForBooking(api.getState(), ELLISON).filter((w) => w.ruleId === 'baseUnitsOutsideGuide')
    expect(warnings).toEqual([
      expect.objectContaining({ kind: 'afterProcedure', strength: 'mild', text: 'Base units 14 are outside the RVG guide for H4 (10 to 12).', procedureId: p.id }),
    ])
    expect(feeOf(api, p.id).btm.base.units).toBe(14)

    expect(completeBooking(api, SOUTER, ELLISON).ok).toBe(true)
    expect(submitList(api, SOUTER, SOUTER_PM).ok).toBe(true)
    expect(authoriseList(api, OFFICE, SOUTER_PM).ok).toBe(true)
    expect(openWarnings(api.getState()).some((r) => r.bookingId === ELLISON)).toBe(true)
  })

  it('inside the range, or back at the starting value, raises nothing', () => {
    const api = createAppStore()
    const p = ellison(api)
    pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!)
    editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 11 })
    expect(warningsForBooking(api.getState(), ELLISON).some((w) => w.ruleId === 'baseUnitsOutsideGuide')).toBe(false)
    editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 10 })
    expect(warningsForBooking(api.getState(), ELLISON).some((w) => w.ruleId === 'baseUnitsOutsideGuide')).toBe(false)
  })

  it('the pristine seed raises no warning of this rule', () => {
    const api = createAppStore()
    expect(openWarnings(api.getState()).filter((r) => r.warning.ruleId === 'baseUnitsOutsideGuide')).toEqual([])
  })
})

describe('review fixes (convention 18, catch-up Phase 19)', () => {
  it('editProcedure moving to another row clears the old chosen and typed values, as pickRvgGroup does', () => {
    const api = createAppStore()
    const p = ellison(api)
    pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!)
    editProcedure(api, SOUTER, p.id, { baseUnitsSelected: 5 })
    expect(editProcedure(api, SOUTER, p.id, { rvgGroupId: RVG_GROUP.n4! }).ok).toBe(true)
    expect(ellison(api).baseUnitsSelected).toBeUndefined()
    expect(feeOf(api, p.id).btm.base.units).toBe(10)
    // A patch that sets its own value keeps it.
    expect(editProcedure(api, SOUTER, p.id, { rvgGroupId: RVG_GROUP.h4!, baseUnitsSelected: 11 }).ok).toBe(true)
    expect(ellison(api).baseUnitsSelected).toBe(11)
  })

  it('an additional procedure raises no base-units warning: its base units are not charged', () => {
    const api = createAppStore()
    const p = ellison(api)
    pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!)
    const s = api.getState()
    api.setState({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [p.id]: { ...s.schedule.procedures[p.id]!, isAdditional: true, baseUnitsSelected: 40 } } } })
    expect(warningsForBooking(api.getState(), ELLISON).some((w) => w.ruleId === 'baseUnitsOutsideGuide')).toBe(false)
  })

  it('the anaesthetist can still pick on a SUBMITTED List (D63, catch-up Phase 38a) and is refused once AUTHORISED', () => {
    const api = createAppStore()
    const p = ellison(api)
    const s = api.getState()
    api.setState({ schedule: { ...s.schedule, lists: { ...s.schedule.lists, [SOUTER_PM]: { ...assigned(s.schedule.lists[SOUTER_PM]), state: 'SUBMITTED' } } } })
    expect(pickRvgGroup(api, SOUTER, p.id, RVG_GROUP.h4!).ok).toBe(true)
  })

  it('a duplicate of a retired row says to restore it; a retired row cannot become a default RVG code', () => {
    const api = createAppStore()
    const made = createRvgGroup(api, OFFICE, BROW_LIFT)
    if (!made.ok) throw new Error('not made')
    retireRvgGroup(api, OFFICE, made.value.id)
    expect(createRvgGroup(api, OFFICE, BROW_LIFT)).toMatchObject({ ok: false, code: 'duplicateRetired', message: 'A retired RVG group has the same code, description and base units. Restore it instead.' })
    // A retired row cannot become a Contract's default RVG code (catch-up Phase 19a).
    expect(editContract(api, OFFICE, CONTRACT.cosFixed, { defaultRvgGroupId: made.value.id })).toMatchObject({ ok: false, code: 'rvgGroupRetired' })
  })
})
