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

import type { AaFeeSettings, ActorRole, Booking, BookingId, Contract, IsoDate, Party, IsoDateTime, List, Patient, PaymentCycleSettings, Procedure, ProcedureId, RvgGroup, RvgGroupId, ScheduleSettings } from '../types'

export type WarningKind = 'beforeProcedure' | 'afterProcedure'
export type WarningStrength = 'mild' | 'strong'

/** Every registered rule. Phases 19, 21, 27 and 40 widen the union. */
export type WarningRuleId = 'prepaymentUnpaid' | 'baseUnitsOutsideGuide' | 'childPayer' | 'approvalNumberMissing' | 'splitDoesNotFit'

/** The derived prepayment status a rule may read (the store's `prepaymentStatusFor`, catch-up Phase 27). */
export type WarningPrepaymentStatus = 'none' | 'awaitingApproval' | 'unpaid' | 'partPaid' | 'paid' | 'notNeeded' | 'changedAfterSending'

/** One payer group's prepayment, as the rule reads it (catch-up Phase 27). */
export interface WarningPrepaymentGroup {
  /** 22a's payer identity: the warning's key carries it, so clearing one payer's never hides another's. */
  payerKey: string
  payerName: string
  status: Exclude<WarningPrepaymentStatus, 'none'>
  /** Ex GST; null while a Procedure has no price. */
  amount: number | null
  invoiceNumber?: string
  invoicedTotal: number
  receivedTotal: number
}

/**
 * Everything a rule may read, built by the store (`warningFactsFor`). Later
 * phases add optional facts; a rule must treat a missing optional fact as
 * "condition not present".
 */
export interface WarningFacts {
  booking: Booking
  list: List
  procedures: readonly Procedure[]
  /** The Booking's status: `none`, or its least settled payer group's. */
  prepaymentStatus: WarningPrepaymentStatus
  /** Each payer group (catch-up Phase 27). Absent: `prepaymentUnpaid` finds nothing. */
  prepaymentGroups?: readonly WarningPrepaymentGroup[]
  /** From the demo clock, never `Date.now()`. */
  todayISO: IsoDate
  /** The RVG groups (catch-up Phase 19), for `baseUnitsOutsideGuide`. Absent: that rule finds nothing. */
  rvgGroups?: Readonly<Record<RvgGroupId, RvgGroup>>
  /** The Booking's patient (catch-up Phase 21), for `childPayer`. Absent: that rule finds nothing. */
  patient?: Pick<Patient, 'name' | 'dobISO'>
  /** The Contracts (catch-up Phase 21): who each Procedure bills. Absent: `childPayer` finds nothing. */
  contracts?: Readonly<Record<string, Pick<Contract, 'billsTo'>>>
  /** The Parties (catch-up Phase 21): the Booking's funder's kind and name. Absent: `approvalNumberMissing` finds nothing. */
  parties?: Readonly<Record<string, Pick<Party, 'kind' | 'name'>>>
  /**
   * Each split Procedure's fee ex GST as the run would compute it (catch-up
   * Phase 22), or null with no price yet, and whether every share's party can
   * still be billed on the Booking. Absent: `splitDoesNotFit` finds nothing.
   */
  splits?: Readonly<Record<ProcedureId, { feeExGst: number | null; partiesOn: boolean }>>
}

export type WarningParams = Readonly<Record<string, number>>

/** One condition a rule found, before the routine stamps it. */
export interface WarningFinding {
  kind: WarningKind
  strength: WarningStrength
  text: string
  /** Set for a per-Procedure finding; becomes part of the warning key. */
  procedureId?: ProcedureId
  /** Set for a per-payer finding (catch-up Phase 27: the payer's identity); becomes part of the warning key. */
  scope?: string
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
  /** The schedule settings: horizon months and default session times (catch-up Phase 28; FT-01.1, US-01.1.4). */
  schedule: ScheduleSettings
  /**
   * Prepayment (catch-up Phase 27; US-06.3.1, D6 extended): whether each
   * prepayment invoice waits for an admin to approve it (on by default) or is
   * generated and sent as soon as its payer group is ready.
   */
  prepayment: PrepaymentSettings
  /**
   * The weekly payment cycle (catch-up Phase 39a; US-10.2.7, Proposed): ISO
   * week, Friday close, Monday checks, Tuesday schedule. Greg's proposed cycle,
   * built to; AA's accountant may change it (OQ-47): change it here, never in
   * code. No settings screen.
   */
  paymentCycle: PaymentCycleSettings
}

export interface PrepaymentSettings {
  approvalRequired: boolean
}

export function warningKey(bookingId: BookingId, ruleId: WarningRuleId, procedureId?: ProcedureId, scope?: string): string {
  const sub = procedureId ?? scope
  return sub === undefined ? `${bookingId}:${ruleId}` : `${bookingId}:${ruleId}:${sub}`
}
