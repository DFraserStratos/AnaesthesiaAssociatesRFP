import { describe, expect, it } from 'vitest'
import type { SplitShare } from '../types'
import {
  NO_FEE_REASON,
  PARTY_GONE_REASON,
  parseShare,
  resolveSplit,
  shareLabel,
  splitDoesNotFitMessage,
  splitLineText,
  splitNoteText,
  splitSummaryText,
  SHARE_PARSE_MESSAGE,
} from './splitShare'
import { toCents } from './money'

const NIB = { kind: 'insurer' as const, id: 'I-NIB' }
const ALAN = { kind: 'patient' as const, id: 'PT0004' }
const STG = { kind: 'hospital' as const, id: 'H-STG' }

const amount = (party: SplitShare['party'], amountExGst: number): SplitShare => ({ party, basis: { kind: 'amount', amountExGst } })
const percent = (party: SplitShare['party'], p: number): SplitShare => ({ party, basis: { kind: 'percent', percent: p } })
const rest = (party: SplitShare['party']): SplitShare => ({ party, basis: { kind: 'rest' } })

function amountsOf(fee: number, shares: SplitShare[]): number[] {
  const r = resolveSplit(fee, shares)
  if (!r.ok) throw new Error(r.reason)
  return r.amounts.map((a) => a.amountExGst)
}

describe('parseShare (US-08.2.3)', () => {
  it('reads $ amounts, bare numbers as dollars, and percents', () => {
    expect(parseShare('$48')).toEqual({ ok: true, basis: { kind: 'amount', amountExGst: 48 } })
    expect(parseShare('48')).toEqual({ ok: true, basis: { kind: 'amount', amountExGst: 48 } })
    expect(parseShare('$132.50')).toEqual({ ok: true, basis: { kind: 'amount', amountExGst: 132.5 } })
    expect(parseShare('48%')).toEqual({ ok: true, basis: { kind: 'percent', percent: 48 } })
    expect(parseShare('48.5 %')).toEqual({ ok: true, basis: { kind: 'percent', percent: 48.5 } })
  })
  it('refuses blank and words with the one message', () => {
    expect(parseShare('')).toEqual({ ok: false, reason: SHARE_PARSE_MESSAGE })
    expect(parseShare('abc')).toEqual({ ok: false, reason: SHARE_PARSE_MESSAGE })
  })
})

describe('resolveSplit: Prentice, $212.00', () => {
  it('gives 132.50 and 79.50 from each of the four equivalent share sets', () => {
    expect(amountsOf(212, [amount(NIB, 132.5), rest(ALAN)])).toEqual([132.5, 79.5])
    expect(amountsOf(212, [percent(NIB, 62.5), rest(ALAN)])).toEqual([132.5, 79.5])
    expect(amountsOf(212, [amount(NIB, 132.5), amount(ALAN, 79.5)])).toEqual([132.5, 79.5])
    expect(amountsOf(212, [percent(NIB, 62.5), percent(ALAN, 37.5)])).toEqual([132.5, 79.5])
  })
  it('nib 60% and Alan the rest gives 127.20 and 84.80', () => {
    expect(amountsOf(212, [percent(NIB, 60), rest(ALAN)])).toEqual([127.2, 84.8])
  })
  it('three parties: insurer 50%, hospital $50, patient the rest', () => {
    expect(amountsOf(212, [percent(NIB, 50), amount(STG, 50), rest(ALAN)])).toEqual([106, 50, 56])
  })
  it('marks the rest share', () => {
    const r = resolveSplit(212, [amount(NIB, 132.5), rest(ALAN)])
    expect(r.ok && r.amounts.map((a) => a.isRest)).toEqual([false, true])
  })
})

describe('resolveSplit: refusals', () => {
  it.each([
    ['one share', [rest(ALAN)]],
    ['a duplicate party', [amount(NIB, 10), rest(NIB)]],
    ['two rests', [rest(NIB), rest(ALAN)]],
    ['shares over the fee with a rest', [amount(NIB, 212), rest(ALAN)]],
    ['shares not totalling the fee without a rest', [amount(NIB, 100), amount(ALAN, 100)]],
    ['percents not totalling 100', [percent(NIB, 60), percent(ALAN, 30)]],
    ['0%', [percent(NIB, 0), rest(ALAN)]],
    ['100%', [percent(NIB, 100), rest(ALAN)]],
    ['a non-positive amount', [amount(NIB, 0), rest(ALAN)]],
    ['a negative amount', [amount(NIB, -5), rest(ALAN)]],
  ] as const)('refuses %s', (_name, shares) => {
    expect(resolveSplit(212, shares as unknown as SplitShare[]).ok).toBe(false)
  })
  it('refuses a fee of nothing', () => {
    expect(resolveSplit(0, [amount(NIB, 1), rest(ALAN)]).ok).toBe(false)
  })
})

describe('resolveSplit: conservation to the cent', () => {
  it('always totals the fee over a sweep of fees, percents, amounts and party counts', () => {
    const parties = [NIB, STG, ALAN, { kind: 'payer' as const, id: 'BP0001' }]
    const fees = [0.03, 1, 33.33, 99.99, 212, 243.8, 1000.01, 2861]
    let checked = 0
    for (const fee of fees) {
      for (const pct of [1, 12.5, 33.33, 50, 62.5, 66.67, 99]) {
        for (let n = 2; n <= 4; n++) {
          // percent first, an amount where it fits, the rest last
          const shares: SplitShare[] = [percent(parties[0]!, pct)]
          if (n >= 3) shares.push(amount(parties[1]!, Math.min(0.01, fee / 10) || 0.01))
          if (n >= 4) shares.push(percent(parties[3]!, 1))
          shares.push(rest(parties[2]!))
          const r = resolveSplit(fee, shares)
          if (!r.ok) continue
          checked++
          expect(r.amounts.reduce((s, a) => s + toCents(a.amountExGst), 0)).toBe(toCents(fee))
        }
        // all percents to 100: rounding cents land on the first share
        const r = resolveSplit(fee, [percent(NIB, pct), percent(ALAN, Number((100 - pct).toFixed(2)))])
        if (r.ok) {
          checked++
          expect(r.amounts.reduce((s, a) => s + toCents(a.amountExGst), 0)).toBe(toCents(fee))
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})

describe('the split wording (one place)', () => {
  it('labels, line, note and summary', () => {
    expect(shareLabel({ kind: 'amount', amountExGst: 132.5 })).toBe('$132.50')
    expect(shareLabel({ kind: 'percent', percent: 62.5 })).toBe('62.5%')
    expect(shareLabel({ kind: 'rest' })).toBe('the rest')
    expect(splitLineText('Knee arthroscopy', 212, { kind: 'rest' })).toBe('Knee arthroscopy: share of the fee of $212.00 (the rest)')
    expect(splitNoteText(212, [{ partyName: 'nib', invoiceNumber: 'AA-2026-0005' }])).toBe(
      'This fee of $212.00 is split. The other share is invoiced separately to nib, AA-2026-0005.',
    )
    expect(splitSummaryText([{ partyName: 'nib', amountExGst: 132.5, isRest: false }, { partyName: 'Alan Prentice', amountExGst: 79.5, isRest: true }])).toBe(
      'Split: nib $132.50, Alan Prentice $79.50 (the rest)',
    )
  })
  it('has no en or em dashes', () => {
    const texts = [splitLineText('x', 1, { kind: 'rest' }), splitNoteText(1, [{ partyName: 'a', invoiceNumber: 'b' }]), SHARE_PARSE_MESSAGE]
    for (const t of texts) expect(t).not.toMatch(/[–—]/)
  })
})

describe('resolveSplit: review fixes (catch-up Phase 22)', () => {
  const reasonOf = (fee: number, shares: SplitShare[]): string => {
    const r = resolveSplit(fee, shares)
    if (r.ok) throw new Error('expected a refusal')
    return r.reason
  }

  it('refuses a share that rounds to $0.00, never drops it', () => {
    expect(reasonOf(212, [percent(NIB, 0.001), rest(ALAN)])).toBe('Each share must come to at least $0.01 of the fee.')
    expect(reasonOf(0.01, [percent(NIB, 50), percent(ALAN, 50)])).toBe('Each share must come to at least $0.01 of the fee.')
  })

  it('requires percents to total exactly 100, naming the total', () => {
    const third = reasonOf(212, [percent(NIB, 33.333), percent(STG, 33.333), percent(ALAN, 33.333)])
    expect(third).toContain('99.999%')
    expect(third).toBe('The percentages come to 99.999%. They must total 100%, or let one party take the rest.')
    expect(reasonOf(212, [percent(NIB, 33.3333), percent(STG, 33.3333), percent(ALAN, 33.3333)])).toContain('99.9999%')
  })

  it('62.5% and 37.5% still resolve', () => {
    expect(amountsOf(212, [percent(NIB, 62.5), percent(ALAN, 37.5)])).toEqual([132.5, 79.5])
  })

  it('a fee of nothing gives the no fee reason', () => {
    expect(reasonOf(0, [percent(NIB, 50), rest(ALAN)])).toBe(NO_FEE_REASON)
  })

  it('splitDoesNotFitMessage lowers the reason into one sentence', () => {
    expect(splitDoesNotFitMessage(212, PARTY_GONE_REASON)).toBe(
      'The split no longer fits the fee of $212.00: a party in the split is no longer on this Booking or in the Parties list. Open Split to fix it.',
    )
    expect(splitDoesNotFitMessage(212, PARTY_GONE_REASON)).not.toMatch(/[–—]/)
  })
})
