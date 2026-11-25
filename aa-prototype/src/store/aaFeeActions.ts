/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1, US-10.3.3, D1).
 *
 * AA invoices each active anaesthetist once a month: the fixed items in
 * `appSettings.aaFee` plus the per-BCTI charge times their BCTIs paid that
 * month (counted only by `bctisFor` over `bctiRecords`), every amount ex GST
 * with GST at the foot. Each fee invoice (`billing.aaFeeInvoices`) is an
 * `aaFee` ledger pair (catch-up Phase 36): a receivable from the anaesthetist
 * and NO payable, mirrored by a `kind:'aaFee'` ACCREC against their existing
 * Xero contact: AA charging its own fee, not money passing through. It is always a separate invoice, paid into AA's
 * own bank account, and NEVER netted: nothing here or anywhere deducts it from
 * a payable, a payables run or a disbursement (Greg, 2026-10-02: "Under trust
 * law it mustn't"). A fee payment is AA's money, not the anaesthetist's income:
 * its ledger receipt is `pairKind: 'aaFee'` and never reaches the GST report,
 * payment history or the BCTI count.
 *
 * Every write goes through `mutate()`; time comes from the demo clock.
 */

import type { AaFeeInvoice, AaFeeSettings, Anaesthetist, LedgerPair } from '../domain/types'
import { isActiveInMonth } from '../domain/anaesthetistStatus'
import { aaFeeMonthLabel, buildAaFeeInvoice, validateAaFeeSettings } from '../domain/billing/aaFee'
import { BCTI_COUNT_RULE, bctisFor, type BctiRecord } from '../domain/billing/bcti'
import { roundToCents, toCents } from '../domain/billing/money'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bctiFeeHistoryFor } from './selectors'
import { bctiRecords } from './ledgerSelectors'
import { handoffPair } from './xeroHandoff'
import { applyReceiptInto, receiptKeySeen } from './paymentActions'

/** The scheduled month-end fee run (the demo trigger stands in for it). */
export const AA_FEE_RUN_ACTOR: Actor = { who: 'AA fee run (scheduled)', role: 'system', source: 'system' }

/** The anaesthetist's bank transfer landing in AA's own account, seen in Xero. */
export const AA_FEE_PAYMENT_ACTOR: Actor = { who: 'Xero payment (AA fee)', role: 'system', source: 'system' }

const MONTH_ISO = /^\d{4}-(0[1-9]|1[0-2])$/
/** Fee invoice numbers carry the demo year (`AA-FEE-2026-`), so runs start in its January. */
const FIRST_FEE_MONTH = '2026-01'

function clockMonth(state: Pick<AppState, 'clock'>): string {
  return state.clock.todayISO.slice(0, 7)
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * Save AA's fee settings (office only). Raised fee invoices keep the settings
 * they were raised with, so a change applies from the next run.
 */
export function saveAaFeeSettings(api: AppStoreApi, actor: Actor, next: AaFeeSettings): Outcome<void> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change the AA fee settings.')
  const reason = validateAaFeeSettings(next)
  if (reason !== null) return refuse('invalidSettings', reason)
  const normalised: AaFeeSettings = {
    fixedItems: next.fixedItems.map((item) => ({ id: item.id, description: item.description.trim(), amount: roundToCents(item.amount) })),
    perBctiCharge: roundToCents(next.perBctiCharge),
  }
  const before = api.getState().appSettings.aaFee
  mutate(
    api,
    actor,
    { entityType: 'appSettings', entityId: 'aaFee', action: 'aaFee.settingsChanged', before: { ...before }, after: { ...normalised } },
    (s) => ({ appSettings: { ...s.appSettings, aaFee: normalised } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// The one path for an invoice from AA to an anaesthetist
// ---------------------------------------------------------------------------

/** Recipe-local copies the raise writes into (mutated in place). */
export interface AnaesthetistInvoiceDraft {
  aaFeeInvoices: Record<string, AaFeeInvoice>
  ledger: Record<string, LedgerPair>
  counters: Record<string, number>
}

export interface RaiseAnaesthetistInvoiceInput {
  anaesthetist: Pick<Anaesthetist, 'registrationNumber' | 'name'>
  monthISO: string
  settings: AaFeeSettings
  /** The BCTIs `bctisFor` counted for this anaesthetist and month. */
  counted: readonly BctiRecord[]
  raisedAtISO: string
  raisedBy: AaFeeInvoice['raisedBy']
}

/**
 * Raise one invoice from AA to an anaesthetist into `draft`: the fee invoice
 * record (the settings and counted BCTIs snapshotted) and its `aaFee` ledger
 * pair, a receivable with no payable (catch-up Phase 36). Its `kind:'aaFee'`
 * ACCREC is the hand-off's, after commit. The ONE path for an invoice from AA
 * to an anaesthetist (no later phase builds a second).
 */
export function raiseAnaesthetistInvoiceInto(
  draft: AnaesthetistInvoiceDraft,
  input: RaiseAnaesthetistInvoiceInput,
): { invoice: AaFeeInvoice; metas: MutationMeta[] } {
  const metas: MutationMeta[] = []
  const id = allocateId(draft.counters, 'aaFeeInvoice')
  draft.counters = id.counters
  const number = allocateId(draft.counters, 'aaFeeInvoiceNumber')
  draft.counters = number.counters
  const bc = allocateId(draft.counters, 'ledgerPair')
  draft.counters = bc.counters

  const { invoice, pair } = buildAaFeeInvoice({
    id: id.id,
    invoiceNumber: number.id,
    ledgerPairId: bc.id,
    anaesthetistId: input.anaesthetist.registrationNumber,
    monthISO: input.monthISO,
    settings: input.settings,
    counted: input.counted,
    raisedAtISO: input.raisedAtISO,
    raisedBy: input.raisedBy,
  })
  draft.aaFeeInvoices[invoice.id] = invoice
  draft.ledger[pair.id] = pair
  metas.push({
    entityType: 'aaFeeInvoice',
    entityId: invoice.id,
    action: 'aaFee.invoiceRaised',
    after: {
      invoiceNumber: invoice.invoiceNumber,
      anaesthetistId: invoice.anaesthetistId,
      monthISO: invoice.monthISO,
      bctiCount: invoice.bctiCount,
      subtotal: invoice.subtotal,
      gst: invoice.gst,
      total: invoice.total,
      raisedBy: invoice.raisedBy,
    },
  })
  metas.push({
    entityType: 'ledgerPair',
    entityId: pair.id,
    action: 'ledger.pairCreated',
    after: { kind: 'aaFee', invoiceNumber: invoice.invoiceNumber, anaesthetistId: invoice.anaesthetistId, amount: invoice.total, payee: null },
  })
  return { invoice, metas }
}

// ---------------------------------------------------------------------------
// The monthly run
// ---------------------------------------------------------------------------

/** Why the run cannot raise anything for `monthISO`, or null. */
export function aaFeeRunDisabledReason(state: Pick<AppState, 'clock' | 'masters' | 'billing'>, monthISO: string): string | null {
  if (!MONTH_ISO.test(monthISO)) return 'Choose a month.'
  if (monthISO > clockMonth(state)) return `${aaFeeMonthLabel(monthISO)} has not started yet.`
  if (monthISO < FIRST_FEE_MONTH) return `Fee invoices start in ${aaFeeMonthLabel(FIRST_FEE_MONTH)}.`
  const pending = pendingAnaesthetists(state, monthISO)
  if (pending.length === 0) return `Every active anaesthetist already has a fee invoice for ${aaFeeMonthLabel(monthISO)}.`
  return null
}

function pendingAnaesthetists(state: Pick<AppState, 'masters' | 'billing'>, monthISO: string): Anaesthetist[] {
  const invoiced = new Set(
    Object.values(state.billing.aaFeeInvoices)
      .filter((f) => f.monthISO === monthISO)
      .map((f) => f.anaesthetistId),
  )
  return Object.values(state.masters.anaesthetists)
    .filter((a) => isActiveInMonth(a, monthISO) && !invoiced.has(a.registrationNumber))
    .sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber))
}

export interface MonthlyFeeRunResult {
  raisedCount: number
  invoiceIds: string[]
  /** Sum of the raised invoices' totals, incl GST. */
  total: number
}

/**
 * Raise one fee invoice to each active anaesthetist who has none for the month
 * (FT-10.3: every anaesthetist, so one with no BCTIs is charged the fixed items).
 * The office button or the scheduled run; an anaesthetist is refused, as is a
 * month after the demo clock's. A rerun for an invoiced month raises nothing
 * and does not mutate.
 */
export function runMonthlyFeeInvoices(
  api: AppStoreApi,
  actor: Actor,
  input: { monthISO: string },
): Outcome<MonthlyFeeRunResult> {
  if (actor.role === 'anaesthetist') return refuse('officeOnly', 'Only the office or the scheduled run raises AA fee invoices.')
  const state = api.getState()
  if (!MONTH_ISO.test(input.monthISO)) return refuse('invalidMonth', 'Choose a month.')
  if (input.monthISO > clockMonth(state)) {
    return refuse('futureMonth', `${aaFeeMonthLabel(input.monthISO)} has not started yet.`)
  }
  if (input.monthISO < FIRST_FEE_MONTH) return refuse('invalidMonth', `Fee invoices start in ${aaFeeMonthLabel(FIRST_FEE_MONTH)}.`)
  const pending = pendingAnaesthetists(state, input.monthISO)
  if (pending.length === 0) return ok({ raisedCount: 0, invoiceIds: [], total: 0 })

  const raisedBy: AaFeeInvoice['raisedBy'] = actor.role === 'office' ? 'office' : 'scheduled'
  const records = bctiRecords(state)
  const metas: MutationMeta[] = []
  const raised: AaFeeInvoice[] = []
  mutate(api, actor, metas, (s) => {
    const draft: AnaesthetistInvoiceDraft = {
      aaFeeInvoices: { ...s.billing.aaFeeInvoices },
      ledger: { ...s.billing.ledger },
      counters: s.counters,
    }
    const raisedAtISO = clockISO(s.clock)
    for (const anaesthetist of pending) {
      const result = raiseAnaesthetistInvoiceInto(draft, {
        anaesthetist,
        monthISO: input.monthISO,
        settings: s.appSettings.aaFee,
        counted: bctisFor(records, anaesthetist.registrationNumber, input.monthISO, BCTI_COUNT_RULE, bctiFeeHistoryFor(state, anaesthetist.registrationNumber)),
        raisedAtISO,
        raisedBy,
      })
      metas.push(...result.metas)
      raised.push(result.invoice)
    }
    return {
      billing: { ...s.billing, aaFeeInvoices: draft.aaFeeInvoices, ledger: draft.ledger },
      counters: draft.counters,
    }
  })
  // Mirror the new fee pairs in Xero after commit, as the billing run does: each a `kind:'aaFee'` ACCREC.
  for (const f of raised) handoffPair(api, f.ledgerPairId)
  return ok({
    raisedCount: raised.length,
    invoiceIds: raised.map((f) => f.id),
    total: roundToCents(raised.reduce((sum, f) => sum + f.total, 0)),
  })
}

// ---------------------------------------------------------------------------
// The anaesthetist pays AA
// ---------------------------------------------------------------------------

/** Why the fee invoice cannot be marked paid, or null. */
export function aaFeePaymentDisabledReason(state: Pick<AppState, 'billing'>, aaFeeInvoiceId: string | undefined): string | null {
  const fee = aaFeeInvoiceId !== undefined ? state.billing.aaFeeInvoices[aaFeeInvoiceId] : undefined
  if (fee === undefined) return 'Not an AA fee invoice'
  const pair = state.billing.ledger[fee.ledgerPairId]
  if (pair !== undefined && toCents(pair.receivable.receivedAmount) >= toCents(pair.receivable.amount)) return 'Already paid'
  return null
}

/**
 * The anaesthetist pays a fee invoice in full, into AA's own bank account:
 * recorded on its `aaFee` pair through the one receipt path (a ledger receipt
 * with `pairKind: 'aaFee'`), mirrored as a `PaymentIn` on the fee ACCREC
 * (source `aaFee`) and the ACCREC paid with its paid date. Idempotent by key.
 * No payable moves: it is AA's income, not the anaesthetist's.
 */
export function recordAaFeePayment(
  api: AppStoreApi,
  input: { aaFeeInvoiceId: string; idempotencyKey: string },
): Outcome<{ applied: boolean }> {
  const state = api.getState()
  const fee = state.billing.aaFeeInvoices[input.aaFeeInvoiceId]
  if (fee === undefined) return refuse('notFound', 'AA fee invoice not found.')
  const pair = state.billing.ledger[fee.ledgerPairId]
  const accRecId = pair?.receivable.xeroAccRecId
  if (pair === undefined || accRecId === undefined || state.xero.accRecs[accRecId]?.kind !== 'aaFee') return refuse('noAccRec', 'The Xero record for this AA fee invoice is missing.')
  if (receiptKeySeen(state, input.idempotencyKey) || Object.values(state.xero.payments).some((p) => p.idempotencyKey === input.idempotencyKey)) return ok({ applied: false })
  const amount = roundToCents(pair.receivable.amount - pair.receivable.receivedAmount)
  if (toCents(amount) <= 0) return ok({ applied: false })

  const metas: MutationMeta[] = [
    {
      entityType: 'aaFeeInvoice',
      entityId: fee.id,
      action: 'aaFee.paymentRecorded',
      after: { invoiceNumber: fee.invoiceNumber, amount, accRecId, idempotencyKey: input.idempotencyKey },
    },
  ]
  mutate(api, AA_FEE_PAYMENT_ACTOR, metas, (s) => {
    const out = applyReceiptInto(s, s.counters, { pairId: pair.id, amount, idempotencyKey: input.idempotencyKey, source: 'aaFee', atISO: clockISO(s.clock) }, metas)
    return out === null ? {} : { ...out.patch, counters: out.counters }
  })
  return ok({ applied: true })
}
