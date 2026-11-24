/**
 * The snapshot masthead's "Your responses" button and the sheet it opens: who the reader is, every
 * response they have kept, and the way to send them back (download the file, or copy it into an email).
 */
import { Check, ClipboardCopy, Download, MessagesSquare, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArtifactRefName, RecordName } from '../components/bits.tsx'
import { Prose } from '../components/Prose.tsx'
import { Sheet, type SheetConfirm } from '../components/Sheet.tsx'
import { useOpen } from '../nav.ts'
import { useCatalogue, useIndex } from '../store.ts'
import { EDIT_FIELD_LABELS, isEmptyResponse, kindLabel, localDay, responsesFile, responsesFileName, sortResponses, targetRef, type ReaderResponse } from './model.ts'
import { useHydrateResponses, useResponses } from './store.ts'

export function ResponsesButton() {
  useHydrateResponses()
  const count = useResponses((s) => s.responses.length)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn sm responses-btn" onClick={() => setOpen(true)} title="Your answers, comments and suggested edits, and how to send them">
        <MessagesSquare size={15} /> Your responses {count > 0 && <span className="count">{count}</span>}
      </button>
      {/* Outside the masthead: a modal sheet makes the masthead inert while it is open. */}
      {open && createPortal(<ResponsesSheet onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

function ResponsesSheet({ onClose }: { onClose: () => void }) {
  const { reader, responses, setReader, remove, clear } = useResponses()
  const snapshot = useCatalogue((s) => s.snapshot)
  const [askClear, setAskClear] = useState(false)
  const [copied, setCopied] = useState(false)
  const list = sortResponses(responses.filter((r) => !isEmptyResponse(r)))
  const named = !!reader.name.trim()
  const file = () => responsesFile({ reader, responses }, snapshot, new Date().toISOString())

  const download = () => {
    const url = URL.createObjectURL(new Blob([file()], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = responsesFileName(reader, localDay(new Date()))
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const copy = () => {
    navigator.clipboard.writeText(file()).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => setCopied(false),
    )
  }

  const confirm: SheetConfirm | null = askClear
    ? {
        title: 'Clear all your responses?',
        body: 'They are removed from this browser. Download them first if you have not sent them yet.',
        cancelLabel: 'Keep them',
        confirmLabel: 'Clear all',
        onCancel: () => setAskClear(false),
        onConfirm: () => {
          clear()
          setAskClear(false)
        },
      }
    : null

  return (
    <Sheet onClose={onClose} label="Your responses" confirm={confirm}>
      <div className="sheet-head">
        <h2 className="responses-title">Your responses</h2>
        <span className="spacer" />
        <button className="btn icon ghost" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="sheet-body">
        <p className="prose small responses-lede">
          Answers, comments and suggested edits you make on this board are kept in this browser only, until you send them. When you are ready,
          download them and send the file to whoever shared the board with you.
        </p>
        <div className="field-grid">
          <label className="field">
            <span>Your name</span>
            <input className="input" value={reader.name} onChange={(e) => setReader({ name: e.target.value })} placeholder="So we know who it came from" autoComplete="name" />
          </label>
          <label className="field">
            <span>Organisation (optional)</span>
            <input className="input" value={reader.organisation} onChange={(e) => setReader({ organisation: e.target.value })} autoComplete="organization" />
          </label>
        </div>
        {list.length ? (
          <div className="respond-list">
            {list.map((r) => (
              <ResponseRow key={r.id} r={r} onOpen={onClose} onRemove={() => remove(r.id)} />
            ))}
          </div>
        ) : (
          <p className="empty-note">
            Nothing yet. Open an outstanding item to answer it, or a card or artifact to comment on it or suggest an edit.
          </p>
        )}
      </div>
      <footer className="sheet-foot">
        <button className="btn ghost danger" onClick={() => setAskClear(true)} disabled={!list.length}>
          <Trash2 size={15} /> Clear all
        </button>
        <span className="spacer" />
        {!named && list.length > 0 && <span className="hint">Add your name to download</span>}
        <button className="btn" onClick={copy} disabled={!list.length || !named} title="Copy them, to paste into an email">
          {copied ? <Check size={15} /> : <ClipboardCopy size={15} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button className="btn primary" onClick={download} disabled={!list.length || !named}>
          <Download size={15} /> Download
        </button>
      </footer>
    </Sheet>
  )
}

/** One kept response: what it is about (opens it), its kind, and its words. */
function ResponseRow({ r, onOpen, onRemove }: { r: ReaderResponse; onOpen: () => void; onRemove: () => void }) {
  const open = useOpen()
  const index = useIndex()
  const t = r.target
  const go = () => {
    onOpen()
    if (t.type === 'item') open.item(t.id)
    else if (t.type === 'question') open.question(t.id)
    else open.artifact(t.id, t.spot ?? null)
  }
  const name =
    t.type === 'artifact' ? (
      <ArtifactRefName refText={targetRef(t)} />
    ) : (
      <RecordName id={t.id} item={t.type === 'item' ? index.byId.get(t.id) : undefined} question={t.type === 'question' ? index.questions.find((q) => q.id === t.id) : undefined} />
    )
  return (
    <div className="respond-item">
      <div className="respond-item-head">
        <strong>{kindLabel(r.kind)}</strong>
        <button className="btn ghost respond-target" onClick={go} title="Open it">
          {name}
        </button>
        <span className="spacer" />
        <button className="btn sm ghost danger" onClick={onRemove} aria-label="Remove this response" title="Remove this response">
          <Trash2 size={14} />
        </button>
      </div>
      {r.text.trim() && <Prose text={r.text} />}
      {r.edits.length > 0 && <p className="respond-edit-label">Suggests a new {r.edits.map((e) => EDIT_FIELD_LABELS[e.field].toLowerCase()).join(', ')}</p>}
    </div>
  )
}
