import { describe, expect, it } from 'vitest'
import { CONTRACT_REFUSAL_MESSAGES } from '../../../domain/billing/contracts'
import { PARTIES, PARTY } from '../../../domain/seed/parties'
import { EMPTY_CONTRACT_DRAFT, changeDraft, draftInput, draftRules, holderGroups, type ContractDraft } from './contractDraft'

const parties = Object.fromEntries(PARTIES.map((p) => [p.id, p]))
const draft = (patch: Partial<ContractDraft>): ContractDraft => changeDraft(EMPTY_CONTRACT_DRAFT, patch, parties)

describe('contractDraft', () => {
  it('an anaesthetist holder fixes Bills to the payer before any pricing is chosen (New contract order)', () => {
    const d = draft({ holderId: PARTY.souter })
    const rules = draftRules(d, parties)
    expect(rules.forcedPayer).toBe(true)
    expect(rules.holderForcesPayer).toBe(true)
    expect(rules.billsTo).toBe('payer')
    expect(d.kind).toBe(EMPTY_CONTRACT_DRAFT.kind)
    expect(rules.showLinks).toBe(true)
  })

  it('a surgeon group may bill either', () => {
    const d = draft({ holderId: PARTY.merivale, billsTo: 'holder' })
    expect(draftRules(d, parties).forcedPayer).toBe(false)
    expect(draftRules(changeDraft(d, { billsTo: 'payer' }, parties), parties).billsTo).toBe('payer')
  })

  it('a hospital holder clears the links and takes none', () => {
    const linked = draft({ holderId: PARTY.merivale, surgeonIds: ['S1'], anaesthetistId: 'A1' })
    expect(linked.surgeonIds).toEqual(['S1'])
    const d = changeDraft(linked, { holderId: PARTY.stg }, parties)
    expect(d.surgeonIds).toEqual([])
    expect(d.anaesthetistId).toBe('')
    expect(draftRules(d, parties).showLinks).toBe(false)
    expect(draftInput(d, parties).linkedSurgeonIds).toEqual([])
    expect(draftInput(d, parties)).not.toHaveProperty('linkedAnaesthetistId')
  })

  it('prepaid moves an RVG kind to Fixed price, forces the payer and marks the RVG kinds', () => {
    const d = changeDraft(draft({ holderId: PARTY.merivale, kind: 'rvgDiscount', discount: '10', override: true }), { prepaid: true }, parties)
    expect(d.kind).toBe('fixed')
    expect(d.discount).toBe('')
    expect(d.override).toBe(false)
    const rules = draftRules(d, parties)
    expect(rules.billsTo).toBe('payer')
    const reasons = Object.fromEntries(rules.kinds.map((k) => [k.kind, k.disabledReason]))
    expect(reasons.rvgAnaesthetistRate).toBe(CONTRACT_REFUSAL_MESSAGES.prepaidNotRvg)
    expect(reasons.fixed).toBeUndefined()
  })

  it('the override clears on Fixed price, and a kind change clears what it no longer uses', () => {
    let d = draft({ holderId: PARTY.merivale, kind: 'rvgContractRate', rate: '30', override: true })
    expect(d.override).toBe(true)
    d = changeDraft(d, { kind: 'fixed' }, parties)
    expect(d.override).toBe(false)
    expect(d.rate).toBe('')
    d = changeDraft(d, { firstStart: '2026-12-01', firstPrice: '2450' }, parties)
    expect(draftInput(d, parties).pricing).toEqual({ kind: 'fixed', ranges: [{ startISO: '2026-12-01', price: 2450 }] })
    d = changeDraft(d, { kind: 'rvgAnaesthetistRate' }, parties)
    expect(d.firstStart).toBe('')
    expect(d.firstPrice).toBe('')
    expect(draftInput(d, parties).anaesthetistMayOverridePrice).toBe(false)
  })

  it('a non-RVG kind can never carry the override into the save', () => {
    const d = { ...draft({ holderId: PARTY.merivale, kind: 'fixed' }), override: true }
    expect(draftInput(d, parties).anaesthetistMayOverridePrice).toBe(false)
  })

  it('groups the holders by kind, each by name', () => {
    const groups = new Map(holderGroups(parties))
    expect(groups.get('Hospital')?.map((p) => p.id)).toContain(PARTY.stg)
    expect(groups.get('Surgeon group')?.map((p) => p.id)).toContain(PARTY.merivale)
    const hospitals = groups.get('Hospital')!.map((p) => p.name)
    expect(hospitals).toEqual([...hospitals].sort((a, b) => a.localeCompare(b)))
  })
})
