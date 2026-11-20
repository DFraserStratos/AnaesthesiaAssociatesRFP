/**
 * Small parts the Admin Patients screens share (catch-up Phase 40, item 12):
 * the signed balance text ("In credit $260.00" when negative), the invoice
 * status pill and the detail labels. Built on the shared `Pill`. The
 * strength pill is `shared/warnings`' `StrengthPill`; links are `TextAction`
 * with `to`; the record's path is `shared/patients`' `patientPath`.
 */

import { Pill } from '../../../../shared/ui'
import { formatMoney } from '../../../../shared/format'
import { toCents } from '../../../../domain/billing/money'
import type { PatientInvoiceRow } from '../../../../store'
import type { PatientPendingDetails } from '../../../../domain/types'

/** Where held details came from, following who entered them: "the hospital", "the surgeon", "the office" or the anaesthetist by name. */
export function detailsFromText(pending: Pick<PatientPendingDetails, 'source' | 'by'>): string {
  switch (pending.source) {
    case 'hospital':
      return 'the hospital'
    case 'surgeon':
      return 'the surgeon'
    case 'anaesthetist':
      return pending.by ?? 'the anaesthetist'
    case 'aa':
      return 'the office'
  }
}

/** A signed balance: "$610.00", or "In credit $260.00" when the patient is owed. The one home of the credit wording. */
export function balanceText(amount: number): string {
  if (toCents(amount) < 0) return `In credit ${formatMoney(-amount)}`
  return formatMoney(amount)
}

export const INVOICE_STATUS_LABELS: Record<PatientInvoiceRow['status'], string> = {
  paid: 'Paid',
  partPaid: 'Part paid',
  unpaid: 'Unpaid',
  credited: 'Credited',
}

// Unpaid is neutral, as every other invoice pill reads it; the red is kept for the strong balance warning.
const STATUS_TONES: Record<PatientInvoiceRow['status'], 'success' | 'warning' | 'neutral'> = {
  paid: 'success',
  partPaid: 'warning',
  unpaid: 'neutral',
  credited: 'neutral',
}

export function InvoiceStatusPill({ status }: { status: PatientInvoiceRow['status'] }) {
  return (
    <Pill tone={STATUS_TONES[status]} size="sm" data-invoice-status={status}>
      {INVOICE_STATUS_LABELS[status]}
    </Pill>
  )
}

/** The patient fields the "details differ" tables compare, in the office's words. */
export const DETAIL_FIELD_LABELS: Record<'name' | 'dobISO' | 'phone' | 'email' | 'address', string> = {
  name: 'Name',
  dobISO: 'Date of birth',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
}
