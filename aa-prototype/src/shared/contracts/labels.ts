/**
 * The Party and Contract words, defined once (catch-up Phase 18). Shared, not
 * admin-only, so the office billing setup on every app reads the same labels
 * and the PWA purity test holds.
 */

import { NO_PRICE_YET, prepaymentStatusWords } from '../booking/prepaymentText'
import type { BillsTo, Contract, ContractPricing, ContractStatus, DeliveryMethod, PartyKind, PricingKind } from '../../domain/types'
import type { PricingBasis, StackSurface } from '../../domain/billing/procedureStack'
import { formatMoney } from '../../domain/billing/money'
import type { ContractGroupWords } from '../../domain/billing/contractGroups'
import { surnameOf } from '../format'

export const PARTY_KIND_LABEL: Record<PartyKind, string> = {
  aa: 'Anaesthesia Associates',
  hospital: 'Hospital',
  insurer: 'Insurer',
  funder: 'Funder',
  surgeon: 'Surgeon',
  surgeonGroup: 'Surgeon group',
  anaesthetist: 'Anaesthetist',
}

/** The kinds as plural headings (build plan Phase 47's Kind grouping and the Holder index's sections); AA reads as its name. */
export const PARTY_KIND_PLURAL: Record<PartyKind, string> = {
  aa: 'Anaesthesia Associates',
  hospital: 'Hospitals',
  insurer: 'Insurers',
  funder: 'Funders',
  surgeon: 'Surgeons',
  surgeonGroup: 'Surgeon groups',
  anaesthetist: 'Anaesthetists',
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
      return `RVG at ${formatMoney(pricing.unitRate)} per unit`
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

/**
 * Who may change the price on an RVG Contract (catch-up Phase 24; US-04.2.2): the Contract
 * catalogue's pill. Office only (catch-up Phase 43a): `shared/viewer.ts`'s guard test forbids
 * both phrases on every anaesthetist screen.
 */
export const OVERRIDE_PILL_LABEL = {
  may: 'Anaesthetist can override the price',
  fixed: 'Price fixed for the anaesthetist',
} as const

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

/**
 * A Procedure's pricing basis with its figure, for the procedure stack (catch-up Phase 20a;
 * US-03.1.2): "RVG at your rate", "RVG less 10%", "Fixed price $3,565.00", and on an open price (the
 * No contract · Fixed price backstop; there is no "Other price" toggle, D16) "Price typed $2,000.00".
 * The figure prints as all money does, with cents (UI unification U1, question 21).
 * The RVG kinds share pricingLabel's words; the basis, never the computed fee.
 */
export function formatPricingBasis(basis: PricingBasis, surface: StackSurface): string {
  // A prepaid Procedure reads its prepaid amount and status (catch-up Phase 27, US-03.1.8).
  if (basis.prepaid !== undefined) {
    const amount = basis.prepaid.amount !== null ? formatMoney(basis.prepaid.amount) : NO_PRICE_YET.toLowerCase()
    return `Prepaid amount ${amount} · ${prepaymentStatusWords(basis.prepaid.status)}`
  }
  const kind = formatKindBasis(basis, surface)
  // A typed price holding the price on a kind that is not open price (catch-up Phase 24).
  return basis.typed !== undefined ? `${kind} · Price typed ${formatMoney(basis.typed)}` : kind
}

function formatKindBasis(basis: PricingBasis, surface: StackSurface): string {
  switch (basis.kind) {
    case 'rvgAnaesthetistRate':
      return surface === 'anaesthetist' ? 'RVG at your rate' : PRICING_KIND_LABEL.rvgAnaesthetistRate
    case 'rvgContractRate':
      return pricingLabel({ kind: 'rvgContractRate', unitRate: basis.perUnit })
    case 'rvgDiscount':
      return pricingLabel({ kind: 'rvgDiscount', discountPct: basis.percent })
    case 'fixed':
      return basis.amount !== null ? PRICING_KIND_LABEL.fixed + ' ' + formatMoney(basis.amount) : PRICING_KIND_LABEL.fixed + ', none in force on this date'
    case 'open':
      return basis.amount !== null ? 'Price typed ' + formatMoney(basis.amount) : 'No price typed yet'
  }
}

/** The words the grouped Contract catalogue names its groups with (build plan Phase 47; `groupContracts`). */
export const CONTRACT_GROUP_WORDS: ContractGroupWords = {
  kindPlural: PARTY_KIND_PLURAL,
  pricingKind: PRICING_KIND_LABEL,
  surname: surnameOf,
  noTag: 'No tag',
  noSurgeon: 'Not linked to a surgeon',
  patient: 'Patient',
  special: 'Special',
  standard: 'Standard',
  prepaid: 'Prepaid',
}
