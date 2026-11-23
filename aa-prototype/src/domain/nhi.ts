/**
 * NHI validation & generation — both formats (US-11.1.2), with the
 * check-digit maths corrected to the official Health NZ algorithms (Decisions
 * log 2026-07-22): US-11.1.2 still labels the current format "modulus 24",
 * which appears to conflate the 24-letter alphabet with the modulus — its own
 * example ZAA0067 validates only under mod 11. The new format is mod 23 as
 * labelled (example ACA31FM validates). The Validators tab flags the label for
 * AA to confirm (catch-up Phase 44); the catalogue text still needs correcting.
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

/**
 * Every reason `validateNhi` gives, in one place, rendered verbatim in the UI
 * (catch-up Phase 40a: `nhiEntryFeedback` reuses them, so no copy drifts).
 */
export const NHI_REASONS = {
  length: 'An NHI is exactly 7 characters.',
  letterIO: 'The letters I and O are never used in an NHI.',
  remainderZero: 'This combination is never assigned (checksum remainder 0).',
  checkDigit: 'The check digit does not match.',
  checkLetter: 'The check letter does not match.',
  shape: 'Not a recognised NHI shape (AAA1234 or AAA12AB).',
  /** The fallback where a reason is missing. */
  notValid: 'The NHI is not valid.',
} as const

/** The NHI field's shape hint while fewer than 7 characters are typed. */
export const NHI_SHAPE_HINT = '7 characters, AAA1234 or AAA12AB'

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
      reason: NHI_REASONS.length,
    }
  }
  if (/[IO]/.test(normalised)) {
    return {
      normalised,
      format: null,
      valid: false,
      reason: NHI_REASONS.letterIO,
    }
  }

  if (CURRENT_SHAPE.test(normalised)) {
    const remainder = weightedSum(normalised) % 11
    if (remainder === 0) {
      return {
        normalised,
        format: 'current',
        valid: false,
        reason: NHI_REASONS.remainderZero,
      }
    }
    const expected = 11 - remainder === 10 ? 0 : 11 - remainder
    const actual = Number(normalised.charAt(6))
    if (actual !== expected) {
      return {
        normalised,
        format: 'current',
        valid: false,
        reason: NHI_REASONS.checkDigit,
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
        reason: NHI_REASONS.remainderZero,
      }
    }
    const expected = NHI_ALPHABET.charAt(23 - remainder - 1)
    const actual = normalised.charAt(6)
    if (actual !== expected) {
      return {
        normalised,
        format: 'new',
        valid: false,
        reason: NHI_REASONS.checkLetter,
      }
    }
    return { normalised, format: 'new', valid: true }
  }

  return {
    normalised,
    format: null,
    valid: false,
    reason: NHI_REASONS.shape,
  }
}

/** The NHI field's verdict as it is typed (catch-up Phase 40a, US-14.4.1, US-11.1.2). */
export interface NhiEntryFeedback {
  state: 'empty' | 'incomplete' | 'invalid' | 'valid'
  normalised: string
  format?: NhiFormat
  reason?: string
}

/**
 * Feedback while an NHI is typed, built on `validateNhi` alone (no second
 * regex): an I or O is flagged at once at any length; fewer than 7 characters
 * is `incomplete` (the field shows the shape hint); at 7 the validator's own
 * verdict and reason; more than 7 is invalid. Only a `valid` NHI is ever looked up.
 */
export function nhiEntryFeedback(input: string): NhiEntryFeedback {
  const normalised = input.trim().toUpperCase()
  if (normalised === '') return { state: 'empty', normalised }
  if (normalised.includes('I') || normalised.includes('O')) {
    return { state: 'invalid', normalised, reason: NHI_REASONS.letterIO }
  }
  if (normalised.length < 7) return { state: 'incomplete', normalised }
  const verdict = validateNhi(normalised)
  if (verdict.valid && verdict.format !== null) return { state: 'valid', normalised, format: verdict.format }
  return {
    state: 'invalid',
    normalised,
    ...(verdict.format !== null ? { format: verdict.format } : {}),
    reason: verdict.reason ?? NHI_REASONS.shape,
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
