import { describe, expect, it } from 'vitest'
import {
  CONTRACT_REFUSAL_MESSAGES,
  contractMatchesQuery,
  contractRefusal,
  contractSearch,
  interimRouteContract,
  isRvgKind,
  linkFits,
  matchContractPrice,
  nextAaCode,
  noContractRvg,
  noPriceInForce,
  noPriceInForceMessage,
  type Contract,
  type ContractRefusalContext,
} from './contracts'
import { mkContract, mkParty, mkProcedure } from './fixtures'
import type { ContractPrice, Party } from '../types'

const HOSPITAL = mkParty()
const AA: Party = { id: 'py-aa', kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA' }
const GROUP: Party = { id: 'py-grp', kind: 'surgeonGroup', name: 'Canterbury Ortho', codePrefix: 'COS', billingName: 'COS Ltd', email: 'a@cos.example', deliveryMethod: 'email' }
const BARE_GROUP: Party = { id: 'py-bare', kind: 'surgeonGroup', name: 'Merivale', codePrefix: 'MER' }
const ANAES: Party = { id: 'py-anae', kind: 'anaesthetist', name: 'Dr Souter', codePrefix: 'SOUTER' }
const INSURER: Party = { id: 'py-nib', kind: 'insurer', name: 'nib', codePrefix: 'NIB', billingName: 'nib nz', email: 'c@nib.example', deliveryMethod: 'email' }
const PARTIES = Object.fromEntries([HOSPITAL, AA, GROUP, BARE_GROUP, ANAES, INSURER].map((p) => [p.id, p]))
const NO_CONTRACT: Contract = mkContract({ id: 'ct-none', aaCode: 'AA-RVG', name: 'No contract · RVG', holderId: AA.id, billsTo: 'payer', anaesthetistMayOverridePrice: true, systemRole: 'noContractRvg' })

function ctx(overrides: Partial<ContractRefusalContext> = {}, contracts: Contract[] = [NO_CONTRACT]): ContractRefusalContext {
  return {
    parties: PARTIES,
    contracts: Object.fromEntries(contracts.map((c) => [c.id, c])),
    surgeonIds: new Set(['surg-1', 'surg-2']),
    anaesthetistIds: new Set(['34821']),
    ...overrides,
  }
}

const code = (next: Contract, c: ContractRefusalContext = ctx()) => contractRefusal(next, c)?.code ?? null

describe('contractRefusal: the save guards (AR-58 5.10)', () => {
  it('passes a plain hospital RVG Contract', () => {
    expect(code(mkContract())).toBeNull()
  })

  it('1: the AA code is required and unique, ignoring case and spaces', () => {
    expect(code(mkContract({ aaCode: ' ' }))).toBe('aaCodeRequired')
    expect(code(mkContract({ id: 'c2', aaCode: 'aa-rvg' }))).toBe('aaCodeTaken')
  })

  it('3: the rate above zero, the discount between 0 and 100', () => {
    expect(code(mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 0 } }))).toBe('rateAboveZero')
    expect(code(mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 26.5 } }))).toBeNull()
    expect(code(mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 0 } }))).toBe('discountRange')
    expect(code(mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 100 } }))).toBe('discountRange')
    expect(code(mkContract({ pricing: { kind: 'rvgDiscount', discountPct: 10 } }))).toBeNull()
  })

  it('4: a prepaid Contract is never priced from RVG units and always bills the payer (D23)', () => {
    const prepaid = mkContract({ holderId: ANAES.id, billsTo: 'payer', linkedAnaesthetistId: '34821', prepaid: true })
    expect(code(prepaid)).toBe('prepaidNotRvg')
    expect(code({ ...prepaid, pricing: { kind: 'fixed' } })).toBeNull()
    expect(code(mkContract({ holderId: GROUP.id, linkedSurgeonIds: ['surg-1'], prepaid: true, pricing: { kind: 'fixed' } }))).toBe('prepaidBillsPayer')
  })

  it('5: the override only on an RVG kind, so never on a fixed price', () => {
    expect(code(mkContract({ anaesthetistMayOverridePrice: true }))).toBeNull()
    expect(code(mkContract({ anaesthetistMayOverridePrice: true, pricing: { kind: 'fixed' } }))).toBe('overrideOnlyRvg')
  })

  it('6: the office never chooses open price, nor makes a system Contract', () => {
    expect(code(mkContract({ pricing: { kind: 'open' } }))).toBe('openNotChosen')
    expect(code(mkContract({ systemRole: 'noContractRvg' }))).toBe('systemRoleNotChosen')
  })

  it('8: the holder exists, and a holder it bills has its billing details (A43)', () => {
    expect(code(mkContract({ holderId: 'py-none' }))).toBe('holderMissing')
    expect(code(mkContract({ holderId: BARE_GROUP.id, linkedSurgeonIds: ['surg-1'] }))).toBe('holderBillingDetails')
    expect(code(mkContract({ holderId: BARE_GROUP.id, linkedSurgeonIds: ['surg-1'], billsTo: 'payer' }))).toBeNull()
  })

  it('9, 11, 12: links exist; none on a hospital-held Contract; at least one on a surgeon, group or anaesthetist one', () => {
    expect(code(mkContract({ linkedSurgeonIds: ['surg-1'] }))).toBe('noLinksOnHospital')
    expect(code(mkContract({ holderId: GROUP.id }))).toBe('linkRequired')
    expect(code(mkContract({ holderId: GROUP.id, linkedSurgeonIds: ['surg-9'] }))).toBe('linkUnknown')
    expect(code(mkContract({ holderId: GROUP.id, linkedSurgeonIds: ['surg-1', 'surg-2'] }))).toBeNull()
    expect(code(mkContract({ holderId: INSURER.id }))).toBeNull()
  })

  it('10: AA- and anaesthetist-held Contracts bill the payer (A40)', () => {
    expect(code(mkContract({ holderId: ANAES.id, linkedAnaesthetistId: '34821' }))).toBe('holderBillsPayer')
    expect(code(mkContract({ holderId: ANAES.id, linkedAnaesthetistId: '34821', billsTo: 'payer' }))).toBeNull()
  })

  it('13: holder, prepaid and the pricing kind are fixed after creation, even through a raw patch', () => {
    const prev = mkContract()
    expect(code({ ...prev, holderId: INSURER.id }, ctx({ prev }))).toBe('holderFixed')
    expect(code({ ...prev, prepaid: true }, ctx({ prev }))).toBe('prepaidFixed')
    expect(code({ ...prev, pricing: { kind: 'rvgContractRate', unitRate: 20 } }, ctx({ prev }))).toBe('pricingKindFixed')
    // The rate itself is an edit in place.
    const rate = mkContract({ pricing: { kind: 'rvgContractRate', unitRate: 93.47 } })
    expect(code({ ...rate, pricing: { kind: 'rvgContractRate', unitRate: 95 } }, ctx({ prev: rate }))).toBeNull()
  })

  it('14: No contract · RVG changes only its name and AA code, and is never disabled', () => {
    const prev = NO_CONTRACT
    expect(code({ ...prev, name: 'No contract (RVG)', aaCode: 'AA-RVG1' }, ctx({ prev }))).toBeNull()
    expect(code({ ...prev, anaesthetistMayOverridePrice: false }, ctx({ prev }))).toBe('systemFixed')
    expect(code({ ...prev, status: 'disabled' }, ctx({ prev }))).toBe('systemNeverDisabled')
  })

  it('every refusal is one sentence with no dashes', () => {
    for (const message of Object.values(CONTRACT_REFUSAL_MESSAGES)) {
      expect(message).toMatch(/^[A-Z].*\.$/)
      expect(message).not.toMatch(/[–—]/)
    }
  })
})

describe('nextAaCode', () => {
  it('numbers each prefix from the highest code over every Contract, never reusing one', () => {
    expect(nextAaCode('STG', [])).toBe('STG-001')
    expect(nextAaCode('STG', ['STG-001', 'STG-007', 'SX-009', 'STGX-020'])).toBe('STG-008')
    expect(nextAaCode('AA', ['AA-RVG'])).toBe('AA-001')
  })
})

describe('contractSearch', () => {
  const contracts = Object.fromEntries(
    [
      NO_CONTRACT,
      mkContract({ id: 'c-sxap', aaCode: 'SX-002', name: 'Southern Cross Affiliated Provider' }),
      mkContract({ id: 'c-cos', aaCode: 'COS-001', name: 'ACC orthopaedic services', holderId: GROUP.id, linkedSurgeonIds: ['surg-1'], holderReference: 'ACC 04' }),
      mkContract({ id: 'c-off', aaCode: 'STG-009', name: 'Old rate', status: 'disabled' }),
    ].map((c) => [c.id, c]),
  )

  it('matches name, holder reference code and AA code, ignoring case and spaces', () => {
    const c = contracts['c-cos']!
    expect(contractMatchesQuery(c, 'cos-001')).toBe(true)
    expect(contractMatchesQuery(c, 'ACC04')).toBe(true)
    expect(contractMatchesQuery(c, 'ortho paedic')).toBe(true)
    expect(contractMatchesQuery(c, 'unisports')).toBe(false)
  })

  it('shows Active by default, No contract · RVG first; Disabled and All on request; narrows by holder', () => {
    expect(contractSearch('', { contracts, parties: PARTIES }).map((c) => c.id)).toEqual(['ct-none', 'c-cos', 'c-sxap'])
    expect(contractSearch('', { contracts, parties: PARTIES, filters: { status: 'disabled' } }).map((c) => c.id)).toEqual(['c-off'])
    expect(contractSearch('', { contracts, parties: PARTIES, filters: { status: 'all' } })).toHaveLength(4)
    expect(contractSearch('', { contracts, parties: PARTIES, filters: { holderId: GROUP.id } }).map((c) => c.id)).toEqual(['c-cos'])
    expect(contractSearch('affiliated', { contracts, parties: PARTIES }).map((c) => c.id)).toEqual(['c-sxap'])
    expect(contractSearch('nothing like it', { contracts, parties: PARTIES })).toEqual([])
  })
})

describe('noContractRvg and isRvgKind', () => {
  it('finds the one system Contract by role, and refuses none or two', () => {
    expect(noContractRvg({ a: NO_CONTRACT, b: mkContract() })).toBe(NO_CONTRACT)
    expect(() => noContractRvg({ b: mkContract() })).toThrow()
    expect(() => noContractRvg({ a: NO_CONTRACT, b: { ...NO_CONTRACT, id: 'b' } })).toThrow()
  })

  it('treats the three RVG kinds as RVG and fixed or open as not', () => {
    expect(['rvgAnaesthetistRate', 'rvgContractRate', 'rvgDiscount', 'fixed', 'open'].map((k) => isRvgKind(k as never))).toEqual([true, true, true, false, false])
  })
})

describe('linkFits (US-04.2.1; A38, A39)', () => {
  it("offers a hospital's Contract only on its hospital's Lists", () => {
    expect(linkFits(mkContract(), HOSPITAL, { hospitalId: 'hosp-1' })).toBe(true)
    expect(linkFits(mkContract(), HOSPITAL, { hospitalId: 'hosp-2' })).toBe(false)
  })
  it("offers a linked Contract on its surgeons' or anaesthetist's Bookings only", () => {
    const linked = mkContract({ holderId: GROUP.id, linkedSurgeonIds: ['surg-1', 'surg-2'] })
    expect(linkFits(linked, GROUP, { surgeonId: 'surg-2' })).toBe(true)
    expect(linkFits(linked, GROUP, { surgeonId: 'surg-3' })).toBe(false)
    const own = mkContract({ holderId: ANAES.id, linkedAnaesthetistId: '34821' })
    expect(linkFits(own, ANAES, { anaesthetistId: '34821' })).toBe(true)
    expect(linkFits(own, ANAES, { anaesthetistId: '99999' })).toBe(false)
  })
  it('offers an unlinked AA, insurer or funder Contract on every List', () => {
    expect(linkFits(NO_CONTRACT, AA, {})).toBe(true)
    expect(linkFits(mkContract({ holderId: INSURER.id }), INSURER, { hospitalId: 'hosp-9' })).toBe(true)
  })
})

describe('interimRouteContract (INTERIM until Phase 20)', () => {
  it("is the Party's first Active plain RVG Contract by AA code, never a rate, linked or system Contract", () => {
    const plain = mkContract({ id: 'plain', aaCode: 'TST-002' })
    const rate = mkContract({ id: 'rate', aaCode: 'TST-001', pricing: { kind: 'rvgContractRate', unitRate: 25 } })
    const off = mkContract({ id: 'off', aaCode: 'TST-000', status: 'disabled' })
    const all = Object.fromEntries([plain, rate, off, NO_CONTRACT].map((c) => [c.id, c]))
    expect(interimRouteContract(all, HOSPITAL.id)?.id).toBe('plain')
    expect(interimRouteContract(all, AA.id)).toBeUndefined()
    expect(interimRouteContract(all, undefined)).toBeUndefined()
  })
})

describe('noPriceInForce (the interim of 19a\'s "no range in force")', () => {
  const fixed = mkContract({ id: 'con-3', pricing: { kind: 'fixed' } })
  const prices: ContractPrice[] = [{ id: 'p1', contractId: 'con-3', rvgBaseCode: 'GA10', price: 800 }]
  it('is true only for a primary procedure on a fixed Contract with no row for it', () => {
    expect(noPriceInForce(fixed, mkProcedure({ rvgBaseCode: 'GA10' }), { procedureOrdinal: 1, prices })).toBe(false)
    expect(noPriceInForce(fixed, mkProcedure({ rvgBaseCode: 'SP07' }), { procedureOrdinal: 1, prices })).toBe(true)
    expect(noPriceInForce(fixed, mkProcedure({ rvgBaseCode: 'SP07', isAdditional: true }), { procedureOrdinal: 2, prices })).toBe(false)
    expect(noPriceInForce(mkContract(), mkProcedure({ rvgBaseCode: 'SP07' }), { procedureOrdinal: 1, prices })).toBe(false)
    expect(noPriceInForceMessage('COS ACC fixed fees')).toBe('No price in force for this procedure under COS ACC fixed fees.')
  })
})

describe('matchContractPrice — most-specific match wins', () => {
  const prices: ContractPrice[] = [
    { id: 'p-generic', contractId: 'con-3', price: 900 },
    { id: 'p-code', contractId: 'con-3', rvgBaseCode: 'GA10', price: 800 },
    { id: 'p-code-surgeon', contractId: 'con-3', rvgBaseCode: 'GA10', surgeonId: 'surg-1', price: 750 },
    { id: 'p-code-ord2', contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 2, price: 400 },
  ]

  it('ignores other contracts', () => {
    expect(matchContractPrice(prices, { contractId: 'con-x', rvgBaseCode: 'GA10' })).toBeUndefined()
  })

  it('falls through to the generic row when nothing more specific matches', () => {
    expect(matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'XX99' })?.id).toBe('p-generic')
  })

  it('prefers the row matching more keys', () => {
    expect(
      matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 1 })?.id,
    ).toBe('p-code')
    expect(
      matchContractPrice(prices, {
        contractId: 'con-3',
        rvgBaseCode: 'GA10',
        surgeonId: 'surg-1',
        procedureOrdinal: 1,
      })?.id,
    ).toBe('p-code-surgeon')
  })

  it('matches 2nd-procedure ordinal rows', () => {
    expect(
      matchContractPrice(prices, { contractId: 'con-3', rvgBaseCode: 'GA10', procedureOrdinal: 2 })?.id,
    ).toBe('p-code-ord2')
  })

  it('returns undefined when no row matches (the fixed-price BTM fallback trigger)', () => {
    const ordinalOnly: ContractPrice[] = [
      { id: 'p-ord1', contractId: 'con-3', procedureOrdinal: 1, price: 500 },
    ]
    expect(
      matchContractPrice(ordinalOnly, { contractId: 'con-3', procedureOrdinal: 2 }),
    ).toBeUndefined()
  })
})

describe('review-pass fixes (catch-up Phase 18)', () => {
  it('nextAaCode counts a code an office typed with a stray space', () => {
    expect(nextAaCode('CES', ['CES-001', 'CES- 002'])).toBe('CES-003')
  })

  it('interimRouteContract falls back to a Disabled plain RVG Contract (a Disabled Contract still bills, D81)', () => {
    const off = mkContract({ id: 'off', status: 'disabled' })
    expect(interimRouteContract({ off }, HOSPITAL.id)?.id).toBe('off')
    const on = mkContract({ id: 'on', aaCode: 'TST-009' })
    expect(interimRouteContract({ off, on }, HOSPITAL.id)?.id).toBe('on')
  })
})
