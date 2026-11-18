import { describe, expect, it } from 'vitest'
import type { Booking, List } from '../../types'
import type { WarningFacts, WarningPrepaymentGroup } from '../types'
import {
  prepaymentAwaitingText,
  prepaymentChangedText,
  prepaymentNotNeededText,
  prepaymentPartPaidText,
  prepaymentUnpaidRule,
  prepaymentUnpaidText,
} from './prepaymentUnpaid'

const DEFAULTS = prepaymentUnpaidRule.defaultParams

const group = (over: Partial<WarningPrepaymentGroup> = {}): WarningPrepaymentGroup => ({
  payerKey: 'patient:PT1',
  payerName: 'Annette Riley',
  status: 'awaitingApproval',
  amount: 1200,
  invoicedTotal: 0,
  receivedTotal: 0,
  ...over,
})

/** The List on Fri 24 Jul; today moves. */
function facts(todayISO: string, groups: WarningPrepaymentGroup[], listState: List['state'] = 'ACTIVE'): WarningFacts {
  return {
    booking: { id: 'BK1' } as Booking,
    list: { id: 'L1', dateISO: '2026-07-24', state: listState } as List,
    procedures: [],
    prepaymentStatus: groups[0]?.status ?? 'none',
    prepaymentGroups: groups,
    todayISO,
  }
}

const strengthOn = (todayISO: string, g = group()) => prepaymentUnpaidRule.evaluate(facts(todayISO, [g]), DEFAULTS).map((f) => f.strength)

describe('prepaymentUnpaid rule (US-06.3.2, D5; catch-up Phase 27)', () => {
  it('escalates by date: nothing 8 days out, mild from 7, strong from 2, the day and a passed date included', () => {
    expect(strengthOn('2026-07-16')).toEqual([]) // 8 days
    expect(strengthOn('2026-07-17')).toEqual(['mild']) // 7
    expect(strengthOn('2026-07-21')).toEqual(['mild']) // 3: Riley on the seeded Tue 21 Jul
    expect(strengthOn('2026-07-22')).toEqual(['strong']) // 2
    expect(strengthOn('2026-07-24')).toEqual(['strong']) // 0
    expect(strengthOn('2026-07-25')).toEqual(['strong']) // -1
  })

  it('the params move the windows', () => {
    const out = prepaymentUnpaidRule.evaluate(facts('2026-07-14', [group()]), { mildWithinDays: 14, strongWithinDays: 10 })
    expect(out.map((f) => f.strength)).toEqual(['strong'])
  })

  it('each status has its text, naming the payer; paid raises nothing; nothing once AUTHORISED', () => {
    const on = (g: WarningPrepaymentGroup) => prepaymentUnpaidRule.evaluate(facts('2026-07-21', [g]), DEFAULTS)[0]?.text
    expect(on(group())).toBe('Prepayment of $1,200.00 from Annette Riley is awaiting approval on Invoices and has not been sent.')
    expect(on(group({ status: 'unpaid', invoiceNumber: 'AA-2026-0002', invoicedTotal: 1380 }))).toBe(prepaymentUnpaidText('AA-2026-0002', 'Annette Riley'))
    expect(on(group({ status: 'partPaid', invoiceNumber: 'AA-2026-0002', invoicedTotal: 1380, receivedTotal: 690 }))).toBe(
      'Prepayment part paid by Annette Riley, $690.00 of $1,380.00 received. Check with the payer before surgery starts.',
    )
    expect(on(group({ status: 'paid', invoiceNumber: 'AA-2026-0002' }))).toBeUndefined()
    expect(prepaymentUnpaidRule.evaluate(facts('2026-07-21', [group()], 'AUTHORISED'), DEFAULTS)).toEqual([])
  })

  it('sent and then no longer needed, or sent before a change: one mild office finding whatever the date (the interim until 41)', () => {
    const far = '2026-06-01'
    const nn = prepaymentUnpaidRule.evaluate(facts(far, [group({ status: 'notNeeded', invoiceNumber: 'AA-2026-0001' })]), DEFAULTS)
    expect(nn).toEqual([{ kind: 'beforeProcedure', strength: 'mild', text: prepaymentNotNeededText('AA-2026-0001'), scope: 'patient:PT1:AA-2026-0001' }])
    const ch = prepaymentUnpaidRule.evaluate(facts(far, [group({ status: 'changedAfterSending', invoiceNumber: 'AA-2026-0001' })]), DEFAULTS)
    expect(ch[0]?.text).toBe(prepaymentChangedText('AA-2026-0001'))
  })

  it("two payer groups give two findings, each keyed by its payer, so clearing one never hides the other's", () => {
    const out = prepaymentUnpaidRule.evaluate(facts('2026-07-21', [group(), group({ payerKey: 'payer:BP0006', payerName: 'Erik Halvorsen', amount: 900 })]), DEFAULTS)
    expect(out.map((f) => f.scope)).toEqual(['patient:PT1', 'payer:BP0006'])
  })

  it('a group with no price yet still awaits approval, and says what to do', () => {
    expect(prepaymentAwaitingText(null, 'Annette Riley')).toContain('Type an amount above zero first')
  })

  it('its texts carry no en or em dash', () => {
    const all = [prepaymentAwaitingText(1200, 'A'), prepaymentAwaitingText(null, 'A'), prepaymentUnpaidText('N', 'A'), prepaymentPartPaidText('A', 1, 2), prepaymentNotNeededText('N'), prepaymentChangedText('N')].join('')
    expect(all).not.toMatch(/[–—]/)
  })
})
