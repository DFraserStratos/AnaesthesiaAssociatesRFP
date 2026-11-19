/**
 * The clean cut from Solutions Plus (catch-up Phase 42; US-13.4.2, US-13.4.3).
 *
 * Solutions Plus would not export, so its operation list arrives as a printed
 * scan: names only, with a unit value per line that is not reliable and junk
 * among the names. The go-live demo shows it beside AA's decisions; nothing
 * comes across because it exists in Solutions Plus. No Solutions Plus
 * identifier is carried (the scan-row number is the only reference) and its
 * units are kept only to be shown struck through: nothing that loads reads
 * them. Pure.
 */

import type { GoLiveCandidate } from './types'

/** One line of the printed operation list, as transcribed from the scan. */
export interface SolutionsPlusOperation {
  scanRow: number
  name: string
  /** As printed; never read into anything that loads. */
  spUnits: number | null
}

/** The scanned list (fictional names and units for the demo), in scan order. */
export const SOLUTIONS_PLUS_OPERATIONS: readonly SolutionsPlusOperation[] = [
  { scanRow: 1, name: 'Laparoscopic cholecystectomy', spUnits: 7 },
  { scanRow: 2, name: 'Inguinal hernia repair', spUnits: 5 },
  { scanRow: 3, name: '10% discount', spUnits: null },
  { scanRow: 4, name: 'Carpal tunnel release', spUnits: 4 },
  { scanRow: 5, name: 'DO NOT USE - old code', spUnits: 3 },
  { scanRow: 6, name: 'Tonsillectomy', spUnits: 5 },
  { scanRow: 7, name: 'Test op', spUnits: 1 },
  { scanRow: 8, name: 'Knee arthroscopy', spUnits: 6 },
  { scanRow: 9, name: 'Misc', spUnits: 2 },
  { scanRow: 10, name: 'LAPAROSCOPIC  CHOLECYSTECTOMY ', spUnits: 9 },
  { scanRow: 11, name: 'Gastric bypass, laparoscopic', spUnits: 12 },
  { scanRow: 12, name: 'Varicose vein stripping', spUnits: 6 },
  { scanRow: 13, name: 'Septoplasty', spUnits: 5 },
  { scanRow: 14, name: 'Hip arthroscopy', spUnits: 8 },
]

/** AA's recorded decisions on the names that are not junk: the two it has not approved, with why. */
export const AA_NOT_APPROVED: Readonly<Record<number, string>> = {
  6: 'No longer performed by AA members',
  12: 'Replaced by a newer operation name',
}

/** A name folded for matching: case, spacing and punctuation ignored. */
export function normaliseOperationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}

/** Why a name is junk on its own, or null when it reads like an operation. */
export function junkReason(name: string): string | null {
  const t = name.trim()
  if (/%/.test(t) || /\bdiscount\b/i.test(t)) return 'Looks like a pricing note, not an operation'
  if (/do not use/i.test(t)) return 'Marked not for use'
  if (/^(test\b|misc\b|miscellaneous\b|tbc\b|n\/a$)/i.test(t)) return 'Not an operation'
  return null
}

/**
 * The candidates with AA's decision on each: junk by `junkReason` or as a
 * repeat of an earlier scan row ("Duplicate of scan row N"), not approved
 * where AA recorded so, approved otherwise.
 */
export function goLiveCandidates(
  operations: readonly SolutionsPlusOperation[] = SOLUTIONS_PLUS_OPERATIONS,
  notApproved: Readonly<Record<number, string>> = AA_NOT_APPROVED,
): GoLiveCandidate[] {
  const seen = new Map<string, number>()
  return operations.map((op) => {
    const base = { scanRow: op.scanRow, name: op.name, spUnits: op.spUnits }
    const junk = junkReason(op.name)
    if (junk !== null) return { ...base, decision: 'junk' as const, reason: junk }
    const key = normaliseOperationName(op.name)
    const earlier = seen.get(key)
    if (earlier !== undefined) return { ...base, decision: 'junk' as const, reason: `Duplicate of scan row ${earlier}` }
    seen.set(key, op.scanRow)
    const why = notApproved[op.scanRow]
    if (why !== undefined) return { ...base, decision: 'notApproved' as const, reason: why }
    return { ...base, decision: 'approved' as const }
  })
}
