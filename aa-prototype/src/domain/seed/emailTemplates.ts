/**
 * The seeded update email templates (catch-up Phase 35; US-02.3.4, DM-35):
 * one per kind of change, in plain NZ English with no dashes. Ids `ET001` to
 * `ET004`; the `emailTemplate` counter continues at 5. No RNG draws.
 */

import type { EmailTemplate } from '../types'

export const SEED_EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  {
    id: 'ET001',
    name: 'Change of anaesthetist',
    kind: 'anaesthetistChange',
    recipient: 'hospital',
    subject: 'Change of anaesthetist: {date} {session} list at {hospital}',
    body: [
      'Kia ora,',
      '',
      '{previousAnaesthetist} is no longer the anaesthetist for the {date} {session} List at {hospital}. {anaesthetist} will be the anaesthetist.',
      '',
      'The List is for {surgeon} and has {bookingCount} booking(s) on it. Nothing else about the List has changed.',
      '',
      'Ngā mihi,',
      '{signature}',
    ].join('\n'),
    active: true,
  },
  {
    id: 'ET002',
    name: 'Cancellation',
    kind: 'cancellation',
    recipient: 'office',
    subject: 'Booking cancelled: {patient}, {date} {session}',
    body: [
      'Kia ora,',
      '',
      "We've cancelled the following booking on {surgeon}'s {date} {session} List at {hospital}.",
      '',
      'Patient: {patient}',
      '{changes}',
      '',
      'Please let us know if this is not what you expected.',
      '',
      'Ngā mihi,',
      '{signature}',
    ].join('\n'),
    active: true,
  },
  {
    id: 'ET003',
    name: 'Correction of an error',
    kind: 'correction',
    recipient: 'office',
    subject: 'Correction: {patient}, {date} {session}',
    body: [
      'Kia ora,',
      '',
      "We've corrected an error in our booking for {patient} on {surgeon}'s {date} {session} List at {hospital}. It now reads:",
      '',
      '{changes}',
      '',
      'Sorry for any confusion.',
      '',
      'Ngā mihi,',
      '{signature}',
    ].join('\n'),
    active: true,
  },
  {
    id: 'ET004',
    name: 'Booking change',
    kind: 'bookingChange',
    recipient: 'office',
    subject: 'Booking update: {patient}, {date} {session}',
    body: [
      'Kia ora,',
      '',
      "The booking for {patient} on {surgeon}'s {date} {session} List at {hospital} has changed:",
      '',
      '{changes}',
      '',
      'Anaesthetist: {anaesthetist}',
      '',
      'Ngā mihi,',
      '{signature}',
    ].join('\n'),
    active: true,
  },
]

/** The next `ET###` the office's Add template allocates. */
export const SEED_EMAIL_TEMPLATE_NEXT = SEED_EMAIL_TEMPLATES.length + 1
