/**
 * The office's credit sheet (catch-up Phase 39, work items 7, 9 and 10;
 * US-08.6.5, US-08.6.2, US-08.6.4, US-08.6.6): the shared `CreditForm` in
 * Admin's right-docked side sheet, as the review sheet beside it. Opened by
 * Credit note (no new invoices yet), Credit in full and rebill (one new
 * invoice holding a copy of the original's lines), Split into additional
 * invoices (`SplitCombinedSheet`: two blank components that must add up to the
 * credited invoice), from the invoice rail and the Procedure's button slot,
 * and by Edit on a pending or declined credit. The title sits in the sheet's
 * header and Save for review in its footer; a split keeps its running figures
 * (Left to allocate) on the footer's one row beside it, in view while the
 * components are typed.
 *
 * Admin provides it to the shared controls through `CreditSheetSlot`.
 */

import { CreditForm, type CreditFormFrameParts } from '../../../shared/booking/CreditForm'
import type { CreditSheetProps } from '../../../shared/booking/CreditSheetSlot'
import { SidePanel } from '../components/SidePanel'

export function CreditSheet({ open, invoiceId, actor, procedureId, invoiceIds, mode = 'credit', editing, onClose, onDone }: CreditSheetProps) {
  if (!open) return null
  const frame = ({ title, description, body, actions, summary }: CreditFormFrameParts) => (
    <SidePanel
      open
      onClose={onClose}
      title={title}
      meta={<span>{description}</span>}
      width="record"
      footer={
        summary !== undefined ? (
          // The running figures on one row, Left to allocate at its right end over Save, at the body's 24px inset.
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {summary}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: 260 }}>{actions}</div>
            </div>
          </div>
        ) : (
          <div style={{ minWidth: 220 }}>{actions}</div>
        )
      }
      footerLayout="end"
      // A split, new or edited, is the split sheet; its form says so by handing over its running figures.
      shot={summary !== undefined ? 'split-combined-sheet' : 'credit-sheet'}
      panelAttrs={{ 'data-invoice-id': invoiceId, 'data-mode': editing !== undefined ? 'edit' : mode }}
    >
      {body}
    </SidePanel>
  )
  return (
    <CreditForm
      invoiceId={invoiceId}
      actor={actor}
      {...(procedureId !== undefined ? { procedureId } : {})}
      {...(invoiceIds !== undefined ? { invoiceIds } : {})}
      mode={mode}
      {...(editing !== undefined ? { editing } : {})}
      onClose={onClose}
      {...(onDone !== undefined ? { onDone } : {})}
      frame={frame}
    />
  )
}

/** The combined split (US-08.6.4): the credit sheet in split mode, the office's only. */
export function SplitCombinedSheet(props: Omit<CreditSheetProps, 'mode'>) {
  return <CreditSheet {...props} mode="split" />
}
