import { describe, expect, it } from 'vitest'
import { soleAllocation } from './multiProcedure'
import type { FeeResult } from './fee'
import type { Party } from './parties'
import {
  AA_AGENT,
  agentStatement,
  BCTI_DOCUMENT_NAME,
  btmBreakdownText,
  buyerCreatedTaxInvoiceFor,
  contractInvoicingSummary,
  crossMatchFor,
  deliveryCountsText,
  deliveryStampFor,
  formatGstNumber,
  GST_RATE,
  GST_TREATMENT_CAPTION,
  gstOn,
  invoiceDeliveryLabel,
  invoiceLayoutFor,
  invoiceLineViews,
  isValidGstNumber,
  layoutLabel,
  layoutShortLabel,
  needAddressText,
  OQ29_CAPTION,
  runDeliverySummary,
  supplierFor,
  supplierGstText,
} from './invoicePresentation'
import { invoiceDeliveryFor } from './whoIsBilled'

function fee(overrides: Partial<FeeResult> = {}): FeeResult {
  return {
    allocation: soleAllocation(true, 0),
    btm: {
      base: { units: 4, source: 'seeded' },
      baseSource: 'group',
      baseOutsideGuide: false,
      time: { units: 4, source: 'seeded' },
      modifiers: { units: 0, source: 'seeded' },
      modifierRows: [],
    } as unknown as FeeResult['btm'],
    billableUnits: 8,
    unitRate: 26.5,
    lines: [{ description: 'Anaesthesia (B + T + M units)', amount: 212, units: 8, rate: 26.5 }],
    subtotal: 212,
    price: { status: 'priced', price: 212, heldBy: null },
    total: 212,
    needsPrice: false,
    ...overrides,
  }
}

describe('GST (US-05.2.7): held GST exclusive, added at the foot', () => {
  it('is 15% in one place, with its caption', () => {
    expect(GST_RATE).toBe(0.15)
    expect(gstOn(212)).toBe(31.8)
    expect(GST_TREATMENT_CAPTION).toBe('Prices are held GST exclusive. GST is added at the foot of the invoice.')
  })
})

describe('GST numbers (DM-62)', () => {
  it('accepts 8 or 9 digits with spaces or hyphens, and formats them', () => {
    expect(isValidGstNumber('104-348-211')).toBe(true)
    expect(isValidGstNumber('12 345 678')).toBe(true)
    expect(isValidGstNumber('12')).toBe(false)
    expect(isValidGstNumber('1234567890')).toBe(false)
    expect(isValidGstNumber('abcdefgh')).toBe(false)
    expect(formatGstNumber('104348211')).toBe('104-348-211')
    expect(formatGstNumber('12345678')).toBe('12-345-678')
  })
  it('the supplier snapshot holds the number only when held', () => {
    expect(supplierFor({ registrationNumber: '34821', name: 'Dr Melanie Souter', gstNumber: '104-348-211' })).toEqual({ anaesthetistId: '34821', name: 'Dr Melanie Souter', gstNumber: '104348211' })
    const none = supplierFor({ registrationNumber: '47733', name: 'Dr Oliver Strand' })
    expect(none).toEqual({ anaesthetistId: '47733', name: 'Dr Oliver Strand' })
    expect(supplierGstText(none)).toBe('GST number not held')
    expect(supplierGstText({ gstNumber: '104348211' })).toBe('GST number 104-348-211')
  })
})

describe('the agent and the buyer-created tax invoice (US-08.4.5, US-09.1.4; provisional, OQ-29)', () => {
  const supplier = { anaesthetistId: '34821', name: 'Dr Melanie Souter', gstNumber: '104348211' }
  it('names both GST numbers, the document name and the receivable, with no dash', () => {
    const bcti = buyerCreatedTaxInvoiceFor({ invoiceNumber: 'AA-2026-0005', supplier, agent: AA_AGENT }, supplier)
    expect(bcti).toMatchObject({ kind: 'buyerCreated', documentName: BCTI_DOCUMENT_NAME, supplierGstNumber: '104348211', agentGstNumber: AA_AGENT.gstNumber, relatesToInvoiceNumber: 'AA-2026-0005', provisional: true })
    expect(bcti.wording).toBe(
      'Buyer-created tax invoice. Raised by Anaesthesia Associates Limited, GST 102-345-678, as agent, on behalf of the supplier Dr Melanie Souter, GST 104-348-211, for services invoiced on AA-2026-0005.',
    )
    expect(bcti.wording).not.toMatch(/[–—]/)
  })
  it('leaves out the supplier GST number when not held', () => {
    const none = { anaesthetistId: '47733', name: 'Dr Oliver Strand' }
    const bcti = buyerCreatedTaxInvoiceFor({ invoiceNumber: 'AA-2026-0009', supplier: none }, none)
    expect(bcti.supplierGstNumber).toBeUndefined()
    expect(bcti.wording).toContain('on behalf of the supplier Dr Oliver Strand, for services')
  })
  it('the agent sentence and the caption carry no dash', () => {
    expect(agentStatement('Dr Melanie Souter')).toBe('Issued by Anaesthesia Associates Limited as agent for Dr Melanie Souter. AA GST number 102-345-678.')
    expect(OQ29_CAPTION).not.toMatch(/[–—]/)
  })
})

describe('layout (US-04.2.8, US-08.4.1)', () => {
  it('follows the Contract for the party it bills', () => {
    expect(invoiceLayoutFor({ billsTo: 'holder' }, { kind: 'hospital', id: 'H-FORTE' }, true)).toBe('contractHolder')
    expect(invoiceLayoutFor({ billsTo: 'payer' }, { kind: 'patient', id: 'PT0001' }, true)).toBe('patient')
    expect(invoiceLayoutFor({ billsTo: 'payer' }, { kind: 'payer', id: 'BP0001' }, true)).toBe('patient')
  })
  it('an added split party by its class', () => {
    expect(invoiceLayoutFor({ billsTo: 'payer' }, { kind: 'insurer', id: 'I-NIB' }, false)).toBe('contractHolder')
    expect(invoiceLayoutFor({ billsTo: 'holder' }, { kind: 'patient', id: 'PT0001' }, false)).toBe('patient')
  })
  it('the Master data summary is derived, never stored', () => {
    expect(contractInvoicingSummary({ billsTo: 'holder' }, { deliveryMethod: 'email' })).toEqual({ layout: "Holder's layout", delivery: 'Email' })
    expect(contractInvoicingSummary({ billsTo: 'holder' }, { deliveryMethod: 'post' })).toEqual({ layout: "Holder's layout", delivery: 'Post' })
    expect(contractInvoicingSummary({ billsTo: 'payer' }, undefined)).toEqual({ layout: "Patient's layout", delivery: "Payer's email or post" })
  })
})

describe('lines (US-08.4.1)', () => {
  it('prints the invoice description, and the BTM breakdown on the holder layout only', () => {
    const holder = invoiceLineViews('contractHolder', fee(), { procedureId: 'P1', wording: 'Knee arthroscopy' })
    expect(holder).toEqual([{ procedureId: 'P1', kind: 'fee', description: 'Knee arthroscopy', amount: 212, units: 8, btm: { base: 4, time: 4, modifiers: 0, units: 8, unitValue: 26.5 } }])
    const patient = invoiceLineViews('patient', fee(), { procedureId: 'P1', wording: 'Knee arthroscopy' })
    expect(patient[0]?.btm).toBeUndefined()
    expect(patient[0]?.description).toBe('Knee arthroscopy')
  })
  it('falls back to the fee text with no invoice description', () => {
    expect(invoiceLineViews('patient', fee(), { procedureId: 'P1', wording: null })[0]?.description).toBe('Anaesthesia (B + T + M units)')
  })
  it("prints the Contract's discount as its own negative line after the fee at the gross (catch-up Phase 24)", () => {
    // 8 units at $30 = $240.00 less 10% = $216.00.
    const discounted = fee({
      lines: [
        { description: 'Anaesthesia', amount: 240, units: 8, rate: 30 },
        { role: 'discount', description: 'Discount 10%', amount: -24 },
      ],
      subtotal: 216,
      total: 216,
    })
    const views = invoiceLineViews('contractHolder', discounted, { procedureId: 'P1', wording: 'Hip' })
    expect(views.map((v) => [v.kind, v.description, v.amount])).toEqual([['fee', 'Hip', 240], ['discount', 'Discount 10%', -24]])
    expect(views[0]?.btm?.unitValue).toBe(30)
    expect(views.reduce((s, v) => s + v.amount, 0)).toBe(216)
  })
  it('prints a typed price as one fee line at the price: no adjustment, no reason', () => {
    const typed = fee({ lines: [{ description: 'Anaesthesia (B + T + M units)', amount: 200 }], subtotal: 200, total: 200 })
    const views = invoiceLineViews('patient', typed, { procedureId: 'P1', wording: 'Knee' })
    expect(views.map((v) => [v.kind, v.description, v.amount])).toEqual([['fee', 'Knee', 200]])
  })
  it('the cross-match fields: the procedure date and the surgeon, no Booking reference (catch-up Phase 25a, D82; OQ-142 open)', () => {
    expect(crossMatchFor('2026-11-23', 'Ms Lim')).toEqual({ procedureDateISO: '2026-11-23', surgeon: 'Ms Lim' })
    expect(crossMatchFor('2026-11-23', undefined)).toEqual({ procedureDateISO: '2026-11-23' })
  })
})

describe('delivery (US-08.4.2; D55, D70)', () => {
  const parties: Record<string, Party> = {
    'PY-NIB': { id: 'PY-NIB', kind: 'insurer', name: 'nib', codePrefix: 'NIB', email: 'claims@nib.example', deliveryMethod: 'email', billingIdentity: { kind: 'insurer', id: 'I-NIB' } },
    'PY-UNI': { id: 'PY-UNI', kind: 'surgeonGroup', name: 'Unisports', codePrefix: 'UNI', postalAddress: 'PO Box 1, Christchurch 8140', deliveryMethod: 'post' },
    'PY-BARE': { id: 'PY-BARE', kind: 'surgeonGroup', name: 'Bare', codePrefix: 'BARE', deliveryMethod: 'email' },
  }
  const procs = [{ payer: { kind: 'patient' as const } }]
  const at = '2026-11-24T10:00:00'
  const stamp = (ref: { kind: 'insurer' | 'party' | 'patient'; id: string }, patient: Parameters<typeof invoiceDeliveryFor>[3]) =>
    deliveryStampFor(invoiceDeliveryFor(ref, procs, 'PT0001', patient, parties), at, 'Billing run')

  it('a holder Party on email is sent; on post is marked to post', () => {
    expect(stamp({ kind: 'insurer', id: 'I-NIB' }, undefined)).toEqual({ method: 'email', status: 'sent', sends: [{ atISO: at, to: 'claims@nib.example', by: 'Billing run' }] })
    expect(stamp({ kind: 'party', id: 'PY-UNI' }, undefined)).toEqual({ method: 'post', status: 'toPost', address: ['PO Box 1, Christchurch 8140'], markedAtISO: at })
  })
  it('a holder Party on email with no address has no address', () => {
    expect(stamp({ kind: 'party', id: 'PY-BARE' }, undefined)).toEqual({ method: 'email', status: 'noAddress' })
  })
  it('the payer by email, else post, else no address', () => {
    expect(stamp({ kind: 'patient', id: 'PT0001' }, { name: 'A', email: 'a@example.net' })).toMatchObject({ status: 'sent', sends: [{ to: 'a@example.net' }] })
    const postal = { line1: '1 High St', city: 'Christchurch', postcode: '8011' }
    expect(stamp({ kind: 'patient', id: 'PT0001' }, { name: 'A', postalAddress: postal })).toMatchObject({ method: 'post', status: 'toPost' })
    expect(stamp({ kind: 'patient', id: 'PT0001' }, { name: 'A' })).toEqual({ method: 'email', status: 'noAddress' })
  })
  it('labels', () => {
    expect(invoiceDeliveryLabel({ method: 'email', status: 'sent', sends: [{ atISO: at, to: 'claims@nib.example', by: 'Billing run' }] })).toEqual({ tone: 'success', short: 'Emailed 10:00', text: 'Emailed to claims@nib.example at 10:00' })
    expect(invoiceDeliveryLabel({ method: 'post', status: 'toPost', address: [], markedAtISO: at }).text).toBe('To post')
    expect(invoiceDeliveryLabel({ method: 'email', status: 'noAddress' })).toEqual({ tone: 'warning', short: 'No invoice address', text: 'No invoice address' })
  })
})

describe('the BTM breakdown line (US-08.4.1)', () => {
  it('prints the full sum on a first procedure', () => {
    expect(btmBreakdownText({ base: 4, time: 4, modifiers: 0, units: 8, unitValue: 26.5 })).toBe('Base 4 + Time 4 + Modifiers 0 = 8 units at $26.50')
    expect(btmBreakdownText({ base: 6, time: 3, modifiers: 2, units: 11, unitValue: 30 })).toBe('Base 6 + Time 3 + Modifiers 2 = 11 units at $30.00')
  })
  it('reads a line issued before catch-up Phase 23 (full B/T/M stored, no role) as it did', () => {
    expect(btmBreakdownText({ base: 4, time: 2, modifiers: 0, units: 2, unitValue: 26.5 })).toBe('Additional procedure: Time 2 units at $26.50')
  })
  it('prints the multi-procedure split: the primary\'s share of the Booking\'s modifiers, and an additional procedure\'s time and share (catch-up Phase 23)', () => {
    expect(btmBreakdownText({ base: 6, time: 6, modifiers: 3, modifiersOf: 7, units: 15, unitValue: 26.5 })).toBe('Base 6 + Time 6 + Modifiers 3 of 7 = 15 units at $26.50')
    expect(btmBreakdownText({ base: 0, time: 2, modifiers: 2, modifiersOf: 7, units: 4, unitValue: 26.5, role: 'additional' })).toBe('Additional procedure: Time 2 + Modifiers 2 of 7 = 4 units at $26.50')
    expect(btmBreakdownText({ base: 0, time: 2, modifiers: 0, units: 2, unitValue: 26.5, role: 'additional' })).toBe('Additional procedure: Time 2 units at $26.50')
  })
})

describe('delivery wording (US-08.4.2)', () => {
  const sent = { delivery: { method: 'email' as const, status: 'sent' as const, sends: [{ atISO: '2026-11-24T08:00:00', to: 'a@example.net', by: 'Billing run' }] } }
  const post = { delivery: { method: 'post' as const, status: 'toPost' as const, address: ['PO Box 1'], markedAtISO: '2026-11-24T08:00:00' } }
  const none = { delivery: { method: 'email' as const, status: 'noAddress' as const } }

  it('runDeliverySummary with and without missing addresses', () => {
    expect(runDeliverySummary([sent, sent, sent, post, none])).toBe('5 invoices raised. 3 emailed, 1 to post, 1 needs an invoice address.')
    expect(runDeliverySummary([sent, sent, post])).toBe('3 invoices raised. 2 emailed, 1 to post.')
    expect(runDeliverySummary([sent])).toBe('1 invoice raised. 1 emailed, 0 to post.')
    expect(runDeliverySummary([none, none])).toBe('2 invoices raised. 0 emailed, 0 to post, 2 need an invoice address.')
  })
  it('deliveryCountsText and needAddressText', () => {
    expect(deliveryCountsText(3, 1, 0)).toBe('3 emailed, 1 to post.')
    expect(deliveryCountsText(3, 1, 1)).toBe('3 emailed, 1 to post, 1 needs an invoice address.')
    expect(deliveryCountsText(0, 0, 3)).toBe('0 emailed, 0 to post, 3 need an invoice address.')
    expect(needAddressText(1)).toBe('1 needs an invoice address')
    expect(needAddressText(2)).toBe('2 need an invoice address')
  })
  it('layout labels, long and short', () => {
    expect(layoutShortLabel('contractHolder')).toBe('Holder')
    expect(layoutShortLabel('patient')).toBe('Patient')
    expect(layoutLabel('contractHolder')).toBe("Holder's layout")
    expect(layoutLabel('patient')).toBe("Patient's layout")
  })
  it('carries no en or em dash', () => {
    for (const t of [runDeliverySummary([sent, post, none]), deliveryCountsText(1, 1, 1)]) expect(t).not.toMatch(/[–—]/)
  })
})
