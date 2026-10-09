import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import {
  addPairingPreference,
  endPairingPreference,
  selectPairingsForAnaesthetist,
  selectPairingsForSurgeon,
  selectPriorityTier,
  setPriorityTier,
} from './officePrivate'
import { addAnaesthetist } from './mastersActions'
import { clockISO, resetDomainState } from './mutate'
import { ANAE, SURG } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

describe('pairing preferences', () => {
  it('records an entry with the clock, the office user and an audit entry', () => {
    const api = createAppStore()
    const out = addPairingPreference(api, OFFICE, { kind: 'PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: ANAE.chen, surgeonId: SURG.lim, reason: ' Good team ' })
    expect(out.ok).toBe(true)
    const id = out.ok ? out.value.id : ''
    expect(id).toBe('PPN001')
    const s = api.getState()
    expect(s.officePrivate.pairingPreferences[id]).toMatchObject({ kind: 'PREFERRED', raisedBy: 'ANAESTHETIST', reason: 'Good team', addedBy: 'Kirsty W.' })
    expect(s.officePrivate.pairingPreferences[id]?.addedAtISO).toBe(clockISO(s.clock))
    expect(s.audit.at(-1)).toMatchObject({ action: 'pairing.add', entityType: 'pairingPreference', entityId: id, after: { kind: 'PREFERRED', raisedBy: 'ANAESTHETIST' } })
  })

  it('refuses an anaesthetist actor and unknown people, kinds or sides', () => {
    const api = createAppStore()
    const base = { kind: 'NOT_PREFERRED' as const, raisedBy: 'SURGEON' as const, anaesthetistId: ANAE.chen, surgeonId: SURG.lim }
    const codes = [
      addPairingPreference(api, SOUTER, base),
      addPairingPreference(api, OFFICE, { ...base, anaesthetistId: '00000' }),
      addPairingPreference(api, OFFICE, { ...base, surgeonId: 'S-NOPE' }),
      addPairingPreference(api, OFFICE, { ...base, kind: 'MAYBE' as never }),
      addPairingPreference(api, OFFICE, { ...base, raisedBy: 'NURSE' as never }),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['officeOnly', 'notFound', 'notFound', 'invalidKind', 'invalidSide'])
  })

  it('refuses a same-side duplicate and a same-side contradiction, accepts the other side', () => {
    const api = createAppStore()
    const dup = addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    expect(dup.ok ? '' : dup.code).toBe('duplicatePairing')
    const contra = addPairingPreference(api, OFFICE, { kind: 'PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    expect(contra.ok ? '' : contra.message).toBe('Ms A. Reid already has a Not preferred entry with Dr Priya Sharma. End it first.')
    const other = addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    expect(other.ok).toBe(true)
  })

  it('ending keeps the record, a second end is refused, and re-adding creates a new entry', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().officePrivate.pairingPreferences).length
    expect(endPairingPreference(api, SOUTER, 'PP-001').ok).toBe(false)
    expect(endPairingPreference(api, OFFICE, 'PP-001', 'Talked it through').ok).toBe(true)
    const ended = api.getState().officePrivate.pairingPreferences['PP-001']
    expect(ended).toMatchObject({ endedBy: 'Kirsty W.', endReason: 'Talked it through' })
    expect(ended?.endedAtISO).toBeDefined()
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'pairing.end', entityId: 'PP-001' })
    const again = endPairingPreference(api, OFFICE, 'PP-001')
    expect(again.ok ? '' : again.code).toBe('alreadyEnded')
    expect(endPairingPreference(api, OFFICE, 'PP-NOPE').ok).toBe(false)
    const readd = addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    expect(readd.ok).toBe(true)
    expect(Object.keys(api.getState().officePrivate.pairingPreferences)).toHaveLength(before + 1)
  })

  it('selectors list a surgeon’s and an anaesthetist’s entries, active and ended', () => {
    const s = createAppStore().getState()
    expect(selectPairingsForSurgeon(s, SURG.reid).map((e) => e.id)).toEqual(['PP-001', 'PP-002'])
    expect(selectPairingsForAnaesthetist(s, ANAE.sharma).map((e) => e.id)).toEqual(['PP-001', 'PP-003'])
  })
})

describe('priority tiers', () => {
  it('sets, re-sets and defaults a tier, auditing before and after on the anaesthetist', () => {
    const api = createAppStore()
    expect(selectPriorityTier(api.getState(), ANAE.sharma)).toBe(2)
    expect(setPriorityTier(api, OFFICE, ANAE.sharma, 1).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'anaesthetist.tierSet', entityType: 'anaesthetist', entityId: ANAE.sharma, before: { tier: 2 }, after: { tier: 1 } })
    expect(setPriorityTier(api, OFFICE, ANAE.sharma, 4).ok).toBe(true)
    // Tier 4 is the default: the entry is removed, not stored.
    expect(api.getState().officePrivate.priorityTiers[ANAE.sharma]).toBeUndefined()
    expect(selectPriorityTier(api.getState(), ANAE.sharma)).toBe(4)
    const auditLength = api.getState().audit.length
    expect(setPriorityTier(api, OFFICE, ANAE.sharma, 4).ok).toBe(true)
    expect(api.getState().audit.length).toBe(auditLength)
  })

  it('refuses an anaesthetist actor, an unknown anaesthetist and a tier outside 1 to 4', () => {
    const api = createAppStore()
    expect(setPriorityTier(api, SOUTER, ANAE.sharma, 1).ok).toBe(false)
    expect(setPriorityTier(api, OFFICE, '00000', 1).ok).toBe(false)
    expect(setPriorityTier(api, OFFICE, ANAE.sharma, 5 as never).ok).toBe(false)
    expect(setPriorityTier(api, OFFICE, ANAE.sharma, 0 as never).ok).toBe(false)
  })

  it('a new anaesthetist reads as Tier 4 until the office changes it', () => {
    const api = createAppStore()
    addAnaesthetist(api, OFFICE, { registrationNumber: '50001', name: 'Dr New Person', phone: '', email: '', unitValue: 30, gstPeriod: 'monthly', startDateISO: '2026-07-21' })
    expect(api.getState().officePrivate.priorityTiers['50001']).toBeUndefined()
    expect(selectPriorityTier(api.getState(), '50001')).toBe(4)
  })

  it('Reset restores the seeded slice and zeroes the picker counter', () => {
    const api = createAppStore()
    setPriorityTier(api, OFFICE, ANAE.sharma, 1)
    endPairingPreference(api, OFFICE, 'PP-001')
    api.getState().nextSuggestionSeq()
    expect(api.getState().nextSuggestionSeq()).toBe(2)
    resetDomainState(api)
    expect(selectPriorityTier(api.getState(), ANAE.sharma)).toBe(2)
    expect(api.getState().officePrivate.pairingPreferences['PP-001']?.endedAtISO).toBeUndefined()
    expect(api.getState().shell.suggestionSeq).toBe(0)
    expect(api.getState().nextSuggestionSeq()).toBe(1)
  })
})
