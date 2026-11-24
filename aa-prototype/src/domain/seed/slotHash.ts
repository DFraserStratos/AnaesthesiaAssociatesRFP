/**
 * Slot-hashed randomness for the canvas generator (Phase 02, decision 2 in
 * PROGRESS): each slot derives its own RNG from a string hash of
 * (seed, anaesthetist, date, session) instead of drawing from one sequential
 * stream. Generation is therefore ORDER-INDEPENDENT — rolling the horizon
 * forward day by day produces byte-identical Lists to seeding the whole
 * horizon at once, which is what makes the roll-forward guard test provable.
 */

import { addDaysISO } from '../clock'
import { mulberry32, type Rng } from '../rng'

/**
 * The seed was drawn with the demo day on Tue 21 Jul 2026; it moved 18 weeks
 * to Tue 24 Nov 2026 (every seeded date with it). A key hashes each date from
 * {@link MOVED_FROM_ISO} on as the date it was before the move, so every draw,
 * and the hand-placed seed built on them, is unchanged.
 */
/** How far the seed moved (18 weeks, so weekdays hold). */
export const SEED_MOVE_DAYS = 126
const MOVED_FROM_ISO = '2026-08-06'
const ISO_DATE = /\d{4}-\d{2}-\d{2}/g

function asDrawn(input: string): string {
  return input.replace(ISO_DATE, (d) => (d >= MOVED_FROM_ISO ? addDaysISO(d, -SEED_MOVE_DAYS) : d))
}

/** xmur3-style string hash → unsigned 32-bit seed (dates read as drawn, {@link asDrawn}). */
export function hashStringToSeed(raw: string): number {
  const input = asDrawn(raw)
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** A deterministic RNG for one identified slot/stream of the seed. */
export function slotRng(seed: number, ...parts: readonly string[]): Rng {
  return mulberry32(hashStringToSeed(`${seed}|${parts.join('|')}`))
}
