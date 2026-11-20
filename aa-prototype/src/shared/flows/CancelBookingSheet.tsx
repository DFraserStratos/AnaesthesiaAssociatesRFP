import { useEffect, useMemo, useState } from 'react'
import { cancelBooking, useAppStore, type Actor } from '../../store'
import { livePrePaymentInvoicesForBooking } from '../../store/selectors'
import { pairForInvoice } from '../../store/ledgerSelectors'
import { roundToCents, toCents } from '../../domain/billing/money'
import { TextArea, FormError, Notice } from '../ui'
import { ConfirmSheet } from '../surface/ConfirmSheet'
import { formatMoney } from '../format'

interface CancelBookingSheetProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
  onCancelled: () => void
}

/** A live prepayment invoice on the Booking as the cancel sheet names it. */
export interface CancelPrepaymentNote {
  invoiceId: string
  invoiceNumber: string
  /** Received on it so far, from its ledger pair; 0 when unpaid. */
  received: number
}

/**
 * The live prepayment invoices a cancel settles (catch-up Phase 41; US-06.5.2,
 * D56), each with what was received: the cancel credits each in full and
 * refunds what was received to that invoice's payer, whoever cancels.
 */
export function cancelPrepaymentNotes(state: Parameters<typeof livePrePaymentInvoicesForBooking>[0] & Parameters<typeof pairForInvoice>[0], bookingId: string): CancelPrepaymentNote[] {
  return livePrePaymentInvoicesForBooking(state, bookingId).map((invoice) => ({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    received: roundToCents(pairForInvoice(state, invoice.id)?.receivable.receivedAmount ?? 0),
  }))
}

/**
 * Reason-gated booking cancellation (audited soft-cancel). The reason is required.
 *
 * A prepaid Booking (catch-up Phase 41): the sheet says, per live prepayment
 * invoice, what the cancel does to it, the same for the office and the
 * anaesthetist since it is automatic. Received: refunded in full to the payer
 * from the AA Holding account and credited; unpaid: credited, so the patient
 * is not chased.
 */
export function CancelBookingSheet({ open, bookingId, actor, onClose, onCancelled }: CancelBookingSheetProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const billing = useAppStore((s) => s.billing)
  const notes = useMemo(() => cancelPrepaymentNotes({ billing }, bookingId), [billing, bookingId])

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  function submit() {
    setError(null)
    const outcome = cancelBooking(useAppStore, actor, bookingId, reason)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCancelled()
    onClose()
  }

  return (
    <ConfirmSheet
      open={open}
      onClose={onClose}
      title="Cancel this booking"
      description="The booking stays visible in a cancelled state and drops out of the list's completion count. This is audited."
      confirmLabel="Cancel booking"
      onConfirm={submit}
      confirmDisabled={reason.trim() === ''}
      cancelLabel="Keep the booking"
    >
        {notes.length > 0 && (
          <div data-shot="cancel-prepayment" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map((n) => (
              <Notice key={n.invoiceId} tone="neutral" icon={false} data-invoice-id={n.invoiceId} data-received={toCents(n.received) > 0 ? 'yes' : 'no'}>
                {toCents(n.received) > 0 ? (
                  <span>
                    {'Prepayment received · '}
                    <span className="mono">{formatMoney(n.received)}</span>
                    {' on '}
                    <span className="mono">{n.invoiceNumber}</span>
                    {'. Cancelling refunds it in full to the payer from the AA Holding account and credits the invoice.'}
                  </span>
                ) : (
                  <span>
                    {'Prepayment invoice '}
                    <span className="mono">{n.invoiceNumber}</span>
                    {' is unpaid. Cancelling credits it in full, so the patient is not chased.'}
                  </span>
                )}
              </Notice>
            ))}
          </div>
        )}
        <TextArea label="Reason" value={reason} onChange={setReason} placeholder="Why is this booking being cancelled?" />
        <FormError message={error} />
    </ConfirmSheet>
  )
}
