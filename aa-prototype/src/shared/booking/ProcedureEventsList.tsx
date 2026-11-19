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
 *
 * Every word from `procedureEventCopy.ts`. PWA-safe.
 */

import { useMemo, useState } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { eventStatus, mayEditEvent, type ProcedureEventStatus } from '../../domain/billing/procedureEvent'
import { freeFormSubtotal } from '../../domain/billing/additionalInvoice'
import { eventPartyName, eventsForProcedure, procedureOwner, removeProcedureEvent, useAppStore, type Actor } from '../../store'
import { Eyebrow, FormError, InlineConfirm, Pill, TextAction, type PillTone } from '../ui'
import { formatCurrency, shortDay } from '../format'
import { ADDITIONAL_INVOICE_COPY, EVENT_KIND_LABEL, EVENT_LABELS, EVENT_STATUS_LABEL, raisedByText } from '../procedureEventCopy'
import { AdditionalInvoiceSheet } from './AdditionalInvoiceForm'
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
}

export function ProcedureEventsList({ procedureId, actor, onReview, onOpenInvoice }: ProcedureEventsListProps) {
  const state = useBookingStore((s) => s)
  const all = state.schedule.procedureEvents
  const events = useMemo(() => eventsForProcedure({ schedule: { procedureEvents: all } }, procedureId), [all, procedureId])
  const blocked = useCommandBlock()
  // Thumb-sized actions on the phone (convention 16).
  const actionSize = useSurface().variant === 'mobile' ? 'lg' : 'sm'
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOffice = actor.role === 'office'
  const owner = procedureOwner(state, procedureId)
  const ownProcedure = actor.role === 'anaesthetist' && actor.anaesthetistId !== undefined && actor.anaesthetistId === owner
  // The anaesthetist apps leave a Procedure with no events as it always was.
  if (!isOffice && events.length === 0) return null
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
        const lines = e.detail.lines
        const first = lines[0]?.description ?? ''
        const editable = mayEditEvent(e, { role: actor.role, ...(actor.anaesthetistId !== undefined ? { anaesthetistId: actor.anaesthetistId } : {}) }, owner)
        const invoice = e.invoiceId !== undefined ? state.billing.invoices[e.invoiceId] : undefined
        const party = showMoney ? eventPartyName(state, e) : undefined
        return (
          <div
            key={e.id}
            data-shot="procedure-event-row"
            data-event-id={e.id}
            data-status={status}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: i === 0 ? 0 : 10, borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}` }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{EVENT_KIND_LABEL[e.kind]}</span>
              <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{shortDay(e.occurredOnISO)}</span>
              {showMoney && (
                <span className="mono" data-shot="procedure-event-total" style={{ marginLeft: 'auto', fontSize: 14, color: neutral.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(freeFormSubtotal(lines))} <span style={{ fontSize: 12, color: neutral.slate }}>{EVENT_LABELS.exGst}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: 13.5, color: neutral.ink }}>
              {first}
              {lines.length > 1 && <span style={{ color: neutral.slate }}> {EVENT_LABELS.moreLines(lines.length - 1)}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Pill size="sm" tone={EVENT_STATUS_TONE[status]} shot="procedure-event-status">{EVENT_STATUS_LABEL[status]}</Pill>
              {invoice !== undefined && isOffice && onOpenInvoice !== undefined ? (
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
                    <TextAction size={actionSize} onClick={() => setEditing(e.id)} shot="procedure-event-edit" disabled={blocked !== null}>
                      {EVENT_LABELS.edit}
                    </TextAction>
                    <TextAction size={actionSize} onClick={() => setConfirming(e.id)} shot="procedure-event-remove" disabled={blocked !== null}>
                      {EVENT_LABELS.remove}
                    </TextAction>
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
      <AdditionalInvoiceSheet
        open={editing !== null}
        procedureId={procedureId}
        actor={actor}
        {...(editing !== null ? { eventId: editing } : {})}
        onClose={() => setEditing(null)}
      />
    </section>
  )
}
