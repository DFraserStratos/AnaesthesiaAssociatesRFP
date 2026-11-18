/**
 * Catch-up Phase 36 parity capture (work item 1): every money figure the
 * internal ledger must not move, written once from the build BEFORE the phase
 * (the billing case still the record) into `phase-36-baseline.json`, and compared
 * after it by `ledgerParity.test.ts`. Keyed on invoice numbers and Booking
 * ids, never on case ids (failures no longer consume `BC` ids). Never run
 * with `-u`.
 *
 * What it reads goes through the selectors and actions a presenter's screens
 * use; the Xero ids it needs to pay an invoice are looked up on the Xero
 * mirror by invoice id, which both builds keep. After the phase only the
 * selector names in the imports change (the renames of work item 8).
 *
 * - the seed: every anaesthetist's outstanding rows, aging, payment history,
 *   GST activity (March to July 2026), the payables due, every Booking's
 *   prepayment status, the AA Holding account, the AA fee invoices and run
 *   previews (May to July), the BCTI records and counts (paid only and not),
 *   the Billing monitor rows and the payment picker;
 * - six scripted flows, each step pinned: S3 (Mon 20 authorised, the nib
 *   invoice paid half, run, rest, run), S4 Beat 3 (the billing failure and
 *   its retry), S4 Beat 5 (Hemi Walker half, run, rest, run), the prepayment
 *   (a prepaid Booking added, approved, paid half and in full, its List
 *   authorised; the switch off; the seeded paid prepayment held until
 *   authorised), 16's fee run ($700.00) and 27's re-check and a move.
 *
 * Imported only by tests.
 */

import { createAppStore, type AppState, type BoundAppStore } from '../appStore'
import { runBillingForList, wireBillingRun } from '../billingRun'
import { authoriseList, reassignBooking, submitList } from '../lifecycle'
import { completeAnswered } from '../../test/completeAnswered'
import { approveAllPrepayments, TEST_OFFICE } from '../../test/approvePrepayments'
import { receivePayment } from '../paymentActions'
import { payablesDue, runPayables } from '../payablesActions'
import { stageBillingFailure } from '../demoStaging'
import { handoffPair } from '../xeroHandoff'
import { seedMonthOfBctis } from '../demoBctiSeed'
import { recordAaFeePayment, runMonthlyFeeInvoices } from '../aaFeeActions'
import { addPrepaidBooking } from '../prepaymentDemo'
import { setPrepaymentApprovalRequired } from '../prepaymentActions'
import { setProcedureContract } from '../contractSelectionActions'
import { DEMO_TRIGGER_ACTOR } from '../demoActors'
import { holdingAccountView, prepaymentStatusFor } from '../prepaymentSelectors'
import {
  aaFeeInvoicesFor,
  aaFeeRunPreview,
  payableRowsFor,
  allAaFeeInvoices,
  billingMonitor,
  bookingsForList,
  gstActivityFor,
  openAccRecs,
  paymentHistoryFor,
  patientHasOutstandingPriorEpisode,
  proceduresForBooking,
  receivablesAgingFor,
} from '../selectors'
import { bctiRecords, openBillingExceptions } from '../ledgerSelectors'
import { BCTI_COUNT_RULE, bctisFor } from '../../domain/billing/bcti'
import { roundToCents, toCents } from '../../domain/billing/money'
import { ANAE, CONTRACT, SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { DEMO_TODAY } from '../../domain/clock'
import { projectedListId } from '../../domain/slots'
import type { Actor } from '../mutate'

const OFFICE: Actor = TEST_OFFICE
const SOUTER: Actor = { who: 'Dr M. Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07'] as const

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

function anaesthetistIds(state: AppState): string[] {
  return Object.keys(state.masters.anaesthetists).sort()
}

const LAST_DAY: Record<string, string> = { '2026-03': '31', '2026-04': '30', '2026-05': '31', '2026-06': '30', '2026-07': '31' }

function lastDay(monthISO: string): string {
  return `${monthISO}-${LAST_DAY[monthISO] ?? '28'}`
}

/** One anaesthetist's money views, as Web Accounts, mobile Balances and the dashboard read them. */
function anaesthetistViews(state: AppState, id: string) {
  const rows = payableRowsFor(state, id, DEMO_TODAY).map((r) => ({
    invoiceNumber: r.invoiceNumber,
    total: r.amountTotal,
    received: r.receivedAmount,
    disbursed: r.disbursedAmount,
    outstanding: r.outstanding,
    held: r.held,
    bucket: r.bucket,
  }))
  const aging = receivablesAgingFor(state, id, DEMO_TODAY)
  const history = paymentHistoryFor(state, id).map((r) => ({
    invoiceNumber: r.invoiceNumber,
    receivedAtISO: r.receivedAtISO,
    received: r.grossReceived,
    released: r.releasedAmount,
    paidOut: r.disbursedAmount,
    status: r.status,
  }))
  const gst = MONTHS.map((m) => {
    const g = gstActivityFor(state, id, `${m}-01`, lastDay(m))
    return { month: m, rows: g.rows.length, gross: g.totalGross, gst: g.totalGst }
  })
  return { rows, aging: { ...aging.aging, accountsOver60: aging.accountsOver60 }, history, gst }
}

function allAnaesthetistViews(state: AppState) {
  const out: Record<string, ReturnType<typeof anaesthetistViews>> = {}
  for (const id of anaesthetistIds(state)) {
    const v = anaesthetistViews(state, id)
    if (v.rows.length > 0 || v.history.length > 0 || v.gst.some((g) => g.rows > 0)) out[id] = v
  }
  return out
}

/** What the payables run would pay now, per payee, from the Xero mirror both builds keep. */
export function dueByAnaesthetist(state: AppState): { anaesthetistId: string; total: number }[] {
  const due = new Map<string, number>()
  for (const p of Object.values(state.xero.accPays)) {
    if (p.payeeAccount !== undefined) continue
    const inc = toCents(p.amountAuthorised - p.amountDisbursed)
    if (inc > 0) due.set(p.anaesthetistId, (due.get(p.anaesthetistId) ?? 0) + inc)
  }
  return [...due.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([anaesthetistId, cents]) => ({ anaesthetistId, total: cents / 100 }))
}

function due(state: AppState) {
  const d = payablesDue(state)
  return { count: d.count, total: d.total }
}

function holding(state: AppState) {
  const v = holdingAccountView(state)
  return {
    balance: v.balance,
    bookingsCovered: v.bookingsCovered,
    entries: v.rows.map((r) => ({ kind: r.kind, amount: r.amount, invoiceNumber: r.invoiceNumber, bookingId: r.bookingId, anaesthetistId: r.anaesthetistId ?? null })),
  }
}

function bctis(state: AppState) {
  const records = bctiRecords(state).map((r) => ({
    billNumber: r.billNumber,
    receivableInvoiceNumber: r.receivableInvoiceNumber,
    anaesthetistId: r.anaesthetistId,
    issuedAtISO: r.issuedAtISO,
    receivablePaidAtISO: r.receivablePaidAtISO ?? null,
    voided: r.voided,
  })).sort((a, b) => a.billNumber.localeCompare(b.billNumber))
  const all = bctiRecords(state)
  const counts: Record<string, Record<string, { paidOnly: number; byIssue: number }>> = {}
  for (const id of anaesthetistIds(state)) {
    for (const m of MONTHS) {
      const paidOnly = bctisFor(all, id, m, BCTI_COUNT_RULE).length
      const byIssue = bctisFor(all, id, m, { ...BCTI_COUNT_RULE, paidOnly: false }).length
      if (paidOnly === 0 && byIssue === 0) continue
      ;(counts[id] ??= {})[m] = { paidOnly, byIssue }
    }
  }
  return { records, counts }
}

function feeInvoices(state: AppState) {
  return allAaFeeInvoices(state)
    .map((f) => ({ invoiceNumber: f.invoiceNumber, anaesthetistId: f.anaesthetistId, monthISO: f.monthISO, bctiCount: f.bctiCount, total: f.total, status: f.status, paidAtISO: f.paidAtISO ?? null }))
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
}

function feePreviews(state: AppState) {
  const out: Record<string, { anaesthetistId: string; bctiCount: number; subtotal: number; total: number }[]> = {}
  for (const m of ['2026-05', '2026-06', '2026-07']) {
    out[m] = aaFeeRunPreview(state, m).map((r) => ({ anaesthetistId: r.anaesthetistId, bctiCount: r.bctiCount, subtotal: r.subtotal, total: r.total }))
  }
  return out
}

function monitor(state: AppState) {
  return billingMonitor(state).map((l) => ({
    listId: l.listId,
    invoiceCount: l.invoiceCount,
    failedCount: l.failedCount,
    handoffFailedCount: l.handoffFailedCount,
    stages: l.stages.map((st) => `${st.key}:${st.state}`),
    bookings: l.bookingRows.map((b) => ({ bookingId: b.bookingId, status: b.status, received: b.receivedAmount, released: b.authorisedAmount, disbursed: b.disbursedAmount, prior: b.outstandingPriorBalance === true })),
  }))
}

function picker(state: AppState) {
  return openAccRecs(state).map((r) => ({ invoiceNumber: r.invoiceNumber, remaining: r.remaining }))
}

/** Every invoice by number: kind, Booking, total, the payee its payable names and what it has received. */
function invoices(state: AppState) {
  return Object.values(state.billing.invoices)
    .map((i) => {
      const rec = Object.values(state.xero.accRecs).find((r) => r.invoiceId === i.id && r.kind === 'procedure')
      const pay = rec !== undefined ? Object.values(state.xero.accPays).find((p) => p.accRecId === rec.id) : undefined
      return {
        invoiceNumber: i.invoiceNumber,
        kind: i.kind,
        bookingId: i.bookingId,
        total: i.total,
        payee: pay === undefined ? null : pay.payeeAccount ?? pay.anaesthetistId,
        received: rec?.amountReceived ?? null,
        released: pay?.amountAuthorised ?? null,
        disbursed: pay?.amountDisbursed ?? null,
      }
    })
    .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
}

function prepaymentStatuses(state: AppState) {
  const out: Record<string, { status: string; groups: { payerKey: string; status: string; invoiceNumber: string | null; invoicedTotal: number; receivedTotal: number }[] }> = {}
  for (const id of Object.keys(state.schedule.bookings).sort()) {
    const p = prepaymentStatusFor(state, id)
    if (p.status === 'none') continue
    out[id] = { status: p.status, groups: p.groups.map((g) => ({ payerKey: g.payerKey, status: g.status, invoiceNumber: g.invoiceNumber ?? null, invoicedTotal: g.invoicedTotal, receivedTotal: g.receivedTotal })) }
  }
  return out
}

/** The small per-step snapshot of a flow. */
function step(state: AppState, souterRows = false) {
  return {
    invoices: invoices(state),
    due: due(state),
    dueBy: dueByAnaesthetist(state),
    holding: { balance: holdingAccountView(state).balance, covered: holdingAccountView(state).bookingsCovered },
    exceptions: openBillingExceptions(state).map((c) => c.bookingId).sort(),
    ...(souterRows ? { souter: anaesthetistViews(state, ANAE.souter) } : {}),
  }
}

function accRecFor(state: AppState, invoiceNumber: string): { id: string; due: number; received: number } {
  const invoice = Object.values(state.billing.invoices).find((i) => i.invoiceNumber === invoiceNumber)
  const rec = invoice !== undefined ? Object.values(state.xero.accRecs).find((r) => r.invoiceId === invoice.id && r.kind === 'procedure') : undefined
  if (rec === undefined) throw new Error(`No ACCREC for ${invoiceNumber}`)
  return { id: rec.id, due: rec.amountDue, received: rec.amountReceived }
}

function pay(api: BoundAppStore, invoiceNumber: string, amount: number, key: string): void {
  const rec = accRecFor(api.getState(), invoiceNumber)
  const out = receivePayment(api, { accRecId: rec.id, amount, idempotencyKey: key, source: 'webhook' })
  if (!out.ok) throw new Error(`${invoiceNumber}: ${out.message}`)
}

function run(api: BoundAppStore) {
  const out = runPayables(api, OFFICE)
  return out.ok ? { count: out.value.disbursedCount, total: out.value.totalDisbursed } : { count: -1, total: -1 }
}

function withWiredRun<T>(api: BoundAppStore, body: () => T): T {
  const unwire = wireBillingRun(api)
  try {
    return body()
  } finally {
    unwire()
  }
}

function standardNumbersFor(state: AppState, bookingIds: readonly string[]): string[] {
  const ids = new Set(bookingIds)
  return Object.values(state.billing.invoices).filter((i) => ids.has(i.bookingId) && i.kind === 'standard').map((i) => i.invoiceNumber).sort()
}

// ---------------------------------------------------------------------------
// The flows
// ---------------------------------------------------------------------------

function s3Flow() {
  const api = createAppStore()
  const am = projectedListId(ANAE.souter, '2026-07-20', 'AM')
  const pm = projectedListId(ANAE.souter, '2026-07-20', 'PM')
  withWiredRun(api, () => {
    authoriseList(api, OFFICE, am)
    authoriseList(api, OFFICE, pm)
  })
  const authorised = step(api.getState(), true)
  const nib = 'AA-2026-0005'
  const total = accRecFor(api.getState(), nib).due
  const half = roundToCents(total / 2)
  pay(api, nib, half, 'P36-S3-HALF')
  const afterHalf = step(api.getState(), true)
  const run1 = run(api)
  const afterRun1 = step(api.getState(), true)
  pay(api, nib, roundToCents(total - half), 'P36-S3-REST')
  const afterRest = step(api.getState(), true)
  const run2 = run(api)
  const s = api.getState()
  return {
    authorised,
    afterHalf,
    run1,
    afterRun1,
    afterRest,
    run2,
    final: step(s, true),
    monitor: monitor(s),
    bctis: bctis(s),
    feePreviews: feePreviews(s),
  }
}

function s4Beat3Flow() {
  const api = createAppStore()
  withWiredRun(api, () => stageBillingFailure(api))
  const staged = { ...step(api.getState()), monitor: monitor(api.getState()) }
  // Resolve and retry: Losa Tuilagi's invoice stands; the retry hands it off once (the pair id is its case reference).
  const losa = SEED_MARKERS['billingFailureBooking']!.entityId
  const invoice = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === losa && i.kind === 'standard')
  const handed = invoice !== undefined ? handoffPair(api, invoice.caseReference).ok : false
  return { staged, losaInvoice: invoice?.invoiceNumber ?? null, handed, retried: { ...step(api.getState()), monitor: monitor(api.getState()) } }
}

function s4Beat5Flow() {
  const api = createAppStore()
  withWiredRun(api, () => stageBillingFailure(api))
  const losa = SEED_MARKERS['billingFailureBooking']!.entityId
  const hemi = bookingsForList(api.getState(), SEED_LIST_IDS.billingFailure).find((b) => b.id !== losa && b.cancellation === undefined)!
  const number = standardNumbersFor(api.getState(), [hemi.id])[0]!
  const total = accRecFor(api.getState(), number).due
  const half = roundToCents(total / 2)
  pay(api, number, half, 'P36-HEMI-HALF')
  const afterHalf = step(api.getState())
  const run1 = run(api)
  pay(api, number, roundToCents(total - half), 'P36-HEMI-REST')
  const afterRest = step(api.getState())
  const run2 = run(api)
  return { invoiceNumber: number, afterHalf, run1, afterRest, run2, final: step(api.getState()) }
}

function prepaymentFlow() {
  const api = createAppStore()
  const added = addPrepaidBooking(api, 'one-payer')
  if (!added.ok) throw new Error(added.message)
  const bookingId = added.value.bookingId
  const listId = api.getState().schedule.bookings[bookingId]!.listId
  const pending = { status: prepaymentStatusFor(api.getState(), bookingId), ...step(api.getState()) }
  approveAllPrepayments(api, bookingId)
  const approved = { status: prepaymentStatusFor(api.getState(), bookingId), ...step(api.getState()) }
  const number = Object.values(api.getState().billing.invoices).find((i) => i.bookingId === bookingId && i.kind === 'prePayment')!.invoiceNumber
  const total = accRecFor(api.getState(), number).due
  const half = roundToCents(total / 2)
  pay(api, number, half, 'P36-PP-HALF')
  const afterHalf = { status: prepaymentStatusFor(api.getState(), bookingId), ...step(api.getState()) }
  const runHalf = run(api)
  pay(api, number, roundToCents(total - half), 'P36-PP-REST')
  const afterRest = { status: prepaymentStatusFor(api.getState(), bookingId), ...step(api.getState()) }
  for (const b of bookingsForList(api.getState(), listId)) completeAnswered(api, SOUTER, b.id)
  submitList(api, SOUTER, listId)
  withWiredRun(api, () => authoriseList(api, OFFICE, listId))
  const authorised = { status: prepaymentStatusFor(api.getState(), bookingId), ...step(api.getState()), finalInvoices: standardNumbersFor(api.getState(), [bookingId]), account: holding(api.getState()) }
  const runAfter = run(api)
  return { number, pending, approved, afterHalf, runHalf, afterRest, authorised, runAfter, final: step(api.getState()), bctis: bctis(api.getState()) }
}

function approvalOffFlow() {
  const api = createAppStore()
  setPrepaymentApprovalRequired(api, OFFICE, false)
  const added = addPrepaidBooking(api, 'one-payer')
  if (!added.ok) throw new Error(added.message)
  return { status: prepaymentStatusFor(api.getState(), added.value.bookingId), ...step(api.getState()) }
}

function seededPaidPrepaymentFlow() {
  const api = createAppStore()
  const listId = SEED_LIST_IDS.prepaymentPaidList
  const before = { ...step(api.getState()), account: holding(api.getState()) }
  for (const b of bookingsForList(api.getState(), listId)) completeAnswered(api, SOUTER, b.id)
  submitList(api, SOUTER, listId)
  withWiredRun(api, () => authoriseList(api, OFFICE, listId))
  const after = { ...step(api.getState()), account: holding(api.getState()) }
  const runAfter = run(api)
  return { before, after, runAfter, final: step(api.getState()) }
}

function feeRunFlow() {
  const api = createAppStore()
  seedMonthOfBctis(api, DEMO_TRIGGER_ACTOR, ANAE.rutherford)
  const preview = feePreviews(api.getState())['2026-07']
  const ran = runMonthlyFeeInvoices(api, OFFICE, { monthISO: '2026-07' })
  const raised = feeInvoices(api.getState())
  const rutherford = aaFeeInvoicesFor(api.getState(), ANAE.rutherford).find((f) => f.monthISO === '2026-07')
  let paid: ReturnType<typeof feeInvoices> | null = null
  if (rutherford !== undefined) {
    recordAaFeePayment(api, { aaFeeInvoiceId: rutherford.id, idempotencyKey: 'P36-FEE' })
    paid = feeInvoices(api.getState())
  }
  return {
    preview,
    ran: ran.ok,
    raised,
    rutherfordTotal: rutherford?.total ?? null,
    paid,
    due: due(api.getState()),
    dueBy: dueByAnaesthetist(api.getState()),
    souterGst: anaesthetistViews(api.getState(), ANAE.rutherford).gst,
    bctiCount: bctis(api.getState()).counts[ANAE.rutherford] ?? null,
  }
}

function recheckFlow() {
  // Before approval: a Contract no longer prepaid withdraws the pending prepayment (no invoice, no pair).
  const before = createAppStore()
  const riley = SEED_MARKERS.prepaymentBooking!.entityId
  const p0 = proceduresForBooking(before.getState(), riley)[0]!
  setProcedureContract(before, OFFICE, p0.id, CONTRACT.forteRvg)
  const withdrawn = { status: prepaymentStatusFor(before.getState(), riley), ...step(before.getState()) }

  // After approval: a Contract changed off prepaid rewrites nothing.
  const after = createAppStore()
  approveAllPrepayments(after, riley)
  const sent = step(after.getState())
  const p1 = proceduresForBooking(after.getState(), riley)[0]!
  setProcedureContract(after, OFFICE, p1.id, CONTRACT.forteRvg)
  const changed = { status: prepaymentStatusFor(after.getState(), riley), ...step(after.getState()) }

  // A move changes nothing: Riley reassigned to a colleague's ACTIVE List.
  const moveApi = createAppStore()
  approveAllPrepayments(moveApi, riley)
  const beforeMove = step(moveApi.getState())
  const souterId = moveApi.getState().schedule.lists[moveApi.getState().schedule.bookings[riley]!.listId]!.anaesthetistId
  const candidates = Object.values(moveApi.getState().schedule.lists)
    .filter((l) => l.anaesthetistId !== undefined && l.anaesthetistId !== souterId && l.state === 'ACTIVE')
    .sort((a, b) => Number(b.dateISO === '2026-07-24') - Number(a.dateISO === '2026-07-24') || a.id.localeCompare(b.id))
  const moved = candidates.find((l) => reassignBooking(moveApi, OFFICE, riley, l.id).ok)
  const afterMove = step(moveApi.getState())
  return { withdrawn, sent, changed, moved: moved !== undefined, beforeMove, afterMove, prior: patientHasOutstandingPriorEpisode(moveApi.getState(), moveApi.getState().schedule.bookings[riley]!.patientId, riley) }
}

// ---------------------------------------------------------------------------

export function capturePhase36() {
  const fresh = createAppStore().getState()
  const seed = {
    anaesthetists: allAnaesthetistViews(fresh),
    due: due(fresh),
    dueBy: dueByAnaesthetist(fresh),
    prepayment: prepaymentStatuses(fresh),
    holding: holding(fresh),
    feeInvoices: feeInvoices(fresh),
    feeStatuses: Object.fromEntries(anaesthetistIds(fresh).map((id) => [id, aaFeeInvoicesFor(fresh, id).map((f) => `${f.monthISO}:${f.status}`)]).filter(([, v]) => (v as string[]).length > 0)),
    feePreviews: feePreviews(fresh),
    bctis: bctis(fresh),
    monitor: monitor(fresh),
    picker: picker(fresh),
    invoices: invoices(fresh),
  }
  return {
    seed,
    s3: s3Flow(),
    s4Beat3: s4Beat3Flow(),
    s4Beat5: s4Beat5Flow(),
    prepayment: prepaymentFlow(),
    approvalOff: approvalOffFlow(),
    seededPaidPrepayment: seededPaidPrepaymentFlow(),
    feeRun: feeRunFlow(),
    recheck: recheckFlow(),
    // An unwired run on the S4 failure List, for the failure's shape (no ids).
    s4RunOnly: (() => {
      const api = createAppStore()
      withWiredRun(api, () => stageBillingFailure(api))
      return runBillingForList(api, SEED_LIST_IDS.billingFailure).ok
    })(),
  }
}

export type Phase36Capture = ReturnType<typeof capturePhase36>
