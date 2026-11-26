/**
 * The bench for a rooms' PDF that cannot be read (build plan Phase 68 stub, filled by Phase 70; D117, D120, D125;
 * US-02.2.1): no rows, only the page and why it could not become a List. The page beside the reason and the sender;
 * a draft email to the sender asking for a clearer copy, which the office edits and sends (recorded in the
 * arrival's history; `sendUnreadablePdfEmail`); and Dismiss with a reason (`dismissUnreadablePdf`), the decision
 * that takes it out of the Intake count. It stays in the inbox until dismissed. A dismissed one reads only. On the
 * opened arrival (O1) the page is the document; Send email and Dismiss sit in the decision column's footer, and
 * Dismiss's reason form takes the column's place until it is confirmed or cancelled.
 *
 * Hooks: `data-shot="intake-bench-unreadable"`, `data-arrival-key`; `intake-bench-unreadable-reason` (the Notice),
 * `intake-unreadable-email` (the section), `intake-unreadable-send`,
 * `intake-unreadable-sent`, `intake-unreadable-dismiss` (the section), `intake-unreadable-dismiss-confirm`,
 * `intake-unreadable-dismissed`; the page's own `intake-unreadable-page`.
 */

import { useEffect, useState } from 'react'
import type { BenchActions, BenchProps } from './benchProps'
import { BenchLayout } from './BenchLayout'
import { NextArrivalButton } from './NextArrivalButton'
import { DecisionHeading } from '../../../../../shared/surface'
import { stampText } from '../../../../../shared/format'
import { Button, FormError, Notice, ResultLine, TextArea, TextField } from '../../../../../shared/ui'
import { dismissUnreadablePdf, sendUnreadablePdfEmail, unreadableEmailDraft, unreadableEmailsSent, useAppStore } from '../../../../../store'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { PdfPage } from './newList/PdfPage'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const
const SECTION = { display: 'flex', flexDirection: 'column', gap: space[3] } as const

export function UnreadableBench({ arrival, actor, onDone, onNext }: BenchProps) {
  const batch = useAppStore((s) => s.intake.batches[arrival.batchId])
  const audit = useAppStore((s) => s.audit)
  const sent = unreadableEmailsSent({ audit }, arrival.batchId)

  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [reason, setReason] = useState('')
  const [dismissError, setDismissError] = useState<string | null>(null)

  // A fresh draft for each arrival opened.
  useEffect(() => {
    if (batch === undefined) return
    const draft = unreadableEmailDraft(batch)
    setTo(draft.to)
    setSubject(draft.subject)
    setBody(draft.body)
    setEmailError(null)
    setDismissing(false)
    setReason('')
    setDismissError(null)
    // Only when another arrival opens; edits to the draft stay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrival.batchId])

  const reasonText = arrival.reason ?? batch?.unreadableReason ?? 'This file could not be read as a List.'

  if (batch === undefined) {
    return (
      <BenchLayout
        shot="intake-bench-unreadable"
        data-arrival-key={arrival.key}
        document={null}
        decision={
          <Notice tone="warning" title={arrival.title} shot="intake-bench-unreadable-reason">
            {reasonText}
          </Notice>
        }
      />
    )
  }

  const send = () => {
    const out = sendUnreadablePdfEmail(useAppStore, actor, batch.id, { to, subject, body })
    setEmailError(out.ok ? null : out.message)
  }

  const dismiss = () => {
    const out = dismissUnreadablePdf(useAppStore, actor, batch.id, reason)
    if (!out.ok) {
      setDismissError(out.message)
      return
    }
    setDismissError(null)
    setDismissing(false)
    onDone()
  }

  const sentLines =
    sent.length === 0 ? null : (
      <div data-shot="intake-unreadable-sent" style={{ display: 'flex', flexDirection: 'column', gap: space[1] }}>
        {sent.map((e, i) => (
          <ResultLine key={`${e.atISO}-${i}`} plain line={`Email sent to ${e.to} · ${stampText(e.atISO)} · ${e.by}`} />
        ))}
      </div>
    )

  const document =
    batch.file !== undefined ? <PdfPage facsimile={batch.file.facsimile} fileName={batch.file.name} {...(batch.file.pages !== undefined ? { pages: batch.file.pages } : {})} shot="intake-unreadable-page" /> : null

  const decision = (
    <>
      <Notice tone="warning" title="This PDF could not be read" shot="intake-bench-unreadable-reason">
        {reasonText}
      </Notice>

      {batch.dismissed !== undefined ? (
        <>
          <Notice tone="neutral" title={`Dismissed by ${batch.dismissed.by} · ${stampText(batch.dismissed.atISO)}`} shot="intake-unreadable-dismissed">
            {batch.dismissed.reason}
          </Notice>
          {sentLines}
        </>
      ) : dismissing ? (
        <section data-shot="intake-unreadable-dismiss" style={SECTION}>
          <DecisionHeading>Dismiss this PDF</DecisionHeading>
          <TextField
            label="Why dismiss this PDF?"
            value={reason}
            onChange={(v) => {
              setReason(v)
              setDismissError(null)
            }}
            placeholder="The rooms sent a clearer copy"
            size="compact"
            invalid={dismissError !== null}
            autoFocus
            shot="intake-unreadable-dismiss-reason"
          />
          <FormError message={dismissError} />
        </section>
      ) : (
        <section data-shot="intake-unreadable-email" style={SECTION}>
          <DecisionHeading>Email the rooms</DecisionHeading>
          <p style={{ margin: 0, ...SMALL }}>Ask for a clearer copy. Edit the draft before you send it.</p>
          <TextField
            label="To"
            type="email"
            value={to}
            onChange={(v) => {
              setTo(v)
              setEmailError(null)
            }}
            size="compact"
            invalid={emailError !== null && to.trim() === ''}
            shot="intake-unreadable-email-to"
          />
          <TextField
            label="Subject"
            value={subject}
            onChange={(v) => {
              setSubject(v)
              setEmailError(null)
            }}
            size="compact"
            shot="intake-unreadable-email-subject"
          />
          <TextArea
            label="Message"
            value={body}
            onChange={(v) => {
              setBody(v)
              setEmailError(null)
            }}
            rows={10}
            resize="vertical"
            shot="intake-unreadable-email-body"
          />
          <FormError message={emailError} />
          {sentLines}
        </section>
      )}
    </>
  )

  const actions: BenchActions | undefined =
    batch.dismissed !== undefined
      ? onNext !== undefined
        ? { primary: <NextArrivalButton onNext={onNext} /> }
        : undefined
      : dismissing
        ? {
            note: 'It leaves Intake and stays in the audit trail with your reason.',
            secondary: (
              <Button
                variant="secondary"
                size="desktop"
                onClick={() => {
                  setDismissing(false)
                  setDismissError(null)
                }}
              >
                Cancel
              </Button>
            ),
            primary: (
              <Button variant="primary" size="desktop" onClick={dismiss} disabled={reason.trim() === ''} shot="intake-unreadable-dismiss-confirm">
                Dismiss this PDF
              </Button>
            ),
          }
        : {
            note: 'It stays here until it is dismissed, with a reason.',
            secondary: (
              <Button variant="secondary" size="desktop" onClick={() => setDismissing(true)} shot="intake-unreadable-dismiss-open">
                Dismiss
              </Button>
            ),
            primary: (
              <Button variant="primary" size="desktop" onClick={send} shot="intake-unreadable-send">
                {sent.length === 0 ? 'Send email' : 'Send again'}
              </Button>
            ),
          }

  return <BenchLayout shot="intake-bench-unreadable" data-arrival-key={arrival.key} document={document} decision={decision} {...(actions !== undefined ? { actions } : {})} />
}
