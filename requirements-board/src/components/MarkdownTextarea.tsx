import { forwardRef, useId, useImperativeHandle, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import { isArtifactId, isQuestionId, pastedTarget } from '../../shared/links.ts'
import { parseArtifactRef } from '../../shared/types.ts'
import { spotName } from '../artifactIndex.ts'
import { toggleEmphasis, type Emphasis, type TextEdit } from '../emphasis.ts'
import { lineageTitles, searchItems } from '../itemSearch.ts'
import { linkSelection } from '../linkEdit.ts'
import { useCatalogue, useIndex } from '../store.ts'
import { ItemName } from './bits.tsx'

const SHORTCUTS: Record<string, Emphasis> = { b: 'bold', i: 'italic' }

/** Apply an edit so it lands on the browser's undo stack, and React's onChange sees it. */
function applyEdit(el: HTMLTextAreaElement, edit: TextEdit) {
  el.focus()
  el.setSelectionRange(edit.from, edit.to)
  // insertText keeps the change on the browser's undo stack; where it is refused, edit directly.
  // Either way an input event reaches React, so the field's onChange sees the new text.
  const inserted = edit.insert !== '' && document.execCommand('insertText', false, edit.insert)
  if (!inserted) {
    el.setRangeText(edit.insert, edit.from, edit.to)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.setSelectionRange(edit.selStart, edit.selEnd)
}

/**
 * A textarea for a Markdown field. Cmd/Ctrl+B and Cmd/Ctrl+I toggle bold and italic on the
 * selection. Pasting a copied card link (or a bare ID) links the selection to that card, and
 * Cmd/Ctrl+K picks a card to link it to by title.
 */
export const MarkdownTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function MarkdownTextarea(
  { onKeyDown, onPaste, ...props },
  ref,
) {
  const index = useIndex()
  const artifacts = useCatalogue((s) => s.artifacts)
  const inner = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => inner.current!)
  /** The selection Cmd+K was pressed on, while its picker is open. */
  const [picking, setPicking] = useState<{ start: number; end: number } | null>(null)

  const artifactTitle = (ref: string) => {
    const { id, region } = parseArtifactRef(ref)
    const rec = artifacts[id]
    return rec && (region ? (spotName(rec, region) ?? rec.data.title) : rec.data.title)
  }
  const titleOf = (id: string) => (isArtifactId(id) ? artifactTitle(id) : isQuestionId(id) ? index.questions.find((q) => q.id === id)?.title : index.byId.get(id)?.title) ?? id
  const link = (el: HTMLTextAreaElement, start: number, end: number, id: string) => {
    const edit = linkSelection(el.value, start, end, id, titleOf(id))
    if (!edit) return false
    applyEdit(el, edit)
    return true
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
    const key = e.key.toLowerCase()
    const el = e.currentTarget
    if (key === 'k') {
      e.preventDefault()
      setPicking({ start: el.selectionStart, end: el.selectionEnd })
      return
    }
    const kind = SHORTCUTS[key]
    if (!kind) return
    e.preventDefault()
    applyEdit(el, toggleEmphasis(el.value, el.selectionStart, el.selectionEnd, kind))
  }

  const onPasteLink = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(e)
    if (e.defaultPrevented) return
    const id = pastedTarget(e.clipboardData.getData('text/plain'))
    if (!id) return
    const el = e.currentTarget
    if (link(el, el.selectionStart, el.selectionEnd, id)) e.preventDefault()
  }

  const done = (id: string | null) => {
    const el = inner.current
    const at = picking
    setPicking(null)
    if (!el || !at) return
    if (!id || !link(el, at.start, at.end, id)) {
      el.focus()
      el.setSelectionRange(at.start, at.end)
    }
  }

  return (
    <div className="md-field">
      <textarea ref={inner} onKeyDown={onKey} onPaste={onPasteLink} {...props} />
      {picking && <LinkPicker onDone={done} />}
    </div>
  )
})

/** Cmd+K: find a card by title or ID; Enter links the selection to it, Esc goes back to the text. */
function LinkPicker({ onDone }: { onDone: (id: string | null) => void }) {
  const index = useIndex()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const matches = useMemo(() => (query.trim() ? searchItems(index, query, { limit: 8 }) : []), [index, query])
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const m = matches[active]
      if (m) onDone(m.id)
    } else if (e.key === 'Escape') {
      // Back to the text, without the sheet treating it as Cancel.
      e.preventDefault()
      e.stopPropagation()
      onDone(null)
    }
  }
  return (
    <div className="link-picker picker" onMouseDown={(e) => e.stopPropagation()}>
      <input
        className="input"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
        aria-label="Link to a card"
        placeholder="Link to a card: type its title or ID"
        value={query}
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKey}
        onBlur={() => onDone(null)}
      />
      {matches.length > 0 && (
        <div className="picker-list" role="listbox" id={listId}>
          {matches.map((m, i) => (
            <button
              key={m.id}
              id={`${listId}-${i}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onDone(m.id)}
            >
              <span className="picker-name">
                <ItemName item={m} />
                <span className="picker-lineage">{lineageTitles(index, m).join(' › ')}</span>
              </span>
              <span className="mono">{m.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
