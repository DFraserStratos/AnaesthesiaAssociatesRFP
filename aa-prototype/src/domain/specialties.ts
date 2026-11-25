/**
 * Specialties (catch-up Phase 18a; US-13.4.4, US-13.6.6, US-04.2.16, DM-63;
 * AR-58 2.5, AR-61 `#specialty`): AA's list of broad surgical specialties,
 * with no subspecialties. Surgeons hold one or more; Contracts hold none or
 * more (none means every specialty). Anaesthetists hold none.
 *
 * The one place for the surgeon side of the model: the text every screen
 * shows for a surgeon's specialties (`surgeonSpecialtyLabel`), the one fit
 * predicate the step rail's candidate filter calls (`contractFitsSpecialties`,
 * Phase 20 imports it), who holds a specialty (`specialtyUsage`) and the
 * name rules (`specialtyNameRefusal`).
 *
 * Our readings, built and logged (Verify, no UI label):
 * - D3: a surgeon holds a list, usually one (Ben said "No" to several).
 * - A10: a Contract fits a surgeon when it holds no specialty, or shares any one.
 */

import type { Contract } from './billing/contracts'
import { isOfficeContract } from './billing/fallbacks'
import { compareBySurname } from './surgeons'
import type { Surgeon } from './types'

/** Seeded `SPC-<NAME>`; allocated at runtime `SPN001`. */
export type SpecialtyId = string

export interface Specialty {
  id: SpecialtyId
  /** One broad name (General surgery, never Upper GI); unique, case-insensitive. */
  name: string
}

type SpecialtyMasters = { specialties: Readonly<Record<SpecialtyId, Specialty>> }

/** The list in name order, for pickers and the Master data table. */
export function specialtiesInOrder(specialties: Readonly<Record<SpecialtyId, Specialty>>): Specialty[] {
  return Object.values(specialties).sort((a, b) => a.name.localeCompare(b.name))
}

/** The names of the given ids, in the order held; an unknown id is skipped. */
export function specialtyNames(masters: SpecialtyMasters, ids: readonly SpecialtyId[]): string[] {
  const names: string[] = []
  for (const id of ids) {
    const s = masters.specialties[id]
    if (s !== undefined) names.push(s.name)
  }
  return names
}

/**
 * The one text every screen shows for a surgeon's specialties: the names
 * joined with ", " in the order the surgeon holds them. Empty for an
 * unknown surgeon.
 */
export function surgeonSpecialtyLabel(masters: SpecialtyMasters, surgeon: Pick<Surgeon, 'specialtyIds'> | undefined): string {
  if (surgeon === undefined) return ''
  return specialtyNames(masters, surgeon.specialtyIds).join(', ')
}

/**
 * Whether a Contract's specialties fit a surgeon's (US-04.2.16, A10): true when
 * the Contract holds none (every specialty), else when any id overlaps. The
 * one predicate; Phase 20's candidate filter calls it.
 */
export function contractFitsSpecialties(
  contractSpecialtyIds: readonly SpecialtyId[],
  surgeonSpecialtyIds: readonly SpecialtyId[],
): boolean {
  if (contractSpecialtyIds.length === 0) return true
  const held = new Set(surgeonSpecialtyIds)
  return contractSpecialtyIds.some((id) => held.has(id))
}

/** Who holds a specialty: the surgeons and the Contracts carrying it. */
export function specialtyUsage(
  masters: { surgeons: Readonly<Record<string, Pick<Surgeon, 'specialtyIds'>>>; contracts: Readonly<Record<string, Pick<Contract, 'specialtyIds'>>> },
  id: SpecialtyId,
): { surgeons: number; contracts: number } {
  let surgeons = 0
  let contracts = 0
  for (const s of Object.values(masters.surgeons)) if (s.specialtyIds.includes(id)) surgeons++
  for (const c of Object.values(masters.contracts)) if (c.specialtyIds.includes(id)) contracts++
  return { surgeons, contracts }
}

/** A surgeon who holds a specialty, as the specialty's page lists them. */
export interface SpecialtySurgeonHolder {
  surgeon: Surgeon
  /** Their other specialties, in their order, by name ("" when this is their only one). */
  alsoHolds: string
  retired: boolean
}

/** A Contract that carries a specialty, as the specialty's page lists it. */
export interface SpecialtyContractHolder {
  contract: Contract
  /** The holder Party's short name (its id when missing). */
  holderName: string
  /** The funding tag's code, when it carries one. */
  fundingTagCode?: string
  disabled: boolean
}

/**
 * Who holds a specialty, listed (build plan Phase 56; US-13.4.4 Specialty page): every surgeon whose
 * specialties include it, by surname, Retired ones too; and every office Contract carrying it, by
 * name, Disabled ones too. A Contract with no specialties (offered for every specialty) and a system
 * Contract (which holds none) are never listed. So both lengths equal `specialtyUsage`, the counts
 * Remove's refusal reads.
 */
export function specialtyHolders(
  masters: {
    specialties: Readonly<Record<SpecialtyId, Specialty>>
    surgeons: Readonly<Record<string, Surgeon>>
    contracts: Readonly<Record<string, Contract>>
    parties: Readonly<Record<string, { name: string }>>
    fundingTags: Readonly<Record<string, { code: string }>>
  },
  id: SpecialtyId,
): { surgeons: SpecialtySurgeonHolder[]; contracts: SpecialtyContractHolder[] } {
  const surgeons = Object.values(masters.surgeons)
    .filter((s) => s.specialtyIds.includes(id))
    .sort(compareBySurname)
    .map((surgeon) => ({
      surgeon,
      alsoHolds: specialtyNames(masters, surgeon.specialtyIds.filter((x) => x !== id)).join(', '),
      retired: surgeon.retiredAtISO !== undefined,
    }))
  const contracts = Object.values(masters.contracts)
    .filter((c) => isOfficeContract(c) && c.specialtyIds.includes(id))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .map((contract) => {
      const code = contract.fundingTagId !== undefined ? masters.fundingTags[contract.fundingTagId]?.code : undefined
      return {
        contract,
        holderName: masters.parties[contract.holderId]?.name ?? contract.holderId,
        ...(code !== undefined ? { fundingTagCode: code } : {}),
        disabled: contract.status === 'disabled',
      }
    })
  return { surgeons, contracts }
}

/** "3 surgeons and 2 Contracts", "1 surgeon", "nothing": who holds a specialty, in words. */
export function specialtyUsageText(usage: { surgeons: number; contracts: number }): string {
  const parts: string[] = []
  if (usage.surgeons > 0) parts.push(`${usage.surgeons} ${usage.surgeons === 1 ? 'surgeon' : 'surgeons'}`)
  if (usage.contracts > 0) parts.push(`${usage.contracts} ${usage.contracts === 1 ? 'Contract' : 'Contracts'}`)
  return parts.length === 0 ? 'nothing' : parts.join(' and ')
}

export type SpecialtyRefusalCode = 'nameRequired' | 'nameTaken'

export const SPECIALTY_REFUSAL_MESSAGES: Record<SpecialtyRefusalCode, string> = {
  nameRequired: 'A specialty needs a name.',
  nameTaken: 'That specialty is already on the list.',
}

/** The name rules: required and unique, ignoring case and outer spaces. */
export function specialtyNameRefusal(
  name: string,
  specialties: Readonly<Record<SpecialtyId, Specialty>>,
  excludeId?: SpecialtyId,
): { code: SpecialtyRefusalCode; message: string } | null {
  const trimmed = name.trim()
  if (trimmed === '') return { code: 'nameRequired', message: SPECIALTY_REFUSAL_MESSAGES.nameRequired }
  const key = trimmed.toLowerCase()
  if (Object.values(specialties).some((s) => s.id !== excludeId && s.name.trim().toLowerCase() === key)) {
    return { code: 'nameTaken', message: SPECIALTY_REFUSAL_MESSAGES.nameTaken }
  }
  return null
}

/**
 * A surgeon's specialties as stored: known ids only, duplicates dropped, the
 * given order kept. Returns the refusal a save with none (or an unknown id)
 * meets, so no path leaves a surgeon with no specialty (US-13.6.6 Required).
 */
export function cleanSpecialtyIds(
  ids: readonly SpecialtyId[] | undefined,
  specialties: Readonly<Record<SpecialtyId, Specialty>>,
): { ok: true; ids: SpecialtyId[] } | { ok: false; code: 'specialtyRequired' | 'specialtyUnknown'; message: string } {
  const out: SpecialtyId[] = []
  for (const id of ids ?? []) {
    if (specialties[id] === undefined) return { ok: false, code: 'specialtyUnknown', message: 'That specialty is not on the list.' }
    if (!out.includes(id)) out.push(id)
  }
  if (out.length === 0) return { ok: false, code: 'specialtyRequired', message: 'Choose at least one specialty.' }
  return { ok: true, ids: out }
}

/** A Contract's specialties in words: their names, or "Every specialty" when it holds none (US-04.2.16). */
export function contractSpecialtyLabel(masters: SpecialtyMasters, ids: readonly SpecialtyId[]): string {
  return ids.length === 0 ? 'Every specialty' : specialtyNames(masters, ids).join(', ')
}

/** "Mr T. Hale (Orthopaedics)" for a picker option; the name alone when the label is empty. */
export function withSpecialties(name: string, label: string): string {
  return label === '' ? name : `${name} (${label})`
}
