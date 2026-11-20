/**
 * Finding NHIs in free text (catch-up Phase 43; US-15.0.6): every token of
 * either NHI shape (current AAANNNC, new AAANNAX; letters excluding I and O;
 * any case) that also passes the check digit (`validateNhi`), wherever it sits
 * (inside JSON, after punctuation). A look-alike that fails the check digit is
 * not an NHI and is not flagged. Pure: the diagnostics log redacts with it and
 * the leak scan counts with it.
 */

import { validateNhi } from '../nhi'

/** Seven characters of either shape, not part of a longer run of letters or digits. */
const NHI_TOKEN = /(?<![A-Za-z0-9])[A-HJ-NP-Za-hj-np-z]{3}(?:\d{4}|\d{2}[A-HJ-NP-Za-hj-np-z]{2})(?![A-Za-z0-9])/g

/** Every valid NHI in `text`, upper-cased, in order of appearance. */
export function findNhiTokens(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(NHI_TOKEN)) {
    const v = validateNhi(m[0])
    if (v.valid) out.push(v.normalised)
  }
  return out
}

/** `text` with each valid NHI replaced by "[NHI]". */
export function redactNhis(text: string): string {
  return text.replace(NHI_TOKEN, (token) => (validateNhi(token).valid ? '[NHI]' : token))
}

/** `text` with each valid NHI masked in place ("ZAA••••"), whatever its case. */
export function maskNhisIn(text: string): string {
  return text.replace(NHI_TOKEN, (token) => (validateNhi(token).valid ? maskNhi(token.toUpperCase()) : token))
}

/** An NHI as a report may show it: the first three characters, the rest masked ("ZAA••••"). */
export function maskNhi(nhi: string): string {
  return `${nhi.slice(0, 3)}${'•'.repeat(Math.max(0, nhi.length - 3))}`
}
