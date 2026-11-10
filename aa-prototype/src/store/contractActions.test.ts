import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import {
  addContractPrice,
  createContract,
  disableContract,
  editContract,
  editContractPrice,
  enableContract,
  type ContractInput,
} from './contractActions'
import { createParty } from './partyActions'
import { createHospital } from './mastersActions'
import * as contractActions from './contractActions'
import { CONTRACT_REFUSAL_MESSAGES } from '../domain/billing/contracts'
import { CONTRACT, PARTY, RVG_GROUP, SURG } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' }

const RATE: ContractInput = {
  name: 'Southern Cross ACC rate',
  holderId: PARTY.sx,
  billsTo: 'holder',
  pricing: { kind: 'rvgContractRate', unitRate: 27 },
  prepaid: false,
  anaesthetistMayOverridePrice: false,
  linkedSurgeonIds: [],
}

describe('createContract', () => {
  it("stamps the next AA code for its holder, Active, audited with what it set", () => {
    const api = createAppStore()
    const outcome = createContract(api, OFFICE, RATE)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const c = outcome.value.contract
    expect(c).toMatchObject({ id: 'CTN001', aaCode: 'SX-003', status: 'active', billsTo: 'holder' })
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ action: 'contract.create', entityId: c.id, after: { aaCode: 'SX-003', pricing: { kind: 'rvgContractRate', unitRate: 27 } } })
    // A second one for the same holder takes the next number; codes are never reused.
    const again = createContract(api, OFFICE, { ...RATE, name: 'Another' })
    expect(again.ok && again.value.contract.aaCode).toBe('SX-004')
  })

  it('refuses each save guard with its one sentence', () => {
    const api = createAppStore()
    const refuse = (input: ContractInput) => {
      const o = createContract(api, OFFICE, input)
      return o.ok ? null : o.message
    }
    // A prepaid Contract priced from RVG units.
    expect(refuse({ ...RATE, holderId: PARTY.souter, billsTo: 'payer', linkedAnaesthetistId: '34821', prepaid: true })).toBe(CONTRACT_REFUSAL_MESSAGES.prepaidNotRvg)
    // The override on a fixed price.
    expect(refuse({ ...RATE, pricing: { kind: 'fixed' }, anaesthetistMayOverridePrice: true })).toBe(CONTRACT_REFUSAL_MESSAGES.overrideOnlyRvg)
    // A surgeon-group Contract with no link.
    expect(refuse({ ...RATE, holderId: PARTY.cos })).toBe(CONTRACT_REFUSAL_MESSAGES.linkRequired)
    // Links on a hospital-held Contract.
    expect(refuse({ ...RATE, linkedSurgeonIds: [SURG.hale] })).toBe(CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital)
    // A holder-billed prepaid Contract.
    expect(refuse({ ...RATE, holderId: PARTY.cos, linkedSurgeonIds: [SURG.hale], prepaid: true, pricing: { kind: 'fixed' } })).toBe(CONTRACT_REFUSAL_MESSAGES.prepaidBillsPayer)
    // Open price is never chosen by the office.
    expect(refuse({ ...RATE, pricing: { kind: 'open' } })).toBe(CONTRACT_REFUSAL_MESSAGES.openNotChosen)
    // Billing a Party with no billing details (A43).
    expect(refuse({ ...RATE, holderId: PARTY.merivale, linkedSurgeonIds: [SURG.lim] })).toBe(CONTRACT_REFUSAL_MESSAGES.holderBillingDetails)
  })

  it('a valid prepaid fixed price billing the payer saves', () => {
    const api = createAppStore()
    const o = createContract(api, OFFICE, { ...RATE, name: 'Cataract prepay', holderId: PARTY.souter, billsTo: 'payer', linkedAnaesthetistId: '34821', prepaid: true, pricing: { kind: 'fixed' } })
    expect(o.ok && o.value.contract.aaCode).toBe('SOUTER-001')
  })

  it('is office only', () => {
    expect(createContract(createAppStore(), SOUTER, RATE)).toMatchObject({ ok: false, code: 'officeOnly' })
  })
})

describe('editContract in place', () => {
  it('edits the Unisports rate in place, audited with the rate before and after', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.unisports, { pricing: { kind: 'rvgContractRate', unitRate: 95 } }).ok).toBe(true)
    const state = api.getState()
    expect(state.masters.contracts[CONTRACT.unisports]?.pricing).toEqual({ kind: 'rvgContractRate', unitRate: 95 })
    expect(state.audit.at(-1)).toMatchObject({
      action: 'contract.update',
      entityId: CONTRACT.unisports,
      before: { pricing: { kind: 'rvgContractRate', unitRate: 93.47 } },
      after: { pricing: { kind: 'rvgContractRate', unitRate: 95 } },
    })
  })

  it('the AA code stays unique when edited, and a holder reference code is kept or cleared', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.sxap, { aaCode: 'sx-001' })).toMatchObject({ ok: false, code: 'aaCodeTaken' })
    expect(editContract(api, OFFICE, CONTRACT.sxap, { aaCode: 'sx-sxap', holderReference: ' AP0126 ' }).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.sxap]).toMatchObject({ aaCode: 'SX-SXAP', holderReference: 'AP0126' })
    expect(editContract(api, OFFICE, CONTRACT.sxap, { holderReference: '' }).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.sxap]?.holderReference).toBeUndefined()
  })

  it('refuses a change to prepaid, the pricing kind or the holder, even as a raw patch', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { prepaid: true })).toMatchObject({ ok: false, code: 'prepaidFixed' })
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { pricing: { kind: 'fixed' } })).toMatchObject({ ok: false, code: 'pricingKindFixed' })
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { holderId: PARTY.stg })).toMatchObject({ ok: false, code: 'holderFixed' })
    expect(api.getState().masters.contracts[CONTRACT.healthNz]?.pricing).toEqual({ kind: 'rvgContractRate', unitRate: 23 })
  })

  it('No contract · RVG changes only its name and AA code', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.noContractRvg, { name: 'No contract (RVG)' }).ok).toBe(true)
    expect(editContract(api, OFFICE, CONTRACT.noContractRvg, { anaesthetistMayOverridePrice: false })).toMatchObject({ ok: false, code: 'systemFixed' })
    expect(editContract(api, OFFICE, CONTRACT.noContractRvg, { billsTo: 'holder' })).toMatchObject({ ok: false, code: 'systemFixed' })
  })
})

describe('disable and enable, never delete', () => {
  it('disables and re-enables a Contract, each audited', () => {
    const api = createAppStore()
    expect(disableContract(api, OFFICE, CONTRACT.healthNz).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.healthNz]?.status).toBe('disabled')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'contract.disable', before: { status: 'active' }, after: { status: 'disabled' } })
    expect(enableContract(api, OFFICE, CONTRACT.healthNz).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.healthNz]?.status).toBe('active')
    expect(api.getState().audit.at(-1)?.action).toBe('contract.enable')
  })

  it('refuses to disable No contract · RVG, and there is no delete at all', () => {
    const api = createAppStore()
    expect(disableContract(api, OFFICE, CONTRACT.noContractRvg)).toMatchObject({ ok: false, code: 'systemNeverDisabled' })
    expect('deleteContract' in contractActions).toBe(false)
  })

  it('is office only', () => {
    expect(disableContract(createAppStore(), SOUTER, CONTRACT.healthNz)).toMatchObject({ ok: false, code: 'officeOnly' })
  })
})

describe('no Contract is created with a hospital or a Party (RV-06)', () => {
  it('adding a hospital, an insurer Party or a funder Party creates no Contract', () => {
    const api = createAppStore()
    const before = Object.keys(api.getState().masters.contracts).length
    expect(createHospital(api, OFFICE, 'Rangiora Day Surgery').ok).toBe(true)
    expect(createParty(api, OFFICE, { kind: 'insurer', name: 'Accuro', codePrefix: 'ACU' }).ok).toBe(true)
    expect(createParty(api, OFFICE, { kind: 'funder', name: 'Pharmac', codePrefix: 'PHA' }).ok).toBe(true)
    expect(Object.keys(api.getState().masters.contracts)).toHaveLength(before)
  })
})

describe('fixed-price rows (interim until Phase 19a)', () => {
  it('adds and edits a row on a fixed-price Contract only', () => {
    const api = createAppStore()
    const added = addContractPrice(api, OFFICE, { contractId: CONTRACT.cosFixed, rvgGroupId: RVG_GROUP.aaHipReplacement!, price: 1200 })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(editContractPrice(api, OFFICE, added.value.id, { price: 1250 }).ok).toBe(true)
    expect(api.getState().masters.contractPrices[added.value.id]?.price).toBe(1250)
    expect(addContractPrice(api, OFFICE, { contractId: CONTRACT.sxap, price: 100 })).toMatchObject({ ok: false, code: 'notFixedPrice' })
  })
})

describe('review-pass fixes (catch-up Phase 18)', () => {
  it('a raw patch with undefined values keeps the stored values instead of throwing', () => {
    const api = createAppStore()
    expect(() => editContract(api, OFFICE, CONTRACT.sxap, { linkedSurgeonIds: undefined, pricing: undefined, name: undefined } as never)).not.toThrow()
    expect(api.getState().masters.contracts[CONTRACT.sxap]).toMatchObject({ name: 'Southern Cross Affiliated Provider', pricing: { kind: 'rvgContractRate', unitRate: 26.5 } })
  })

  it('an edited AA code is stored without spaces, and the next code still skips it', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.sxap, { aaCode: 'SX- 003' }).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.sxap]?.aaCode).toBe('SX-003')
    const o = createContract(api, OFFICE, RATE)
    expect(o.ok && o.value.contract.aaCode).toBe('SX-004')
  })
})
