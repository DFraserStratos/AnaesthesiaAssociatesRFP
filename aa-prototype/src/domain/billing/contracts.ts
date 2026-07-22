/**
 * Contract selection & Type 3 price matching.
 *
 * Selection precedence (5th review #3): among contracts matching the holder
 * and effective on the date, an individual-anaesthetist-scoped contract (with
 * a matching anaesthetist) beats an organisational one; among organisational
 * matches a specific (non-default) contract beats the protected default
 * Type 1 — which is exactly the RFP's fallback: expired/absent Type 2/3 at a
 * hospital or direct-billing insurer falls back to the default (3rd review #9).
 */

import type { Contract, ContractHolderType, ContractPrice } from '../types'

export interface ContractQuery {
  holder: { holderType: ContractHolderType; holderId: string }
  anaesthetistId: string
  /** The List date — contracts are filtered to those effective on it. */
  dateISO: string
}

function isEffectiveOn(contract: Contract, dateISO: string): boolean {
  if (contract.effectiveFromISO > dateISO) return false
  if (contract.effectiveToISO !== undefined && contract.effectiveToISO < dateISO) return false
  return true
}

/** Higher rank wins; ties resolve to the first candidate in input order. */
function rank(contract: Contract): number {
  if (contract.scope.kind === 'individualAnaesthetist') return 2
  return contract.isDefault ? 0 : 1
}

export function selectContract(
  candidates: readonly Contract[],
  query: ContractQuery,
): Contract | undefined {
  let best: Contract | undefined
  let bestRank = -1

  for (const contract of candidates) {
    if (contract.holderType !== query.holder.holderType) continue
    if (contract.holderId !== query.holder.holderId) continue
    if (!isEffectiveOn(contract, query.dateISO)) continue
    if (
      contract.scope.kind === 'individualAnaesthetist' &&
      contract.scope.anaesthetistId !== query.anaesthetistId
    ) {
      continue
    }
    const r = rank(contract)
    if (r > bestRank) {
      best = contract
      bestRank = r
    }
  }

  return best
}

export interface ContractPriceQuery {
  contractId: string
  rvgBaseCode?: string
  surgeonId?: string
  /** 1-based position of the procedure on its Card. */
  procedureOrdinal?: number
}

/**
 * Most-specific-match-wins: a price row matches when every key IT specifies
 * equals the query's value (an unspecified key on the row matches anything);
 * among matches, the row specifying the most keys wins; ties resolve to the
 * first in input order. Returns undefined when nothing matches — for Type 3
 * that means the BTM fallback (Decisions log 2026-07-22, a demo reading of the
 * RFP's "various rules apply").
 */
export function matchContractPrice(
  prices: readonly ContractPrice[],
  query: ContractPriceQuery,
): ContractPrice | undefined {
  let best: ContractPrice | undefined
  let bestSpecificity = -1

  for (const price of prices) {
    if (price.contractId !== query.contractId) continue

    let specificity = 0
    if (price.rvgBaseCode !== undefined) {
      if (price.rvgBaseCode !== query.rvgBaseCode) continue
      specificity++
    }
    if (price.surgeonId !== undefined) {
      if (price.surgeonId !== query.surgeonId) continue
      specificity++
    }
    if (price.procedureOrdinal !== undefined) {
      if (price.procedureOrdinal !== query.procedureOrdinal) continue
      specificity++
    }

    if (specificity > bestSpecificity) {
      best = price
      bestSpecificity = specificity
    }
  }

  return best
}
