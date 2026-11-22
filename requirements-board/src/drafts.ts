/**
 * Unsaved sheet edits, kept outside React so leaving a sheet without saving (browser Back, a link)
 * never loses them: reopening the record restores them. Keyed `item:<id>`, `question:<id>` or
 * `artifact:<id>`. Tab memory only: a reload asks first (`hasUnsavedWork` in `nav.ts`) and starts clean.
 */
import type { Rev } from '../shared/types.ts'

export interface StoredDraft<T = unknown> {
  draft: T
  base: Rev<T>
}

const drafts = new Map<string, StoredDraft>()

export const getDraft = <T>(key: string) => drafts.get(key) as StoredDraft<T> | undefined
export const putDraft = <T>(key: string, d: StoredDraft<T>) => void drafts.set(key, d as StoredDraft)
export const dropDraft = (key: string) => void drafts.delete(key)
/** True while any record has unsaved edits. */
export const hasUnsavedDrafts = () => drafts.size > 0

/**
 * Forget the drafts of records the board itself just created or deleted, so a new card at a reused ID
 * never opens with an old card's edits, and a deleted card's edits never keep the leave prompt on.
 */
export function forgetDrafts(kind: 'item' | 'question' | 'artifact', ids: readonly string[]) {
  for (const id of ids) drafts.delete(`${kind}:${id}`)
}
