/**
 * The edit / save / conflict state machine shared by the item and question
 * sheets.
 *
 * - Unsaved edits live in a module-level draft store, so they survive the
 *   sheet unmounting (browser Back, following a link). Reopening the record
 *   restores them; every in-app way out goes through `leave`, which asks first.
 * - A change on disk while editing raises a conflict instead of clobbering the
 *   draft; a 409 from the server adopts the server's copy so "Keep mine" saves
 *   against the right revision.
 */
import { useEffect, useRef, useState } from 'react'
import type { Rev } from '../../shared/types.ts'
import { ApiError } from '../api.ts'

const drafts = new Map<string, { draft: unknown; base: Rev<unknown> }>()

/** True while any record has unsaved edits (for the beforeunload prompt). */
export const hasUnsavedDrafts = () => drafts.size > 0

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export interface EditableOptions<T> {
  /** Unique per record, e.g. `item:US-01.1.1`. */
  key: string
  noun: string
  rec: Rev<T> | undefined
  save: (data: T, baseRev: string) => Promise<Rev<T>>
  adopt: (rec: Rev<T>) => void
  normalise?: (data: T) => T
  startEditing?: boolean
}

export function useEditableRecord<T>({ key, noun, rec, save, adopt, normalise = (d) => d, startEditing = false }: EditableOptions<T>) {
  const [stored] = useState(() => drafts.get(key) as { draft: T; base: Rev<T> } | undefined)
  const [editing, setEditing] = useState(!!stored || startEditing)
  const [base, setBase] = useState<Rev<T> | undefined>(stored?.base ?? rec)
  const [draft, setDraft] = useState<T | undefined>(stored?.draft ?? rec?.data)
  const [conflict, setConflict] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const dirty = editing && draft !== undefined && !!base && !same(draft, base.data)

  // Keep the draft outside React so leaving without saving (e.g. browser Back) doesn't lose it.
  useEffect(() => {
    if (dirty && base) drafts.set(key, { draft, base })
    else drafts.delete(key)
  }, [dirty, draft, base, key])

  // A change on disk while open: adopt it silently unless it would clobber unsaved edits.
  useEffect(() => {
    if (!rec || !base || rec.rev === base.rev || savingRef.current) return
    if (dirty) setConflict(true)
    else {
      setBase(rec)
      setDraft(rec.data)
    }
  }, [rec, base, dirty])

  const confirmDiscard = () => !dirty || window.confirm(`Discard your changes to this ${noun}?`)

  /** Run a navigation away from the sheet, after confirming unsaved edits may be dropped. */
  const leave = (go: () => void) => {
    if (!confirmDiscard()) return
    drafts.delete(key)
    go()
  }

  const startEdit = (prepare: (d: T) => T = (d) => d) => {
    if (!rec) return
    setBase(rec)
    setDraft(prepare(rec.data))
    setError(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    if (!confirmDiscard()) return
    drafts.delete(key)
    setEditing(false)
    setDraft(rec?.data)
    setConflict(false)
    setError(null)
  }

  const commit = async (): Promise<Rev<T> | undefined> => {
    if (draft === undefined || !base || savingRef.current) return
    setSaving(true)
    savingRef.current = true
    setError(null)
    try {
      const next = await save(normalise(draft), base.rev)
      drafts.delete(key)
      setBase(next)
      setDraft(next.data)
      setEditing(false)
      setConflict(false)
      return next
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (e.current) adopt(e.current as Rev<T>)
        setConflict(true)
      } else setError((e as Error).message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const keepMine = () => {
    setBase(rec)
    setConflict(false)
  }
  const loadTheirs = () => {
    setBase(rec)
    setDraft(rec?.data)
    setConflict(false)
  }

  const commitRef = useRef(commit)
  commitRef.current = commit
  /** Sheet key handler: Cmd/Ctrl+S saves, Esc cancels an edit. Returns true when handled. */
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (editing) void commitRef.current()
      return true
    }
    if (e.key === 'Escape' && editing) {
      cancelEdit()
      return true
    }
    return false
  }

  return {
    editing,
    draft,
    base,
    setDraft,
    dirty,
    conflict,
    error,
    setError,
    saving,
    restored: !!stored,
    startEdit,
    cancelEdit,
    save: commit,
    keepMine,
    loadTheirs,
    leave,
    confirmDiscard,
    onKey,
  }
}
