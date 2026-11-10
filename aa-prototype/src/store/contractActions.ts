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
 */

import type { Contract, ContractPrice } from '../domain/types'
import { contractRefusal, nextAaCode, normaliseAaCode, type ContractRefusalContext } from '../domain/billing/contracts'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

function refusalContext(state: AppState, prev?: Contract): ContractRefusalContext {
  return {
    ...(prev !== undefined ? { prev } : {}),
    parties: state.masters.parties,
    contracts: state.masters.contracts,
    surgeonIds: new Set(Object.keys(state.masters.surgeons)),
    anaesthetistIds: new Set(Object.keys(state.masters.anaesthetists)),
  }
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
  /** INTERIM until Phase 24: the Method 3 (rate x time) gate. */
  permitsRateTime?: boolean
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
    pricing: input.pricing,
    status: 'active',
    ...(reference !== '' ? { holderReference: reference } : {}),
    permitsRateTime: input.permitsRateTime ?? false,
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
    metas.push({ entityType: 'contract', entityId: contract.id, action: 'contract.create', after, stampBookingId: null })
    return { masters: { ...s.masters, contracts: { ...s.masters.contracts, [contract.id]: contract } }, counters: alloc.counters }
  })
  if (created === undefined) return refuse('createFailed', 'The Contract could not be created.')
  return ok({ contract: created })
}

/**
 * A patch to a Contract. Any field may be named, but `contractRefusal` refuses
 * a change to the holder, prepaid or the pricing kind, and anything but the
 * name and AA code on No contract · RVG. The status changes only through
 * `disableContract` and `enableContract`. A blank `holderReference`, or
 * `linkedAnaesthetistId` set to undefined, clears it.
 */
export type ContractEditPatch = Partial<Omit<Contract, 'id' | 'status'>>

type ContractAction = 'contract.update' | 'contract.disable' | 'contract.enable'

function save(api: AppStoreApi, actor: Actor, contractId: string, apply: (prev: Contract) => Contract, audit: { action: ContractAction }): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change a Contract.')
  const state = api.getState()
  const prev = state.masters.contracts[contractId]
  if (prev === undefined) return refuse('notFound', 'Contract not found.')
  const next = apply(prev)
  const refused = contractRefusal(next, refusalContext(state, prev))
  if (refused !== null) return refuse(refused.code, refused.message)
  const { before, after } = diff(prev, next)
  if (Object.keys(after).length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'contract', entityId: contractId, action: audit.action, before, after, stampBookingId: null },
    (s) => ({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contractId]: next } } }),
  )
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
        Object.entries(patch).filter(([k, v]) => v !== undefined || k === 'linkedAnaesthetistId' || k === 'holderReference'),
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

// ---------------------------------------------------------------------------
// Contract prices (the fixed kind's interim rows, until Phase 19a's price ranges)
// ---------------------------------------------------------------------------

export interface ContractPriceInput {
  contractId: string
  rvgBaseCode?: string
  surgeonId?: string
  /** 1-based position on the Booking (the 2nd-procedure ordinal rule). */
  procedureOrdinal?: number
  price: number
}

/** Add a fixed-price row to a contract's price list. Audited `contractPrice.create`. */
export function addContractPrice(api: AppStoreApi, actor: Actor, input: ContractPriceInput): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a contract price.')
  const state = api.getState()
  const contract = state.masters.contracts[input.contractId]
  if (contract === undefined) return refuse('notFound', 'Contract not found.')
  if (contract.pricing.kind !== 'fixed') return refuse('notFixedPrice', 'Only a fixed-price Contract has prices.')
  if (!(input.price > 0)) return refuse('invalidPrice', 'The price must be greater than zero.')

  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'contractPrice')
    id = alloc.id
    const row: ContractPrice = {
      id: alloc.id,
      contractId: input.contractId,
      price: input.price,
      ...(input.rvgBaseCode !== undefined && input.rvgBaseCode !== '' ? { rvgBaseCode: input.rvgBaseCode } : {}),
      ...(input.surgeonId !== undefined && input.surgeonId !== '' ? { surgeonId: input.surgeonId } : {}),
      ...(input.procedureOrdinal !== undefined ? { procedureOrdinal: input.procedureOrdinal } : {}),
    }
    metas.push({
      entityType: 'contractPrice',
      entityId: alloc.id,
      action: 'contractPrice.create',
      after: { contractId: input.contractId, price: input.price, rvgBaseCode: row.rvgBaseCode, procedureOrdinal: row.procedureOrdinal },
      stampBookingId: null,
    })
    return { masters: { ...s.masters, contractPrices: { ...s.masters.contractPrices, [alloc.id]: row } }, counters: alloc.counters }
  })
  return ok({ id })
}

/** Editable price-row fields (id and contract are immutable). */
export type ContractPricePatch = Partial<Omit<ContractPrice, 'id' | 'contractId'>>

/** Edit a contract price row. Audited `contractPrice.update`. */
export function editContractPrice(api: AppStoreApi, actor: Actor, priceId: string, patch: ContractPricePatch): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a contract price.')
  const state = api.getState()
  const existing = state.masters.contractPrices[priceId]
  if (existing === undefined) return refuse('notFound', 'Contract price not found.')
  if (patch.price !== undefined && !(patch.price > 0)) return refuse('invalidPrice', 'The price must be greater than zero.')

  const next: ContractPrice = { ...existing, ...patch }
  mutate(
    api,
    actor,
    {
      entityType: 'contractPrice',
      entityId: priceId,
      action: 'contractPrice.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof ContractPrice]])),
      after: patch,
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, contractPrices: { ...s.masters.contractPrices, [priceId]: next } } }),
  )
  return ok(undefined)
}
