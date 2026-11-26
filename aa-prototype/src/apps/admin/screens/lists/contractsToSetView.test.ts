/**
 * Lists › Contracts to set as rows (US-04.3.12): one item per List from the Day rail's selector, how
 * far each Procedure still to set has got, the strong past note and the prepaid note, the toolbar's
 * filters, past Lists grouped first, and the result count. No RVG detail ever shows.
 */

import { describe, expect, it } from 'vitest'
import { addDaysISO } from '../../../../domain/clock'
import { freshAppState, type AppState } from '../../../../store'
import { listsNeedingContracts } from './listsCounts'
import {
  CONTRACT_TO_PICK,
  HOLDS_SUBMISSION,
  NOTHING_CHOSEN,
  contractsToSetCountText,
  contractsToSetHospitals,
  contractsToSetItems,
  contractsToSetStageText,
  filterContractsToSet,
  groupContractsToSet,
  parseContractsWhen,
  type ContractsToSetFilters,
} from './contractsToSetView'

const ANY: ContractsToSetFilters = { q: '', when: 'any', hospital: 'all' }

function withProcedure(state: AppState, id: string, patch: Partial<AppState['schedule']['procedures'][string]>): AppState {
  const p = state.schedule.procedures[id]!
  return { ...state, schedule: { ...state.schedule, procedures: { ...state.schedule.procedures, [id]: { ...p, ...patch } } } }
}

function withToday(state: AppState, todayISO: string): AppState {
  return { ...state, clock: { ...state.clock, todayISO } }
}

describe('contractsToSetItems', () => {
  it('is one item per List the selector returns, in its order, with set and total', () => {
    const state = freshAppState()
    const rows = listsNeedingContracts(state)
    const items = contractsToSetItems(state)
    expect(rows.length).toBeGreaterThan(0)
    expect(items.map((i) => i.listId)).toEqual(rows.map((r) => r.listId))
    items.forEach((item, n) => {
      expect(item.set).toBe(rows[n]!.set)
      expect(item.total).toBe(rows[n]!.total)
      expect(item.procedures).toHaveLength(rows[n]!.toSet.length)
      expect(item.anaesthetistName.startsWith('Dr ')).toBe(true)
      expect(item.hospitalName).not.toBe('')
    })
  })

  it('tells nothing chosen from where the invoice goes chosen, and counts each', () => {
    const state = freshAppState()
    const proc = contractsToSetItems(state)[0]!.procedures[0]!
    const blank = contractsToSetItems(withProcedure(state, proc.procedureId, { railAnswers: undefined }))[0]!
    const blankProc = blank.procedures.find((p) => p.procedureId === proc.procedureId)!
    expect(blankProc.stage).toBe('nothing')
    expect(blankProc.progressText).toBe(NOTHING_CHOSEN)
    const part = contractsToSetItems(withProcedure(state, proc.procedureId, { railAnswers: { destination: 'patient', narrow: 'standard' } }))[0]!
    const partProc = part.procedures.find((p) => p.procedureId === proc.procedureId)!
    expect(partProc.stage).toBe('partWay')
    expect(partProc.progressText).toBe(`Patient › Standard · ${CONTRACT_TO_PICK}`)
    expect(part.partWay).toBe(blank.partWay + 1)
    expect(part.nothingChosen).toBe(blank.nothingChosen - 1)
  })

  it('notes a prepaid answer only where the data says so', () => {
    const state = freshAppState()
    const item = contractsToSetItems(state)[0]!
    const proc = item.procedures[0]!
    const standard = contractsToSetItems(withProcedure(state, proc.procedureId, { railAnswers: { destination: 'patient', narrow: 'standard' } }))[0]!
    expect(standard.notes.some((n) => n.kind === 'prepaid')).toBe(false)
    const prepaid = contractsToSetItems(withProcedure(state, proc.procedureId, { railAnswers: { destination: 'patient', narrow: 'prepaid' } }))[0]!
    expect(prepaid.procedures.find((p) => p.procedureId === proc.procedureId)!.prepaid).toBe(true)
    expect(prepaid.notes.find((n) => n.kind === 'prepaid')).toMatchObject({ tone: 'warning', text: 'Prepaid chosen, Contract to pick' })
  })

  it("marks a past List strongly: it can't be submitted until set", () => {
    const state = freshAppState()
    const item = contractsToSetItems(state)[0]!
    expect(item.notes.some((n) => n.kind === 'holdsSubmission')).toBe(item.past)
    const later = contractsToSetItems(withToday(state, addDaysISO(item.dateISO, 1)))[0]!
    expect(later.past).toBe(true)
    expect(later.notes[0]).toEqual({ tone: 'error', text: HOLDS_SUBMISSION, kind: 'holdsSubmission' })
  })

  it('never shows RVG detail: no code, time or modifier words', () => {
    const words = JSON.stringify(contractsToSetItems(freshAppState()))
    expect(words).not.toMatch(/RVG|modifier|units/i)
  })
})

describe('filterContractsToSet', () => {
  it('keeps every List with no filter', () => {
    const state = freshAppState()
    const items = contractsToSetItems(state)
    expect(filterContractsToSet(state, items, ANY)).toEqual(items)
  })

  it('searches the anaesthetist, surgeon, hospital and patients still to set', () => {
    const state = freshAppState()
    const items = contractsToSetItems(state)
    const item = items[0]!
    const surname = item.anaesthetistName.replace(/^Dr /, '')
    for (const q of [surname, item.surgeonName, item.hospitalName, item.procedures[0]!.patientName]) {
      expect(filterContractsToSet(state, items, { ...ANY, q }).map((i) => i.listId)).toContain(item.listId)
    }
    expect(filterContractsToSet(state, items, { ...ANY, q: 'zzzz no such name' })).toEqual([])
  })

  it('narrows by hospital, offering only hospitals with a List here', () => {
    const state = freshAppState()
    const items = contractsToSetItems(state)
    const hospitals = contractsToSetHospitals(items)
    expect(new Set(hospitals.map((h) => h.id))).toEqual(new Set(items.map((i) => i.hospitalId)))
    const one = hospitals[0]!.id
    const kept = filterContractsToSet(state, items, { ...ANY, hospital: one })
    expect(kept.length).toBeGreaterThan(0)
    expect(kept.every((i) => i.hospitalId === one)).toBe(true)
  })

  it('When: past only, or the next two weeks from the demo day', () => {
    const base = freshAppState()
    const first = contractsToSetItems(base)[0]!
    const state = withToday(base, addDaysISO(first.dateISO, 1))
    const items = contractsToSetItems(state)
    const past = filterContractsToSet(state, items, { ...ANY, when: 'past' })
    expect(past.map((i) => i.listId)).toContain(first.listId)
    expect(past.every((i) => i.past)).toBe(true)
    const next = filterContractsToSet(state, items, { ...ANY, when: 'next2w' })
    expect(next.every((i) => i.dateISO >= state.clock.todayISO && i.dateISO <= addDaysISO(state.clock.todayISO, 13))).toBe(true)
    expect(next.some((i) => i.listId === first.listId)).toBe(false)
  })

  it('reads an unknown When as any date', () => {
    expect(parseContractsWhen('past')).toBe('past')
    expect(parseContractsWhen('next2w')).toBe('next2w')
    expect(parseContractsWhen('bogus')).toBe('any')
  })
})

describe('groups and words', () => {
  it('puts past Lists first, then the rest soonest first, leaving out an empty group', () => {
    const base = freshAppState()
    const first = contractsToSetItems(base)[0]!
    expect(groupContractsToSet(contractsToSetItems(base)).map((g) => g.key)).toEqual(contractsToSetItems(base).some((i) => i.past) ? ['past', 'coming'] : ['coming'])
    const state = withToday(base, addDaysISO(first.dateISO, 1))
    const groups = groupContractsToSet(contractsToSetItems(state))
    expect(groups[0]!.key).toBe('past')
    expect(groups[0]!.label).toBe('Past, holding up submission')
    expect(groups[0]!.items.every((i) => i.past)).toBe(true)
    const coming = groups.find((g) => g.key === 'coming')
    if (coming !== undefined) {
      const days = coming.items.map((i) => i.dateISO)
      expect(days).toEqual([...days].sort())
    }
  })

  it('counts Lists and Procedures, and says how far a List has got', () => {
    const items = contractsToSetItems(freshAppState())
    const procedures = items.reduce((n, i) => n + i.procedures.length, 0)
    expect(contractsToSetCountText(items)).toBe(`${items.length} Lists, ${procedures} Procedures`)
    expect(contractsToSetCountText(items.slice(0, 1).map((i) => ({ ...i, procedures: i.procedures.slice(0, 1) })))).toBe('1 List, 1 Procedure')
    expect(contractsToSetStageText({ nothingChosen: 2, partWay: 1 })).toBe('2 with nothing chosen · 1 part way')
    expect(contractsToSetStageText({ nothingChosen: 0, partWay: 3 })).toBe('3 part way')
  })
})
