/**
 * Catalogue examples for events on a Procedure (catch-up Phase 38b), over the
 * demo store's seeded event EV0001 (Dr Souter's additional invoice on David
 * Chen's HP03, awaiting review).
 */

import { useState } from 'react'
import { OFFICE_ACTOR, SOUTER_ACTOR } from '../../../store'
import { Button } from '../../../shared/ui'
import { ProcedureEventsList } from '../../../shared/booking/ProcedureEventsList'
import { AdditionalInvoiceSheet } from '../../../shared/booking/AdditionalInvoiceForm'
import { AdditionalInvoiceButton } from '../../../shared/booking/AdditionalInvoiceButton'
import { EventReviewSheet } from '../../admin/flows/EventReviewSheet'
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
