/**
 * The step rail (catch-up Phase 20; US-04.3.8, US-04.3.9, US-04.3.2, US-04.3.3,
 * US-03.4.1), over the seeded masters.
 */

import { rvgCodeToFill } from './rvgDetail'
import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import type { Contract } from '../types'
import {
  NOT_A_CANDIDATE_MESSAGE,
  OFFICE_TYPES_AMOUNT_MESSAGE,
  PREPAID_OFFICE_ONLY_MESSAGE,
  applyContractChange,
  contractAllowedOn,
  contractCandidatesFor,
  contractChangeRefusal,
  contractRailFor,
  destinationOf,
  openPriceFallbackFor,
  railAnswersFor,
  railAnswersText,
  type RailContext,
  type RailMasters,
} from './contractRail'

const seed = buildSeed()
const masters: RailMasters = {
  contracts: seed.masters.contracts,
  parties: seed.masters.parties,
  fundingTags: seed.masters.fundingTags,
  rvgGroups: seed.masters.rvgGroups,
  surgeons: seed.masters.surgeons,
}
const SOUTER = '34821'
const RUTHERFORD = Object.values(seed.masters.anaesthetists).find((a) => a.name.includes('Rutherford'))!.registrationNumber
const JUL = '2026-07-24'

const ctx = (over: Partial<RailContext>): RailContext => ({ listDateISO: JUL, anaesthetistId: SOUTER, ...over })
const ids = (cs: readonly Contract[]) => cs.map((c) => c.id)
const rowIds = (view: ReturnType<typeof contractRailFor>) => view.contract?.rows.map((r) => r.contract.id) ?? []

describe('destinationOf (AR-61#invoice-destination, never stored)', () => {
  it("derives US-04.3.8's Christchurch Eye Surgery example", () => {
    const parties = seed.masters.parties
    expect(destinationOf(seed.masters.contracts['CT-MER-FACELIFT']!, parties)).toEqual({ kind: 'patient', prepaid: false })
    expect(destinationOf(seed.masters.contracts['CT-CES-SXAP-CATIOL']!, parties)).toEqual({ kind: 'hospital', holderPartyId: 'PY-CES', fundingTagId: 'TAG-SXAP' })
    expect(destinationOf(seed.masters.contracts['CT-NIB-D1']!, parties)).toEqual({ kind: 'special', holderPartyId: 'PY-NIB' })
    expect(destinationOf(seed.masters.contracts['CT-SOUTER-RHINO']!, parties)).toEqual({ kind: 'patient', prepaid: true })
  })
})

describe('contractCandidatesFor (US-04.3.2)', () => {
  it("never offers another hospital's Contract", () => {
    const sx = ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-SX', surgeonId: 'S-PATEL' })))
    expect(sx).toContain('CT-SXAP')
    expect(sx.some((id) => id.startsWith('CT-STG'))).toBe(false)
    expect(sx.some((id) => id.startsWith('CT-CES'))).toBe(false)
  })

  it("offers a Contract linked to two surgeons on either surgeon's Booking, whichever anaesthetist, and not on a third's", () => {
    for (const surgeonId of ['S-LIM', 'S-WOLFENDEN']) {
      for (const anaesthetistId of [SOUTER, RUTHERFORD]) {
        expect(ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId, anaesthetistId })))).toContain('CT-MER-FACELIFT')
      }
    }
    expect(ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-PATEL' })))).not.toContain('CT-MER-FACELIFT')
  })

  it("never offers anaesthetist B's own price list on anaesthetist A's List", () => {
    const own = ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM', anaesthetistId: SOUTER })))
    const other = ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM', anaesthetistId: RUTHERFORD })))
    expect(own).toContain('CT-SOUTER-RHINO')
    expect(other.some((id) => id.startsWith('CT-SOUTER'))).toBe(false)
  })

  it('excludes a specialty mismatch, keeps a Contract with no specialties', () => {
    const reid = ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-CES', surgeonId: 'S-REID' })))
    expect(reid).toContain('CT-CES-SXAP-CATIOL')
    expect(reid).not.toContain('CT-MER-FACELIFT')
    expect(reid).toContain('CT-NIB-D1')
    const lim = ids(contractCandidatesFor(masters, ctx({ hospitalId: 'H-CES', surgeonId: 'S-LIM' })))
    expect(lim).not.toContain('CT-CES-SXAP-CATIOL')
  })

  it('excludes a Disabled Contract', () => {
    const disabled: RailMasters = {
      ...masters,
      contracts: { ...masters.contracts, 'CT-NIB-D1': { ...masters.contracts['CT-NIB-D1']!, status: 'disabled' } },
    }
    expect(ids(contractCandidatesFor(disabled, ctx({ hospitalId: 'H-STG', surgeonId: 'S-HALE' })))).not.toContain('CT-NIB-D1')
  })

  it('excludes a fixed price with no range in force on the List date', () => {
    const july = ids(contractCandidatesFor(masters, ctx({ listDateISO: '2026-07-16', hospitalId: 'H-STG', surgeonId: 'S-HALE' })))
    const august = ids(contractCandidatesFor(masters, ctx({ listDateISO: '2026-08-03', hospitalId: 'H-STG', surgeonId: 'S-HALE' })))
    expect(july).not.toContain('CT-COS-FIXED')
    expect(august).toContain('CT-COS-FIXED')
  })

  it('never lists No contract · RVG or a fallback as a candidate', () => {
    const all = contractCandidatesFor(masters, ctx({ hospitalId: 'H-CES', surgeonId: 'S-REID' }))
    expect(all.some((c) => c.systemRole !== undefined)).toBe(false)
  })

  it('finds by each of the five fields: name, holder reference code, invoice description, AA code and default RVG code', () => {
    const at = ctx({ hospitalId: 'H-CES', surgeonId: 'S-REID' })
    const find = (q: string) => ids(contractCandidatesFor(masters, at, { query: q }))
    expect(find('Blepharoplasty')).toContain('CT-CES-SXAP-BLEPH')
    expect(find('HNZCATall')).toEqual(['CT-CES-HNZ-CAT'])
    expect(find('CES-004')).toEqual(['CT-CES-SXAP-ANTVIT'])
    expect(find('H6a')).toContain('CT-CES-ACC-CAT')
    const desc = masters.contracts['CT-CES-SXAP-CATIOL']!.invoiceDescription!
    expect(find(desc)).toContain('CT-CES-SXAP-CATIOL')
    expect(find('zzz-no-such')).toEqual([])
  })

  it('is deterministic', () => {
    const at = ctx({ hospitalId: 'H-CES', surgeonId: 'S-REID' })
    expect(ids(contractCandidatesFor(masters, at))).toEqual(ids(contractCandidatesFor(masters, at)))
  })

  it('insurance never narrows: the candidates take no insurer at all', () => {
    expect(contractCandidatesFor.length).toBe(2)
  })
})

describe('contractRailFor (US-04.3.8)', () => {
  const ces = ctx({ hospitalId: 'H-CES', surgeonId: 'S-REID' })

  it('step 1 offers Patient, the hospital by name and Special, each with its count', () => {
    const view = contractRailFor(masters, ces, undefined, { actor: 'office' })
    expect(view.destination.options.map((o) => o.label)).toEqual(['Patient', 'Christchurch Eye Surgery', 'Special'])
    expect(view.destination.options.every((o) => o.count >= 0)).toBe(true)
    expect(view.destination.answer).toBeUndefined()
    expect(view.narrow).toBeUndefined()
  })

  it('under Patient, "Payment type" always asks: Standard then Prepaid, Prepaid never choosable by the anaesthetist', () => {
    const office = contractRailFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' }), { destination: 'patient' }, { actor: 'office' })
    expect(office.narrow?.title).toBe('Payment type')
    expect(office.narrow?.options.map((o) => o.value)).toEqual(['standard', 'prepaid'])
    expect(office.narrow?.answer).toBeUndefined()
    const anaes = contractRailFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' }), { destination: 'patient' }, { actor: 'anaesthetist' })
    expect(anaes.narrow?.options.map((o) => [o.value, o.selectable])).toEqual([['standard', true], ['prepaid', false]])
    expect(anaes.narrow?.options[1]?.hint).toBe('Set by the office')
    expect(anaes.narrow?.answer).toBeUndefined()
    expect(anaes.contract).toBeUndefined()
  })

  it('stops at Payment type even when the List has no prepaid Contract, Prepaid shown but not choosable', () => {
    const none = { ...masters, contracts: Object.fromEntries(Object.entries(masters.contracts).filter(([, c]) => !c.prepaid)) }
    const view = contractRailFor(none, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' }), { destination: 'patient' }, { actor: 'office' })
    expect(view.narrow?.answer).toBeUndefined()
    expect(view.narrow?.options.find((o) => o.value === 'prepaid')).toMatchObject({ count: 0, selectable: false })
  })

  it('pins No contract · RVG first under Patient › Standard, whatever is typed', () => {
    const at = ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' })
    const plain = contractRailFor(masters, at, { destination: 'patient', narrow: 'standard' }, { actor: 'office' })
    expect(plain.contract?.rows[0]).toMatchObject({ pinned: true, contract: { id: 'CT-NO-CONTRACT' } })
    for (const query of ['Face', 'MER-002', 'zzz-no-such', 'H3']) {
      expect(contractRailFor(masters, at, { destination: 'patient', narrow: 'standard' }, { actor: 'office', query }).contract?.rows[0]?.contract.id).toBe('CT-NO-CONTRACT')
    }
  })

  it('never shows an RVG kind under Prepaid', () => {
    const view = contractRailFor(masters, ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' }), { destination: 'patient', narrow: 'prepaid' }, { actor: 'office' })
    expect(rowIds(view)).toContain('CT-SOUTER-RHINO')
    expect(view.contract?.rows.every((r) => r.contract.pricing.kind === 'fixed' && r.contract.prepaid)).toBe(true)
  })

  it('places the surgeon fixed fee under Patient, a CES SXAP item under the hospital › SXAP and nib under Special', () => {
    const lim = ctx({ hospitalId: 'H-CES', surgeonId: 'S-LIM' })
    expect(rowIds(contractRailFor(masters, lim, { destination: 'patient', narrow: 'standard' }, { actor: 'office' }))).toContain('CT-MER-FACELIFT')
    expect(rowIds(contractRailFor(masters, ces, { destination: 'hospital', narrow: 'TAG-SXAP' }, { actor: 'office' }))).toContain('CT-CES-SXAP-CATIOL')
    expect(rowIds(contractRailFor(masters, ces, { destination: 'special', narrow: 'PY-NIB' }, { actor: 'office' }))).toEqual(['CT-NIB-D1'])
  })

  it('lists the hospital funding tags in AA list order under the hospital; Special by holder', () => {
    const tags = contractRailFor(masters, ces, { destination: 'hospital' }, { actor: 'office' })
    expect(tags.narrow?.title).toBe('Funding tag')
    expect(tags.narrow?.options.map((o) => o.label)).toEqual(['SXAP', 'HNZ', 'ACC'])
    const special = contractRailFor(masters, ces, { destination: 'special' }, { actor: 'office' })
    expect(special.narrow?.title).toBe('Holder')
    expect(special.narrow?.options.map((o) => o.value)).toContain('PY-NIB')
  })

  it('a hospital with one funding tag fills in step 2 ("Only option")', () => {
    const view = contractRailFor(masters, ctx({ hospitalId: 'H-CPH', surgeonId: 'S-TAN' }), { destination: 'hospital' }, { actor: 'office' })
    expect(view.narrow).toMatchObject({ answer: 'TAG-HNZ', autoFilled: true })
    expect(rowIds(view)).toEqual(['CT-HNZ'])
    expect(view.contract?.autoPick).toEqual({ contractId: 'CT-HNZ', viaOtherPrice: false })
  })

  it('offers the hospital when the specialty filter empties it, and fills in its fallback', () => {
    const lim = ctx({ hospitalId: 'H-CES', surgeonId: 'S-LIM' })
    const step1 = contractRailFor(masters, lim, undefined, { actor: 'office' })
    expect(step1.destination.options.find((o) => o.value === 'hospital')).toMatchObject({ count: 0 })
    const view = contractRailFor(masters, lim, { destination: 'hospital', narrow: 'TAG-SXAP' }, { actor: 'office' })
    expect(view.contract?.rows).toEqual([])
    expect(view.contract?.autoPick).toEqual({ contractId: 'CT-FIX-HOSPITAL-PY-CES-TAG-SXAP', viaOtherPrice: true })
  })

  it('No contract · RVG alone under Standard fills itself in', () => {
    const view = contractRailFor(masters, ctx({ hospitalId: 'H-STG', surgeonId: 'S-TAN' }), { destination: 'patient', narrow: 'standard' }, { actor: 'office' })
    expect(rowIds(view)).toEqual(['CT-NO-CONTRACT'])
    expect(view.contract?.autoPick).toEqual({ contractId: 'CT-NO-CONTRACT', viaOtherPrice: false })
  })

  it('"Other price" picks the destination fallback; the anaesthetist may type only on No contract · Fixed price', () => {
    const forte = ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-LIM' })
    const std = contractRailFor(masters, forte, { destination: 'patient', narrow: 'standard' }, { actor: 'anaesthetist' })
    expect(std.contract?.otherPrice).toMatchObject({ contract: { id: 'CT-FIX-PATIENT-STANDARD' }, mayTypeAmount: true })
    const pre = contractRailFor(masters, forte, { destination: 'patient', narrow: 'prepaid' }, { actor: 'office' })
    expect(pre.contract?.otherPrice?.contract.id).toBe('CT-FIX-PATIENT-PREPAID')
    const sx = ctx({ hospitalId: 'H-SX', surgeonId: 'S-PATEL' })
    const hosp = contractRailFor(masters, sx, { destination: 'hospital', narrow: 'TAG-SXAP' }, { actor: 'anaesthetist' })
    expect(hosp.contract?.otherPrice).toMatchObject({ contract: { id: 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP' }, mayTypeAmount: false })
    expect(contractRailFor(masters, sx, { destination: 'hospital', narrow: 'TAG-SXAP' }, { actor: 'office' }).contract?.otherPrice?.mayTypeAmount).toBe(true)
    const special = contractRailFor(masters, ces, { destination: 'special', narrow: 'PY-NIB' }, { actor: 'office' })
    expect(special.contract?.otherPrice?.contract.id).toBe('CT-FIX-SPECIAL-PY-NIB')
  })

  it('caps the rows drawn at 50', () => {
    expect(contractRailFor(masters, ces, { destination: 'special', narrow: 'PY-NIB' }, { actor: 'office' }).contract?.shown.length).toBeLessThanOrEqual(50)
  })
})

describe('railAnswersFor', () => {
  it('round-trips every seeded Procedure Contract to the rail answers that show it', () => {
    for (const p of Object.values(seed.schedule.procedures)) {
      if (p.governingContractId === undefined) continue
      const answers = railAnswersFor(masters, p.governingContractId)
      expect(answers, p.id).toBeDefined()
      const contract = masters.contracts[p.governingContractId]!
      if (contract.systemRole !== undefined) continue
      const booking = seed.schedule.bookings[p.bookingId]!
      const list = seed.schedule.lists[booking.listId]!
      if (list.anaesthetistId === undefined || list.dateISO < '2026-07-01') continue
      const at: RailContext = { listDateISO: list.dateISO, anaesthetistId: list.anaesthetistId }
      if (list.surgeonId !== undefined) at.surgeonId = list.surgeonId
      if (list.hospitalId !== undefined && list.hospitalId !== 'H-AAROOMS') at.hospitalId = list.hospitalId
      if (!contractAllowedOn(masters, at, contract.id)) continue
      const view = contractRailFor(masters, at, answers, { actor: 'office' })
      expect(rowIds(view), p.id).toContain(contract.id)
    }
  })

  it('reads the answers so far in words', () => {
    expect(railAnswersText(masters, {}, { destination: 'patient', narrow: 'standard' })).toBe('Patient › Standard')
    expect(railAnswersText(masters, { hospitalId: 'H-STG' }, { destination: 'hospital', narrow: 'TAG-ACC' })).toBe("St George's › ACC")
    expect(railAnswersText(masters, {}, undefined)).toBe('Not started')
  })
})

describe('applyContractChange (US-03.4.1)', () => {
  it('clears a typed price and the answers so far, keeps recorded RVG detail, fills the default RVG code only when empty', () => {
    const procedure = { rvgGroupId: 'RG046', priceOverride: { kind: 'fixedFee' as const, amount: 900, reason: 'x' }, enteredPrice: 650 }
    const kept = applyContractChange(masters, procedure, 'CT-SOUTER-RHINO')
    expect(kept).toMatchObject({ governingContractId: 'CT-SOUTER-RHINO', priceOverride: undefined, enteredPrice: undefined, railAnswers: undefined })
    expect('rvgGroupId' in kept).toBe(false)
    const filled = applyContractChange(masters, {}, 'CT-SOUTER-RHINO')
    expect(filled.rvgGroupId).toBe(masters.contracts['CT-SOUTER-RHINO']!.defaultRvgGroupId)
  })

  it('keeps an amount only on an open-price fallback', () => {
    expect(applyContractChange(masters, {}, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 2000 }).enteredPrice).toBe(2000)
    expect(applyContractChange(masters, {}, 'CT-NO-CONTRACT', { enteredPrice: 2000 }).enteredPrice).toBeUndefined()
  })
})

describe('rvgCodeToFill (derived, never stored)', () => {
  it('is true only on an RVG kind with no RVG code', () => {
    expect(rvgCodeToFill(masters, { governingContractId: 'CT-NO-CONTRACT' })).toBe(true)
    expect(rvgCodeToFill(masters, { governingContractId: 'CT-NO-CONTRACT', rvgGroupId: 'RG046' })).toBe(false)
    expect(rvgCodeToFill(masters, { governingContractId: 'CT-SOUTER-BLEPH' })).toBe(false)
    expect(rvgCodeToFill(masters, {})).toBe(false)
  })
})

describe('contractChangeRefusal and contractAllowedOn', () => {
  it('refuses the anaesthetist onto or off a prepaid Contract', () => {
    expect(contractChangeRefusal('anaesthetist', masters, 'CT-NO-CONTRACT', 'CT-SOUTER-RHINO')?.message).toBe(PREPAID_OFFICE_ONLY_MESSAGE)
    expect(contractChangeRefusal('anaesthetist', masters, 'CT-SOUTER-RHINO', 'CT-NO-CONTRACT')?.message).toBe(PREPAID_OFFICE_ONLY_MESSAGE)
    expect(contractChangeRefusal('office', masters, 'CT-NO-CONTRACT', 'CT-SOUTER-RHINO')).toBeNull()
  })

  it('refuses the anaesthetist an amount on any fallback but No contract · Fixed price', () => {
    expect(contractChangeRefusal('anaesthetist', masters, undefined, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP', { enteredPrice: 100 })?.message).toBe(OFFICE_TYPES_AMOUNT_MESSAGE)
    expect(contractChangeRefusal('anaesthetist', masters, undefined, 'CT-FIX-PATIENT-STANDARD', { enteredPrice: 100 })).toBeNull()
    expect(contractChangeRefusal('anaesthetist', masters, undefined, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP')).toBeNull()
  })

  it('allows a candidate, No contract · RVG and the fallback of an offered destination; nothing else', () => {
    const sx = ctx({ hospitalId: 'H-SX', surgeonId: 'S-PATEL' })
    expect(contractAllowedOn(masters, sx, 'CT-SXAP')).toBe(true)
    expect(contractAllowedOn(masters, sx, 'CT-NO-CONTRACT')).toBe(true)
    expect(contractAllowedOn(masters, sx, 'CT-FIX-PATIENT-STANDARD')).toBe(true)
    expect(contractAllowedOn(masters, sx, 'CT-FIX-HOSPITAL-PY-SX-TAG-SXAP')).toBe(true)
    expect(contractAllowedOn(masters, sx, 'CT-STG-D1')).toBe(false)
    expect(contractAllowedOn(masters, sx, 'CT-FIX-HOSPITAL-PY-STG-TAG-ACC')).toBe(false)
    expect(contractAllowedOn(masters, sx, 'CT-FIX-SPECIAL-PY-NIB')).toBe(true)
    expect(NOT_A_CANDIDATE_MESSAGE).toBe('That Contract does not apply to this Booking.')
  })

  it('opens the fallback for each destination', () => {
    expect(openPriceFallbackFor(masters, { kind: 'patient', prepaid: false })?.name).toBe('No contract · Fixed price')
    expect(openPriceFallbackFor(masters, { kind: 'patient', prepaid: true })?.name).toBe('Prepaid · Fixed price')
  })
})

describe('suggestedPathFor: the funder marks one path (catch-up Phase 21, US-04.3.10, D7)', () => {
  /** The rail with every `suggested` mark stripped: what is offered, in order. */
  const offered = (view: ReturnType<typeof contractRailFor>) => JSON.parse(JSON.stringify(view, (k, v) => (k === 'suggested' ? undefined : v)))
  const forte = ctx({ hospitalId: 'H-FORTE', surgeonId: 'S-OKAFOR' })
  // Forte holds no SXAP Contract in the seed: the AC's Forte example adds one.
  const forteSxap: Contract = { ...seed.masters.contracts['CT-SXAP']!, id: 'CT-TEST-FORTE-SXAP', aaCode: 'FORTE-099', holderId: 'PY-FORTE', name: 'Forte SXAP' }
  const withForteSxap: RailMasters = { ...masters, contracts: { ...masters.contracts, [forteSxap.id]: forteSxap } }

  it('Southern Cross Health Society at Forte marks Forte › SXAP (AC "Suggested")', () => {
    const view = contractRailFor(withForteSxap, { ...forte, funderPartyId: 'PY-SCHS' }, undefined, { actor: 'office' })
    expect(view.suggested).toEqual({ destination: 'hospital', narrow: 'TAG-SXAP' })
    expect(view.destination.options.filter((o) => o.suggested).map((o) => o.value)).toEqual(['hospital'])
    const tags = contractRailFor(withForteSxap, { ...forte, funderPartyId: 'PY-SCHS' }, { destination: 'hospital' }, { actor: 'office' })
    expect(tags.narrow?.options.filter((o) => o.suggested).map((o) => o.label)).toEqual(['SXAP'])
  })

  it("NIB with nib's Contract offered marks Special › NIB (AC \"Funder's own Contracts\")", () => {
    const view = contractRailFor(masters, { ...forte, funderPartyId: 'PY-NIB' }, { destination: 'special' }, { actor: 'office' })
    expect(view.suggested).toEqual({ destination: 'special', narrow: 'PY-NIB' })
    expect(view.narrow?.options.filter((o) => o.suggested).map((o) => o.value)).toEqual(['PY-NIB'])
  })

  it('no funder marks Patient › Standard (AC "No funder")', () => {
    const view = contractRailFor(masters, forte, { destination: 'patient' }, { actor: 'office' })
    expect(view.suggested).toEqual({ destination: 'patient', narrow: 'standard' })
    expect(view.destination.options.find((o) => o.value === 'patient')?.suggested).toBe(true)
    expect(view.narrow?.options.find((o) => o.value === 'standard')?.suggested).toBe(true)
  })

  it('Health NZ with no Contract of its own and no HNZ tag at the hospital marks nothing (AC "No match")', () => {
    const view = contractRailFor(masters, { ...forte, funderPartyId: 'PY-HNZ' }, undefined, { actor: 'office' })
    expect(view.suggested).toBeUndefined()
    expect(view.destination.options.some((o) => o.suggested)).toBe(false)
  })

  it('never narrows: every path, its Contracts and their order are identical with and without a funder, and nothing is pre-selected (AC "Never narrows")', () => {
    const answers: (RailAnswersOrUndefined)[] = [undefined, { destination: 'patient' }, { destination: 'patient', narrow: 'standard' }, { destination: 'special' }, { destination: 'special', narrow: 'PY-NIB' }, { destination: 'hospital' }]
    for (const funder of [undefined, 'PY-NIB', 'PY-SCHS', 'PY-HNZ', 'PY-ACC', 'PY-AIA']) {
      for (const given of answers) {
        for (const actor of ['office', 'anaesthetist'] as const) {
          const plain = contractRailFor(withForteSxap, forte, given, { actor })
          const marked = contractRailFor(withForteSxap, { ...forte, ...(funder !== undefined ? { funderPartyId: funder } : {}) }, given, { actor })
          expect(offered(marked), `${funder} ${JSON.stringify(given)} ${actor}`).toEqual(offered(plain))
          expect(marked.destination.answer).toBe(plain.destination.answer)
        }
      }
    }
  })

  it('Southern Cross Health Society at Southern Cross marks Southern Cross › SXAP (the seeded case)', () => {
    const view = contractRailFor(masters, ctx({ hospitalId: 'H-SX', surgeonId: 'S-PATEL', funderPartyId: 'PY-SCHS' }), undefined, { actor: 'office' })
    expect(view.suggested).toEqual({ destination: 'hospital', narrow: 'TAG-SXAP' })
  })
})

type RailAnswersOrUndefined = Parameters<typeof contractRailFor>[2]
