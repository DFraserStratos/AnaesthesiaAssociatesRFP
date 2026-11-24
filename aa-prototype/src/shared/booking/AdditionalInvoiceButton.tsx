/**
 * The additional invoice's button on the Procedure's Contract row (catch-up
 * Phase 38b; US-08.6.3 "Button", the typed decision of 2026-10-05): beside
 * 22's Split, on a Procedure of an authorised List. "Create additional
 * invoice" in all three apps: for the office on any Procedure, for the
 * anaesthetist on their own (`mayRaise`: never rendered on a colleague's).
 * Disabled with the refusal sentence when raising would be refused for a
 * state reason (no invoice yet, a cancelled Booking), and while an Admin
 * Booking has unsaved changes. On an invoiced List this is the one control
 * 38a's read-only rule allows here. PWA-safe.
 */

import { useState } from 'react'
import { mayRaise } from '../../domain/billing/procedureEvent'
import { procedureOwner, raiseRefusal, type Actor } from '../../store'
import { TextAction } from '../ui/TextAction'
import { EVENT_LABELS } from '../procedureEventCopy'
import { AdditionalInvoiceSheet } from './AdditionalInvoiceForm'
import { useBookingStore, useCommandBlock } from './draft'
import { scrollToEventRow } from './scrollToEventRow'

export function AdditionalInvoiceButton({ procedureId, actor }: { procedureId: string; actor: Actor }) {
  const state = useBookingStore((s) => s)
  const blocked = useCommandBlock()
  const [open, setOpen] = useState(false)
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (list === undefined || list.state !== 'AUTHORISED') return null
  const viewer = { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }
  if (!mayRaise('additionalInvoice', viewer, procedureOwner(state, procedureId))) return null
  const refusal = raiseRefusal(state, viewer, procedureId)
  const reason = blocked ?? refusal?.message ?? null

  return (
    <>
      <TextAction shot="additional-invoice-button" onClick={() => setOpen(true)} disabled={reason !== null} disabledReason={reason}>
        {EVENT_LABELS.createAdditional}
      </TextAction>
      <AdditionalInvoiceSheet open={open} procedureId={procedureId} actor={actor} onClose={() => setOpen(false)} onSaved={(id) => scrollToEventRow(id, 'procedure-event-row')} />
    </>
  )
}
