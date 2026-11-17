/**
 * The procedure stack's one pure module (catch-up Phase 20a; US-03.1.9,
 * US-03.1.2, US-02.5.7, US-08.4.6 and its ACs; D37, D73).
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import { PARTY } from '../seed'
import { RVG_GROUP } from '../seed/rvgGroups'
import type { Contract } from './contracts'
import type { CounterpartyRef, Procedure, ProcedureText } from '../types'
import {
  newerInvoiceDescription,
  pricingBasisFor,
  procedureLabel,
  procedureStackView,
  procedureTextKind,
  refreshInvoiceDescription,
  refreshedInvoiceDescriptionFor,
  replacesProcedureText,
  startingInvoiceDescription,
  whoIsInvoicedFor,
  type ProcedureStackCtx,
} from './procedureStack'
import { mkProcedure } from './fixtures'

const masters = buildSeed().masters
const STG_RVG = masters.contracts['CT-STG-D1']!

const SX_FIXED: Contract = {
  ...STG_RVG,
  id: 'CT-T-SXFIX',
  name: 'Southern Cross knee replacement',
  aaCode: 'SX-901',
  holderId: PARTY.sx,
  billsTo: 'holder',
  pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 3565 }] },
  invoiceDescription: null,
  defaultRvgGroupId: null,
}
const WITH_DESCRIPTION: Contract = { ...SX_FIXED, id: 'CT-T-DESC', invoiceDescription: 'Total knee replacement (Southern Cross)' }
const BLANK_DESCRIPTION: Contract = { ...SX_FIXED, id: 'CT-T-BLANK', invoiceDescription: '   ' }
const RATE: Contract = { ...STG_RVG, id: 'CT-T-RATE', pricing: { kind: 'rvgContractRate', unitRate: 26.5 } }
const DISCOUNT: Contract = { ...STG_RVG, id: 'CT-T-DISC', pricing: { kind: 'rvgDiscount', discountPct: 10 } }
const OPEN: Contract = { ...STG_RVG, id: 'CT-T-OPEN', name: 'Southern Cross · Fixed price', pricing: { kind: 'open' } }
const NO_CONTRACT = masters.contracts['CT-NO-CONTRACT']!

const contracts: Record<string, Contract> = {
  ...masters.contracts,
  [SX_FIXED.id]: SX_FIXED,
  [WITH_DESCRIPTION.id]: WITH_DESCRIPTION,
  [BLANK_DESCRIPTION.id]: BLANK_DESCRIPTION,
  [RATE.id]: RATE,
  [DISCOUNT.id]: DISCOUNT,
  [OPEN.id]: OPEN,
}

const nameOf = (ref: CounterpartyRef): string => `${ref.kind}:${ref.id}`
const ctx = (surface: ProcedureStackCtx['surface'] = 'anaesthetist'): ProcedureStackCtx => ({
  contracts,
  parties: masters.parties,
  rvgGroups: masters.rvgGroups,
  booking: { patientId: 'PT0001' },
  dateISO: '2026-08-04',
  surface,
  nameOf,
})

const rooms = (text: string): ProcedureText => ({ text, source: 'surgeonPdf', receivedAtISO: '2026-07-14T09:00:00' })
const hospital = (text: string): ProcedureText => ({ text, source: 'hospitalDownload', receivedAtISO: '2026-07-20T16:00:00' })
const entered = (text: string): ProcedureText => ({ text, source: 'phone', receivedAtISO: '2026-07-20T10:00:00' })

function proc(over: Partial<Procedure>): Procedure {
  const p = mkProcedure(over)
  return { ...p, invoiceDescription: over.invoiceDescription ?? refreshedInvoiceDescriptionFor(p, contracts) }
}

describe('procedureStackView', () => {
  it('US-03.1.9 "Contract summary": name, holder, who is invoiced and the fixed price; no RVG code on a fixed price with none picked', () => {
    const view = procedureStackView(proc({ procedureText: rooms('RTK'), governingContractId: SX_FIXED.id }), ctx())
    expect(view.contract).toMatchObject({ name: 'Southern Cross knee replacement', aaCode: 'SX-901', holderName: 'Southern Cross', basis: { kind: 'fixed', amount: 3565 } })
    expect(view.contract?.invoiced?.kind).toBe('holder')
    expect(view.rvg).toBeNull()
  })

  it('shows an RVG code picked for reference on a fixed price', () => {
    const view = procedureStackView(proc({ governingContractId: SX_FIXED.id, rvgGroupId: RVG_GROUP.ll4! }), ctx())
    expect(view.rvg).toEqual({ code: 'LL4', description: masters.rvgGroups[RVG_GROUP.ll4!]!.description })
  })

  it('"Not matched yet": no Contract keeps the text, the Contract part is null and the code is still to choose', () => {
    const view = procedureStackView(proc({ procedureText: hospital('lap appy ?conv to open') }), ctx())
    expect(view.contract).toBeNull()
    expect(view.procedureText?.text).toBe('lap appy ?conv to open')
    expect(view.rvg).toBe('toChoose')
  })

  it('an RVG-priced Contract with no code: "for the anaesthetist" on the office surface, "to choose" on the anaesthetist\'s', () => {
    const p = proc({ procedureText: rooms('WLE MM'), governingContractId: NO_CONTRACT.id })
    expect(procedureStackView(p, ctx('office')).rvg).toBe('forAnaesthetist')
    expect(procedureStackView(p, ctx('anaesthetist')).rvg).toBe('toChoose')
  })

  it("names who is invoiced through billablePartyForProcedure: the Procedure's payer on No contract · RVG (catch-up Phases 21, 22a)", () => {
    const p = proc({ governingContractId: NO_CONTRACT.id })
    expect(whoIsInvoicedFor(p, ctx())).toEqual({ name: 'patient:PT0001', kind: 'patient' })
    const guardian = proc({ governingContractId: NO_CONTRACT.id, payer: { kind: 'other', id: 'BP1', name: 'Hana Park' } })
    expect(whoIsInvoicedFor(guardian, ctx())).toEqual({ name: 'payer:BP1', kind: 'payer' })
  })
})

describe('pricingBasisFor: one member per pricing kind, the basis never the fee', () => {
  it.each([
    [NO_CONTRACT, {}, { kind: 'rvgAnaesthetistRate' }],
    [RATE, {}, { kind: 'rvgContractRate', perUnit: 26.5 }],
    [DISCOUNT, {}, { kind: 'rvgDiscount', percent: 10 }],
    [SX_FIXED, {}, { kind: 'fixed', amount: 3565 }],
    [OPEN, { enteredPrice: 2000 }, { kind: 'open', amount: 2000 }],
    [OPEN, {}, { kind: 'open', amount: null }],
  ] as const)('%s', (contract, over, basis) => {
    expect(pricingBasisFor(over, contract, '2026-08-04')).toEqual(basis)
  })

  it('a fixed price with no range in force on the date has no amount', () => {
    expect(pricingBasisFor({}, SX_FIXED, '2025-06-01')).toEqual({ kind: 'fixed', amount: null })
  })
})

describe('replacesProcedureText (US-02.5.7)', () => {
  it('a different text replaces; an identical one never does; a rooms\' text never replaces the hospital\'s', () => {
    expect(replacesProcedureText(rooms('RTK'), hospital('right total knee'))).toBe(true)
    expect(replacesProcedureText(hospital('right total knee'), hospital('right TKR'))).toBe(true)
    expect(replacesProcedureText(hospital('right total knee'), hospital('right total knee'))).toBe(false)
    expect(replacesProcedureText(hospital('right total knee'), rooms('RTK revised'))).toBe(false)
    expect(replacesProcedureText(rooms('RTK'), rooms('RTK, cemented'))).toBe(true)
    expect(replacesProcedureText(null, rooms('RTK'))).toBe(true)
    expect(replacesProcedureText(rooms('RTK'), hospital('   '))).toBe(false)
  })

  it('maps each source to rooms, hospital or entered', () => {
    expect(['surgeonPdf', 'email'].map((s) => procedureTextKind(s as 'email'))).toEqual(['rooms', 'rooms'])
    expect(['hospitalDownload', 'hospitalFeed'].map((s) => procedureTextKind(s as 'hospitalFeed'))).toEqual(['hospital', 'hospital'])
    expect(['phone', 'anaesthetist', 'unrecorded'].map((s) => procedureTextKind(s as 'phone'))).toEqual(['entered', 'entered', 'entered'])
  })
})

describe('startingInvoiceDescription: the order of defaults (US-08.4.6, D37)', () => {
  it('"Rooms\' description to start"', () => {
    expect(startingInvoiceDescription(rooms('lap chole +/- IOC'))).toEqual({ text: 'lap chole +/- IOC', origin: 'rooms' })
  })
  it('"Hospital\'s replaces it" (the text the hospital replaced is the text)', () => {
    expect(startingInvoiceDescription(hospital('lap chole'))).toEqual({ text: 'lap chole', origin: 'hospital' })
  })
  it('"No hospital description": the rooms\' stays', () => {
    expect(startingInvoiceDescription(rooms('RTK'), null)).toEqual({ text: 'RTK', origin: 'rooms' })
  })
  it('"Contract\'s description" takes the place of either text', () => {
    expect(startingInvoiceDescription(rooms('RTK'), WITH_DESCRIPTION.invoiceDescription)).toEqual({ text: 'Total knee replacement (Southern Cross)', origin: 'contract' })
    expect(startingInvoiceDescription(hospital('right total knee'), WITH_DESCRIPTION.invoiceDescription)).toMatchObject({ origin: 'contract' })
  })
  it('"Blank on the Contract" falls through to the text', () => {
    expect(startingInvoiceDescription(rooms('RTK'), BLANK_DESCRIPTION.invoiceDescription)).toEqual({ text: 'RTK', origin: 'rooms' })
  })
  it('"Not from the RVG code": an RVG-only Procedure has no invoice description, never a group name', () => {
    const p = proc({ procedureText: null, rvgGroupId: RVG_GROUP.ll4!, governingContractId: NO_CONTRACT.id })
    expect(p.invoiceDescription).toBeNull()
    expect(procedureStackView(p, ctx()).invoiceDescription).toBeNull()
  })
  it('a hand-entered text stands in at the bottom layer; nothing gives nothing', () => {
    expect(startingInvoiceDescription(entered('appendix, told by phone'))).toEqual({ text: 'appendix, told by phone', origin: 'entered' })
    expect(startingInvoiceDescription(null)).toBeNull()
  })
})

describe('refreshInvoiceDescription: an admin\'s edit always wins (D73)', () => {
  const edited = { text: 'Knee replacement, right', origin: 'edited' as const, editedOver: 'RTK' }

  it('keeps an edit against a later hospital text and against a Contract chosen or changed', () => {
    expect(refreshInvoiceDescription(edited, hospital('right total knee'))).toBe(edited)
    expect(refreshInvoiceDescription(edited, rooms('RTK'), WITH_DESCRIPTION.invoiceDescription)).toBe(edited)
  })

  it('otherwise returns the default', () => {
    expect(refreshInvoiceDescription({ text: 'RTK', origin: 'rooms' }, hospital('right total knee'))).toEqual({ text: 'right total knee', origin: 'hospital' })
  })

  it('the view shows the newer default as a cue only once it differs from what the office edited over', () => {
    const before = proc({ procedureText: rooms('RTK'), invoiceDescription: edited, governingContractId: STG_RVG.id })
    expect(newerInvoiceDescription(before, contracts)).toBeUndefined()
    expect(procedureStackView(before, ctx('office')).invoiceDescription).toEqual({ text: 'Knee replacement, right', origin: 'edited' })
    const after = { ...before, procedureText: hospital('right total knee') }
    expect(procedureStackView(after, ctx('office')).invoiceDescription?.newer).toEqual({ text: 'right total knee', origin: 'hospital' })
    const contractChanged = { ...before, governingContractId: WITH_DESCRIPTION.id }
    expect(newerInvoiceDescription(contractChanged, contracts)).toEqual({ text: 'Total knee replacement (Southern Cross)', origin: 'contract' })
  })
})

describe('procedureLabel', () => {
  it('the text, shortened; else the RVG code and description; else "Procedure n"', () => {
    expect(procedureLabel({ procedureText: rooms('RTK') }, masters.rvgGroups, 1)).toBe('RTK')
    const long = procedureLabel({ procedureText: hospital('WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC') }, masters.rvgGroups, 1)
    expect(long.length).toBeLessThanOrEqual(42)
    expect(long.endsWith('…')).toBe(true)
    expect(procedureLabel({ procedureText: null, rvgGroupId: RVG_GROUP.ll4! }, masters.rvgGroups, 2)).toMatch(/^LL4 · /)
    expect(procedureLabel({ procedureText: null }, masters.rvgGroups, 3)).toBe('Procedure 3')
  })
})
