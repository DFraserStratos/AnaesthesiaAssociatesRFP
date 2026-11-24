/**
 * Saving only what changed since the starting state.
 *
 * The everyday data is the whole practice (85 anaesthetists, their sessions
 * over the horizon, their Lists and Bookings), about 11 MB as JSON: past
 * Safari's 5 MB localStorage budget, and far too much to re-serialise on every
 * mutation. But the starting state is deterministic and rebuilt on every load
 * (`freshAppState`, built once per page and shared), and recipes never edit a
 * record in place: they return new objects for what they change and keep the
 * same object for everything else. So the saved payload is a delta against
 * that shared start, found by object identity:
 *
 * - a top-level slice that is still the start's own object is left out;
 * - a record map one level down (`schedule.lists`, `masters.anaesthetists`,
 *   `billing.invoices`, ...) saves only the records whose object differs, and
 *   the ids that were removed;
 * - the audit trail saves only the entries appended after the start's;
 * - anything else that changed (the clock, counters, settings) is saved whole.
 *
 * Loading applies the delta to the freshly built start. A record map with no
 * change keeps the start's own object, so the next save is small again.
 *
 * A payload saved before this format (a full state) is told apart by the
 * missing marker and merged as before (`backfillMerge`); a PERSIST_VERSION bump
 * discards it anyway.
 */

/** The marker key of a delta payload. */
export const DELTA_MARKER = '__delta'

type Rec = Record<string, unknown>

interface RecordsChange {
  $records: Rec
  $removed: string[]
}
interface ValueChange {
  $value: unknown
}
interface DeleteChange {
  $delete: true
}
interface AppendChange {
  $append: unknown[]
}
interface SubChange {
  $sub: Record<string, RecordsChange | ValueChange | DeleteChange>
}
type TopChange = ValueChange | AppendChange | SubChange

export interface PersistDelta {
  [DELTA_MARKER]: 1
  top: Record<string, TopChange>
}

function isPlainObject(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** A map of records by id: a plain object whose every value is a plain object. */
function isRecordMap(v: unknown): v is Rec {
  if (!isPlainObject(v)) return false
  for (const key in v) if (!isPlainObject(v[key])) return false
  return true
}

export function isPersistDelta(v: unknown): v is PersistDelta {
  return isPlainObject(v) && v[DELTA_MARKER] === 1 && isPlainObject(v['top'])
}

function recordsChange(state: Rec, start: Rec): RecordsChange | null {
  const changed: Rec = {}
  let any = false
  for (const id in state) {
    if (state[id] !== start[id]) {
      changed[id] = state[id]
      any = true
    }
  }
  const removed: string[] = []
  for (const id in start) if (!(id in state)) removed.push(id)
  return any || removed.length > 0 ? { $records: changed, $removed: removed } : null
}

/**
 * The delta of `state` against `start`, over the keys `keys` (the persisted
 * slices; functions are never saved).
 */
export function deltaOf(state: Rec, start: Rec, keys: readonly string[] = Object.keys(state)): PersistDelta {
  const top: Record<string, TopChange> = {}
  for (const key of keys) {
    const value = state[key]
    const base = start[key]
    if (typeof value === 'function' || value === base) continue
    if (Array.isArray(value) && Array.isArray(base) && value.length >= base.length && base.every((e, i) => value[i] === e)) {
      if (value.length > base.length) top[key] = { $append: value.slice(base.length) }
      continue
    }
    if (isPlainObject(value) && isPlainObject(base)) {
      const sub: SubChange['$sub'] = {}
      for (const s in value) {
        const v = value[s]
        const b = base[s]
        if (v === b) continue
        if (isRecordMap(v) && isRecordMap(b)) {
          const change = recordsChange(v, b)
          if (change !== null) sub[s] = change
        } else {
          sub[s] = { $value: v }
        }
      }
      for (const s in base) if (!(s in value)) sub[s] = { $delete: true }
      if (Object.keys(sub).length > 0) top[key] = { $sub: sub }
      continue
    }
    top[key] = { $value: value }
  }
  return { [DELTA_MARKER]: 1, top }
}

/** `start` with the delta applied: changed slices and maps are new objects, the rest stay the start's own. */
export function applyDelta<S extends Rec>(start: S, delta: PersistDelta): S {
  const out: Rec = { ...start }
  for (const [key, change] of Object.entries(delta.top)) {
    if ('$value' in change) {
      out[key] = change.$value
    } else if ('$append' in change) {
      const base = Array.isArray(start[key]) ? (start[key] as unknown[]) : []
      out[key] = [...base, ...change.$append]
    } else if ('$sub' in change) {
      const base = isPlainObject(start[key]) ? (start[key] as Rec) : {}
      const slice: Rec = { ...base }
      for (const [s, c] of Object.entries(change.$sub)) {
        if ('$delete' in c) delete slice[s]
        else if ('$value' in c) slice[s] = c.$value
        else {
          const map: Rec = { ...(isPlainObject(base[s]) ? (base[s] as Rec) : {}), ...c.$records }
          for (const id of c.$removed) delete map[id]
          slice[s] = map
        }
      }
      out[key] = slice
    }
  }
  return out as S
}
