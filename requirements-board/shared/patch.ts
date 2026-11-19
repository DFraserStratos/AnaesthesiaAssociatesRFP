/**
 * Field patches: what a record write sends (B05, accepted decision 20). A patch names only the fields
 * the client changed; the server lays it over the record as it is on disk now, so a field the patch
 * does not name keeps whatever the file holds. `base` (optional) holds each patched field's value as the
 * client started from it: when the file has moved on since the client's rev, the patch still applies
 * unless one of its own fields changed on disk (`collisions`).
 */
import { normaliseItem, normaliseQuestion, withArtifactDetails } from './files.ts'
import type { Artifact, Item, Question } from './types.ts'

export type RecordKind = 'item' | 'question' | 'artifact'

/** The fields a patch may set, per kind. `id` and an item's `type` may be sent only unchanged. */
export const PATCH_FIELDS: Record<RecordKind, readonly string[]> = {
  item: ['title', 'status', 'components', 'sources', 'order', 'swimlane', 'related', 'artifacts', 'images', 'parent', 'description', 'acceptance', 'technical', 'notes', 'extra'],
  question: ['kind', 'title', 'status', 'owner', 'affects', 'sources', 'question', 'answer', 'extra'],
  artifact: ['title', 'kind', 'status', 'supersededBy', 'date', 'author', 'components', 'sources', 'description'],
}

/** Why a patch is malformed, or null. */
export function patchProblem(kind: RecordKind, patch: unknown, id: string): string | null {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return 'patch must be an object of the fields you changed'
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id') {
      if (v !== id) return 'the record id does not match the URL'
      continue
    }
    if (kind === 'item' && k === 'type') continue // checked against the file: a type never changes
    if (!PATCH_FIELDS[kind].includes(k)) return `${k} is not a field the board can change on ${kind === 'item' ? 'an item' : `a ${kind}`}`
    if (k === 'extra' && (!v || typeof v !== 'object' || Array.isArray(v))) return 'extra must be an object of the keys you changed'
  }
  return null
}

type AnyRecord = Item | Question | Artifact

/** `disk` with `patch` laid over it, tidied as a file read would tidy it. `extra` merges key by key. */
export function applyPatch<T extends AnyRecord>(kind: RecordKind, disk: T, patch: Record<string, unknown>): T {
  const { id: _id, extra, ...fields } = patch
  if (kind === 'artifact') return withArtifactDetails(disk as Artifact, fields) as T
  const merged = { ...disk, ...fields, id: disk.id, extra: { ...(disk as Item | Question).extra, ...((extra as Record<string, unknown>) ?? {}) } }
  return (kind === 'item' ? normaliseItem(merged) : normaliseQuestion(merged)) as T
}

/**
 * Two record values are the same: compared as JSON. Both sides are always tidied by the same reader
 * first (`normaliseItem`, a file read), so their key order agrees.
 */
export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const same = sameValue

/**
 * The patched fields that changed on disk since the client's base: each base value is tidied the way
 * the disk value was (so `3` and `"3"` are one status), then compared. `extra` compares key by key and
 * reports `extra.<key>`. Throws when `base` lacks a patched field (every patched field needs its base).
 */
export function collisions<T extends AnyRecord>(kind: RecordKind, disk: T, base: Record<string, unknown>, patch: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const k of Object.keys(patch)) {
    if (k === 'id' || k === 'type') continue
    if (!Object.hasOwn(base, k)) throw new Error(`base has no value for ${k}: send the value you started from for every field you changed`)
    if (k === 'extra') {
      const was = (base.extra ?? {}) as Record<string, unknown>
      const now = (disk as Item | Question).extra
      for (const key of Object.keys(patch.extra as Record<string, unknown>)) if (!same(was[key], now[key])) out.push(`extra.${key}`)
      continue
    }
    const tidied = (applyPatch(kind, disk, { [k]: base[k] }) as unknown as Record<string, unknown>)[k]
    if (!same(tidied, (disk as unknown as Record<string, unknown>)[k])) out.push(k)
  }
  return out
}
