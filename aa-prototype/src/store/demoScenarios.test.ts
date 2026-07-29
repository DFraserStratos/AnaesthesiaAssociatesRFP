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
import { authoriseList, editCard, editProcedure } from './lifecycle'
import { ingestPdfRow, processMessage } from './integrationActions'
import { advanceClockToDate } from './clockActions'
import { receivePayment } from './paymentActions'
import { payablesDue, runPayables } from './payablesActions'
import { auditForEntity, cardsForList, openAccRecs, proceduresForCard } from './selectors'
import type { Actor } from './mutate'
import { ANAE, HOSP, INS, SEED_LIST_IDS, SEED_MARKERS, listIdForSlot } from '../domain/seed'
import { SURGEON_PDFS } from '../domain/integrations'
import type { Invoice } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

describe('S1 · booking to theatre', () => {
  it('the St George\'s S12 booking lands a new DRAFT Card on Souter\'s Tue 28 Jul AM List', () => {
    const api = createAppStore()
    const listId = listIdForSlot(ANAE.souter, '2026-07-28', 'AM')
    const before = cardsForList(api.getState(), listId).length
    expect(before).toBe(0)

    const res = processMessage(api, 'MSG-STG-1001')
    expect(res.ok).toBe(true)

    const list = api.getState().schedule.lists[listId]
    expect(list?.state).toBe('DRAFT')
    expect(cardsForList(api.getState(), listId)).toHaveLength(1)
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
    expect(s.schedule.lists[SEED_LIST_IDS.souterMon20Am]?.state).toBe('SUBMITTED')
    expect(s.schedule.lists[SEED_LIST_IDS.souterMon20Pm]?.state).toBe('SUBMITTED')
  })
})

describe('S3 · money end-to-end', () => {
  it('authorising both seeded Mon 20 Lists runs billing, the Xero pair, a payment and payables', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const amListId = listIdForSlot(ANAE.souter, '2026-07-20', 'AM')
      const pmListId = listIdForSlot(ANAE.souter, '2026-07-20', 'PM')

      expect(api.getState().schedule.lists[amListId]?.state).toBe('SUBMITTED')
      expect(api.getState().schedule.lists[pmListId]?.state).toBe('SUBMITTED')

      expect(authoriseList(api, OFFICE, amListId).ok).toBe(true)
      expect(authoriseList(api, OFFICE, pmListId).ok).toBe(true)

      // The wired billing run raised invoices and handed off the Xero pair.
      expect(Object.keys(api.getState().billing.invoices).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accRecs).length).toBeGreaterThan(0)
      expect(Object.keys(api.getState().xero.accPays).length).toBeGreaterThan(0)

      const invoicesFor = (cardId: string): Invoice[] =>
        Object.values(api.getState().billing.invoices).filter((i) => i.cardId === cardId)
      // The beat's contrast: same funder shares ONE invoice; two funders produce TWO.
      const split = invoicesFor(SEED_MARKERS['splitBillingCard']?.entityId ?? '')
      expect(split).toHaveLength(1)
      expect(split[0]).toMatchObject({
        invoiceNumber: 'AA-2026-0002',
        counterparty: { kind: 'hospital', id: HOSP.forte },
        total: 396.18,
      })
      const pair = invoicesFor(SEED_MARKERS['twoFunderCard']?.entityId ?? '')
      expect(pair).toHaveLength(2)
      expect(pair.find((i) => i.counterparty.kind === 'insurer')).toMatchObject({
        invoiceNumber: 'AA-2026-0005',
        counterparty: { kind: 'insurer', id: INS.nib },
        total: 152.38,
      })
      expect(pair.find((i) => i.counterparty.kind === 'hospital')).toMatchObject({
        invoiceNumber: 'AA-2026-0006',
        counterparty: { kind: 'hospital', id: HOSP.stg },
        total: 91.43,
      })

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
  it('staging writes a multi-entry audit trail on the much-edited Card (Chen)', () => {
    const api = createAppStore()
    const chenCardId = SEED_MARKERS['overriddenTimeUnitsCard']?.entityId ?? ''
    const procedure = proceduresForCard(api.getState(), chenCardId)[0]
    if (procedure === undefined) throw new Error('expected Chen\'s seeded procedure')
    const seededCardRows = auditForEntity(api.getState(), chenCardId).length
    const seededProcedureRows = auditForEntity(api.getState(), procedure.id).length

    expect(editProcedure(api, SOUTER, procedure.id, { asaClass: 'AS2' }).ok).toBe(true)
    expect(editCard(api, OFFICE, chenCardId, { notes: 'Rooms called: confirmed self-funded account details ahead of invoicing.' }).ok).toBe(true)
    expect(editProcedure(api, SOUTER, procedure.id, { asaClass: 'AS1' }).ok).toBe(true)

    // The Card History starts rich, then merges these staged Card + Procedure
    // rows after the pristine trail in append order.
    expect(
      auditForEntity(api.getState(), chenCardId)
        .slice(seededCardRows)
        .map((a) => a.action),
    ).toEqual(['card.update'])
    const procedureRows = auditForEntity(api.getState(), procedure.id)
    const stagedProcedureRows = procedureRows.slice(seededProcedureRows)
    expect(stagedProcedureRows.map((a) => a.action)).toEqual(['procedure.update', 'procedure.update'])
    expect(stagedProcedureRows[0]?.role).toBe('anaesthetist')
    expect(stagedProcedureRows[0]?.before).toEqual({ asaClass: 'AS1' })
    expect(stagedProcedureRows[0]?.after).toEqual({ asaClass: 'AS2' })

    // Staging is state-neutral where it matters: ASA back to AS1, override provenance intact.
    expect(api.getState().schedule.procedures[procedure.id]?.asaClass).toBe('AS1')
    expect(api.getState().schedule.procedures[procedure.id]?.timeUnitsCaptured).toEqual({ units: 4, source: 'overridden' })
  })

  it('stages a Health NZ invoice before the contract effective-date demonstration', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      expect(authoriseList(api, OFFICE, SEED_LIST_IDS.whitakerFri17).ok).toBe(true)
      expect(api.getState().billing.invoices['INV0002']?.invoiceNumber).toBe('AA-2026-0002')
    } finally {
      unwire()
    }
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
