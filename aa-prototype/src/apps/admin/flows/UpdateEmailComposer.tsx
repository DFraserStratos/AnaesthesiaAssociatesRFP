/**
 * The update email composer (catch-up Phase 35; US-02.3.3, US-02.3.4; OQ-69,
 * OQ-46, OQ-127): the office picks saved changes from a Booking's (or a
 * List's) history, chooses a template and who it goes to, previews the email,
 * and opens it in its own mail client through a real `mailto:` link.
 *
 * - Left, Pick changes: `pickableChanges` newest first. Rows that cannot be
 *   emailed are shown disabled with their reason. A quiet chip marks a row
 *   already picked in an earlier draft (read from `updateEmail.drafted`
 *   entries; a hint only).
 * - Right: Template (any active one; until the admin chooses, it follows
 *   `defaultKindFor` of the ticked rows), Send to (the template's recipient
 *   until the admin chooses), the resolved To with the other office contacts
 *   to switch to, then the preview (`UpdateEmailPreview`, badged).
 * - Open in mail client writes one `updateEmail.drafted` entry and nothing
 *   else. Ticking, switching and previewing write nothing.
 */

import { format, parseISO } from 'date-fns'
import { useMemo, useState, type ReactNode } from 'react'
import { Mail } from 'lucide-react'
import { accent, fontFamily, neutral, radius } from '../../../theme/tokens'
import type { EmailTemplate, UpdateEmailKind, UpdateEmailRecipient } from '../../../domain/types'
import {
  MAILTO_MAX_LENGTH,
  RETURNED_TO_OFFICE_REASON,
  UPDATE_EMAIL_KINDS,
  UPDATE_EMAIL_KIND_LABELS,
  UPDATE_EMAIL_RECIPIENT_LABELS,
  buildUpdateEmail,
  cancelledOutNote,
  defaultKindFor,
  defaultTemplateFor,
  emailLineText,
  netPicked,
  nothingToReportReason,
  updateEmailContext,
  type BuiltUpdateEmail,
  type PickableChange,
  type UpdateEmailSubject,
} from '../../../domain/updateEmail'
import { pickableChanges } from '../../../domain/updateEmail'
import { recordUpdateEmailDrafted, updateEmailRecipients, useAppStore, type Actor } from '../../../store'
import { Button, DemoBadge, FormError, useSurface } from '../../../shared'
import { Checkbox, Eyebrow, Pill, Segmented, SelectField, TextAction } from '../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { locationName } from '../../../shared/format'
import { sessionText } from '../../../domain/outOfHours'
import { shortDateLabel } from '../../../domain/slotStatus'

const SEND_TO: readonly UpdateEmailRecipient[] = ['office', 'hospital', 'both']

/** The office's sign-off: the acting user's name and the company. */
export function updateEmailSignature(actor: Actor): string {
  return `${actor.who}\nAnaesthesia Associates`
}

/** The one-line summary of a picker row. */
export function pickableSummary(row: PickableChange): string {
  if (row.reason === RETURNED_TO_OFFICE_REASON) return 'Returned to the office'
  switch (row.kind) {
    case 'save':
      return 'Saved changes'
    case 'create':
      return 'Booking created'
    case 'cancel':
      return 'Booking cancelled'
    case 'move':
      return 'Moved to another List'
    case 'match':
      return 'Hospital list update'
    case 'cover':
      return 'Change of anaesthetist'
    case 'edit':
    default:
      return 'Changed'
  }
}

/** A picker row's line, without the email's leading dash. */
function lineText(line: PickableChange['lines'][number]): string {
  return emailLineText(line).replace(/^- /, '')
}

/** Newest first, by the row's place in the audit. */
export function newestFirst(rows: readonly PickableChange[]): PickableChange[] {
  return [...rows].sort((a, b) => b.seq - a.seq)
}

/** The picker rows for a subject, read from the real store (saved history only). */
export function usePickableChanges(subject: UpdateEmailSubject): PickableChange[] {
  const audit = useAppStore((s) => s.audit)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const id = subject.kind === 'booking' ? subject.bookingId : subject.listId
  return useMemo(
    () => newestFirst(pickableChanges(audit, subject.kind === 'booking' ? { kind: 'booking', bookingId: id } : { kind: 'list', listId: id }, { ...schedule, ...masters })),
    [audit, schedule, masters, subject.kind, id],
  )
}

/** When each row key was last picked in a drafted email (`updateEmail.drafted`'s `after.pickedKeys`). */
function useDraftedAt(): Map<string, string> {
  const audit = useAppStore((s) => s.audit)
  return useMemo(() => {
    const out = new Map<string, string>()
    for (const e of audit) {
      if (e.action !== 'updateEmail.drafted') continue
      const keys = (e.after as { pickedKeys?: unknown } | undefined)?.pickedKeys
      if (!Array.isArray(keys)) continue
      for (const k of keys) if (typeof k === 'string') out.set(k, e.atISO)
    }
    return out
  }, [audit])
}

export interface UpdateEmailComposerProps {
  open: boolean
  onClose: () => void
  actor: Actor
  subject: UpdateEmailSubject
  /** Rows ticked when the composer opens (only emailable ones are kept). */
  initialPickedKeys?: readonly string[]
  /** The kind of email to start with, in place of `defaultKindFor` (a single-Booking move: a Booking change). */
  defaultKind?: UpdateEmailKind
  /** Who it goes to at first, in place of the template's recipient. */
  defaultSendTo?: UpdateEmailRecipient
  /** The anaesthetist's typed message with a move, quoted above the picker for the admin; never put in the email. */
  contextMessage?: { from: string; text: string }
}

export function UpdateEmailComposer(props: UpdateEmailComposerProps) {
  const { Overlay } = useSurface()
  return (
    <Overlay open={props.open} onClose={props.onClose} size="large">
      {props.open && <ComposerBody {...props} />}
    </Overlay>
  )
}

function ComposerBody({ onClose, actor, subject, initialPickedKeys, defaultKind, defaultSendTo, contextMessage }: UpdateEmailComposerProps) {
  const rows = usePickableChanges(subject)
  const draftedAt = useDraftedAt()
  const templates = useAppStore((s) => s.masters.emailTemplates)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useAppStore((s) => s.clock.todayISO)

  const [picked, setPicked] = useState<ReadonlySet<string>>(() => {
    const emailable = new Set(rows.filter((r) => r.emailable).map((r) => r.key))
    return new Set((initialPickedKeys ?? []).filter((k) => emailable.has(k)))
  })
  const [chosenTemplateId, setChosenTemplateId] = useState<string | null>(null)
  const [chosenSendTo, setChosenSendTo] = useState<UpdateEmailRecipient | null>(null)
  const [officeEmail, setOfficeEmail] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const pickedRows = rows.filter((r) => r.emailable && picked.has(r.key))
  const netted = netPicked(pickedRows)

  const activeTemplates = useMemo(
    () => Object.values(templates).filter((t) => t.active).sort((a, b) => UPDATE_EMAIL_KINDS.indexOf(a.kind) - UPDATE_EMAIL_KINDS.indexOf(b.kind) || a.id.localeCompare(b.id)),
    [templates],
  )
  const kind = defaultKind ?? defaultKindFor(pickedRows)
  const template: EmailTemplate | undefined = (chosenTemplateId !== null ? templates[chosenTemplateId] : undefined) ?? defaultTemplateFor(templates, kind) ?? activeTemplates[0]
  const sendTo: UpdateEmailRecipient = chosenSendTo ?? (chosenTemplateId === null && defaultSendTo !== undefined ? defaultSendTo : (template?.recipient ?? 'office'))

  const recipients = updateEmailRecipients({ schedule, masters }, subject, { sendTo, ...(officeEmail !== undefined ? { officeEmail } : {}) })

  const booking = subject.kind === 'booking' ? schedule.bookings[subject.bookingId] : undefined
  const listId = subject.kind === 'list' ? subject.listId : booking?.listId
  const list = listId !== undefined ? schedule.lists[listId] : undefined
  const patientName = booking !== undefined ? masters.patients[booking.patientId]?.name : undefined
  const bookingCount = useMemo(
    () => (listId === undefined ? 0 : Object.values(schedule.bookings).filter((b) => b.listId === listId && b.cancellation === undefined).length),
    [schedule.bookings, listId],
  )

  const built: BuiltUpdateEmail | null =
    template !== undefined && list !== undefined
      ? buildUpdateEmail({
          template,
          context: updateEmailContext({ list, lookups: masters, bookingCount, ...(patientName !== undefined ? { patientName } : {}), lines: netted.lines }),
          lines: netted.lines,
          to: recipients.to,
          signature: updateEmailSignature(actor),
        })
      : null

  const tooLong = built !== null && !built.fits
  // Picked changes that cancel out (a List back with its first anaesthetist) leave nothing to report.
  const nothingToReport = pickedRows.length > 0 && template !== undefined ? nothingToReportReason(template, netted.lines) : null
  const canOpen = pickedRows.length > 0 && built !== null && template !== undefined && !tooLong && nothingToReport === null

  function toggle(key: string, on: boolean) {
    setPicked((s) => {
      const next = new Set(s)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function opened() {
    if (template === undefined) return
    // Row order (newest first), so the record reads as the picker did.
    const pickedKeys = pickedRows.map((r) => r.key)
    const out = recordUpdateEmailDrafted(useAppStore, actor, { subject, pickedKeys, templateId: template.id, recipient: sendTo })
    setError(out.ok ? null : out.message)
  }

  const where = list !== undefined ? `${shortDateLabel(list.dateISO)} ${sessionText(list.session)} · ${locationName(list.hospitalId, masters.hospitals)}` : ''
  const description = subject.kind === 'booking' ? `${patientName ?? 'Booking'} · ${where}` : `${masters.surgeons[list?.surgeonId ?? '']?.name ?? 'The'} List · ${where}`

  function draftedHint(key: string): string | null {
    const at = draftedAt.get(key)
    if (at === undefined) return null
    const d = parseISO(at)
    return at.slice(0, 10) === todayISO ? `In an earlier draft at ${format(d, 'HH:mm')}` : `In an earlier draft on ${format(d, 'EEE d MMM')}`
  }

  return (
    <div data-shot="update-email-composer" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <OverlayHeader title={subject.kind === 'list' ? 'Draft cover-change email' : 'Draft update email'} description={description} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* Left: what the email says. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {contextMessage !== undefined && (
            <figure data-shot="update-email-context-message" style={{ margin: 0, padding: '10px 12px', borderLeft: `3px solid ${neutral.lineStrong}`, background: neutral.bg, borderRadius: `0 ${radius.sm}px ${radius.sm}px 0` }}>
              <figcaption style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>Message from {contextMessage.from}</figcaption>
              <blockquote style={{ margin: '4px 0 0', fontSize: 13, lineHeight: '19px', color: neutral.ink }}>"{contextMessage.text}"</blockquote>
              <div style={{ marginTop: 4, fontSize: 11.5, color: neutral.mist }}>For you only. It is not put in the email; copy it in your mail client if it helps.</div>
            </figure>
          )}
          <Eyebrow as="h3">Pick changes</Eyebrow>
          {rows.length === 0 ? (
            <div style={{ fontSize: 13, color: neutral.slate }}>No saved changes yet.</div>
          ) : (
            <ul data-shot="update-email-picker" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map((r) => {
                const on = r.emailable && picked.has(r.key)
                const hint = draftedHint(r.key)
                return (
                  <li
                    key={r.key}
                    data-pick-row={r.key}
                    style={{
                      padding: '10px 12px',
                      borderRadius: radius.ctl,
                      border: `1px solid ${on ? accent.base : neutral.line}`,
                      background: on ? accent.tint : r.emailable ? neutral.surface : neutral.bg,
                    }}
                  >
                    <Checkbox checked={on} disabled={!r.emailable} onChange={(c) => toggle(r.key, c)} data-pick-key={r.key} style={{ alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, marginTop: -1 }}>
                        <span style={{ fontSize: 13.5, lineHeight: '18px', fontWeight: 600, color: r.emailable ? neutral.ink : neutral.slate }}>{pickableSummary(r)}</span>
                        <span style={{ fontSize: 12, color: neutral.mist }}>
                          {r.who} · <span className="mono">{format(parseISO(r.atISO), 'EEE d MMM HH:mm')}</span>
                        </span>
                        {r.lines.length > 0 && (
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
                            {r.lines.map((l) => (
                              <span key={l.key} style={{ fontSize: 12.5, lineHeight: '17px', color: r.emailable ? neutral.ink : neutral.mist }}>
                                {lineText(l)}
                              </span>
                            ))}
                          </span>
                        )}
                        {!r.emailable && r.reason !== undefined && <span style={{ fontSize: 12, color: neutral.slate }}>{r.reason}</span>}
                        {hint !== null && (
                          <Pill tone="neutral" size="sm" shot="update-email-earlier-draft" style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                            {hint}
                          </Pill>
                        )}
                      </span>
                    </Checkbox>
                  </li>
                )
              })}
            </ul>
          )}
          {netted.cancelledOut > 0 && (
            <div data-shot="update-email-cancelled-out" style={{ fontSize: 12.5, color: neutral.slate }}>
              {cancelledOutNote(netted.cancelledOut)}
            </div>
          )}
        </div>

        {/* Right: how it goes, and what it looks like. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <SelectField
            label="Template"
            value={template?.id ?? ''}
            onChange={(id) => {
              setChosenTemplateId(id)
              setChosenSendTo(null)
            }}
            shot="update-email-template"
          >
            {activeTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name === UPDATE_EMAIL_KIND_LABELS[t.kind] ? t.name : `${t.name} (${UPDATE_EMAIL_KIND_LABELS[t.kind]})`}
              </option>
            ))}
          </SelectField>
          <Segmented
            label="Send to"
            value={sendTo}
            options={SEND_TO.map((r) => ({ value: r, label: UPDATE_EMAIL_RECIPIENT_LABELS[r] }))}
            onChange={(v) => setChosenSendTo(v)}
            size="sm"
          />
          <div data-shot="update-email-to" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            {recipients.to !== '' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: neutral.mist, width: 24, flex: 'none' }}>To</span>
                <span className="mono" style={{ fontSize: 12.5, overflowWrap: 'anywhere' }}>{recipients.to}</span>
              </div>
            )}
            {recipients.alternatives.map((a) => (
              <div key={a.email} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', paddingLeft: 32, fontSize: 12.5, color: neutral.slate }}>
                <span>
                  Or <span className="mono">{a.email}</span> ({a.label})
                </span>
                <TextAction size="sm" flush onClick={() => setOfficeEmail(a.email)} label={`Send to ${a.email} instead`}>
                  Use this instead
                </TextAction>
              </div>
            ))}
            {recipients.reason !== undefined && <div style={{ fontSize: 12.5, color: neutral.slate }}>{recipients.reason}</div>}
          </div>
          {built !== null && <UpdateEmailPreview email={built} />}
        </div>
      </div>

      <FormError message={error} />
      {pickedRows.length === 0 && <div data-shot="update-email-nothing-picked" style={{ fontSize: 12.5, color: neutral.slate }}>Tick at least one change to email.</div>}
      {nothingToReport !== null && (
        <div data-shot="update-email-nothing-to-report" style={{ fontSize: 12.5, color: neutral.slate }}>
          {nothingToReport}
        </div>
      )}
      {pickedRows.length > 0 && nothingToReport === null && tooLong && (
        <div data-shot="update-email-too-long" style={{ fontSize: 12.5, color: neutral.slate }}>
          This template is too long to fit an email link. Choose another template, or shorten this one in Master data.
        </div>
      )}
      <SheetActions
        primary={
          <Button
            variant="primary"
            block
            href={canOpen ? built?.href : undefined}
            disabled={!canOpen}
            onClick={opened}
            shot="update-email-open"
          >
            <Mail size={18} aria-hidden />
            Open in mail client
          </Button>
        }
        secondary={
          <Button variant="secondary" block onClick={onClose}>
            Close
          </Button>
        }
      />
    </div>
  )
}

/** The badged preview of the email as the mail client will open it (presenters only; the mail client is the real thing). */
export function UpdateEmailPreview({ email }: { email: BuiltUpdateEmail }) {
  return (
    <div data-shot="update-email-preview" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Preview</span>
        <DemoBadge label="Demo preview" />
      </div>
      <PreviewRow label="To" value={email.to === '' ? <span style={{ color: neutral.mist }}>Left empty</span> : <span className="mono" style={{ fontSize: 12.5 }}>{email.to}</span>} />
      <PreviewRow label="Subject" value={email.subject} />
      <div data-shot="update-email-body" style={{ fontFamily: fontFamily.mono, fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.sm, padding: 10, color: neutral.ink, overflowWrap: 'anywhere' }}>
        {email.body}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span data-shot="update-email-length" className="mono" style={{ fontSize: 12, color: neutral.slate, fontVariantNumeric: 'tabular-nums' }}>
          {email.length.toLocaleString('en-NZ')} of {MAILTO_MAX_LENGTH.toLocaleString('en-NZ')} characters
        </span>
        {email.shortened && (
          <Pill tone="warning" size="sm" shot="update-email-shortened">
            Shortened to fit
          </Pill>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: neutral.slate }}>Opens in your mail client. The system does not send it.</div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span style={{ color: neutral.mist, width: 56, flex: 'none' }}>{label}</span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}
