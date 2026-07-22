/**
 * Modifier code master table.
 *
 * Unit values are DEMO-PLAUSIBLE figures within the RFP's stated example
 * ranges — NOT an authoritative NZSA schedule (Decisions log 2026-07-22;
 * discovery item: AA/NZSA to supply real values). The group SEMANTICS follow
 * the RFP's modifier table (RFP.md:1062-1097): PA = pre-assessment, A = age
 * extremes, AS = ASA seeding, ASE = emergency, OB = BMI banding, P = non-standard
 * positioning, AI = awake intubation, POSTOP = post-op care. All the RFP-named
 * groups are present.
 *
 * Phase 02's seeder treats this table as the ModifierCode master.
 */

import type { AsaClass, ModifierCode } from '../types'

export const MODIFIER_CODES: readonly ModifierCode[] = [
  // Pre-assessment (PA) — phone or face-to-face assessment before the
  // procedure; 1 to 4 units across the five codes (RFP: PA1-PA5, 1-4 units).
  { code: 'PA1', group: 'PA', units: 1, description: 'Pre-assessment, phone, brief' },
  { code: 'PA2', group: 'PA', units: 2, description: 'Pre-assessment, phone, complex' },
  { code: 'PA3', group: 'PA', units: 3, description: 'Pre-assessment, face-to-face, standard' },
  { code: 'PA4', group: 'PA', units: 4, description: 'Pre-assessment, face-to-face, complex' },
  { code: 'PA5', group: 'PA', units: 1, description: 'Pre-assessment, brief phone follow-up' },
  // Age extremes (A) — very young or very old patients (RFP: A1-A2, 1-2 units).
  // A1 carries the 1-unit value (pins the Ellison design-day fee); A2 the 2.
  { code: 'A1', group: 'A', units: 1, description: 'Age extreme, very old' },
  { code: 'A2', group: 'A', units: 2, description: 'Age extreme, very young' },
  // ASA physical status (AS) — the ASA seeding values (Decisions log 2026-07-22)
  { code: 'AS1', group: 'AS', units: 0, description: 'ASA 1, normal healthy patient' },
  { code: 'AS2', group: 'AS', units: 1, description: 'ASA 2, mild systemic disease' },
  { code: 'AS3', group: 'AS', units: 3, description: 'ASA 3, severe systemic disease' },
  { code: 'AS4', group: 'AS', units: 4, description: 'ASA 4, constant threat to life' },
  // ASA emergency
  { code: 'ASE', group: 'ASE', units: 2, description: 'Emergency surgery' },
  // Obesity (OB)
  { code: 'OB1', group: 'OB', units: 0, description: 'BMI under 30' },
  { code: 'OB2', group: 'OB', units: 1, description: 'BMI 30 to 35' },
  { code: 'OB3', group: 'OB', units: 2, description: 'BMI 35 to 40' },
  { code: 'OB4', group: 'OB', units: 3, description: 'BMI over 40' },
  // Positioning (P)
  { code: 'P1', group: 'P', units: 2, description: 'Non-supine positioning' },
  // Awake intubation (AI) — specific technique flag (RFP: AI1, +2 units).
  { code: 'AI1', group: 'AI', units: 2, description: 'Awake intubation' },
  // Post-op
  { code: 'PO1', group: 'POSTOP', units: 1, description: 'Post-op review, ward' },
  { code: 'PO2', group: 'POSTOP', units: 2, description: 'Post-op acute pain management' },
] as const

const BY_CODE: ReadonlyMap<string, ModifierCode> = new Map(MODIFIER_CODES.map((m) => [m.code, m]))

/** Resolve a modifier code from the master table. */
export function getModifierCode(code: string): ModifierCode | undefined {
  return BY_CODE.get(code)
}

/**
 * ASA seeding values (Decisions log 2026-07-22: demo-plausible, inside the
 * RFP's 0 to 4 range; AS3 = 3 is pinned by the phase checklist's paper
 * spot-check). Identical to the AS rows above — kept as a named map because
 * the ASA class is captured on the Procedure and seeds its AS modifier.
 */
export const ASA_SEED_UNITS: Readonly<Record<AsaClass, number>> = {
  AS1: 0,
  AS2: 1,
  AS3: 3,
  AS4: 4,
}
