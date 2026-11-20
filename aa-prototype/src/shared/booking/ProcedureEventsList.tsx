/**
 * A Procedure's events (catch-up Phase 38b; US-03.7.3, FT-03.7): one list
 * under each Procedure on the Booking detail, in all three apps.
 *
 * - Everyone sees each event's kind, date, description and status.
 * - The anaesthetist, on their own Procedure (`procedureOwner`), also sees its
 *   total ex GST and party (`EVENT_RULES.anaesthetistSees`), a declined
 *   reason, and Edit and Remove on what they raised while it awaits review or
 *   was declined. No review action, no invoice link, no Booking total. The
 *   section shows only when the Procedure has an event (39b changes that).
 * - The office always sees the section (with its empty line), the totals and
 *   party, Review while awaiting review, Edit and Remove, and the invoice
 *   number linking to the invoice once invoiced.
 * - A credit (catch-up Phase 39) is a row of its own (`procedure-credit-event`):
 *   "Credit", its date, "Credits AA-2026-0007 in full" and the reason, the
 *   credited invoice's total, "Issued" once the run issued it, and in Admin the
 *   credit note's link. Edit opens the credit sheet; its replacements read
 *   "Rebill of AA-2026-0007" and are removed only with their credit.
 *
 * Every word from `procedureEventCopy.ts`. PWA-safe.
 */

import { useMemo, useState } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { creditDetailOf, eventLines, eventStatus, mayEditEvent, type ProcedureEventStatus } from '../../domain/billing/procedureEvent'
import { freeFormSubtotal } from '../../domain/billing/additionalInvoice'
import { eventPartyName, eventsForProcedure, procedureOwner, raiseRefusal, removeProcedureEvent, useAppStore, type Actor } from '../../store'
import { Button, Eyebrow, FormError, InlineConfirm, Pill, TextAction, type PillTone } from '../ui'
import { shortDay } from '../format'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, PRE_POST_OP_COPY, eventStatusLabel, kindRowText, raisedByText } from '../procedureEventCopy'
import { AdditionalInvoiceSheet } from './AdditionalInvoiceForm'
import { AddBillingEventSheet, AddPrePostOpEventSheet } from './EventSheets'
import { useCreditSheet } from './CreditSheetSlot'
import { useSurface } from '../surface'
import { useBookingStore, useCommandBlock } from './draft'

/** Each status's pill tone (semantic tints only): the list and the review sheet read this one map. */
export const EVENT_STATUS_TONE: Record<ProcedureEventStatus, PillTone> = {
  notBillable: 'neutral',
  awaitingReview: 'warning',
  approved: 'neutral',
  invoiced: 'success',
  declined: 'neutral',
}

export interface ProcedureEventsListProps {
  procedureId: string
  actor: Actor
  /** Admin: open the review sheet for an event awaiting review. */
  onReview?: (eventId: string) => void
  /** Admin: open an invoice. */
  onOpenInvoice?: (invoiceId: string) => void
  /** Admin: open a credit note (catch-up Phase 39). */
  onOpenCreditNote?: (creditNoteId: string) => void
}

export function ProcedureEventsList({ procedureId, actor, onReview, onOpenInvoice, onOpenCreditNote }: ProcedureEventsListProps) {
  const state = useBookingStore((s) => s)
  const all = state.schedule.procedureEvents
  const events = useMemo(() => eventsForProcedure({ schedule: { procedureEvents: all } }, procedureId), [all, procedureId])
  const blocked = useCommandBlock()
  // Thumb-sized actions on the phone (convention 16).
  const actionSize = useSurface().variant === 'mobile' ? 'lg' : 'sm'
  const [editing, setEditing] = useState<string | null>(null)
  const [editingCredit, setEditingCredit] = useState<{ eventId: string; invoiceId: string } | null>(null)
  const CreditSheet = useCreditSheet()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [adding, setAdding] = useState<'prePostOp' | 'billing' | null>(null)
  const [editingKind, setEditingKind] = useState<{ eventId: string; sheet: 'prePostOp' | 'billing' } | null>(null)

  const isOffice = actor.role === 'office'
  const owner = procedureOwner(state, procedureId)
  const ownProcedure = actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined && actor.anaesthetistId === owner
  // Catch-up Phase 39b: the owner and the office add pre-op, post-op and billing events on any List state the guard allows.
  const procedure = state.schedule.procedures[procedureId]
  const booking = procedure !== undefined ? state.schedule.bookings[procedure.bookingId] : undefined
  const assigned = booking !== undefined && state.schedule.lists[booking.listId]?.anaesthetistId !== undefined
  const canAdd = assigned && raiseRefusal(state, { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }, procedureId, 'postOp') === null
  // The anaesthetist apps leave a Procedure that is not theirs, with no events, as it always was.
  if (!isOffice && events.length === 0 && !canAdd) return null
  const showMoney = isOffice || ownProcedure


  function remove(eventId: string) {
    const out = removeProcedureEvent(useAppStore, actor, eventId)
    setConfirming(null)
    setError(out.ok ? null : out.message)
  }

  return (
    <section
      data-shot="procedure-events"
      data-procedure-id={procedureId}
      aria-label={EVENT_LABELS.section}
      style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <Eyebrow tone="slate">{EVENT_LABELS.section}</Eyebrow>
      {events.length === 0 && <span style={{ fontSize: 13, color: neutral.slate }}>{EVENT_LABELS.empty}</span>}
      {events.map((e, i) => {
        const status = eventStatus(e)
        const lines = eventLines(e)
        // A credit (catch-up Phase 39) credits its original in full: the row shows that invoice and its total, never $0.
        const credit = creditDetailOf(e)
        const credited = credit !== undefined ? state.billing.invoices[credit.originalInvoiceId] : undefined
        const creditNote = credit?.creditNoteId !== undefined ? state.billing.creditNotes[credit.creditNoteId] : undefined
        // A replacement reads as part of its correction: "Rebill of AA-2026-0007".
        const rebillOf = e.replaces !== undefined ? state.billing.invoices[e.replaces.originalInvoiceId] : undefined
        // Catch-up Phase 39b: a pre-op, post-op or billing event reads its type or description and what was recorded.
        const kindRow = kindRowText(state, e)
        const first =
          kindRow !== undefined
            ? kindRow.first
            : credit !== undefined
              ? `${credited !== undefined ? CREDIT_LABELS.creditsInFull(credited.invoiceNumber) : ''}${credit.reason !== '' ? ` · ${credit.reason}` : ''}`
              : (lines[0]?.description ?? '')
        const amount = kindRow !== undefined ? kindRow.amount : credit !== undefined ? (credited?.subtotal ?? 0) : freeFormSubtotal(lines)
        const editable = mayEditEvent(e, { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }, owner)
        // A replacement is removed only with its credit.
        const removable = editable && e.replaces === undefined
        const invoice = e.invoiceId !== undefined ? state.billing.invoices[e.invoiceId] : undefined
        const party = showMoney ? eventPartyName(state, e) : undefined
        return (
          <div
            key={e.id}
            data-shot={credit !== undefined ? 'procedure-credit-event' : 'procedure-event-row'}
            data-event-id={e.id}
            data-status={status}
            data-kind={e.kind}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: i === 0 ? 0 : 10, borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}` }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{EVENT_KIND_LABEL[e.kind]}</span>
              <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>
                {shortDay(e.occurredOnISO)}
                {e.startTime !== undefined ? ` ${e.startTime}` : ''}
              </span>
              {showMoney && amount !== undefined && (
                <span className="mono" data-shot="procedure-event-total" style={{ marginLeft: 'auto', fontSize: 14, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {PRE_POST_OP_COPY.amount(amount)} <span style={{ fontSize: 12, color: neutral.slate }}>{EVENT_LABELS.exGst}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: neutral.ink }}>
              {rebillOf !== undefined && <span data-shot="procedure-event-rebill-of" style={{ color: neutral.slate }}>{CREDIT_LABELS.rebillOf(rebillOf.invoiceNumber)} · </span>}
              {first}
              {kindRow !== undefined && (
                <span className="mono" data-shot="procedure-event-recorded" style={{ color: neutral.slate }}>
                  {' · '}
                  {kindRow.recorded}
                </span>
              )}
              {credit === undefined && lines.length > 1 && <span style={{ color: neutral.slate }}> {EVENT_LABELS.moreLines(lines.length - 1)}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Pill size="sm" tone={EVENT_STATUS_TONE[status]} shot="procedure-event-status">{eventStatusLabel(e.kind, status)}</Pill>
              {creditNote !== undefined && isOffice && onOpenCreditNote !== undefined ? (
                <TextAction size="sm" flush onClick={() => onOpenCreditNote(creditNote.id)} shot="procedure-event-credit-note">
                  <span className="mono">{creditNote.creditNoteNumber}</span>
                </TextAction>
              ) : creditNote !== undefined && isOffice ? (
                <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{creditNote.creditNoteNumber}</span>
              ) : invoice !== undefined && isOffice && onOpenInvoice !== undefined ? (
                <TextAction size="sm" flush onClick={() => onOpenInvoice(invoice.id)} shot="procedure-event-invoice">
                  <span className="mono">{invoice.invoiceNumber}</span>
                </TextAction>
              ) : invoice !== undefined && isOffice ? (
                <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{invoice.invoiceNumber}</span>
              ) : null}
              <span style={{ fontSize: 12.5, color: neutral.slate }}>{raisedByText(e.addedBy, actor)}{party !== undefined ? ` · ${party}` : ''}</span>
            </div>
            {status === 'declined' && e.review.reason !== undefined && (showMoney || e.addedBy.anaesthetistId === actor.anaesthetistId) && (
              <span data-shot="procedure-event-declined" style={{ fontSize: 13, color: neutral.ink }}>{EVENT_LABELS.declinedReason(e.review.reason)}</span>
            )}
            {(editable || (isOffice && status === 'awaitingReview' && onReview !== undefined)) && confirming !== e.id && (
              <div style={{ display: 'flex', gap: 16 }}>
                {isOffice && status === 'awaitingReview' && onReview !== undefined && (
                  <TextAction size="sm" onClick={() => onReview(e.id)} shot="procedure-event-review" disabled={blocked !== null} disabledReason={blocked}>
                    {EVENT_LABELS.review}
                  </TextAction>
                )}
                {editable && (
                  <>
                    <TextAction
                      size={actionSize}
                      onClick={() =>
                        credit !== undefined
                          ? setEditingCredit({ eventId: e.id, invoiceId: credit.originalInvoiceId })
                          : kindRow !== undefined
                            ? setEditingKind({ eventId: e.id, sheet: e.kind === 'billing' ? 'billing' : 'prePostOp' })
                            : setEditing(e.id)
                      }
                      shot="procedure-event-edit"
                      disabled={blocked !== null}
                    >
                      {EVENT_LABELS.edit}
                    </TextAction>
                    {removable && (
                      <TextAction size={actionSize} onClick={() => setConfirming(e.id)} shot="procedure-event-remove" disabled={blocked !== null}>
                        {EVENT_LABELS.remove}
                      </TextAction>
                    )}
                  </>
                )}
              </div>
            )}
            {confirming === e.id && (
              <InlineConfirm
                label={EVENT_LABELS.remove}
                message={EVENT_LABELS.removeConfirm}
                confirmLabel={EVENT_LABELS.remove}
                onConfirm={() => remove(e.id)}
                cancelLabel={ADDITIONAL_INVOICE_COPY.keepIt}
                onCancel={() => setConfirming(null)}
                shot="procedure-event-remove-confirm"
              />
            )}
          </div>
        )
      })}
      <FormError message={error} />
      {canAdd && (
        <div data-shot="procedure-event-add" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: events.length > 0 ? 4 : 0 }}>
          <Button variant="secondary" size={actionSize === 'lg' ? 'touch' : 'compact'} onClick={() => setAdding('prePostOp')} disabled={blocked !== null} shot="add-pre-post-op-event">
            {PRE_POST_OP_COPY.addPrePostOp}
          </Button>
          <Button variant="secondary" size={actionSize === 'lg' ? 'touch' : 'compact'} onClick={() => setAdding('billing')} disabled={blocked !== null} shot="add-billing-event">
            {PRE_POST_OP_COPY.addBilling}
          </Button>
        </div>
      )}
      <AddPrePostOpEventSheet
        open={adding === 'prePostOp' || editingKind?.sheet === 'prePostOp'}
        procedureId={procedureId}
        actor={actor}
        {...(editingKind?.sheet === 'prePostOp' ? { eventId: editingKind.eventId } : {})}
        onClose={() => {
          setAdding(null)
          setEditingKind(null)
        }}
      />
      <AddBillingEventSheet
        open={adding === 'billing' || editingKind?.sheet === 'billing'}
        procedureId={procedureId}
        actor={actor}
        {...(editingKind?.sheet === 'billing' ? { eventId: editingKind.eventId } : {})}
        onClose={() => {
          setAdding(null)
          setEditingKind(null)
        }}
      />
      <AdditionalInvoiceSheet
        open={editing !== null}
        procedureId={procedureId}
        actor={actor}
        {...(editing !== null ? { eventId: editing } : {})}
        onClose={() => setEditing(null)}
      />
      {editingCredit !== null && (
        <CreditSheet open invoiceId={editingCredit.invoiceId} procedureId={procedureId} actor={actor} editing={editingCredit.eventId} onClose={() => setEditingCredit(null)} />
      )}
    </section>
  )
}
