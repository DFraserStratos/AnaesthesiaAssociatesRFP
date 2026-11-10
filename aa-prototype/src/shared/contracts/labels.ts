/**
 * The Party and Contract words, defined once (catch-up Phase 18). Shared, not
 * admin-only, so the office billing setup on every app reads the same labels
 * and the PWA purity test holds.
 */

import type { BillsTo, Contract, ContractPricing, ContractStatus, DeliveryMethod, PartyKind, PricingKind } from '../../domain/types'

export const PARTY_KIND_LABEL: Record<PartyKind, string> = {
  aa: 'Anaesthesia Associates',
  hospital: 'Hospital',
  insurer: 'Insurer',
  funder: 'Funder',
  surgeon: 'Surgeon',
  surgeonGroup: 'Surgeon group',
  anaesthetist: 'Anaesthetist',
}

export const DELIVERY_LABEL: Record<DeliveryMethod, string> = {
  email: 'Email',
  post: 'Post',
}

export const PRICING_KIND_LABEL: Record<PricingKind, string> = {
  rvgAnaesthetistRate: "RVG at the anaesthetist's rate",
  rvgContractRate: "RVG at the Contract's rate",
  rvgDiscount: 'RVG less a discount',
  fixed: 'Fixed price',
  // The open-price fallbacks (Phase 18a): named "Fixed price", priced by an amount a person types.
  open: 'Amount typed on the Procedure',
}

/** A Contract's pricing as one short phrase: "RVG at $26.50 per unit", "RVG less 10%". */
export function pricingLabel(pricing: ContractPricing): string {
  switch (pricing.kind) {
    case 'rvgContractRate':
      return `RVG at $${pricing.unitRate.toFixed(2)} per unit`
    case 'rvgDiscount':
      return `RVG less ${pricing.discountPct}%`
    default:
      return PRICING_KIND_LABEL[pricing.kind]
  }
}

export const BILLS_LABEL: Record<BillsTo, string> = {
  holder: 'Holder',
  payer: 'Payer',
}

export const STATUS_LABEL: Record<ContractStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
}

/**
 * How a Contract is named wherever one is chosen or shown on a Booking:
 * "<AA code> · <name>", with " (disabled)" when asked and it is Disabled.
 */
export function contractLabel(contract: Pick<Contract, 'aaCode' | 'name' | 'status'>, options: { withStatus?: boolean } = {}): string {
  const label = `${contract.aaCode} · ${contract.name}`
  return options.withStatus === true && contract.status === 'disabled' ? `${label} (disabled)` : label
}
