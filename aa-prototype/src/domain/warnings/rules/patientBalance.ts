/**
 * Patient balance (catch-up Phase 40; US-11.3.2, RV-36; D24, OQ-74 and
 * OQ-41 answered): when a Booking is created or matched for a patient who
 * owes AA money on invoices billed to them, or holds a credit, the Booking
 * carries a before-procedure warning. Mild (yellow) while the oldest unpaid
 * invoice is within the threshold, strong (red) once older, counted from the
 * invoice date (`invoiceAgeDays`); mild for a patient in credit. It never
 * blocks: the office clears it from 15a's to-do list (the wave-through).
 *
 * The two halves live in `domain/patients/patientBalance.ts`, one place each:
 * which earlier invoices count (`countsTowardPatientBalance`: billed to the
 * patient only) and which new Bookings are checked (`checksPatientBalance`:
 * a Procedure whose payer is the patient, D85). The store builds the fact
 * only for a Booking stamped `balanceCheck`, so seeded Bookings raise none.
 *
 * OQ-134 (answered 18 November, D80): this rule and 27's prepayment warning
 * are two rules shown side by side, neither reading the other.
 *
 * The threshold is the one rule parameter with a UI (Master data): a demo
 * convenience; US-11.3.2 keeps it fixed until a settings page (US-13.7.4,
 * Future). A different starting threshold changes only `defaultParams`.
 */

import { formatMoney } from '../../billing/money'
import { patientBalanceStrength, type PatientBalanceSummary } from '../../patients/patientBalance'
import type { WarningRule } from '../types'

export const PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS = 90

const invoices = (n: number): string => (n === 1 ? '1 invoice' : `${n} invoices`)

export const patientBalanceStrongText = (name: string, s: PatientBalanceSummary, threshold: number): string =>
  `${name} owes ${formatMoney(s.owingTotal)} on ${invoices(s.owing.length)}, unpaid ${s.oldestAgeDays} days (over the ${threshold} day threshold). Follow up before the procedure.`
export const patientBalanceMildText = (name: string, s: PatientBalanceSummary, threshold: number): string =>
  `${name} owes ${formatMoney(s.owingTotal)} on ${invoices(s.owing.length)}, unpaid ${s.oldestAgeDays} days (within the ${threshold} day threshold).`
export const patientBalanceCreditText = (name: string, s: PatientBalanceSummary): string =>
  `${name} is in credit by ${formatMoney(s.creditTotal)}. Check before invoicing.`

/** The anaesthetist's wording: no name, no amount (US-15.0.6). */
export const PATIENT_BALANCE_OWES_SHORT = 'This patient owes AA money. The office is following up.'
export const PATIENT_BALANCE_CREDIT_SHORT = 'This patient is in credit with AA.'

export const patientBalanceRule: WarningRule = {
  id: 'patientBalance',
  label: 'Patient balance',
  defaultParams: { thresholdDays: PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS },
  evaluate(facts, params) {
    const fact = facts.patientBalance
    if (fact === undefined) return []
    const threshold = params['thresholdDays'] ?? PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS
    const strength = patientBalanceStrength(fact.summary, threshold)
    if (strength === 'none') return []
    if (fact.summary.owing.length === 0) {
      return [{ kind: 'beforeProcedure', strength: 'mild', text: patientBalanceCreditText(fact.patientName, fact.summary), shortText: PATIENT_BALANCE_CREDIT_SHORT }]
    }
    return [
      {
        kind: 'beforeProcedure',
        strength,
        text: strength === 'strong' ? patientBalanceStrongText(fact.patientName, fact.summary, threshold) : patientBalanceMildText(fact.patientName, fact.summary, threshold),
        shortText: PATIENT_BALANCE_OWES_SHORT,
      },
    ]
  },
}
