/**
 * The bench for a rooms' PDF that cannot be read (build plan Phase 68 stub, filled by Phase 70; D117, D120, D125;
 * US-02.2.1): no rows, only the page and why it could not become a List. The page beside the reason and the sender;
 * a draft email to the sender asking for a clearer copy, which the office edits and sends (recorded in the
 * arrival's history; `sendUnreadablePdfEmail`); and Dismiss with a reason (`dismissUnreadablePdf`), the decision
 * that takes it out of the Intake count. It stays in the feed until dismissed. A dismissed one reads only.
 *
 * Hooks: `data-shot="intake-bench-unreadable"`, `data-arrival-key`; `intake-bench-unreadable-reason` (the Notice),
 * `intake-unreadable-sender`, `intake-unreadable-email` (the section), `intake-unreadable-send`,
 * `intake-unreadable-sent`, `intake-unreadable-dismiss` (the section), `intake-unreadable-dismiss-confirm`,
 * `intake-unreadable-dismissed`; the page's own `intake-unreadable-page`.
 */

import { useEffect, useState } from 'react'
import type { BenchProps } from './benchProps'
import { stampText } from '../../../../../shared/format'
import { Button, Eyebrow, FormError, Notice, ResultLine, TextAction, TextArea, TextField } from '../../../../../shared/ui'
import { dismissUnreadablePdf, sendUnreadablePdfEmail, unreadableEmailDraft, unreadableEmailsSent, useAppStore } from '../../../../../store'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { PdfPage } from './newList/PdfPage'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const
const SECTION = { display: 'flex', flexDirection: 'column', gap: space[3], paddingTop: space[4], borderTop: `1px solid ${neutral.line}` } as const

export function UnreadableBench({ arrival, actor, onDone }: BenchProps) {
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
      <div data-shot="intake-bench-unreadable" data-arrival-key={arrival.key}>
        <Notice tone="warning" title={arrival.title} shot="intake-bench-unreadable-reason">
          {reasonText}
        </Notice>
      </div>
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

  const sender = batch.senderEmail ?? (batch.arrivalSource.kind === 'hospitalFeed' ? undefined : batch.arrivalSource.senderEmail)
  const sentLines =
    sent.length === 0 ? null : (
      <div data-shot="intake-unreadable-sent" style={{ display: 'flex', flexDirection: 'column', gap: space[1] }}>
        {sent.map((e, i) => (
          <ResultLine key={`${e.atISO}-${i}`} plain line={`Email sent to ${e.to} · ${stampText(e.atISO)} · ${e.by}`} />
        ))}
      </div>
    )

  return (
    <div
      data-shot="intake-bench-unreadable"
      data-arrival-key={arrival.key}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: space[6], alignItems: 'start', minWidth: 0 }}
    >
      {batch.file !== undefined ? (
        <PdfPage facsimile={batch.file.facsimile} fileName={batch.file.name} shot="intake-unreadable-page" />
      ) : (
        <div />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: space[4], minWidth: 0 }}>
        <Notice tone="warning" title="This PDF could not be read" shot="intake-bench-unreadable-reason">
          {reasonText}
        </Notice>
        <p data-shot="intake-unreadable-sender" style={{ margin: 0, ...SMALL }}>
          {sender !== undefined ? `From ${sender}` : 'Sender not known'} · received {stampText(batch.receivedAtISO)}
        </p>

        {batch.dismissed !== undefined ? (
          <>
            <Notice tone="neutral" title={`Dismissed by ${batch.dismissed.by} · ${stampText(batch.dismissed.atISO)}`} shot="intake-unreadable-dismissed">
              {batch.dismissed.reason}
            </Notice>
            {sentLines}
          </>
        ) : (
          <>
            <section data-shot="intake-unreadable-email" style={SECTION}>
              <Eyebrow as="h3" tone="slate" style={{ margin: 0 }}>
                Email the sender
              </Eyebrow>
              <p style={{ margin: 0, ...SMALL }}>Ask the rooms for a clearer copy. Edit the draft before you send it.</p>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
                <Button variant="primary" size="compact" onClick={send} shot="intake-unreadable-send">
                  {sent.length === 0 ? 'Send email' : 'Send again'}
                </Button>
              </div>
              {sentLines}
            </section>

            <section data-shot="intake-unreadable-dismiss" style={SECTION}>
              {dismissing ? (
                <>
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
                  <div style={{ display: 'flex', gap: space[2] }}>
                    <Button variant="primary" size="compact" onClick={dismiss} shot="intake-unreadable-dismiss-confirm">
                      Dismiss this PDF
                    </Button>
                    <Button
                      variant="secondary"
                      size="compact"
                      onClick={() => {
                        setDismissing(false)
                        setDismissError(null)
                      }}
                    >
                      Keep it
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: space[1], alignItems: 'flex-start' }}>
                  <TextAction flush onClick={() => setDismissing(true)} shot="intake-unreadable-dismiss-open">
                    Dismiss
                  </TextAction>
                  <span style={SMALL}>It stays here until it is dismissed, with a reason.</span>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
