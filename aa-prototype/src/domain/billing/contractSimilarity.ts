/**
 * The similar-name hint on New contract (build plan Phase 46; US-04.1.2,
 * Similar name): the holder's Contracts whose name reads like the one being
 * typed, so the office sees a likely duplicate before creating it. A hint,
 * never a block: nothing here stops a save.
 *
 * The rule (a built default, on the owner's review list): each name is
 * lowercased, its punctuation dropped, a trailing "s" taken off each word and
 * the filler words ignored. Two names are similar when they share their first
 * remaining word, or at least half of the shorter name's words. A typed name
 * under three letters matches nothing. System Contracts never match; a
 * Disabled Contract does, and keeps its status so the hint can mark it.
 */

import type { Contract } from './contracts'

/** Words that carry no meaning in a Contract's name. */
const FILLER = new Set(['with', 'and', 'the', 'of', 'for', 'a', 'to', 'in', 'on', 'plus', 'only'])

/** The fewest letters a typed name needs before it is compared. */
const MIN_LETTERS = 3

/** A name as the words compared: lowercased, no punctuation, singular, no filler. */
export function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w !== '' && !FILLER.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
}

/** Whether two names read alike by the rule above. */
export function namesSimilar(a: string, b: string): boolean {
  const wa = nameWords(a)
  const wb = nameWords(b)
  if (wa.length === 0 || wb.length === 0) return false
  if (wa[0] === wb[0]) return true
  const setB = new Set(wb)
  const shared = new Set(wa.filter((w) => setB.has(w))).size
  return shared * 2 >= Math.min(wa.length, wb.length)
}

type Held = Pick<Contract, 'id' | 'name' | 'status' | 'systemRole' | 'holderId'>

/**
 * The holder's Contracts similar to the typed name: the same name first, then
 * Active before Disabled, then by name. `held` is the holder's Contracts; with
 * `holderId`, any other holder's in it are ignored. System Contracts never match.
 */
export function similarContracts<T extends Held>(name: string, held: readonly T[], holderId?: string): T[] {
  const typed = name.trim()
  if (typed.replace(/[^\p{L}\p{N}]/gu, '').length < MIN_LETTERS) return []
  const key = nameWords(typed).join(' ')
  const same = (c: T): number => (nameWords(c.name).join(' ') === key ? 0 : 1)
  const active = (c: T): number => (c.status === 'active' ? 0 : 1)
  return held
    .filter((c) => c.systemRole === undefined && (holderId === undefined || c.holderId === holderId) && namesSimilar(typed, c.name))
    .sort((a, b) => same(a) - same(b) || active(a) - active(b) || a.name.localeCompare(b.name))
}
