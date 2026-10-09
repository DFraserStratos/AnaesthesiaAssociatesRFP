/**
 * The warning model (catch-up Phase 15a; FT-13.7, US-13.7.1, DM-31).
 *
 * One routine checks each Booking against registered rules and produces
 * Warning records: kind (before or after the procedure), strength (mild or
 * strong), text and source rule, several per Booking. A warning NEVER blocks:
 * no guard, validator or lifecycle action reads these types. Warnings are
 * derived, never stored; only an office clearance is stored (in the store's
 * `schedule.warningClearances`, outside the Booking).
 *
 * Pure (enforced by `domainPurity.test.ts`).
 */

import type { AaFeeSettings, ActorRole, Booking, BookingId, IsoDate, IsoDateTime, List, Procedure, ProcedureId } from '../types'

export type WarningKind = 'beforeProcedure' | 'afterProcedure'
export type WarningStrength = 'mild' | 'strong'

/** Every registered rule. Phases 19, 21, 27 and 40 widen the union. */
export type WarningRuleId = 'prepaymentUnpaid'

/** The derived prepayment state a rule may read (the store's `prepaymentStatusFor`). */
export type WarningPrepaymentStatus = 'none' | 'required' | 'outstanding' | 'paid'

/**
 * Everything a rule may read, built by the store (`warningFactsFor`). Later
 * phases add optional facts; a rule must treat a missing optional fact as
 * "condition not present".
 */
export interface WarningFacts {
  booking: Booking
  list: List
  procedures: readonly Procedure[]
  prepaymentStatus: WarningPrepaymentStatus
  /** From the demo clock, never `Date.now()`. */
  todayISO: IsoDate
}

export type WarningParams = Readonly<Record<string, number>>

/** One condition a rule found, before the routine stamps it. */
export interface WarningFinding {
  kind: WarningKind
  strength: WarningStrength
  text: string
  /** Set for a per-Procedure finding; becomes part of the warning key. */
  procedureId?: ProcedureId
}

export interface WarningRule {
  id: WarningRuleId
  label: string
  defaultParams: WarningParams
  evaluate(facts: WarningFacts, params: WarningParams): readonly WarningFinding[]
}

/** An office clearance: who cleared which warning, when, and at what strength. */
export interface WarningClearance {
  key: string
  bookingId: BookingId
  ruleId: WarningRuleId
  strength: WarningStrength
  by: string
  role: ActorRole
  atISO: IsoDateTime
}

export interface Warning extends WarningFinding {
  /** Deterministic: `${bookingId}:${ruleId}` plus `:${procedureId}` when per-Procedure. */
  key: string
  bookingId: BookingId
  ruleId: WarningRuleId
  /** Present only when a stored clearance covers this warning's current strength. */
  clearance?: WarningClearance
}

/** One rule's settings in the app-settings record (no UI: US-13.7.4 is Future). */
export interface WarningRuleSetting {
  active: boolean
  params: Record<string, number>
}

/**
 * The app-settings record (DM-31: DemoSettings is the wrong home for rule
 * parameters). A rule absent from `warningRules` reads as active with its
 * defaults.
 */
export interface AppSettings {
  warningRules: Partial<Record<WarningRuleId, WarningRuleSetting>>
  /** AA's monthly fee settings (catch-up Phase 16; US-10.3.3), every amount ex GST. */
  aaFee: AaFeeSettings
}

export function warningKey(bookingId: BookingId, ruleId: WarningRuleId, procedureId?: ProcedureId): string {
  return procedureId === undefined ? `${bookingId}:${ruleId}` : `${bookingId}:${ruleId}:${procedureId}`
}
