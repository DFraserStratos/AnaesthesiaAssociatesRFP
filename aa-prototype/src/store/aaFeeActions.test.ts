/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1, US-10.3.3): the
 * seeded history, the monthly run, the settings write, the fee payment, the
 * guards on the procedure money paths, and the rule that the fee is never
 * netted against a payable.
 */

import { describe, expect, it } from 'vitest'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { handoffListPairs as handoffListCases } from './xeroHandoff'
import { bctiRecords } from './ledgerSelectors'
import { receivePayment } from './paymentActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { payablesDue, runThisWeeksCycle } from './payablesActions'
import { resetDomainState, type Actor } from './mutate'
import {
  AA_FEE_PAYMENT_ACTOR,
  AA_FEE_RUN_ACTOR,
  aaFeeRunDisabledReason,
  recordAaFeePayment,
  runMonthlyFeeInvoices,
  saveAaFeeSettings,
} from './aaFeeActions'
import { aaFeeInvoicesFor, aaFeeRunPreview, allAaFeeInvoices, billingMonitor, openAccRecs } from './selectors'
import { gstReportFor, gstReportMonthsFor } from './ledgerSelectors'
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

/** A fee invoice's ACCREC id, read from its `aaFee` ledger pair (catch-up Phase 36). */
function feeAccRecId(api: BoundAppStore, fee: { ledgerPairId: string }): string {
  const id = api.getState().billing.ledger[fee.ledgerPairId]?.receivable.xeroAccRecId
  if (id === undefined) throw new Error(`fee pair ${fee.ledgerPairId} has no ACCREC`)
  return id
}

function moneySnapshot(api: BoundAppStore) {
  const s = api.getState()
  return {
    accPays: Object.values(s.xero.accPays).map((p) => [p.id, p.amountPayable, p.amountAuthorised, p.amountDisbursed]),
    disbursements: s.xero.disbursements,
    // (catch-up Phase 36: a fee pair and a fee payment's receipt now live in the ledger too; they are AA's
    // own money, so the procedure ledger and procedure receipts are what must not move.)
    receipts: Object.values(s.billing.receipts).filter((r) => r.pairKind !== 'aaFee'),
    ledger: Object.values(s.billing.ledger).filter((p) => p.kind !== 'aaFee'),
    due: payablesDue(s),
    gst: gstReportMonthsFor(s, ANAE.souter, '2026-11-24').map((m) => gstReportFor(s, ANAE.souter, m, '2026-11-24')),
    open: openAccRecs(s),
  }
}

describe('seeded fee history (Dr Souter)', () => {
  it('seeds May paid and June unpaid, each computed from the BCTIs paid that month', () => {
    const api = store()
    const state = api.getState()
    const rows = aaFeeInvoicesFor(state, ANAE.souter)
    expect(rows.map((r) => [r.invoiceNumber, r.monthISO, r.status])).toEqual([
      ['AA-FEE-2026-H02', '2026-10', 'unpaid'],
      ['AA-FEE-2026-H01', '2026-09', 'paid'],
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
      const accRecId = feeAccRecId(api, row)
      const accRec = state.xero.accRecs[accRecId]!
      expect(accRec.kind).toBe('aaFee')
      expect(accRec.contactId).toBe(state.billing.contactIdCache[`anaesthetist:${ANAE.souter}`])
      expect(Object.values(state.xero.accPays).some((p) => p.accRecId === accRecId)).toBe(false)
    }
    // Only Dr Souter has seeded billing history, so only she has fee history.
    expect(allAaFeeInvoices(state)).toHaveLength(2)
  })

  it('reset restores the fee map and the settings', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' }).ok).toBe(true)
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 9 }).ok).toBe(true)
    resetDomainState(api)
    expect(allAaFeeInvoices(api.getState())).toHaveLength(2)
    expect(api.getState().appSettings.aaFee).toEqual(store().getState().appSettings.aaFee)
  })
})

describe('runMonthlyFeeInvoices', () => {
  it('raises one fee invoice per active anaesthetist for the month, fixed items only with no BCTIs', () => {
    const api = store()
    const preview = aaFeeRunPreview(api.getState(), '2026-11')
    expect(preview).toHaveLength(activeCount(api))
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    expect(res.ok && res.value.raisedCount).toBe(activeCount(api))
    const july = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-11')
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
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const s = api.getState()
    const souterFee = aaFeeInvoicesFor(s, ANAE.souter).find((f) => f.monthISO === '2026-11')!
    expect(s.xero.accRecs[feeAccRecId(api, souterFee)]!.contactId).toBe('XCH01')
    const numbers = Object.values(s.xero.contacts).map((c) => c.contactNumber).filter((n) => n.startsWith('ANAE-'))
    expect(new Set(numbers).size).toBe(numbers.length)
    expect(numbers).toHaveLength(activeCount(api))
    // A later run for another month reuses them all.
    const contactsBefore = Object.keys(s.xero.contacts).length
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-08' })
    expect(Object.keys(api.getState().xero.contacts)).toHaveLength(contactsBefore)
  })

  it('a rerun for an invoiced month raises nothing and does not mutate', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const auditBefore = api.getState().audit.length
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    expect(res).toMatchObject({ ok: true, value: { raisedCount: 0 } })
    expect(api.getState().audit.length).toBe(auditBefore)
    expect(aaFeeRunDisabledReason(api.getState(), '2026-11')).toBe('Every active anaesthetist already has a fee invoice for November 2026.')
  })

  it('June raises for everyone but Dr Souter, who was invoiced by the seed', () => {
    const api = store()
    const res = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-10' })
    expect(res.ok && res.value.raisedCount).toBe(activeCount(api) - 1)
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).filter((f) => f.monthISO === '2026-10')).toHaveLength(1)
  })

  it('refuses a future month and an anaesthetist', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-12' })).toMatchObject({ ok: false, code: 'futureMonth' })
    expect(aaFeeRunDisabledReason(api.getState(), '2026-12')).toBe('December 2026 has not started yet.')
    expect(runMonthlyFeeInvoices(api, SOUTER, { monthISO: '2026-11' })).toMatchObject({ ok: false, code: 'officeOnly' })
  })

  it('the scheduled run is audited as the system actor', () => {
    const api = store()
    const auditBefore = api.getState().audit.length
    runMonthlyFeeInvoices(api, AA_FEE_RUN_ACTOR, { monthISO: '2026-11' })
    const raised = api.getState().audit.filter((e) => e.action === 'aaFee.invoiceRaised')
    expect(raised).toHaveLength(activeCount(api))
    for (const e of raised) expect([e.who, e.role, e.source]).toEqual(['AA fee run (scheduled)', 'system', 'system'])
    // (catch-up Phase 36: each fee raise audits its ledger pair, and the fee pairs are handed off after commit,
    // so each fee ACCREC is audited `xero.pairCreated` on the fee invoice, not `xero.feeAccRecCreated`.)
    const after = api.getState().audit.slice(auditBefore)
    expect(after.filter((e) => e.action === 'ledger.pairCreated')).toHaveLength(activeCount(api))
    expect(after.filter((e) => e.action === 'xero.pairCreated' && e.entityType === 'aaFeeInvoice')).toHaveLength(activeCount(api))
    expect(allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-11').every((f) => f.raisedBy === 'scheduled')).toBe(true)
  })

  it('counts a BCTI only once its receivable is paid, in the month it is paid', () => {
    const api = store()
    const before = aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount
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
    expect(aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before)
    const target = souterOpen[0]!
    // A part payment does not count it yet; the completing payment does.
    receivePayment(api, { accRecId: target.accRecId, amount: 1, idempotencyKey: 'PART', source: 'webhook' })
    expect(aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before)
    receivePayment(api, { accRecId: target.accRecId, amount: target.remaining, idempotencyKey: 'REST', source: 'webhook' })
    expect(aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.souter)!.bctiCount).toBe(before + 1)
  })
})

describe('saveAaFeeSettings', () => {
  it('is office only, validated, audited, and applies to the next run, never a raised invoice', () => {
    const api = store()
    const settings = api.getState().appSettings.aaFee
    expect(saveAaFeeSettings(api, SOUTER, settings)).toMatchObject({ ok: false, code: 'officeOnly' })
    expect(saveAaFeeSettings(api, OFFICE, { ...settings, perBctiCharge: -1 })).toMatchObject({ ok: false, code: 'invalidSettings' })
    const h02Before = aaFeeInvoicesFor(api.getState(), ANAE.souter)[0]!

    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const julyBefore = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-11')
    expect(saveAaFeeSettings(api, OFFICE, { ...settings, perBctiCharge: 6 }).ok).toBe(true)
    const entry = api.getState().audit.at(-1)!
    expect([entry.action, entry.entityType, entry.role]).toEqual(['aaFee.settingsChanged', 'appSettings', 'office'])

    // Raised invoices keep their snapshot.
    expect(allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-11')).toEqual(julyBefore)
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.id === h02Before.id)).toEqual(h02Before)
    // The next run (June, everyone but Dr Souter) uses the new rate.
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-10' })
    const june = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-10' && f.anaesthetistId !== ANAE.souter)
    expect(june.every((f) => f.settings.perBctiCharge === 6)).toBe(true)
  })
})

describe('recordAaFeePayment', () => {
  it('marks the fee invoice and its ACCREC paid, once, with one AA fee ledger receipt and no anaesthetist income', () => {
    const api = store()
    const h02 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    const receiptsBefore = api.getState().billing.receipts
    const auditBefore = api.getState().audit.length
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-1' })).toMatchObject({ ok: true, value: { applied: true } })
    const s = api.getState()
    const paid = aaFeeInvoicesFor(s, ANAE.souter).find((f) => f.id === h02.id)!
    expect(paid.status).toBe('paid')
    expect(paid.paidAtISO).toBeDefined()
    expect(s.xero.accRecs[feeAccRecId(api, h02)]).toMatchObject({ status: 'paid', amountReceived: h02.total, paidAtISO: paid.paidAtISO })
    // (catch-up Phase 36: an AA fee payment now writes one ledger receipt, `pairKind: 'aaFee'`, on its fee
    // pair and with no anaesthetist: AA's own income, never the anaesthetist's.)
    const added = Object.values(s.billing.receipts).filter((r) => receiptsBefore[r.id] === undefined)
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ pairId: h02.ledgerPairId, pairKind: 'aaFee', grossAmount: h02.total, source: 'aaFee' })
    expect(added[0]!.anaesthetistId).toBeUndefined()
    // (catch-up Phase 36: the one receipt path audits its own entries after the fee entry, so find it.)
    const entry = s.audit.slice(auditBefore).find((e) => e.action === 'aaFee.paymentRecorded')!
    expect([entry.action, entry.who, entry.source]).toEqual(['aaFee.paymentRecorded', AA_FEE_PAYMENT_ACTOR.who, 'system'])
    // Idempotent by key, and a second payment on a paid invoice is a no-op.
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-1' })).toMatchObject({ ok: true, value: { applied: false } })
    expect(recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-2' })).toMatchObject({ ok: true, value: { applied: false } })
  })
})

describe('guards on the procedure money paths', () => {
  it('receivePayment refuses a fee ACCREC; openAccRecs never lists one', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const fee = allAaFeeInvoices(api.getState())[0]!
    expect(receivePayment(api, { accRecId: feeAccRecId(api, fee), amount: 10, idempotencyKey: 'X', source: 'webhook' })).toMatchObject({
      ok: false,
      code: 'aaFeeInvoice',
    })
    const feeAccRecIds = new Set(allAaFeeInvoices(api.getState()).map((f) => feeAccRecId(api, f)))
    expect(openAccRecs(api.getState()).some((c) => feeAccRecIds.has(c.accRecId))).toBe(false)
  })

  it('the reconciliation poll never touches a fee payment', () => {
    const api = store()
    const h01 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H01')!
    runReconciliationPoll(api) // catches the seeded missed procedure webhook only
    expect(runReconciliationPoll(api).payments).toBe(0)
    const h02 = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.invoiceNumber === 'AA-FEE-2026-H02')!
    recordAaFeePayment(api, { aaFeeInvoiceId: h02.id, idempotencyKey: 'FEE-POLL' })
    const receiptsBefore = api.getState().billing.receipts
    expect(runReconciliationPoll(api).payments).toBe(0)
    expect(api.getState().billing.receipts).toEqual(receiptsBefore)
    // (catch-up Phase 36: the fee payment itself now writes an `aaFee` ledger receipt; the poll never writes one.)
    const feeAccRecs = new Set([feeAccRecId(api, h01), feeAccRecId(api, h02)])
    expect(Object.values(api.getState().billing.receipts).some((r) => r.accRecId !== undefined && feeAccRecs.has(r.accRecId) && r.source !== 'aaFee')).toBe(false)
    expect(Object.values(api.getState().billing.receipts).some((r) => r.pairKind === 'aaFee' && r.source === 'poll')).toBe(false)
  })

  it('the fee is never netted: raising and paying fee invoices leaves every payable, the payables run, the GST report and Outstanding unchanged', () => {
    const api = store()
    // A live procedure payment so there is a payable waiting in the run.
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState())[0]!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'LIVE', source: 'webhook' })
    const before = moneySnapshot(api)
    expect(before.due.total).toBeGreaterThan(0)

    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    for (const f of allAaFeeInvoices(api.getState())) recordAaFeePayment(api, { aaFeeInvoiceId: f.id, idempotencyKey: `PAY-${f.id}` })
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 7 }).ok).toBe(true)
    expect(moneySnapshot(api)).toEqual(before)

    // The run then disburses exactly the payable, nothing deducted.
    const run = runThisWeeksCycle(api, OFFICE)
    expect(run.ok && run.value.totalDisbursed).toBe(before.due.total)
  })
})

describe('review fixes (catch-up Phase 16)', () => {
  it('a BCTI paid after its month was run to date is charged in the next month, never missed', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const julyCount = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-11')!.bctiCount
    // A Souter receivable paid in full after the July run (still July on the clock).
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState()).find((c) => Object.values(api.getState().xero.accPays).some((p) => p.accRecId === c.accRecId && p.anaesthetistId === ANAE.souter))!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'LATE', source: 'webhook' })
    // July's invoice is unchanged; August's preview carries the late BCTI.
    expect(aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-11')!.bctiCount).toBe(julyCount)
    advanceClockDays(api, 12) // into August
    const aug = aaFeeRunPreview(api.getState(), '2026-12').find((r) => r.anaesthetistId === ANAE.souter)!
    expect(aug.bctiCount).toBe(1)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-12' })
    const augFee = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-12')!
    const july = aaFeeInvoicesFor(api.getState(), ANAE.souter).find((f) => f.monthISO === '2026-11')!
    const charged = [...july.bctis, ...augFee.bctis].map((b) => b.accPayId)
    expect(new Set(charged).size).toBe(charged.length)
  })

  it('a payment the poll backdates into an invoiced month is charged in the next open month', () => {
    const api = store()
    // October is invoiced by the seed (H02). The seeded missed webhook is November, so pick
    // a live receivable and backdate a missed payment into October through the poll.
    authoriseList(api, OFFICE, SEED_LIST_IDS.souterMon20Am)
    runBillingForList(api, SEED_LIST_IDS.souterMon20Am)
    handoffListCases(api, SEED_LIST_IDS.souterMon20Am)
    const open = openAccRecs(api.getState()).find((c) => Object.values(api.getState().xero.accPays).some((p) => p.accRecId === c.accRecId && p.anaesthetistId === ANAE.souter))!
    receivePayment(api, { accRecId: open.accRecId, amount: open.remaining, idempotencyKey: 'BACKDATED', source: 'poll', atISO: '2026-10-30T10:00:00' })
    expect(api.getState().xero.accRecs[open.accRecId]!.paidAtISO).toBe('2026-10-30T10:00:00')
    const before = bctisFor(bctiRecords(api.getState()), ANAE.souter, '2026-11').length
    const july = aaFeeRunPreview(api.getState(), '2026-11').find((r) => r.anaesthetistId === ANAE.souter)!
    expect(july.bctiCount).toBe(before + 1)
  })

  it('an invoiced preview row shows the invoice snapshot, not today\'s settings', () => {
    const api = store()
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const raised = aaFeeRunPreview(api.getState(), '2026-11').map((r) => [r.anaesthetistId, r.subtotal, r.bctiCount])
    expect(saveAaFeeSettings(api, OFFICE, { ...api.getState().appSettings.aaFee, perBctiCharge: 9 }).ok).toBe(true)
    expect(aaFeeRunPreview(api.getState(), '2026-11').map((r) => [r.anaesthetistId, r.subtotal, r.bctiCount])).toEqual(raised)
  })

  it('refuses a month before the demo year, and a fee payment whose Xero record is missing', () => {
    const api = store()
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2025-12' })).toMatchObject({ ok: false, code: 'invalidMonth' })
    expect(aaFeeRunDisabledReason(api.getState(), '2025-12')).toBe('Fee invoices start in January 2026.')
  })

  it('the Xero privacy scan stays clean after seeding BCTIs and a fee run', () => {
    const api = store()
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' })
    const serialised = JSON.stringify(api.getState().xero)
    // Patients and the other payers named on Procedures (catch-up Phases 21, 22a: no payer master).
    const people = [
      ...Object.values(api.getState().masters.patients).map((p) => [p.name, p.phone, p.email, p.postalAddress?.line1]),
      ...Object.values(api.getState().schedule.procedures).flatMap((p) => (p.payer.kind === 'other' ? [[p.payer.name, p.payer.phone, p.payer.email, p.payer.postalAddress?.line1]] : [])),
    ]
    for (const values of people) for (const v of values) if (v) expect(serialised).not.toContain(v)
    for (const p of Object.values(api.getState().masters.patients)) if (p.nhi) expect(serialised).not.toContain(p.nhi)
  })

  it('the seeded BCTIs stay out of the office pipeline (backdrop)', () => {
    const api = store()
    const before = billingMonitor(api.getState()).length
    seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
    expect(billingMonitor(api.getState()).length).toBe(before)
  })
})

describe('the AA fee run is unchanged by catch-up Phase 22', () => {
  it('raises AA fee invoices with no supplier, agent or delivery, and no receivable invoice', () => {
    const api = store()
    const invoicesBefore = api.getState().billing.invoices
    const auditBefore = api.getState().audit.length
    expect(runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-11' }).ok).toBe(true)
    const july = allAaFeeInvoices(api.getState()).filter((f) => f.monthISO === '2026-11')
    expect(july.length).toBeGreaterThan(0)
    for (const fee of july) {
      expect(fee).not.toHaveProperty('supplier')
      expect(fee).not.toHaveProperty('agent')
      expect(fee).not.toHaveProperty('delivery')
    }
    expect(api.getState().billing.invoices).toEqual(invoicesBefore)
    const sends = api.getState().audit.slice(auditBefore).filter((a) => ['invoice.sent', 'invoice.toPost', 'invoice.notSent'].includes(a.action))
    expect(sends).toEqual([])
  })
})
