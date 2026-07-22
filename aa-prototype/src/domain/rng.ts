/**
 * Seeded RNG — the deterministic randomness source for the whole prototype
 * (PROGRESS convention 5: same seed, identical data; never `Math.random()` in
 * domain logic). Phase 01 uses it for `generateNhi`; Phase 02's seeder reuses it.
 */

/** A random source: returns a float in [0, 1). */
export type Rng = () => number

/**
 * mulberry32 — a tiny, fast, seedable 32-bit PRNG. Quality is ample for demo
 * data; determinism is the point.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
