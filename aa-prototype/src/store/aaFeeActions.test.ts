/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1, US-10.3.3): the
 * seeded history, the monthly run, the settings write, the fee payment, the
 * guards on the procedure money paths, and the rule that the fee is never
 * netted against a payable.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList, handoffListCases } from './billingRun'
import { receivePayment } from './paymentActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { payablesDue, runPayables } from './payablesActions'
import { resetDomainState, type Actor } from './mutate'
import {
  AA_FEE_PAYMENT_ACTOR,
  AA_FEE_RUN_ACTOR,
  aaFeeRunDisabledReason,
  recordAaFeePayment,
  runMonthlyFeeInvoices,
  saveAaFeeSettings,
} from './aaFeeActions'
import { aaFeeInvoicesFor, aaFeeRunPreview, allAaFeeInvoices, bctiRecords, billingMonitor, gstActivityFor, openAccRecs } from './selectors'
import { advanceClockDays } from './clockActions'
import { seedMonthOfBctis } from './demoBctiSeed'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { aaFeeFor, aaFeeBctiLineLabel } from '../domain/billing/aaFee'
import { bctisFor } from '../domain/billing/bcti'
import { ANAE, SEED_LIST_IDS } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

function store(): BoundAppStore {
  return createAppStore()
}

function activeCount(api: BoundAppStore): number {
  return Object.values(api.getState().masters.anaesthetists).filter((a) => a.active).length
}

function moneySnapshot(api: BoundAppStore) {
  const s = api.getState()
  return {
    accPays: Object.values(s.xero.accPays).map((p) => [p.id, p.amountPayable, p.amountAuthorised, p.amountDisbursed]),
    disbursements: s.xero.disbursements,
    receipts: s.billing.receipts,
    cases: s.billing.cases,
    due: payablesDue(s),
    gst: gstActivityFor(s, ANAE.souter, '2026-01-01', '2026-12-31'),
    open: openAccRecs(s),
  }
}

describe('seeded fee history (Dr Souter)', () => {
  it('seeds May paid and June unpaid, each computed from the BCTIs paid that month', () => {
    const state = store().getState()
    const rows = aaFeeInvoicesFor(state, ANAE.souter)
    expect(rows.map((r) => [r.invoiceNumber, r.monthISO, r.status])).toEqual([
      ['AA-FEE-2026-H02', '2026-06', 'unpaid'],
      ['AA-FEE-2026-H01', '2026-05', 'paid'],
    ])
    const records = bctiRecords(state)
    for (const row of rows) {
      const counted = bctisFor(records, ANAE.souter, row.monthISO)
      const fee = aaFeeFor(state.appSettings.aaFee, counted.length, aaFeeBctiLineLabel(row.monthISO))
      expect(row.bctiCount).toBe(counted.length)
      expect([row.subtotal, row.gst, row.total]).toEqual([fee.subtotal, fee.gst, fee.total])
      expect(row.bctis.map((b) => b.accPayId)).toEqual(counted.map((r) => r.accPayId))
      for (const b of row.bctis) expect(b.receivablePaidAtISO?.slice(0, 7)).toBe(row.monthISO)
      // Its ACCREC is an AA fee receivable against her payee contact, with no ACCPAY.
      const accRec = state.xero.accRecs[row.accRecId]!
      expect(accRec.kind).toBe('aaFee')
      expect(accRec.contactId).toBe(state.billing.contactIdCache[`anaesthetist:${ANAE.souter}`])
      expect(Object.values(state.xero.accPays).some((p) => p.accRecId === row.accRecId)).toBe(false)
    }
    // Only Dr Souter has seeded billing history, so only she has fee history.
    expect(allAaFeeInvoices(state)).toHaveLength(2)
  })

  it('reset restores the fee map and the settings', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' }).ok).toBe(true)
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 9 }).ok).toBe(true)
    resetDomainState(api)
    expect(allAaFeeInvoices(api.getState())).toHaveLength(2)
    expect(api.getState().appSettings.aaFee).toEqual(store().getState().appSettings.aaFee)
  })
})

describe('runMonthlyFeeInvoices', () => {
  it('raises one fee invoice per active anaesthetist for the month, fixed items only with no BCTIs', () => {
    const api = store()
    const preview = aaFeeRunPreview(api.getState(), '2026-07')
    expect(preview).toHaveLength(activeCount(api))
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    expect(res.ok && res.value.raisedCount).toBe(activeCount(api))
    const july = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-07')
    expect(july).toHaveLength(activeCount(api))
    expect(new Set(july.map((f) => f.anaesthetistId)).size).toBe(july.length)
    for (const f of july) {
      const row = preview.find((p) => p.anaesthetistId === f.anaesthetistId)!
      expect([f.bctiCount, f.subtotal, f.total]).toEqual([row.bctiCount, row.subtotal, row.total])
      expect(f.raisedBy).toBe('office')
      expect(f.status).toBe('unpaid')
      expect(f.invoiceNumber).toMatch(/^AA-FEE-2026-\d{4}$/)
    }
    const none = july.find((f) => f.bctiCount === 0)!
    expect(none.subtotal).toBe(none.settings.fixedItems.reduce((s, i) => s + i.amount, 0))
  })

  it('reuses each anaesthetist contact: no duplicate for Dr Souter, one created once for the others', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const s = api.getState()
    const souterFee = aaFeeInvoicesFor(s, ANAE.souter).find((f) => f.monthISO === '2026-07')!
    expect(s.xero.accRecs[souterFee.accRecId]!.contactId).toBe('XCH01')
    const numbers = Object.values(s.xero.contacts).map((c) => c.contactNumber).filter((n) => n.startsWith('ANAE-'))
    expect(new Set(numbers).size).toBe(numbers.length)
    expect(numbers).toHaveLength(activeCount(api))
    // A later run for another month reuses them all.
    const contactsBefore = Object.keys(s.xero.contacts).length
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-04' })
    expect(Object.keys(api.getState().xero.contacts)).toHaveLength(contactsBefore)
  })

  it('a rerun for an invoiced month raises nothing and does not mutate', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const auditBefore = api.getState().audit.length
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    expect(res).toMatchObject({ ok: true, value: { raisedCount: 0 } })
    expect(api.getState().audit.length).toBe(auditBefore)
    expect(aaFeeRunDisabledReason(api.getState(), '2026-07')).toBe('Every active anaesthetist already has a fee invoice for July 2026.')
  })

  it('June raises for everyone but Dr Souter, who was invoiced by the seed', () => {
    const api = store()
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-06' })
    expect(res.ok && res.value.raisedCount).toBe(activeCount(api) - 1)
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).filter((f) => f.monthISO === '2026-06')).toHaveLength(1)
  })

  it('refuses a future month and an anaesthetist', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-08' })).toMatchObject({ ok: false, code: 'futureMonth' })
    expect(aaFeeRunDisabledReason(api.getState(), '2026-08')).toBe('August 2026 has not started yet.')
    expect(runMonthlyFeeInvoices(api, SOUTER, { monthISO: '2026-07' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('the scheduled run is audited as the system actor', () => {
    const api = store()
    runMonthlyFeeInvoices(api, AA_FEE_RUN_ACTOR, { monthISO: '2026-07' })
    const raised = api.getState().audit.filter((e) => e.action === 'aaFee.invoiceRaised')
    expect(raised).toHaveLength(activeCount(api))
    for (const e of raised) expect([e.who, e.role, e.source]).toEqual(['AA fee run (scheduled)', 'system', 'system'])
    expect(api.getState().audit.filter((e) => e.action === 'xero.feeAccRecCreated')).toHaveLength(activeCount(api))
    expect(allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-07').every((f) => f.raisedBy === 'scheduled')).toBe(true)
  })

  it('counts a BCTI only once its receivable is paid, in the month it is paid', () => {
    const api = store()
    const before = aaFeeRunPreview(api.getState(), '2026-07').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount
    for (const listId of [SEED_LIST_IDS.souterMon20Am, SEED_LIST_IDS.souterMon20Pm]) {
      authoriseList(api, OFFICE, listId)
      runBillingForList(api, listId)
      handoffListCases(api, listId)
    }
    const souterOpen = openAccRecs(api.getState()).filter((c) => {
      const pay = Object.values(api.getState().xero.accPays).find((p) => p.accRecId === c.accRecId)
      return pay?.anaesthetistId === ANAE.souter
    })
    expect(souterOpen.length).toBeGreaterThan(0)
    expect(aaFeeRunPreview(api.getState(), '2026-07').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before)
    const target = souterOpen[0]!
    // A part payment does not count it yet; the completing payment does.
    receivePayment(api, { accRecId: target.accRecId, amount: 1, idempotencyKey: 'PART', source: 'webhook' })
    expect(aaFeeRunPreview(api.getState(), '2026-07').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before)
    receivePayment(api, { accRecId: target.accRecId, amount: target.remaining, idempotencyKey: 'REST', source: 'webhook' })
    expect(aaFeeRunPreview(api.getState(), '2026-07').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before + 1)
  })
})

describe('saveAaFeeSettings', () => {
  it('is office only, validated, audited, and applies to the next run, never a raised invoice', () => {
    const api = store()
    const settings = api.getState().appSettings.aaFee
    expect(saveAaFeeSettings(api, SOUTER, settings)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(saveAaFeeSettings(api, OFFICE, { ...settings, perBctiCharge: -1 })).toMatchObject({ ok: false, code: 'invalidSettings' })
    const h02Before = aaFeeInvoicesFor(api.getState(), ANAE.souter)[0]!

    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const julyBefore = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-07')
    expect(saveAaFeeSettings(api, OFFICE, { ...settings, perBctiCharge: 6 }).ok).toBe(true)
    const entry = api.getState().audit.at(-1)!
    expect([entry.action, entry.entityType, entry.role]).toEqual(['aaFee.settingsChanged', 'appSettings', 'office'])

    // Raised invoices keep their snapshot.
    expect(allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-07')).toEqual(julyBefore)
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.id === h02Before.id)).toEqual(h02Before)
    // The next run (June, everyone but Dr Souter) uses the new rate.
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-06' })
    const june = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-06' && f.anaesthetistId !== ANAE.souter)
    expect(june.every((f) => f.settings.perBctiCharge === 6)).toBe(true)
  })
})

describe('recordAaFeePayment', () => {
  it('marks the fee invoice and its ACCREC paid, once, with no BillingReceipt', () => {
    const api = store()
    const h02 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    const receiptsBefore = api.getState().billing.receipts
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-1' })).toMatchObject({ ok: true, value: { applied: true } })
    const s = api.getState()
    const paid = aaFeeInvoicesFor(s, ANAE.souter).find((f) => f.id === h02.id)!
    expect(paid.status).toBe('paid')
    expect(paid.paidAtISO).toBeDefined()
    expect(s.xero.accRecs[h02.accRecId]).toMatchObject({ status: 'paid', amountReceived: h02.total, paidAtISO: paid.paidAtISO })
    expect(s.billing.receipts).toEqual(receiptsBefore)
    const entry = s.audit.at(-1)!
    expect([entry.action, entry.who, entry.source]).toEqual(['aaFee.paymentRecorded', AA_FEE_PAYMENT_ACTOR.who, 'system'])
    // Idempotent by key, and a second payment on a paid invoice is a no-op.
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-1' })).toMatchObject({ ok: true, value: { applied: false } })
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-2' })).toMatchObject({ ok: true, value: { applied: false } })
  })
})

describe('guards on the procedure money paths', () => {
  it('receivePayment refuses a fee ACCREC; openAccRecs never lists one', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const fee = allAaFeeInvoices(api.getState())[0]!
    expect(receivePayment(api, { accRecId: fee.accRecId, amount: 10, idempotencyKey: 'X', source: 'webhook' })).toMatchObject({
      ok: false,
      code: 'aaFeeInvoice',
    })
    const feeAccRecIds = new Set(allAaFeeInvoices(api.getState()).map((f) => f.accRecId))
    expect(openAccRecs(api.getState()).some((c) => feeAccRecIds.has(c.accRecId))).toBe(false)
  })

  it('the reconciliation poll never touches a fee payment', () => {
    const api = store()
    const h01 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H01')!
    runReconciliationPoll(api) // catches the seeded missed procedure webhook only
    expect(runReconciliationPoll(api)).toBe(0)
    const h02 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-POLL' })
    const receiptsBefore = api.getState().billing.receipts
    expect(runReconciliationPoll(api)).toBe(0)
    expect(api.getState().billing.receipts).toEqual(receiptsBefore)
    expect(Object.values(api.getState().billing.receipts).some((r) => r.accRecId === h01.accRecId || r.accRecId === h02.accRecId)).toBe(false)
  })

  it('the fee is never netted: raising and paying fee invoices leaves every payable, the payables run, GST and Overdue unchanged', () => {
    const api = store()
    // A live procedure payment so there is a payable waiting in the run.
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState())[0]!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'LIVE', source: 'webhook' })
    const before = moneySnapshot(api)
    expect(before.due.total).toBeGreaterThan(0)

    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    for (const f of allAaFeeInvoices(api.getState())) recordAaFeePayment(api, { aaFeeInvoiceId: f.id, idempotencyKey: `PAY-${f.id}` })
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 7 }).ok).toBe(true)
    expect(moneySnapshot(api)).toEqual(before)

    // The run then disburses exactly the payable, nothing deducted.
    const run = runPayables(api, OFFICE)
    expect(run.ok && run.value.totalDisbursed).toBe(before.due.total)
  })
})

describe('review fixes (catch-up Phase 16)', () => {
  it('a BCTI paid after its month was run to date is charged in the next month, never missed', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const julyCount = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-07')!.bctiCount
    // A Souter receivable paid in full after the July run (still July on the clock).
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState()).find((c) => Object.values(api.getState().xero.accPays).some((p) => p.accRecId === c.accRecId && p.anaesthetistId === ANAE.souter))!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'LATE', source: 'webhook' })
    // July's invoice is unchanged; August's preview carries the late BCTI.
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-07')!.bctiCount).toBe(julyCount)
    advanceClockDays(api, 12) // into August
    const aug = aaFeeRunPreview(api.getState(), '2026-08').find((r) => r.anaesthetistId === ANAE.souter)!
    expect(aug.bctiCount).toBe(1)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-08' })
    const augFee = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-08')!
    const july = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-07')!
    const charged = [...july.bctis, ...augFee.bctis].map((b) => b.accPayId)
    expect(new Set(charged).size).toBe(charged.length)
  })

  it('a payment the poll backdates into an invoiced month is charged in the next open month', () => {
    const api = store()
    // June is invoiced by the seed (H02). The seeded missed webhook is July, so pick
    // a live receivable and backdate a missed payment into June through the poll.
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState()).find((c) => Object.values(api.getState().xero.accPays).some((p) => p.accRecId === c.accRecId && p.anaesthetistId === ANAE.souter))!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'BACKDATED', source: 'poll', atISO: '2026-06-30T10:00:00' })
    expect(api.getState().xero.accRecs[open.accRecId]!.paidAtISO).toBe('2026-06-30T10:00:00')
    const before = bctisFor(bctiRecords(api.getState()), ANAE.souter, '2026-07').length
    const july = aaFeeRunPreview(api.getState(), '2026-07').find((r) => r.anaesthetistId === ANAE.souter)!
    expect(july.bctiCount).toBe(before + 1)
  })

  it('an invoiced preview row shows the invoice snapshot, not today\'s settings', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const raised = aaFeeRunPreview(api.getState(), '2026-07').map((r) => [r.anaesthetistId, r.subtotal, r.bctiCount])
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 9 }).ok).toBe(true)
    expect(aaFeeRunPreview(api.getState(), '2026-07').map((r) => [r.anaesthetistId, r.subtotal, r.bctiCount])).toEqual(raised)
  })

  it('refuses a month before the demo year, and a fee payment whose Xero record is missing', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2025-12' })).toMatchObject({ ok: false, code: 'invalidMonth' })
    expect(aaFeeRunDisabledReason(api.getState(), '2025-12')).toBe('Fee invoices start in January 2026.')
  })

  it('the Xero privacy scan stays clean after seeding BCTIs and a fee run', () => {
    const api = store()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
    const serialised = JSON.stringify(api.getState().xero)
    const people = [...Object.values(api.getState().masters.patients), ...Object.values(api.getState().masters.billableParties)]
    for (const p of people) for (const v of [p.name, p.phone, p.email, p.address]) if (v) expect(serialised).not.toContain(v)
    for (const p of Object.values(api.getState().masters.patients)) if (p.nhi) expect(serialised).not.toContain(p.nhi)
  })

  it('the seeded BCTIs stay out of the office pipeline (backdrop)', () => {
    const api = store()
    const before = billingMonitor(api.getState()).length
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    expect(billingMonitor(api.getState()).length).toBe(before)
  })
})
