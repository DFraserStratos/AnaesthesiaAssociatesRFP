/**
 * A child as the payer, per Procedure (catch-up Phase 21; per Procedure since
 * catch-up Phase 22a; US-11.2.4, US-13.7.1, D4, OQ-54; DM-31): the patient is
 * under 18 on the List's date and is billed for the Procedure (its payer is
 * the patient and its Contract bills the payer, or, split, a share is billed
 * to the patient). One finding per Procedure (the key carries it); the
 * dashboard to-do list folds a Booking's findings to one row. Mild, before the
 * procedure, cleared by the office; never a block. None on a Procedure billed
 * to its holder, with no Contract, or paid by another payer (`childPayerOn`,
 * the one rule in `domain/billing/whoIsBilled.ts`). No Review flag duplicates it.
 */

import type { WarningFinding, WarningRule } from '../types'
import { childPayerOn } from '../../billing/whoIsBilled'

export function childPayerText(patientName: string): string {
  return `${patientName} is under 18 and is the payer. Check the payer's details: a parent's or guardian's email or postal address may be needed.`
}

export const childPayerRule: WarningRule = {
  id: 'childPayer',
  label: 'Child as the payer',
  defaultParams: {},
  evaluate(facts) {
    const { patient, contracts } = facts
    if (patient === undefined || contracts === undefined) return []
    const out: WarningFinding[] = []
    for (const procedure of facts.procedures) {
      const contract = procedure.governingContractId !== undefined ? contracts[procedure.governingContractId] : undefined
      if (!childPayerOn(procedure, patient, contract, facts.list.dateISO)) continue
      out.push({ kind: 'beforeProcedure', strength: 'mild', text: childPayerText(patient.name), procedureId: procedure.id })
    }
    return out
  },
}
