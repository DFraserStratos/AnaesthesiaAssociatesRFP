/**
 * AI-made, illustrative source wording, not from AA: AR-35,
 * notes/2026-10-08-procedure-picker-and-source-text.md, "Illustrative source
 * wording" (its Markdown slug `AR-35#illustrative-source-wording`). RVG codes as
 * printed in the NZSA RVG 2021; only WLE MM, RTK, blephs, wide local excision,
 * right total knee and row 27 come from AA's meeting.
 *
 * Catch-up Phase 20a seeds the rows used here as Procedures' texts (US-02.5.7):
 * only the table's "As received" column, its source and, where the Contract
 * prices from RVG units, its "RVG code". Its "Procedure (invoice wording)"
 * column is a procedure-list idea that has gone, and is not used. Nothing here
 * adds an RVG group entry. Never presented as AA's data.
 */

import type { ProcedureTextSource } from '../types'

export interface SourceWordingRow {
  /** The row number in AR-35's table. */
  row: number
  /** "As received", exactly as the table prints it. */
  asReceived: string
  source: ProcedureTextSource
  /** The printed RVG code the table suggests, where the seed uses one. */
  rvgCode?: string
}

/** The rows the seed and the demo action use, by AR-35 row number. */
export const SOURCE_WORDING = {
  1: { row: 1, asReceived: 'RTK', source: 'surgeonPdf', rvgCode: 'LL4' },
  2: { row: 2, asReceived: 'right total knee', source: 'hospitalDownload', rvgCode: 'LL4' },
  3: { row: 3, asReceived: 'L TKJR', source: 'surgeonPdf', rvgCode: 'LL4' },
  6: { row: 6, asReceived: 'L knee scope + partial menisectomy', source: 'surgeonPdf', rvgCode: 'LL1' },
  8: { row: 8, asReceived: 'ORIF # R dist radius', source: 'email', rvgCode: 'UL2' },
  11: { row: 11, asReceived: 'lap chole +/- IOC', source: 'surgeonPdf', rvgCode: 'A3' },
  12: { row: 12, asReceived: 'lap chole', source: 'hospitalDownload', rvgCode: 'A3' },
  13: { row: 13, asReceived: 'R inguinal hernia mesh', source: 'surgeonPdf', rvgCode: 'A2' },
  // AR-35 lists row 14 as an email; the seed carries it on a hospital feed (our reuse, logged).
  14: { row: 14, asReceived: 'lap appy ?conv to open', source: 'hospitalFeed', rvgCode: 'A3' },
  15: { row: 15, asReceived: 'gastro/colon', source: 'surgeonPdf' },
  17: { row: 17, asReceived: 'blephs', source: 'surgeonPdf' },
  20: { row: 20, asReceived: 'T&A', source: 'hospitalDownload', rvgCode: 'H2' },
  21: { row: 21, asReceived: 'hystero D&C', source: 'surgeonPdf', rvgCode: 'P1' },
  25: { row: 25, asReceived: 'TURP', source: 'hospitalDownload', rvgCode: 'P4' },
  26: { row: 26, asReceived: 'WLE MM', source: 'surgeonPdf' },
  27: {
    row: 27,
    asReceived: 'WLE MM, left shoulder + flap repair + SNB + excision SCC and flap, left sternum + BCC',
    source: 'hospitalFeed',
    rvgCode: 'T1',
  },
  34: { row: 34, asReceived: 'L3-5 decomp + fusion', source: 'email', rvgCode: 'S9b' },
  35: { row: 35, asReceived: 'EUA +/- cysto +/- biopsy', source: 'surgeonPdf' },
} as const satisfies Record<number, SourceWordingRow>

/**
 * The hospital wordings "Hospital description arrives" offers (rows 2, 12, 20
 * and 25), each with the rooms' wording AR-35 pairs it with, so the demo
 * action defaults to the matching hospital text.
 */
export const HOSPITAL_DESCRIPTION_CHOICES: readonly { row: number; text: string; pairsWith?: string }[] = [
  { row: 2, text: SOURCE_WORDING[2].asReceived, pairsWith: SOURCE_WORDING[1].asReceived },
  { row: 12, text: SOURCE_WORDING[12].asReceived, pairsWith: SOURCE_WORDING[11].asReceived },
  { row: 20, text: SOURCE_WORDING[20].asReceived },
  { row: 25, text: SOURCE_WORDING[25].asReceived },
]
