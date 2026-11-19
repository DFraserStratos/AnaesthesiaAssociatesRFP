import { useMemo, useState } from 'react'
import { fontFamily, neutral, radius } from '../../../../theme/tokens'
import type { EmailTemplate, UpdateEmailKind, UpdateEmailRecipient } from '../../../../domain/types'
import {
  EMAIL_PLACEHOLDERS,
  EMAIL_PLACEHOLDER_HINTS,
  UPDATE_EMAIL_KINDS,
  UPDATE_EMAIL_KIND_LABELS,
  UPDATE_EMAIL_RECIPIENT_LABELS,
  buildUpdateEmail,
  validateTemplate,
  type EmailLine,
  type EmailPlaceholder,
  type UpdateEmailContext,
} from '../../../../domain/updateEmail'
import { addEmailTemplate, saveEmailTemplate, setEmailTemplateActive, useAppStore, type Actor } from '../../../../store'
import { Button, DemoBadge, FormError, TextArea, TextField, useSurface } from '../../../../shared'
import { Pill, SelectField } from '../../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { HistorySheet } from '../../../../shared/booking'
import { Header, Table, TextAction } from './chrome'
import { cellStyle } from './tableStyles'

const RECIPIENTS: readonly UpdateEmailRecipient[] = ['office', 'hospital', 'both']

/** The editor's preview Booking: a made-up sample, never a real patient. */
const SAMPLE_CONTEXT: UpdateEmailContext = {
  patient: 'Aroha Sample',
  date: 'Tue 21 Jul',
  session: 'AM',
  hospital: "St George's",
  surgeon: 'Mr T. Hale',
  anaesthetist: 'Dr Priya Sharma',
  previousAnaesthetist: 'Dr James Rutherford',
  bookingCount: 4,
}
const SAMPLE_LINES: readonly EmailLine[] = [
  { key: 'time', label: 'Time', before: '09:00', after: '09:30' },
  { key: 'procedure:sample', label: 'Procedure', before: 'Knee arthroscopy', after: 'Total knee replacement' },
]
const SAMPLE_TO: Record<UpdateEmailRecipient, string> = {
  office: 'office@surgeons.example',
  hospital: 'bookings@stgeorges.example',
  both: 'office@surgeons.example, bookings@stgeorges.example',
}

function templatesInOrder(records: Readonly<Record<string, EmailTemplate>>): EmailTemplate[] {
  return Object.values(records).sort((a, b) => UPDATE_EMAIL_KINDS.indexOf(a.kind) - UPDATE_EMAIL_KINDS.indexOf(b.kind) || a.id.localeCompare(b.id))
}

/**
 * Master data, Email templates (catch-up Phase 35; US-02.3.4, DM-35): the
 * wording of the update email for each kind of change, with who it goes to by
 * default. Each kind keeps one active template; a retired one stays listed and
 * can be restored. The update email itself is drafted from a Booking or a
 * List and opened in the office's own mail client.
 */
export function EmailTemplatesView({ actor }: { actor: Actor }) {
  const records = useAppStore((s) => s.masters.emailTemplates)
  const rows = useMemo(() => templatesInOrder(records), [records])
  const [sheet, setSheet] = useState<{ template?: EmailTemplate } | null>(null)
  const [history, setHistory] = useState<EmailTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)

  function setActive(t: EmailTemplate, active: boolean) {
    const outcome = setEmailTemplateActive(useAppStore, actor, t.id, active)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <>
      <Header
        title="Email templates"
        sub="The wording of the update email the office drafts from a Booking or a List, one template for each kind of change, and who it goes to by default. The email opens in your own mail client; nothing is sent from here."
        action={<Button variant="secondary" onClick={() => { setError(null); setSheet({}) }}>Add template</Button>}
      />
      <FormError message={error} />
      <Table heads={['Name', 'Kind of change', 'Sends to', 'Active', '']} rightAlign={[4]} shot="email-templates" label="Email templates">
        {rows.map((t) => {
          const muted = t.active ? {} : { color: neutral.mist }
          return (
            <tr key={t.id} data-email-template={t.id} style={t.active ? undefined : { background: neutral.bg }}>
              <td style={{ ...cellStyle, fontWeight: 600, ...muted }}>{t.name}</td>
              <td style={{ ...cellStyle, ...muted }}>{UPDATE_EMAIL_KIND_LABELS[t.kind]}</td>
              <td style={{ ...cellStyle, ...muted }}>{UPDATE_EMAIL_RECIPIENT_LABELS[t.recipient]}</td>
              <td style={cellStyle}>{t.active ? <Pill tone="success" size="sm">Active</Pill> : <Pill tone="neutral" size="sm">Retired</Pill>}</td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  <TextAction onClick={() => setHistory(t)} label={`History of ${t.name}`}>History</TextAction>
                  <TextAction onClick={() => { setError(null); setSheet({ template: t }) }} label={`Edit ${t.name}`}>Edit</TextAction>
                  {t.active
                    ? <TextAction onClick={() => setActive(t, false)} label={`Retire ${t.name}`}>Retire</TextAction>
                    : <TextAction onClick={() => setActive(t, true)} label={`Restore ${t.name}`}>Restore</TextAction>}
                </span>
              </td>
            </tr>
          )
        })}
      </Table>
      {sheet !== null && <EmailTemplateSheet key={sheet.template?.id ?? 'new'} template={sheet.template} actor={actor} onClose={() => setSheet(null)} />}
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title="Email template history" onClose={() => setHistory(null)} />
    </>
  )
}

/** Add or edit one template: the fields on the left, a live preview against a sample Booking on the right. */
export function EmailTemplateSheet({ template, actor, onClose }: { template?: EmailTemplate; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [name, setName] = useState(template?.name ?? '')
  const [kind, setKind] = useState<UpdateEmailKind>(template?.kind ?? 'bookingChange')
  const [recipient, setRecipient] = useState<UpdateEmailRecipient>(template?.recipient ?? 'office')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [target, setTarget] = useState<'subject' | 'body'>('body')
  const [error, setError] = useState<string | null>(null)

  const issues = validateTemplate({ name, kind, subject, body })
  const issueFor = (field: 'name' | 'subject' | 'body') => issues.filter((i) => i.field === field).map((i) => i.message).join(' ') || null
  const preview = buildUpdateEmail({ template: { subject, body }, context: SAMPLE_CONTEXT, lines: SAMPLE_LINES, to: SAMPLE_TO[recipient], signature: actor.who })

  function insert(p: EmailPlaceholder) {
    const token = `{${p}}`
    if (target === 'subject') setSubject((s) => (s === '' || s.endsWith(' ') ? `${s}${token}` : `${s} ${token}`))
    else setBody((b) => (b === '' || b.endsWith('\n') || b.endsWith(' ') ? `${b}${token}` : `${b} ${token}`))
  }

  function save() {
    const fields = { name, recipient, subject, body }
    const outcome = template === undefined ? addEmailTemplate(useAppStore, actor, { ...fields, kind }) : saveEmailTemplate(useAppStore, actor, template.id, fields)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose} size="wide">
      <div data-shot="email-template-editor" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={template === undefined ? 'Add an email template' : `Edit ${template.name}`}
          description={template === undefined ? undefined : `${UPDATE_EMAIL_KIND_LABELS[template.kind]}. The kind of change is fixed once a template is made.`}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Correction, short" />
            <FormError message={issueFor('name')} variant="inline" />
            {template === undefined && (
              <SelectField label="Kind of change" value={kind} onChange={(v) => setKind(v as UpdateEmailKind)}>
                {UPDATE_EMAIL_KINDS.map((k) => <option key={k} value={k}>{UPDATE_EMAIL_KIND_LABELS[k]}</option>)}
              </SelectField>
            )}
            <SelectField label="Sends to" value={recipient} onChange={(v) => setRecipient(v as UpdateEmailRecipient)} hint="The default when the email is drafted. The office can change it each time.">
              {RECIPIENTS.map((r) => <option key={r} value={r}>{UPDATE_EMAIL_RECIPIENT_LABELS[r]}</option>)}
            </SelectField>
            <TextField label="Subject" value={subject} onChange={setSubject} onBlur={() => setTarget('subject')} />
            <FormError message={issueFor('subject')} variant="inline" />
            <TextArea label="Body" value={body} onChange={setBody} onBlur={() => setTarget('body')} rows={10} resize="vertical" />
            <FormError message={issueFor('body')} variant="inline" />
            <div data-shot="email-template-placeholders" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12.5, color: neutral.slate }}>Insert into the {target === 'subject' ? 'subject' : 'body'}:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMAIL_PLACEHOLDERS.map((p) => (
                  // The shared compact pill action (U5), the placeholder in mono.
                  <Button
                    key={p}
                    variant="pill"
                    size="compact"
                    title={EMAIL_PLACEHOLDER_HINTS[p]}
                    ariaLabel={`Insert {${p}}: ${EMAIL_PLACEHOLDER_HINTS[p]}`}
                    onClick={() => insert(p)}
                    style={{ minHeight: 28, padding: '0 10px', fontSize: 12 }}
                  >
                    <span className="mono">{`{${p}}`}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div data-shot="email-template-preview" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Preview</span>
              <DemoBadge label="Sample" />
            </div>
            <div style={{ fontSize: 12.5, color: neutral.slate }}>A sample Booking with a time change and a procedure change.</div>
            <PreviewRow label="To" value={preview.to} />
            <PreviewRow label="Subject" value={preview.subject} />
            <div style={{ fontFamily: fontFamily.mono, fontSize: 12, lineHeight: '18px', whiteSpace: 'pre-wrap', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.sm, padding: 10, color: neutral.ink }}>
              {preview.body}
            </div>
          </div>
        </div>
        <FormError message={error} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save} disabled={issues.length > 0}>{template === undefined ? 'Add template' : 'Save changes'}</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span style={{ color: neutral.mist, width: 56, flex: 'none' }}>{label}</span>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}
