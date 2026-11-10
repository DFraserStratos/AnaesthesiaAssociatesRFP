/**
 * Contract master mutations (catch-up Phase 18; US-04.1.2, US-04.1.4,
 * DM-07). Office only, each one audited `mutate()` commit with the values
 * before and after, refusals as data from the one rule source,
 * `contractRefusal` in `domain/billing/contracts.ts`, applied on every path so
 * no raw patch can change a Contract's holder, prepaid setting or pricing kind
 * after creation.
 *
 * A Contract is edited in place and never deleted (D77): it is disabled
 * instead (`contract.disable`, `contract.enable`). A setting that must change
 * from a date is a new Contract, the old one disabled (D79: no list of the
 * Procedures affected). No contract · RVG changes only its name and AA code
 * and is never disabled. The AA code is stamped on create from the holder
 * Party's code prefix by `nextAaCode`.
 *
 * Catch-up Phase 18a: a Contract carries specialties and at most one funding
 * tag, checked by the same guard. Every create, edit and re-enable runs
 * `ensureFallbacks` inside the same `mutate()`, so a Contract that implies a
 * new invoice destination (a hospital's first SXAP Contract, say) has its
 * open-price fallback in the same commit, audited `contract.fallbackCreate`
 * once per fallback made. The office never creates, disables or reshapes a
 * fallback (the guard's system rule).
 *
 * Catch-up Phase 19a: a fixed price holds dated price ranges, changed only
 * through `addPriceRange`, `editPriceRange` and `deletePriceRange` (office
 * only, audited `contract.priceRange.add|update|delete` with the range before
 * and after in words), each checked by the same guard (`validatePriceRanges`
 * inside `contractRefusal`) plus "never the last". A Contract also carries
 * its invoice description and default RVG code, set through the edit.
 */

import type { Contract, PriceRange } from '../domain/types'
import { contractRefusal, nextAaCode, normaliseAaCode, type ContractRefusalContext } from '../domain/billing/contracts'
import {
  addRange,
  deleteRange,
  deleteRangeRefusal,
  describeRange,
  editRange,
  editRangeRefusal,
  normaliseRanges,
  priceRangeRefusal,
  sameRanges,
} from '../domain/billing/priceRanges'
import { rvgGroupLabel } from '../domain/billing/rvgGroups'
import { roundToCents } from '../domain/billing/money'
import { ensureFallbacks } from '../domain/billing/fallbacks'
import { contractSpecialtyLabel } from '../domain/specialties'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

function refusalContext(state: AppState, prev?: Contract): ContractRefusalContext {
  return {
    ...(prev !== undefined ? { prev } : {}),
    parties: state.masters.parties,
    contracts: state.masters.contracts,
    surgeonIds: new Set(Object.keys(state.masters.surgeons)),
    anaesthetistIds: new Set(Object.keys(state.masters.anaesthetists)),
    specialtyIds: new Set(Object.keys(state.masters.specialties)),
    fundingTagIds: new Set(Object.keys(state.masters.fundingTags)),
    rvgGroups: state.masters.rvgGroups,
  }
}

/**
 * The Contracts with every missing open-price fallback added (AR-58 5.5),
 * ids allocated from the counters in turn, and one `contract.fallbackCreate`
 * audit meta per fallback, pushed onto `metas`. Called inside a `mutate()`
 * recipe so the fallback lands in the commit that implied it.
 */
function withFallbacks(
  s: Pick<AppState, 'masters'>,
  contracts: Record<string, Contract>,
  counters: Record<string, number>,
  metas: MutationMeta[],
): { contracts: Record<string, Contract>; counters: Record<string, number> } {
  let next = counters
  const result = ensureFallbacks(contracts, s.masters.parties, s.masters.fundingTags, () => {
    const alloc = allocateId(next, 'contract')
    next = alloc.counters
    return alloc.id
  })
  for (const f of result.created) {
    const { id: _id, ...after } = f
    metas.push({ entityType: 'contract', entityId: f.id, action: 'contract.fallbackCreate', after: named(after, s), stampBookingId: null })
  }
  return { contracts: result.contracts, counters: next }
}

/**
 * A Contract's audit values with its holder, specialties and tag as names,
 * never ids (`holder: "St George's"`, `specialties: 'General surgery'` or
 * 'Every specialty', `fundingTag: 'SXAP'` or 'None').
 */
function named(values: Record<string, unknown>, state: Pick<AppState, 'masters'>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) {
    if (k === 'specialtyIds') out.specialties = Array.isArray(v) ? contractSpecialtyLabel(state.masters, v as string[]) : v
    else if (k === 'holderId') out.holder = typeof v === 'string' ? (state.masters.parties[v]?.name ?? v) : v
    else if (k === 'fundingTagId') out.fundingTag = typeof v === 'string' && v !== '' ? (state.masters.fundingTags[v]?.code ?? v) : 'None'
    else if (k === 'defaultRvgGroupId') {
      const group = typeof v === 'string' && v !== '' ? state.masters.rvgGroups[v] : undefined
      out.defaultRvgCode = group !== undefined ? rvgGroupLabel(group) : typeof v === 'string' && v !== '' ? v : 'None'
    } else if (k === 'invoiceDescription') out.invoiceDescription = typeof v === 'string' && v !== '' ? v : 'None'
    else out[k] = v
  }
  return out
}

/** The changed fields of a Contract, before and after, for its audit entry. */
function diff(prev: Contract, next: Contract): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<keyof Contract>
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  for (const k of keys) {
    if (JSON.stringify(prev[k]) === JSON.stringify(next[k])) continue
    before[k] = prev[k] ?? ''
    after[k] = next[k] ?? ''
  }
  return { before, after }
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/** What the office sets on a new Contract. The AA code is assigned on save. */
export interface ContractInput {
  name: string
  holderId: string
  billsTo: Contract['billsTo']
  pricing: Contract['pricing']
  prepaid: boolean
  anaesthetistMayOverridePrice: boolean
  linkedSurgeonIds: string[]
  linkedAnaesthetistId?: string
  holderReference?: string
  /** The wording the patient reads (Phase 19a; 20a makes it the top default). */
  invoiceDescription?: string | null
  /** The RVG group that fills a Procedure's empty RVG code (Phase 19a). */
  defaultRvgGroupId?: string | null
  /** INTERIM until Phase 24: the Method 3 (rate x time) gate. */
  permitsRateTime?: boolean
  /** The specialties it is offered for; none (the default) means every specialty. */
  specialtyIds?: string[]
  /** At most one funding tag from AA's list. */
  fundingTagId?: string
}

/** Create a Contract, Active, with the next AA code for its holder. Audited `contract.create`. */
export function createContract(api: AppStoreApi, actor: Actor, input: ContractInput): Outcome<{ contract: Contract }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can create a Contract.')
  const state = api.getState()
  const holder = state.masters.parties[input.holderId]
  if (holder === undefined) return refuse('holderMissing', 'Choose the Party that holds this Contract.')
  const reference = input.holderReference?.trim() ?? ''
  const draft: Contract = {
    id: '',
    aaCode: nextAaCode(holder.codePrefix, Object.values(state.masters.contracts).map((c) => c.aaCode)),
    name: input.name.trim(),
    holderId: input.holderId,
    billsTo: input.billsTo,
    linkedSurgeonIds: [...input.linkedSurgeonIds],
    ...(input.linkedAnaesthetistId !== undefined && input.linkedAnaesthetistId !== '' ? { linkedAnaesthetistId: input.linkedAnaesthetistId } : {}),
    prepaid: input.prepaid,
    anaesthetistMayOverridePrice: input.anaesthetistMayOverridePrice,
    pricing: input.pricing.kind === 'fixed' ? { kind: 'fixed', ranges: normaliseRanges(input.pricing.ranges) } : input.pricing,
    status: 'active',
    ...(reference !== '' ? { holderReference: reference } : {}),
    invoiceDescription: blankToNull(input.invoiceDescription),
    defaultRvgGroupId: blankToNull(input.defaultRvgGroupId),
    permitsRateTime: input.permitsRateTime ?? false,
    specialtyIds: [...new Set(input.specialtyIds ?? [])],
    ...(input.fundingTagId !== undefined && input.fundingTagId !== '' ? { fundingTagId: input.fundingTagId } : {}),
  }
  const refused = contractRefusal(draft, refusalContext(state))
  if (refused !== null) return refuse(refused.code, refused.message)

  let created: Contract | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'contract')
    const contract: Contract = { ...draft, id: alloc.id }
    created = contract
    const { id: _id, ...after } = contract
    metas.push({ entityType: 'contract', entityId: contract.id, action: 'contract.create', after: named(after, s), stampBookingId: null })
    const kept = withFallbacks(s, { ...s.masters.contracts, [contract.id]: contract }, alloc.counters, metas)
    return { masters: { ...s.masters, contracts: kept.contracts }, counters: kept.counters }
  })
  if (created === undefined) return refuse('createFailed', 'The Contract could not be created.')
  return ok({ contract: created })
}

/**
 * A patch to a Contract. Any field may be named, but `contractRefusal` refuses
 * a change to the holder, prepaid or the pricing kind, and anything but the
 * fields in `SYSTEM_CONTRACT_EDITABLE_FIELDS` on a system Contract (No
 * contract · RVG and the open-price fallbacks). The status changes only through
 * `disableContract` and `enableContract`. A blank `holderReference`, or
 * `linkedAnaesthetistId` or `fundingTagId` set to undefined, clears it.
 */
export type ContractEditPatch = Partial<Omit<Contract, 'id' | 'status'>>

type ContractAction = 'contract.update' | 'contract.disable' | 'contract.enable'

function save(api: AppStoreApi, actor: Actor, contractId: string, apply: (prev: Contract) => Contract, audit: { action: ContractAction }): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change a Contract.')
  const state = api.getState()
  const prev = state.masters.contracts[contractId]
  if (prev === undefined) return refuse('notFound', 'Contract not found.')
  const next = apply(prev)
  // A fixed price's ranges change only through the range actions, each with its own audit entry.
  if (prev.pricing.kind === 'fixed' && next.pricing.kind === 'fixed' && !sameRanges(prev.pricing.ranges, next.pricing.ranges)) {
    return refuse('useRangeActions', 'Change a price range with Add price range, Edit or Delete.')
  }
  const refused = contractRefusal(next, refusalContext(state, prev))
  if (refused !== null) return refuse(refused.code, refused.message)
  const { before, after } = diff(prev, next)
  if (Object.keys(after).length === 0) return ok(undefined)
  const metas: MutationMeta[] = [
    { entityType: 'contract', entityId: contractId, action: audit.action, before: named(before, state), after: named(after, state), stampBookingId: null },
  ]
  mutate(api, actor, metas, (s) => {
    const contracts = { ...s.masters.contracts, [contractId]: next }
    // A disable implies no new destination; an edit or a re-enable may.
    if (audit.action === 'contract.disable') return { masters: { ...s.masters, contracts } }
    const kept = withFallbacks(s, contracts, s.counters, metas)
    return { masters: { ...s.masters, contracts: kept.contracts }, counters: kept.counters }
  })
  return ok(undefined)
}

/** Edit a Contract in place. Audited `contract.update` with the changed fields before and after. */
export function editContract(api: AppStoreApi, actor: Actor, contractId: string, patch: ContractEditPatch): Outcome {
  return save(
    api,
    actor,
    contractId,
    (prev) => {
      // A key passed as undefined keeps the stored value, except the two
      // optional fields an empty value clears; so a raw patch is refused as
      // data, never thrown on.
      const defined = Object.fromEntries(
        Object.entries(patch).filter(
          ([k, v]) =>
            v !== undefined ||
            k === 'linkedAnaesthetistId' ||
            k === 'holderReference' ||
            k === 'fundingTagId' ||
            k === 'invoiceDescription' ||
            k === 'defaultRvgGroupId',
        ),
      ) as ContractEditPatch
      const next: Contract = { ...prev, ...defined, id: prev.id, status: prev.status }
      if (next.holderReference === undefined) delete next.holderReference
      next.name = next.name.trim()
      next.aaCode = normaliseAaCode(next.aaCode)
      if (next.holderReference !== undefined && next.holderReference.trim() === '') delete next.holderReference
      else if (next.holderReference !== undefined) next.holderReference = next.holderReference.trim()
      if ('linkedAnaesthetistId' in patch && (patch.linkedAnaesthetistId === undefined || patch.linkedAnaesthetistId === '')) {
        delete next.linkedAnaesthetistId
      }
      if ('fundingTagId' in patch && (patch.fundingTagId === undefined || patch.fundingTagId === '')) delete next.fundingTagId
      if ('specialtyIds' in patch && patch.specialtyIds !== undefined) next.specialtyIds = [...new Set(patch.specialtyIds)]
      if ('invoiceDescription' in patch) next.invoiceDescription = blankToNull(patch.invoiceDescription)
      if ('defaultRvgGroupId' in patch) next.defaultRvgGroupId = blankToNull(patch.defaultRvgGroupId)
      if (next.pricing.kind === 'fixed') next.pricing = { kind: 'fixed', ranges: normaliseRanges(next.pricing.ranges) }
      return next
    },
    { action: 'contract.update' },
  )
}

/** Disable a Contract: it leaves the default list; a Procedure already on it keeps it and bills as normal (D81). */
export function disableContract(api: AppStoreApi, actor: Actor, contractId: string): Outcome {
  return save(api, actor, contractId, (prev) => ({ ...prev, status: 'disabled' }), { action: 'contract.disable' })
}

/** Make a Disabled Contract active again. */
export function enableContract(api: AppStoreApi, actor: Actor, contractId: string): Outcome {
  return save(api, actor, contractId, (prev) => ({ ...prev, status: 'active' }), { action: 'contract.enable' })
}

/** A trimmed text, or null when blank or absent (the two optional fields). */
function blankToNull(v: string | null | undefined): string | null {
  const t = v?.trim() ?? ''
  return t === '' ? null : t
}

// ---------------------------------------------------------------------------
// Price ranges (catch-up Phase 19a; US-04.2.15, DM-09; AR-58 5.6)
// ---------------------------------------------------------------------------

type RangeAction = 'contract.priceRange.add' | 'contract.priceRange.update' | 'contract.priceRange.delete'

/**
 * One audited change to a fixed price's ranges: refused for any actor but the
 * office, on a Contract that is not a fixed price, and by the Contract's own
 * guard (`contractRefusal`, which runs `validatePriceRanges`). The ranges in
 * the audit are in words ("From 1 Oct 2026, $3,200.00").
 */
function saveRanges(
  api: AppStoreApi,
  actor: Actor,
  contractId: string,
  apply: (ranges: readonly PriceRange[]) => { ranges: PriceRange[] } | { refused: { code: string; message: string } },
  audit: { action: RangeAction; before?: PriceRange; after?: PriceRange },
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change a Contract.')
  const state = api.getState()
  const prev = state.masters.contracts[contractId]
  if (prev === undefined) return refuse('notFound', 'Contract not found.')
  if (prev.pricing.kind !== 'fixed') {
    const r = priceRangeRefusal('notFixedPrice')
    return refuse(r.code, r.message)
  }
  const result = apply(prev.pricing.ranges)
  if ('refused' in result) return refuse(result.refused.code, result.refused.message)
  // One rounding for every save path (`normaliseRanges`, as create and edit use).
  const ranges = normaliseRanges(result.ranges)
  // A save that changes nothing writes nothing, so the trail carries no empty entry.
  if (sameRanges(ranges, prev.pricing.ranges)) return ok(undefined)
  const next: Contract = { ...prev, pricing: { kind: 'fixed', ranges } }
  const refused = contractRefusal(next, refusalContext(state, prev))
  if (refused !== null) return refuse(refused.code, refused.message)
  const contractName = prev.name
  mutate(
    api,
    actor,
    {
      entityType: 'contract',
      entityId: contractId,
      action: audit.action,
      ...(audit.before !== undefined ? { before: { contract: contractName, priceRange: describeRange(audit.before) } } : {}),
      ...(audit.after !== undefined ? { after: { contract: contractName, priceRange: describeRange(audit.after) } } : {}),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contractId]: next } } }),
  )
  return ok(undefined)
}

/**
 * Add a price range from a start date, which may be in the past: the price
 * changes from that date, and every Procedure on the Contract that nothing
 * holds re-prices (prices are derived; an issued invoice never changes).
 */
export function addPriceRange(api: AppStoreApi, actor: Actor, contractId: string, range: PriceRange): Outcome {
  const clean: PriceRange = { startISO: range.startISO, price: roundToCents(range.price) }
  return saveRanges(api, actor, contractId, (ranges) => ({ ranges: addRange(ranges, clean) }), {
    action: 'contract.priceRange.add',
    after: clean,
  })
}

/** Correct a range (its start or price); `startISO` names the range as stored. */
export function editPriceRange(api: AppStoreApi, actor: Actor, contractId: string, startISO: string, next: PriceRange): Outcome {
  const clean: PriceRange = { startISO: next.startISO, price: roundToCents(next.price) }
  const prev = api.getState().masters.contracts[contractId]
  const before = prev?.pricing.kind === 'fixed' ? prev.pricing.ranges.find((r) => r.startISO === startISO) : undefined
  return saveRanges(
    api,
    actor,
    contractId,
    (ranges) => {
      const bad = editRangeRefusal(ranges, startISO)
      return bad !== null ? { refused: bad } : { ranges: editRange(ranges, startISO, clean) }
    },
    { action: 'contract.priceRange.update', ...(before !== undefined ? { before } : {}), after: clean },
  )
}

/** Delete a range entered in error; never the last one. */
export function deletePriceRange(api: AppStoreApi, actor: Actor, contractId: string, startISO: string): Outcome {
  const prev = api.getState().masters.contracts[contractId]
  const before = prev?.pricing.kind === 'fixed' ? prev.pricing.ranges.find((r) => r.startISO === startISO) : undefined
  return saveRanges(
    api,
    actor,
    contractId,
    (ranges) => {
      const bad = deleteRangeRefusal(ranges, startISO)
      return bad !== null ? { refused: bad } : { ranges: deleteRange(ranges, startISO) }
    },
    { action: 'contract.priceRange.delete', ...(before !== undefined ? { before } : {}) },
  )
}
