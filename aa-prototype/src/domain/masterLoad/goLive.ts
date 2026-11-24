/**
 * The go-live load (catch-up Phase 42; US-13.4.2, US-13.4.3): the Solutions
 * Plus names beside AA's decisions and the controlled spreadsheets, loaded
 * together. Only approved data loads, and it comes from the controlled
 * spreadsheets: figures land on RVG groups and on each Contract's price
 * ranges, never from Solutions Plus.
 *
 * US-13.4.3 no longer says what the names seed and there is no procedure
 * list, so a name is matched to a Contracts-sheet row by its invoice
 * description (a built default, logged for the owner). A Contracts row with
 * no Solutions Plus name loads as an AA addition, because names can come from
 * AA too; a row whose name AA has not approved, or that is junk, is rejected.
 * Pure.
 */

import { csvLine } from './csv'
import { normaliseOperationName } from './solutionsPlus'
import type { GoLiveCandidate, LoadEntity, RowResult } from './types'

export const NOT_APPROVED_FOR_GO_LIVE = 'Not approved for go-live.'

/** One controlled sheet of the pack. */
export interface GoLiveSheet {
  entity: LoadEntity
  fileName: string
  csv: string
}

const sheet = (entity: LoadEntity, fileName: string, rows: readonly (readonly string[])[]): GoLiveSheet => ({
  entity,
  fileName,
  csv: rows.map(csvLine).join('\n'),
})

/**
 * AA's controlled spreadsheets for the go-live demo, in pack order (a Party
 * before its Contracts, a Contract before its further price ranges). Fictional
 * people and figures; `.example` addresses.
 */
export const GO_LIVE_PACK: readonly GoLiveSheet[] = [
  sheet('surgeons', 'go-live-surgeons.csv', [
    ['Name', 'Specialty', 'Practice names', 'Practice emails', 'PA names', 'HPI CPN', 'NZ registration number'],
    ['Mr D. Penrose', 'General surgery', 'Halswell Surgical', 'reception@halswellsurgical.example', 'Tess', '93PENA', '91201'],
    ['Ms R. Kahu', 'Orthopaedics', 'Halswell Surgical', 'reception@halswellsurgical.example', 'Tess', '94KAHR', '91202'],
    ['Dr M. Feld', 'Orthopaedics; Plastic surgery', 'Halswell Surgical; Merivale Hand Clinic', 'reception@halswellsurgical.example; hands@merivalehand.example', 'Tess; Ana', '', '91203'],
  ]),
  sheet('rvgGroups', 'go-live-rvg-groups.csv', [
    ['Code', 'Description', 'Anatomy heading', 'Base units', 'Range from', 'Range to', 'Modifier units'],
    ['AA9', 'Hand and wrist, minor, AA go-live row', 'Upper extremities', '4', '', '', ''],
  ]),
  sheet('parties', 'go-live-parties.csv', [
    ['Name', 'Kind', 'Hospital', 'Billing name', 'Delivery', 'Email', 'Postal address'],
    ['Halswell Surgical Group', 'Surgeon group', '', 'Halswell Surgical Group Limited', 'Email', 'accounts@halswellsurgical.example', ''],
  ]),
  sheet('contracts', 'go-live-contracts.csv', [
    ['AA code', 'Name', 'Party', 'Holder reference code', 'Invoice description', 'Default RVG code', 'Bills', 'Payment type', 'Pricing kind', 'Unit rate', 'Discount (%)', 'Fixed price', 'Price from', 'Anaesthetist may override', 'Funding tag', 'Specialties', 'Surgeons', 'Anaesthetist'],
    ['HSG-GL01', 'Halswell lap chole', 'Halswell Surgical Group', 'LC-01', 'Laparoscopic cholecystectomy', '', 'Holder', 'Standard', 'Fixed price', '', '', '1450', '2026-04-01', 'No', '', 'General surgery', '93PENA', ''],
    ['HSG-GL02', 'Halswell hernia', 'Halswell Surgical Group', 'IH-01', 'Inguinal hernia repair', '', 'Holder', 'Standard', 'Fixed price', '', '', '980', '2026-04-01', 'No', '', 'General surgery', '93PENA', ''],
    ['HSG-GL03', 'Halswell carpal tunnel', 'Halswell Surgical Group', 'CT-01', 'Carpal tunnel release', 'AA9', 'Holder', 'Standard', 'Fixed price', '', '', '620', '2026-04-01', 'No', '', 'Orthopaedics', '94KAHR', ''],
    ['HSG-GL04', 'Halswell knee scope', 'Halswell Surgical Group', 'KA-01', 'Knee arthroscopy', '', 'Holder', 'Standard', 'Fixed price', '', '', '1100', '2026-04-01', 'No', '', 'Orthopaedics', '94KAHR', ''],
    ['HSG-GL05', 'Halswell tonsils', 'Halswell Surgical Group', 'TN-01', 'Tonsillectomy', '', 'Holder', 'Standard', 'Fixed price', '', '', '760', '2026-04-01', 'No', '', 'ENT', '', ''],
    ['HSG-GL06', 'Halswell hip scope', 'Halswell Surgical Group', 'HA-01', 'Hip arthroscopy', '', 'Holder', 'Standard', 'Fixed price', '', '', '1300', '', 'No', '', 'Orthopaedics', '', ''],
    ['HSG-GL07', 'Halswell RVG', 'Halswell Surgical Group', '', '', '', 'Holder', 'Standard', "RVG at the Contract's rate", '34', '', '', '', 'Yes', '', '', '93PENA; 94KAHR', ''],
  ]),
  sheet('priceRanges', 'go-live-price-ranges.csv', [
    ['AA code', 'Start date', 'Price (ex GST)'],
    ['HSG-GL01', '2026-11-04', '1490'],
    ['HSG-GL05', '2026-11-04', '780'],
  ]),
  sheet('publicHolidays', 'go-live-public-holidays-2027.csv', [
    ['Date', 'Name', 'Kind', 'Region', 'Open hospitals'],
    ['2027-07-30', 'Good Friday', 'National', '', ''],
    ['2027-08-02', 'Easter Monday', 'National', '', ''],
    ['2027-08-30', 'ANZAC Day (observed)', 'National', '', ''],
    ['2027-10-11', "King's Birthday", 'National', '', ''],
  ]),
]

/** The Contracts sheet's invoice description column, the join to a Solutions Plus name. */
export const INVOICE_DESCRIPTION_HEADER = 'Invoice description'

/** The candidate a Contracts-sheet row's invoice description names, if any. */
export function candidateForDescription(candidates: readonly GoLiveCandidate[], description: string): GoLiveCandidate | undefined {
  const key = normaliseOperationName(description)
  if (key === '') return undefined
  // A junk duplicate names the same operation as an earlier row: the earlier row decides.
  return candidates.find((c) => c.decision !== 'junk' && normaliseOperationName(c.name) === key) ?? candidates.find((c) => normaliseOperationName(c.name) === key)
}

/** Whether a Contracts-sheet row is held back by AA's decision on its name (not approved, or junk). */
export function blockedByDecision(candidates: readonly GoLiveCandidate[], description: string): boolean {
  const c = candidateForDescription(candidates, description)
  return c !== undefined && c.decision !== 'approved'
}

export type GoLiveOutcome =
  | { kind: 'loads'; rowNumber: number }
  | { kind: 'notApproved'; reason: string }
  | { kind: 'junk'; reason: string }
  | { kind: 'noControlledRow' }
  | { kind: 'alreadyInMaster' }
  | { kind: 'controlledRowRejected'; rowNumber: number; reasons: string[] }

/**
 * One outcome per candidate: junk and not-approved names never load; an
 * approved name loads only through a valid Contracts-sheet row whose invoice
 * description is the name; a name a Contract already carries needs nothing.
 */
export function evaluateGoLive(
  candidates: readonly GoLiveCandidate[],
  contractsSheet: { header: readonly string[]; rows: readonly RowResult[] } | undefined,
  descriptionsInMaster: ReadonlySet<string>,
): Map<number, GoLiveOutcome> {
  const out = new Map<number, GoLiveOutcome>()
  const col = contractsSheet?.header.indexOf(INVOICE_DESCRIPTION_HEADER) ?? -1
  for (const c of candidates) {
    if (c.decision === 'junk') {
      out.set(c.scanRow, { kind: 'junk', reason: c.reason ?? 'Not an operation' })
      continue
    }
    if (c.decision === 'notApproved') {
      out.set(c.scanRow, { kind: 'notApproved', reason: c.reason ?? 'Not approved by AA' })
      continue
    }
    const key = normaliseOperationName(c.name)
    if (descriptionsInMaster.has(key)) {
      out.set(c.scanRow, { kind: 'alreadyInMaster' })
      continue
    }
    const row = col < 0 ? undefined : contractsSheet!.rows.find((r) => normaliseOperationName(r.cells[col] ?? '') === key)
    if (row === undefined) out.set(c.scanRow, { kind: 'noControlledRow' })
    else if (row.status === 'valid') out.set(c.scanRow, { kind: 'loads', rowNumber: row.rowNumber })
    else out.set(c.scanRow, { kind: 'controlledRowRejected', rowNumber: row.rowNumber, reasons: row.reasons })
  }
  return out
}

/** The words for an outcome: "Loads", or why not. */
export function outcomeText(o: GoLiveOutcome): string {
  switch (o.kind) {
    case 'loads':
      return 'Loads'
    case 'notApproved':
      return `Not loaded: not approved by AA (${o.reason})`
    case 'junk':
      return `Not loaded: excluded (${o.reason})`
    case 'noControlledRow':
      return 'Not loaded: no Contract in the controlled spreadsheet'
    case 'alreadyInMaster':
      return 'Not loaded: already in master data'
    case 'controlledRowRejected':
      return `Not loaded: the spreadsheet row was rejected (${o.reasons.join(' ')})`
  }
}
