/**
 * The credit note option in the Procedure's button slot (catch-up Phase 39,
 * work items 7 and 11; US-08.6.5: "the additional invoice function has a
 * credit note option"): beside Create (Admin) or Raise (anaesthetist)
 * additional invoice, and 22's Split, on the Contract row of an invoiced
 * Procedure. It credits the Procedure's live invoice in full in the app's
 * credit sheet (`useCreditSheet`): Admin's side sheet, a bottom sheet on the
 * phone, a dialog on the web. The sheet is told this Procedure, and, where a
 * fee split left it several live invoices, offers the choice of which.
 *
 * `creditOptionFor` decides it for either actor: hidden on a colleague's
 * Procedure and before the invoice exists; on a prepaid Procedure it credits
 * the whole prepayment invoice (Phase 41, D31; the form says so); disabled
 * with its sentence while a credit waits or once credited, and while an Admin
 * Booking has unsaved changes (Phase 35). The anaesthetist's variant has no
 * copy, no split and no ledger figures. PWA-safe.
 */

import { useState } from 'react'
import { creditOptionFor, type Actor } from '../../store'
import { TextAction } from '../ui/TextAction'
import { CREDIT_LABELS } from '../procedureEventCopy'
import { useCreditSheet } from './CreditSheetSlot'
import { useBookingStore, useCommandBlock } from './draft'
import { scrollToEventRow } from './scrollToEventRow'

export function CreditNoteButton({ procedureId, actor }: { procedureId: string; actor: Actor }) {
  const viewer = { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }
  const state = useBookingStore((s) => s)
  const option = creditOptionFor(state, viewer, procedureId)
  const blocked = useCommandBlock()
  const Sheet = useCreditSheet()
  const [open, setOpen] = useState(false)
  const office = actor.role === 'office'
  const shot = office ? 'procedure-credit-note-button' : 'anaesthetist-credit-note-button'

  if (option.kind === 'hidden') return null
  const reason = blocked ?? (option.kind === 'disabled' ? option.reason : null)

  return (
    <>
      <TextAction shot={shot} data-invoice-id={option.invoiceId} onClick={() => setOpen(true)} disabled={reason !== null} disabledReason={reason}>
        {CREDIT_LABELS.creditNote}
      </TextAction>
      {open && (
        <Sheet
          open
          invoiceId={option.invoiceId}
          procedureId={procedureId}
          {...(option.kind === 'enabled' ? { invoiceIds: option.invoiceIds } : {})}
          actor={actor}
          mode="credit"
          onClose={() => setOpen(false)}
          onDone={(id) => scrollToEventRow(id, 'procedure-credit-event')}
        />
      )}
    </>
  )
}
