/**
 * Modifier store actions (catch-up Phase 19b): claims with explanations, the
 * pre-applied age and included modifiers removed and put back, AA's own
 * modifiers, `editProcedure`'s refusal and the reconciliation on a change of
 * RVG group. Every write is audited and goes through `mutate()`.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { editProcedure, MODIFIERS_THROUGH_ACTIONS_MESSAGE } from './lifecycle'
import { addAaModifier, claimModifier, editModifierExplanation, removeModifier, restoreModifier } from './modifierActions'
import { pickRvgGroup } from './rvgGroupActions'
import { proceduresForBooking } from './selectors'
import type { Actor } from './mutate'
import { procedureFee } from '../shared/capture/feeContext'
import { ANAE, RVG_GROUP, SEED_MARKERS } from '../domain/seed'
import { seedModifierId as mod } from '../domain/seed/modifiers'
import { assigned } from '../test/lists'

const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MORRISON: Actor = { who: 'Dr Morrison', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.morrison }
const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

const ELLISON = 'P0009'
const SPINE_BOOKING = SEED_MARKERS.includedModifierBooking!.entityId

function m(api: BoundAppStore, procedureId: string): number {
  const s = api.getState()
  const p = s.schedule.procedures[procedureId]!
  const booking = s.schedule.bookings[p.bookingId]!
  const list = assigned(s.schedule.lists[booking.listId])
  return procedureFee({ procedure: p, list, masters: s.masters, billingLines: s.schedule.billingLines, patientId: booking.patientId }).fee.btm
    .modifiers.units
}

const last = (api: BoundAppStore) => api.getState().audit.at(-1)!

describe('claimModifier', () => {
  it('claims ASA III with its explanation: M rises by 2, audited with the code and the explanation', () => {
    const api = createAppStore()
    expect(m(api, ELLISON)).toBe(1) // A1, pre-applied from her age
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: '  ASA III on pre-op review ' }).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.modifierClaims).toEqual([{ modifierId: mod('AS3'), explanation: 'ASA III on pre-op review' }])
    expect(m(api, ELLISON)).toBe(3)
    expect(last(api)).toMatchObject({
      action: 'procedure.modifierClaim',
      entityId: ELLISON,
      role: 'anaesthetist',
      after: { modifier: expect.stringMatching(/^AS3 · ASA III/), explanation: 'ASA III on pre-op review' },
    })
  })

  it('stacks with no limit: OB2 beside AS3, both count', () => {
    const api = createAppStore()
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: 'ASA III' })
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: mod('OB2'), explanation: 'BMI 37' }).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(1 + 2 + 1)
  })

  it('refuses a blank explanation, a duplicate, A1 while it is applied, missing units and an unknown modifier', () => {
    const api = createAppStore()
    const refused = (input: Parameters<typeof claimModifier>[3]) => {
      const out = claimModifier(api, SOUTER, ELLISON, input)
      return out.ok ? null : out.message
    }
    expect(refused({ modifierId: mod('AS3'), explanation: ' ' })).toBe('Add a short explanation for AS3.')
    expect(refused({ modifierId: mod('A1'), explanation: 'Old' })).toBe("A1 is already applied from the patient's age.")
    expect(refused({ modifierId: mod('PA3'), explanation: 'Seen in clinic' })).toBe('Enter the units for PA3 (RVG: 2 + Time, at least 2).')
    expect(refused({ modifierId: 'MOD-NOPE', explanation: 'x' })).toBe('That modifier is not in the modifier list.')
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: 'ASA III' })
    expect(refused({ modifierId: mod('AS3'), explanation: 'Again' })).toBe('AS3 is already on this Procedure.')
    expect(api.getState().schedule.procedures[ELLISON]!.modifierClaims).toHaveLength(1)
  })

  it('prices a modifier printed as "2 + Time" from the entered units', () => {
    const api = createAppStore()
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: mod('PA3'), explanation: 'Seen in clinic', units: 3 }).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(1 + 3)
  })

  it("refuses the anaesthetist on another anaesthetist's List, and anyone on an AUTHORISED List", () => {
    const api = createAppStore()
    expect(claimModifier(api, MORRISON, ELLISON, { modifierId: mod('AS3'), explanation: 'x' })).toMatchObject({ ok: false, code: 'notOwnList' })
    const authorised = Object.values(api.getState().schedule.lists).find((l) => l.state === 'AUTHORISED')!
    const booking = Object.values(api.getState().schedule.bookings).find((b) => b.listId === authorised.id)!
    const [p] = proceduresForBooking(api.getState(), booking.id)
    expect(claimModifier(api, OFFICE, p!.id, { modifierId: mod('AS3'), explanation: 'x' })).toMatchObject({ ok: false, code: 'listAuthorised' })
  })
})

describe('editModifierExplanation', () => {
  it('changes the explanation with before and after; a blank one is refused', () => {
    const api = createAppStore()
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: 'ASA III' })
    expect(editModifierExplanation(api, SOUTER, ELLISON, mod('AS3'), ' ')).toMatchObject({ ok: false, message: 'Add a short explanation, or remove the modifier.' })
    expect(editModifierExplanation(api, SOUTER, ELLISON, mod('AS3'), 'ASA III, COPD').ok).toBe(true)
    expect(last(api)).toMatchObject({ action: 'procedure.modifierExplanation', before: { explanation: 'ASA III' }, after: { explanation: 'ASA III, COPD' } })
    expect(editModifierExplanation(api, SOUTER, ELLISON, mod('OB2'), 'x')).toMatchObject({ ok: false, code: 'notClaimed' })
  })
})

describe('removeModifier and restoreModifier (nothing is locked)', () => {
  it('removing a claim lowers M on the Admin Booking, audited as an unclaim', () => {
    const api = createAppStore()
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('AS3'), explanation: 'ASA III' })
    expect(removeModifier(api, OFFICE, ELLISON, mod('AS3')).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(1)
    expect(last(api)).toMatchObject({ action: 'procedure.modifierUnclaim', role: 'office', before: { explanation: 'ASA III' } })
  })

  it('removing the pre-applied A1 lowers M by 1, is audited, and putting it back restores it', () => {
    const api = createAppStore()
    expect(removeModifier(api, SOUTER, ELLISON, mod('A1')).ok).toBe(true)
    expect(api.getState().schedule.procedures[ELLISON]!.removedModifierIds).toEqual([mod('A1')])
    expect(m(api, ELLISON)).toBe(0)
    expect(last(api)).toMatchObject({ action: 'procedure.modifierRemove', before: { appliedBecause: "From the patient's age (72) on the procedure date" }, after: { modifier: 'removed' } })
    expect(restoreModifier(api, SOUTER, ELLISON, mod('A1')).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(1)
    expect(last(api).action).toBe('procedure.modifierRestore')
    expect(restoreModifier(api, SOUTER, ELLISON, mod('A1'))).toMatchObject({ ok: false, code: 'notRemoved' })
  })

  it('on the Spine Booking, P1 is pre-applied at 0: claiming it is refused, removing it takes it off the list, putting it back returns it', () => {
    const api = createAppStore()
    const [p] = proceduresForBooking(api.getState(), SPINE_BOOKING)
    const codes = () => {
      const s = api.getState()
      const proc = s.schedule.procedures[p!.id]!
      const booking = s.schedule.bookings[proc.bookingId]!
      return procedureFee({ procedure: proc, list: assigned(s.schedule.lists[booking.listId]), masters: s.masters, billingLines: s.schedule.billingLines, patientId: booking.patientId })
        .fee.btm.modifierItems.map((i) => [i.code, i.units, i.origin])
    }
    expect(codes()).toEqual([['P1', 0, 'included']])
    expect(claimModifier(api, SOUTER, p!.id, { modifierId: mod('P1'), explanation: 'Prone' })).toMatchObject({ ok: false, message: 'P1 is already on this Procedure.' })
    expect(removeModifier(api, SOUTER, p!.id, mod('P1')).ok).toBe(true)
    expect(api.getState().schedule.procedures[p!.id]!.removedModifierIds).toEqual([mod('P1')])
    expect(codes()).toEqual([])
    expect(restoreModifier(api, SOUTER, p!.id, mod('P1')).ok).toBe(true)
    expect(codes()).toEqual([['P1', 0, 'included']])
  })

  it('a hand claim made after removing a pre-applied modifier is dropped when it is put back (never twice)', () => {
    const api = createAppStore()
    removeModifier(api, SOUTER, ELLISON, mod('A1'))
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: mod('A1'), explanation: 'Frail' }).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(1)
    restoreModifier(api, SOUTER, ELLISON, mod('A1'))
    expect(api.getState().schedule.procedures[ELLISON]!.modifierClaims).toEqual([])
    expect(m(api, ELLISON)).toBe(1)
  })

  it('Remove on a pre-applied row removes the pre-applied modifier even beside a duplicate claim; restore audits a dropped hand claim', () => {
    const api = createAppStore()
    removeModifier(api, SOUTER, ELLISON, mod('A1'))
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('A1'), explanation: 'Frail' })
    restoreModifier(api, SOUTER, ELLISON, mod('A1'))
    expect(last(api)).toMatchObject({ action: 'procedure.modifierRestore', before: { modifierClaims: ['A1: Frail'] }, after: { modifierClaims: [] } })
    expect(removeModifier(api, SOUTER, ELLISON, mod('A1'), 'preApplied').ok).toBe(true)
    expect(last(api).action).toBe('procedure.modifierRemove')
  })

  it('refuses to remove a modifier that is not on the Procedure', () => {
    expect(removeModifier(createAppStore(), SOUTER, ELLISON, mod('OB2'))).toMatchObject({ ok: false, code: 'notOnProcedure' })
  })
})

describe('editProcedure and a change of RVG group', () => {
  it('editProcedure refuses a patch carrying claims or removals', () => {
    const api = createAppStore()
    const out = editProcedure(api, SOUTER, ELLISON, { modifierClaims: [{ modifierId: mod('AS3'), explanation: 'x' }] })
    expect(out).toMatchObject({ ok: false, code: 'modifiersThroughActions', message: MODIFIERS_THROUGH_ACTIONS_MESSAGE })
    expect(editProcedure(api, SOUTER, ELLISON, { removedModifierIds: [] }).ok).toBe(false)
  })

  it('a code change to a Spine group drops a P1 claim in the same commit', () => {
    const api = createAppStore()
    claimModifier(api, SOUTER, ELLISON, { modifierId: mod('P1'), explanation: 'Lateral, then prone' })
    expect(m(api, ELLISON)).toBe(1 + 2)
    expect(pickRvgGroup(api, SOUTER, ELLISON, RVG_GROUP.s3a!).ok).toBe(true)
    const p = api.getState().schedule.procedures[ELLISON]!
    expect(p.modifierClaims).toEqual([])
    expect(m(api, ELLISON)).toBe(1) // A1 + P1 at 0
    expect(last(api)).toMatchObject({ action: 'procedure.update', before: { modifierClaims: ['P1: Lateral, then prone'] }, after: { modifierClaims: [] } })
  })

  it('a code change to a hip group drops the removal of P1, through editProcedure too', () => {
    const api = createAppStore()
    const [p] = proceduresForBooking(api.getState(), SPINE_BOOKING)
    removeModifier(api, SOUTER, p!.id, mod('P1'))
    expect(editProcedure(api, SOUTER, p!.id, { rvgGroupId: RVG_GROUP.aaHipReplacement! }).ok).toBe(true)
    expect(api.getState().schedule.procedures[p!.id]!.removedModifierIds).toEqual([])
  })
})

describe("addAaModifier (AA's own)", () => {
  it('the office adds one, audited, and it is claimable at once; anaesthetists cannot, and AA codes do not repeat', () => {
    const api = createAppStore()
    const added = addAaModifier(api, OFFICE, { code: ' AAX1 ', factor: 'Demo AA modifier', units: 1 })
    expect(added).toMatchObject({ ok: true, value: { id: 'MOD-AA-001' } })
    expect(api.getState().masters.modifiers['MOD-AA-001']).toMatchObject({ code: 'AAX1', block: "AA's own", units: 1, unitsAsPrinted: '1', source: 'aa' })
    expect(last(api)).toMatchObject({ action: 'modifier.create', entityType: 'modifier', after: { code: 'AAX1', factor: 'Demo AA modifier', units: 1 } })
    expect(claimModifier(api, SOUTER, ELLISON, { modifierId: 'MOD-AA-001', explanation: 'Demo' }).ok).toBe(true)
    expect(m(api, ELLISON)).toBe(2)
    expect(addAaModifier(api, OFFICE, { code: 'aax1', factor: 'Again', units: 0 })).toMatchObject({ ok: false, code: 'codeTaken' })
    expect(addAaModifier(api, SOUTER, { code: 'AAX2', factor: 'x', units: 1 })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(addAaModifier(api, OFFICE, { code: 'AAX3', factor: 'x', units: 1.5 })).toMatchObject({ ok: false, code: 'unitsInvalid' })
    // An RVG code may be repeated by an AA row: codes are not keys.
    expect(addAaModifier(api, OFFICE, { code: 'P1', factor: 'AA positioning', units: 1 }).ok).toBe(true)
  })
})
