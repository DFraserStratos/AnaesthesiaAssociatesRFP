import { describe, expect, it } from 'vitest'
import {
  addRange,
  deleteRange,
  deleteRangeRefusal,
  describePriceRange,
  describeRange,
  editRange,
  formatRangeDate,
  formatRangePrice,
  proceduresPerRange,
  rangeChange,
  rangeChangeText,
  rangeEnd,
  rangeInForce,
  rangeSpanText,
  rangeSummary,
  rangeSummaryText,
  validatePriceRanges,
  type PriceRange,
  type ProceduresPerRangeInput,
} from './priceRanges'
import { mkContract } from './fixtures'

const fixedOf = (ranges: PriceRange[]) => mkContract({ name: 'Face lift', pricing: { kind: 'fixed', ranges } })

describe("US-04.2.15's acceptance criteria", () => {
  it('Range in force: ranges from 1 April and 4 November; a Procedure dated 19 October takes the 1 April price', () => {
    const c = fixedOf([
      { startISO: '2026-04-01', price: 500 },
      { startISO: '2026-11-04', price: 550 },
    ])
    expect(rangeInForce(c, '2026-10-19')?.price).toBe(500)
    expect(rangeInForce(c, '2026-11-04')?.price).toBe(550)
    expect(rangeInForce(c, '2026-12-31')?.price).toBe(550)
  })

  it('Implied end: a range from 4 November ends the April range on 3 November; the last runs on', () => {
    const ranges = addRange([{ startISO: '2026-04-01', price: 500 }], { startISO: '2026-11-04', price: 550 })
    expect(rangeEnd(ranges, 0)).toBe('2026-11-03')
    expect(rangeEnd(ranges, 1)).toBeNull()
    expect(rangeSpanText(ranges, 0)).toBe('1 Apr 2026 to 3 Nov 2026')
    expect(rangeSpanText(ranges, 1)).toBe('From 4 Nov 2026')
  })

  it("Backdated: Merivale's Face lift at $3,100 from 5 October; on 11 March $3,200 is added from 4 February", () => {
    const before = fixedOf([{ startISO: '2026-10-05', price: 3100 }])
    const after = fixedOf(addRange([{ startISO: '2026-10-05', price: 3100 }], { startISO: '2027-02-04', price: 3200 }))
    expect(rangeInForce(before, '2027-02-18')?.price).toBe(3100)
    expect(rangeInForce(after, '2027-02-18')?.price).toBe(3200)
    expect(rangeInForce(after, '2027-01-24')?.price).toBe(3100)
  })

  it('Unique starts: two ranges on one Contract cannot share a start date', () => {
    const r = validatePriceRanges(
      [
        { startISO: '2026-10-05', price: 3100 },
        { startISO: '2026-10-05', price: 3200 },
      ],
      { prepaid: false },
    )
    expect(r).toEqual({ code: 'duplicateStart', message: 'Another price range already starts on 5 Oct 2026.' })
  })

  it('Never the last: the only range on a Contract cannot be deleted', () => {
    expect(deleteRangeRefusal([{ startISO: '2026-10-05', price: 3100 }], '2026-10-05')).toEqual({
      code: 'lastRange',
      message: 'A Contract keeps at least one price range.',
    })
    const two = [
      { startISO: '2026-10-05', price: 3100 },
      { startISO: '2027-02-04', price: 3200 },
    ]
    expect(deleteRangeRefusal(two, '2027-02-04')).toBeNull()
    expect(deleteRange(two, '2027-02-04')).toEqual([{ startISO: '2026-10-05', price: 3100 }])
    expect(deleteRangeRefusal(two, '2026-01-01')?.code).toBe('rangeMissing')
  })

  it('Not yet in force: a date before the first range has no price', () => {
    const c = fixedOf([{ startISO: '2027-01-05', price: 3100 }])
    expect(rangeInForce(c, '2027-01-04')).toBeNull()
    expect(rangeSummaryText(rangeSummary(c, '2026-11-24'))).toBe('Not in force until 5 Jan 2027')
  })
})

describe('ranges are held sorted, and only a fixed price has them', () => {
  it('adding and editing keep the ranges in start order; an edit may move a start', () => {
    const r = addRange([{ startISO: '2026-11-04', price: 550 }], { startISO: '2026-04-01', price: 500 })
    expect(r.map((x) => x.startISO)).toEqual(['2026-04-01', '2026-11-04'])
    const moved = editRange(r, '2026-11-04', { startISO: '2026-03-01', price: 450 })
    expect(moved).toEqual([
      { startISO: '2026-03-01', price: 450 },
      { startISO: '2026-04-01', price: 500 },
    ])
  })

  it('an RVG kind has no range in force on any date', () => {
    expect(rangeInForce(mkContract(), '2026-11-24')).toBeNull()
  })

  it("the List's date may carry a time; only the day counts", () => {
    expect(rangeInForce(fixedOf([{ startISO: '2026-11-24', price: 10 }]), '2026-11-24T08:00:00')?.price).toBe(10)
  })
})

describe('validatePriceRanges', () => {
  it('accepts one range, past or future, and 0 on a Contract that is not prepaid (a no-charge invoice)', () => {
    expect(validatePriceRanges([{ startISO: '2020-05-06', price: 0 }], { prepaid: false })).toBeNull()
  })

  it('refuses no range, a missing start and a negative price', () => {
    expect(validatePriceRanges([], { prepaid: false })?.code).toBe('noRange')
    expect(validatePriceRanges([{ startISO: '', price: 10 }], { prepaid: false })?.code).toBe('startRequired')
    expect(validatePriceRanges([{ startISO: '2026-01-01', price: -5 }], { prepaid: false })?.code).toBe('negativePrice')
  })

  it("refuses 0, blank (not a number) or negative on a prepaid Contract with one sentence", () => {
    for (const price of [0, Number.NaN, -1]) {
      expect(validatePriceRanges([{ startISO: '2026-01-01', price }], { prepaid: true })).toEqual({
        code: 'prepaidPriceNotAboveZero',
        message: "A prepaid Contract's price must be above zero.",
      })
    }
    expect(validatePriceRanges([{ startISO: '2026-01-01', price: 1200 }], { prepaid: true })).toBeNull()
  })
})

describe('words', () => {
  it('the audit copy reads in English', () => {
    expect(describePriceRange('Face lift', { startISO: '2027-02-04', price: 3200 })).toBe('Face lift: price range from 4 Feb 2027, $3,200.00')
    expect(describeRange({ startISO: '2026-10-05', price: 3100 })).toBe('From 5 Oct 2026, $3,100.00')
    expect(formatRangePrice(791.3)).toBe('$791.30')
    expect(formatRangePrice(1234567.891)).toBe('$1,234,567.89')
  })

  it('the list summary reads the range in force today', () => {
    const c = fixedOf([
      { startISO: '2025-01-01', price: 2800 },
      { startISO: '2026-12-01', price: 2950 },
    ])
    expect(rangeSummaryText(rangeSummary(c, '2026-11-24'))).toBe('$2,800.00 from 1 Jan 2025')
    expect(rangeSummaryText(rangeSummary(c, '2026-12-01'))).toBe('$2,950.00 from 1 Dec 2026')
  })
})

describe('formatRangeDate (UI unification U1: plainDate behind it)', () => {
  it('reads a real day as "4 Feb 2027" and anything else as typed, never throwing', () => {
    expect(formatRangeDate('2027-02-04')).toBe('4 Feb 2027')
    expect(formatRangeDate('2026-02-30')).toBe('2026-02-30')
    expect(formatRangeDate('')).toBe('')
  })
})

describe('rangeChange (build plan Phase 45: the Change column)', () => {
  it('is the change on the range before, First on the oldest', () => {
    const a = { startISO: '2026-06-01', price: 3100 }
    const b = { startISO: '2026-10-01', price: 3200 }
    expect(rangeChange(undefined, a)).toBeNull()
    expect(rangeChange(a, b)).toBeCloseTo(0.032258, 5)
    expect(rangeChangeText(undefined, a)).toBe('First')
    expect(rangeChangeText(a, b)).toBe('+3.2%')
    expect(rangeChangeText(b, a)).toBe('-3.1%')
    expect(rangeChangeText(a, { ...b, price: 3100 })).toBe('0.0%')
    expect(rangeChangeText({ startISO: '2026-01-01', price: 0 }, b)).toBe('New')
  })
})

describe('proceduresPerRange (build plan Phase 45: the Procedures column)', () => {
  const contract = fixedOf([
    { startISO: '2026-06-01', price: 3100 },
    { startISO: '2026-10-01', price: 3200 },
  ])
  const lockedAt = (procedureId: string, startISO: string, opts: { typed?: boolean } = {}) => ({
    procedureId,
    typed: opts.typed ?? false,
    price: 0,
    contract: { ...contract, pricing: { kind: 'fixed' as const, ranges: [{ startISO, price: 3100 }] } },
  })
  const lock = (bookingId: string, dateISO: string, startISO: string, opts: { typed?: boolean; prepaid?: boolean } = {}) => ({
    bookingId,
    state: 'locked' as const,
    pricingDateISO: dateISO,
    procedures: [lockedAt(`p-${bookingId}`, startISO, opts)] as never,
    settledByPrepayment: (opts.prepaid === true ? { [`p-${bookingId}`]: { amount: 3100, prepaymentInvoiceId: 'INV-P' } } : {}) as never,
  })
  /** One Procedure per Booking: `p-<booking>` on `L-<booking>`, dated and in the List state given. */
  function input(rows: { b: string; dateISO: string; state?: 'ACTIVE' | 'AUTHORISED'; entered?: number; cancelled?: boolean; contractId?: string }[]): ProceduresPerRangeInput {
    const procedures: Record<string, { id: string; bookingId: string; governingContractId: string; enteredPrice?: number }> = {}
    const bookings: Record<string, { id: string; listId: string; cancellation?: never }> = {}
    const lists: Record<string, { dateISO: string; state: 'ACTIVE' | 'AUTHORISED' }> = {}
    for (const r of rows) {
      procedures[`p-${r.b}`] = { id: `p-${r.b}`, bookingId: r.b, governingContractId: r.contractId ?? contract.id, ...(r.entered !== undefined ? { enteredPrice: r.entered } : {}) }
      bookings[r.b] = { id: r.b, listId: `L-${r.b}`, ...(r.cancelled === true ? { cancellation: {} as never } : {}) }
      lists[`L-${r.b}`] = { dateISO: r.dateISO, state: r.state ?? 'ACTIVE' }
    }
    return { procedures, bookings, lists, locks: {} }
  }

  it("counts each span's edges, and nothing before the first start", () => {
    const counts = proceduresPerRange(contract, input([
      { b: 'may31', dateISO: '2026-05-31' },
      { b: 'jun01', dateISO: '2026-06-01' },
      { b: 'sep30', dateISO: '2026-09-30' },
      { b: 'oct01', dateISO: '2026-10-01' },
    ]))
    // 31 May has no price; 1 Jun and 30 Sep are June's first and last days; 1 Oct is October's first.
    expect(counts).toEqual({ '2026-06-01': 2, '2026-10-01': 1 })
  })

  it('leaves out a typed price, a cancelled Booking, a raised prepayment and another Contract', () => {
    const i = input([
      { b: 'typed', dateISO: '2026-10-05', entered: 1200 },
      { b: 'cancelled', dateISO: '2026-10-05', cancelled: true },
      { b: 'prepaid', dateISO: '2026-10-05' },
      { b: 'other', dateISO: '2026-10-05', contractId: 'another' },
      { b: 'plain', dateISO: '2026-10-05' },
    ])
    expect(proceduresPerRange(contract, { ...i, prepaidHeld: new Set(['p-prepaid']) })['2026-10-01']).toBe(1)
  })

  it('counts an authorised price under its own range only, and a kept, typed or prepaid one nowhere', () => {
    const i = input([
      { b: 'oct15', dateISO: '2026-10-15', state: 'AUTHORISED' },
      { b: 'oct20', dateISO: '2026-10-20', state: 'AUTHORISED' },
      { b: 'oct21', dateISO: '2026-10-21', state: 'AUTHORISED' },
      { b: 'oct22', dateISO: '2026-10-22', state: 'AUTHORISED' },
      { b: 'nolock', dateISO: '2026-10-23', state: 'AUTHORISED' },
    ])
    const counts = proceduresPerRange(contract, {
      ...i,
      locks: {
        // Authorised at the October range: October's.
        k1: lock('oct15', '2026-10-15', '2026-10-01'),
        // Authorised at June's price before October's range was backdated: kept, so counted nowhere.
        k2: lock('oct20', '2026-10-20', '2026-06-01'),
        // A typed authorised price is the Procedure's own; a prepaid one is the prepayment's.
        k3: lock('oct21', '2026-10-21', '2026-10-01', { typed: true }),
        k4: lock('oct22', '2026-10-22', '2026-10-01', { prepaid: true }),
        // 'nolock': an AUTHORISED List with no lock for the Booking counts nowhere.
      },
    })
    expect(counts).toEqual({ '2026-06-01': 0, '2026-10-01': 1 })
  })

  it('is empty for a Contract with no ranges', () => {
    expect(proceduresPerRange(mkContract(), input([{ b: 'x', dateISO: '2026-10-01' }]))).toEqual({})
  })
})
