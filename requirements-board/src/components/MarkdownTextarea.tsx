import { forwardRef, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import { toggleEmphasis, type Emphasis } from '../emphasis.ts'

const SHORTCUTS: Record<string, Emphasis> = { b: 'bold', i: 'italic' }

/** A textarea for a Markdown field: Cmd/Ctrl+B and Cmd/Ctrl+I toggle bold and italic on the selection. */
export const MarkdownTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function MarkdownTextarea(
  { onKeyDown, ...props },
  ref,
) {
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e)
    const kind = SHORTCUTS[e.key.toLowerCase()]
    if (e.defaultPrevented || !kind || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
    e.preventDefault()
    const el = e.currentTarget
    const edit = toggleEmphasis(el.value, el.selectionStart, el.selectionEnd, kind)
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
  return <textarea ref={ref} onKeyDown={onKey} {...props} />
})
