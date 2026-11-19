/**
 * The credit note option in the Procedure's button slot (catch-up Phase 39;
 * US-08.6.5: "the additional invoice function has a credit note option"):
 * beside Create additional invoice (and 22's Split) on the Contract row of an
 * invoiced Procedure. It credits the Procedure's live invoice in full
 * (`liveInvoiceForProcedure`), in Admin through the side sheet the app
 * provides (`useCreditSheet`).
 *
 * Disabled with its sentence while a credit is pending, when the invoice
 * cannot be credited (a prepayment invoice, `creditRefusalFor`), and while an
 * Admin Booking has unsaved changes (Phase 35). The office's only in this
 * session; the anaesthetist's own entry is work item 11. PWA-safe.
 */

import { useState } from 'react'
import { creditRefusalFor, liveInvoiceForProcedure, type Actor } from '../../store'
import { TextAction } from '../ui/TextAction'
import { CREDIT_LABELS } from '../procedureEventCopy'
import { useCreditSheet } from './CreditSheetSlot'
import { useBookingStore, useCommandBlock } from './draft'

export function CreditNoteButton({ procedureId, actor }: { procedureId: string; actor: Actor }) {
  const state = useBookingStore((s) => s)
  const blocked = useCommandBlock()
  const Sheet = useCreditSheet()
  const [open, setOpen] = useState(false)
  // Work item 11 adds the anaesthetist on their own Procedure.
  if (actor.role !== 'office') return null
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (list === undefined || list.state !== 'AUTHORISED') return null
  const invoice = liveInvoiceForProcedure(state, procedureId)
  if (invoice === undefined) return null
  const refusal = creditRefusalFor(state, { role: 'office' }, invoice.id, 'correction', { procedureId })
  const reason = blocked ?? refusal?.message ?? null

  function done(creditEventId: string) {
    // Bring the new credit row into view under the Procedure.
    requestAnimationFrame(() => document.querySelector(`[data-shot="procedure-credit-event"][data-event-id="${creditEventId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  return (
    <>
      <TextAction shot="procedure-credit-note-button" data-invoice-id={invoice.id} onClick={() => setOpen(true)} disabled={reason !== null} disabledReason={reason}>
        {CREDIT_LABELS.creditNote}
      </TextAction>
      {open && <Sheet open invoiceId={invoice.id} actor={actor} mode="credit" onClose={() => setOpen(false)} onDone={done} />}
    </>
  )
}
