/**
 * AA's monthly fee (catch-up Phase 16; FT-10.3, US-10.3.1, US-10.3.3, D1).
 *
 * AA invoices each active anaesthetist once a month: the fixed items in
 * `appSettings.aaFee` plus the per-BCTI charge times their BCTIs paid that
 * month (counted only by `bctisFor` over `bctiRecords`), every amount ex GST
 * with GST at the foot. Each fee invoice is its own case in
 * `billing.aaFeeInvoices` with a `kind:'aaFee'` ACCREC against the
 * anaesthetist's existing Xero contact and NO ACCPAY: AA charging its own fee,
 * not money passing through. It is always a separate invoice, paid into AA's
 * own bank account, and NEVER netted: nothing here or anywhere deducts it from
 * a payable, a payables run or a disbursement (Greg, 2026-10-02: "Under trust
 * law it mustn't"). A fee payment is not the anaesthetist's income, so it makes
 * no BillingReceipt and never reaches GST activity.
 *
 * Every write goes through `mutate()`; time comes from the demo clock.
 */

import type { AaFeeInvoice, AaFeeSettings, Anaesthetist, PaymentIn, XeroAccRec, XeroContact } from '../domain/types'
import { aaFeeMonthLabel, buildAaFeeInvoice, validateAaFeeSettings } from '../domain/billing/aaFee'
import { BCTI_COUNT_RULE, bctisFor, type BctiRecord } from '../domain/billing/bcti'
import { roundToCents, toCents } from '../domain/billing/money'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bctiFeeHistoryFor, bctiRecords } from './selectors'
import { anaesthetistContactSpec, contactResolvedMeta, resolveContactInto } from './xeroHandoff'

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
  accRecs: Record<string, XeroAccRec>
  contacts: Record<string, XeroContact>
  cache: Record<string, string>
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
 * record (its own case, with the settings and counted BCTIs snapshotted) plus
 * its `kind:'aaFee'` ACCREC against the anaesthetist's existing Xero contact,
 * with no ACCPAY. The ONE path for an invoice from AA to an anaesthetist
 * (Phase 36 gives it its ledger pair; no later phase builds a second).
 */
export function raiseAnaesthetistInvoiceInto(
  draft: AnaesthetistInvoiceDraft,
  input: RaiseAnaesthetistInvoiceInput,
): { invoice: AaFeeInvoice; metas: MutationMeta[] } {
  const metas: MutationMeta[] = []
  const spec = anaesthetistContactSpec(input.anaesthetist)
  const contact = resolveContactInto(spec, draft.contacts, draft.cache, draft.counters)
  draft.counters = contact.counters
  if (contact.via === 'created') metas.push(contactResolvedMeta(contact.contactId, spec, contact))

  const id = allocateId(draft.counters, 'aaFeeInvoice')
  draft.counters = id.counters
  const number = allocateId(draft.counters, 'aaFeeInvoiceNumber')
  draft.counters = number.counters
  const xr = allocateId(draft.counters, 'xeroAccRec')
  draft.counters = xr.counters

  const { invoice, accRec } = buildAaFeeInvoice({
    id: id.id,
    invoiceNumber: number.id,
    accRecId: xr.id,
    anaesthetistId: input.anaesthetist.registrationNumber,
    contactId: contact.contactId,
    monthISO: input.monthISO,
    settings: input.settings,
    counted: input.counted,
    raisedAtISO: input.raisedAtISO,
    raisedBy: input.raisedBy,
  })
  draft.aaFeeInvoices[invoice.id] = invoice
  draft.accRecs[accRec.id] = accRec
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
    entityType: 'xeroAccRec',
    entityId: xr.id,
    action: 'xero.feeAccRecCreated',
    after: { invoiceNumber: invoice.invoiceNumber, contactId: contact.contactId, amountDue: invoice.total },
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
    .filter((a) => a.active && !invoiced.has(a.registrationNumber))
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
      accRecs: { ...s.xero.accRecs },
      contacts: { ...s.xero.contacts },
      cache: { ...s.billing.contactIdCache },
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
      billing: { ...s.billing, aaFeeInvoices: draft.aaFeeInvoices, contactIdCache: draft.cache },
      xero: { ...s.xero, accRecs: draft.accRecs, contacts: draft.contacts },
      counters: draft.counters,
    }
  })
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
  if (toCents(fee.amountReceived) >= toCents(fee.total)) return 'Already paid'
  return null
}

/**
 * The anaesthetist pays a fee invoice in full, into AA's own bank account: a
 * `PaymentIn` on the fee ACCREC (source `aaFee`), the ACCREC paid with its paid
 * date, and the fee invoice's mirror. Idempotent by key. No BillingReceipt and
 * no payable: it is AA's income, not the anaesthetist's.
 */
export function recordAaFeePayment(
  api: AppStoreApi,
  input: { aaFeeInvoiceId: string; idempotencyKey: string },
): Outcome<{ applied: boolean }> {
  const state = api.getState()
  const fee = state.billing.aaFeeInvoices[input.aaFeeInvoiceId]
  if (fee === undefined) return refuse('notFound', 'AA fee invoice not found.')
  if (state.xero.accRecs[fee.accRecId]?.kind !== 'aaFee') return refuse('noAccRec', 'The Xero record for this AA fee invoice is missing.')
  if (Object.values(state.xero.payments).some((p) => p.idempotencyKey === input.idempotencyKey)) return ok({ applied: false })
  const amount = roundToCents(fee.total - fee.amountReceived)
  if (toCents(amount) <= 0) return ok({ applied: false })

  mutate(
    api,
    AA_FEE_PAYMENT_ACTOR,
    {
      entityType: 'aaFeeInvoice',
      entityId: fee.id,
      action: 'aaFee.paymentRecorded',
      after: { invoiceNumber: fee.invoiceNumber, amount, accRecId: fee.accRecId, idempotencyKey: input.idempotencyKey },
    },
    (s) => {
      const atISO = clockISO(s.clock)
      const pmt = allocateId(s.counters, 'paymentIn')
      const payment: PaymentIn = { id: pmt.id, accRecId: fee.accRecId, amount, atISO, idempotencyKey: input.idempotencyKey, source: 'aaFee' }
      const accRec = s.xero.accRecs[fee.accRecId]
      const feeNow = s.billing.aaFeeInvoices[fee.id] ?? fee
      return {
        xero: {
          ...s.xero,
          payments: { ...s.xero.payments, [pmt.id]: payment },
          accRecs:
            accRec === undefined
              ? s.xero.accRecs
              : { ...s.xero.accRecs, [accRec.id]: { ...accRec, amountReceived: accRec.amountDue, status: 'paid', paidAtISO: accRec.paidAtISO ?? atISO } },
        },
        billing: {
          ...s.billing,
          aaFeeInvoices: { ...s.billing.aaFeeInvoices, [fee.id]: { ...feeNow, amountReceived: feeNow.total, paidAtISO: feeNow.paidAtISO ?? atISO } },
        },
        counters: pmt.counters,
      }
    },
  )
  return ok({ applied: true })
}
