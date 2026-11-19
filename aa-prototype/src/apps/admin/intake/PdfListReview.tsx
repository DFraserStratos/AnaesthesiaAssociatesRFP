/**
 * One rooms' PDF list, reviewed (catch-up Phase 34; US-02.2.1, US-11.1.2).
 * The facsimile beside the rows as read: every correctable field (NHI, name,
 * date of birth, time, ethnicity), the NHI checked as typed, each correction
 * shown under its row with who and when, the wording read-only as received.
 * "Send to matching" stages the rows on the matching screen, where each waits
 * for the office's decision: nothing reaches the schedule from here.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accent, elevation, neutral, radius, semantic } from '../../../theme/tokens'
import type { PdfListRow, SurgeonPdfList } from '../../../domain/types'
import { effectivePdfRow, PDF_ROW_FIELD_LABELS, pdfRowIssues, sessionLabel } from '../../../domain/intake'
import { validateNhi } from '../../../domain/nhi'
import { correctPdfListRow, sendPdfListToMatching, useAppStore, type Actor, type PdfRowPatch } from '../../../store'
import { BackLink, Button, Eyebrow, Notice, Pill, ResultLine, TextAction, TextField } from '../../../shared/ui'
import { dateTimeMicroCap, locationName, plural } from '../../../shared/format'

export const MATCHING_PATH = '/admin/intake/matching'

export function PdfListReview({ list, actor, onBack }: { list: SurgeonPdfList; actor: Actor; onBack: () => void }) {
  const masters = useAppStore((s) => s.masters)
  const lists = useAppStore((s) => s.intake.pdfLists)
  const [sent, setSent] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const surgeon = masters.surgeons[list.surgeonId]
  const replaces = list.replacesId !== undefined ? lists[list.replacesId] : undefined
  const blocking = list.rows.some((r) => pdfRowIssues(r).some((i) => i.blocksSend))
  // Rows with a correction typed but not saved: Send waits for them, so nothing typed is lost (review fix).
  const [unsaved, setUnsaved] = useState<ReadonlySet<string>>(new Set())
  const markUnsaved = (rowId: string, dirty: boolean) =>
    setUnsaved((cur) => {
      if (cur.has(rowId) === dirty) return cur
      const next = new Set(cur)
      if (dirty) next.add(rowId)
      else next.delete(rowId)
      return next
    })
  const editable = list.status === 'received'

  function send() {
    const out = sendPdfListToMatching(useAppStore, actor, list.id)
    if (!out.ok) {
      setSendError(out.message)
      return
    }
    setSendError(null)
    const { staged, unchanged } = out.value
    setSent(`Sent to matching: ${plural(staged, 'row')} waiting for your decision${unchanged > 0 ? `, ${unchanged} unchanged since the earlier list` : ''}.`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <BackLink onClick={onBack}>Back to PDF lists</BackLink>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <Eyebrow style={{ marginBottom: 6 }}>The emailed PDF</Eyebrow>
          <img src={list.file.facsimile} alt={`${list.subject} facsimile`} style={{ width: 380, maxWidth: '100%', border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1 }} />
        </div>
        <div style={{ flex: 1, minWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div data-shot="pdf-list-header" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{list.subject}</span>
              {list.replacesId !== undefined && <Pill tone="neutral">Re-sent</Pill>}
              <Pill tone={list.status === 'sent' ? 'success' : 'neutral'}>{list.status === 'sent' ? 'Sent to matching' : 'Received'}</Pill>
            </div>
            <div style={{ fontSize: 13, color: neutral.slate }}>
              {surgeon?.name ?? list.surgeonId} · {locationName(list.hospitalId, masters.hospitals)} · suggested List {sessionLabel(list.target.dateISO, list.target.session)}
            </div>
            <div style={{ fontSize: 13, color: neutral.slate }}>
              Sent from <span className="mono" style={{ color: neutral.ink }}>{list.senderEmail}</span> · received {dateTimeMicroCap(list.receivedAtISO)}
            </div>
            {replaces !== undefined && (
              <div style={{ fontSize: 12.5, color: neutral.slate }}>
                Replaces the list received {dateTimeMicroCap(replaces.receivedAtISO)} from {replaces.senderEmail}. Unchanged rows are skipped; a change waits on Matching for your approval. A patient left off this list is not detected.
              </div>
            )}
          </div>

          <Eyebrow>{editable ? 'Rows as read · check and correct' : 'Rows as sent'}</Eyebrow>
          {list.rows.map((row, i) => (
            <PdfRowCard key={row.id} list={list} row={row} index={i} editable={editable} actor={actor} onDirty={(d) => markUnsaved(row.id, d)} />
          ))}

          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="compact"
                onClick={send}
                disabled={blocking || unsaved.size > 0}
                disabledReason={blocking ? 'Correct the invalid NHI before sending.' : unsaved.size > 0 ? 'Save or undo the correction typed on a row before sending.' : undefined}
                shot="pdf-send"
              >
                Send to matching
              </Button>
              <span style={{ fontSize: 12.5, color: neutral.slate }}>Every row waits on Matching for your decision. Nothing changes the schedule here.</span>
            </div>
          )}
          {sendError !== null && <Notice tone="error">{sendError}</Notice>}
          {(sent !== null || list.status === 'sent') && (
            <ResultLine
              shot="pdf-sent"
              line={sent ?? 'Sent to matching. Each row waits there for your decision.'}
              actions={<Link to={MATCHING_PATH} data-shot="pdf-open-matching" style={{ fontSize: 13, fontWeight: 600, color: accent.base }}>Open Matching</Link>}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type Draft = Record<'nhi' | 'name' | 'dobISO' | 'scheduledTime' | 'ethnicityCode', string>

function draftOf(row: PdfListRow): Draft {
  const r = effectivePdfRow(row)
  return { nhi: r.nhi ?? '', name: r.name, dobISO: r.dobISO ?? '', scheduledTime: r.scheduledTime ?? '', ethnicityCode: r.ethnicityCode ?? '' }
}

function PdfRowCard({ list, row, index, editable, actor, onDirty }: { list: SurgeonPdfList; row: PdfListRow; index: number; editable: boolean; actor: Actor; onDirty: (dirty: boolean) => void }) {
  const saved = draftOf(row)
  const [draft, setDraft] = useState<Draft>(saved)
  const [error, setError] = useState<string | null>(null)
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k].trim() !== saved[k])
  useEffect(() => onDirty(editable && dirty), [editable, dirty, onDirty])
  const typedNhi = draft.nhi.trim()
  const nhiVerdict = typedNhi !== '' ? validateNhi(typedNhi) : undefined
  const issues = pdfRowIssues(row)
  const set = (k: keyof Draft) => (v: string) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setError(null)
  }

  function apply() {
    const patch: PdfRowPatch = {}
    for (const k of Object.keys(draft) as (keyof Draft)[]) if (draft[k].trim() !== saved[k]) patch[k] = draft[k]
    const out = correctPdfListRow(useAppStore, actor, list.id, row.id, patch)
    if (!out.ok) setError(out.message)
    else setDraft(draftOf(useAppStore.getState().intake.pdfLists[list.id]!.rows.find((r) => r.id === row.id)!))
  }

  const blocked = issues.some((i) => i.blocksSend)
  return (
    <div
      data-shot={`pdf-row-${index + 1}`}
      data-row-id={row.id}
      style={{ background: neutral.surface, border: `1px solid ${blocked ? semantic.error.solid : neutral.line}`, borderRadius: radius.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField label="NHI" value={draft.nhi} onChange={set('nhi')} mono width={110} size="compact" disabled={!editable} invalid={nhiVerdict?.valid === false} />
        <TextField label="Name" value={draft.name} onChange={set('name')} width={160} size="compact" disabled={!editable} />
        <TextField label="Date of birth" value={draft.dobISO} onChange={set('dobISO')} mono width={118} size="compact" disabled={!editable} placeholder="YYYY-MM-DD" />
        <TextField label="Time" value={draft.scheduledTime} onChange={set('scheduledTime')} mono width={72} size="compact" disabled={!editable} placeholder="HH:MM" />
        <TextField label="Ethnicity" value={draft.ethnicityCode} onChange={set('ethnicityCode')} mono width={84} size="compact" disabled={!editable} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5 }}>
        <span style={{ color: neutral.mist }}>Procedure as received</span>
        <span className="mono" style={{ color: neutral.ink }}>{row.asRead.procedureText}</span>
      </div>
      {nhiVerdict?.valid === false && dirty && <div style={{ fontSize: 12, color: semantic.error.onTint }}>NHI {typedNhi} is not valid: {nhiVerdict.reason}</div>}
      {!dirty &&
        issues.map((i) => (
          <div key={i.code} style={{ fontSize: 12, color: i.blocksSend ? semantic.error.onTint : semantic.warning.onTint }}>
            {i.message}
          </div>
        ))}
      {row.corrections.length > 0 && (
        <div data-shot="pdf-correction" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {row.corrections.map((c, k) => (
            <div key={k} style={{ fontSize: 12, color: neutral.slate }}>
              {PDF_ROW_FIELD_LABELS[c.field]} {c.from === '' ? '(blank)' : c.from} corrected to {c.to === '' ? '(blank)' : c.to} · {c.by}, {dateTimeMicroCap(c.atISO)}
            </div>
          ))}
        </div>
      )}
      {error !== null && <div style={{ fontSize: 12, color: semantic.error.onTint }}>{error}</div>}
      {editable && dirty && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="compact" onClick={apply} shot={`pdf-row-${index + 1}-apply`}>
            Save correction
          </Button>
          <TextAction onClick={() => setDraft(saved)}>Undo</TextAction>
        </div>
      )}
    </div>
  )
}
