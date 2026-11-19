/**
 * The one standard review step (catch-up Phase 38b; D13, US-08.6.3 "Review
 * step"): the office approves an event for the next billing run, or declines
 * it with a reason (shown to whoever raised it). Office only, whoever raised
 * it. Approval raises nothing: the next billing run does. A right-docked side
 * panel, as the Admin record panels are.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { neutral, radius } from '../../../theme/tokens'
import { eventStatus } from '../../../domain/billing/procedureEvent'
import { priceFreeFormInvoice } from '../../../domain/billing/additionalInvoice'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { approveProcedureEvent, declineProcedureEvent, eventPartyName, originalForEvent, useAppStore, type Actor } from '../../../store'
import { Button, DefList, DefRow, FormError, Pill, ResultLine, TextArea } from '../../../shared/ui'
import { formatCurrency, shortDay, stampText } from '../../../shared/format'
import { ADDITIONAL_INVOICE_COPY as COPY, EVENT_KIND_LABEL, EVENT_LABELS, EVENT_STATUS_LABEL, raisedByText } from '../../../shared/procedureEventCopy'
import { EVENT_STATUS_TONE } from '../../../shared/booking/ProcedureEventsList'
import { FreeFormTotals } from '../../../shared/booking/AdditionalInvoiceForm'
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
  const original = originalForEvent(state, event)
  const priced = priceFreeFormInvoice(event.detail.lines)
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
          <Pill size="sm" tone={EVENT_STATUS_TONE[status]}>{EVENT_STATUS_LABEL[status]}</Pill>
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
        <DefRow labelTone="slate" label={COPY.dateLabel}><span className="mono">{shortDay(event.occurredOnISO)}</span></DefRow>
        <DefRow labelTone="slate" label={COPY.partyLabel}>
          <span>{event.party.sameAs ? `${EVENT_LABELS.sameAsOriginal} (${partyName})` : partyName}</span>
        </DefRow>
      </DefList>

      <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, overflow: 'hidden' }}>
        {(priced.kind === 'priced' ? priced.lines : event.detail.lines.map((l) => ({ ...l, amount: 0 }))).map((l, i) => (
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

      {awaiting && !declining && <span style={{ fontSize: 13, color: neutral.slate }}>{EVENT_LABELS.approveNote}</span>}
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
