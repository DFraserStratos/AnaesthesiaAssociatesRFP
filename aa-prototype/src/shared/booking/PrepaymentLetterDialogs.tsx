/**
 * The prepayment letter's two dialogs (catch-up Phase 41; US-06.3.6): Approve
 * and send (the Invoices strip) and Send prepayment reminder (the office's
 * Booking panel). Each names the letter (the kind's default, a choice only
 * when more than one is active), previews it, names where it goes and sends
 * through the store action, showing a refusal in its own words.
 *
 * Both are commands on the saved Booking, so they act on the real store at
 * once (never the Admin Booking draft) and wait while the draft is unsaved.
 */

import { useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { pendingGroupFor } from '../../domain/billing/prepayment'
import { invoiceDeliveryFor } from '../../domain/billing/whoIsBilled'
import type { PrepaymentLetterKind, PrepaymentLetterTemplate } from '../../domain/types'
import { approvePrepayment, prepaymentGroupsForBooking, useAppStore, type Actor, type AppState } from '../../store'
import { proceduresForBooking } from '../../store/selectors'
import { REMINDER_MESSAGES, reminderAddressFor, sendPrepaymentReminder } from '../../store/prepaymentActions'
import { activeLetterTemplates, amountOutstandingOn, LETTER_SEND_MESSAGES, previewPrepaymentLetter } from '../../store/prepaymentLetter'
import { Button } from '../ui/Button'
import { TextAction } from '../ui/TextAction'
import { DefList, DefRow } from '../ui/DefRow'
import { FormError, SelectField } from '../ui/Field'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { LetterText } from '../billing/docParts'
import { formatMoney } from '../format'
import { useCommandBlock } from './draft'

/** The active templates of a kind, the default first (stable while the masters are). */
function useLetterTemplates(kind: PrepaymentLetterKind): PrepaymentLetterTemplate[] {
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => activeLetterTemplates({ masters }, kind), [masters, kind])
}

/**
 * The letter row: the default named, or a select when more than one template
 * of the kind is active.
 */
function LetterRow({ templates, value, onChange, shot }: { templates: readonly PrepaymentLetterTemplate[]; value: string; onChange: (id: string) => void; shot: string }) {
  if (templates.length === 0) {
    return (
      <DefRow label="Letter" tone="warning">
        {LETTER_SEND_MESSAGES.noTemplate}
      </DefRow>
    )
  }
  if (templates.length === 1) {
    return (
      <DefRow label="Letter" shot={shot} data-template-id={templates[0]!.id}>
        {templates[0]!.name}
      </DefRow>
    )
  }
  return (
    <DefRow label="Letter">
      <SelectField label="Letter" hideLabel size="compact" fill="surface" value={value} onChange={onChange} shot={shot}>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.isDefault ? `${t.name} (default)` : t.name}
          </option>
        ))}
      </SelectField>
    </DefRow>
  )
}

/** The rendered letter on a paper-like neutral sheet, its line breaks kept. */
export function LetterPreview({ body, shot }: { body: string; shot?: string }) {
  return (
    <div
      data-shot={shot}
      aria-label="Letter preview"
      role="document"
      style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', maxHeight: 260, overflow: 'auto' }}
    >
      <LetterText body={body} fontSize={13} lineHeight={20} />
    </div>
  )
}

/** "Preview letter" / "Hide letter". */
function PreviewToggle({ open, onToggle, shot }: { open: boolean; onToggle: () => void; shot: string }) {
  return (
    <TextAction size="sm" flush shot={shot} ariaExpanded={open} onClick={onToggle} style={{ alignSelf: 'flex-start' }}>
      {open ? 'Hide letter' : 'Preview letter'}
    </TextAction>
  )
}

/** Where a payer group's prepayment invoice will go, by the one delivery rule ("email address", or the postal address on one line). */
function approveRecipient(state: AppState, bookingId: string, payerKey: string): string | null {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return null
  const group = pendingGroupFor(prepaymentGroupsForBooking(state, bookingId), payerKey)
  if (group === undefined) return null
  const members = proceduresForBooking(state, bookingId).filter((p) => group.procedureIds.includes(p.id))
  const plan = invoiceDeliveryFor(group.payer, members, booking.patientId, state.masters.patients[booking.patientId], state.masters.parties)
  if (plan.method === 'email') return plan.to
  if (plan.method === 'post') return `By post · ${plan.lines.join(', ')}`
  return null
}

export interface ApprovePrepaymentDialogProps {
  onClose: () => void
  actor: Actor
  bookingId: string
  payerKey: string
  payerName: string
  patientName: string
  /** After the invoice and its letter went: the new invoice's id. */
  onApproved: (invoiceId: string) => void
}

/**
 * Approve and send (US-06.3.1 with US-06.3.6): the letter that goes with the
 * prepayment invoice, its preview (the number "(allocated when sent)") and the
 * payer it goes to. The teal primary approves with the chosen template.
 * Mount it while open; it opens on mount.
 */
export function ApprovePrepaymentDialog({ onClose, actor, bookingId, payerKey, payerName, patientName, onApproved }: ApprovePrepaymentDialogProps) {
  const { Overlay } = useSurface()
  const templates = useLetterTemplates('request')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocked = useCommandBlock()
  const recipient = useAppStore((s) => approveRecipient(s, bookingId, payerKey))
  const body = useAppStore((s) => (preview ? (previewPrepaymentLetter(s, bookingId, { payerKey, ...(templateId !== '' ? { templateId } : {}) })?.body ?? null) : null))

  function send() {
    setError(null)
    const outcome = approvePrepayment(useAppStore, actor, bookingId, payerKey, templateId !== '' ? { letterTemplateId: templateId } : {})
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onApproved(outcome.value.invoiceId)
  }

  const noTemplate = templates.length === 0
  return (
    <Overlay open onClose={onClose}>
      <div data-shot="prepayment-letter-picker" data-booking-id={bookingId} data-payer-key={payerKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Approve and send" description={`The prepayment invoice for ${patientName} goes with this letter.`} />
        <DefList gap={10}>
          <LetterRow templates={templates} value={templateId} onChange={setTemplateId} shot="prepayment-letter-template" />
          <DefRow label="To" shot="prepayment-letter-recipient" note={recipient ?? undefined}>
            {payerName}
          </DefRow>
        </DefList>
        {!noTemplate && <PreviewToggle open={preview} onToggle={() => setPreview(!preview)} shot="prepayment-letter-preview-toggle" />}
        {preview && body !== null && <LetterPreview body={body} shot="prepayment-letter-preview" />}
        <FormError message={error} shot="prepayment-letter-refusal" />
        <SheetActions
          primary={
            <Button
              variant="primary"
              block
              shot="prepayment-letter-send"
              disabled={noTemplate || blocked !== null}
              {...(blocked !== null ? { disabledReason: blocked } : {})}
              onClick={send}
            >
              Approve and send
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

export interface PrepaymentReminderDialogProps {
  onClose: () => void
  actor: Actor
  bookingId: string
  invoiceId: string
  payerName: string
  /** After the reminder went: where it went. */
  onSent: (to: string) => void
}

/**
 * Send prepayment reminder (US-06.3.6): the reminder letter (the default
 * named, a select when several are active), its preview with the amount still
 * to pay, and the payer's invoice email; without one, the refusal and no send.
 * Mount it while open; it opens on mount.
 */
export function PrepaymentReminderDialog({ onClose, actor, bookingId, invoiceId, payerName, onSent }: PrepaymentReminderDialogProps) {
  const { Overlay } = useSurface()
  const templates = useLetterTemplates('reminder')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocked = useCommandBlock()
  const invoice = useAppStore((s) => s.billing.invoices[invoiceId])
  const outstanding = useAppStore((s) => {
    const inv = s.billing.invoices[invoiceId]
    return inv !== undefined ? amountOutstandingOn(s, inv) : 0
  })
  const to = invoice !== undefined ? reminderAddressFor(invoice) : undefined
  const body = useAppStore((s) =>
    preview ? (previewPrepaymentLetter(s, bookingId, { kind: 'reminder', invoiceId, ...(templateId !== '' ? { templateId } : {}) })?.body ?? null) : null,
  )

  function send() {
    setError(null)
    const outcome = sendPrepaymentReminder(useAppStore, actor, bookingId, { invoiceId, ...(templateId !== '' ? { templateId } : {}) })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onSent(outcome.value.to)
  }

  const noTemplate = templates.length === 0
  // The missing email and the missing template are named in their rows; only the unsaved draft is named under the button.
  const disabled = blocked !== null || to === undefined || noTemplate
  return (
    <Overlay open onClose={onClose}>
      <div data-shot="prepayment-reminder-dialog" data-invoice-id={invoiceId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title="Send prepayment reminder"
          description={
            <>
              Invoice <span className="mono">{invoice?.invoiceNumber ?? ''}</span> · <span className="mono">{formatMoney(outstanding)}</span> still to pay
            </>
          }
        />
        <DefList gap={10}>
          <LetterRow templates={templates} value={templateId} onChange={setTemplateId} shot="prepayment-reminder-template" />
          {to !== undefined ? (
            <DefRow label="To" shot="prepayment-reminder-recipient" note={to}>
              {payerName}
            </DefRow>
          ) : (
            <DefRow label="To" shot="prepayment-reminder-recipient" data-no-address="true">
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {payerName}
                <span data-shot="prepayment-reminder-no-address" style={{ fontSize: 12, lineHeight: '17px', color: semantic.warning.onTint }}>
                  {REMINDER_MESSAGES.noInvoiceEmail}
                </span>
              </span>
            </DefRow>
          )}
        </DefList>
        {!noTemplate && <PreviewToggle open={preview} onToggle={() => setPreview(!preview)} shot="prepayment-reminder-preview-toggle" />}
        {preview && body !== null && <LetterPreview body={body} shot="prepayment-reminder-preview" />}
        <FormError message={error} shot="prepayment-reminder-refusal" />
        <SheetActions
          primary={
            <Button variant="primary" block shot="prepayment-reminder-send" disabled={disabled} {...(blocked !== null ? { disabledReason: blocked } : {})} onClick={send}>
              Send reminder
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
