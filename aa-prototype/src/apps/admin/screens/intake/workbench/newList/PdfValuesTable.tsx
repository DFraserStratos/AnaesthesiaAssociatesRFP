/**
 * The values read from an arriving List, beside its page (build plan Phase 70; US-02.2.1, DM-15, DM-16, D120).
 * One row per patient: NHI, name, date of birth, time and ethnicity code, each with how sure the reader was in
 * words (never a score); a value the reader was unsure of reads "To check". Choosing a value hands its key to the
 * page, which lights its box. Each row is corrected before the List is placed, the NHI checked as typed, every
 * correction kept under the row with from, to, who and when; the procedure stays as received. A hospital List's
 * rows show the same way, as sent, with nothing to choose on a page. The List's own header values sit above.
 *
 * Hooks: `shot` on the wrapper, `data-row-id` and `data-row-status` on each row, `data-pdf-value` (the value's key,
 * shared with the page), `data-unsure` and `data-corrected` on each value.
 */

import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { isUnsure } from '../../../../../../domain/intake/pdfRead'
import { PDF_HEADER_ROW, pdfValueKey } from '../../../../../../domain/intake/pdfLists'
import { NHI_SHAPE_HINT, nhiEntryFeedback, validateNhi } from '../../../../../../domain/nhi'
import type { ImportRow, ImportRowCorrectionField, PdfReadField, PdfReadValue } from '../../../../../../domain/types'
import { arrivalRowValues, correctArrivalRow, useAppStore, type ArrivalRowField, type ArrivalRowPatch } from '../../../../../../store'
import type { Actor } from '../../../../../../store/mutate'
import { dateTimeMicroCap, formatDob, plural } from '../../../../../../shared/format'
import { Button, DefList, DefRow, FieldHint, FormError, Pill, TextAction, TextField, visuallyHidden } from '../../../../../../shared/ui'
import { RowOpenButton, TableShell, Td, Th } from '../../../../../../shared/table'
import { accent, neutral, radius, semantic, space, type as typeScale } from '../../../../../../theme/tokens'

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

/** A correctable field's name, in the table, the editor and the history lines. */
const FIELD_LABELS: Record<ArrivalRowField, string> = {
  nhi: 'NHI',
  patientName: 'Name',
  dobISO: 'Date of birth',
  scheduledTime: 'Time',
  ethnicityCode: 'Ethnicity',
}

const HISTORY_LABELS: Record<ImportRowCorrectionField, string> = { ...FIELD_LABELS, surgeonId: 'Surgeon' }

/** The reader's field for each correctable field (the page's key). */
const READ_FIELD: Record<ArrivalRowField, PdfReadField> = {
  nhi: 'nhi',
  patientName: 'name',
  dobISO: 'dobISO',
  scheduledTime: 'scheduledTime',
  ethnicityCode: 'ethnicityCode',
}

const HEADER_LABELS: Partial<Record<PdfReadField, string>> = {
  surgeon: 'Surgeon',
  hospital: 'Hospital',
  date: 'Date',
  session: 'Session',
  anaesthetist: 'Anaesthetist',
}

/** A clearly read value is at least this sure; between it and the check threshold it was read, but faintly. */
const READ_CLEARLY = 0.9

/** How sure the reader was, in words (D120: never a score). */
function surenessWords(read: PdfReadValue | undefined, fromPdf: boolean): string {
  if (!fromPdf) return 'As sent'
  if (read === undefined) return 'Not on the page'
  if (isUnsure(read)) return 'The reader was unsure: to check'
  return read.confidence >= READ_CLEARLY ? 'Read clearly' : 'Read, a little faint'
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** A value as the table shows it. */
function shown(field: ArrivalRowField, value: string): string {
  if (field === 'dobISO' && ISO_DAY.test(value)) return formatDob(value)
  return value
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SUB_LINE: CSSProperties = {
  display: 'block',
  fontSize: typeScale.captionSm.size,
  lineHeight: `${typeScale.captionSm.line}px`,
  color: neutral.mist,
  fontWeight: 400,
}

const QUIET: CSSProperties = { color: neutral.mist }

/** The value chip's frame: quiet by default, the warning tint when it is to check, the action tint when chosen. */
function valueLook(toCheck: boolean, selected: boolean): CSSProperties {
  return {
    display: 'inline-block',
    padding: '1px 5px',
    margin: '-1px -5px',
    borderRadius: radius.xs,
    ...(toCheck ? { background: semantic.warning.tint, color: semantic.warning.onTint } : {}),
    ...(selected ? { background: accent.tint, color: neutral.ink, boxShadow: `inset 0 0 0 1.5px ${accent.base}` } : {}),
  }
}

// ---------------------------------------------------------------------------
// One value
// ---------------------------------------------------------------------------

interface ValueProps {
  label: string
  value: string
  read: PdfReadValue | undefined
  fromPdf: boolean
  valueKey: string | undefined
  corrected?: boolean
  selectedKey?: string
  onSelect?: (key: string) => void
  mono?: boolean
  bold?: boolean
}

/** A value as read: chosen to show it on the page, with "To check" when the reader was unsure and it is not yet corrected. */
function ReadValue({ label, value, read, fromPdf, valueKey, corrected = false, selectedKey, onSelect, mono = false, bold = false }: ValueProps) {
  const unsure = read !== undefined && isUnsure(read)
  const toCheck = unsure && !corrected
  const selected = valueKey !== undefined && valueKey === selectedKey
  const words = corrected ? 'Corrected' : surenessWords(read, fromPdf)
  const text = (
    <span className={mono ? 'mono' : undefined} style={{ ...valueLook(toCheck, selected), ...(bold ? { fontWeight: 600 } : {}) }}>
      {value}
    </span>
  )
  const canChoose = valueKey !== undefined && onSelect !== undefined && read !== undefined
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: space[2] }}
      title={words}
      {...(valueKey !== undefined ? { 'data-pdf-value': valueKey } : {})}
      data-unsure={unsure ? 'true' : 'false'}
      data-corrected={corrected ? 'true' : 'false'}
      data-selected={selected ? 'true' : undefined}
    >
      {canChoose ? (
        <RowOpenButton label={`${label} ${value}, ${words.toLowerCase()}. Show it on the page`} onOpen={() => onSelect(valueKey)}>
          {text}
        </RowOpenButton>
      ) : (
        text
      )}
      {toCheck && (
        <Pill size="sm" tone="warning">
          To check
        </Pill>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------

export interface PdfValuesTableProps {
  arrival: ArrivalItem
  actor: Actor
  /** The chosen value's key (`pdfValueKey`), lit here and on the page. */
  selectedKey?: string
  onSelect?: (key: string) => void
  /** The arrival is decided: the values show, nothing is corrected. */
  locked?: boolean
  shot?: string
}

export function PdfValuesTable({ arrival, actor, selectedKey, onSelect, locked = false, shot = 'intake-pdf-values' }: PdfValuesTableProps) {
  const allRows = useAppStore((s) => s.intake.rows)
  const list = useAppStore((s) => {
    const id = s.intake.batches[arrival.batchId]?.pdfListId
    return id === undefined ? undefined : s.intake.pdfLists[id]
  })
  const rows = useMemo(
    () => arrival.rowIds.flatMap((id) => (allRows[id] !== undefined && allRows[id].removalOfBookingId === undefined ? [allRows[id]] : [])),
    [arrival.rowIds, allRows],
  )
  const [editing, setEditing] = useState<string | null>(null)
  const fromPdf = list !== undefined
  const canEdit = !locked
  const columns = canEdit ? 6 : 5
  const toCheck = useMemo(() => {
    if (list === undefined) return 0
    let n = (list.headerRead ?? []).filter(isUnsure).length
    for (const row of rows) {
      const pdfRow = row.pdfRowId !== undefined ? list.rows.find((r) => r.id === row.pdfRowId) : undefined
      const corrected = new Set((row.correctionHistory ?? []).map((c) => READ_FIELD[c.field as ArrivalRowField]))
      n += (pdfRow?.read ?? []).filter((v) => isUnsure(v) && !corrected.has(v.field)).length
    }
    return n
  }, [list, rows])

  const readOf = (row: ImportRow, field: PdfReadField): PdfReadValue | undefined => {
    if (list === undefined || row.pdfRowId === undefined) return undefined
    return list.rows.find((r) => r.id === row.pdfRowId)?.read?.find((v) => v.field === field)
  }
  const keyOf = (row: ImportRow, field: PdfReadField): string | undefined => (row.pdfRowId !== undefined && fromPdf ? pdfValueKey(row.pdfRowId, field) : undefined)

  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
      {list?.headerRead !== undefined && list.headerRead.length > 0 && (
        <DefList gap={6} shot={`${shot}-header`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', columnGap: space[4], rowGap: 6 }}>
          {list.headerRead.map((v) => {
            const key = pdfValueKey(PDF_HEADER_ROW, v.field)
            const label = HEADER_LABELS[v.field] ?? v.field
            return (
              <DefRow key={v.field} label={label} labelWidth={84} {...(isUnsure(v) ? { tone: 'warning' as const } : {})}>
                <ReadValue label={label} value={v.value} read={v} fromPdf valueKey={key} selectedKey={selectedKey} onSelect={onSelect} />
              </DefRow>
            )
          })}
        </DefList>
      )}

      {rows.length === 0 ? null : (
        <TableShell
          label="Patients as read"
          density="compact"
          footer={
            <span style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
              {plural(rows.length, 'patient')}
              {fromPdf ? (toCheck > 0 ? ` · ${plural(toCheck, 'value')} to check` : ' · every value read clearly') : ' · as sent by the hospital'}
              {fromPdf && onSelect !== undefined ? ' · choose a value to see it on the page' : ''}
            </span>
          }
        >
          <thead>
            <tr>
              <Th width={64}>Time</Th>
              <Th>Patient</Th>
              <Th width={128}>NHI</Th>
              <Th width={88}>Ethnicity</Th>
              <Th>Procedure as received</Th>
              {canEdit && (
                <Th width={56}>
                  <span style={visuallyHidden}>Correct</span>
                </Th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PatientRows
                key={row.id}
                row={row}
                columns={columns}
                fromPdf={fromPdf}
                readOf={(f) => readOf(row, f)}
                keyOf={(f) => keyOf(row, f)}
                selectedKey={selectedKey}
                onSelect={onSelect}
                editable={canEdit && row.status === 'open'}
                showEditColumn={canEdit}
                editing={editing === row.id}
                onEdit={() => setEditing(row.id)}
                onClose={() => setEditing(null)}
                actor={actor}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// One patient: the values, the editor, the history
// ---------------------------------------------------------------------------

interface PatientRowsProps {
  row: ImportRow
  columns: number
  fromPdf: boolean
  readOf: (field: PdfReadField) => PdfReadValue | undefined
  keyOf: (field: PdfReadField) => string | undefined
  selectedKey?: string
  onSelect?: (key: string) => void
  editable: boolean
  showEditColumn: boolean
  editing: boolean
  onEdit: () => void
  onClose: () => void
  actor: Actor
}

function PatientRows({ row, columns, fromPdf, readOf, keyOf, selectedKey, onSelect, editable, showEditColumn, editing, onEdit, onClose, actor }: PatientRowsProps) {
  const values = arrivalRowValues(row)
  const corrected = new Set<ImportRowCorrectionField>((row.correctionHistory ?? []).map((c) => c.field))
  const unsureOpen = (Object.keys(READ_FIELD) as ArrivalRowField[]).some((f) => {
    const v = readOf(READ_FIELD[f])
    return v !== undefined && isUnsure(v) && !corrected.has(f)
  })
  const ink: CSSProperties | undefined = row.status === 'open' ? undefined : { color: neutral.slate }
  const stripe: CSSProperties = unsureOpen ? { boxShadow: `inset 3px 0 0 ${semantic.warning.solid}` } : {}
  const nhiVerdict = values.nhi !== '' ? validateNhi(values.nhi) : undefined
  const history = row.correctionHistory ?? []
  const value = (field: ArrivalRowField, extra?: Partial<ValueProps>): ReactNode => (
    <ReadValue
      label={FIELD_LABELS[field]}
      value={shown(field, values[field])}
      read={readOf(READ_FIELD[field])}
      fromPdf={fromPdf}
      valueKey={keyOf(READ_FIELD[field])}
      corrected={corrected.has(field)}
      selectedKey={selectedKey}
      onSelect={onSelect}
      {...extra}
    />
  )
  const procedure = row.incoming.procedure?.text

  return (
    <Fragment>
      <tr data-row-id={row.id} data-row-status={row.status} data-unsure={unsureOpen ? 'true' : 'false'}>
        <Td mono nowrap style={{ ...stripe, ...(values.scheduledTime === '' ? QUIET : ink) }}>
          {values.scheduledTime === '' ? '·' : value('scheduledTime', { mono: true })}
        </Td>
        <Td style={ink}>
          {value('patientName', { bold: true })}
          <span style={{ ...SUB_LINE, marginTop: 2 }}>{values.dobISO === '' ? 'No date of birth' : value('dobISO')}</span>
        </Td>
        <Td nowrap style={ink}>
          {values.nhi === '' ? (
            <Pill size="sm" tone="neutral" variant="outline">
              No NHI · becomes a stub
            </Pill>
          ) : (
            <>
              {value('nhi', { mono: true })}
              {nhiVerdict !== undefined && !nhiVerdict.valid && (
                <FieldHint tone="error" style={{ marginTop: 2 }}>
                  Not a valid NHI
                </FieldHint>
              )}
            </>
          )}
        </Td>
        <Td nowrap style={values.ethnicityCode === '' ? QUIET : ink}>
          {values.ethnicityCode === '' ? 'None' : value('ethnicityCode', { mono: true })}
        </Td>
        <Td style={procedure === undefined ? QUIET : ink}>
          {procedure === undefined ? (
            'None sent'
          ) : (
            <ReadValue label="Procedure" value={procedure} read={readOf('procedureText')} fromPdf={fromPdf} valueKey={keyOf('procedureText')} selectedKey={selectedKey} onSelect={onSelect} mono />
          )}
        </Td>
        {showEditColumn && (
          <Td align="right" nowrap>
            {editable && !editing && (
              <TextAction size="sm" flush onClick={onEdit} label={`Edit ${values.patientName}`} shot="intake-pdf-row-edit" data-row-id={row.id}>
                Edit
              </TextAction>
            )}
          </Td>
        )}
      </tr>
      {editing && editable && (
        <tr data-row-editor={row.id}>
          <Td colSpan={columns} style={{ background: neutral.bg }}>
            <RowEditor row={row} actor={actor} onClose={onClose} />
          </Td>
        </tr>
      )}
      {history.length > 0 && (
        <tr data-row-history={row.id}>
          <Td colSpan={columns} style={{ paddingTop: 0 }}>
            <div data-shot="intake-pdf-correction" style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: space[2], borderLeft: `2px solid ${neutral.line}` }}>
              {history.map((c, k) => (
                <span key={k} style={{ fontSize: typeScale.caption.size, lineHeight: `${typeScale.caption.line}px`, color: neutral.slate }}>
                  {HISTORY_LABELS[c.field]} {c.from === '' ? '(blank)' : c.from} corrected to {c.to === '' ? '(blank)' : c.to} · {c.by}, {dateTimeMicroCap(c.atISO)}
                </span>
              ))}
            </div>
          </Td>
        </tr>
      )}
    </Fragment>
  )
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------

type Draft = Record<ArrivalRowField, string>

function RowEditor({ row, actor, onClose }: { row: ImportRow; actor: Actor; onClose: () => void }) {
  const saved = arrivalRowValues(row)
  const [draft, setDraft] = useState<Draft>(saved)
  const [error, setError] = useState<string | null>(null)
  const changed = (Object.keys(draft) as ArrivalRowField[]).filter((k) => draft[k].trim() !== saved[k])
  const typedNhi = draft.nhi.trim()
  // Checked as typed: the one validator through `nhiEntryFeedback`.
  const nhiFeedback = nhiEntryFeedback(typedNhi)
  const nhiTyped = typedNhi.toUpperCase() !== saved.nhi
  const nhiInvalid = nhiTyped && nhiFeedback.state === 'invalid'
  const set = (k: ArrivalRowField) => (v: string) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setError(null)
  }

  function save() {
    const patch: ArrivalRowPatch = {}
    for (const k of changed) patch[k] = draft[k]
    const out = correctArrivalRow(useAppStore, actor, row.id, patch)
    if (!out.ok) setError(out.message)
    else onClose()
  }

  const nhiHint = nhiInvalid ? `Not valid: ${nhiFeedback.reason ?? 'check the NHI'}` : nhiTyped && nhiFeedback.state === 'incomplete' ? NHI_SHAPE_HINT : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space[2] }} data-shot="intake-pdf-row-editor">
      <div style={{ display: 'flex', gap: space[2], flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          label="NHI"
          value={draft.nhi}
          onChange={set('nhi')}
          mono
          width={118}
          size="compact"
          fill="surface"
          invalid={nhiInvalid}
          hint={nhiHint}
          autoCapitalize="characters"
          spellCheck={false}
          autoComplete="off"
          shot="intake-pdf-edit-nhi"
        />
        <TextField label="Name" value={draft.patientName} onChange={set('patientName')} width={180} size="compact" fill="surface" autoComplete="off" shot="intake-pdf-edit-name" />
        <TextField label="Date of birth" type="date" value={draft.dobISO} onChange={set('dobISO')} mono width={150} size="compact" fill="surface" shot="intake-pdf-edit-dob" />
        <TextField label="Time" type="time" value={draft.scheduledTime} onChange={set('scheduledTime')} mono width={104} size="compact" fill="surface" shot="intake-pdf-edit-time" />
        <TextField
          label="Ethnicity"
          value={draft.ethnicityCode}
          onChange={set('ethnicityCode')}
          mono
          width={92}
          size="compact"
          fill="surface"
          inputMode="numeric"
          maxLength={5}
          autoComplete="off"
          hint="Five digits"
          shot="intake-pdf-edit-ethnicity"
        />
      </div>
      <FormError message={error} shot="intake-pdf-edit-error" />
      <div style={{ display: 'flex', alignItems: 'center', gap: space[3] }}>
        <Button
          variant="primary"
          size="compact"
          onClick={save}
          disabled={changed.length === 0 || nhiInvalid}
          disabledReason={nhiInvalid ? 'Correct the NHI first.' : undefined}
          shot="intake-pdf-edit-save"
        >
          Save correction
        </Button>
        <TextAction size="sm" onClick={onClose} shot="intake-pdf-edit-undo">
          Undo
        </TextAction>
      </div>
    </div>
  )
}
