/**
 * The edit / save / conflict state machine shared by the item and question sheets and the artifact
 * details form.
 *
 * - Unsaved edits live in the draft store (`src/drafts.ts`), so they survive the sheet unmounting
 *   (browser Back, following a link). Reopening the record restores them; every in-app way out goes
 *   through `leave`, which asks first by veiling the sheet (`discardAsk`) rather than raising a browser
 *   prompt. A discard that is confirmed is final.
 * - A save sends only the fields the user changed, with the values they started from (the write
 *   protocol, accepted decision 20), so it never reverts a field someone else changed meanwhile. With
 *   nothing changed it sends nothing.
 * - A change on disk while editing is taken in quietly when it touches only fields the user has not
 *   changed (accepted decision 22); one that clashes with the user's own change raises the conflict
 *   choice. "Keep mine" lays the user's changed fields over the copy on disk; "Load theirs" takes it.
 *   A 409 from the server adopts the server's copy and raises the choice; any other refusal is an error.
 * - What is typed while a save is in flight is kept: it stays an unsaved change on the saved copy.
 * - A record that is not there when the sheet opens is picked up when it appears. If it vanishes from
 *   disk mid-edit (renamed, deleted, failing to parse), the draft is `orphaned`: the sheet shows every
 *   unsaved change so it can be copied, and asks before letting it go.
 */
import { useEffect, useRef, useState } from 'react'
import { changedFields, fieldValue, overlay, patchBetween, sameValue, type RecordKind } from '../../shared/patch.ts'
import type { Rev } from '../../shared/types.ts'
import { ApiError, type RecordPatch } from '../api.ts'
import { dropDraft, getDraft, putDraft } from '../drafts.ts'

export { hasUnsavedDrafts } from '../drafts.ts'

export interface EditableOptions<T> {
  /** Unique per record, e.g. `item:US-01.1.1`. */
  key: string
  /** Which fields a save may name (`PATCH_FIELDS`). */
  kind: RecordKind
  rec: Rev<T> | undefined
  /** Writes the fields changed: `patch`, the rev they were edited on, and each one's starting value. */
  save: (change: RecordPatch<T>) => Promise<Rev<T>>
  adopt: (rec: Rev<T>) => void
  normalise?: (data: T) => T
  startEditing?: boolean
  /** Runs after a successful save, with the version the edit started from. */
  onSaved?: (next: Rev<T>, before: Rev<T>) => void
  /** Runs when an edit is left without saving (Cancel, Esc, or a way out of the sheet), once any discard is confirmed. */
  onAbandon?: () => void
}

export function useEditableRecord<T extends object>({ key, kind, rec, save, adopt, normalise = (d) => d, startEditing = false, onSaved, onAbandon }: EditableOptions<T>) {
  const [stored] = useState(() => getDraft<T>(key))
  /** True until the restored draft is saved or dropped, so the banner shows once, not on every later edit. */
  const [restored, setRestored] = useState(!!stored)
  const [editing, setEditing] = useState(!!stored || startEditing)
  const [base, setBase] = useState<Rev<T> | undefined>(stored?.base ?? rec)
  const [draft, setDraft] = useState<T | undefined>(stored?.draft ?? rec?.data)
  /** Null, or the fields that changed both here and on disk (empty when the server did not say which). */
  const [conflict, setConflict] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  // The draft as it is now, read when a save comes back: anything typed meanwhile is kept.
  const draftRef = useRef(draft)
  draftRef.current = draft
  const dirty = editing && draft !== undefined && !!base && !sameValue(draft, base.data)

  // Keep the draft outside React so leaving without saving (e.g. browser Back) doesn't lose it.
  useEffect(() => {
    if (dirty && base) putDraft(key, { draft: draft as T, base })
    else dropDraft(key)
  }, [dirty, draft, base, key])

  // The record as it is now: picked up if it was missing, taken in quietly unless it clashes with an edit.
  useEffect(() => {
    if (!rec || savingRef.current) return
    if (!base) {
      setBase(rec)
      setDraft(rec.data)
      return
    }
    if (rec.rev === base.rev) return
    if (!dirty || draft === undefined) {
      setBase(rec)
      setDraft(rec.data)
      return
    }
    if (conflict) return // waiting on Keep mine or Load theirs
    const mine = changedFields(kind, base.data, draft)
    const theirs = new Set(changedFields(kind, base.data, rec.data))
    const clash = mine.filter((f) => theirs.has(f) && !sameValue(fieldValue(draft, f), fieldValue(rec.data, f)))
    if (clash.length) setConflict(clash)
    else {
      setBase(rec)
      setDraft(overlay(rec.data, draft, mine))
    }
  }, [rec, base, dirty, saving, conflict])

  /** The action waiting on "Discard changes"; while it is set the sheet shows the veil. */
  const [pending, setPending] = useState<{ go: () => void } | null>(null)

  const reset = () => {
    setEditing(false)
    setDraft(rec?.data)
    if (rec) setBase(rec)
    setConflict(null)
    setError(null)
    setRestored(false)
  }

  /**
   * Run a way out of the sheet. With unsaved edits it asks first, in the sheet, and returns false; the
   * caller's action runs only if the answer is Discard.
   */
  const leave = (go: () => void): boolean => {
    if (dirty) {
      setPending({ go })
      return false
    }
    dropDraft(key)
    if (editing) onAbandon?.()
    go()
    return true
  }

  const discardAsk = pending
    ? {
        confirm: () => {
          setPending(null)
          dropDraft(key)
          if (editing) onAbandon?.()
          reset() // the draft is gone for good, even if the way out keeps this sheet open
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

  const cancelEdit = () => leave(reset)

  /** Drop the draft without asking: the orphaned-draft sheet's own "Discard edits" button. */
  const discard = () => {
    dropDraft(key)
    reset()
  }

  const commit = async (): Promise<Rev<T> | undefined> => {
    if (!dirty || draft === undefined || !base || savingRef.current) return
    const sent = draft
    const { patch, base: was } = patchBetween(kind, base.data, normalise(sent))
    if (!Object.keys(patch).length) {
      // Only tidying differed (spaces a save trims): nothing to write.
      dropDraft(key)
      reset()
      return base
    }
    setSaving(true)
    savingRef.current = true
    setError(null)
    try {
      const next = await save({ patch, baseRev: base.rev, base: was })
      const now = draftRef.current
      const later = now === undefined ? [] : changedFields(kind, sent, now)
      setBase(next)
      setConflict(null)
      setRestored(false)
      if (later.length) setDraft(overlay(next.data, now as T, later))
      else {
        dropDraft(key)
        setDraft(next.data)
        setEditing(false)
      }
      onSaved?.(next, base)
      return next
    } catch (e) {
      // Only a revision clash carries the server's copy; anything else "Keep mine" cannot fix.
      if (e instanceof ApiError && e.status === 409 && e.current) {
        adopt(e.current as Rev<T>)
        setConflict(e.collisions ?? [])
      } else setError((e as Error).message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const keepMine = () => {
    if (!rec || !base || draft === undefined) return
    setDraft(overlay(rec.data, draft, changedFields(kind, base.data, draft)))
    setBase(rec)
    setConflict(null)
  }
  const loadTheirs = () => {
    if (!rec) return
    setBase(rec)
    setDraft(rec.data)
    setConflict(null)
  }

  const commitRef = useRef(commit)
  commitRef.current = commit
  /** Sheet key handler: Cmd/Ctrl+S saves (only a change), Esc cancels an edit. Returns true when handled. */
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
    conflict: !!conflict,
    /** The fields that changed both here and on disk, when known. */
    collisions: conflict ?? [],
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
    /** Drop a way out that is waiting on the veil (the frame that asked is covered or gone). */
    cancelPending: () => setPending(null),
    onKey,
  }
}

export type EditableRecord<T extends object> = ReturnType<typeof useEditableRecord<T>>
