/**
 * The bench for a held message (build plan Phases 68 and 71; D117, US-15.0.6; the opened arrival's O1): no rows, only
 * the message. The document is the message as received, on a white card: its source, when, its control id and type.
 * Its raw text stays behind the restricted raw view (`RawRowSheet`, unchanged, taking the held batch's id through
 * `rawRowActions.ts`): office only, with a reason, masked, and audited, so it is never printed on the page. The
 * decision column says why it is held and what dismissing does; the footer's Dismiss opens the reason sheet
 * (`dismissHeldMessage`, one audited change set). A dismissed message shows who dismissed it and why, and no controls.
 *
 * Hooks: `intake-bench-held`, `intake-bench-held-reason`, `intake-held-facts`, `intake-held-view-raw`,
 * `intake-held-dismiss`, `intake-held-dismiss-sheet`, `intake-held-dismiss-confirm`, `intake-held-dismiss-reason`,
 * `intake-held-dismissed`.
 */

import { useState } from 'react'
import { RawRowSheet } from '../../../matching/RawRowSheet'
import { useAppStore } from '../../../../../store'
import { dismissHeldMessage } from '../../../../../store/intakeBulk'
import { Button, Card, DefList, DefRow, FormError, Notice, TextAction, TextField } from '../../../../../shared/ui'
import { ConfirmSheet, DecisionHeading } from '../../../../../shared/surface'
import { stampText } from '../../../../../shared/format'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { BenchLayout } from './BenchLayout'
import type { BenchActions, BenchProps } from './benchProps'
import { NextArrivalButton } from './NextArrivalButton'

const SMALL = { margin: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

export function HeldMessageBench({ arrival, actor, onDone, onNext }: BenchProps) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const message = useAppStore((s) => (batch?.messageId !== undefined ? s.integrations.messages[batch.messageId] : undefined))
  const [rawOpen, setRawOpen] = useState(false)
  const [dismissOpen, setDismissOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const notice = (
    <Notice tone="warning" title="Why it is held" shot="intake-bench-held-reason">
      {arrival.reason ?? 'This message could not become a List.'}
    </Notice>
  )

  const dismissed = batch?.dismissed

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

  const document = (
    <Card title={arrival.title} titleLevel={3} shot="intake-held-message" style={{ width: '100%' }}>
      <DefList shot="intake-held-facts">
        <DefRow label="From">{arrival.source.label}</DefRow>
        <DefRow label="Received">{stampText(arrival.receivedAtISO)}</DefRow>
        {message !== undefined && (
          <DefRow label="Message" mono>
            {message.messageControlId}
          </DefRow>
        )}
        {message !== undefined && <DefRow label="Type">{message.eventType}</DefRow>}
        {message?.patientRef !== undefined && <DefRow label="Patient">{message.patientRef}</DefRow>}
      </DefList>
      {batch !== undefined && dismissed === undefined && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[1], alignItems: 'flex-start', marginTop: space[3] }}>
          <TextAction flush shot="intake-held-view-raw" onClick={() => setRawOpen(true)}>
            View raw
          </TextAction>
          <p style={SMALL}>The raw message shows masked, with a reason, and each view is recorded.</p>
        </div>
      )}
    </Card>
  )

  const decision = (
    <>
      {notice}
      {dismissed !== undefined ? (
        <Notice tone="neutral" title={`Dismissed by ${dismissed.by}, ${stampText(dismissed.atISO)}`} shot="intake-held-dismissed">
          {dismissed.reason}
        </Notice>
      ) : (
        <>
          <DecisionHeading>What to do</DecisionHeading>
          <p style={SMALL}>Nothing on the schedule changed because of this message. Check it with the hospital if it matters, and dismiss it once no action is needed.</p>
        </>
      )}
    </>
  )

  const actions: BenchActions | undefined =
    batch === undefined
      ? undefined
      : dismissed === undefined
        ? {
            note: 'It leaves Intake and stays in the audit trail with your reason.',
            primary: (
              <Button variant="primary" size="desktop" shot="intake-held-dismiss" onClick={() => setDismissOpen(true)}>
                Dismiss
              </Button>
            ),
          }
        : onNext !== undefined
          ? { primary: <NextArrivalButton onNext={onNext} /> }
          : undefined

  return (
    <>
      <BenchLayout shot="intake-bench-held" data-arrival-key={arrival.key} document={document} decision={decision} {...(actions !== undefined ? { actions } : {})} />
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
    </>
  )
}
