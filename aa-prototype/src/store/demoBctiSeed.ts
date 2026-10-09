/**
 * "Seed a month of BCTIs" (catch-up Phase 16 demo action; Admin · AA fee
 * invoices). Tops Dr Rutherford up to exactly 40 BCTIs paid in July 2026 so
 * the US-10.3.1 example ($500 + $5 x 40 = $700 before GST, at the sample
 * settings) reproduces on the next fee run under the paid-only count.
 *
 * It adds 40 minus his current July count from `bctisFor` over `bctiRecords`
 * (it never counts BCTIs itself), built through the same history graph as Dr
 * Souter's seeded accounts (`addHistoryAccounts`): billed Lists on 1, 2, 3 and
 * 6 July, an AM and a PM List each day with five Bookings each, all before the
 * canvas horizon start (7 July) so no added List collides with a generated
 * one. Every receivable is paid in full a week after its service date and
 * disbursed, so nothing reaches Overdue or the payables run. Hospital payers
 * only (organisation contacts, no personal information). One `mutate()`, one
 * audit entry, as the demo-actions actor. Deterministic: no clock or randomness.
 */

import { addDays as addCalendarDays, format, parseISO } from 'date-fns'
import type { Anaesthetist } from '../domain/types'
import { aaFeeMonthLabel } from '../domain/billing/aaFee'
import { addHistoryAccounts, historyIds, type HistoryAccount, type HistoryBuild } from '../domain/seed/history'
import { HOSP, SURG } from '../domain/seed/cast'
import { DEMO_TODAY } from '../domain/clock'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { bctisToChargeFor } from './selectors'
import { anaesthetistContactSpec, resolveContactInto, type ContactSpec } from './xeroHandoff'

/** The seed's demo month, July 2026. */
export const BCTI_SEED_MONTH = DEMO_TODAY.slice(0, 7)
export const BCTI_SEED_TARGET = 40

const NS = 'RB'
const IDS = historyIds(NS)
const DAYS = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06'] as const
const SESSIONS = ['AM', 'PM'] as const
const PER_LIST = 5
const LIST_PLAN = [
  { hospitalId: HOSP.stg, surgeonId: SURG.hale, description: 'Knee arthroscopy', rvgBaseCode: '49558' },
  { hospitalId: HOSP.sx, surgeonId: SURG.patel, description: 'Laparoscopic cholecystectomy', rvgBaseCode: '20941' },
  { hospitalId: HOSP.forte, surgeonId: SURG.okafor, description: 'Inguinal hernia repair', rvgBaseCode: '20941' },
  { hospitalId: HOSP.cph, surgeonId: SURG.tan, description: 'Cystoscopy', rvgBaseCode: '50120' },
] as const
const TOTALS = [420, 515.5, 690, 845, 310.25, 980, 560, 735.8] as const

function addDays(dateISO: string, days: number): string {
  return format(addCalendarDays(parseISO(dateISO), days), 'yyyy-MM-dd')
}

/** The 40 slots in order (day, then AM before PM, then position). */
function plannedAccounts(patientIds: readonly string[]): HistoryAccount[] {
  const accounts: HistoryAccount[] = []
  let i = 0
  for (const [d, day] of DAYS.entries()) {
    for (const [si, session] of SESSIONS.entries()) {
      const plan = LIST_PLAN[(d * SESSIONS.length + si) % LIST_PLAN.length]!
      for (let k = 0; k < PER_LIST; k += 1) {
        accounts.push({
          key: `rb${String(i + 1).padStart(2, '0')}`,
          patientId: patientIds[(i * 7) % patientIds.length]!,
          counterparty: { kind: 'hospital', id: plan.hospitalId },
          surgeonId: plan.surgeonId,
          hospitalId: plan.hospitalId,
          description: plan.description,
          rvgBaseCode: plan.rvgBaseCode,
          serviceISO: day,
          raisedISO: `${addDays(day, 1)}T09:00:00`,
          total: TOTALS[i % TOTALS.length]!,
          accRelated: false,
          paidState: 'paid',
          paidAtISO: `${addDays(day, 7)}T10:00:00`,
          disbursedAtISO: `${addDays(day, 9)}T09:00:00`,
          listKey: `${day.slice(5).replace('-', '')}-${session}`,
          session,
        })
        i += 1
      }
    }
  }
  return accounts
}

function anaesthetistOf(state: Pick<AppState, 'masters'>, anaesthetistId: string): Anaesthetist | undefined {
  return state.masters.anaesthetists[anaesthetistId]
}

/** Why the BCTIs cannot be seeded for `anaesthetistId`, or null. */
export function seedBctisDisabledReason(state: Pick<AppState, 'masters' | 'billing' | 'xero'>, anaesthetistId: string): string | null {
  if (anaesthetistOf(state, anaesthetistId) === undefined) return 'The anaesthetist is not in this seed.'
  const month = aaFeeMonthLabel(BCTI_SEED_MONTH)
  if (Object.values(state.billing.aaFeeInvoices).some((f) => f.anaesthetistId === anaesthetistId && f.monthISO === BCTI_SEED_MONTH)) {
    return `Already invoiced for ${month}`
  }
  if (bctisToChargeFor(state, anaesthetistId, BCTI_SEED_MONTH).length >= BCTI_SEED_TARGET) {
    return `Already ${BCTI_SEED_TARGET} BCTIs paid in ${month}`
  }
  if (state.billing.invoices[IDS.invoice('01')] !== undefined) return 'This month of BCTIs is already seeded.'
  return null
}

/** Top `anaesthetistId` up to 40 BCTIs paid in July 2026. */
export function seedMonthOfBctis(api: AppStoreApi, actor: Actor, anaesthetistId: string): Outcome<{ added: number }> {
  const state = api.getState()
  const reason = seedBctisDisabledReason(state, anaesthetistId)
  if (reason !== null) return refuse('notAvailable', reason)
  const anaesthetist = anaesthetistOf(state, anaesthetistId)!
  const need = BCTI_SEED_TARGET - bctisToChargeFor(state, anaesthetistId, BCTI_SEED_MONTH).length
  const patientIds = Object.keys(state.masters.patients).sort()
  const accounts = plannedAccounts(patientIds).slice(0, need)

  mutate(
    api,
    actor,
    {
      entityType: 'anaesthetist',
      entityId: anaesthetistId,
      action: 'demo.bctisSeeded',
      after: { added: accounts.length, monthISO: BCTI_SEED_MONTH, target: BCTI_SEED_TARGET },
    },
    (s) => {
      const contacts = { ...s.xero.contacts }
      const cache = { ...s.billing.contactIdCache }
      let counters = s.counters
      const resolve = (spec: ContactSpec): string => {
        const r = resolveContactInto(spec, contacts, cache, counters)
        counters = r.counters
        return r.contactId
      }
      const build: HistoryBuild = {
        lists: {}, bookings: {}, procedures: {}, invoices: {}, invoiceLines: {}, cases: {},
        receipts: {}, contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {}, contactIdCache: {},
      }
      addHistoryAccounts(build, {
        anaesthetistId,
        accounts,
        ids: IDS,
        masters: s.masters,
        payeeContactId: resolve(anaesthetistContactSpec(anaesthetist)),
        resolveContact: (kind, id, name, type) =>
          resolve({ key: `${kind}:${id}`, contactNumber: id, name, type }),
        payablesRunId: `PR-${NS}-01`,
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
          cases: { ...s.billing.cases, ...build.cases },
          receipts: { ...s.billing.receipts, ...build.receipts },
          contactIdCache: cache,
        },
        xero: {
          ...s.xero,
          contacts,
          accRecs: { ...s.xero.accRecs, ...build.accRecs },
          accPays: { ...s.xero.accPays, ...build.accPays },
          payments: { ...s.xero.payments, ...build.payments },
          disbursements: { ...s.xero.disbursements, ...build.disbursements },
        },
        counters,
      }
    },
  )
  return ok({ added: accounts.length })
}
