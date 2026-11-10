import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import {
  addPriceRange,
  createContract,
  deletePriceRange,
  disableContract,
  editContract,
  editPriceRange,
  enableContract,
  type ContractInput,
} from './contractActions'
import { createParty } from './partyActions'
import { createHospital } from './mastersActions'
import * as contractActions from './contractActions'
import { CONTRACT_REFUSAL_MESSAGES } from '../domain/billing/contracts'
import { CONTRACT, PARTY, RVG_GROUP, SURG } from '../domain/seed'
import { PRICED_ITEM } from '../domain/seed/pricedItems'

/** A fixed price with one range (catch-up Phase 19a: every fixed price has at least one). */
const FIXED = { kind: 'fixed' as const, ranges: [{ startISO: '2026-01-01', price: 500 }] }

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
    expect(refuse({ ...RATE, pricing: FIXED, anaesthetistMayOverridePrice: true })).toBe(CONTRACT_REFUSAL_MESSAGES.overrideOnlyRvg)
    // A surgeon-group Contract with no link.
    expect(refuse({ ...RATE, holderId: PARTY.cos })).toBe(CONTRACT_REFUSAL_MESSAGES.linkRequired)
    // Links on a hospital-held Contract.
    expect(refuse({ ...RATE, linkedSurgeonIds: [SURG.hale] })).toBe(CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital)
    // A holder-billed prepaid Contract.
    expect(refuse({ ...RATE, holderId: PARTY.cos, linkedSurgeonIds: [SURG.hale], prepaid: true, pricing: FIXED })).toBe(CONTRACT_REFUSAL_MESSAGES.prepaidBillsPayer)
    // Open price is never chosen by the office.
    expect(refuse({ ...RATE, pricing: { kind: 'open' } })).toBe(CONTRACT_REFUSAL_MESSAGES.openNotChosen)
    // Billing a Party with no billing details (A43).
    expect(refuse({ ...RATE, holderId: PARTY.merivale, linkedSurgeonIds: [SURG.lim] })).toBe(CONTRACT_REFUSAL_MESSAGES.holderBillingDetails)
  })

  it('a valid prepaid fixed price billing the payer saves', () => {
    const api = createAppStore()
    const o = createContract(api, OFFICE, { ...RATE, name: 'Cataract prepay', holderId: PARTY.souter, billsTo: 'payer', linkedAnaesthetistId: '34821', prepaid: true, pricing: FIXED })
    // Dr Souter's seeded price list holds SOUTER-001 to SOUTER-003 (catch-up Phase 19a).
    expect(o.ok && o.value.contract.aaCode).toBe('SOUTER-004')
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
    expect(editContract(api, OFFICE, CONTRACT.healthNz, { pricing: FIXED })).toMatchObject({ ok: false, code: 'pricingKindFixed' })
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

describe('price ranges (catch-up Phase 19a; US-04.2.15, US-04.2.14)', () => {
  const FACE = PRICED_ITEM.merFaceLift
  const rangesOf = (api: ReturnType<typeof createAppStore>, id: string) => {
    const c = api.getState().masters.contracts[id]
    return c?.pricing.kind === 'fixed' ? c.pricing.ranges : []
  }

  it("adds a backdated range on Merivale's Face lift, audited in words", () => {
    const api = createAppStore()
    expect(addPriceRange(api, OFFICE, FACE, { startISO: '2026-07-01', price: 3200 }).ok).toBe(true)
    expect(rangesOf(api, FACE)).toEqual([
      { startISO: '2026-06-01', price: 3100 },
      { startISO: '2026-07-01', price: 3200 },
    ])
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'contract.priceRange.add',
      entityType: 'contract',
      entityId: FACE,
      after: { contract: 'Face lift', priceRange: 'From 1 Jul 2026, $3,200.00' },
    })
  })

  it('corrects a range in place and deletes one entered in error, both audited', () => {
    const api = createAppStore()
    addPriceRange(api, OFFICE, FACE, { startISO: '2026-10-01', price: 3200 })
    expect(editPriceRange(api, OFFICE, FACE, '2026-10-01', { startISO: '2026-10-01', price: 3250 }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'contract.priceRange.update',
      before: { priceRange: 'From 1 Oct 2026, $3,200.00' },
      after: { priceRange: 'From 1 Oct 2026, $3,250.00' },
    })
    expect(deletePriceRange(api, OFFICE, FACE, '2026-10-01').ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'contract.priceRange.delete', before: { priceRange: 'From 1 Oct 2026, $3,250.00' } })
    expect(rangesOf(api, FACE)).toEqual([{ startISO: '2026-06-01', price: 3100 }])
  })

  it('refuses each rule with its sentence, and audits nothing refused', () => {
    const api = createAppStore()
    const auditBefore = api.getState().audit.length
    expect(addPriceRange(api, OFFICE, FACE, { startISO: '2026-06-01', price: 3300 })).toMatchObject({
      ok: false,
      message: 'Another price range already starts on 1 Jun 2026.',
    })
    expect(deletePriceRange(api, OFFICE, FACE, '2026-06-01')).toMatchObject({ ok: false, message: 'A Contract keeps at least one price range.' })
    expect(addPriceRange(api, OFFICE, PRICED_ITEM.souterRhinoplasty, { startISO: '2026-12-01', price: 0 })).toMatchObject({
      ok: false,
      message: "A prepaid Contract's price must be above zero.",
    })
    expect(addPriceRange(api, OFFICE, PRICED_ITEM.souterRhinoplasty, { startISO: '2026-12-01', price: Number.NaN })).toMatchObject({
      ok: false,
      message: "A prepaid Contract's price must be above zero.",
    })
    expect(addPriceRange(api, OFFICE, CONTRACT.sxap, { startISO: '2026-12-01', price: 30 })).toMatchObject({
      ok: false,
      message: 'Only a fixed-price Contract has price ranges.',
    })
    expect(editPriceRange(api, OFFICE, FACE, '2026-01-01', { startISO: '2026-01-01', price: 1 })).toMatchObject({ ok: false, code: 'rangeMissing' })
    expect(api.getState().audit.length).toBe(auditBefore)
    expect(rangesOf(api, FACE)).toEqual([{ startISO: '2026-06-01', price: 3100 }])
  })

  it('a save that changes nothing writes no audit entry; one rounding on every path', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    expect(editPriceRange(api, OFFICE, FACE, '2026-06-01', { startISO: '2026-06-01', price: 3100 }).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
    expect(addPriceRange(api, OFFICE, FACE, { startISO: '2026-10-01', price: 1.005 }).ok).toBe(true)
    expect(rangesOf(api, FACE).at(-1)).toEqual({ startISO: '2026-10-01', price: 1.01 })
  })

  it('refuses a start that is not a calendar day', () => {
    expect(addPriceRange(createAppStore(), OFFICE, FACE, { startISO: '2027-02-30', price: 3200 })).toMatchObject({ ok: false, code: 'startRequired' })
  })

  it('a fixed price\'s ranges change only through the range actions, never a raw Contract edit', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, FACE, { pricing: { kind: 'fixed', ranges: [{ startISO: '2026-06-01', price: 1 }] } })).toMatchObject({ ok: false, code: 'useRangeActions' })
    expect(rangesOf(api, FACE)).toEqual([{ startISO: '2026-06-01', price: 3100 }])
  })

  it('is office only: no anaesthetist edits a Contract, their own price list included', () => {
    const api = createAppStore()
    expect(addPriceRange(api, SOUTER, PRICED_ITEM.souterRhinoplasty, { startISO: '2026-12-01', price: 1400 })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(editPriceRange(api, SOUTER, PRICED_ITEM.souterRhinoplasty, '2026-01-01', { startISO: '2026-01-01', price: 1 })).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(deletePriceRange(api, SOUTER, PRICED_ITEM.souterRhinoplasty, '2026-09-01')).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(editContract(api, SOUTER, PRICED_ITEM.souterRhinoplasty, { name: 'Nose' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('a new fixed-price Contract needs its first range', () => {
    const api = createAppStore()
    const input: ContractInput = { ...RATE, name: 'Eyelid item', holderId: PARTY.ces, pricing: { kind: 'fixed', ranges: [] } }
    expect(createContract(api, OFFICE, input)).toMatchObject({ ok: false, code: 'noRange' })
    expect(createContract(api, OFFICE, { ...input, pricing: { kind: 'fixed', ranges: [{ startISO: '2026-04-01', price: 791.3 }] } }).ok).toBe(true)
  })
})

describe("the Contract's own fields (catch-up Phase 19a; US-04.2.18)", () => {
  it('sets and clears the invoice description and default RVG code, audited by name and code', () => {
    const api = createAppStore()
    expect(editContract(api, OFFICE, CONTRACT.sxap, { invoiceDescription: '  Anaesthesia, Southern Cross affiliated  ', defaultRvgGroupId: RVG_GROUP.h3! }).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.sxap]).toMatchObject({ invoiceDescription: 'Anaesthesia, Southern Cross affiliated', defaultRvgGroupId: RVG_GROUP.h3 })
    const entry = api.getState().audit.at(-1)!
    expect(entry.after).toMatchObject({ invoiceDescription: 'Anaesthesia, Southern Cross affiliated' })
    expect(String((entry.after as Record<string, unknown> | undefined)?.defaultRvgCode)).toMatch(/^H3 · /)
    expect(entry.before).toMatchObject({ invoiceDescription: 'None', defaultRvgCode: 'None' })
    expect(editContract(api, OFFICE, CONTRACT.sxap, { invoiceDescription: '', defaultRvgGroupId: null }).ok).toBe(true)
    expect(api.getState().masters.contracts[CONTRACT.sxap]).toMatchObject({ invoiceDescription: null, defaultRvgGroupId: null })
  })

  it('refuses a default RVG code that is not on the RVG groups', () => {
    expect(editContract(createAppStore(), OFFICE, CONTRACT.sxap, { defaultRvgGroupId: 'RG-NOPE' })).toMatchObject({ ok: false, code: 'rvgGroupNotFound' })
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
