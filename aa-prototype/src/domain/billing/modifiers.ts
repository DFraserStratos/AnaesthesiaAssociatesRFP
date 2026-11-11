/**
 * Modifiers: the one rule module (catch-up Phase 19b; DM-44, US-03.3.4,
 * US-03.3.8, US-05.1.4, US-05.1.5). The only place that decides which
 * modifiers are pre-applied, the age bands, what a claim may be, and the M
 * total a Procedure's modifiers come to. Pricing (`fee.ts resolveBtm`), the
 * store actions, the completion backstop and the capture UI all read it.
 *
 * - The modifier master is the NZSA RVG 2021 table as printed (generated from
 *   the catalogue, `seed/rvgModifiers.generated.ts`) plus AA's own. Codes are
 *   not keys (A1, A2 and P1 are also RVG base codes): every modifier has a
 *   hidden id. A value that is not a plain whole number ("2 + Time", "4-6")
 *   has `units: null` and is entered when it is claimed.
 * - Only two kinds of modifier are pre-applied, both shown selected and both
 *   removable (nothing is locked; Donald, 20 October; OQ-95 part 2, Ben 27
 *   October): the age modifier from the patient's age on the procedure date,
 *   and the modifiers an RVG group's base units include (P1 at 0 units on the
 *   20 Neurosurgery and Spine groups, D43). They are derived, never stored; a
 *   removal is stored on the Procedure (`removedModifierIds`).
 * - Every other modifier, the ASA grade included, is optional and is claimed
 *   with a short explanation. No stacking limit (a policy matter, OQ-95 part
 *   2): any modifier can sit beside any other; only the same one never twice.
 */

import type { RvgGroup } from './rvgGroups'

// ---------------------------------------------------------------------------
// Types (defined here; domain/types.ts re-exports them)
// ---------------------------------------------------------------------------

/** Seeded `MOD-RVG-PA1`, `MOD-RVG-POC1`; allocated at runtime `MOD-AA-001`. Never shown. */
export type ModifierId = string

/** One modifier in the master: an RVG row as printed, or one of AA's own. */
export interface Modifier {
  id: ModifierId
  /** As printed ("POC 1" keeps its space). Not unique across sources. */
  code: string
  /** The printed block it sits in (Pre-assessment, Age, ASA, ...); AA's own read "AA's own". */
  block: string
  /** The modifying factor, as printed. */
  factor: string
  /** The units as printed ("2", "2 + Time", "4-6", "As Per T1/T2"). */
  unitsAsPrinted: string
  /** The whole number when the printed value is one, else null (entered at capture). */
  units: number | null
  /** How the modifier is recognised (the transcription's trigger column). */
  trigger?: string
  /** Pre-applied from the patient's age (A1, A2). */
  appliedFrom?: 'age'
  source: 'rvg' | 'aa'
  /** The RVG page it is printed on. */
  page?: number
}

/** An optional modifier claimed on a Procedure (stored). */
export interface ModifierClaim {
  modifierId: ModifierId
  /** Set only for a modifier whose printed value is not a plain number. */
  units?: number
  /** A short explanation, as an insurer would ask (required, at most 200 characters). */
  explanation: string
}

/** Where a Procedure's modifier came from. */
export type ModifierOrigin = 'chosen' | 'age' | 'included'

/** One row of a Procedure's itemised modifiers (derived, never stored). */
export interface ProcedureModifier {
  modifierId: ModifierId
  code: string
  /** The printed factor. */
  label: string
  units: number
  explanation?: string
  origin: ModifierOrigin
  /** Why a pre-applied modifier is there ("From the patient's age (72) on the procedure date"). */
  detail?: string
  /** Set on a claim that adds nothing (a duplicate, or not in the master). */
  refused?: string
}

/** The longest explanation a claim may carry. */
export const MODIFIER_EXPLANATION_MAX = 200

// ---------------------------------------------------------------------------
// Age (US-03.3.8; D29's default, OQ-95 part 1 still open)
// ---------------------------------------------------------------------------

export interface AgeBand {
  /** Completed years, inclusive. */
  from: number
  /** Completed years, inclusive; open-ended when absent. */
  to?: number
  code: 'A1' | 'A2'
}

/**
 * The age bands, D29's default reading of the printed rows (RVG p.12):
 *   A1 "Age >1, and/but <2, 70-80-year-old" (1 unit)
 *   A2 "Age < 1 year old and/but > 80-year-old" (2 units)
 * Age in completed years on the procedure date, lower bounds inclusive as
 * printed: under 1 is A2, 1 is A1, 2 to 69 none, 70 to 79 A1, 80 and over A2.
 * PROVISIONAL until AA confirms the boundaries (OQ-95 part 1): an answer is a
 * change here and to `noAgeModifier` on the RVG groups, and their tests.
 */
export const AGE_BANDS: readonly AgeBand[] = [
  { from: 0, to: 0, code: 'A2' },
  { from: 1, to: 1, code: 'A1' },
  { from: 70, to: 79, code: 'A1' },
  { from: 80, code: 'A2' },
]

function parseIsoDate(iso: string): [number, number, number] | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m === null) return undefined
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/**
 * Completed years between a date of birth and a date (both `YYYY-MM-DD`,
 * string based, no clock). A 29 February birthday completes its year on
 * 1 March in a common year. Undefined when either date is malformed or the
 * date is before the birth.
 */
export function ageInCompletedYears(dobISO: string, onISO: string): number | undefined {
  const dob = parseIsoDate(dobISO)
  const on = parseIsoDate(onISO)
  if (dob === undefined || on === undefined) return undefined
  const [y1, m1, d1] = dob
  const [y2, m2, d2] = on
  let age = y2 - y1
  if (m2 < m1 || (m2 === m1 && d2 < d1)) age -= 1
  return age < 0 ? undefined : age
}

/** The age modifier's code for an age in completed years (none outside the bands). */
export function ageModifierCodeFor(age: number): 'A1' | 'A2' | undefined {
  return AGE_BANDS.find((b) => age >= b.from && (b.to === undefined || age <= b.to))?.code
}

// ---------------------------------------------------------------------------
// Lookup and words
// ---------------------------------------------------------------------------

type Master = Readonly<Record<ModifierId, Modifier>>

/** An RVG modifier by its printed code (the age rule's lookup). */
export function rvgModifierByCode(modifiers: Master, code: string): Modifier | undefined {
  return Object.values(modifiers).find((m) => m.source === 'rvg' && m.code === code)
}

/** "2" for a plain value, else the printed value ("2 + Time"). */
export function modifierUnitsText(modifier: Modifier): string {
  return modifier.units !== null ? String(modifier.units) : modifier.unitsAsPrinted
}

/**
 * The bounds the printed value puts on entered units (a value that is not a
 * plain number): "2 [Max]" is 1 to 2, "4-6" is 4 to 6, "2 + Time" at least 2,
 * "1 [Per Call]" at least 1; anything else ("As Per T1/T2") at least 1.
 */
export function enteredUnitsBounds(modifier: Pick<Modifier, 'unitsAsPrinted'>): { min: number; max?: number } {
  const printed = modifier.unitsAsPrinted
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(printed)
  if (range !== null) return { min: Number(range[1]), max: Number(range[2]) }
  const cap = /^(\d+)\s*\[Max\]$/i.exec(printed)
  if (cap !== null) return { min: 1, max: Number(cap[1]) }
  const floor = /^(\d+)/.exec(printed)
  return { min: floor !== null ? Math.max(1, Number(floor[1])) : 1 }
}

/** Entered units are a whole number within the printed value's bounds. */
export function validEnteredUnits(units: number | undefined, modifier?: Pick<Modifier, 'unitsAsPrinted'>): boolean {
  if (units === undefined || !Number.isInteger(units) || units < 1) return false
  if (modifier === undefined) return true
  const { min, max } = enteredUnitsBounds(modifier)
  return units >= min && (max === undefined || units <= max)
}

/** "Enter the units for PA5 (RVG: 2 [Max], at most 2)." and the like. */
function enteredUnitsHint(modifier: Modifier): string {
  const { min, max } = enteredUnitsBounds(modifier)
  const bound = max !== undefined ? (min === max ? `, ${min}` : min > 1 ? `, ${min} to ${max}` : `, at most ${max}`) : min > 1 ? `, at least ${min}` : ''
  return `RVG: ${modifier.unitsAsPrinted}${bound}`
}

/** True when the anaesthetist enters the units on claiming (the printed value is not a plain number). */
export function needsEnteredUnits(modifier: Modifier): boolean {
  return modifier.units === null
}

/** The block AA's own modifiers sit under. */
export const AA_OWN_BLOCK = "AA's own"

/** The printed blocks in table order, then AA's own. */
export function modifierBlocks(modifiers: Master): string[] {
  const out: string[] = []
  for (const m of Object.values(modifiers)) if (m.source === 'rvg' && !out.includes(m.block)) out.push(m.block)
  if (Object.values(modifiers).some((m) => m.source === 'aa')) out.push(AA_OWN_BLOCK)
  return out
}

// ---------------------------------------------------------------------------
// Pre-applied modifiers
// ---------------------------------------------------------------------------

export interface ModifierFacts {
  /** The patient's date of birth. */
  patientDobISO?: string
  /** The procedure date (the List's date). */
  procedureDateISO?: string
  /** The Procedure's RVG group. */
  group?: Pick<RvgGroup, 'code' | 'includedModifierIds' | 'noAgeModifier'>
  modifiers: Master
}

/**
 * Every modifier the system would pre-apply to this Procedure, before any
 * removal: the age modifier (none on a group flagged `noAgeModifier`, H6b and
 * P2, or with no date of birth or date), then each modifier the group's base
 * units include, at 0 units.
 */
export function preApplicableModifiersFor(facts: ModifierFacts): ProcedureModifier[] {
  const rows: ProcedureModifier[] = []
  const { patientDobISO, procedureDateISO, group, modifiers } = facts
  if (patientDobISO !== undefined && procedureDateISO !== undefined && group?.noAgeModifier !== true) {
    const age = ageInCompletedYears(patientDobISO, procedureDateISO)
    const code = age === undefined ? undefined : ageModifierCodeFor(age)
    const modifier =
      code === undefined
        ? undefined
        : Object.values(modifiers).find((m) => m.appliedFrom === 'age' && m.code === code)
    if (modifier !== undefined) {
      rows.push({
        modifierId: modifier.id,
        code: modifier.code,
        label: modifier.factor,
        units: modifier.units ?? 0,
        origin: 'age',
        detail: `From the patient's age (${age}) on the procedure date`,
      })
    }
  }
  for (const id of group?.includedModifierIds ?? []) {
    const modifier = modifiers[id]
    if (modifier === undefined || rows.some((r) => r.modifierId === id)) continue
    rows.push({
      modifierId: id,
      code: modifier.code,
      label: modifier.factor,
      units: 0,
      origin: 'included',
      detail: `Included in the base units of ${group!.code}`,
    })
  }
  return rows
}

/** The pre-applied modifiers in force: the pre-applicable ones the anaesthetist has not removed. */
export function preAppliedModifiersFor(
  facts: ModifierFacts & { removedModifierIds: readonly ModifierId[] },
): ProcedureModifier[] {
  return preApplicableModifiersFor(facts).filter((r) => !facts.removedModifierIds.includes(r.modifierId))
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export interface ClaimContext {
  claims: readonly ModifierClaim[]
  /** The pre-applied modifiers in force (after removals). */
  preApplied: readonly ProcedureModifier[]
  modifiers: Master
  /** True when the claim edits an existing claim of the same modifier. */
  replacing?: boolean
}

/** Why a claim cannot be saved, or null. */
export function claimRefusal(claim: ModifierClaim, ctx: ClaimContext): string | null {
  const modifier = ctx.modifiers[claim.modifierId]
  if (modifier === undefined) return 'That modifier is not in the modifier list.'
  const applied = ctx.preApplied.find((r) => r.modifierId === claim.modifierId)
  if (applied !== undefined) {
    return applied.origin === 'age'
      ? `${modifier.code} is already applied from the patient's age.`
      : `${modifier.code} is already on this Procedure.`
  }
  const existing = ctx.claims.some((c) => c.modifierId === claim.modifierId)
  if (existing && ctx.replacing !== true) return `${modifier.code} is already on this Procedure.`
  if (!existing && ctx.replacing === true) return `${modifier.code} is not claimed on this Procedure.`
  const explanation = claim.explanation.trim()
  if (explanation === '') return `Add a short explanation for ${modifier.code}.`
  if (explanation.length > MODIFIER_EXPLANATION_MAX) {
    return `Keep the explanation under ${MODIFIER_EXPLANATION_MAX} characters.`
  }
  if (needsEnteredUnits(modifier)) {
    if (!validEnteredUnits(claim.units, modifier)) {
      return `Enter the units for ${modifier.code} (${enteredUnitsHint(modifier)}).`
    }
  } else if (claim.units !== undefined) {
    return `${modifier.code} is worth ${modifier.units} units as printed; no units are entered.`
  }
  return null
}

/** The claims with this one added, or replacing the claim of the same modifier (explanation trimmed). */
export function applyClaim(claims: readonly ModifierClaim[], claim: ModifierClaim): ModifierClaim[] {
  const clean: ModifierClaim = {
    modifierId: claim.modifierId,
    ...(claim.units !== undefined ? { units: claim.units } : {}),
    explanation: claim.explanation.trim(),
  }
  const at = claims.findIndex((c) => c.modifierId === claim.modifierId)
  if (at < 0) return [...claims, clean]
  return claims.map((c, i) => (i === at ? clean : c))
}

/** The claims without this modifier. */
export function withoutClaim(claims: readonly ModifierClaim[], modifierId: ModifierId): ModifierClaim[] {
  return claims.filter((c) => c.modifierId !== modifierId)
}

/**
 * After the RVG group changes: drop the claims that now
 * duplicate a pre-applied modifier, and the removals that no longer apply.
 * Every write that changes a Procedure's group calls it in the same commit.
 */
export function reconcileClaims(
  claims: readonly ModifierClaim[],
  removedModifierIds: readonly ModifierId[],
  facts: ModifierFacts,
): { modifierClaims: ModifierClaim[]; removedModifierIds: ModifierId[] } {
  const candidates = preApplicableModifiersFor(facts)
  const kept = removedModifierIds.filter((id) => candidates.some((c) => c.modifierId === id))
  const applied = candidates.filter((c) => !kept.includes(c.modifierId))
  return {
    modifierClaims: claims.filter((c) => !applied.some((a) => a.modifierId === c.modifierId)),
    removedModifierIds: kept,
  }
}

// ---------------------------------------------------------------------------
// The itemised list and the M total
// ---------------------------------------------------------------------------

export interface ResolvedModifiers {
  /** Pre-applied rows first, then claims in claim order. */
  items: ProcedureModifier[]
  /** The starting modifier units plus every unrefused item's units. */
  units: number
}

/**
 * The Procedure's itemised modifiers and their M total. A claim that
 * duplicates a pre-applied modifier or an earlier claim, or names no modifier
 * in the master, stays in the list with `refused` set and adds nothing (the
 * backstop for data that bypassed `claimRefusal`: P1 is never counted twice).
 * A claim missing its entered units counts 0 (completion refuses it).
 */
export function resolveModifiers({
  claims,
  preApplied,
  start,
  modifiers,
}: {
  claims: readonly ModifierClaim[]
  preApplied: readonly ProcedureModifier[]
  /** The starting modifier units (Phase 19a's resolver; 0 in every seeded row). */
  start: number
  modifiers: Master
}): ResolvedModifiers {
  const items: ProcedureModifier[] = [...preApplied]
  for (const claim of claims) {
    const modifier = modifiers[claim.modifierId]
    if (modifier === undefined) {
      items.push({
        modifierId: claim.modifierId,
        code: '?',
        label: 'Unknown modifier',
        units: 0,
        explanation: claim.explanation,
        origin: 'chosen',
        refused: 'This modifier is no longer in the modifier list.',
      })
      continue
    }
    const duplicate = items.find((i) => i.modifierId === claim.modifierId)
    const units = modifier.units ?? claim.units ?? 0
    items.push({
      modifierId: modifier.id,
      code: modifier.code,
      label: modifier.factor,
      units: duplicate !== undefined ? 0 : units,
      explanation: claim.explanation,
      origin: 'chosen',
      ...(duplicate !== undefined
        ? {
            refused:
              duplicate.origin === 'age'
                ? `${modifier.code} is already applied from the patient's age; this claim adds nothing.`
                : `${modifier.code} is already on this Procedure; this claim adds nothing.`,
          }
        : {}),
    })
  }
  const units = start + items.reduce((sum, i) => sum + (i.refused === undefined ? i.units : 0), 0)
  return { items, units }
}

/** The removed pre-applied modifiers (for the "Put back" line). */
export function removedPreAppliedModifiers(
  facts: ModifierFacts & { removedModifierIds: readonly ModifierId[] },
): ProcedureModifier[] {
  return preApplicableModifiersFor(facts).filter((r) => facts.removedModifierIds.includes(r.modifierId))
}

/**
 * One Procedure's modifiers, whole: the pre-applied rows in force, its claims,
 * and the M total (the group's starting modifier units plus the list).
 */
export function procedureModifiers(
  procedure: { modifierClaims: readonly ModifierClaim[]; removedModifierIds: readonly ModifierId[] },
  facts: ModifierFacts & { start: number },
): ResolvedModifiers {
  const preApplied = preAppliedModifiersFor({ ...facts, removedModifierIds: procedure.removedModifierIds })
  return resolveModifiers({ claims: procedure.modifierClaims, preApplied, start: facts.start, modifiers: facts.modifiers })
}

/**
 * The completion backstop (US-03.6.1, finished by Phase 21): each claim with
 * no explanation, or missing its entered units, as a message. A Procedure with
 * no modifier at all passes (FT-03.3: choosing none is a valid answer).
 */
export function claimCompletionProblems(
  claims: readonly ModifierClaim[],
  modifiers: Master,
  /** The pre-applied modifiers in force: a claim duplicating one adds nothing and is no failure. */
  preApplied: readonly Pick<ProcedureModifier, 'modifierId'>[] = [],
): { modifierId: ModifierId; message: string }[] {
  const out: { modifierId: ModifierId; message: string }[] = []
  for (const claim of claims) {
    const modifier = modifiers[claim.modifierId]
    if (modifier === undefined) continue
    if (preApplied.some((p) => p.modifierId === claim.modifierId)) continue
    if (claim.explanation.trim() === '') {
      out.push({ modifierId: claim.modifierId, message: `Add a short explanation for ${modifier.code}, or remove it.` })
    } else if (needsEnteredUnits(modifier) && !validEnteredUnits(claim.units, modifier)) {
      out.push({
        modifierId: claim.modifierId,
        message: `Enter the units for ${modifier.code} (${enteredUnitsHint(modifier)}), or remove it.`,
      })
    }
  }
  return out
}

/**
 * A claim as the audit records it (catch-up Phase 19b): the printed code and
 * factor, never the hidden id, with the explanation and any entered units.
 */
export function claimAuditView(claim: ModifierClaim, modifiers: Master): Record<string, unknown> {
  const modifier = modifiers[claim.modifierId]
  return {
    modifier: modifier !== undefined ? `${modifier.code} · ${modifier.factor}` : claim.modifierId,
    explanation: claim.explanation,
    ...(claim.units !== undefined ? { units: claim.units } : {}),
  }
}

/**
 * A Procedure's stored modifier fields as the audit shows them: codes and
 * explanations, never hidden ids (for a write that changes them as a side
 * effect, such as a change of RVG group).
 */
export function claimsAuditView(
  p: { modifierClaims: readonly ModifierClaim[]; removedModifierIds: readonly ModifierId[] },
  modifiers: Master,
): Record<string, unknown> {
  const code = (id: ModifierId) => modifiers[id]?.code ?? id
  return {
    modifierClaims: p.modifierClaims.map((c) => `${code(c.modifierId)}: ${c.explanation}`),
    removedModifierIds: p.removedModifierIds.map(code),
  }
}

/** The master row for one generated RVG row (seed and tests share it). */
export function modifierFromRvgRow(row: {
  code: string
  block: string
  factor: string
  unitsAsPrinted: string
  trigger: string
  automatic: boolean
  page: number
}): Modifier {
  const plain = /^\d+$/.test(row.unitsAsPrinted) ? Number(row.unitsAsPrinted) : null
  return {
    id: `MOD-RVG-${row.code.replace(/\s+/g, '')}`,
    code: row.code,
    block: row.block,
    factor: row.factor,
    unitsAsPrinted: row.unitsAsPrinted,
    units: plain,
    trigger: row.trigger,
    ...(row.automatic ? { appliedFrom: 'age' as const } : {}),
    source: 'rvg',
    page: row.page,
  }
}
