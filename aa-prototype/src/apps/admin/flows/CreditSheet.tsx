/**
 * The office's credit sheet (catch-up Phase 39, work item 7; US-08.6.5,
 * US-08.6.2): the shared `CreditForm` in Admin's right-docked side sheet, as
 * the review sheet beside it. Opened by Credit note (no new invoices yet) and
 * Credit in full and rebill (one new invoice to the original's party), from
 * the invoice rail and the Procedure's button slot, and by Edit on a pending
 * or declined credit. The title sits in the sheet's header and Submit for
 * review in its footer; the body is the form.
 *
 * Admin provides it to the shared controls through `CreditSheetSlot`.
 */

import { CreditForm, type CreditFormFrameParts } from '../../../shared/booking/CreditForm'
import type { CreditSheetProps } from '../../../shared/booking/CreditSheetSlot'
import { SidePanel } from '../components/SidePanel'

export function CreditSheet({ open, invoiceId, actor, mode = 'credit', editing, onClose, onDone }: CreditSheetProps) {
  if (!open) return null
  const frame = ({ title, description, body, actions }: CreditFormFrameParts) => (
    <SidePanel
      open
      onClose={onClose}
      title={title}
      meta={<span>{description}</span>}
      width="record"
      footer={<div style={{ minWidth: 220 }}>{actions}</div>}
      footerLayout="end"
      shot="credit-sheet"
      panelAttrs={{ 'data-invoice-id': invoiceId, 'data-mode': editing !== undefined ? 'edit' : mode }}
    >
      {body}
    </SidePanel>
  )
  return (
    <CreditForm
      invoiceId={invoiceId}
      actor={actor}
      mode={mode}
      {...(editing !== undefined ? { editing } : {})}
      variant="office"
      onClose={onClose}
      {...(onDone !== undefined ? { onDone } : {})}
      frame={frame}
    />
  )
}
