/**
 * The processing monitor's view (catch-up Phase 37; US-13.3.1): grouped by
 * anaesthetist, Lists awaiting approval beside authorised ones, every problem
 * kind marking its List, filters and sorts, pure.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList, wireBillingRun } from './billingRun'
import { stageBillingFailure } from './demoStaging'
import { setXeroOutage, processXeroQueue } from './xeroQueue'
import { advanceClockMinutes } from './clockActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { amendAccRecInXero, voidAccRecInXero, XERO_STAFF_ACTOR } from './xeroSimActions'
import { resolveXeroDivergence } from './xeroDivergenceActions'
import { openXeroDivergences, pairsForList } from './ledgerSelectors'
import { submittedLists } from './selectors'
import { OFFICE_ACTOR } from './demoActors'
import { billingMonitorView, monitorOptionsFromSearch, startsExpanded, MONITOR_SORT_KEYS, type MonitorSortKey } from './billingMonitorView'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { surnameOf } from '../shared/format'

const AM20 = projectedListId(ANAE.souter, '2026-07-20', 'AM')
const PM20 = projectedListId(ANAE.souter, '2026-07-20', 'PM')

const unwires: (() => void)[] = []
afterEach(() => {
  while (unwires.length > 0) unwires.pop()!()
})

function store(): BoundAppStore {
  const api = createAppStore()
  unwires.push(wireBillingRun(api))
  return api
}

function rowOf(api: BoundAppStore, listId: string, opts = {}) {
  return billingMonitorView(api.getState(), opts).groups.flatMap((g) => g.authorised).find((r) => r.listId === listId)
}

describe('billingMonitorView: groups (US-13.3.1)', () => {
  it('at reset every SUBMITTED List awaits approval in its anaesthetist group, groups in surname order', () => {
    const api = store()
    const view = billingMonitorView(api.getState())
    const submitted = submittedLists(api.getState())
    expect(submitted.length).toBeGreaterThanOrEqual(6)
    expect(view.totals.awaiting).toBe(submitted.length)
    expect(view.totals.withProblems).toBe(0)
    for (const l of submitted) {
      const g = view.groups.find((x) => x.anaesthetistId === l.anaesthetistId)!
      expect(g.awaiting.map((a) => a.list.id)).toContain(l.id)
    }
    const surnames = view.groups.map((g) => surnameOf(g.name))
    expect(surnames).toEqual([...surnames].sort((a, b) => a.localeCompare(b)))
    expect(view.groups.every((g) => g.authorised.every((r) => !r.listId.startsWith('L-HIST')))).toBe(true)
  })

  it('authorising a List moves it from awaiting to authorised', () => {
    const api = store()
    const before = billingMonitorView(api.getState())
    expect(authoriseList(api, OFFICE_ACTOR, AM20).ok).toBe(true)
    const after = billingMonitorView(api.getState())
    expect(after.totals.awaiting).toBe(before.totals.awaiting - 1)
    expect(after.totals.authorised).toBe(before.totals.authorised + 1)
    const souter = after.groups.find((g) => g.anaesthetistId === ANAE.souter)!
    expect(souter.awaiting.some((a) => a.list.id === AM20)).toBe(false)
    expect(souter.authorised.find((r) => r.listId === AM20)).toMatchObject({ problems: [], status: 'Complete' })
  })
})

describe('billingMonitorView: problems', () => {
  it('a billing exception marks its List and clears when retried', () => {
    const api = createAppStore()
    const list = SEED_LIST_IDS.billingFailure
    expect(authoriseList(api, OFFICE_ACTOR, list).ok).toBe(true)
    const locks = { ...api.getState().billing.locks }
    const losa = Object.keys(locks).find((id) => api.getState().schedule.bookings[id]?.listId === list)!
    delete locks[losa]
    api.setState({ billing: { ...api.getState().billing, locks } })
    expect(runBillingForList(api, list).ok).toBe(true)
    expect(rowOf(api, list)!.problems).toEqual(['billingException'])
    expect(rowOf(api, list)!.status).toBe('Needs attention')
  })

  it("the S4 billing failure (a hand-off waiting for Xero) marks Ropata's List until the queue sends it", () => {
    const api = store()
    expect(stageBillingFailure(api).ok).toBe(true)
    const list = SEED_LIST_IDS.billingFailure
    expect(rowOf(api, list)!.problems).toEqual(['waitingForXero'])
    advanceClockMinutes(api, 15)
    processXeroQueue(api)
    expect(rowOf(api, list)!.problems).toEqual([])
  })

  it('an outage hand-off marks its List, alerts after five attempts, and clears on restore', () => {
    const api = store()
    setXeroOutage(api, OFFICE_ACTOR, true)
    expect(authoriseList(api, OFFICE_ACTOR, PM20).ok).toBe(true)
    expect(rowOf(api, PM20)!.problems).toEqual(['waitingForXero'])
    for (let i = 0; i < 8; i += 1) {
      advanceClockMinutes(api, 60)
      processXeroQueue(api)
    }
    expect(rowOf(api, PM20)!.problems).toContain('xeroAlert')
    setXeroOutage(api, OFFICE_ACTOR, false)
    expect(rowOf(api, PM20)!.problems).toEqual([])
  })

  it('a void and an amendment made in Xero mark their List once the poll flags them, and clear when resolved', () => {
    const api = store()
    expect(authoriseList(api, OFFICE_ACTOR, AM20).ok).toBe(true)
    const recs = pairsForList(api.getState(), AM20).filter((p) => p.payable !== undefined && p.receivable.xeroAccRecId !== undefined).map((p) => p.receivable.xeroAccRecId!)
    voidAccRecInXero(api, XERO_STAFF_ACTOR, recs[0]!)
    amendAccRecInXero(api, XERO_STAFF_ACTOR, recs[1]!)
    expect(rowOf(api, AM20)!.problems).toEqual([])
    runReconciliationPoll(api)
    expect(rowOf(api, AM20)!.problems).toEqual(['voidedInXero', 'amendedInXero'])
    expect(rowOf(api, AM20)!.status).toBe('Voided in Xero')
    for (const d of openXeroDivergences(api.getState())) expect(resolveXeroDivergence(api, OFFICE_ACTOR, d.id, { outcome: 'noAction', note: 'Checked' }).ok).toBe(true)
    expect(rowOf(api, AM20)!.problems).toEqual([])
  })

  it('Problems only drops the awaiting rows and empty groups; the totals ignore it', () => {
    const api = store()
    expect(stageBillingFailure(api).ok).toBe(true)
    const view = billingMonitorView(api.getState(), { problemsOnly: true })
    expect(view.groups.map((g) => g.anaesthetistId)).toEqual([ANAE.ropata])
    expect(view.groups[0]!.awaiting).toEqual([])
    expect(view.groups[0]!.authorised.map((r) => r.listId)).toEqual([SEED_LIST_IDS.billingFailure])
    expect(view.totals).toEqual(billingMonitorView(api.getState()).totals)
    expect(view.totals.withProblems).toBe(1)
  })
})

describe('billingMonitorView: filters and sorting', () => {
  it('the anaesthetist filter narrows the groups; hospital and dates narrow the Lists; unknown ids fall back to all', () => {
    const api = store()
    const all = billingMonitorView(api.getState())
    const one = billingMonitorView(api.getState(), { anaesthetistId: ANAE.souter })
    expect(one.groups.map((g) => g.anaesthetistId)).toEqual([ANAE.souter])
    expect(one.applied.anaesthetistId).toBe(ANAE.souter)
    const unknown = billingMonitorView(api.getState(), { anaesthetistId: 'nobody', hospitalId: 'nowhere', fromISO: 'garbage' })
    expect(unknown.groups).toEqual(all.groups)
    expect(unknown.applied).toEqual({ problemsOnly: false, sort: { key: 'run', dir: 'desc' } })
    const hospital = all.hospitalOptions[0]!.id
    const byHospital = billingMonitorView(api.getState(), { hospitalId: hospital })
    expect(byHospital.groups.flatMap((g) => g.awaiting).every((a) => a.list.hospitalId === hospital)).toBe(true)
    const dated = billingMonitorView(api.getState(), { fromISO: '2026-07-20', toISO: '2026-07-20' })
    expect(dated.groups.flatMap((g) => g.awaiting).every((a) => a.list.dateISO === '2026-07-20')).toBe(true)
    expect(dated.listsInView).toBeLessThan(all.listsInView)
  })

  it('every sort key orders both ways with the List id tiebreak', () => {
    const api = store()
    for (const id of submittedLists(api.getState()).map((l) => l.id)) authoriseList(api, OFFICE_ACTOR, id)
    for (const key of MONITOR_SORT_KEYS as MonitorSortKey[]) {
      const asc = billingMonitorView(api.getState(), { sort: { key, dir: 'asc' } }).groups.flatMap((g) => g.authorised.map((r) => r.listId))
      const desc = billingMonitorView(api.getState(), { sort: { key, dir: 'desc' } }).groups.flatMap((g) => g.authorised.map((r) => r.listId))
      expect(new Set(asc)).toEqual(new Set(desc))
      const souterAsc = billingMonitorView(api.getState(), { anaesthetistId: ANAE.souter, sort: { key, dir: 'asc' } }).groups[0]!.authorised
      if (key === 'date') expect(souterAsc.map((r) => r.listId).indexOf(AM20)).toBeLessThan(souterAsc.map((r) => r.listId).indexOf(PM20))
    }
    const souterDateDesc = billingMonitorView(api.getState(), { anaesthetistId: ANAE.souter, sort: { key: 'date', dir: 'desc' } }).groups[0]!.authorised.map((r) => r.listId)
    expect(souterDateDesc.indexOf(PM20)).toBeLessThan(souterDateDesc.indexOf(AM20))
  })

  it('gives identical output for identical input', () => {
    const api = store()
    expect(billingMonitorView(api.getState(), { problemsOnly: true })).toEqual(billingMonitorView(api.getState(), { problemsOnly: true }))
  })

  it('reads its options from the URL and opens Lists at seed scale', () => {
    expect(monitorOptionsFromSearch(new URLSearchParams('anaesthetist=34821&hospital=&problems=1&sort=date-asc&list=L-1'))).toEqual({
      anaesthetistId: '34821',
      problemsOnly: true,
      sort: { key: 'date', dir: 'asc' },
      listId: 'L-1',
    })
    expect(startsExpanded({ problems: [] }, 12)).toBe(true)
    expect(startsExpanded({ problems: [] }, 13)).toBe(false)
    expect(startsExpanded({ problems: ['waitingForXero'] }, 99)).toBe(true)
  })
})
