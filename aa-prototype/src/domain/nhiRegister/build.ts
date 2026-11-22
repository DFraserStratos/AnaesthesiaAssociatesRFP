/**
 * Builds the synthetic NHI register (catch-up Phase 40a). Pure and
 * deterministic: the generated pool draws from its own RNG stream,
 * `slotRng(seed, 'nhi-register')`, so no existing seed draw moves.
 */

import { generateNhi, validateNhi, type NhiFormat } from '../nhi'
import { ETHNICITY_DEMO_SUBSET } from '../nzhis'
import { FIRST_NAMES, SURNAMES } from '../seed/patients'
import { slotRng } from '../seed/slotHash'
import type { Patient } from '../types'
import type { NhiRegister, NhiRegisterPerson, NhiRegisterUpdate } from './types'

export interface BuildNhiRegisterInput {
  seed: number
  /** Every seeded patient: those with an NHI are mirrored exactly. */
  seededPatients: readonly Patient[]
  /** Named people on the register who are not AA patients. */
  registerOnly: readonly Omit<NhiRegisterPerson, 'format'>[]
  /** Register details that differ from AA's record, keyed by NHI. */
  updates: Readonly<Record<string, NhiRegisterUpdate>>
  /** How many generated people to add. */
  poolCount: number
  /** NHIs the pool must never take (kept off the register on purpose). */
  reserved: ReadonlySet<string>
}

function formatOf(nhi: string): NhiFormat {
  const verdict = validateNhi(nhi)
  if (!verdict.valid || verdict.format === null) throw new Error(`NHI register: ${nhi} is not a valid NHI`)
  return verdict.format
}

function mirror(p: Patient): NhiRegisterPerson {
  return {
    nhi: p.nhi,
    name: p.name,
    dobISO: p.dobISO,
    ...(p.phone !== undefined ? { phone: p.phone } : {}),
    ...(p.postalAddress !== undefined ? { postalAddress: p.postalAddress } : {}),
    ...(p.ethnicityCode !== undefined ? { ethnicityCode: p.ethnicityCode } : {}),
    format: formatOf(p.nhi),
  }
}

/**
 * In order: mirror every seeded patient with an NHI (so an untouched patient
 * shows no change), apply the updates, add the register-only people, then
 * generate the pool, regenerating an NHI on any collision or reserved hit.
 */
export function buildNhiRegister(input: BuildNhiRegisterInput): NhiRegister {
  const map = new Map<string, NhiRegisterPerson>()
  for (const p of input.seededPatients) {
    if (p.nhi === '' || map.has(p.nhi)) continue
    map.set(p.nhi, mirror(p))
  }
  for (const [nhi, update] of Object.entries(input.updates)) {
    const person = map.get(nhi)
    if (person === undefined) continue
    map.set(nhi, { ...person, ...update })
  }
  for (const person of input.registerOnly) {
    if (map.has(person.nhi)) throw new Error(`NHI register: ${person.nhi} is already a seeded patient`)
    map.set(person.nhi, { ...person, format: formatOf(person.nhi) })
  }

  const rng = slotRng(input.seed, 'nhi-register')
  const codes = ETHNICITY_DEMO_SUBSET.map((e) => e.code)
  for (let i = 0; i < input.poolCount; i++) {
    const format: NhiFormat = i % 9 === 8 ? 'new' : 'current'
    let nhi = generateNhi(format, rng)
    while (map.has(nhi) || input.reserved.has(nhi)) nhi = generateNhi(format, rng)
    const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)] ?? 'Alex'
    const last = SURNAMES[Math.floor(rng() * SURNAMES.length)] ?? 'Smith'
    const year = 1938 + Math.floor(rng() * 80)
    const month = 1 + Math.floor(rng() * 12)
    const day = 1 + Math.floor(rng() * 28)
    const ethnicityCode = codes[Math.floor(rng() * codes.length)] ?? '11111'
    const hasPhone = rng() < 0.6
    map.set(nhi, {
      nhi,
      name: `${first} ${last}`,
      dobISO: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      ...(hasPhone ? { phone: `021 556 ${String(1000 + i).padStart(4, '0')}` } : {}),
      ethnicityCode,
      format,
    })
  }
  return map
}
