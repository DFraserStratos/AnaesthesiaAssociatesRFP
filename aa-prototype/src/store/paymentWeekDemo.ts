/**
 * The payment cycle's demo staging (catch-up Phase 39a; Admin · Billing
 * monitor), bodies for the bar's "Stage a payment week" and "Stage a bank
 * mismatch". Each acts through the product's own actions and is
 * deterministic: no clock read for ids, no randomness.
 *
 * "Stage a payment week" builds 19 accounts for Dr Sharma through 16's
 * history account builder (`addHistoryAccounts`, its own `PP` id namespace),
 * raised and handed off but unpaid, on weekday Lists before the canvas
 * horizon (29 and 30 June, an AM and a PM List of five), then records each
 * payment through the ordinary payment webhook (keys `STAGE-PP-n`), so each
 * gets its bank line and releases its payable into the open week by
 * US-10.2.1's rule. Its second choice also leaves one negative invoice open
 * for Dr Sharma: one earlier invoice, paid and paid out in its own Week 29
 * backdrop run, credited in full through 39's own credit path (submit,
 * approve, run), so there is exactly one way a credit is made.
 */

import type { HistoryAccount, HistoryBuild } from '../domain/seed/history'
import { addHistoryAccounts, historyIds } from '../domain/seed/history'
import { backdropBankLines, backdropRunsFor } from '../domain/seed/backdropRuns'
import { ANAE, HOSP, SURG } from '../domain/seed/cast'
import { cycleLabel } from '../domain/billing/paymentCycle'
import { formatSignedCurrency, plural } from '../shared/format'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { anaesthetistContactSpec, resolveContactInto, type ContactSpec } from './xeroHandoff'
import { deliverPaymentWebhook } from './paymentActions'
import { xeroAvailable } from './xeroGate'
import { approveProcedureEvent, runEventInvoicing } from './procedureEventActions'
import { submitCredit } from './creditActions'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { invoiceAddresseeName } from './selectors'
import { openCycle, openCycleDraft, paymentCycleSettingsOf, weekRunInProgress } from './paymentCycleActions'

const NS = 'PP'
const IDS = historyIds(NS)
export const PAYMENT_WEEK_BCTIS = 19
const DAYS = ['2026-06-29', '2026-06-30'] as const
const SESSIONS = ['AM', 'PM'] as const
const PER_LIST = 5
const LIST_PLAN = [
  { hospitalId: HOSP.stg, surgeonId: SURG.hale, description: 'Knee arthroscopy', legacyCode: '49558' },
  { hospitalId: HOSP.sx, surgeonId: SURG.patel, description: 'Laparoscopic cholecystectomy', legacyCode: '20941' },
  { hospitalId: HOSP.forte, surgeonId: SURG.okafor, description: 'Inguinal hernia repair', legacyCode: '20941' },
  { hospitalId: HOSP.cph, surgeonId: SURG.tan, description: 'Cystoscopy', legacyCode: '50120' },
] as const
const TOTALS = [420, 515.5, 690, 845, 310.25, 980, 560, 735.8, 152.38] as const
/** The credited account: paid 13 Jul, paid out 15 Jul (Week 29), credited in full. */
const CREDITED = { serviceISO: '2026-06-26', total: 365.7, paidAtISO: '2026-07-13T10:00:00', disbursedAtISO: '2026-07-15T09:00:00' } as const

export const PAYMENT_WEEK_CHOICES = [
  { id: 'bctis', label: `${PAYMENT_WEEK_BCTIS} BCTIs` },
  { id: 'withCredit', label: `${PAYMENT_WEEK_BCTIS} BCTIs and a credit after payout` },
] as const

export const PAYMENT_WEEK_COPY = {
  already: 'Already staged for this week',
  xeroDown: 'Xero is unavailable: restore it first',
  noBankLine: 'Nothing received this week',
  weekClosed: 'This week is already closed',
} as const

function plannedAccounts(patientIds: readonly string[], withCredit: boolean): HistoryAccount[] {
  const accounts: HistoryAccount[] = []
  let i = 0
  for (const [d, day] of DAYS.entries()) {
    for (const [si, session] of SESSIONS.entries()) {
      const plan = LIST_PLAN[(d * SESSIONS.length + si) % LIST_PLAN.length]!
      for (let k = 0; k < PER_LIST && i < PAYMENT_WEEK_BCTIS; k += 1) {
        accounts.push({
          key: `pp${String(i + 1).padStart(2, '0')}`,
          patientId: patientIds[(i * 11 + 3) % patientIds.length]!,
          counterparty: { kind: 'hospital', id: plan.hospitalId },
          surgeonId: plan.surgeonId,
          hospitalId: plan.hospitalId,
          description: plan.description,
          legacyCode: plan.legacyCode,
          serviceISO: day,
          raisedISO: `${day}T17:00:00`,
          total: TOTALS[i % TOTALS.length]!,
          accRelated: false,
          paidState: 'unpaid',
          listKey: `${day.slice(5).replace('-', '')}-${session}`,
          session,
        })
        i += 1
      }
    }
  }
  if (withCredit) {
    accounts.push({
      key: 'ppcredit',
      patientId: patientIds[(PAYMENT_WEEK_BCTIS * 11 + 3) % patientIds.length]!,
      counterparty: { kind: 'hospital', id: HOSP.stg },
      surgeonId: SURG.hale,
      hospitalId: HOSP.stg,
      description: 'Shoulder arthroscopy',
      legacyCode: '49558',
      serviceISO: CREDITED.serviceISO,
      raisedISO: `${CREDITED.serviceISO}T17:00:00`,
      total: CREDITED.total,
      accRelated: false,
      paidState: 'paid',
      paidAtISO: CREDITED.paidAtISO,
      disbursedAtISO: CREDITED.disbursedAtISO,
      listKey: `${CREDITED.serviceISO.slice(5).replace('-', '')}-AM`,
      session: 'AM',
    })
  }
  return accounts
}

/** Why the payment week cannot be staged now, or null. */
export function stagePaymentWeekRefusal(state: Pick<AppState, 'billing' | 'xero'>): string | null {
  if (state.billing.invoices[IDS.invoice('01')] !== undefined) return PAYMENT_WEEK_COPY.already
  if (!xeroAvailable(state as AppState)) return PAYMENT_WEEK_COPY.xeroDown
  return null
}

/** Stage the payment week: 19 BCTIs released for Dr Sharma into the open week, and (`withCredit`) one negative invoice to net. */
export function stagePaymentWeek(api: AppStoreApi, actor: Actor, choiceId: string | undefined): Outcome<{ message: string; released: number; negative?: number }> {
  const refusal = stagePaymentWeekRefusal(api.getState())
  if (refusal !== null) return refuse('unavailable', refusal)
  const withCredit = choiceId === 'withCredit'
  const state = api.getState()
  const anaesthetistId = ANAE.sharma
  const anaesthetist = state.masters.anaesthetists[anaesthetistId]
  if (anaesthetist === undefined) return refuse('notFound', 'Dr Sharma is not in this seed.')
  const accounts = plannedAccounts(Object.keys(state.masters.patients).sort(), withCredit)

  mutate(api, actor, { entityType: 'anaesthetist', entityId: anaesthetistId, action: 'demo.paymentWeekStaged', after: { bctis: PAYMENT_WEEK_BCTIS, creditAfterPayout: withCredit } }, (s) => {
    const contacts = { ...s.xero.contacts }
    const cache = { ...s.billing.contactIdCache }
    let counters = s.counters
    const resolve = (spec: ContactSpec): string => {
      const r = resolveContactInto(spec, contacts, cache, counters)
      counters = r.counters
      return r.contactId
    }
    const build: HistoryBuild = {
      lists: {}, bookings: {}, procedures: {}, invoices: {}, invoiceLines: {}, ledger: {}, ledgerDisbursements: {},
      receipts: {}, contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, contactIdCache: {},
    }
    addHistoryAccounts(build, {
      anaesthetistId,
      accounts,
      ids: IDS,
      masters: s.masters,
      payeeContactId: resolve(anaesthetistContactSpec(anaesthetist)),
      resolveContact: (kind, id, name, type) => resolve({ key: `${kind}:${id}`, contactNumber: id, name, type }),
      payablesRunId: `PR${NS}01`,
    })
    // The credited account's payout belongs to its own backdrop Week 29 run (no payment without a run).
    const backdrop = backdropRunsFor({
      ns: NS,
      settings: paymentCycleSettingsOf(s),
      ledger: build.ledger,
      invoices: build.invoices,
      payerNameOf: (pair) => (build.invoices[pair.invoiceId] !== undefined ? invoiceAddresseeName(s, build.invoices[pair.invoiceId]!) : ''),
      serviceDateOf: (pair) => build.lists[pair.listId]?.dateISO ?? pair.createdAtISO.slice(0, 10),
      ledgerDisbursements: build.ledgerDisbursements,
      xeroDisbursements: build.disbursements,
      accPays: build.accPays,
      seeded: false,
    })
    return {
      schedule: {
        ...s.schedule,
        lists: { ...s.schedule.lists, ...build.lists },
        bookings: { ...s.schedule.bookings, ...build.bookings },
        procedures: { ...s.schedule.procedures, ...build.procedures },
      },
      billing: {
        ...s.billing,
        invoices: { ...s.billing.invoices, ...build.invoices },
        invoiceLines: { ...s.billing.invoiceLines, ...build.invoiceLines },
        ledger: { ...s.billing.ledger, ...build.ledger },
        disbursements: { ...s.billing.disbursements, ...backdrop.ledgerDisbursements },
        receipts: { ...s.billing.receipts, ...build.receipts },
        payablesRuns: { ...s.billing.payablesRuns, ...backdrop.runs },
        bankLines: { ...s.billing.bankLines, ...backdropBankLines(NS, build.payments, build.accRecs) },
        contactIdCache: cache,
      },
      xero: {
        ...s.xero,
        contacts,
        accRecs: { ...s.xero.accRecs, ...build.accRecs },
        accPays: { ...s.xero.accPays, ...build.accPays },
        payments: { ...s.xero.payments, ...build.payments },
        disbursements: { ...s.xero.disbursements, ...backdrop.xeroDisbursements },
        batchPayments: { ...s.xero.batchPayments, ...backdrop.batchPayments },
      },
      counters,
    }
  })

  // The credit after payout, through 39's own path: the office credits the invoice in full, approves it, and the next run issues it.
  let negative: number | undefined
  if (withCredit) {
    const invoiceId = IDS.invoice(String(accounts.length).padStart(2, '0'))
    const sub = submitCredit(api, OFFICE_SIMULATION_ACTOR, { invoiceId, reason: 'The payer paid twice', cause: 'correction', replacements: [] })
    if (!sub.ok) return sub
    const appr = approveProcedureEvent(api, OFFICE_SIMULATION_ACTOR, sub.value.creditEventId)
    if (!appr.ok) return appr
    const run = runEventInvoicing(api, OFFICE_SIMULATION_ACTOR, { eventIds: [sub.value.creditEventId] })
    if (!run.ok) return run
    const note = api.getState().billing.creditNotes[run.value.creditNoteIds[0] ?? '']
    negative = note?.negativeInvoiceId !== undefined ? api.getState().billing.negativeInvoices[note.negativeInvoiceId]?.recoveryDue : undefined
  }

  // Each payment through the ordinary webhook, at the demo clock's now: its bank line, and its payable released into the open week.
  let released = 0
  for (let i = 1; i <= PAYMENT_WEEK_BCTIS; i += 1) {
    const n = String(i).padStart(2, '0')
    const accRecId = IDS.accRec(n)
    const accRec = api.getState().xero.accRecs[accRecId]
    if (accRec === undefined) continue
    const out = deliverPaymentWebhook(api, { accRecId, amount: accRec.amountDue, idempotencyKey: `STAGE-PP-${i}` })
    if (out.ok && out.value.applied) released += 1
  }
  const week = cycleLabel(openCycle(api.getState()))
  const message =
    `${plural(released, 'payable')} released for Dr Sharma into ${week}. Close the week to start the run.` +
    (negative !== undefined ? ` A negative invoice of ${formatSignedCurrency(-negative)} is waiting to be netted.` : '')
  return ok({ message, released, ...(negative !== undefined ? { negative } : {}) })
}

/** The bank line the mismatch removes: the newest receipt that released a line in the open week. */
function mismatchTarget(state: AppState): { bankLineId: string; reference: string } | undefined {
  const draft = openCycleDraft(state)
  const pairs = new Set(draft.lines.map((l) => (l.kind === 'transfer' ? state.billing.transfers[l.pairId]?.collectPairId : l.pairId)))
  const receipts = Object.values(state.billing.receipts)
    .filter((r) => pairs.has(r.pairId))
    .sort((a, b) => b.atISO.localeCompare(a.atISO) || b.id.localeCompare(a.id, 'en', { numeric: true }))
  for (const r of receipts) {
    const payment = Object.values(state.xero.payments).find((p) => p.idempotencyKey === r.idempotencyKey)
    const line = payment !== undefined ? Object.values(state.billing.bankLines).find((b) => b.xeroPaymentId === payment.id && b.removedByDemo !== true) : undefined
    if (line !== undefined) return { bankLineId: line.id, reference: line.reference }
  }
  return undefined
}

/** Why the bank mismatch cannot be staged, or null. */
export function stageBankMismatchRefusal(state: AppState): string | null {
  if (weekRunInProgress(state) !== undefined) return PAYMENT_WEEK_COPY.weekClosed
  return mismatchTarget(state) === undefined ? PAYMENT_WEEK_COPY.noBankLine : null
}

/** The bank download misses one receipt (`removedByDemo`): the close raises "Receipt not on the bank download" on its BCTI. */
export function stageBankMismatch(api: AppStoreApi, actor: Actor): Outcome<{ message: string }> {
  const refusal = stageBankMismatchRefusal(api.getState())
  if (refusal !== null) return refuse('unavailable', refusal)
  const target = mismatchTarget(api.getState())!
  mutate(api, actor, { entityType: 'bankLine', entityId: target.bankLineId, action: 'demo.bankLineRemoved', after: { reference: target.reference } }, (s) => {
    const line = s.billing.bankLines[target.bankLineId]!
    return { billing: { ...s.billing, bankLines: { ...s.billing.bankLines, [line.id]: { ...line, removedByDemo: true } } } }
  })
  return ok({ message: `The bank download is missing the receipt for ${target.reference}. Close the week to see the anomaly.` })
}
