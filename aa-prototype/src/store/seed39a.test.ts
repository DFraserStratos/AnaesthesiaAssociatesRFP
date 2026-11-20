/**
 * The seed's backdrop weekly payment runs (catch-up Phase 39a; US-10.2.7):
 * every seeded payout belongs to a run, one per ISO week, built from the
 * seeded legs; every seeded receipt has its bank download line; Reset
 * restores them; and nothing moves a money figure (the ledger parity tests pin
 * the figures themselves).
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, freshAppState } from './appStore'
import { resetDomainState } from './mutate'
import { closeWeek, openCycle, openCycleDraft, runsNewestFirst } from './paymentCycleActions'
import { remittancesFor } from './remittanceSelectors'
import { anaesthetistLedgerPosition, ledgerPositionOf } from './ledgerSelectors'
import { ANAE } from '../domain/seed'
import { toCents } from '../domain/billing/money'
import { OFFICE_ACTOR } from './demoActors'

describe('backdrop weekly runs in the seed', () => {
  it('two fresh seeds deep-equal', () => {
    expect(freshAppState().billing.payablesRuns).toEqual(freshAppState().billing.payablesRuns)
  })

  it('reproduce the seeded disbursements exactly: every payout names a paid run, and each run pays what its payouts paid', () => {
    const s = freshAppState()
    const runs = s.billing.payablesRuns
    expect(Object.keys(runs).length).toBeGreaterThan(0)
    for (const d of Object.values(s.billing.disbursements)) expect(runs[d.payablesRunId]?.status, d.id).toBe('paid')
    for (const d of Object.values(s.xero.disbursements)) expect(runs[d.payablesRunId], d.id).toBeDefined()
    for (const run of Object.values(runs)) {
      expect(run).toMatchObject({ kind: 'week', seeded: true, closedBy: { who: 'Office (seeded)' } })
      const paid = Object.values(s.billing.disbursements).filter((d) => d.payablesRunId === run.id).reduce((n, d) => n + toCents(d.amount), 0)
      expect(run.byAnaesthetist.reduce((n, t) => n + toCents(t.net), 0), run.id).toBe(paid)
      expect(run.lines.reduce((n, l) => n + toCents(l.amount), 0), run.id).toBe(paid)
      // Each week's batch payments carry its bill payments.
      const batches = Object.values(s.xero.batchPayments).filter((b) => b.payablesRunId === run.id)
      expect(batches.reduce((n, b) => n + toCents(b.total), 0), run.id).toBe(paid)
    }
  })

  it('every seeded payment has its bank download line (AA fee payments go to AA, not the trust account)', () => {
    const s = freshAppState()
    const lined = new Set(Object.values(s.billing.bankLines).map((b) => b.xeroPaymentId))
    for (const p of Object.values(s.xero.payments)) {
      if (p.source === 'aaFee' || s.xero.accRecs[p.accRecId]?.kind === 'aaFee') continue
      expect(lined.has(p.id), p.id).toBe(true)
    }
  })

  it('Week 29 is the newest, so the monitor opens on Week 30 with nothing waiting; the ledger is in balance', () => {
    const s = freshAppState()
    expect(runsNewestFirst(s)[0]).toMatchObject({ cycleId: '2026-W29', status: 'paid' })
    expect(openCycle(s).cycleId).toBe('2026-W30')
    expect(openCycleDraft(s).lines).toEqual([])
    expect(ledgerPositionOf(s).inBalance).toBe(true)
    expect(anaesthetistLedgerPosition(s, ANAE.souter).inBalance).toBe(true)
  })

  it("Dr Souter's remittance advices are there on load, newest first", () => {
    const rows = remittancesFor(freshAppState(), ANAE.souter)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toMatchObject({ week: 'Week 29', status: 'paid', netted: 0 })
  })

  it('Reset restores the backdrop runs and the bank download', () => {
    const api = createAppStore()
    const before = structuredClone({ runs: api.getState().billing.payablesRuns, bank: api.getState().billing.bankLines })
    api.setState((s) => ({ billing: { ...s.billing, payablesRuns: {}, bankLines: {} } }))
    expect(closeWeek(api, OFFICE_ACTOR).ok).toBe(false)
    resetDomainState(api)
    expect({ runs: api.getState().billing.payablesRuns, bank: api.getState().billing.bankLines }).toEqual(before)
  })
})
