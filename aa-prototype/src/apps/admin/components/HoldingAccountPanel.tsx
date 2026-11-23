import { Link } from 'react-router-dom'
import { accent, neutral, semantic } from '../../../theme/tokens'
import { useAppStore, useHoldingAccount } from '../../../store'
import type { CreditCause } from '../../../domain/types'
import type { HoldingEntry } from '../../../domain/billing/prepayHolding'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Pill } from '../../../shared/ui/Pill'
import { TableShell, Td, Th } from '../../../shared/table'
import { dayMicroCap, formatCurrency, plural } from '../../../shared/format'
import { LEAVES_ONLY_BY_SYSTEM, RELEASE_TRIGGER_CAPTION } from '../../../domain/billing/prepayHolding'

/**
 * The AA Holding account on the Billing monitor (catch-up Phase 27a; US-06.5.1,
 * FT-06.5): the payables creditor every prepayment credits, kept like an
 * anaesthetist's account and never paid itself. Its balance (the prepayments
 * received for procedures not yet done), the prepaid Bookings it covers and
 * its entries, all derived. Read-only: money leaves it only by a transfer or a
 * refund the system raises. The release trigger is provisional (OQ-125), so its
 * caption says so. Phase 36's Ledger will show the account too.
 *
 * Credited and refunded rows (catch-up Phase 41; US-06.5.2, US-06.3.7): a
 * credit reversing the account's payable (by hand, a cancellation or a
 * Contract change) and a refund the system paid the payer out of it, each with
 * its credit number and why. The patient by name, never the NHI.
 */
export function HoldingAccountPanel() {
  const account = useHoldingAccount()
  const creditNotes = useAppStore((s) => s.billing.creditNotes)
  return (
    <Card
      shot="billing-prepay-holding"
      title="AA Holding account"
      action={
        <span className="mono" data-holding-balance={account.balance} style={{ fontSize: 20, fontWeight: 700, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(account.balance)}
        </span>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12.5, color: neutral.slate }}>
        <span>
          {account.bookingsCovered > 0 ? `Held for ${plural(account.bookingsCovered, 'prepaid Booking')}. ` : ''}
          {LEAVES_ONLY_BY_SYSTEM}.
        </span>
        <Pill tone="warning" title="The release trigger is still to confirm with AA (OQ-125)">
          {RELEASE_TRIGGER_CAPTION} · to confirm with AA (OQ-125)
        </Pill>
      </div>
      {account.rows.length === 0 ? (
        <EmptyState>Nothing held</EmptyState>
      ) : (
        <TableShell label="AA Holding account entries" nested minWidth={880} density="compact">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Booking</Th>
              <Th>Invoice</Th>
              <Th>Entry</Th>
              <Th>Credit note</Th>
              <Th>Cause</Th>
              <Th>Anaesthetist</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {account.rows.map((row) => (
              <tr key={row.receiptId ?? row.transferId ?? row.refundId ?? `${row.kind}-${row.invoiceId}`} data-shot="holding-entry" data-entry-kind={row.kind} data-booking-id={row.bookingId}>
                <Td mono nowrap>{dayMicroCap(row.atISO.slice(0, 10))}</Td>
                <Td>
                  {row.dateISO !== undefined ? (
                    <Link to={`/admin/day/${row.dateISO}/bookings/${row.bookingId}`} style={{ color: accent.base, fontWeight: 600, textDecoration: 'none' }}>
                      {row.patientName}
                    </Link>
                  ) : (
                    row.patientName
                  )}
                </Td>
                <Td mono>
                  <Link to={`/admin/invoices/${row.invoiceId}`} style={{ color: accent.base, textDecoration: 'none' }}>
                    {row.invoiceNumber}
                  </Link>
                </Td>
                <Td>
                  <Pill tone={row.kind === 'transferred' ? 'success' : 'neutral'}>{ENTRY_LABEL[row.kind]}</Pill>
                </Td>
                <Td mono nowrap style={{ color: neutral.ink }}>{row.creditNoteNumber ?? ''}</Td>
                <Td data-cause={causeOf(row, creditNotes) ?? undefined} style={{ color: neutral.slate }}>{causeOf(row, creditNotes) ?? ''}</Td>
                <Td style={{ color: row.anaesthetistName !== undefined ? neutral.ink : neutral.mist }}>{row.anaesthetistName ?? ''}</Td>
                <Td mono align="right" style={{ color: row.kind === 'transferred' ? semantic.success.onTint : row.kind === 'refunded' ? neutral.slate : neutral.ink }}>
                  {row.kind === 'transferred' || row.kind === 'credited' ? `-${formatCurrency(row.amount)}` : formatCurrency(row.amount)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </Card>
  )
}

const ENTRY_LABEL: Record<HoldingEntry['kind'], string> = {
  received: 'Received',
  transferred: 'Transferred',
  credited: 'Credited',
  refunded: 'Refunded',
}

/** A credit's cause in the table's words (catch-up Phase 41). */
const CREDIT_CAUSE_LABEL: Record<CreditCause, string> = {
  prepaymentCancelled: 'Cancelled',
  prepaidContractChanged: 'Contract changed',
  correction: 'By hand',
  split: 'By hand',
}

const REFUND_CAUSE_LABEL: Record<NonNullable<HoldingEntry['refundCause']>, string> = {
  cancelled: 'Cancelled',
  latePayment: 'Late payment',
  contractChanged: 'Contract changed',
}

/** Why a credited or refunded row is there: the refund's cause, or the credit note's. Null for received and transferred rows. */
function causeOf(row: Pick<HoldingEntry, 'kind' | 'refundCause' | 'creditNoteId'>, creditNotes: Readonly<Record<string, { cause: CreditCause }>>): string | null {
  if (row.kind === 'refunded') return row.refundCause !== undefined ? REFUND_CAUSE_LABEL[row.refundCause] : null
  if (row.kind !== 'credited' || row.creditNoteId === undefined) return null
  const note = creditNotes[row.creditNoteId]
  return note !== undefined ? CREDIT_CAUSE_LABEL[note.cause] : null
}
