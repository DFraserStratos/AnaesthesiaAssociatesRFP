/**
 * Funding tags (catch-up Phase 18a; US-13.4.5, US-04.2.17, FT-05.5, US-05.5.1,
 * DM-64; AR-58 2.6, AR-61 `#funding-tag`): AA's list of who funds a
 * hospital's work (SXAP, HNZ, ACC), in the order step 2 of the step rail shows
 * them. A Contract carries at most one; with who it bills, the tag decides
 * where it sits (`destinationOf` in `fallbacks.ts`).
 *
 * ACC is a funding tag, never a kind of Contract or a pricing path: a
 * Procedure is ACC-funded when its Contract carries a tag `isAccTag` holds for
 * (`procedureAccFunded`), and the fee reads nothing here.
 *
 * Our reading, built and logged (A25, Verify): a tag may name the insurer or
 * funder whose work arrives under it. Nothing reads the funder yet; Phase 21's
 * "Suggested" path will.
 */

import type { Procedure } from '../types'
import type { Contract } from './contracts'
import type { Party, PartyId } from './parties'

/** Seeded `TAG-<CODE>` (never `FT-`, which reads as a catalogue feature); allocated at runtime `TGN001`. */
export type FundingTagId = string

export interface FundingTag {
  id: FundingTagId
  /** The label on step 2 and on Contracts: `SXAP`, `HNZ`, `ACC`. Unique, case-insensitive; stored trimmed and upper-cased. */
  code: string
  /** Display order, 1 upward: the step rail's order. Renumbered on every move. */
  order: number
  /** The insurer or funder whose work arrives under this tag (A25). Only Phase 21's "Suggested" reads it. */
  funderPartyId?: PartyId
}

type Tags = Readonly<Record<FundingTagId, FundingTag>>

/** The list in step-rail order. */
export function fundingTagsInOrder(tags: Tags): FundingTag[] {
  return Object.values(tags).sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
}

/** Whether a tag is ACC: its code is `ACC`, ignoring case (codes are unique). */
export function isAccTag(tag: Pick<FundingTag, 'code'> | undefined): boolean {
  return tag !== undefined && tag.code.trim().toUpperCase() === 'ACC'
}

/** How many Contracts carry a tag, the system fallbacks included. */
export function fundingTagUsage(contracts: Readonly<Record<string, Pick<Contract, 'fundingTagId'>>>, id: FundingTagId): number {
  let n = 0
  for (const c of Object.values(contracts)) if (c.fundingTagId === id) n++
  return n
}

/**
 * Whether a Procedure is ACC-funded (FT-05.5, US-05.5.1): its Contract carries
 * the ACC tag. The only ACC marker; the procedure's own text never decides it,
 * and a Procedure with no stored Contract is never ACC-funded.
 */
export function procedureAccFunded(
  masters: { contracts: Readonly<Record<string, Contract>>; fundingTags: Tags },
  procedure: Pick<Procedure, 'governingContractId'>,
): boolean {
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  if (contract?.fundingTagId === undefined) return false
  return isAccTag(masters.fundingTags[contract.fundingTagId])
}

/** A tag code as stored: trimmed, inner spaces removed, upper-cased. */
export function normaliseTagCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

/** The Party kinds a tag may name as its funder. */
export const FUNDER_PARTY_KINDS: readonly Party['kind'][] = ['insurer', 'funder']

export type FundingTagRefusalCode = 'codeRequired' | 'codeTaken' | 'funderUnknown' | 'funderKind'

export const FUNDING_TAG_REFUSAL_MESSAGES: Record<FundingTagRefusalCode, string> = {
  codeRequired: 'A funding tag needs a code with at least one letter or number.',
  codeTaken: 'That funding tag is already on the list.',
  funderUnknown: 'That funder is not a Party.',
  funderKind: 'A funding tag names an insurer or a funder.',
}

/** The tag rules: a unique code; the funder, when set, an insurer or funder Party. */
export function fundingTagRefusal(
  next: Pick<FundingTag, 'id' | 'code' | 'funderPartyId'>,
  ctx: { tags: Tags; parties: Readonly<Record<PartyId, Party>> },
): { code: FundingTagRefusalCode; message: string } | null {
  const code = normaliseTagCode(next.code)
  const refusal = (c: FundingTagRefusalCode) => ({ code: c, message: FUNDING_TAG_REFUSAL_MESSAGES[c] })
  if (!/[A-Z0-9]/.test(code)) return refusal('codeRequired')
  if (Object.values(ctx.tags).some((t) => t.id !== next.id && normaliseTagCode(t.code) === code)) return refusal('codeTaken')
  if (next.funderPartyId !== undefined) {
    const funder = ctx.parties[next.funderPartyId]
    if (funder === undefined) return refusal('funderUnknown')
    if (!FUNDER_PARTY_KINDS.includes(funder.kind)) return refusal('funderKind')
  }
  return null
}

/**
 * The tags with one moved a place up or down, orders renumbered 1 upward.
 * Unchanged when it is already at that end (or unknown).
 */
export function moveFundingTag(tags: Tags, id: FundingTagId, direction: 'up' | 'down'): Record<FundingTagId, FundingTag> {
  const ordered = fundingTagsInOrder(tags)
  const i = ordered.findIndex((t) => t.id === id)
  const j = direction === 'up' ? i - 1 : i + 1
  if (i >= 0 && j >= 0 && j < ordered.length) [ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!]
  return Object.fromEntries(ordered.map((t, k) => [t.id, t.order === k + 1 ? t : { ...t, order: k + 1 }]))
}
