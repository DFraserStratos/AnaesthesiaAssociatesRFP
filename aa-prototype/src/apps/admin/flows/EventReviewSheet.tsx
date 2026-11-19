/**
 * The one standard review step (catch-up Phase 38b; D13, US-08.6.3 "Review
 * step"): the office approves an event for the next billing run, or declines
 * it with a reason (shown to whoever raised it). Office only, whoever raised
 * it. Approval raises nothing: the next billing run does. A right-docked side
 * panel, as the Admin record panels are.
 *
 * A credit (catch-up Phase 39) is reviewed as one correction: the invoice it
 * credits in full, who the credit note goes to, the reason, the money state
 * and every new invoice with its lines. Approve for billing and Decline act on
 * the whole of it (the store hands a credit to `approveCreditUnit` and
 * `declineCreditUnit`).
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { neutral, radius } from '../../../theme/tokens'
import { creditDetailOf, eventLines, eventStatus } from '../../../domain/billing/procedureEvent'
import type { ProcedureEvent } from '../../../domain/types'
import { priceFreeFormInvoice } from '../../../domain/billing/additionalInvoice'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { approveProcedureEvent, currentReversalPlan, declineProcedureEvent, eventPartyName, invoiceAddresseeName, originalForEvent, procedureOwner, replacementEventsOf, useAppStore, type Actor } from '../../../store'
import { Button, DefList, DefRow, Eyebrow, FormError, Notice, Pill, ResultLine, TextArea } from '../../../shared/ui'
import { drSurname, formatCurrency, shortDay, stampText } from '../../../shared/format'
import { ADDITIONAL_INVOICE_COPY as COPY, CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, EVENT_STATUS_LABEL, eventStatusLabel, raisedByText } from '../../../shared/procedureEventCopy'
import { EVENT_STATUS_TONE } from '../../../shared/booking/ProcedureEventsList'
import { FreeFormTotals } from '../../../shared/booking/AdditionalInvoiceForm'
import { creditMoneySentences } from '../../../shared/booking/CreditForm'
import { SidePanel } from '../components/SidePanel'

interface EventReviewSheetProps {
  eventId: string | null
  actor: Actor
  onClose: () => void
}

export function EventReviewSheet({ eventId, actor, onClose }: EventReviewSheetProps) {
  const state = useAppStore((s) => s)
  const event = eventId !== null ? state.schedule.procedureEvents[eventId] : undefined
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  function close() {
    setDeclining(false)
    setReason('')
    setError(null)
    setResult(null)
    onClose()
  }

  if (event === undefined) return <SidePanel open={false} onClose={close} title="" width="record">{null}</SidePanel>

  const procedure = state.schedule.procedures[event.procedureId]
  const booking = state.schedule.bookings[event.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  const credit = creditDetailOf(event)
  const original = credit !== undefined ? state.billing.invoices[credit.originalInvoiceId] : originalForEvent(state, event)
  const priced = priceFreeFormInvoice(eventLines(event))
  const partyName = eventPartyName(state, event) ?? 'Not resolved'
  const status = eventStatus(event)
  const awaiting = status === 'awaitingReview'

  function approve() {
    const out = approveProcedureEvent(useAppStore, actor, event!.id)
    if (!out.ok) return setError(out.message)
    setError(null)
    setResult(EVENT_LABELS.approvedResult)
  }

  function decline() {
    const out = declineProcedureEvent(useAppStore, actor, event!.id, reason)
    if (!out.ok) return setError(out.message)
    setError(null)
    setDeclining(false)
    setResult(EVENT_STATUS_LABEL.declined)
  }

  const footer = awaiting ? (
    declining ? (
      <>
        <Button variant="secondary" onClick={() => setDeclining(false)}>{COPY.keepIt}</Button>
        <Button variant="primary" onClick={decline} shot="event-review-decline-confirm">{EVENT_LABELS.decline}</Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setDeclining(true)} shot="event-review-decline">{EVENT_LABELS.decline}</Button>
        <Button variant="primary" onClick={approve} shot="event-review-approve">{EVENT_LABELS.approve}</Button>
      </>
    )
  ) : (
    <Button variant="secondary" onClick={close}>Close</Button>
  )

  return (
    <SidePanel
      open={eventId !== null}
      onClose={close}
      title={`${EVENT_KIND_LABEL[event.kind]} · ${patient?.name ?? 'Patient'}`}
      meta={
        <>
          <Pill size="sm" tone={EVENT_STATUS_TONE[status]}>{eventStatusLabel(event.kind, status)}</Pill>
          <span>{raisedByText(event.addedBy)} · <span className="mono">{stampText(event.addedAtISO)}</span></span>
        </>
      }
      width="record"
      footer={footer}
      footerLayout="end"
      shot="event-review-sheet"
      panelAttrs={{ 'data-event-id': event.id }}
    >
      <DefList gap={10}>
        <DefRow labelTone="slate" label="Procedure">
          {procedure !== undefined && list !== undefined ? (
            <Link to={`/admin/day/${list.dateISO}/bookings/${event.bookingId}`} style={{ color: 'inherit' }}>
              {procedureLabel(procedure, state.masters.rvgGroups, 1)} · <span className="mono">{shortDay(list.dateISO)}</span>
            </Link>
          ) : (
            event.procedureId
          )}
        </DefRow>
        <DefRow labelTone="slate" label="Original invoice">
          {original !== undefined ? (
            <Link to={`/admin/invoices/${original.id}`} className="mono" style={{ color: 'inherit' }}>{original.invoiceNumber}</Link>
          ) : (
            'None'
          )}
        </DefRow>
        {credit === undefined && <DefRow labelTone="slate" label={COPY.dateLabel}><span className="mono">{shortDay(event.occurredOnISO)}</span></DefRow>}
        <DefRow labelTone="slate" label={credit !== undefined ? CREDIT_LABELS.creditTo : COPY.partyLabel}>
          <span>{event.party.sameAs ? `${EVENT_LABELS.sameAsOriginal} (${partyName})` : partyName}</span>
        </DefRow>
        {credit !== undefined && (
          <>
            <DefRow labelTone="slate" label={CREDIT_LABELS.reason}>{credit.reason}</DefRow>
            <DefRow labelTone="slate" label={CREDIT_LABELS.total}>
              <span className="mono">{original !== undefined ? formatCurrency(original.total) : ''}</span>
            </DefRow>
          </>
        )}
      </DefList>

      {credit !== undefined && <CreditReviewBody event={event} />}

      {credit === undefined && (
      <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, overflow: 'hidden' }}>
        {(priced.kind === 'priced' ? priced.lines : eventLines(event).map((l) => ({ ...l, amount: 0 }))).map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13.5 }}>
            <span style={{ flex: 1, color: neutral.ink }}>{l.description}</span>
            <span className="mono" style={{ color: neutral.slate }}>{l.quantity} x {formatCurrency(l.unitAmount)}</span>
            <span className="mono" style={{ minWidth: 80, textAlign: 'right', color: neutral.ink }}>{formatCurrency(l.amount)}</span>
          </div>
        ))}
        {priced.kind === 'priced' && (
          <div style={{ background: neutral.bg, padding: '10px 12px' }}>
            <FreeFormTotals subtotal={priced.subtotal} gst={priced.gst} total={priced.total} />
          </div>
        )}
      </div>
      )}

      {awaiting && !declining && <span style={{ fontSize: 13, color: neutral.slate }}>{credit !== undefined ? CREDIT_LABELS.officeSubmitNote : EVENT_LABELS.approveNote}</span>}
      {declining && (
        <TextArea label={EVENT_LABELS.declineReasonLabel} value={reason} onChange={setReason} rows={3} shot="event-review-reason" />
      )}
      {status === 'declined' && event.review.reason !== undefined && (
        <span style={{ fontSize: 13, color: neutral.ink }}>{EVENT_LABELS.declinedReason(event.review.reason)}</span>
      )}
      <ResultLine line={result} />
      <FormError message={error} />
    </SidePanel>
  )
}

/** A credit's money state and its new invoices, each with its party and lines (catch-up Phase 39). */
function CreditReviewBody({ event }: { event: ProcedureEvent }) {
  const state = useAppStore((s) => s)
  const credit = creditDetailOf(event)!
  const original = state.billing.invoices[credit.originalInvoiceId]
  const plan = currentReversalPlan(state, credit.originalInvoiceId)
  const ownerId = procedureOwner(state, event.procedureId)
  const doctor = ownerId !== undefined && state.masters.anaesthetists[ownerId] !== undefined ? drSurname(state.masters.anaesthetists[ownerId]!.name) : 'The anaesthetist'
  const replacements = replacementEventsOf(state, event.id)
  return (
    <div data-shot="event-review-credit" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {plan !== undefined && original !== undefined && eventStatus(event) === 'awaitingReview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Eyebrow as="span" tone="slate">{CREDIT_LABELS.moneyState}</Eyebrow>
          {creditMoneySentences(plan, invoiceAddresseeName(state, original), doctor).map((line) => (
            <span key={line} style={{ fontSize: 13.5, lineHeight: '20px', color: neutral.ink }}>{line}</span>
          ))}
        </div>
      )}
      <Notice tone="neutral">{CREDIT_LABELS.notARefund}</Notice>
      <Eyebrow as="h3" tone="slate">{CREDIT_LABELS.stepNewInvoices}</Eyebrow>
      {replacements.length === 0 && <span style={{ fontSize: 13, color: neutral.slate }}>{CREDIT_LABELS.newInvoicesNone}</span>}
      {replacements.map((r, i) => {
        const priced = priceFreeFormInvoice(eventLines(r))
        const party = eventPartyName(state, r) ?? ''
        return (
          <div key={r.id} data-shot="event-review-replacement" style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', fontSize: 13.5, fontWeight: 600, color: neutral.ink }}>
              <span>{CREDIT_LABELS.newInvoiceTitle(i + 1)}</span>
              <span style={{ fontWeight: 400, color: neutral.slate }}>{r.party.sameAs ? `${EVENT_LABELS.sameAsOriginal} (${party})` : party}</span>
            </div>
            {eventLines(r).map((l, j) => (
              <div key={j} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderTop: `1px solid ${neutral.line}`, fontSize: 13.5 }}>
                <span style={{ flex: 1, color: neutral.ink }}>{l.description}</span>
                <span className="mono" style={{ color: neutral.slate }}>{l.quantity} x {formatCurrency(l.unitAmount)}</span>
                <span className="mono" style={{ minWidth: 80, textAlign: 'right', color: neutral.ink }}>{formatCurrency(Math.round(l.quantity * l.unitAmount * 100) / 100)}</span>
              </div>
            ))}
            {priced.kind === 'priced' && (
              <div style={{ background: neutral.bg, padding: '10px 12px' }}>
                <FreeFormTotals subtotal={priced.subtotal} gst={priced.gst} total={priced.total} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
