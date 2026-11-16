/**
 * A missing approval number on an insured Booking (catch-up Phase 21;
 * US-11.4.3, US-13.7.1; OQ-93, D28; DM-31): the Booking's funder is an
 * insurer (NIB, Southern Cross Health Society) and it holds no approval
 * number. The only insurance warning; never for ACC or Health NZ (funders,
 * our reading A42) or a blank funder (`approvalNumberMissing`, the one rule in
 * `domain/billing/insurance.ts`). Mild, before the procedure, shown to the
 * office (to-do list) and to the anaesthetist viewing the Booking; entering
 * the number removes it; it never blocks.
 */

import type { WarningRule } from '../types'
import { approvalNumberMissing } from '../../billing/insurance'

export function approvalNumberMissingText(insurerName: string): string {
  return `${insurerName} is named but there is no approval number. Without approval on the day, the patient is billed.`
}

export const approvalNumberMissingRule: WarningRule = {
  id: 'approvalNumberMissing',
  label: 'No approval number',
  defaultParams: {},
  evaluate(facts) {
    if (facts.parties === undefined || !approvalNumberMissing(facts.booking, facts.parties)) return []
    const insurer = facts.booking.funderPartyId !== undefined ? facts.parties[facts.booking.funderPartyId] : undefined
    return [{ kind: 'beforeProcedure', strength: 'mild', text: approvalNumberMissingText(insurer?.name ?? 'The insurer') }]
  },
}
