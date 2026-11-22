/**
 * Small parts the Admin Patients screens share (catch-up Phase 40, item 12):
 * the signed balance text ("In credit $260.00" when negative), the invoice
 * status pill and the detail labels. Built on the shared `Pill`. The
 * strength pill is `shared/warnings`' `StrengthPill`; links are `TextAction`
 * with `to`; the record's path is `shared/patients`' `patientPath`.
 */

import { Pill, SelectField } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { neutral } from '../../../../theme/tokens'
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
export const DETAIL_FIELD_LABELS: Record<'name' | 'dobISO' | 'phone' | 'email' | 'address' | 'ethnicityCode', string> = {
  name: 'Name',
  dobISO: 'Date of birth',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  ethnicityCode: 'Ethnicity',
}

/** One row of a details comparison: a value on the record beside another source's. */
export interface DetailChoiceRow {
  field: keyof typeof DETAIL_FIELD_LABELS
  existing?: string
  incoming: string
  /** The record lacks it: filled in, with no choice ("Will be added"; catch-up Phase 40a). */
  added?: boolean
}

/**
 * The details comparison table (catch-up Phase 40's Details differ, shared
 * with Add NHI's read-only preview and 40a's refresh from the register):
 * Detail, the record's value, the other source's, and, with `choice`, a
 * Keep or Use select per row (default Keep).
 */
export function DetailChoiceTable({
  rows,
  recordHeader,
  incomingHeader,
  shot,
  choice,
}: {
  rows: readonly DetailChoiceRow[]
  recordHeader: string
  incomingHeader: string
  shot?: string
  choice?: {
    header: string
    useLabel: string
    value: (field: DetailChoiceRow['field']) => 'keep' | 'use'
    onChange: (field: DetailChoiceRow['field'], value: 'keep' | 'use') => void
  }
}) {
  return (
    <TableShell label="Details that differ" density="dense" nested {...(shot !== undefined ? { shot } : {})}>
      <thead>
        <tr>
          <Th>Detail</Th>
          <Th>{recordHeader}</Th>
          <Th>{incomingHeader}</Th>
          {choice !== undefined && <Th>{choice.header}</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.field} data-field={d.field}>
            <Td>{DETAIL_FIELD_LABELS[d.field]}</Td>
            <Td mono={d.field === 'dobISO' || d.field === 'ethnicityCode'}>{d.existing ?? 'Not held'}</Td>
            <Td mono={d.field === 'dobISO' || d.field === 'ethnicityCode'}>{d.incoming}</Td>
            {choice !== undefined && (
              <Td>
                {d.added === true ? (
                  <span data-added style={{ fontSize: 12.5, color: neutral.slate }}>Will be added</span>
                ) : (
                  <SelectField
                    label={`${DETAIL_FIELD_LABELS[d.field]}: keep or ${choice.useLabel.toLowerCase()}`}
                    hideLabel
                    size="compact"
                    fill="surface"
                    value={choice.value(d.field)}
                    onChange={(v) => choice.onChange(d.field, v === 'use' ? 'use' : 'keep')}
                  >
                    <option value="keep">Keep</option>
                    <option value="use">{choice.useLabel}</option>
                  </SelectField>
                )}
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}
