/**
 * Splitting one Procedure's fee between billable parties (catch-up Phase 22;
 * US-08.2.3, DM-28, RV-31; the owner's typed decision of 2026-10-05). A user
 * action on the Booking: the office, or the anaesthetist on their own
 * Booking, presses Split on the Procedure's Contract part and types each
 * party's share in $ or %. There is no setting on the Contract or the
 * Procedure and no default from the Contract.
 *
 * The one home of the split basis: the parser, the rule, the rounding and the
 * wording. Two details are not settled in the catalogue (US-08.2.3 note) and
 * are built as one reading each, logged for the owner:
 *
 *  - the rule: two or more distinct parties; at most one takes "the rest",
 *    and then the typed shares must come to less than the fee; without one,
 *    the shares must total the fee exactly (percents to 100, or amounts and
 *    percents together to the fee to the cent);
 *  - the wording of the split line and the note on each share's invoice.
 *
 * The split divides the Procedure's final fee ex GST as the engine computed it
 * (after any office price override); it never re-prices.
 */

import type { CounterpartyRef, SplitShare, SplitShareBasis } from '../types'
import { formatMoney, roundToCents, toCents } from './money'

/** A split with no fee under it (no Contract, or no price yet). */
export const NO_FEE_REASON = 'There is no fee to split yet.'

/** The refusal on a Procedure with no fee yet (the Split action and sheet). */
export const NO_FEE_TO_SPLIT_MESSAGE = 'This procedure has no fee to split yet. Choose its Contract and price first.'

/** A share row with no party chosen. */
export const PARTY_MISSING_REASON = 'Choose a party for each share.'

/** A share whose party is no longer the payer on the Booking or a Party that can be billed. */
export const PARTY_GONE_REASON = 'A party in the split is no longer on this Booking or in the Parties list.'

/** The parser's refusal. */
export const SHARE_PARSE_MESSAGE = 'Type an amount such as $48 or a percentage such as 48%.'

/**
 * Read a typed share: "$132.50" or "132.50" is an amount ex GST (a bare
 * number reads as dollars, logged reading), "62.5%" or "62.5 %" a percent.
 */
export function parseShare(text: string): { ok: true; basis: SplitShareBasis } | { ok: false; reason: string } {
  const trimmed = text.trim().replace(/,/g, '')
  const percent = /^(\d+(?:\.\d+)?)\s*%$/.exec(trimmed)
  if (percent !== null) return { ok: true, basis: { kind: 'percent', percent: Number(percent[1]) } }
  const amount = /^\$?\s*(\d+(?:\.\d{1,2})?)$/.exec(trimmed)
  if (amount !== null) return { ok: true, basis: { kind: 'amount', amountExGst: Number(amount[1]) } }
  return { ok: false, reason: SHARE_PARSE_MESSAGE }
}

/** "$132.50", "62.5%" or "the rest". */
export function shareLabel(basis: SplitShareBasis): string {
  if (basis.kind === 'amount') return formatMoney(basis.amountExGst)
  if (basis.kind === 'percent') return `${basis.percent}%`
  return 'the rest'
}

/** The text a share field shows for an existing share ("" for the rest). */
export function shareText(basis: SplitShareBasis): string {
  if (basis.kind === 'amount') return formatMoney(basis.amountExGst)
  if (basis.kind === 'percent') return `${basis.percent}%`
  return ''
}

export interface ResolvedShare {
  party: CounterpartyRef
  amountExGst: number
  isRest: boolean
  basis: SplitShareBasis
}

export type SplitResolution = { ok: true; amounts: ResolvedShare[] } | { ok: false; reason: string }

const sameParty = (a: CounterpartyRef, b: CounterpartyRef): boolean => a.kind === b.kind && a.id === b.id

/**
 * Each share's amount, in share order, to the cent, always totalling the fee
 * (see the module header for the rule). Percents round to cents; any rounding
 * cent goes to the rest party, else to the first share.
 */
export function resolveSplit(feeExGst: number, shares: readonly SplitShare[]): SplitResolution {
  const fee = toCents(feeExGst)
  if (fee <= 0) return { ok: false, reason: NO_FEE_REASON }
  if (shares.length < 2) return { ok: false, reason: 'A split needs at least two parties.' }
  for (let i = 0; i < shares.length; i++) {
    for (let j = i + 1; j < shares.length; j++) {
      if (sameParty(shares[i]!.party, shares[j]!.party)) return { ok: false, reason: 'Each party can have only one share.' }
    }
  }
  const rests = shares.filter((s) => s.basis.kind === 'rest').length
  if (rests > 1) return { ok: false, reason: 'Only one party can take the rest.' }

  const cents: number[] = []
  let percentTotal = 0
  let allPercent = true
  for (const share of shares) {
    const basis = share.basis
    if (basis.kind === 'amount') {
      allPercent = false
      if (!(basis.amountExGst > 0)) return { ok: false, reason: 'Each amount must be more than $0.' }
      cents.push(toCents(basis.amountExGst))
    } else if (basis.kind === 'percent') {
      if (!(basis.percent > 0) || !(basis.percent < 100)) return { ok: false, reason: 'Each percentage must be more than 0% and less than 100%.' }
      percentTotal += basis.percent
      cents.push(toCents(roundToCents((feeExGst * basis.percent) / 100)))
    } else {
      allPercent = false
      cents.push(0)
    }
  }

  const restIndex = shares.findIndex((s) => s.basis.kind === 'rest')
  const typed = cents.reduce((sum, c) => sum + c, 0)
  if (restIndex >= 0) {
    if (typed >= fee) return { ok: false, reason: `The typed shares come to ${formatMoney(typed / 100)}, which leaves nothing for the rest of the fee of ${formatMoney(fee / 100)}.` }
    cents[restIndex] = fee - typed
  } else if (allPercent) {
    if (Math.abs(percentTotal - 100) > 1e-9) return { ok: false, reason: `The percentages come to ${Number(percentTotal.toFixed(6))}%. They must total 100%, or let one party take the rest.` }
    // Rounding cents go to the first share.
    cents[0] = cents[0]! + (fee - typed)
  } else if (typed !== fee) {
    return { ok: false, reason: `The shares come to ${formatMoney(typed / 100)} but the fee is ${formatMoney(fee / 100)}. Make them total the fee, or let one party take the rest.` }
  }

  // Every party named is invoiced something: a share that rounds to nothing is refused, never dropped.
  if (cents.some((c) => c <= 0)) return { ok: false, reason: 'Each share must come to at least $0.01 of the fee.' }

  return {
    ok: true,
    amounts: shares.map((share, i) => ({ party: share.party, amountExGst: cents[i]! / 100, isRest: share.basis.kind === 'rest', basis: share.basis })),
  }
}

/** The reason a stored split no longer fits (the run's `splitDoesNotFit`, the warning rule and review share it). */
export function splitDoesNotFitMessage(feeExGst: number, reason: string): string {
  const lowered = reason.length > 0 ? reason[0]!.toLowerCase() + reason.slice(1) : reason
  return `The split no longer fits the fee of ${formatMoney(feeExGst)}: ${lowered} Open Split to fix it.`
}

/** The line each party's invoice carries for its share: "{wording}: share of the fee of $212.00 ($132.50)". */
export function splitLineText(procedureWording: string, feeExGst: number, basis: SplitShareBasis): string {
  return `${procedureWording}: share of the fee of ${formatMoney(feeExGst)} (${shareLabel(basis)})`
}

/** The note on a share's invoice naming the other shares: "This fee of $212.00 is split. The other shares are invoiced separately to nib, AA-2026-0005." */
export function splitNoteText(feeExGst: number, others: readonly { partyName: string; invoiceNumber: string }[]): string {
  const list = others.map((o) => `${o.partyName}, ${o.invoiceNumber}`).join('; ')
  const noun = others.length === 1 ? 'The other share is' : 'The other shares are'
  return `This fee of ${formatMoney(feeExGst)} is split. ${noun} invoiced separately to ${list}.`
}

/** The Contract part's summary once split: "Split: nib $132.50, Alan Prentice $79.50 (the rest)". */
export function splitSummaryText(amounts: readonly { partyName: string; amountExGst: number; isRest: boolean }[]): string {
  return `Split: ${amounts.map((a) => `${a.partyName} ${formatMoney(a.amountExGst)}${a.isRest ? ' (the rest)' : ''}`).join(', ')}`
}
