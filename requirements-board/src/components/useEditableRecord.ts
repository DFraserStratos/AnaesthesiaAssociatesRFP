/**
 * The edit / save / conflict state machine shared by the item and question
 * sheets.
 *
 * - Unsaved edits live in a module-level draft store, so they survive the
 *   sheet unmounting (browser Back, following a link). Reopening the record
 *   restores them; every in-app way out goes through `leave`, which asks first
 *   by veiling the sheet (`discardAsk`) rather than raising a browser prompt.
 * - A change on disk while editing raises a conflict instead of clobbering the
 *   draft; a 409 from the server adopts the server's copy so "Keep mine" saves
 *   against the right revision. Any other refusal is shown as an error.
 * - If the record vanishes from disk mid-edit (renamed, deleted), the draft is
 *   `orphaned`: the sheet shows it so it can be copied, then `discard`ed.
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
  rec: Rev<T> | undefined
  save: (data: T, baseRev: string) => Promise<Rev<T>>
  adopt: (rec: Rev<T>) => void
  normalise?: (data: T) => T
  startEditing?: boolean
  /** Runs after a successful save, with the version the edit started from. */
  onSaved?: (next: Rev<T>, before: Rev<T>) => void
}

export function useEditableRecord<T>({ key, rec, save, adopt, normalise = (d) => d, startEditing = false, onSaved }: EditableOptions<T>) {
  const [stored] = useState(() => drafts.get(key) as { draft: T; base: Rev<T> } | undefined)
  /** True until the restored draft is saved or dropped, so the banner shows once, not on every later edit. */
  const [restored, setRestored] = useState(!!stored)
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

  /** The action waiting on "Discard changes"; while it is set the sheet shows the veil. */
  const [pending, setPending] = useState<{ go: () => void } | null>(null)

  /**
   * Run a way out of the sheet. With unsaved edits it asks first, in the sheet,
   * and returns false; the caller's action runs only if the answer is Discard.
   */
  const leave = (go: () => void): boolean => {
    if (dirty) {
      setPending({ go })
      return false
    }
    drafts.delete(key)
    go()
    return true
  }

  const discardAsk = pending
    ? {
        confirm: () => {
          setPending(null)
          drafts.delete(key)
          pending.go()
        },
        cancel: () => setPending(null),
      }
    : null

  const startEdit = (prepare: (d: T) => T = (d) => d) => {
    if (!rec) return
    setBase(rec)
    setDraft(prepare(rec.data))
    setError(null)
    setRestored(false)
    setEditing(true)
  }

  const reset = () => {
    setEditing(false)
    setDraft(rec?.data)
    setConflict(false)
    setError(null)
    setRestored(false)
  }
  const cancelEdit = () => leave(reset)

  /** Drop the draft without asking (the orphaned-draft sheet's own button). */
  const discard = () => {
    drafts.delete(key)
    reset()
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
      setRestored(false)
      onSaved?.(next, base)
      return next
    } catch (e) {
      // Only a revision clash carries the server's copy; anything else "Keep mine" cannot fix.
      if (e instanceof ApiError && e.status === 409 && e.current) {
        adopt(e.current as Rev<T>)
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
    if (pending) return false // the veil owns the keyboard while it is up
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
    restored: restored && editing && !conflict,
    orphaned: !rec && dirty,
    startEdit,
    cancelEdit,
    discard,
    save: commit,
    keepMine,
    loadTheirs,
    leave,
    discardAsk,
    onKey,
  }
}

export type EditableRecord<T> = ReturnType<typeof useEditableRecord<T>>
