import { describe, expect, it } from 'vitest'
import {
  ACC_PREOP_PRESETS,
  EVENT_TYPES,
  NO_EVENT_RATE_MESSAGE,
  eventDateRefusal,
  eventInvoiceLine,
  eventTypesOf,
  officePricing,
  pricePrePostOpEvent,
  validatePrePostOpEvent,
  type PricePrePostOpContext,
  type PrePostOpInput,
} from './prePostOpEvent'
import { contractEventFeeRefusal, eventFeeFor, type ContractEventFee } from './contractEventFees'
import { priceBillingEvent, validateBillingEvent } from './billingEvent'
import { timedRateFor } from './timedRate'
import { DEFAULT_RVG_TIME_RULE } from './timeUnits'
import type { ContractPricing } from './contracts'

const LIST = '2026-11-19'
const TODAY = '2026-11-24'
const dates = { listDateISO: LIST, todayISO: TODAY }

const stgAcc = { id: 'CT-STG-ACC', pricing: { kind: 'rvgContractRate', unitRate: 25 } as ContractPricing }
const noContractRvg = { id: 'CT-NO-RVG', pricing: { kind: 'rvgAnaesthetistRate' } as ContractPricing }
const discount10 = { id: 'CT-DISC', pricing: { kind: 'rvgDiscount', discountPct: 10 } as ContractPricing }
const fixed = { id: 'CT-FIXED', pricing: { kind: 'fixed', ranges: [] } as ContractPricing }
const open = { id: 'CT-OPEN', pricing: { kind: 'open' } as ContractPricing }

const PAIN_FEE: ContractEventFee = { id: 'CEF001', contractId: 'CT-STG-ACC', eventType: 'painConsult', holderCode: 'STGACC-PAIN', holderDescription: 'Acute pain review, fixed fee', fixedPrice: 120 }

function ctx(contract: PricePrePostOpContext['contract'], fees: ContractEventFee[] = [PAIN_FEE], unitValue = 30): PricePrePostOpContext {
  return { contract, eventFees: Object.fromEntries(fees.map((f) => [f.id, f])), unitValue, timeRule: DEFAULT_RVG_TIME_RULE }
}

const timed = (minutes: number, type: PrePostOpInput['type'] = 'postOpWardReview') => ({ billable: true, type, recording: { kind: 'time' as const, minutes } })

describe('pricePrePostOpEvent: worked figures', () => {
  it('45 min under CT-STG-ACC (rvgContractRate $25.00) is 3 units, $75.00', () => {
    const r = pricePrePostOpEvent(timed(45), ctx(stgAcc))
    expect(r).toEqual({
      kind: 'priced',
      pricing: { basis: 'time', minutes: 45, timeUnits: 3, rate: 25, rateOrigin: 'contractRate', amount: 75, contractId: 'CT-STG-ACC', pricingKind: 'rvgContractRate' },
    })
  })

  it('121 min enters the second tier: 8 + 1 = 9 units, the part interval rounded up', () => {
    const r = pricePrePostOpEvent(timed(121), ctx(stgAcc))
    expect(r.kind === 'priced' && r.pricing.timeUnits).toBe(9)
    expect(r.kind === 'priced' && r.pricing.amount).toBe(225)
  })

  it('45 min under No contract · RVG at a $30.00 unit value is $90.00 from the unit value', () => {
    const r = pricePrePostOpEvent(timed(45), ctx(noContractRvg))
    expect(r.kind === 'priced' && r.pricing).toMatchObject({ amount: 90, rateOrigin: 'unitValue', rate: 30 })
  })

  it('no Contract yet prices as No contract · RVG', () => {
    const r = pricePrePostOpEvent(timed(45), ctx(undefined))
    expect(r.kind === 'priced' && r.pricing).toMatchObject({ amount: 90, rateOrigin: 'unitValue' })
  })

  it('a 10% discount Contract takes $90.00 to $81.00', () => {
    const r = pricePrePostOpEvent(timed(45), ctx(discount10))
    expect(r.kind === 'priced' && r.pricing).toMatchObject({ amount: 81, discountPercent: 10, rateOrigin: 'unitValue' })
  })

  it("a Contract event fee replaces a recorded time with its fixed price", () => {
    const r = pricePrePostOpEvent(timed(40, 'painConsult'), ctx(stgAcc))
    expect(r).toEqual({
      kind: 'priced',
      pricing: { basis: 'contractEventFee', amount: 120, eventFeeId: 'CEF001', holderCode: 'STGACC-PAIN', replacedMinutes: 40, contractId: 'CT-STG-ACC', pricingKind: 'rvgContractRate' },
    })
  })

  it("a fee on another Contract, or for another type, does not apply", () => {
    expect(pricePrePostOpEvent(timed(40, 'painConsult'), ctx(discount10)).kind === 'priced' && true).toBe(true)
    const other = pricePrePostOpEvent(timed(40, 'painConsult'), ctx(discount10))
    expect(other.kind === 'priced' && other.pricing.basis).toBe('time')
    const ward = pricePrePostOpEvent(timed(40, 'postOpWardReview'), ctx(stgAcc))
    expect(ward.kind === 'priced' && ward.pricing.basis).toBe('time')
  })

  it("the Contract's rate is read as it stands: an edited unit rate changes the price", () => {
    const before = pricePrePostOpEvent(timed(45), ctx(stgAcc))
    const after = pricePrePostOpEvent(timed(45), ctx({ id: 'CT-STG-ACC', pricing: { kind: 'rvgContractRate', unitRate: 30 } }))
    expect(before.kind === 'priced' && before.pricing.amount).toBe(75)
    expect(after.kind === 'priced' && after.pricing.amount).toBe(90)
  })

  it('an ACC pre-op (CS250) prices as a typed fee and as a time', () => {
    const typed = pricePrePostOpEvent({ billable: true, type: 'accPreOpAssessment', recording: { kind: 'fixedFee', source: 'typed', amount: 60 } }, ctx(stgAcc))
    expect(typed).toEqual({ kind: 'priced', pricing: { basis: 'typedFixedFee', amount: 60, contractId: 'CT-STG-ACC', pricingKind: 'rvgContractRate' } })
    const time = pricePrePostOpEvent(timed(30, 'accPreOpAssessment'), ctx(stgAcc))
    expect(time.kind === 'priced' && time.pricing.amount).toBe(50)
  })

  it('a typed fee is never refused, even on a fixed price', () => {
    const r = pricePrePostOpEvent({ billable: true, type: 'otherPostOp', recording: { kind: 'fixedFee', source: 'typed', amount: 42.5 } }, ctx(fixed))
    expect(r.kind === 'priced' && r.pricing.amount).toBe(42.5)
  })

  it('a timed event on a fixed or open price calculates nothing (noEventRate)', () => {
    expect(pricePrePostOpEvent(timed(30), ctx(fixed))).toEqual({ kind: 'refused', code: 'noEventRate', message: NO_EVENT_RATE_MESSAGE })
    expect(pricePrePostOpEvent(timed(30), ctx(open))).toMatchObject({ kind: 'refused', code: 'noEventRate' })
  })

  it('an un-ticked event is never priced', () => {
    expect(pricePrePostOpEvent({ ...timed(45), billable: false }, ctx(stgAcc))).toMatchObject({ kind: 'refused', code: 'notInvoiced' })
  })

  it("a Contract fee recorded but since removed is left for the office", () => {
    const r = pricePrePostOpEvent({ billable: true, type: 'painConsult', recording: { kind: 'fixedFee', source: 'contractEventFee', contractId: 'CT-STG-ACC', eventFeeId: 'CEF001' } }, ctx(stgAcc, []))
    expect(r).toMatchObject({ kind: 'refused', code: 'eventFeeGone' })
  })

  it('is deterministic', () => {
    expect(pricePrePostOpEvent(timed(77), ctx(discount10))).toEqual(pricePrePostOpEvent(timed(77), ctx(discount10)))
  })

  it("the office's price is signed and keeps its reason", () => {
    expect(officePricing(60, ' agreed with AA ', fixed)).toEqual({ basis: 'officePrice', amount: 60, officeReason: 'agreed with AA', contractId: 'CT-FIXED', pricingKind: 'fixed' })
    expect(officePricing(40, 'x', undefined, -1).amount).toBe(-40)
  })
})

describe('timedRateFor: the one rate helper', () => {
  it('gives each pricing kind its rate, origin and discount', () => {
    expect(timedRateFor({ kind: 'rvgAnaesthetistRate' }, 30)).toEqual({ kind: 'rate', rate: 30, rateOrigin: 'unitValue', discountPercent: 0 })
    expect(timedRateFor({ kind: 'rvgContractRate', unitRate: 25 }, 30)).toEqual({ kind: 'rate', rate: 25, rateOrigin: 'contractRate', discountPercent: 0 })
    expect(timedRateFor({ kind: 'rvgDiscount', discountPct: 10 }, 30)).toEqual({ kind: 'rate', rate: 30, rateOrigin: 'unitValue', discountPercent: 10 })
    expect(timedRateFor({ kind: 'fixed', ranges: [] }, 30)).toEqual({ kind: 'none' })
    expect(timedRateFor({ kind: 'open' }, 30)).toEqual({ kind: 'none' })
    expect(timedRateFor(undefined, 30)).toEqual({ kind: 'rate', rate: 30, rateOrigin: 'unitValue', discountPercent: 0 })
  })
})

describe('the module imports no modifier module and derives no rate of its own', () => {
  const SOURCES = import.meta.glob('./{prePostOpEvent,billingEvent,contractEventFees}.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  it('reads the rate only through timedRateFor', () => {
    const src = SOURCES['./prePostOpEvent.ts']!
    expect(src).toMatch(/timedRateFor\(/)
    expect(src).not.toMatch(/from '\.\/modifiers'|from '\.\/rvgGroups'|from '\.\/multiProcedure'/)
    expect(src).not.toMatch(/unitRate|discountPct/)
    for (const [file, text] of Object.entries(SOURCES)) {
      expect(text, file).not.toMatch(/modifierIds|baseUnits|asaClass/)
    }
  })
})

describe('validatePrePostOpEvent', () => {
  const base: PrePostOpInput = { kind: 'postOp', type: 'postOpWardReview', occurredOnISO: '2026-11-20', startTime: '08:00', recording: { kind: 'time', minutes: 45 } }
  const v = (patch: Partial<PrePostOpInput>) => validatePrePostOpEvent({ ...base, ...patch }, dates)

  it('accepts a valid post-op and pre-op event', () => {
    expect(v({})).toBeNull()
    expect(v({ kind: 'preOp', type: 'accPreOpAssessment', occurredOnISO: '2026-11-16', code: 'CS250', recording: { kind: 'fixedFee', source: 'typed', amount: 60 } })).toBeNull()
  })

  it('refuses a type of the other kind', () => {
    expect(v({ type: 'accPreOpAssessment' })?.code).toBe('typeNotOfKind')
  })

  it('refuses a post-op event dated before the List, and a pre-op event after it', () => {
    expect(v({ occurredOnISO: '2026-11-18' })).toMatchObject({ code: 'dateBeforeProcedure', message: 'A post-op event cannot be dated before the procedure.', field: 'occurredOnISO' })
    expect(v({ kind: 'preOp', type: 'otherPreOp', occurredOnISO: '2026-11-20' })?.code).toBe('dateAfterProcedure')
  })

  it('accepts both edges: a pre-op and a post-op on the List date, a post-op today', () => {
    expect(v({ occurredOnISO: LIST })).toBeNull()
    expect(v({ kind: 'preOp', type: 'otherPreOp', occurredOnISO: LIST })).toBeNull()
    expect(v({ occurredOnISO: TODAY })).toBeNull()
  })

  it('refuses a date in the future', () => {
    expect(v({ occurredOnISO: '2026-11-25' })).toMatchObject({ code: 'dateInFuture', message: 'An event cannot be dated in the future.' })
  })

  it('refuses a bad start time, minutes outside 1 to 720, a bad typed fee and a foreign code', () => {
    expect(v({ startTime: '8am' })?.code).toBe('startTimeInvalid')
    expect(v({ recording: { kind: 'time', minutes: 0 } })?.code).toBe('minutesInvalid')
    expect(v({ recording: { kind: 'time', minutes: 721 } })?.code).toBe('minutesInvalid')
    expect(v({ recording: { kind: 'time', minutes: 12.5 } })?.code).toBe('minutesInvalid')
    expect(v({ recording: { kind: 'fixedFee', source: 'typed', amount: 0 } })?.code).toBe('amountInvalid')
    expect(v({ recording: { kind: 'fixedFee', source: 'typed', amount: 10.005 } })?.code).toBe('amountInvalid')
    expect(v({ code: 'CS250' })?.code).toBe('codeInvalid')
    expect(v({ kind: 'preOp', type: 'accPreOpAssessment', occurredOnISO: LIST, code: 'XX1' })?.code).toBe('codeInvalid')
  })
})

describe('the tables', () => {
  it('splits the types by kind', () => {
    expect(eventTypesOf('preOp')).toEqual(['accPreOpAssessment', 'otherPreOp'])
    expect(eventTypesOf('postOp')).toEqual(['postOpWardReview', 'hduReview', 'painConsult', 'otherPostOp'])
    expect(Object.keys(EVENT_TYPES)).toHaveLength(6)
  })

  it('holds the three ACC codes, with no price (OQ-12 part 1, provisional)', () => {
    expect(ACC_PREOP_PRESETS.map((p) => p.code)).toEqual(['CS250', 'CS260', 'CS70'])
    for (const p of ACC_PREOP_PRESETS) expect(Object.keys(p).sort()).toEqual(['code', 'label'])
  })

  it('the date rule', () => {
    expect(eventDateRefusal('onOrAfterList', 'x', dates)?.code).toBe('dateInvalid')
    expect(eventDateRefusal('onOrBeforeList', '2026-11-04', dates)).toBeNull()
  })
})

describe('eventInvoiceLine', () => {
  it('describes a timed post-op event replaced by a Contract fee', () => {
    const line = eventInvoiceLine(
      { id: 'EV0009', procedureId: 'P1', occurredOnISO: '2026-11-21' },
      { basis: 'contractEventFee', amount: 120, replacedMinutes: 40 },
      { lead: 'Post-op event', subject: 'Pain consult' },
    )
    expect(line).toEqual({ procedureId: 'P1', eventId: 'EV0009', serviceDateISO: '2026-11-21', description: 'Post-op event · Pain consult · 21 Nov 2026 · 40 min, Contract fee', quantity: 1, unitAmount: 120, amount: 120, kind: 'fee' })
  })

  it('carries an ACC code, and a credit as a negative adjustment', () => {
    expect(eventInvoiceLine({ id: 'E', procedureId: 'P', occurredOnISO: '2026-11-16' }, { basis: 'typedFixedFee', amount: 60 }, { lead: 'Pre-op event', subject: 'ACC pre-op assessment', code: 'CS250' }).description).toBe(
      'Pre-op event · ACC pre-op assessment · CS250 · 16 Nov 2026 · Fixed fee',
    )
    const credit = eventInvoiceLine({ id: 'E', procedureId: 'P', occurredOnISO: '2026-11-21' }, { basis: 'billingEvent', amount: -40 }, { lead: 'Credit', subject: 'Goodwill adjustment' })
    expect(credit).toMatchObject({ description: 'Credit · Goodwill adjustment · 21 Nov 2026', amount: -40, kind: 'adjustment' })
  })

  it('no en or em dash in any line', () => {
    const line = eventInvoiceLine({ id: 'E', procedureId: 'P', occurredOnISO: '2026-11-21' }, { basis: 'time', amount: 75, minutes: 45 }, { lead: 'Post-op event', subject: 'Post-op ward review' })
    expect(line.description).not.toMatch(/[–—]/)
  })
})

describe('billing events', () => {
  const ok = { direction: 'charge' as const, description: 'Nerve catheter', amount: 180, occurredOnISO: '2026-11-21' }
  it('a charge and a credit validate and price as typed (+$180.00, -$40.00)', () => {
    expect(validateBillingEvent(ok, dates)).toBeNull()
    expect(validateBillingEvent({ ...ok, direction: 'credit', description: 'Goodwill adjustment', amount: 40 }, dates)).toBeNull()
    expect(priceBillingEvent({ billable: true, direction: 'charge', amount: 180 })).toEqual({ kind: 'priced', pricing: { basis: 'billingEvent', amount: 180 } })
    expect(priceBillingEvent({ billable: true, direction: 'credit', amount: 40 })).toEqual({ kind: 'priced', pricing: { basis: 'billingEvent', amount: -40 } })
  })

  it('every refusal', () => {
    expect(validateBillingEvent({ ...ok, direction: 'x' as 'charge' }, dates)?.code).toBe('directionInvalid')
    expect(validateBillingEvent({ ...ok, description: '  ' }, dates)?.code).toBe('descriptionMissing')
    expect(validateBillingEvent({ ...ok, description: 'x'.repeat(121) }, dates)?.code).toBe('descriptionTooLong')
    expect(validateBillingEvent({ ...ok, amount: 0 }, dates)?.code).toBe('amountInvalid')
    expect(validateBillingEvent({ ...ok, amount: 100000 }, dates)?.code).toBe('amountInvalid')
    expect(validateBillingEvent({ ...ok, occurredOnISO: '2026-11-18' }, dates)?.code).toBe('dateBeforeProcedure')
    expect(validateBillingEvent({ ...ok, occurredOnISO: '2026-11-25' }, dates)?.code).toBe('dateInFuture')
  })

  it('an un-ticked billing event is never priced', () => {
    expect(priceBillingEvent({ billable: false, direction: 'charge', amount: 50 })).toMatchObject({ kind: 'refused', code: 'notInvoiced' })
  })
})

describe('Contract event fees', () => {
  const fees = { CEF001: PAIN_FEE }
  const known = Object.keys(EVENT_TYPES)
  it('finds the fee for a Contract and type', () => {
    expect(eventFeeFor({ eventFees: fees, contractId: 'CT-STG-ACC', type: 'painConsult' })?.id).toBe('CEF001')
    expect(eventFeeFor({ eventFees: fees, contractId: 'CT-STG-ACC', type: 'hduReview' })).toBeUndefined()
    expect(eventFeeFor({ eventFees: fees, contractId: undefined, type: 'painConsult' })).toBeUndefined()
  })

  it('refuses a second fee for one type, a bad price and a missing Contract', () => {
    const c = { contractExists: true, contractId: 'CT-STG-ACC', eventFees: fees, knownTypes: known }
    expect(contractEventFeeRefusal({ eventType: 'postOpWardReview', fixedPrice: 90 }, c)).toBeNull()
    expect(contractEventFeeRefusal({ eventType: 'painConsult', fixedPrice: 90 }, c)?.code).toBe('typeTaken')
    expect(contractEventFeeRefusal({ eventType: 'painConsult', fixedPrice: 90 }, { ...c, exceptId: 'CEF001' })).toBeNull()
    expect(contractEventFeeRefusal({ eventType: 'hduReview', fixedPrice: -1 }, c)?.code).toBe('priceInvalid')
    expect(contractEventFeeRefusal({ eventType: 'hduReview', fixedPrice: 0 }, c)).toBeNull()
    expect(contractEventFeeRefusal({ eventType: 'hduReview', fixedPrice: 1 }, { ...c, contractExists: false })?.code).toBe('contractNotFound')
    expect(contractEventFeeRefusal({ eventType: 'nope' as 'hduReview', fixedPrice: 1 }, c)?.code).toBe('typeInvalid')
  })
})
