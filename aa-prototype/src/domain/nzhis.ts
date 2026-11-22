/**
 * NZHIS ethnicity coding (demo subset).
 *
 * The RFP mandates NZHIS Level 4 (5-digit) ethnicity codes on patient records
 * (7th review B19). The NHI lookup via the Digital Services Hub lives in
 * `nhiRegister/` (the synthetic register) and `shared/nhiHub` (the simulated
 * Hub), catch-up Phase 40a.
 */

export interface EthnicityCodeEntry {
  /** NZHIS Level 4 code (5 digits). */
  code: string
  label: string
  /** The Level 1 group the code rolls up to. */
  level1Group: string
}

/**
 * demo subset — not the authoritative HISO/Ministry of Health code table.
 * A curated dozen Level 4 codes spanning the six Level 1 groups (European,
 * Māori, Pacific Peoples, Asian, MELAA, Other Ethnicity), enough to exercise
 * capture, quarantine and the Phase 11 FHIR bundles.
 */
export const ETHNICITY_DEMO_SUBSET: readonly EthnicityCodeEntry[] = [
  { code: '11111', label: 'New Zealand European', level1Group: 'European' },
  { code: '21111', label: 'Māori', level1Group: 'Māori' },
  { code: '31111', label: 'Samoan', level1Group: 'Pacific Peoples' },
  { code: '32111', label: 'Cook Islands Māori', level1Group: 'Pacific Peoples' },
  { code: '33111', label: 'Tongan', level1Group: 'Pacific Peoples' },
  { code: '41111', label: 'Filipino', level1Group: 'Asian' },
  { code: '42111', label: 'Chinese', level1Group: 'Asian' },
  { code: '43111', label: 'Indian', level1Group: 'Asian' },
  { code: '51111', label: 'Middle Eastern', level1Group: 'MELAA' },
  { code: '52111', label: 'Latin American', level1Group: 'MELAA' },
  { code: '53111', label: 'African', level1Group: 'MELAA' },
  { code: '61118', label: 'New Zealander', level1Group: 'Other Ethnicity' },
] as const

const SUBSET_BY_CODE: ReadonlyMap<string, EthnicityCodeEntry> = new Map(
  ETHNICITY_DEMO_SUBSET.map((e) => [e.code, e]),
)

/**
 * Three-way verdict (7th review B19). A well-formed code outside the curated
 * subset is NEVER labelled "invalid" — it may be a real NZHIS L4 code this
 * demo simply doesn't carry.
 */
export type EthnicityValidation =
  | { verdict: 'valid'; code: string; label: string; level1Group: string }
  | { verdict: 'outsideDemoSubset'; code: string; message: string }
  | { verdict: 'malformed'; input: string; reason: string }

export function validateEthnicityCode(code: string): EthnicityValidation {
  const trimmed = code.trim()
  if (!/^\d{5}$/.test(trimmed)) {
    return {
      verdict: 'malformed',
      input: trimmed,
      reason: 'An NZHIS Level 4 ethnicity code is 5 digits.',
    }
  }
  const entry = SUBSET_BY_CODE.get(trimmed)
  if (entry === undefined) {
    return {
      verdict: 'outsideDemoSubset',
      code: trimmed,
      message:
        'This may be a valid NZHIS Level 4 code; this demo validates against a curated subset.',
    }
  }
  return {
    verdict: 'valid',
    code: entry.code,
    label: entry.label,
    level1Group: entry.level1Group,
  }
}

/** A stored ethnicity code as shown on a Booking or record: "21111 · Māori", or the bare code outside the demo subset (catch-up Phase 40). */
export function ethnicityText(code: string): string {
  const entry = SUBSET_BY_CODE.get(code)
  return entry === undefined ? code : `${entry.code} · ${entry.label}`
}
