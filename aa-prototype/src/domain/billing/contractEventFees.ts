/**
 * The Contract event fee (catch-up Phase 39b; US-03.7.2, US-05.5.2, OQ-12):
 * a fixed fee a Contract charges for one type of pre-op or post-op event, in
 * place of the time recorded.
 *
 * The flat Contract model (AR-58, AR-61) has no event and no event fee. A
 * Contract replacing a recorded time with a fixed fee (OQ-12's answer, the
 * 2026-10-01 notes #6) needs one; US-03.7.2 no longer states the swap, so it
 * is kept here, beside the Contract, and a model that covers it differently is
 * one edit. It is not a fee extra (those are billing events, D10). It is never
 * read by a Procedure's price or by the Contract picker: only an event's
 * pricing (`pricePrePostOpEvent`) reads it. Edited in place like every
 * Contract setting (AR-58 5.7): no version, no copy; an approved event keeps
 * its frozen price.
 */

import type { ContractId } from '../types'
import type { PrePostOpEventType } from './prePostOpEvent'

export interface ContractEventFee {
  /** `CEF###`. */
  id: string
  /** The Contract (flat: no versions). */
  contractId: ContractId
  eventType: PrePostOpEventType
  /** The holder's own code for the fee (only a label), e.g. `STGACC-PAIN`. */
  holderCode?: string
  holderDescription?: string
  /** Ex GST, dollars to the cent, 0 or more. */
  fixedPrice: number
}

/** The Contract's fee for this type of event, else undefined (at most one per type per Contract). */
export function eventFeeFor(ctx: {
  eventFees: Readonly<Record<string, ContractEventFee>> | readonly ContractEventFee[]
  contractId: string | undefined
  type: PrePostOpEventType
}): ContractEventFee | undefined {
  if (ctx.contractId === undefined) return undefined
  const all = Array.isArray(ctx.eventFees) ? ctx.eventFees : Object.values(ctx.eventFees)
  return all.filter((f) => f.contractId === ctx.contractId && f.eventType === ctx.type).sort((a, b) => a.id.localeCompare(b.id))[0]
}

/** A Contract's event fees, by id. */
export function eventFeesForContract(eventFees: Readonly<Record<string, ContractEventFee>>, contractId: string): ContractEventFee[] {
  return Object.values(eventFees)
    .filter((f) => f.contractId === contractId)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export interface ContractEventFeeInput {
  eventType: PrePostOpEventType
  holderCode?: string
  holderDescription?: string
  fixedPrice: number
}

export type ContractEventFeeRefusalCode = 'contractNotFound' | 'priceInvalid' | 'typeTaken' | 'typeInvalid' | 'codeTooLong' | 'descriptionTooLong'

export const CONTRACT_EVENT_FEE_MESSAGES: Record<ContractEventFeeRefusalCode, string> = {
  contractNotFound: 'Contract not found.',
  priceInvalid: 'Type the fixed price in dollars and cents, 0 or more.',
  typeTaken: 'This Contract already has a fee for that type of event. Edit it instead.',
  typeInvalid: 'Pick the type of event the fee is for.',
  codeTooLong: 'Keep the holder code to 30 characters.',
  descriptionTooLong: 'Keep the description to 120 characters.',
}

/**
 * Whether a fee can be saved on this Contract: a fixed price of 0 or more to
 * the cent, at most one fee per event type (`exceptId` is the fee being
 * edited). Null when it can.
 */
export function contractEventFeeRefusal(
  input: ContractEventFeeInput,
  ctx: { contractExists: boolean; contractId: string; eventFees: Readonly<Record<string, ContractEventFee>>; knownTypes: readonly string[]; exceptId?: string },
): { code: ContractEventFeeRefusalCode; message: string } | null {
  const fail = (code: ContractEventFeeRefusalCode) => ({ code, message: CONTRACT_EVENT_FEE_MESSAGES[code] })
  if (!ctx.contractExists) return fail('contractNotFound')
  if (!ctx.knownTypes.includes(input.eventType)) return fail('typeInvalid')
  const p = input.fixedPrice
  if (!Number.isFinite(p) || p < 0 || Math.abs(Math.round(p * 100) - p * 100) > 1e-6) return fail('priceInvalid')
  if ((input.holderCode ?? '').trim().length > 30) return fail('codeTooLong')
  if ((input.holderDescription ?? '').trim().length > 120) return fail('descriptionTooLong')
  const taken = Object.values(ctx.eventFees).some((f) => f.contractId === ctx.contractId && f.eventType === input.eventType && f.id !== ctx.exceptId)
  if (taken) return fail('typeTaken')
  return null
}
