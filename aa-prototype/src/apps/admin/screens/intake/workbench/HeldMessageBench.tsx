/**
 * The bench for a held message (build plan Phases 68 and 71; D117, US-15.0.6): no rows, only the message, its source,
 * why it is held, the restricted raw view (`RawRowSheet`, unchanged, taking the held batch's id through
 * `rawRowActions.ts`) and Dismiss with a reason (`dismissHeldMessage`, one audited change set). A dismissed message
 * shows who dismissed it and why, and no controls.
 */

import { useState } from 'react'
import type { BenchProps } from './benchProps'
import { RawRowSheet } from '../../../matching/RawRowSheet'
import { useAppStore } from '../../../../../store'
import { dismissHeldMessage } from '../../../../../store/intakeBulk'
import { Button, DefList, DefRow, FormError, Notice, TextAction, TextField } from '../../../../../shared/ui'
import { ConfirmSheet } from '../../../../../shared/surface'
import { stampText } from '../../../../../shared/format'
import { neutral } from '../../../../../theme/tokens'

export function HeldMessageBench({ arrival, actor, onDone }: BenchProps) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const message = useAppStore((s) => (batch?.messageId !== undefined ? s.integrations.messages[batch.messageId] : undefined))
  const [rawOpen, setRawOpen] = useState(false)
  const [dismissOpen, setDismissOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const notice = (
    <Notice tone="warning" title={arrival.title} shot="intake-bench-held-reason">
      {arrival.reason ?? 'This message could not become a List.'}
    </Notice>
  )

  // A held arrival the store does not hold (a test's stand-in) shows only its reason.
  if (batch === undefined) {
    return (
      <div data-shot="intake-bench-held" data-arrival-key={arrival.key}>
        {notice}
      </div>
    )
  }

  const dismissed = batch.dismissed

  function closeDismiss() {
    setDismissOpen(false)
    setReason('')
    setError(null)
  }

  function dismiss() {
    const out = dismissHeldMessage(useAppStore, actor, arrival.batchId, reason)
    if (!out.ok) {
      setError(out.message)
      return
    }
    closeDismiss()
    onDone()
  }

  return (
    <div data-shot="intake-bench-held" data-arrival-key={arrival.key} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {notice}
      <DefList shot="intake-held-facts">
        <DefRow label="Source">{arrival.source.label}</DefRow>
        <DefRow label="Received">{stampText(arrival.receivedAtISO)}</DefRow>
        {message !== undefined && (
          <DefRow label="Message" mono>
            {message.messageControlId}
          </DefRow>
        )}
        {message !== undefined && <DefRow label="Type">{message.eventType}</DefRow>}
      </DefList>
      {dismissed !== undefined ? (
        <div data-shot="intake-held-dismissed" role="status" style={{ fontSize: 13, color: neutral.slate }}>
          Dismissed by {dismissed.by}, {stampText(dismissed.atISO)}: {dismissed.reason}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TextAction shot="intake-held-view-raw" onClick={() => setRawOpen(true)}>
            View raw
          </TextAction>
          <Button variant="secondary" size="desktop" shot="intake-held-dismiss" onClick={() => setDismissOpen(true)}>
            Dismiss
          </Button>
        </div>
      )}
      {rawOpen && <RawRowSheet rowId={arrival.batchId} patientName={arrival.source.label} actor={actor} onClose={() => setRawOpen(false)} />}
      <ConfirmSheet
        open={dismissOpen}
        onClose={closeDismiss}
        title="Dismiss this message"
        description="It leaves Intake and stays in the audit trail with your reason. Nothing on the schedule changes."
        confirmLabel="Dismiss"
        onConfirm={dismiss}
        cancelLabel="Cancel"
        confirmDisabled={reason.trim() === ''}
        shot="intake-held-dismiss-sheet"
        confirmShot="intake-held-dismiss-confirm"
      >
        <TextField label="Reason" value={reason} onChange={setReason} placeholder="Why this message needs no action" shot="intake-held-dismiss-reason" />
        <FormError message={error} />
      </ConfirmSheet>
    </div>
  )
}
