/**
 * The Contract event fee actions (catch-up Phase 39b; US-03.7.2, OQ-12): the
 * office adds, edits and removes a Contract's fixed fee for a type of pre-op
 * or post-op event. Edited in place, as every Contract setting is (AR-58 5.7:
 * no version, no copy), and audited. A fee edit reaches only events not yet
 * approved: an approved event keeps its frozen `pricing`. Nothing here reads
 * or changes a Procedure's price or the Contract picker's candidates.
 */

import type { ContractEventFee } from '../domain/types'
import { contractEventFeeRefusal, type ContractEventFeeInput } from '../domain/billing/contractEventFees'
import { EVENT_TYPES } from '../domain/billing/prePostOpEvent'
import { roundToCents } from '../domain/billing/money'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

const OFFICE_ONLY = 'Only the office can change a Contract.'
const NOT_FOUND = 'Event fee not found.'

function clean(input: ContractEventFeeInput): Omit<ContractEventFee, 'id' | 'contractId'> {
  const code = input.holderCode?.trim()
  const description = input.holderDescription?.trim()
  return {
    eventType: input.eventType,
    ...(code !== undefined && code !== '' ? { holderCode: code } : {}),
    ...(description !== undefined && description !== '' ? { holderDescription: description } : {}),
    fixedPrice: roundToCents(input.fixedPrice),
  }
}

function refusalFor(state: Pick<AppState, 'masters'>, contractId: string, input: ContractEventFeeInput, exceptId?: string): Outcome<null> {
  const bad = contractEventFeeRefusal(input, {
    contractExists: state.masters.contracts[contractId] !== undefined,
    contractId,
    eventFees: state.masters.contractEventFees,
    knownTypes: Object.keys(EVENT_TYPES),
    ...(exceptId !== undefined ? { exceptId } : {}),
  })
  return bad === null ? ok(null) : refuse(bad.code, bad.message)
}

/** The office adds a fixed fee for a type of event to a Contract (at most one per type). */
export function addContractEventFee(api: AppStoreApi, actor: Actor, contractId: string, input: ContractEventFeeInput): Outcome<{ feeId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const bad = refusalFor(state, contractId, input)
  if (!bad.ok) return bad
  let feeId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const id = allocateId(s.counters, 'contractEventFee')
    feeId = id.id
    const fee: ContractEventFee = { id: id.id, contractId, ...clean(input) }
    metas.push({ entityType: 'contractEventFee', entityId: id.id, action: 'contractEventFee.add', after: structuredClone(fee), stampBookingId: null })
    return { masters: { ...s.masters, contractEventFees: { ...s.masters.contractEventFees, [id.id]: fee } }, counters: id.counters }
  })
  return ok({ feeId })
}

/** The office edits a fee in place. */
export function editContractEventFee(api: AppStoreApi, actor: Actor, feeId: string, input: ContractEventFeeInput): Outcome<{ feeId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const state = api.getState()
  const before = state.masters.contractEventFees[feeId]
  if (before === undefined) return refuse('notFound', NOT_FOUND)
  const bad = refusalFor(state, before.contractId, input, feeId)
  if (!bad.ok) return bad
  const after: ContractEventFee = { id: feeId, contractId: before.contractId, ...clean(input) }
  mutate(api, actor, { entityType: 'contractEventFee', entityId: feeId, action: 'contractEventFee.edit', before: structuredClone(before), after: structuredClone(after), stampBookingId: null }, (s) => ({
    masters: { ...s.masters, contractEventFees: { ...s.masters.contractEventFees, [feeId]: after } },
  }))
  return ok({ feeId })
}

/** The office removes a fee; the audit keeps the full record. */
export function removeContractEventFee(api: AppStoreApi, actor: Actor, feeId: string): Outcome<{ feeId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ONLY)
  const before = api.getState().masters.contractEventFees[feeId]
  if (before === undefined) return refuse('notFound', NOT_FOUND)
  mutate(api, actor, { entityType: 'contractEventFee', entityId: feeId, action: 'contractEventFee.remove', before: structuredClone(before), stampBookingId: null }, (s) => {
    const contractEventFees = { ...s.masters.contractEventFees }
    delete contractEventFees[feeId]
    return { masters: { ...s.masters, contractEventFees } }
  })
  return ok({ feeId })
}
