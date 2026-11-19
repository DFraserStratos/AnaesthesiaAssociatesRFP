/**
 * Catalogue examples for events on a Procedure (catch-up Phase 38b), over the
 * demo store's seeded event EV0001 (Dr Souter's additional invoice on David
 * Chen's HP03, awaiting review).
 */

import { useState } from 'react'
import { approveCreditUnit, creditNoteForInvoice, OFFICE_ACTOR, SOUTER_ACTOR, submitCredit, useAppStore } from '../../../store'
import { runNextBillingRun } from '../../../store/eventDemo'
import { Button, OptionChip } from '../../../shared/ui'
import { ProcedureEventsList } from '../../../shared/booking/ProcedureEventsList'
import { AdditionalInvoiceSheet } from '../../../shared/booking/AdditionalInvoiceForm'
import { AdditionalInvoiceButton } from '../../../shared/booking/AdditionalInvoiceButton'
import { CreditNoteButton } from '../../../shared/booking/CreditNoteButton'
import type { CreditFormMode } from '../../../shared/booking/CreditForm'
import { CREDIT_LABELS } from '../../../shared/procedureEventCopy'
import { EventReviewSheet } from '../../admin/flows/EventReviewSheet'
import { CreditSheet } from '../../admin/flows/CreditSheet'
import { CreditedBanner, CreditNoteDocument } from '../../admin/screens/InvoiceDocument'
import { SEED_EVENT_ID, SEED_EVENT_PROCEDURE_ID } from '../../../domain/seed/procedureEvents'

export function ProcedureEventsListExample({ as }: { as: 'office' | 'anaesthetist' }) {
  return <ProcedureEventsList procedureId={SEED_EVENT_PROCEDURE_ID} actor={as === 'office' ? OFFICE_ACTOR : SOUTER_ACTOR} onReview={() => undefined} />
}

export function AdditionalInvoiceSheetExample({ as = 'office' }: { as?: 'office' | 'anaesthetist' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open the form</Button>
      <AdditionalInvoiceSheet open={open} procedureId={SEED_EVENT_PROCEDURE_ID} actor={as === 'office' ? OFFICE_ACTOR : SOUTER_ACTOR} onClose={() => setOpen(false)} />
    </>
  )
}

/** The button as the office sees it on David Chen's invoiced HP03. */
export function AdditionalInvoiceButtonExample() {
  return <AdditionalInvoiceButton procedureId={SEED_EVENT_PROCEDURE_ID} actor={OFFICE_ACTOR} />
}

export function EventReviewSheetExample() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(SEED_EVENT_ID)}>Open the review sheet</Button>
      <EventReviewSheet eventId={open} actor={OFFICE_ACTOR} onClose={() => setOpen(null)} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Credit notes (catch-up Phase 39), on the seeded history invoice of David
// Chen's HP03 (AA-2026-H03, unpaid, in Xero).
// ---------------------------------------------------------------------------

const SEED_CREDIT_INVOICE_ID = 'HINV03'

/** The office's side sheet, opened as Credit note (no new invoices) or Credit in full and rebill (one, to the original's party). */
export function CreditSheetExample() {
  const [mode, setMode] = useState<CreditFormMode | null>(null)
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="secondary" size="compact" onClick={() => setMode('credit')}>{CREDIT_LABELS.creditNote}</Button>
      <Button variant="secondary" size="compact" onClick={() => setMode('rebill')}>{CREDIT_LABELS.creditRebill}</Button>
      <CreditSheet open={mode !== null} invoiceId={SEED_CREDIT_INVOICE_ID} actor={OFFICE_ACTOR} mode={mode ?? 'credit'} onClose={() => setMode(null)} />
    </div>
  )
}

/** The Procedure's Credit note option, as the office sees it on David Chen's invoiced HP03. */
export function CreditNoteButtonExample() {
  return <CreditNoteButton procedureId={SEED_EVENT_PROCEDURE_ID} actor={OFFICE_ACTOR} />
}

/**
 * The credit note document and the credited original's banner: "Issue a
 * credit" submits a credit of AA-2026-H03 with one new invoice, approves it
 * and runs the next billing run in the demo store.
 */
export function CreditNoteDocumentExample() {
  const creditNote = useAppStore((s) => creditNoteForInvoice(s, SEED_CREDIT_INVOICE_ID))
  const invoices = useAppStore((s) => s.billing.invoices)
  const [error, setError] = useState<string | null>(null)
  function issue() {
    const submitted = submitCredit(useAppStore, OFFICE_ACTOR, {
      invoiceId: SEED_CREDIT_INVOICE_ID,
      reason: 'Wrong amount',
      cause: 'correction',
      replacements: [{ occurredOnISO: useAppStore.getState().clock.todayISO, party: { sameAs: true }, lines: [{ description: 'Hip hemiarthroplasty, corrected fee', quantity: 1, unitAmount: 400 }] }],
    })
    if (!submitted.ok) return setError(submitted.message)
    const approved = approveCreditUnit(useAppStore, OFFICE_ACTOR, submitted.value.creditEventId)
    if (!approved.ok) return setError(approved.message)
    const run = runNextBillingRun(useAppStore)
    setError(run.ok ? null : run.message)
  }
  if (creditNote === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
        <Button variant="secondary" size="compact" onClick={issue}>Issue a credit of AA-2026-H03</Button>
        {error !== null && <span style={{ fontSize: 13 }}>{error}</span>}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CreditedBanner creditNote={creditNote} replacements={creditNote.replacementInvoiceIds.flatMap((id) => (invoices[id] !== undefined ? [invoices[id]!] : []))} />
      <div style={{ zoom: 0.5 }}>
        <div style={{ width: 1180 }}>
          <CreditNoteDocument creditNoteId={creditNote.id} />
        </div>
      </div>
    </div>
  )
}

/** The quick option chips over the credit's reason. */
export function OptionChipExample() {
  const [picked, setPicked] = useState<string>('Wrong amount')
  return (
    <div role="group" aria-label="Common reasons" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {CREDIT_LABELS.officeReasons.map((r) => (
        <OptionChip key={r} pressed={picked === r} onClick={() => setPicked(r)}>
          {r}
        </OptionChip>
      ))}
    </div>
  )
}
