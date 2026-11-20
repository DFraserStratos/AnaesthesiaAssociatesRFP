/**
 * A moved prepaid Booking (catch-up Phase 41; US-06.5.4, D38; OQ-120's
 * default, D68): when the List's anaesthetist is no longer the one the
 * prepayment invoice named, the card says the prepayment kept its agreed
 * amount and the invoice is unchanged. The office may, by choice, email the
 * payer that the anaesthetist changed (the `anaesthetistChanged` letter, a
 * provisional default while OQ-120 is open); everyone sees when it went, and
 * nobody else can send it. Nothing here changes the prepayment.
 *
 * The email is a command on the saved Booking, so it acts on the real store
 * at once (never the Admin Booking draft) and waits while the draft is unsaved.
 */

import { useState } from 'react'
import { neutral, semantic } from '../../theme/tokens'
import {
  anaesthetistChangedFor,
  changedPrepaymentInvoicesFor,
  emailPatientAnaesthetistChanged,
  lastPatientNotice,
  PATIENT_NOTICE_MESSAGES,
  previewPrepaymentLetter,
  reminderAddressFor,
  useAppStore,
  type Actor,
} from '../../store'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { DefList, DefRow } from '../ui/DefRow'
import { FormError } from '../ui/Field'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { drSurname } from '../format'
import { useBookingStore, useCommandBlock } from './draft'
import { LetterPreview, LetterRow, useLetterTemplates } from './PrepaymentLetterDialogs'
import { reminderStampText } from './prepaymentText'

export const EMAIL_PATIENT_CHANGED_LABEL = 'Email patient: anaesthetist changed'
/** The one label on the email while OQ-120 is open (D68's default). */
export const PATIENT_EMAIL_PROVISIONAL = 'Provisional (OQ-120)'

export interface PrepaymentMovedCardProps {
  bookingId: string
  actor: Actor
}

export function PrepaymentMovedCard({ bookingId, actor }: PrepaymentMovedCardProps) {
  const changed = useBookingStore((s) => anaesthetistChangedFor(s, bookingId))
  const nowName = useBookingStore((s) => {
    const booking = s.schedule.bookings[bookingId]
    const id = booking !== undefined ? s.schedule.lists[booking.listId]?.anaesthetistId : undefined
    return id !== undefined ? (s.masters.anaesthetists[id]?.name ?? id) : ''
  })
  // Primitive selections, so the card re-renders only when they change.
  const invoiceId = useBookingStore((s) => changedPrepaymentInvoicesFor(s, bookingId)[0]?.id)
  const numbers = useBookingStore((s) =>
    changedPrepaymentInvoicesFor(s, bookingId)
      .map((i) => i.invoiceNumber)
      .join('|'),
  )
  const last = useBookingStore((s) => lastPatientNotice(s, bookingId))
  const [emailing, setEmailing] = useState(false)
  if (!changed || invoiceId === undefined) return null
  const office = actor.role === 'office'

  return (
    <Card shot="prepayment-moved" title={`Prepayment kept at the agreed amount · now with ${drSurname(nowName)}`} data-booking-id={bookingId}>
      {numbers.split('|').map((n) => (
        <div key={n} data-shot="prepayment-moved-invoice" style={{ fontSize: 13, color: neutral.slate }}>
          Invoice <span className="mono">{n}</span> unchanged
        </div>
      ))}
      {last !== undefined && (
        <div data-shot="patient-emailed" style={{ fontSize: 13, color: neutral.slate }}>
          Patient emailed <span className="mono">{reminderStampText(last.atISO)}</span> to {last.to}
        </div>
      )}
      {office && (
        <Button variant="primary" size="compact" shot="patient-email-open" style={{ alignSelf: 'flex-start' }} onClick={() => setEmailing(true)}>
          {EMAIL_PATIENT_CHANGED_LABEL}
        </Button>
      )}
      {emailing && office && <PatientEmailDialog actor={actor} bookingId={bookingId} invoiceId={invoiceId} onClose={() => setEmailing(false)} />}
    </Card>
  )
}

interface PatientEmailDialogProps {
  actor: Actor
  bookingId: string
  invoiceId: string
  onClose: () => void
}

/**
 * Email patient: anaesthetist changed. The letter (the default named, a select
 * when several are active), its preview naming the anaesthetist now, the
 * payer's invoice email, the provisional caption and Send email. Mount it
 * while open; it opens on mount and closes on a send.
 */
function PatientEmailDialog({ actor, bookingId, invoiceId, onClose }: PatientEmailDialogProps) {
  const { Overlay } = useSurface()
  const templates = useLetterTemplates('anaesthetistChanged')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const blocked = useCommandBlock()
  const invoice = useAppStore((s) => s.billing.invoices[invoiceId])
  const to = invoice !== undefined ? reminderAddressFor(invoice) : undefined
  const body = useAppStore(
    (s) => previewPrepaymentLetter(s, bookingId, { kind: 'anaesthetistChanged', invoiceId, ...(templateId !== '' ? { templateId } : {}) })?.body ?? null,
  )

  function send() {
    setError(null)
    const outcome = emailPatientAnaesthetistChanged(useAppStore, actor, bookingId, { invoiceId, ...(templateId !== '' ? { templateId } : {}) })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const disabled = blocked !== null || to === undefined || templates.length === 0
  return (
    <Overlay open onClose={onClose}>
      <div data-shot="patient-email" data-invoice-id={invoiceId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={EMAIL_PATIENT_CHANGED_LABEL}
          description={
            <>
              Optional. The prepayment and invoice <span className="mono">{invoice?.invoiceNumber ?? ''}</span> stay as they are.
            </>
          }
        />
        <DefList gap={10}>
          <LetterRow templates={templates} value={templateId} onChange={setTemplateId} shot="patient-email-template" />
          {to !== undefined ? (
            <DefRow label="To" shot="patient-email-recipient" note={to}>
              {invoice?.billedTo?.name ?? to}
            </DefRow>
          ) : (
            <DefRow label="To" shot="patient-email-recipient" data-no-address="true">
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {invoice?.billedTo?.name ?? ''}
                <span data-shot="patient-email-no-address" style={{ fontSize: 12, lineHeight: '17px', color: semantic.warning.onTint }}>
                  {PATIENT_NOTICE_MESSAGES.noInvoiceEmail}
                </span>
              </span>
            </DefRow>
          )}
        </DefList>
        {body !== null && <LetterPreview body={body} shot="patient-email-preview" />}
        <span data-shot="patient-email-provisional" style={{ fontSize: 12, lineHeight: '17px', color: neutral.mist }}>
          {PATIENT_EMAIL_PROVISIONAL}
        </span>
        <FormError message={error} shot="patient-email-refusal" />
        <SheetActions
          primary={
            <Button variant="primary" block shot="patient-email-send" disabled={disabled} {...(blocked !== null ? { disabledReason: blocked } : {})} onClick={send}>
              Send email
            </Button>
          }
          secondary={
            <Button variant="secondary" block onClick={onClose}>
              Cancel
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
