/**
 * The edit-mode chrome the item and question sheets (and the artifact details form) share: the banners
 * over the form, the Save / Cancel footer, the discard question, the sheet shown when a record vanishes
 * from disk with unsaved edits, and the one shown when a record is not there. Behaviour lives in
 * `useEditableRecord`; this is only how it looks.
 */
import { useMemo } from 'react'
import { changedFields, fieldValue, type RecordKind } from '../../shared/patch.ts'
import { useCatalogue } from '../store.ts'
import type { EditableRecord } from './useEditableRecord.ts'
import { Sheet, type SheetConfirm } from './Sheet.tsx'

/** What each editable field is called in the forms, per kind. */
const FIELD_LABEL: Record<RecordKind, Record<string, string>> = {
  item: {
    title: 'Title',
    status: 'Status',
    parent: 'Parent',
    swimlane: 'Lane',
    components: 'Components',
    related: 'Related',
    images: 'Screenshots',
    artifacts: 'Artifacts',
    order: 'Order',
    sources: 'Sources',
    description: 'Description',
    acceptance: 'Acceptance criteria',
    technical: 'Technical discussion',
    notes: 'Notes',
  },
  question: { title: 'Title', kind: 'Kind', status: 'Status', owner: 'Owner', affects: 'Affects', sources: 'Sources', question: 'Question', answer: 'Answer' },
  artifact: { title: 'Name', kind: 'Kind', status: 'Status', supersededBy: 'Replaced by', date: 'Date', author: 'Author', components: 'Area', sources: 'Sources', description: 'Description' },
}

/** A field's name as the form shows it; an unknown frontmatter key as written. */
export const fieldLabel = (kind: RecordKind, field: string) => FIELD_LABEL[kind][field] ?? (field.startsWith('extra.') ? field.slice('extra.'.length) : field)

const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)

/** Restored-draft notice, the on-disk conflict choice, and any save error. */
export function EditBanners<T extends object>({ ed, noun, kind }: { ed: EditableRecord<T>; noun: string; kind: RecordKind }) {
  const clash = ed.collisions.map((f) => fieldLabel(kind, f))
  return (
    <>
      {ed.restored && (
        <div className="banner" role="status">
          <span>Restored the unsaved edits you left here.</span>
        </div>
      )}
      {ed.conflict && (
        <div className="banner" role="alert">
          <span>
            This {noun} changed on disk while you were editing{clash.length ? `: ${listed(clash)} changed there too` : ''}.
          </span>
          <span className="spacer" />
          <button className="btn sm" onClick={ed.keepMine} title="Keep your changes; take everything else as it is on disk">
            Keep mine
          </button>
          <button className="btn sm" onClick={ed.loadTheirs} title="Drop your changes and show it as it is on disk">
            Load theirs
          </button>
        </div>
      )}
      {ed.error && <div className="banner error" role="alert">{ed.error}</div>}
    </>
  )
}

/** The footer while editing: the shortcut hint, Cancel and Save. */
export function EditActions<T extends object>({ ed }: { ed: EditableRecord<T> }) {
  return (
    <>
      <span className="hint">
        <kbd>⌘</kbd>
        <kbd>S</kbd> save · <kbd>⌘</kbd>
        <kbd>K</kbd> link to a card · <kbd>Esc</kbd> cancel
      </span>
      <span className="spacer" />
      <button className="btn ghost" onClick={ed.cancelEdit}>
        Cancel
      </button>
      <button className="btn primary" onClick={() => void ed.save()} disabled={!ed.dirty || ed.saving}>
        {ed.saving ? 'Saving…' : 'Save'}
      </button>
    </>
  )
}

/** The "Discard your changes?" veil, while a way out is waiting on it. */
export function discardConfirm<T extends object>(ed: EditableRecord<T>, title: string): SheetConfirm | null {
  if (!ed.discardAsk) return null
  return {
    title: 'Discard your changes?',
    body: `Your unsaved edits to ${title} will be lost.`,
    cancelLabel: 'Keep editing',
    confirmLabel: 'Discard changes',
    onCancel: ed.discardAsk.cancel,
    onConfirm: ed.discardAsk.confirm,
  }
}

/** One unsaved change, as the orphaned-draft sheet lists it. */
export interface ChangedRow {
  field: string
  label: string
  /** The value in readable form; empty when the user cleared the field. */
  text: string
}

/**
 * Every field the draft changes from the version it was edited on, labelled and in readable form.
 * `show` renders a value (IDs with titles, status labels); text and lists of text need none.
 */
export function changedRows<T extends object>(kind: RecordKind, base: T, draft: T, show: (field: string, value: unknown) => string | undefined = () => undefined): ChangedRow[] {
  return changedFields(kind, base, draft).map((field) => {
    const value = fieldValue(draft, field)
    const text = show(field, value) ?? plain(value)
    return { field, label: fieldLabel(kind, field), text }
  })
}

function plain(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(plain).join('\n')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * The record is gone from disk (renamed, deleted, or failing to parse) but unsaved edits to it remain.
 * Every change is shown so it can be copied somewhere safe; every way out asks first, as a sheet with
 * unsaved edits does, and the edits come back if the record does.
 */
export function OrphanedDraft<T extends object>({
  ed,
  id,
  noun,
  rows,
  onClose,
  docked,
}: {
  ed: EditableRecord<T>
  id: string
  noun: string
  rows: ChangedRow[]
  onClose: () => void
  docked?: boolean
}) {
  return (
    <Sheet onClose={() => ed.leave(onClose)} confirm={discardConfirm(ed, id)} label={`${noun} not found`} docked={docked}>
      <OrphanBody id={id} rows={rows} heading={`Unsaved edits to ${id}`} />
      <footer className="sheet-foot">
        <span className="spacer" />
        <button
          className="btn danger"
          onClick={() => {
            ed.discard()
            onClose()
          }}
        >
          Discard edits
        </button>
      </footer>
    </Sheet>
  )
}

/** The banner and the list of unsaved changes, for the orphaned sheet and the artifact page's panel. */
export function OrphanBody({ id, rows, heading }: { id: string; rows: ChangedRow[]; heading?: string }) {
  return (
    <>
      <div className="banner" role="alert">
        <span>
          {id} was renamed, removed or stopped reading on disk while you had unsaved edits. Copy anything you want to keep, then discard them. If it comes back, they come back with it.
        </span>
      </div>
      <div className="sheet-body">
        {heading && <h2>{heading}</h2>}
        {rows.map((r) => (
          <section key={r.field} className="section">
            <h3 className="section-head">{r.label}</h3>
            {r.text ? <pre className="orphan-text">{r.text}</pre> : <p className="empty-note">Cleared</p>}
          </section>
        ))}
      </div>
    </>
  )
}

/**
 * A record that is not in the catalogue: never seen, renamed, removed, or its file failing to parse
 * (then the check's error for it is shown). The sheet picks the record up if it appears.
 */
export function NotFoundSheet({ id, noun, onClose, docked }: { id: string; noun: string; onClose: () => void; docked?: boolean }) {
  const issues = useCatalogue((s) => s.issues)
  const problems = useMemo(() => issues.filter((i) => i.id === id && i.severity === 'error'), [issues, id])
  return (
    <Sheet onClose={onClose} label={`${noun} not found`} docked={docked}>
      <div className="sheet-body">
        <h2>{id} is not in the catalogue</h2>
        <p>It may have been renamed or removed, or its file may not read. This opens it as soon as it is back.</p>
        {problems.length > 0 && (
          <div className="banner error" role="alert">
            <span>
              The check reports: {problems.map((p) => p.message).join(' · ')}
            </span>
          </div>
        )}
      </div>
    </Sheet>
  )
}
