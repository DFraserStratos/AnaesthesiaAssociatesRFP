/**
 * The Payments tab's events awaiting approval (US-03.7.2, US-13.3.3): every event on a Procedure
 * waiting for the office's one review step (pre-op, post-op and billing events, additional invoices
 * and credits), oldest raised first, beside the approved events waiting for the billing run. Moved
 * here from the old Review queue's Events tab: approving events is billing work, not List work.
 *
 * A row opens the review sheet (`EventReviewSheet`: Approve for billing, Decline with a reason, the
 * office's price). A credit is one row, "Credit AA-2026-0007 in full, 1 new invoice", its new
 * invoices nested under it and reviewed with it (`reviewRowsAwaiting`). The card shows only while
 * something waits; the sheet stays mounted, so approving the last event still shows its result.
 */

import { Fragment, useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import { eventPartyName, eventPriceNow, procedureOwner, reviewRowsAwaiting, useAppStore, type Actor } from '../../../../store'
import type { AppState } from '../../../../store/appStore'
import { freeFormSubtotal } from '../../../../domain/billing/additionalInvoice'
import { creditDetailOf, eventLines } from '../../../../domain/billing/procedureEvent'
import { procedureLabel } from '../../../../domain/billing/procedureStack'
import { daysBetween } from '../../../../domain/dateDays'
import type { ProcedureEvent } from '../../../../domain/types'
import { CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, PRE_POST_OP_COPY, kindRowText, pricingText, raisedByText } from '../../../../shared/procedureEventCopy'
import { dayMicroCap, drSurname, formatCurrency, plural } from '../../../../shared/format'
import { Card, CountBadge, Pill, TextAction } from '../../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { EventReviewSheet } from '../../flows/EventReviewSheet'

/** The card's title, also the table's name. */
export const EVENTS_AWAITING_APPROVAL_TITLE = 'Events awaiting approval'

/**
 * How many events wait for approval: one per row, a credit and its new invoices counted once. The
 * Payments tab shows no number for them yet (US-13.3.3); this is the count a tab number would read.
 */
export function eventsAwaitingApprovalCount(state: { schedule: Pick<AppState['schedule'], 'procedureEvents'> }): number {
  return reviewRowsAwaiting(state).length
}

/** The count from the store, read from the events slice alone. */
export function useEventsAwaitingApprovalCount(): number {
  const procedureEvents = useAppStore((s) => s.schedule.procedureEvents)
  return useMemo(() => eventsAwaitingApprovalCount({ schedule: { procedureEvents } }), [procedureEvents])
}

export function EventsAwaitingApproval({ actor }: { actor: Actor }) {
  const state = useAppStore((s) => s)
  const rows = reviewRowsAwaiting(state)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      {rows.length > 0 && (
        <Card
          padding="panel"
          title={
            <>
              {EVENTS_AWAITING_APPROVAL_TITLE} <CountBadge count={rows.length} hideAtZero={false} mono srNoun="events" />
            </>
          }
          shot="events-awaiting-approval"
        >
          <TableShell nested testId="admin-events-queue" label={EVENTS_AWAITING_APPROVAL_TITLE} density="dense" minWidth={900}>
            {/* The procedure sits under the patient; patient and description take the spare width. */}
            <thead>
              <tr>
                <Th>Kind</Th>
                <Th nowrap>Anaesthetist</Th>
                <Th nowrap>Patient · Procedure</Th>
                <Th nowrap>Charge date</Th>
                <Th>Description</Th>
                <Th nowrap>Billed to</Th>
                <Th align="right" nowrap>Total ex GST</Th>
                <Th nowrap>Raised by</Th>
                <Th align="right" nowrap>Waiting</Th>
                <Th nowrap />
              </tr>
            </thead>
            <tbody data-shot="admin-events-queue">
              {rows.map(({ event: e, replacements }) => (
                <Fragment key={e.id}>
                  <EventRow state={state} event={e} replacements={replacements.length} onOpen={() => setOpen(e.id)} />
                  {replacements.map((r) => (
                    <NestedReplacementRow key={r.id} event={r} partyName={eventPartyName(state, r) ?? ''} onOpen={() => setOpen(e.id)} />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </TableShell>
        </Card>
      )}
      <EventReviewSheet eventId={open} actor={actor} onClose={() => setOpen(null)} />
    </>
  )
}

/** One event awaiting approval: its kind, whose Procedure, what it charges or credits, and how long it has waited. */
function EventRow({ state, event: e, replacements, onOpen }: { state: AppState; event: ProcedureEvent; replacements: number; onOpen: () => void }) {
  const procedure = state.schedule.procedures[e.procedureId]
  const booking = state.schedule.bookings[e.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  // Whose Procedure it is (`procedureOwner`: the locked payee), as the ownership rule reads it.
  const ownerId = procedureOwner(state, e.procedureId)
  const anaesthetist = ownerId !== undefined ? state.masters.anaesthetists[ownerId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  const partyName = eventPartyName(state, e) ?? ''
  const waiting = Math.max(0, daysBetween(e.addedAtISO.slice(0, 10), state.clock.todayISO))
  const credit = creditDetailOf(e)
  const credited = credit !== undefined ? state.billing.invoices[credit.originalInvoiceId] : undefined
  // A pre-op, post-op or billing event reads its type and the price the office would approve now.
  const kindRow = kindRowText(state, e)
  const now = kindRow !== undefined ? eventPriceNow(state, e) : undefined
  const lines = eventLines(e)
  const description =
    kindRow !== undefined
      ? `${kindRow.first} · ${now?.kind === 'priced' && now.pricing.basis !== 'billingEvent' && now.pricing.basis !== 'typedFixedFee' ? pricingText(now.pricing) : kindRow.recorded}`
      : credit !== undefined
        ? CREDIT_LABELS.reviewRow(credited?.invoiceNumber ?? '', replacements)
        : `${lines[0]?.description ?? ''}${lines.length > 1 ? ` ${EVENT_LABELS.moreLines(lines.length - 1)}` : ''}`
  const amount: number | undefined =
    kindRow !== undefined ? (now?.kind === 'priced' ? now.pricing.amount : undefined) : credit !== undefined ? (credited?.subtotal ?? 0) : freeFormSubtotal(lines)
  return (
    <ClickableRow onOpen={onOpen} data-event-id={e.id} data-kind={e.kind}>
      <Td bold>{EVENT_KIND_LABEL[e.kind]}</Td>
      <Td nowrap>{anaesthetist !== undefined ? drSurname(anaesthetist.name) : ''}</Td>
      <Td>
        <div style={{ fontWeight: 600 }}>{patient?.name ?? ''}</div>
        <div style={{ marginTop: 2, fontSize: 12.5, color: neutral.slate }}>{procedure !== undefined ? procedureLabel(procedure, state.masters.rvgGroups, 1) : ''}</div>
        {list !== undefined && <div className="mono" style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist }}>{dayMicroCap(list.dateISO)}</div>}
      </Td>
      <Td mono nowrap>{dayMicroCap(e.occurredOnISO)}</Td>
      <Td>
        <span data-shot={credit !== undefined ? 'review-credit-row' : undefined}>{description}</span>
        {credit !== undefined && credit.reason !== '' && <div style={{ marginTop: 2, fontSize: 12, color: neutral.slate }}>{credit.reason}</div>}
        {credit !== undefined && e.addedBy.role !== 'office' && <div style={{ marginTop: 2, fontSize: 12, color: neutral.slate }}>{raisedByText(e.addedBy)}</div>}
      </Td>
      <Td>{partyName}</Td>
      <Td mono bold align="right" nowrap>
        {amount !== undefined ? PRE_POST_OP_COPY.amount(amount) : <Pill size="sm" tone="warning" shot="review-needs-price">{PRE_POST_OP_COPY.needsPriceShort}</Pill>}
      </Td>
      <Td nowrap>{e.addedBy.role === 'office' ? 'Office' : drSurname(e.addedBy.who)}</Td>
      <Td mono align="right" nowrap>{plural(waiting, 'day')}</Td>
      <Td align="right" nowrap>
        <TextAction size="sm" flush label={`${EVENT_LABELS.review} the ${EVENT_KIND_LABEL[e.kind].toLowerCase()} for ${patient?.name ?? 'this patient'}`} onClick={onOpen}>
          {EVENT_LABELS.review}
        </TextAction>
      </Td>
    </ClickableRow>
  )
}

/**
 * A credit's new invoice, nested under its credit's row: reviewed only with it, so the row opens the
 * credit's review sheet and has no Review of its own.
 */
function NestedReplacementRow({ event, partyName, onOpen }: { event: ProcedureEvent; partyName: string; onOpen: () => void }) {
  const lines = eventLines(event)
  return (
    <ClickableRow onOpen={onOpen} quiet data-event-id={event.id} data-replaces={event.replaces?.creditEventId}>
      <Td>
        <span data-shot="review-credit-replacement" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: `2px solid ${neutral.line}` }}>
          {CREDIT_LABELS.newInvoice}
        </span>
      </Td>
      <Td />
      <Td />
      <Td mono nowrap>{dayMicroCap(event.occurredOnISO)}</Td>
      <Td>
        {lines[0]?.description ?? ''}
        {lines.length > 1 ? ` ${EVENT_LABELS.moreLines(lines.length - 1)}` : ''}
      </Td>
      <Td>{partyName}</Td>
      <Td mono align="right" nowrap>{formatCurrency(freeFormSubtotal(lines))}</Td>
      <Td />
      <Td />
      <Td />
    </ClickableRow>
  )
}
