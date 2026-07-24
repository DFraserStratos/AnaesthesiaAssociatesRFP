/**
 * Demo scenario staging (Phase 12) — proves the control panel's S1 to S5 jump
 * entry points stage cleanly from a fresh reset. It mirrors what the panel
 * buttons do, against an isolated store (`createAppStore` is the pristine seed,
 * i.e. a hard reset). The deep behaviour of each beat is covered by the phase
 * tests (prepayment gate, billing failure, CPH dead-letter, Xero pair, payables);
 * this file guards the new Phase 12 wiring and each scenario's headline
 * prerequisite so the guided script runs end to end.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { wireBillingRun } from './billingRun'
import { authoriseList, submitList } from './lifecycle'
import { ingestPdfRow, processMessage } from './integrationActions'
import { advanceClockToDate } from './clockActions'
import { receivePayment } from './paymentActions'
import { payablesDue, runPayables } from './payablesActions'
import { auditForEntity, cardsForList, openAccRecs } from './selectors'
import type { Actor } from './mutate'
import { ANAE, SEED_LIST_IDS, SEED_MARKERS, listIdForSlot } from '../domain/seed'
import { SURGEON_PDFS } from '../domain/integrations'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

describe('S1 · booking to theatre', () => {
  it('the St George\'s S12 booking lands a new DRAFT Card on Souter\'s Tue 28 Jul AM List', () => {
    const api = createAppStore()
    const listId = listIdForSlot(ANAE.souter, '2026-07-28', 'AM')
    const before = cardsForList(api.getState(), listId).length

    const res = processMessage(api, 'MSG-STG-1001')
    expect(res.ok).toBe(true)

    const list = api.getState().schedule.lists[listId]
    expect(list?.state).toBe('DRAFT')
    expect(cardsForList(api.getState(), listId).length).toBe(before + 1)
  })

  it('Jump to procedure day advances forward to Tue 28 Jul 08:00', () => {
    const api = createAppStore()
    advanceClockToDate(api, '2026-07-28')
    expect(api.getState().clock.todayISO).toBe('2026-07-28')
    expect(api.getState().clock.minutesSinceMidnight).toBe(8 * 60)
  })
})

describe('S2 · office day', () => {
  it('the Review queue is populated from a fresh reset (Morrison, Whitaker submitted)', () => {
    const s = createAppStore().getState()
    expect(s.schedule.lists[SEED_LIST_IDS.morrisonMon20]?.state).toBe('SUBMITTED')
    expect(s.schedule.lists[SEED_LIST_IDS.whitakerFri17]?.state).toBe('SUBMITTED')
  })
})

describe('S3 · money end-to-end', () => {
  it('submit + authorise the split-billing List runs billing, the Xero pair, a payment and payables', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const listId = listIdForSlot(ANAE.souter, '2026-07-20', 'AM')

      expect(submitList(api, OFFICE, listId).ok).toBe(true)
      expect(api.getState().schedule.lists[listId]?.state).toBe('SUBMITTED')

      expect(authoriseList(api, OFFICE, listId).ok).toBe(true)

      // The wired billing run raised invoices and handed off the Xero pair.
      expect(Object.keys(api.getState().billing.invoices).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accRecs).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accPays).length).toBeGreaterThan(0)

      // Pay the first open ACCREC in full via a webhook.
      const target = openAccRecs(api.getState())[0]
      if (target === undefined) throw new Error('expected an open ACCREC after the billing run')
      const pay = receivePayment(api, {
        accRecId: target.accRecId,
        amount: target.remaining,
        idempotencyKey: 'TEST-S3-FULL',
        source: 'webhook',
      })
      expect(pay.ok && pay.value.applied).toBe(true)

      // The paired payable is now authorised, so payables has an increment to disburse.
      expect(payablesDue(api.getState()).count).toBeGreaterThan(0)
      const run = runPayables(api, OFFICE)
      expect(run.ok && run.value.disbursedCount > 0).toBe(true)
    } finally {
      unwire()
    }
  })
})

describe('S4 · exceptions', () => {
  it('the exception prerequisites are present from a fresh reset', () => {
    const s = createAppStore().getState()
    // Unpaid pre-payment card (the completion-gate beat).
    const prepaymentCardId = SEED_MARKERS['prepaymentCard']?.entityId ?? ''
    expect(s.schedule.cards[prepaymentCardId]).toBeDefined()
    // Billing-failure exemplar list (the failure + retry beat).
    expect(s.schedule.lists[SEED_LIST_IDS.billingFailure]?.state).toBe('SUBMITTED')
  })
})

describe('S5 · compliance tour', () => {
  it('the much-edited Card carries an audit trail from a fresh reset', () => {
    const s = createAppStore().getState()
    const chenCardId = SEED_MARKERS['overriddenTimeUnitsCard']?.entityId ?? ''
    expect(s.schedule.cards[chenCardId]).toBeDefined()
    expect(auditForEntity(s, chenCardId).length).toBeGreaterThan(0)
  })
})

describe('PDF arrival · Surgeon PDF ingest', () => {
  it('ingesting the clean row creates a Card, then a re-ingest updates it (deduped by NHI)', () => {
    const api = createAppStore()
    const pdf = SURGEON_PDFS[0]
    if (pdf === undefined) throw new Error('expected a seeded surgeon PDF')
    const row = pdf.rows.find((r) => r.id === 'R2')
    if (row === undefined) throw new Error('expected the clean R2 row')
    const listId = listIdForSlot(pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)

    const first = ingestPdfRow(api, OFFICE, listId, row)
    expect(first.ok && first.value.outcome === 'created').toBe(true)

    const second = ingestPdfRow(api, OFFICE, listId, row)
    expect(second.ok && second.value.outcome === 'updated').toBe(true)
  })
})
