/**
 * The seeded modifier master and the seed's claims (catch-up Phase 19b,
 * US-05.1.5, RV-38). The RVG rows come only from the generated table
 * (`rvgModifiers.generated.ts`, from the catalogue's AR-34 files); nothing here
 * types a modifier row. AA's own list (Vanessa's) has not been supplied, so no
 * AA row is seeded: the office adds one in Admin.
 */

import { modifierFromRvgRow, type Modifier, type ModifierClaim, type ModifierId } from '../billing/modifiers'
import { RVG_INCLUDED_MODIFIERS, RVG_MODIFIER_ROWS } from './rvgModifiers.generated'

/** The master's RVG rows, in table order. */
export const SEED_MODIFIERS: readonly Modifier[] = RVG_MODIFIER_ROWS.map(modifierFromRvgRow)

const BY_CODE = new Map(SEED_MODIFIERS.map((m) => [m.code, m]))

/** The seeded RVG modifier's id for a printed code (seed and tests only). */
export function seedModifierId(code: string): ModifierId {
  const modifier = BY_CODE.get(code)
  if (modifier === undefined) throw new Error(`No RVG modifier ${code}`)
  return modifier.id
}

/** The included modifiers per RVG code, from the catalogue's CSV (P1 on the 20 Neurosurgery and Spine codes). */
export const INCLUDED_MODIFIER_IDS_BY_RVG_CODE: ReadonlyMap<string, ModifierId[]> = (() => {
  const out = new Map<string, ModifierId[]>()
  for (const row of RVG_INCLUDED_MODIFIERS) {
    out.set(row.rvgCode, [...(out.get(row.rvgCode) ?? []), seedModifierId(row.includedModifier)])
  }
  return out
})()

/**
 * The seed's explanation for each claimed code: one short reason, as an
 * insurer would ask, so every seeded claim carries one.
 */
const SEED_EXPLANATIONS: Readonly<Record<string, string>> = {
  AS3: 'ASA III, severe systemic disease on pre-op review',
  AS4: 'ASA IV, severe systemic disease, a constant threat to life',
}

/** A seeded claim of an RVG modifier with its seeded explanation. */
export function seedClaim(code: string): ModifierClaim {
  const explanation = SEED_EXPLANATIONS[code]
  if (explanation === undefined) throw new Error(`No seeded explanation for ${code}`)
  return { modifierId: seedModifierId(code), explanation }
}

/**
 * The seed's ASA grade, as the original build recorded it, mapped to a claim
 * (RV-22: the ASA card and its seeding are gone; the grade is an optional
 * modifier). ASA I and II share AS1, worth 0, so they claim nothing; AS3 and
 * AS4 claim their code with an explanation.
 */
export function claimsForSeedAsa(asa: 'AS1' | 'AS2' | 'AS3' | 'AS4' | undefined): ModifierClaim[] {
  return asa === 'AS3' || asa === 'AS4' ? [seedClaim(asa)] : []
}
