/**
 * A Contract being entered (build plan Phase 46; US-04.1.2 New contract order):
 * the form's fields and the rules derived from them, in the order the rules
 * depend on each other: the holder and who it bills, then pricing, then where
 * it is offered, then the name and codes. Every rule is the billing module's
 * (`billsPayerOnly`, `takesLinks`, `isRvgKind`, `CHOOSABLE_PRICING_KINDS`);
 * this file only applies them. Changing an earlier field re-checks the later
 * ones, so a stale link, override, rate or first range never reaches the save.
 * The save itself is the store's `createContract`, whose guard has the last word.
 *
 * No page code: New contract uses it, and Phase 49's Replace sheet starts it
 * from the old Contract's values (`initial`).
 */

import { useMemo, useState } from 'react'
import {
  CHOOSABLE_PRICING_KINDS,
  CONTRACT_REFUSAL_MESSAGES,
  billsPayerOnly,
  isRvgKind,
  takesLinks,
  type BillsTo,
  type ContractPricing,
  type PricingKind,
} from '../../../domain/billing/contracts'
import type { Party, PartyId } from '../../../domain/billing/parties'
import type { Contract } from '../../../domain/types'
import { parsePriceText } from '../../../domain/billing/priceRanges'
import { PARTY_KIND_LABEL } from '../../../shared/contracts'
import { useAppStore, type ContractInput } from '../../../store'

/** The fields as typed. Money and dates stay text until the save. */
export interface ContractDraft {
  holderId: string
  billsTo: BillsTo
  prepaid: boolean
  kind: PricingKind
  /** `rvgContractRate`: $ per unit. */
  rate: string
  /** `rvgDiscount`: percent off. */
  discount: string
  /** `fixed`: the first price range's start (yyyy-MM-dd) and price (ex GST). */
  firstStart: string
  firstPrice: string
  /** The anaesthetist may change the price: RVG kinds only. */
  override: boolean
  surgeonIds: string[]
  anaesthetistId: string
  specialtyIds: string[]
  fundingTagId: string
  name: string
  holderReference: string
  invoiceDescription: string
  defaultRvgGroupId: string | null
}

export const EMPTY_CONTRACT_DRAFT: ContractDraft = {
  holderId: '',
  billsTo: 'holder',
  prepaid: false,
  kind: 'rvgAnaesthetistRate',
  rate: '',
  discount: '',
  firstStart: '',
  firstPrice: '',
  override: false,
  surgeonIds: [],
  anaesthetistId: '',
  specialtyIds: [],
  fundingTagId: '',
  name: '',
  holderReference: '',
  invoiceDescription: '',
  defaultRvgGroupId: null,
}

type Parties = Readonly<Record<PartyId, Party>>

/** A pricing kind as offered, with why it cannot be picked when it cannot. */
export interface KindOption {
  kind: PricingKind
  disabledReason?: string
}

/** What the draft's fields allow, derived from the billing rules. */
export interface DraftRules {
  holder: Party | undefined
  /** Bills is fixed to the payer (an AA- or anaesthetist-held Contract, or a prepaid one). */
  forcedPayer: boolean
  /** The holder alone forces the payer (AA or an anaesthetist), prepaid aside. */
  holderForcesPayer: boolean
  /** Bills as shown and saved. */
  billsTo: BillsTo
  /** The holder takes linked surgeons and an anaesthetist (never a hospital). */
  showLinks: boolean
  /** The chosen kind is priced from RVG units (the override exists only there). */
  rvg: boolean
  kinds: KindOption[]
}

export function draftRules(draft: ContractDraft, parties: Parties): DraftRules {
  const holder = parties[draft.holderId]
  const forcedPayer = billsPayerOnly(holder?.kind, draft.prepaid)
  return {
    holder,
    forcedPayer,
    holderForcesPayer: billsPayerOnly(holder?.kind, false),
    billsTo: forcedPayer ? 'payer' : draft.billsTo,
    showLinks: takesLinks(holder?.kind),
    rvg: isRvgKind(draft.kind),
    kinds: CHOOSABLE_PRICING_KINDS.map((kind) =>
      draft.prepaid && isRvgKind(kind) ? { kind, disabledReason: CONTRACT_REFUSAL_MESSAGES.prepaidNotRvg } : { kind },
    ),
  }
}

/**
 * Apply a change, then re-check every later field through the rules: a holder
 * that takes no links clears them; a forced payer sets Bills to the payer;
 * prepaid moves an RVG kind to Fixed price; a non-RVG kind clears the
 * override; a kind change clears the rate, discount and first range it no
 * longer uses.
 */
export function changeDraft(draft: ContractDraft, patch: Partial<ContractDraft>, parties: Parties): ContractDraft {
  const next: ContractDraft = { ...draft, ...patch }
  const holderKind = parties[next.holderId]?.kind
  if (!takesLinks(holderKind)) {
    next.surgeonIds = []
    next.anaesthetistId = ''
  }
  if (billsPayerOnly(holderKind, next.prepaid)) next.billsTo = 'payer'
  if (next.prepaid && isRvgKind(next.kind)) next.kind = 'fixed'
  if (!isRvgKind(next.kind)) next.override = false
  if (next.kind !== draft.kind) {
    if (next.kind !== 'rvgContractRate') next.rate = ''
    if (next.kind !== 'rvgDiscount') next.discount = ''
    if (next.kind !== 'fixed') {
      next.firstStart = ''
      next.firstPrice = ''
    }
  }
  return next
}

/** The pricing the draft's kind and fields describe. */
export function draftPricing(draft: ContractDraft): ContractPricing {
  switch (draft.kind) {
    case 'rvgContractRate':
      return { kind: 'rvgContractRate', unitRate: Number(draft.rate) }
    case 'rvgDiscount':
      return { kind: 'rvgDiscount', discountPct: Number(draft.discount) }
    case 'fixed':
      return {
        kind: 'fixed',
        ranges: draft.firstStart === '' && draft.firstPrice.trim() === '' ? [] : [{ startISO: draft.firstStart, price: parsePriceText(draft.firstPrice) }],
      }
    case 'open':
      return { kind: 'open' }
    default:
      return { kind: 'rvgAnaesthetistRate' }
  }
}

/** What the draft submits to `createContract`. */
export function draftInput(draft: ContractDraft, parties: Parties): ContractInput {
  const rules = draftRules(draft, parties)
  return {
    name: draft.name,
    holderId: draft.holderId,
    billsTo: rules.billsTo,
    pricing: draftPricing(draft),
    prepaid: draft.prepaid,
    anaesthetistMayOverridePrice: rules.rvg && draft.override,
    linkedSurgeonIds: rules.showLinks ? draft.surgeonIds : [],
    ...(rules.showLinks && draft.anaesthetistId !== '' ? { linkedAnaesthetistId: draft.anaesthetistId } : {}),
    holderReference: draft.holderReference,
    invoiceDescription: draft.invoiceDescription,
    defaultRvgGroupId: draft.defaultRvgGroupId,
    specialtyIds: draft.specialtyIds,
    ...(draft.fundingTagId !== '' ? { fundingTagId: draft.fundingTagId } : {}),
  }
}

/** The Parties a Contract may be held by, grouped under their kind's label, each group by name. */
export function holderGroups(parties: Parties): [string, { id: string; name: string }[]][] {
  const groups = new Map<string, { id: string; name: string }[]>()
  for (const p of Object.values(parties).sort((a, b) => a.name.localeCompare(b.name))) {
    const label = PARTY_KIND_LABEL[p.kind]
    groups.set(label, [...(groups.get(label) ?? []), { id: p.id, name: p.name }])
  }
  return [...groups.entries()]
}

/**
 * A Contract's settings as a draft (build plan Phase 49): Replace from a date
 * starts the form from the old Contract. A fixed price's ranges are not draft
 * fields: the replacement copies them as they stand (`contractInputOf`), so the
 * first-range fields stay empty.
 */
export function draftOf(contract: Contract): ContractDraft {
  return {
    holderId: contract.holderId,
    billsTo: contract.billsTo,
    prepaid: contract.prepaid,
    kind: contract.pricing.kind,
    rate: contract.pricing.kind === 'rvgContractRate' ? String(contract.pricing.unitRate) : '',
    discount: contract.pricing.kind === 'rvgDiscount' ? String(contract.pricing.discountPct) : '',
    firstStart: '',
    firstPrice: '',
    override: contract.anaesthetistMayOverridePrice,
    surgeonIds: [...contract.linkedSurgeonIds],
    anaesthetistId: contract.linkedAnaesthetistId ?? '',
    specialtyIds: [...contract.specialtyIds],
    fundingTagId: contract.fundingTagId ?? '',
    name: contract.name,
    holderReference: contract.holderReference ?? '',
    invoiceDescription: contract.invoiceDescription ?? '',
    defaultRvgGroupId: contract.defaultRvgGroupId ?? null,
  }
}

/** The form's state over the store's Parties: the fields, a setter that re-checks, the rules and the input. */
export function useContractDraft(initial: Partial<ContractDraft> = {}) {
  const parties = useAppStore((s) => s.masters.parties)
  const [draft, setDraft] = useState<ContractDraft>(() => changeDraft(EMPTY_CONTRACT_DRAFT, initial, parties))
  const rules = useMemo(() => draftRules(draft, parties), [draft, parties])
  const input = useMemo(() => draftInput(draft, parties), [draft, parties])
  const groups = useMemo(() => holderGroups(parties), [parties])
  const set = (patch: Partial<ContractDraft>) => setDraft((d) => changeDraft(d, patch, parties))
  return { draft, set, rules, input, holderGroups: groups }
}
