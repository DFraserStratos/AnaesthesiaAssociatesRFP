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

/** A field a patch may set, or `extra.<key>` for one of a record's unknown frontmatter keys. */
type Field = string

const plainFields = (kind: RecordKind) => PATCH_FIELDS[kind].filter((k) => k !== 'extra')
const extraOf = (r: unknown): Record<string, unknown> => (r as { extra?: Record<string, unknown> }).extra ?? {}

/**
 * The fields `to` changes from `from`, among those a patch may set, in `PATCH_FIELDS` order; an `extra` key
 * as `extra.<key>`. The client's half of the write protocol: what the user changed, and what changed on disk.
 */
export function changedFields(kind: RecordKind, from: object, to: object): Field[] {
  const a = from as Record<string, unknown>
  const b = to as Record<string, unknown>
  const out: Field[] = plainFields(kind).filter((k) => !same(a[k], b[k]))
  if (kind !== 'artifact') {
    const ea = extraOf(a)
    const eb = extraOf(b)
    for (const k of new Set([...Object.keys(ea), ...Object.keys(eb)])) if (!same(ea[k], eb[k])) out.push(`extra.${k}`)
  }
  return out
}

/**
 * The write that takes `from` to `to`: `patch` holds the changed fields (`extra` key by key) and `base` each
 * one's value in `from`, as the server's stale-write merge wants them (accepted decision 20). An `extra` key
 * removed in `to` is not sent (a patch merges `extra` key by key); the board's forms never remove one.
 */
export function patchBetween<T extends object>(kind: RecordKind, from: T, to: T): { patch: Partial<T>; base: Partial<T> } {
  const a = from as Record<string, unknown>
  const b = to as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  const base: Record<string, unknown> = {}
  for (const f of changedFields(kind, from, to)) {
    if (f.startsWith('extra.')) {
      const k = f.slice('extra.'.length)
      if (!Object.hasOwn(extraOf(b), k)) continue
      patch.extra = { ...(patch.extra as object), [k]: extraOf(b)[k] }
      base.extra = { ...(base.extra as object), [k]: extraOf(a)[k] }
      continue
    }
    patch[f] = b[f]
    base[f] = a[f]
  }
  return { patch: patch as Partial<T>, base: base as Partial<T> }
}

/** A field's value as `changedFields` names it (`extra.<key>` reads that key). */
export function fieldValue(record: object, field: Field): unknown {
  return field.startsWith('extra.') ? extraOf(record)[field.slice('extra.'.length)] : (record as Record<string, unknown>)[field]
}

/** `onto` with `fields` (as `changedFields` names them) taken from `from`: a draft rebased on a newer copy. */
export function overlay<T extends object>(onto: T, from: T, fields: readonly Field[]): T {
  const out = { ...onto } as Record<string, unknown>
  const src = from as Record<string, unknown>
  for (const f of fields) {
    if (f.startsWith('extra.')) {
      const k = f.slice('extra.'.length)
      const extra = { ...extraOf(out) }
      if (Object.hasOwn(extraOf(src), k)) extra[k] = extraOf(src)[k]
      else delete extra[k]
      out.extra = extra
    } else out[f] = src[f]
  }
  return out as T
}
