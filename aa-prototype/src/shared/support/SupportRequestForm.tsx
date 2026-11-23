import { useId, useState } from 'react'
import { PRODUCT_KINDS, PRIORITY_MEANING, SUPPORT_PRIORITIES } from '../../domain/support'
import type { SupportChannel, SupportPriority, SupportReason, SupportTicketKind } from '../../domain/types'
import { SheetActions } from '../surface/SheetActions'
import { Button, Eyebrow, FieldLabel, FormError, OptionChip, Segmented, TextArea, TextField, type ButtonSize } from '../ui'
import { neutral } from '../../theme/tokens'
import { KIND_LABEL, NEW_FEATURE_LINE, REASON_LABEL, type OutOfHoursReason } from './supportCopy'

export interface SupportRequestDraft {
  kind: SupportTicketKind
  priority: SupportPriority
  subject: string
  description: string
  reason?: SupportReason
}

const REASONS: readonly OutOfHoursReason[] = ['securityBreach', 'platformOffline', 'other']

/**
 * The request form (catch-up Phase 43b): subject, priority and description.
 * The help line out of hours asks "What is happening?" (only a security
 * breach or the platform offline is answered then); product support asks the
 * kind, and a new feature says where it goes. After Send the form clears.
 */
export function SupportRequestForm({
  channel,
  outOfHours,
  buttonSize,
  onSend,
}: {
  channel: SupportChannel
  /** The help line is closed now: the form asks what is happening. */
  outOfHours: boolean
  buttonSize: ButtonSize
  /** Raises the ticket; returns an error message, or null when it was logged. */
  onSend: (draft: SupportRequestDraft) => string | null
}) {
  const product = channel === 'productSupport'
  const [kind, setKind] = useState<SupportTicketKind>(product ? 'incident' : 'request')
  const [priority, setPriority] = useState<SupportPriority>('P3')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState<OutOfHoursReason>('other')
  const [error, setError] = useState<string | null>(null)
  const askReason = !product && outOfHours
  const reasonLabelId = useId()

  function send() {
    const message = onSend({
      kind,
      priority,
      subject,
      description,
      ...(askReason && reason !== 'other' ? { reason } : {}),
    })
    setError(message)
    if (message === null) {
      setSubject('')
      setDescription('')
      setPriority('P3')
      setReason('other')
    }
  }

  return (
    <section data-shot="support-request-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Eyebrow as="h3">{product ? 'Raise a ticket' : 'Raise a request'}</Eyebrow>
      {product && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Segmented label="Kind" value={kind} options={PRODUCT_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k] }))} onChange={setKind} />
          {kind === 'newFeature' && (
            <p data-shot="support-new-feature-line" style={{ margin: 0, fontSize: 12.5, color: neutral.slate }}>
              {NEW_FEATURE_LINE}
            </p>
          )}
        </div>
      )}
      {askReason && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel id={reasonLabelId}>What is happening?</FieldLabel>
          <div role="radiogroup" aria-labelledby={reasonLabelId} data-shot="support-reason" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {REASONS.map((r) => (
              <OptionChip key={r} role="radio" size={buttonSize === 'touch' ? 'lg' : 'md'} pressed={reason === r} onClick={() => setReason(r)} data-reason={r}>
                {REASON_LABEL[r]}
              </OptionChip>
            ))}
          </div>
        </div>
      )}
      <TextField label="Subject" value={subject} onChange={setSubject} placeholder={product ? 'What is the ticket about?' : 'What is not working?'} maxLength={120} shot="support-subject" />
      {!(askReason && reason !== 'other') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Segmented label="Priority" value={priority} options={SUPPORT_PRIORITIES.map((p) => ({ value: p, label: p }))} onChange={setPriority} />
          <p style={{ margin: 0, fontSize: 12, color: neutral.mist }}>{PRIORITY_MEANING[priority]}</p>
        </div>
      )}
      <TextArea label="Description" value={description} onChange={setDescription} rows={3} maxLength={600} placeholder="Anything that helps, such as what you were doing." shot="support-description" />
      <FormError message={error} />
      <SheetActions
        primary={
          <Button variant="primary" size={buttonSize} block onClick={send} shot="support-send">
            {product ? 'Send ticket' : 'Send request'}
          </Button>
        }
      />
    </section>
  )
}
