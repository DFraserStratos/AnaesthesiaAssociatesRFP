/**
 * The NHI leak scan (catch-up Phase 43; US-15.0.6, OQ-30). After the whole
 * money chain, an additional invoice (38b), a hospital row's raw view and a
 * refused one, a Xero outage and restore and a billing failure, every leak
 * area reports zero; a planted test line is found; a hand-injected NHI in a
 * failure message and a patient name in a Xero contact are both found (so each
 * check is wired); the report never carries an unmasked value. Phase 16's
 * `xeroNhi.test.ts` keeps its own assertions beside this.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore, freshAppState, type AppState, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { approveAllPrepayments } from '../test/approvePrepayments'
import { receivePayment } from './paymentActions'
import { runThisWeeksCycle } from './payablesActions'
import { runMonthlyFeeInvoices } from './aaFeeActions'
import { openAccRecs } from './selectors'
import { approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { setXeroOutage } from './xeroQueue'
import { stageBillingFailure } from './demoStaging'
import { viewRawImportRow } from './rawRowActions'
import { HOSPITAL_FEED_ACTOR, OFFICE_ACTOR, SOUTER_ACTOR } from './demoActors'
import { clearDiagnostics } from './diagnostics'
import { leakScanSummary, scanForNhiLeaks, type LeakScanReport } from './privacyScan'
import { SEED_LIST_IDS, SEED_MARKERS } from '../domain/seed'
import { SEED_STUB } from '../domain/seed/intakeSeed'
import { buildFullScaleDataset } from '../domain/seed/fullScale'
import { formatCount } from '../shared/format'

afterEach(() => clearDiagnostics())

function exercised(): BoundAppStore {
  const api = createAppStore()
  for (const listId of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm]) {
    expect(authoriseList(api, OFFICE_ACTOR, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    handoffListPairs(api, listId)
  }
  expect(approveAllPrepayments(api, SEED_MARKERS.prepaymentBooking!.entityId, OFFICE_ACTOR)).toHaveLength(1)
  let i = 0
  for (const cand of openAccRecs(api.getState())) receivePayment(api, { accRecId: cand.accRecId, amount: cand.remaining, idempotencyKey: `P${i++}`, source: 'webhook' })
  expect(runThisWeeksCycle(api, OFFICE_ACTOR).ok).toBe(true)
  // The monthly AA fee run (16).
  expect(runMonthlyFeeInvoices(api, OFFICE_ACTOR, { monthISO: '2026-11' }).ok).toBe(true)
  // An additional invoice (38b) through the next run.
  expect(approveProcedureEvent(api, OFFICE_ACTOR, 'EV0001').ok).toBe(true)
  expect(runEventInvoicing(api, OFFICE_ACTOR).ok).toBe(true)
  // The raw row, viewed by the office and refused for two other roles.
  expect(viewRawImportRow(api, OFFICE_ACTOR, SEED_STUB.rowId, 'Check what the hospital sent').ok).toBe(true)
  expect(viewRawImportRow(api, SOUTER_ACTOR, SEED_STUB.rowId, 'Demo: access check').ok).toBe(false)
  expect(viewRawImportRow(api, HOSPITAL_FEED_ACTOR, SEED_STUB.rowId, 'Demo: access check').ok).toBe(false)
  // A Xero outage and its restore, and a billing failure.
  expect(setXeroOutage(api, OFFICE_ACTOR, true).ok).toBe(true)
  expect(setXeroOutage(api, OFFICE_ACTOR, false).ok).toBe(true)
  expect(stageBillingFailure(api).ok).toBe(true)
  return api
}

function leakHits(report: LeakScanReport): number {
  return report.areas.filter((a) => !a.heldByDesign).reduce((n, a) => n + a.hits.length, 0)
}

/** No raw NHI or personal value anywhere in the report. */
function expectReportClean(report: LeakScanReport, state: AppState): void {
  const text = JSON.stringify(report)
  for (const p of Object.values(state.masters.patients)) {
    if (p.nhi !== undefined) expect(text).not.toContain(p.nhi)
    expect(text).not.toContain(p.name)
  }
}

describe('the NHI leak scan', () => {
  it('reports zero in every leak area after the whole money chain, intake, an outage and a failure', () => {
    const api = exercised()
    const report = scanForNhiLeaks(api.getState())
    for (const area of report.areas) if (!area.heldByDesign) expect(area.hits, area.label).toEqual([])
    expect(report.areas.find((a) => a.key === 'xero')!.checksPersonalDetails).toBe(true)
    expect(report.areas.filter((a) => a.heldByDesign).map((a) => a.key)).toEqual(['patients', 'bookings', 'importRows', 'audit'])
    expect(report.items).toBeGreaterThan(50)
    expect(leakScanSummary(report, formatCount)).toMatch(/^Scanned 3 areas and [\d,]+ items in \d+ ms\. No NHI outside the core platform, and no personal details in Xero\.$/)
    expectReportClean(report, api.getState())
  })

  it('a planted test line reports exactly one hit, masked', () => {
    const api = exercised()
    const report = scanForNhiLeaks(api.getState(), { plantTestLeak: true })
    expect(leakHits(report)).toBe(1)
    const planted = report.areas.find((a) => a.key === 'planted')!
    expect(planted.label).toBe('Diagnostic log (planted test line)')
    expect(planted.hits[0]!.what).toMatch(/^[A-Z]{3}••••$/)
    expectReportClean(report, api.getState())
  })

  it('finds a hand-injected NHI in a billing failure and a patient name in a Xero contact', () => {
    const api = createAppStore()
    const s = api.getState()
    const patient = Object.values(s.masters.patients).find((p) => p.nhi !== undefined)!
    const bx = { id: 'BX9999', bookingId: 'BK0001', listId: 'L', code: 'x', message: `Lookup failed for ${patient.nhi}`, atISO: '2026-11-24T08:00:00' }
    const contactId = Object.keys(s.xero.contacts)[0]!
    api.setState({
      billing: { ...s.billing, exceptions: { ...s.billing.exceptions, BX9999: bx } },
      xero: { ...s.xero, contacts: { ...s.xero.contacts, [contactId]: { ...s.xero.contacts[contactId]!, name: patient.name } } },
    })
    const report = scanForNhiLeaks(api.getState())
    expect(report.areas.find((a) => a.key === 'failures')!.hits).toHaveLength(1)
    expect(report.areas.find((a) => a.key === 'xero')!.hits.some((h) => h.what === "A patient's name")).toBe(true)
    expectReportClean(report, api.getState())
  })

  it('finds nothing in the full-scale data either', () => {
    const state = buildFullScaleDataset(freshAppState(), { todayISO: '2026-11-24' }).state
    const report = scanForNhiLeaks(state)
    expect(leakHits(report)).toBe(0)
    expect(report.items).toBeGreaterThan(50000)
  }, 120_000)
})
