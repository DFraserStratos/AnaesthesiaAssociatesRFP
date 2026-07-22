/**
 * NHI validation & generation — both formats per RFP Appendix 1, with the
 * check-digit maths corrected to the official Health NZ algorithms (Decisions
 * log 2026-07-22): the RFP labels the current format "Modulus 24", which
 * appears to conflate the 24-letter alphabet with the modulus — its own
 * example ZAA0067 validates only under mod 11. The new format is mod 23 as
 * labelled (example ACA31FM validates). Flagged as an RFP reading / discovery
 * item where REQUIREMENTS D8 repeats the label.
 *
 * Formats:
 *  - current `AAANNNC` — 3 letters, 3 digits, 1 numeric check digit
 *  - new     `AAANNAX` — 3 letters, 2 digits, 1 letter, 1 alphabetic check letter
 */

import type { Rng } from './rng'

/** The NHI alphabet: A–Z minus I and O (24 letters, values 1–24). */
export const NHI_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Positional weights across characters 1–6. */
const WEIGHTS = [7, 6, 5, 4, 3, 2] as const

export type NhiFormat = 'current' | 'new'

export interface NhiValidation {
  /** Trimmed, uppercased input. */
  normalised: string
  /** Detected by character classes (unambiguous); null when neither shape fits. */
  format: NhiFormat | null
  valid: boolean
  /** Human-readable, rendered verbatim in UI — keep it plain. */
  reason?: string
}

/** 1-based alphabet value of a letter (0 if not in the NHI alphabet). */
function alphabetValue(ch: string): number {
  return NHI_ALPHABET.indexOf(ch) + 1
}

const CURRENT_SHAPE = /^[A-HJ-NP-Z]{3}\d{4}$/
const NEW_SHAPE = /^[A-HJ-NP-Z]{3}\d{2}[A-HJ-NP-Z]{2}$/

/** Weighted sum over characters 1–6 (letters by alphabet value, digits by face value). */
function weightedSum(normalised: string): number {
  let sum = 0
  for (let i = 0; i < 6; i++) {
    const ch = normalised.charAt(i)
    const value = ch >= '0' && ch <= '9' ? Number(ch) : alphabetValue(ch)
    sum += value * (WEIGHTS[i] ?? 0)
  }
  return sum
}

export function validateNhi(input: string): NhiValidation {
  const normalised = input.trim().toUpperCase()

  if (normalised.length !== 7) {
    return {
      normalised,
      format: null,
      valid: false,
      reason: 'An NHI is exactly 7 characters.',
    }
  }
  if (/[IO]/.test(normalised)) {
    return {
      normalised,
      format: null,
      valid: false,
      reason: 'The letters I and O are never used in an NHI.',
    }
  }

  if (CURRENT_SHAPE.test(normalised)) {
    const remainder = weightedSum(normalised) % 11
    if (remainder === 0) {
      return {
        normalised,
        format: 'current',
        valid: false,
        reason: 'This combination is never assigned (checksum remainder 0).',
      }
    }
    const expected = 11 - remainder === 10 ? 0 : 11 - remainder
    const actual = Number(normalised.charAt(6))
    if (actual !== expected) {
      return {
        normalised,
        format: 'current',
        valid: false,
        reason: 'The check digit does not match.',
      }
    }
    return { normalised, format: 'current', valid: true }
  }

  if (NEW_SHAPE.test(normalised)) {
    const remainder = weightedSum(normalised) % 23
    if (remainder === 0) {
      return {
        normalised,
        format: 'new',
        valid: false,
        reason: 'This combination is never assigned (checksum remainder 0).',
      }
    }
    const expected = NHI_ALPHABET.charAt(23 - remainder - 1)
    const actual = normalised.charAt(6)
    if (actual !== expected) {
      return {
        normalised,
        format: 'new',
        valid: false,
        reason: 'The check letter does not match.',
      }
    }
    return { normalised, format: 'new', valid: true }
  }

  return {
    normalised,
    format: null,
    valid: false,
    reason: 'Not a recognised NHI shape (AAA1234 or AAA12AB).',
  }
}

/**
 * Generate a valid fictional NHI in the given format. Regenerates on the
 * remainder-0 (never-assigned) case, so the output always validates.
 * Deterministic for a given RNG state — the Phase 02 seeder relies on this.
 */
export function generateNhi(format: NhiFormat, rng: Rng): string {
  for (;;) {
    const letter = () => NHI_ALPHABET.charAt(Math.floor(rng() * NHI_ALPHABET.length))
    const digit = () => String(Math.floor(rng() * 10))

    const prefix =
      format === 'current'
        ? letter() + letter() + letter() + digit() + digit() + digit()
        : letter() + letter() + letter() + digit() + digit() + letter()

    if (format === 'current') {
      const remainder = weightedSum(prefix + '0') % 11
      if (remainder === 0) continue
      const check = 11 - remainder === 10 ? 0 : 11 - remainder
      return prefix + String(check)
    }

    const remainder = weightedSum(prefix + 'A') % 23
    if (remainder === 0) continue
    return prefix + NHI_ALPHABET.charAt(23 - remainder - 1)
  }
}
