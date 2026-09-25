/**
 * The edit-mode chrome the item and question sheets share: the banners over
 * the form, the Save / Cancel footer, the discard question, and the sheet shown
 * when a record vanishes from disk with unsaved edits. Behaviour lives in
 * `useEditableRecord`; this is only how it looks.
 */
import type { EditableRecord } from './useEditableRecord.ts'
import { Sheet, type SheetConfirm } from './Sheet.tsx'

/** Restored-draft notice, the on-disk conflict choice, and any save error. */
export function EditBanners<T>({ ed, noun }: { ed: EditableRecord<T>; noun: string }) {
  return (
    <>
      {ed.restored && (
        <div className="banner" role="status">
          <span>Restored the unsaved edits you left here.</span>
        </div>
      )}
      {ed.conflict && (
        <div className="banner" role="alert">
          <span>This {noun} changed on disk while you were editing.</span>
          <span className="spacer" />
          <button className="btn sm" onClick={ed.keepMine}>
            Keep mine
          </button>
          <button className="btn sm" onClick={ed.loadTheirs}>
            Load theirs
          </button>
        </div>
      )}
      {ed.error && <div className="banner error">{ed.error}</div>}
    </>
  )
}

/** The footer while editing: the shortcut hint, Cancel and Save. */
export function EditActions<T>({ ed }: { ed: EditableRecord<T> }) {
  return (
    <>
      <span className="hint">
        <kbd>⌘</kbd>
        <kbd>S</kbd> save · <kbd>Esc</kbd> cancel
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
export function discardConfirm<T>(ed: EditableRecord<T>, title: string): SheetConfirm | null {
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

/**
 * The record is gone from disk (renamed, deleted, or failing to parse) but
 * unsaved edits to it remain. Show them so they can be copied somewhere safe,
 * then let them go.
 */
export function OrphanedDraft<T>({
  ed,
  id,
  noun,
  fields,
  onClose,
  docked,
}: {
  ed: EditableRecord<T>
  id: string
  noun: string
  fields: { label: string; text: string }[]
  onClose: () => void
  docked?: boolean
}) {
  const shown = fields.filter((f) => f.text.trim())
  return (
    <Sheet onClose={onClose} label={`${noun} not found`} docked={docked}>
      <div className="banner" role="alert">
        <span>
          {id} was renamed or removed on disk while you had unsaved edits. Copy anything you want to keep, then discard them.
        </span>
      </div>
      <div className="sheet-body">
        {shown.map((f) => (
          <section key={f.label} className="section">
            <h3 className="section-head">{f.label}</h3>
            <pre className="orphan-text">{f.text}</pre>
          </section>
        ))}
      </div>
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
