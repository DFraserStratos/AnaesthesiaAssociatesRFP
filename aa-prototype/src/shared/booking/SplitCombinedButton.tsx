/**
 * Split into additional invoices (catch-up Phase 39, work item 10; US-08.6.4,
 * OQ-53, OQ-77): on the Procedure's Contract row in Admin, beside Credit note.
 * The office's only (never rendered for an anaesthetist). It opens the app's
 * credit sheet in split mode (`useCreditSheet`, Admin's `SplitCombinedSheet`)
 * on the invoice `splitTargetFor` names, for this Procedure. Disabled with
 * `canSplitCombined`'s sentence otherwise: before the invoice exists a split
 * is a normal edit of the Booking ("Not invoiced yet. Edit the Booking's
 * Procedures, Contracts and prices instead."), and while a credit waits, once
 * credited, on a prepaid Procedure and while the Booking has unsaved changes
 * (Phase 35). PWA-safe.
 */

import { useState } from 'react'
import { canSplitCombined, splitTargetFor, type Actor } from '../../store'
import { TextAction } from '../ui/TextAction'
import { CREDIT_LABELS } from '../procedureEventCopy'
import { useCreditSheet } from './CreditSheetSlot'
import { useBookingStore, useCommandBlock } from './draft'
import { scrollToEventRow } from './scrollToEventRow'

export function SplitCombinedButton({ procedureId, actor }: { procedureId: string; actor: Actor }) {
  const state = useBookingStore((s) => s)
  const blocked = useCommandBlock()
  const Sheet = useCreditSheet()
  const [open, setOpen] = useState(false)
  if (actor.role !== 'office') return null
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  if (booking === undefined || booking.cancellation !== undefined) return null
  const refusal = canSplitCombined(state, procedureId, { role: 'office' })
  const target = splitTargetFor(state, procedureId)
  const reason = blocked ?? refusal?.message ?? null

  return (
    <>
      <TextAction shot="split-combined-button" {...(target !== undefined ? { 'data-invoice-id': target.id } : {})} onClick={() => setOpen(true)} disabled={reason !== null} disabledReason={reason}>
        {CREDIT_LABELS.splitButton}
      </TextAction>
      {open && target !== undefined && (
        <Sheet open invoiceId={target.id} procedureId={procedureId} actor={actor} mode="split" onClose={() => setOpen(false)} onDone={(id) => scrollToEventRow(id, 'procedure-credit-event')} />
      )}
    </>
  )
}
