/**
 * Contract & ContractPrice master mutations (Phase 07). Split from
 * `mastersActions.ts` so the contract surface (create / edit / delete + the
 * Type 3 price rows) stays self-contained. All office-only, all through
 * `mutate()` (audit + `Outcome` refusals as data), `stampCardId: null`.
 *
 * THE default-Type-1 invariant, second half (3rd review #9 / 7th review B14;
 * the creation half lives in `mastersActions.ts`): a hospital's or a
 * direct-billing insurer's protected default Type 1 (`isDefault && type === 1`)
 * MUST always exist as the fallback, so `deleteContract` and an end-dating
 * `editContract` both refuse it. Non-essential edits (e.g. its name) are fine.
 */

import type {
  Contract,
  ContractHolderType,
  ContractPrice,
  ContractScope,
  ContractType2Detail,
} from '../domain/types'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

const DEFAULT_PROTECTED_MESSAGE =
  'This is a hospital or direct-billing insurer default Type 1 contract. It must always exist as the fallback when no other contract applies, so it cannot be deleted or end-dated.'

/** The protected default: a hospital/direct-insurer fallback that must persist. */
function isProtectedDefault(contract: Contract): boolean {
  return contract.isDefault && contract.type === 1
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export interface ContractInput {
  name: string
  type: 1 | 2 | 3
  holderType: ContractHolderType
  holderId: string
  scope: ContractScope
  permitsIndividualArrangement: boolean
  effectiveFromISO: string
  effectiveToISO?: string
  type2Detail?: ContractType2Detail
}

/**
 * Create a contract (any type, any holder). Runtime-created contracts are never
 * the protected default (only `createHospital` / `setInsurerDirectClaims` mint
 * those), so `isDefault` is always false here. Audited `contract.create`.
 */
export function createContract(api: AppStoreApi, actor: Actor, input: ContractInput): Outcome<{ contract: Contract }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can create a contract.')
  const name = input.name.trim()
  if (name === '') return refuse('nameRequired', 'A contract name is required.')
  if (input.holderId.trim() === '') return refuse('holderRequired', 'A contract holder is required.')
  if (input.type === 2 && input.type2Detail === undefined) {
    return refuse('type2DetailRequired', 'A Type 2 contract needs an agreed unit rate or a percentage discount.')
  }

  let created: Contract | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'contract')
    const contract: Contract = {
      id: alloc.id,
      name,
      type: input.type,
      holderType: input.holderType,
      holderId: input.holderId.trim(),
      scope: input.scope,
      permitsIndividualArrangement: input.permitsIndividualArrangement,
      isDefault: false,
      effectiveFromISO: input.effectiveFromISO,
      ...(input.effectiveToISO !== undefined && input.effectiveToISO !== '' ? { effectiveToISO: input.effectiveToISO } : {}),
      ...(input.type === 2 && input.type2Detail !== undefined ? { type2Detail: input.type2Detail } : {}),
    }
    created = contract
    metas.push({
      entityType: 'contract',
      entityId: contract.id,
      action: 'contract.create',
      after: { name, type: contract.type, holderType: contract.holderType, holderId: contract.holderId },
      stampCardId: null,
    })
    return { masters: { ...s.masters, contracts: { ...s.masters.contracts, [contract.id]: contract } }, counters: alloc.counters }
  })
  if (created === undefined) return refuse('createFailed', 'The contract could not be created.')
  return ok({ contract: created })
}

/** Editable Contract fields (id and the protected `isDefault` flag are immutable). */
export type ContractEditPatch = Partial<Omit<Contract, 'id' | 'isDefault'>>

/**
 * Edit a contract. The default-Type-1 invariant refuses any edit of the
 * protected default that would remove the fallback: END-DATING it (a non-empty
 * `effectiveToISO`), changing its `type` away from 1, or moving its holder
 * (`holderType`/`holderId`). Cosmetic edits (its name, effective-from) stay
 * allowed. Guarded in the STORE independently of the UI (convention 6). Audited
 * `contract.update`.
 */
export function editContract(api: AppStoreApi, actor: Actor, contractId: string, patch: ContractEditPatch): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a contract.')
  const state = api.getState()
  const existing = state.masters.contracts[contractId]
  if (existing === undefined) return refuse('notFound', 'Contract not found.')
  if (isProtectedDefault(existing)) {
    const endDated = 'effectiveToISO' in patch && patch.effectiveToISO !== undefined && patch.effectiveToISO !== ''
    const reTyped = patch.type !== undefined && patch.type !== 1
    const reHeld =
      (patch.holderType !== undefined && patch.holderType !== existing.holderType) ||
      (patch.holderId !== undefined && patch.holderId !== existing.holderId)
    if (endDated || reTyped || reHeld) {
      return refuse('defaultContractProtected', DEFAULT_PROTECTED_MESSAGE)
    }
  }

  const next: Contract = { ...existing, ...patch }
  if ('effectiveToISO' in patch && (patch.effectiveToISO === undefined || patch.effectiveToISO === '')) {
    delete next.effectiveToISO
  }
  // A contract no longer of Type 2 keeps no stale agreed-rate/discount detail.
  if (next.type !== 2) delete next.type2Detail
  mutate(
    api,
    actor,
    {
      entityType: 'contract',
      entityId: contractId,
      action: 'contract.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof Contract]])),
      after: patch,
      stampCardId: null,
    },
    (s) => ({ masters: { ...s.masters, contracts: { ...s.masters.contracts, [contractId]: next } } }),
  )
  return ok(undefined)
}

/**
 * Delete a contract and its price rows. The default-Type-1 invariant refuses the
 * protected default. Audited `contract.delete`.
 */
export function deleteContract(api: AppStoreApi, actor: Actor, contractId: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can delete a contract.')
  const state = api.getState()
  const existing = state.masters.contracts[contractId]
  if (existing === undefined) return refuse('notFound', 'Contract not found.')
  if (isProtectedDefault(existing)) return refuse('defaultContractProtected', DEFAULT_PROTECTED_MESSAGE)

  mutate(
    api,
    actor,
    {
      entityType: 'contract',
      entityId: contractId,
      action: 'contract.delete',
      before: { name: existing.name, type: existing.type },
      stampCardId: null,
    },
    (s) => {
      const contracts = { ...s.masters.contracts }
      delete contracts[contractId]
      const contractPrices = { ...s.masters.contractPrices }
      for (const [id, p] of Object.entries(contractPrices)) if (p.contractId === contractId) delete contractPrices[id]
      return { masters: { ...s.masters, contracts, contractPrices } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Contract prices (Type 3 fixed-price rows)
// ---------------------------------------------------------------------------

export interface ContractPriceInput {
  contractId: string
  rvgBaseCode?: string
  surgeonId?: string
  /** 1-based position on the Card (the 2nd-procedure ordinal rule). */
  procedureOrdinal?: number
  price: number
}

/** Add a fixed-price row to a contract's price list. Audited `contractPrice.create`. */
export function addContractPrice(api: AppStoreApi, actor: Actor, input: ContractPriceInput): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a contract price.')
  const state = api.getState()
  if (state.masters.contracts[input.contractId] === undefined) return refuse('notFound', 'Contract not found.')
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
      stampCardId: null,
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
      stampCardId: null,
    },
    (s) => ({ masters: { ...s.masters, contractPrices: { ...s.masters.contractPrices, [priceId]: next } } }),
  )
  return ok(undefined)
}
