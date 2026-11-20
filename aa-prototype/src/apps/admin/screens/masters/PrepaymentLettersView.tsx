import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { neutral, radius } from '../../../../theme/tokens'
import type { PrepaymentLetterKind, PrepaymentLetterTemplate } from '../../../../domain/types'
import {
  LETTER_KINDS,
  LETTER_KIND_LABEL,
  LETTER_MERGE_FIELDS,
  LETTER_PREVIEW_SAMPLE,
  renderPrepaymentLetter,
} from '../../../../domain/billing/prepaymentLetter'
import { shortDay } from '../../../../domain/dateText'
import { useAppStore, type Actor } from '../../../../store'
import {
  createLetterTemplate,
  editLetterTemplate,
  setDefaultLetterTemplate,
  setLetterTemplateActive,
} from '../../../../store/letterTemplateActions'
import { Button, FormError, TextArea, TextField } from '../../../../shared'
import { Pill, SelectField, TextAction } from '../../../../shared/ui'
import { Dialog, OverlayHeader, SheetActions } from '../../../../shared/surface'
import { MasterHeader, MasterTable } from './chrome'
import { cellStyle } from './tableStyles'

function templatesInOrder(records: Readonly<Record<string, PrepaymentLetterTemplate>>): PrepaymentLetterTemplate[] {
  return Object.values(records).sort((a, b) => LETTER_KINDS.indexOf(a.kind) - LETTER_KINDS.indexOf(b.kind) || a.name.localeCompare(b.name))
}

/**
 * Master data, Prepayment letters (catch-up Phase 41; US-06.3.6, DM-20): the
 * standard wording a prepayment invoice is sent with, a reminder, and the
 * email when a prepaid Booking's anaesthetist changes. Each kind keeps one
 * default; a template can be switched off unless it is the default or its
 * kind's last active one. Editing a template never changes a letter already
 * sent.
 */
export function PrepaymentLettersView({ actor }: { actor: Actor }) {
  const records = useAppStore((s) => s.masters.prepaymentLetterTemplates)
  const rows = useMemo(() => templatesInOrder(records), [records])
  const [sheet, setSheet] = useState<{ template?: PrepaymentLetterTemplate } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function setActive(t: PrepaymentLetterTemplate, active: boolean) {
    const outcome = setLetterTemplateActive(useAppStore, actor, t.id, active)
    setError(outcome.ok ? null : outcome.message)
  }

  function makeDefault(t: PrepaymentLetterTemplate) {
    const outcome = setDefaultLetterTemplate(useAppStore, actor, t.id)
    setError(outcome.ok ? null : outcome.message)
  }

  return (
    <div data-shot="letter-templates" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MasterHeader
        title="Prepayment letters"
        sub="The standard wording a prepayment invoice is sent with, the reminder, and the email when a prepaid Booking's anaesthetist changes. Each kind has one default. A letter already sent keeps its words."
        add={{ label: 'New template', onClick: () => { setError(null); setSheet({}) }, shot: 'letter-template-new' }}
      />
      <FormError message={error} />
      <MasterTable columns={['Name', 'Kind', 'Active', 'Updated', '']} rightAlign={[4]} label="Prepayment letter templates">
        {rows.map((t) => {
          const muted = t.active ? {} : { color: neutral.mist }
          return (
            <tr key={t.id} data-letter-template={t.id} style={t.active ? undefined : { background: neutral.bg }}>
              <td style={{ ...cellStyle, fontWeight: 600, ...muted }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {t.name}
                  {t.isDefault && <Pill tone="neutral" size="sm">Default</Pill>}
                </span>
              </td>
              <td style={{ ...cellStyle, ...muted }}>{LETTER_KIND_LABEL[t.kind]}</td>
              <td style={cellStyle}>{t.active ? <Pill tone="success" size="sm">Active</Pill> : <Pill tone="neutral" size="sm">Off</Pill>}</td>
              <td style={{ ...cellStyle, color: neutral.slate }}>
                {t.updatedAtISO !== undefined ? `${shortDay(t.updatedAtISO)}${t.updatedBy !== undefined ? ` · ${t.updatedBy}` : ''}` : 'Seeded'}
              </td>
              <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 12 }}>
                  {t.active && !t.isDefault && (
                    <TextAction size="sm" flush onClick={() => makeDefault(t)} label={`Make ${t.name} the default`}>Make default</TextAction>
                  )}
                  <TextAction size="sm" flush onClick={() => { setError(null); setSheet({ template: t }) }} label={`Edit ${t.name}`}>Edit</TextAction>
                  {t.active
                    ? <TextAction size="sm" flush onClick={() => setActive(t, false)} label={`Deactivate ${t.name}`}>Deactivate</TextAction>
                    : <TextAction size="sm" flush onClick={() => setActive(t, true)} label={`Activate ${t.name}`}>Activate</TextAction>}
                </span>
              </td>
            </tr>
          )
        })}
      </MasterTable>
      {sheet !== null && <LetterTemplateSheet key={sheet.template?.id ?? 'new'} template={sheet.template} actor={actor} onClose={() => setSheet(null)} />}
    </div>
  )
}

/** Add or edit one template: name, kind (new only), body with merge-field chips, and a live preview against a sample Booking. */
export function LetterTemplateSheet({ template, actor, onClose }: { template?: PrepaymentLetterTemplate; actor: Actor; onClose: () => void }) {
  const [name, setName] = useState(template?.name ?? '')
  const [kind, setKind] = useState<PrepaymentLetterKind>(template?.kind ?? 'request')
  const [body, setBody] = useState(template?.body ?? '')
  const [refusal, setRefusal] = useState<{ message: string; field: 'name' | 'body' | null } | null>(null)
  // The shared TextArea takes no ref, so the textarea is found inside its wrapper.
  const bodyWrap = useRef<HTMLDivElement>(null)
  const caret = useRef<number | null>(null)

  const preview = renderPrepaymentLetter({ body }, LETTER_PREVIEW_SAMPLE)

  useLayoutEffect(() => {
    const at = caret.current
    if (at === null) return
    caret.current = null
    const area = bodyWrap.current?.querySelector('textarea')
    if (area === null || area === undefined) return
    area.focus()
    area.selectionStart = at
    area.selectionEnd = at
  }, [body])

  function insert(field: string) {
    const token = `{{${field}}}`
    const area = bodyWrap.current?.querySelector('textarea')
    const start = area?.selectionStart ?? body.length
    const end = area?.selectionEnd ?? body.length
    caret.current = start + token.length
    setBody(body.slice(0, start) + token + body.slice(end))
  }

  function save() {
    const outcome = template === undefined
      ? createLetterTemplate(useAppStore, actor, { kind, name, body })
      : editLetterTemplate(useAppStore, actor, template.id, { name, body })
    if (!outcome.ok) {
      const field = (outcome.details as { field?: unknown } | undefined)?.field
      setRefusal({ message: outcome.message, field: field === 'name' || field === 'body' ? field : null })
      return
    }
    onClose()
  }

  const fieldError = (field: 'name' | 'body') => (refusal !== null && refusal.field === field ? refusal.message : null)

  return (
    <Dialog open onClose={onClose} size="wide">
      <div data-shot="letter-template-editor" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={template === undefined ? 'New letter template' : `Edit ${template.name}`}
          description={template === undefined ? undefined : `${LETTER_KIND_LABEL[template.kind]}. The kind is fixed once a template is made. A letter already sent keeps its words.`}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Prepayment letter, short" />
            <FormError message={fieldError('name')} variant="inline" />
            {template === undefined && (
              <SelectField label="Kind" value={kind} onChange={(v) => setKind(v as PrepaymentLetterKind)}>
                {LETTER_KINDS.map((k) => <option key={k} value={k}>{LETTER_KIND_LABEL[k]}</option>)}
              </SelectField>
            )}
            <div ref={bodyWrap}>
              <TextArea label="Letter" value={body} onChange={setBody} rows={10} resize="vertical" />
            </div>
            <FormError message={fieldError('body')} variant="inline" />
            <div data-shot="letter-merge-chips" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12.5, color: neutral.slate }}>Insert a merge field at the cursor:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LETTER_MERGE_FIELDS.map((f) => (
                  <Button
                    key={f.field}
                    variant="pill"
                    size="compact"
                    title={`{{${f.field}}}`}
                    ariaLabel={`Insert ${f.label}`}
                    onClick={() => insert(f.field)}
                    style={{ minHeight: 28, padding: '0 10px', fontSize: 12 }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div data-shot="letter-template-preview" style={{ display: 'flex', flexDirection: 'column', gap: 8, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 14 }}>
            <span style={{ fontSize: 12.5, color: neutral.slate }}>Preview with a sample booking</span>
            <div
              style={{
                background: neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.sm,
                padding: '18px 20px',
                fontSize: 13.5,
                lineHeight: '21px',
                color: neutral.ink,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                minHeight: 220,
              }}
            >
              {preview}
            </div>
          </div>
        </div>
        <FormError message={refusal !== null && refusal.field === null ? refusal.message : null} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save}>{template === undefined ? 'Add template' : 'Save changes'}</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Dialog>
  )
}
