/**
 * The authorisation-review FLAGS helper (Phase 07) — a PURE, tested function
 * computing the sanity-check flags per Card/Procedure from real fields.
 *
 * DESIGN DECISION (session 2026-07-23, Decisions log): the mockup's "Duration
 * above median for 47516" flag is a mockup flourish with NO RFP basis, so it is
 * NOT built. The RFP defines the office sanity check as "Contract, Insurer, and
 * reference completeness" (RFP.md:898) and says mobile validation reduces the
 * office's burden — so we build only the RFP-grounded flags:
 *   (a) a Card not marked completed          (neutral — a moved-in incomplete Card is visible)
 *   (b) a missing billing reference on the hospital (contract-holder) route (neutral)
 *   (c) an ACC-related procedure billed to the Billable Party route (amber advisory)
 *   (d) any manually-overridden B/T/M unit, with the delta vs the natural
 *       computation ("T adjusted +1 manually") (neutral, informational)
 *
 * Pure: it takes precomputed fee views (from `procedureFee`) so it never reaches
 * into the store; the review screen computes fees once for its table and passes
 * them here.
 */

import type { Card, Procedure, RvgCode } from '../../domain/types'
import { resolveBtm, type BtmBreakdown, type FeeResult } from '../../domain/billing/fee'
import { billingReferenceMissing } from '../../domain/billing'

export type FlagTone = 'neutral' | 'warn'

export interface ReviewFlag {
  tone: FlagTone
  text: string
  cardId: string
  procedureId?: string
}

export interface ReviewProcedureInput {
  procedure: Procedure
  /** The computed fee (from `procedureFee`) — its `btm` provenance drives (d). */
  fee: FeeResult
  /** The base RVG code, for recomputing the natural B/T/M to diff against. */
  baseCode?: RvgCode
}

/** The derived pre-payment status, passed in so `reviewFlags` stays pure (no store). */
export type ReviewPrepaymentStatus = 'none' | 'required' | 'outstanding' | 'paid' | 'overridden'

export interface ReviewCardInput {
  card: Card
  procedures: readonly ReviewProcedureInput[]
  /** From the store's `prepaymentStatusFor` (Phase 09). Absent = not evaluated. */
  prepaymentStatus?: ReviewPrepaymentStatus
}

/** The natural (non-overridden) B/T/M computation, to diff a manual override against. */
function naturalBtm(procedure: Procedure, baseCode?: RvgCode): BtmBreakdown {
  const stripped: Procedure = { ...procedure }
  delete stripped.baseUnitsCaptured
  delete stripped.timeUnitsCaptured
  delete stripped.modifierUnitsCaptured
  return resolveBtm(stripped, baseCode)
}

/** Flags for a single Card. A cancelled Card yields none (excluded from review). */
export function reviewFlagsForCard({ card, procedures, prepaymentStatus }: ReviewCardInput): ReviewFlag[] {
  if (card.cancellation !== undefined) return []
  const flags: ReviewFlag[] = []

  // (a) not marked completed.
  if (!card.completed) {
    flags.push({ tone: 'neutral', text: 'Not marked completed', cardId: card.id })
  }

  // (e) pre-payment still to resolve, or lifted by an office override (Phase 09;
  // B7). Both are flagged (warn) so the office sees them at authorisation.
  if (prepaymentStatus === 'required' || prepaymentStatus === 'outstanding') {
    flags.push({ tone: 'warn', text: 'Pre-payment outstanding', cardId: card.id })
  } else if (prepaymentStatus === 'overridden') {
    flags.push({ tone: 'warn', text: 'Pre-payment gate overridden', cardId: card.id })
  }

  for (const { procedure, fee, baseCode } of procedures) {
    // (b) missing billing reference on the contract-holder route.
    if (billingReferenceMissing(procedure)) {
      flags.push({ tone: 'neutral', text: 'No billing reference', cardId: card.id, procedureId: procedure.id })
    }
    // (c) ACC procedure on the Billable Party route (RFP: ACC should not bill the patient directly).
    if (procedure.accRelated && procedure.billingRoute === 'billableParty') {
      flags.push({
        tone: 'warn',
        text: 'ACC should not bill the patient directly',
        cardId: card.id,
        procedureId: procedure.id,
      })
    }
    // (d) manual B/T/M override provenance, with the delta vs the natural value.
    const nat = naturalBtm(procedure, baseCode)
    const components: { label: string; units: number; source: string; natural: number }[] = [
      { label: 'B', units: fee.btm.base.units, source: fee.btm.base.source, natural: nat.base.units },
      { label: 'T', units: fee.btm.time.units, source: fee.btm.time.source, natural: nat.time.units },
      { label: 'M', units: fee.btm.modifiers.units, source: fee.btm.modifiers.source, natural: nat.modifiers.units },
    ]
    for (const c of components) {
      if (c.source !== 'overridden') continue
      const delta = c.units - c.natural
      const text =
        delta === 0
          ? `${c.label} set manually`
          : `${c.label} adjusted ${delta > 0 ? '+' : ''}${delta} manually`
      flags.push({ tone: 'neutral', text, cardId: card.id, procedureId: procedure.id })
    }
  }

  return flags
}

/** All flags across a List's Cards (cancelled Cards excluded). The FLAGS tile counts these. */
export function reviewFlagsForList(cards: readonly ReviewCardInput[]): ReviewFlag[] {
  return cards.flatMap((c) => reviewFlagsForCard(c))
}
