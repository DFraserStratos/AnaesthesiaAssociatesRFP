/**
 * The one rule for JSON kept in browser storage (FINDINGS R-51). Anything can be there: an older
 * board's shape, a hand edit in the devtools, a half-written value. So a value that does not parse,
 * or parses to the wrong shape, reads as that store's defaults for the parts that are wrong, and
 * never throws later in a view. A repair is mentioned once per store in the problem pill
 * (`clientProblems.ts`, accepted decision 17) and in the console. A blocked store (a private window)
 * reads as the defaults and writes nothing, quietly.
 *
 * Every store that keeps JSON in the browser reads through `readJson`; plain-string choices use
 * `usePersistentState` (only listed values).
 */
import { useClientProblems } from './clientProblems.ts'

/** A shape check: the value as it should be, calling `bad()` for any part it had to drop. */
export type Coerce<T> = (raw: unknown, bad: () => void) => T

const said = new Set<string>()
/** Tests: say each repair again. */
export const forgetStorageNotices = () => said.clear()
function repaired(key: string, label: string, why: string) {
  if (said.has(key)) return
  said.add(key)
  console.warn(`[board] saved ${label} (${key}) could not be read (${why}); reset to the defaults`)
  // Often read while a view renders (a useState initialiser): tell the problem pill afterwards.
  queueMicrotask(() => useClientProblems.getState().repaired(key, label))
}

/** Read a stored JSON value through its shape check. `label` names it for people ("board view settings"). */
export function readJson<T>(key: string, label: string, fallback: T, coerce: Coerce<T>): T {
  let text: string | null
  try {
    text = localStorage.getItem(key)
  } catch {
    return fallback // blocked: nothing saved, nothing to repair
  }
  if (text === null) return fallback
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    repaired(key, label, 'not JSON')
    return fallback
  }
  let wrong = false
  const value = coerce(raw, () => (wrong = true))
  if (wrong) repaired(key, label, 'unexpected shape')
  return value
}

/** Save a JSON value; a blocked store keeps it for this page only (the caller's state). */
export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private window or storage blocked: not persisted.
  }
}

export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export const isString = (v: unknown): v is string => typeof v === 'string'
export const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean'
export const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)
export const oneOf =
  <T extends string>(...values: T[]) =>
  (v: unknown): v is T =>
    (values as unknown[]).includes(v)

/**
 * A shape check for an object of known fields: each field present and passing its test is kept,
 * each one present and failing is dropped (its default stands), unknown fields are ignored.
 */
export function fields<T extends object>(defaults: T, tests: { [K in keyof T]?: (v: unknown) => boolean }): Coerce<T> {
  return (raw, bad) => {
    if (!isRecord(raw)) {
      bad()
      return { ...defaults }
    }
    const out = { ...defaults }
    for (const k of Object.keys(tests) as (keyof T & string)[]) {
      if (!Object.hasOwn(raw, k)) continue
      if (tests[k]!(raw[k])) out[k] = raw[k] as T[typeof k]
      else bad()
    }
    return out
  }
}
