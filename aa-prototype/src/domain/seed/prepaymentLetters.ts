/**
 * The seeded prepayment letter templates (catch-up Phase 41; US-06.3.6):
 * one active default per kind. Plain text with `{{field}}` placeholders, the
 * prepaid amount stated as the price payable, never an estimate. Added after
 * every other master, with no RNG draws.
 */

import type { PrepaymentLetterTemplate } from '../types'

export const SEED_LETTER_TEMPLATES: readonly PrepaymentLetterTemplate[] = [
  {
    id: 'LT001',
    kind: 'request',
    name: 'Standard prepayment letter',
    body:
      'Dear {{patientName}}, thank you for booking your {{procedure}} with {{anaesthetist}} on {{procedureDate}}. ' +
      'The anaesthetic fee is {{prepaidAmount}}, payable before your procedure. Please pay invoice {{invoiceNumber}} using the details it shows. ' +
      'If your procedure turns out very different from what was planned, your anaesthetist may send a further invoice or a credit.',
    isDefault: true,
    active: true,
  },
  {
    id: 'LT002',
    kind: 'reminder',
    name: 'Prepayment reminder',
    body:
      'Dear {{patientName}}, our records show {{amountOutstanding}} of the anaesthetic fee for your {{procedure}} on {{procedureDate}} is still to pay. ' +
      'Please pay invoice {{invoiceNumber}} before your procedure, or contact the AA office if you have any questions.',
    isDefault: true,
    active: true,
  },
  {
    id: 'LT003',
    kind: 'anaesthetistChanged',
    name: 'Anaesthetist changed',
    body:
      'Dear {{patientName}}, a quick note about your {{procedure}} on {{procedureDate}}. Your anaesthetist is now {{anaesthetist}}. ' +
      'The amount you prepaid, {{prepaidAmount}}, stays the same and you do not need to do anything. Please contact the AA office if you have any questions.',
    isDefault: true,
    active: true,
  },
]

/** The next `letterTemplate` counter value. */
export const SEED_LETTER_TEMPLATE_NEXT = SEED_LETTER_TEMPLATES.length + 1
