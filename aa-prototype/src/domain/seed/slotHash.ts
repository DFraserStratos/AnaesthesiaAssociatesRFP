/**
 * Slot-hashed randomness for the canvas generator (Phase 02, decision 2 in
 * PROGRESS): each slot derives its own RNG from a string hash of
 * (seed, anaesthetist, date, session) instead of drawing from one sequential
 * stream. Generation is therefore ORDER-INDEPENDENT — rolling the horizon
 * forward day by day produces byte-identical Lists to seeding the whole
 * horizon at once, which is what makes the roll-forward guard test provable.
 */

import { mulberry32, type Rng } from '../rng'

/** xmur3-style string hash → unsigned 32-bit seed. */
export function hashStringToSeed(input: string): number {
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
