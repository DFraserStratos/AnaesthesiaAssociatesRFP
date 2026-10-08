/**
 * The warning routine (catch-up Phase 15a; US-13.7.1 "More than one", DM-31).
 * Pure: test rules are plain objects, so this also proves a new rule plugs in
 * with nothing but a rule object and a registry entry.
 */

import { describe, expect, it } from 'vitest'
import type { Booking, List } from '../types'
import { evaluateWarnings, isOpen, strongerOf } from './routine'
import { defaultAppSettings } from './settings'
import { warningKey, type WarningClearance, type WarningFacts, type WarningRule } from './types'
import { WARNING_RULES } from './rules'

const BOOKING: Booking = {
  id: 'BK9001',
  listId: 'L-1',
  patientId: 'PT1',
  completed: false,
  attachments: [],
  lastModifiedBy: 'seed',
  lastModifiedAtISO: '2026-07-21T08:00:00',
}
const LIST = { id: 'L-1', dateISO: '2026-07-24', session: 'AM', state: 'ACTIVE' } as unknown as List

function facts(over: Partial<WarningFacts> = {}): WarningFacts {
  return { booking: BOOKING, list: LIST, procedures: [], prepaymentStatus: 'none', todayISO: '2026-07-21', ...over }
}

// Test rules reuse the registered id type through a cast: the union is narrow on purpose.
function rule(id: string, strength: 'mild' | 'strong', text: string, extra: Partial<WarningRule> = {}): WarningRule {
  return {
    id: id as WarningRule['id'],
    label: id,
    defaultParams: {},
    evaluate: () => [{ kind: 'beforeProcedure', strength, text }],
    ...extra,
  }
}

const MILD = rule('testMild', 'mild', 'A mild condition.')
const STRONG = rule('testStrong', 'strong', 'A strong condition.')

function clearance(key: string, strength: 'mild' | 'strong'): WarningClearance {
  return { key, bookingId: BOOKING.id, ruleId: 'prepaymentUnpaid', strength, by: 'Kirsty W.', role: 'office', atISO: '2026-07-21T09:00:00' }
}

describe('evaluateWarnings', () => {
  it('More than one: two conditions on one Booking give two warnings, each with its own text', () => {
    const out = evaluateWarnings(facts(), [MILD, STRONG], {}, {})
    expect(out.map((w) => w.text)).toEqual(['A strong condition.', 'A mild condition.'])
    expect(out.map((w) => w.key)).toEqual([warningKey('BK9001', STRONG.id), warningKey('BK9001', MILD.id)])
    expect(out.every((w) => w.bookingId === 'BK9001' && isOpen(w))).toBe(true)
  })

  it('sorts strong before mild, then by rule order', () => {
    const second = rule('testMild2', 'mild', 'Second mild.')
    const out = evaluateWarnings(facts(), [MILD, second, STRONG], {}, {})
    expect(out.map((w) => w.text)).toEqual(['A strong condition.', 'A mild condition.', 'Second mild.'])
  })

  it('an inactive rule raises nothing', () => {
    const settings = { [MILD.id]: { active: false, params: {} } }
    expect(evaluateWarnings(facts(), [MILD], settings, {})).toEqual([])
  })

  it('a rule missing from the settings reads as active with its defaults', () => {
    const seen: Record<string, number>[] = []
    const withParams = rule('testParams', 'mild', 'x', {
      defaultParams: { days: 7 },
      evaluate: (_f, params) => {
        seen.push({ ...params })
        return []
      },
    })
    evaluateWarnings(facts(), [withParams], {}, {})
    evaluateWarnings(facts(), [withParams], { [withParams.id]: { active: true, params: { days: 3 } } }, {})
    expect(seen).toEqual([{ days: 7 }, { days: 3 }])
  })

  it('a clearance hides a warning only at the same or a higher strength (a strengthened warning re-opens)', () => {
    const key = warningKey('BK9001', STRONG.id)
    const mildCleared = evaluateWarnings(facts(), [STRONG], {}, { [key]: clearance(key, 'mild') })
    expect(mildCleared[0]!.clearance).toBeUndefined()
    expect(isOpen(mildCleared[0]!)).toBe(true)
    const strongCleared = evaluateWarnings(facts(), [STRONG], {}, { [key]: clearance(key, 'strong') })
    expect(strongCleared[0]!.clearance?.by).toBe('Kirsty W.')
    const mildKey = warningKey('BK9001', MILD.id)
    expect(evaluateWarnings(facts(), [MILD], {}, { [mildKey]: clearance(mildKey, 'strong') })[0]!.clearance).toBeDefined()
  })

  it('a cancelled Booking raises nothing', () => {
    const cancelled = { ...BOOKING, cancellation: { reason: 'x', by: 'y', role: 'office', source: 'office', atISO: 'z' } } as Booking
    expect(evaluateWarnings(facts({ booking: cancelled }), [MILD, STRONG], {}, {})).toEqual([])
  })

  it('a per-Procedure finding carries the Procedure in its key', () => {
    const perProc = rule('testProc', 'mild', 'x', {
      evaluate: () => [{ kind: 'afterProcedure', strength: 'mild', text: 'P1', procedureId: 'P1' }],
    })
    expect(evaluateWarnings(facts(), [perProc], {}, {})[0]!.key).toBe('BK9001:testProc:P1')
  })

  it('is deterministic: the same input gives identical output', () => {
    const a = evaluateWarnings(facts(), [MILD, STRONG], {}, {})
    const b = evaluateWarnings(facts(), [MILD, STRONG], {}, {})
    expect(a).toEqual(b)
  })

  it('a throwaway rule plugs in with no change elsewhere', () => {
    const throwaway = rule('throwaway', 'mild', 'Throwaway.')
    const out = evaluateWarnings(facts({ prepaymentStatus: 'required' }), [...WARNING_RULES, throwaway], {}, {})
    expect(out.map((w) => w.ruleId)).toEqual(['prepaymentUnpaid', 'throwaway'])
  })
})

describe('defaultAppSettings and strongerOf', () => {
  it('seeds every registered rule active with its defaults', () => {
    const s = defaultAppSettings()
    for (const r of WARNING_RULES) expect(s.warningRules[r.id]).toEqual({ active: true, params: { ...r.defaultParams } })
  })

  it('strongerOf picks the stronger strength', () => {
    expect(strongerOf('mild', 'strong')).toBe('strong')
    expect(strongerOf('strong', 'mild')).toBe('strong')
    expect(strongerOf('mild', 'mild')).toBe('mild')
  })
})
