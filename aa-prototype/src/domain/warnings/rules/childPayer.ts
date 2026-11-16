/**
 * A child as the payer on the Booking (catch-up Phase 21; US-11.2.4, D4,
 * OQ-54; DM-31): the patient is under 18 on the List's date, the "different
 * payer" tick is clear, and a Procedure bills the payer. Mild, before the
 * procedure, cleared by the office; never a block. None when another payer is
 * ticked or every Procedure's Contract bills its holder (`childPayerOn`, the
 * one rule in `domain/billing/whoIsBilled.ts`). No Review flag duplicates it.
 */

import type { WarningRule } from '../types'
import { childPayerOn } from '../../billing/whoIsBilled'

export function childPayerText(patientName: string): string {
  return `${patientName} is under 18 and is the payer. Check the payer's details: a parent's or guardian's email or postal address may be needed.`
}

export const childPayerRule: WarningRule = {
  id: 'childPayer',
  label: 'Child as the payer',
  defaultParams: {},
  evaluate(facts) {
    if (facts.patient === undefined || facts.contracts === undefined) return []
    if (!childPayerOn(facts.booking, facts.patient, facts.procedures, facts.contracts, facts.list.dateISO)) return []
    return [{ kind: 'beforeProcedure', strength: 'mild', text: childPayerText(facts.patient.name) }]
  },
}
