/**
 * The three-procedure Booking (catch-up Phase 23; US-05.3.1, FT-05.3, US-03.2.2):
 * the domain model's worked example, seeded once and staged again by the
 * "Load 3-procedure Booking" demo trigger from the same spec
 * (`MULTI_PROCEDURE_DEMO`).
 *
 * A laparoscopic cholecystectomy as the primary (A3, base 6), then an
 * umbilical hernia repair (base 4) and an inguinal hernia repair (A2, base 5),
 * same anaesthetic, each with its own times, all on No contract · RVG. On the
 * primary: AS3, OB3 and ASE claimed with their explanations, and A1
 * pre-applied from the patient's age (74): 2 + 2 + 2 + 1 = 7 modifier units,
 * split 3 / 2 / 2. Each Procedure's payer is the patient, so one invoice.
 *
 * Seeded after every other Booking and Procedure (the next free ids), RNG-free,
 * with its own fixed patient, on Dr Souter's Mon 13 Jul AM List (Forte,
 * Mr Okafor; empty and unscripted before this phase), left SUBMITTED with the
 * Booking completed, so it waits in the Review queue. (A Southern Cross List
 * was tried and dropped: today's PM List is Southern Cross, and the phone's
 * earlier group would have shown a second one above it.)
 */

import type { AuditEntry, Booking, ModifierClaim, Procedure, Session } from '../types'
import { applyClaim } from '../billing/modifiers'
import { CONTRACT } from './contracts'
import { PAT_23 } from './patients'
import { rvgGroupIdForLegacyCode } from './rvgGroups'
import { seedText } from './procedureText'
import { seedModifierId } from './modifiers'

export interface MultiProcedureDemoProcedure {
  legacyCode: string
  text: string
  /** Start and finish, minutes after the anaesthetic starts. */
  fromMinute: number
  toMinute: number
}

/** The shared spec: the seed and the demo trigger build the same Booking from it. */
export const MULTI_PROCEDURE_DEMO = {
  patientId: PAT_23.multiProcedure,
  procedures: [
    { legacyCode: '20941', text: 'Laparoscopic cholecystectomy', fromMinute: 0, toMinute: 90 },
    { legacyCode: '49120', text: 'Umbilical hernia repair, same anaesthetic', fromMinute: 90, toMinute: 120 },
    { legacyCode: '49115', text: 'Inguinal hernia repair, same anaesthetic', fromMinute: 120, toMinute: 165 },
  ] as readonly MultiProcedureDemoProcedure[],
  /** Claimed on the primary, each with its explanation (19b's `applyClaim`). */
  claims: [
    { code: 'AS3', explanation: 'ASA III, controlled COPD' },
    { code: 'OB3', explanation: 'BMI 42' },
    { code: 'ASE', explanation: 'Emergency case, acute cholecystitis' },
  ] as const,
} as const

/** The List the seeded copy sits on: Dr Souter, Mon 13 Jul AM (Forte, Mr Okafor). */
export const MULTI_PROCEDURE_LIST_DATE = '2026-07-13'
export const MULTI_PROCEDURE_LIST_SESSION = 'AM' as const

/** When the anaesthetic starts: 08:30 on a morning List, 13:30 otherwise. */
export function multiProcedureStart(session: Session): string {
  return session === 'AM' ? '08:30' : '13:30'
}

/** `HH:MM` plus minutes, on a date: a local ISO stamp like every seeded time. */
export function multiProcedureStamp(dateISO: string, startHHMM: string, minutes: number): string {
  const [h, m] = startHHMM.split(':').map(Number) as [number, number]
  const total = h * 60 + m + minutes
  return `${dateISO}T${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
}

/** The claims on the primary, built through 19b's one claim rule. */
export function multiProcedureClaims(): ModifierClaim[] {
  return MULTI_PROCEDURE_DEMO.claims.reduce<ModifierClaim[]>((acc, c) => applyClaim(acc, { modifierId: seedModifierId(c.code), explanation: c.explanation }), [])
}

export function seedMultiProcedureBooking(
  next: { booking: number; procedure: number },
  listId: string,
): {
  bookings: Booking[]
  procedures: Procedure[]
  audit: AuditEntry[]
  ids: { booking: string; procedures: string[] }
  next: { booking: number; procedure: number }
} {
  const day = MULTI_PROCEDURE_LIST_DATE
  const bookingId = `BK${String(next.booking).padStart(4, '0')}`
  let p = next.procedure
  const start = multiProcedureStart(MULTI_PROCEDURE_LIST_SESSION)
  const at = (minutes: number) => multiProcedureStamp(day, start, minutes)
  const last = MULTI_PROCEDURE_DEMO.procedures[MULTI_PROCEDURE_DEMO.procedures.length - 1]!
  const completedAtISO = at(last.toMinute + 15)

  const procedures: Procedure[] = MULTI_PROCEDURE_DEMO.procedures.map((spec, index) => ({
    id: `P${String(p++).padStart(4, '0')}`,
    bookingId,
    // Each Procedure's payer is the patient (catch-up Phase 22a), so the Booking is one invoice.
    payer: { kind: 'patient' },
    procedureText: seedText(spec.text),
    invoiceDescription: null,
    governingContractId: CONTRACT.noContractRvg,
    rvgGroupId: rvgGroupIdForLegacyCode(spec.legacyCode),
    // The first entered is the primary; modifiers are recorded once, on it.
    isPrimary: index === 0,
    modifierClaims: index === 0 ? multiProcedureClaims() : [],
    removedModifierIds: [],
    anaestheticStartISO: at(spec.fromMinute),
    handoverISO: at(spec.toMinute),
  }))

  const booking: Booking = {
    id: bookingId,
    listId,
    patientId: MULTI_PROCEDURE_DEMO.patientId,
    scheduledTime: start,
    completed: true,
    completedAtISO,
    // The seed's source rule: Forte's rooms send PDFs.
    source: 'surgeonPdf',
    lastModifiedBy: 'Dr Melanie Souter',
    lastModifiedAtISO: completedAtISO,
  }

  const audit: AuditEntry[] = [
    {
      id: 'seed-multi-procedure-submit',
      entityType: 'list',
      entityId: listId,
      who: 'Dr Melanie Souter',
      role: 'anaesthetist',
      source: 'anaesthetist',
      action: 'list.submit',
      atISO: `${day}T16:10:00`,
      before: { state: 'ACTIVE' },
      after: { state: 'SUBMITTED' },
    },
  ]

  return {
    bookings: [booking],
    procedures,
    audit,
    ids: { booking: bookingId, procedures: procedures.map((x) => x.id) },
    next: { booking: next.booking + 1, procedure: p },
  }
}
