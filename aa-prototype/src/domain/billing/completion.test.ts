import { describe, expect, it } from 'vitest'
import { RVG_MODIFIER_MASTER, mkClaim } from './fixtures'
import { BASE_RANGE_5_9, BASE_SINGLE_10, HANDOVER_1030, mkBooking, mkContract, mkParty, mkProcedure, START_0800 } from './fixtures'
import {
  ADD_FINISH_MESSAGE,
  ADD_RVG_CODE_MESSAGE,
  ADD_START_MESSAGE,
  CONTRACT_GONE_MESSAGE,
  FINISH_ORDER_MESSAGE,
  MODIFIERS_STEP_MESSAGE,
  NO_CONTRACT_MESSAGE,
  completionFailuresFor,
  contractChangeAsksRvgDetail,
  type CompletionContext,
} from './completion'
import type { Procedure } from '../types'

const PLAIN_RVG = mkContract({ id: 'con-plain', name: 'Test hospital RVG' })
const AGREED_RATE = mkContract({ id: 'con-rate', name: 'Agreed rate', pricing: { kind: 'rvgContractRate', unitRate: 32 } })
const DISCOUNT = mkContract({ id: 'con-disc', name: 'Discounted', pricing: { kind: 'rvgDiscount', discountPct: 10 } })
const NO_CONTRACT = mkContract({ id: 'con-ncr', aaCode: 'AA-RVG', name: 'No contract · RVG', holderId: 'party-aa', billsTo: 'payer', systemRole: 'noContractRvg' })
const FIXED = mkContract({ id: 'con-fix', name: 'Fixed item', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-01-01', price: 400 }] } })
const FIXED_LATER = mkContract({ id: 'con-fix-later', name: 'Face lift', pricing: { kind: 'fixed', ranges: [{ startISO: '2026-09-01', price: 3100 }] } })
const OPEN = mkContract({ id: 'con-open', name: 'No contract · Fixed price', holderId: 'party-aa', billsTo: 'payer', pricing: { kind: 'open' }, systemRole: 'openPriceFallback' })
const OPEN_SPECIAL = mkContract({ id: 'con-open-sp', name: "St George's · Fixed price", pricing: { kind: 'open' }, systemRole: 'openPriceFallback' })
const CONTRACTS = Object.fromEntries([PLAIN_RVG, AGREED_RATE, DISCOUNT, NO_CONTRACT, FIXED, FIXED_LATER, OPEN, OPEN_SPECIAL].map((c) => [c.id, c]))

function ctx(overrides: Partial<CompletionContext> = {}): CompletionContext {
  return {
    contracts: CONTRACTS,
    parties: {
      'party-hosp-1': mkParty(),
      'party-aa': mkParty({ id: 'party-aa', kind: 'aa', name: 'AA', codePrefix: 'AA', hospitalId: undefined }),
    },
    rvgGroups: { [BASE_SINGLE_10.id]: BASE_SINGLE_10, [BASE_RANGE_5_9.id]: BASE_RANGE_5_9 },
    modifiers: RVG_MODIFIER_MASTER,
    billingLines: [],
    listDateISO: '2026-07-21',
    patientDobISO: undefined,
    ...overrides,
  }
}

/** A complete Procedure on an RVG kind: code, times, the step answered with "None apply". */
function rvgDone(overrides: Partial<Procedure> = {}): Procedure {
  return mkProcedure({
    governingContractId: PLAIN_RVG.id,
    rvgGroupId: 'RG-T-GA10',
    anaestheticStartISO: START_0800,
    handoverISO: HANDOVER_1030,
    modifiersConfirmed: true,
    ...overrides,
  })
}

const booking = mkBooking()
const codes = (p: Procedure[], c = ctx()) => completionFailuresFor(booking, p, c).map((f) => f.code)

describe('completion is exactly three conditions (catch-up Phase 21a; US-03.6.1, DM-59, RV-21)', () => {
  it('a complete RVG Procedure passes on every RVG kind', () => {
    for (const id of [PLAIN_RVG.id, AGREED_RATE.id, DISCOUNT.id, NO_CONTRACT.id]) {
      expect(codes([rvgDone({ governingContractId: id })])).toEqual([])
    }
  })

  it('1. a Contract: none reads "needs an invoice destination", a dangling one is chosen again; office-fixable; nothing else is asked', () => {
    const none = completionFailuresFor(booking, [mkProcedure()], ctx())
    expect(none).toEqual([{ procedureId: 'proc-1', code: 'noContract', field: 'governingContractId', message: NO_CONTRACT_MESSAGE, fixableBy: 'office' }])
    expect(completionFailuresFor(booking, [rvgDone({ governingContractId: 'gone' })], ctx())[0]?.message).toBe(CONTRACT_GONE_MESSAGE)
  })

  it('2. on an RVG kind, the RVG code, the start, the finish (never "handover") and the modifiers step, each anchored', () => {
    const bare = completionFailuresFor(booking, [mkProcedure({ governingContractId: NO_CONTRACT.id })], ctx())
    expect(bare.map((f) => [f.code, f.field, f.message, f.fixableBy])).toEqual([
      ['rvgCode', 'rvgGroupId', ADD_RVG_CODE_MESSAGE, 'anaesthetist'],
      ['startTime', 'anaestheticStartISO', ADD_START_MESSAGE, 'anaesthetist'],
      ['finishTime', 'handoverISO', ADD_FINISH_MESSAGE, 'anaesthetist'],
      ['modifiersStep', 'modifierClaims', MODIFIERS_STEP_MESSAGE, 'anaesthetist'],
    ])
    expect(bare.some((f) => /handover/i.test(f.message))).toBe(false)
    expect(codes([rvgDone({ handoverISO: '2026-07-21T07:30:00' })])).toEqual(['finishTime'])
    expect(completionFailuresFor(booking, [rvgDone({ handoverISO: '2026-07-21T07:30:00' })], ctx())[0]?.message).toBe(FINISH_ORDER_MESSAGE)
  })

  it('the modifiers step: unanswered refuses; "None apply" passes; a claim answers it; an unexplained claim refuses', () => {
    expect(codes([rvgDone({ modifiersConfirmed: undefined })])).toEqual(['modifiersStep'])
    expect(codes([rvgDone({ modifiersConfirmed: true })])).toEqual([])
    expect(codes([rvgDone({ modifiersConfirmed: undefined, modifierClaims: [mkClaim('AS3', 'ASA III on pre-op review')] })])).toEqual([])
    const blank = completionFailuresFor(booking, [rvgDone({ modifierClaims: [mkClaim('AS3', '  ')] })], ctx())
    expect(blank.map((f) => [f.code, f.message])).toEqual([['modifierExplanation', 'Add a short explanation for AS3, or remove it.']])
  })

  it('an additional Procedure carries no modifiers step (its form has none)', () => {
    expect(codes([rvgDone({ isPrimary: false, modifiersConfirmed: undefined })])).toEqual([])
  })

  it('a fixed price with no times, no modifiers and no RVG code passes (US-03.3.9 Collapsed)', () => {
    expect(codes([mkProcedure({ governingContractId: FIXED.id })])).toEqual([])
  })

  it('3. a price: "Needs a price" refuses (A48); a typed amount clears it; who can type decides who fixes it', () => {
    const open = completionFailuresFor(booking, [mkProcedure({ governingContractId: OPEN.id })], ctx())
    expect(open.map((f) => [f.code, f.field, f.fixableBy])).toEqual([['needsPrice', 'enteredPrice', 'anaesthetist']])
    expect(codes([mkProcedure({ governingContractId: OPEN.id, enteredPrice: 2000 })])).toEqual([])
    const special = completionFailuresFor(booking, [mkProcedure({ governingContractId: OPEN_SPECIAL.id })], ctx())
    expect(special[0]?.fixableBy).toBe('office')
    const noRange = completionFailuresFor(booking, [mkProcedure({ governingContractId: FIXED_LATER.id })], ctx())
    expect(noRange.map((f) => [f.code, f.field, f.message, f.fixableBy])).toEqual([
      ['needsPrice', 'governingContractId', 'Needs a price: no price range in force on 21 Jul 2026.', 'office'],
    ])
    expect(codes([mkProcedure({ governingContractId: FIXED_LATER.id })], ctx({ listDateISO: '2026-09-02' }))).toEqual([])
  })

  it('Ben\'s two routes both complete: RVG detail with a price override, or No contract · Fixed price with a typed amount and a reference code', () => {
    expect(codes([rvgDone({ governingContractId: NO_CONTRACT.id, enteredPrice: 900 })])).toEqual([])
    expect(codes([mkProcedure({ governingContractId: OPEN.id, enteredPrice: 900, rvgGroupId: 'RG-T-GA10' })])).toEqual([])
  })

  it('no stray condition: an out-of-range base, no approval number and no payer contact all pass', () => {
    const outside = rvgDone({ rvgGroupId: BASE_RANGE_5_9.id, baseUnitsSelected: 40 })
    expect(codes([outside])).toEqual([])
    const noNumber = mkBooking({ funderPartyId: 'party-ins' })
    expect(completionFailuresFor(noNumber, [rvgDone()], ctx())).toEqual([])
    const noContact = mkBooking()
    expect(completionFailuresFor(noContact, [{ ...rvgDone(), payer: { kind: 'other', id: 'BP0009', name: 'No Contact' } }], ctx())).toEqual([])
  })

  it('a cancelled Booking has no failures; failures are in Procedure order', () => {
    const cancelled = mkBooking({ cancellation: { reason: 'Unwell', by: 'Kirsty W.', role: 'office', source: 'office', atISO: '2026-07-21T09:00:00' } })
    expect(completionFailuresFor(cancelled, [mkProcedure()], ctx())).toEqual([])
    const two = completionFailuresFor(booking, [mkProcedure({ id: 'p-a' }), mkProcedure({ id: 'p-b', governingContractId: OPEN.id })], ctx())
    expect(two.map((f) => f.procedureId)).toEqual(['p-a', 'p-b'])
  })
})

describe('a Contract change that newly asks for RVG detail (catch-up Phase 21a, our reading)', () => {
  it('fixed or open to an RVG kind re-opens; the reverse, RVG to RVG, and a first Contract never do', () => {
    expect(contractChangeAsksRvgDetail(FIXED, NO_CONTRACT)).toBe(true)
    expect(contractChangeAsksRvgDetail(OPEN, PLAIN_RVG)).toBe(true)
    expect(contractChangeAsksRvgDetail(NO_CONTRACT, FIXED)).toBe(false)
    expect(contractChangeAsksRvgDetail(PLAIN_RVG, AGREED_RATE)).toBe(false)
    expect(contractChangeAsksRvgDetail(undefined, PLAIN_RVG)).toBe(false)
  })
})
