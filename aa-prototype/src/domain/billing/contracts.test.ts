import { describe, expect, it } from 'vitest'
import {
  CONTRACT_REFUSAL_MESSAGES,
  contractMatchesQuery,
  contractRefusal,
  contractSearch,
  isRvgKind,
  linkFits,
  nextAaCode,
  noContractRvg,
  type Contract,
  type ContractRefusalContext,
} from './contracts'
import { mkContract, mkParty } from './fixtures'
import type { ContractPricing, Party, RvgGroup } from '../types'
import { needsPriceMessage } from './priceRanges'
import { procedureNeedsPrice } from './procedurePrice'

const needsPriceUntyped = (c: Contract, d: string) => procedureNeedsPrice(c, d, {})

/** A fixed price with one range from 1 Jan 2026. */
const FIXED: ContractPricing = { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 500 }] }
const H3: RvgGroup = { id: 'rg-h3', code: 'H3', description: 'Moderate procedures', anatomy: 'Head', baseUnits: 6, modifierUnits: 0, retired: false, includedModifierIds: [] }
const OLD: RvgGroup = { id: 'rg-old', code: 'X9', description: 'Retired row', anatomy: 'Head', baseUnits: 4, modifierUnits: 0, retired: true, includedModifierIds: [] }
const GROUPS = { [H3.id]: H3, [OLD.id]: OLD }

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
    specialtyIds: new Set(['spc-ortho', 'spc-gen']),
    fundingTagIds: new Set(['tag-acc', 'tag-sxap']),
    rvgGroups: GROUPS,
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
    expect(code({ ...prepaid, pricing: FIXED })).toBeNull()
    expect(code(mkContract({ holderId: GROUP.id, linkedSurgeonIds: ['surg-1'], prepaid: true, pricing: FIXED }))).toBe('prepaidBillsPayer')
  })

  it('5: the override only on an RVG kind, so never on a fixed price', () => {
    expect(code(mkContract({ anaesthetistMayOverridePrice: true }))).toBeNull()
    expect(code(mkContract({ anaesthetistMayOverridePrice: true, pricing: FIXED }))).toBe('overrideOnlyRvg')
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

describe('procedureNeedsPrice with nothing typed: "Needs a price" (catch-up Phase 19a, re-homed in 24)', () => {
  const fixed = mkContract({ id: 'con-3', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-04-01', price: 800 }] } })
  it('is true on a fixed price before its first range, and on any open price; never on an RVG kind', () => {
    expect(needsPriceUntyped(fixed, '2026-03-31')).toBe(true)
    expect(needsPriceUntyped(fixed, '2026-04-01')).toBe(false)
    expect(needsPriceUntyped(fixed, '2027-03-11')).toBe(false)
    // Catch-up Phase 18a: an open-price Contract has no price of its own, so nothing bills one silently.
    expect(needsPriceUntyped(mkContract({ pricing: { kind: 'open' } }), '2026-11-24')).toBe(true)
    expect(needsPriceUntyped(mkContract(), '2020-05-06')).toBe(false)
    expect(needsPriceMessage(fixed, '2026-11-19')).toBe('Needs a price: no price range in force on 19 Nov 2026.')
    expect(needsPriceMessage({ ...fixed, name: 'COS ACC fixed fees' }, '2026-11-19', { named: true })).toBe('Needs a price: no price range in force on 19 Nov 2026 under COS ACC fixed fees.')
    expect(needsPriceMessage(mkContract({ name: 'No contract · Fixed price', pricing: { kind: 'open' } }), '2026-11-19')).toBe('Needs a price: No contract · Fixed price has no price of its own.')
  })
})

describe('the fixed price\'s ranges and the default RVG code in the save guard (catch-up Phase 19a)', () => {
  const fixedWith = (ranges: { startISO: string; price: number }[], extra: Partial<Contract> = {}) =>
    mkContract({ pricing: { kind: 'fixed', ranges }, ...extra })
  const prepaidList = { holderId: ANAES.id, billsTo: 'payer' as const, linkedAnaesthetistId: '34821', prepaid: true }

  it('a fixed price needs at least one range, unique starts and prices of 0 or more', () => {
    expect(code(fixedWith([]))).toBe('noRange')
    expect(code(fixedWith([{ startISO: '2026-10-05', price: 3100 }, { startISO: '2026-10-05', price: 3200 }]))).toBe('duplicateStart')
    expect(contractRefusal(fixedWith([{ startISO: '2026-10-05', price: 3100 }, { startISO: '2026-10-05', price: 3200 }]), ctx())?.message).toBe(
      'Another price range already starts on 5 Oct 2026.',
    )
    expect(code(fixedWith([{ startISO: '2026-10-05', price: -1 }]))).toBe('negativePrice')
    // 0 gives a no-charge invoice (AR-58 2.4) on a Contract that is not prepaid.
    expect(code(fixedWith([{ startISO: '2026-10-05', price: 0 }]))).toBeNull()
  })

  it('every range above zero on a prepaid Contract (OQ-92, D30)', () => {
    expect(code(fixedWith([{ startISO: '2026-01-01', price: 1200 }], prepaidList))).toBeNull()
    expect(code(fixedWith([{ startISO: '2026-01-01', price: 1200 }, { startISO: '2027-01-05', price: 0 }], prepaidList))).toBe('prepaidPriceNotAboveZero')
    expect(code(fixedWith([{ startISO: '2026-01-01', price: Number.NaN }], prepaidList))).toBe('prepaidPriceNotAboveZero')
    expect(contractRefusal(fixedWith([{ startISO: '2026-01-01', price: 0 }], prepaidList), ctx())?.message).toBe("A prepaid Contract's price must be above zero.")
  })

  it('the default RVG code must be a row on the RVG groups; a retired one only if already set', () => {
    expect(code(mkContract({ defaultRvgGroupId: H3.id }))).toBeNull()
    expect(code(mkContract({ defaultRvgGroupId: 'rg-missing' }))).toBe('rvgGroupNotFound')
    expect(code(mkContract({ defaultRvgGroupId: OLD.id }))).toBe('rvgGroupRetired')
    const kept = mkContract({ defaultRvgGroupId: OLD.id })
    expect(code(kept, ctx({ prev: kept }, [NO_CONTRACT, kept]))).toBeNull()
  })

  it('a system Contract may change its invoice description, nothing else new', () => {
    expect(code({ ...NO_CONTRACT, invoiceDescription: 'Anaesthesia services' }, ctx({ prev: NO_CONTRACT }))).toBeNull()
    expect(code({ ...NO_CONTRACT, defaultRvgGroupId: H3.id }, ctx({ prev: NO_CONTRACT }))).toBe('systemFixed')
  })
})

describe('contractMatchesQuery: invoice description and default RVG code (catch-up Phase 19a, US-04.2.18)', () => {
  const cataract = mkContract({
    name: 'Cataract, inclusive of Standard Intraocular Lens (Unilateral)',
    holderReference: 'HNZCATall',
    invoiceDescription: 'Cataract - inclusive of Standard Intraocular Lens (Unilateral)',
    defaultRvgGroupId: H3.id,
  })
  const faceLift = mkContract({ id: 'c-face', name: 'Face lift', invoiceDescription: 'Face lift under general anaesthetic', defaultRvgGroupId: H3.id })

  it('"CAT" finds the cataract item by name and by holder reference code', () => {
    expect(contractMatchesQuery(cataract, 'CAT', GROUPS)).toBe(true)
    expect(contractMatchesQuery(mkContract({ name: 'Other', holderReference: 'HNZCATall' }), 'cat', GROUPS)).toBe(true)
  })

  it('a word of the invoice description finds the Contract', () => {
    expect(contractMatchesQuery(faceLift, 'general anaesthetic', GROUPS)).toBe(true)
  })

  it('the default RVG code finds the Contract by its whole code, not a part of one', () => {
    const lift = mkContract({ name: 'Lift', aaCode: 'MER-001', defaultRvgGroupId: H3.id })
    expect(contractMatchesQuery(lift, 'h3', GROUPS)).toBe(true)
    expect(contractMatchesQuery(lift, 'H', GROUPS)).toBe(false)
    expect(contractMatchesQuery(lift, 'H3', undefined)).toBe(false)
  })

  it('contractSearch passes the RVG groups through', () => {
    const contracts = Object.fromEntries([NO_CONTRACT, faceLift].map((c) => [c.id, c]))
    expect(contractSearch('H3', { contracts, parties: PARTIES, rvgGroups: GROUPS }).map((c) => c.id)).toEqual(['c-face'])
  })
})

describe('review-pass fixes (catch-up Phase 18)', () => {
  it('nextAaCode counts a code an office typed with a stray space', () => {
    expect(nextAaCode('CES', ['CES-001', 'CES- 002'])).toBe('CES-003')
  })
})
