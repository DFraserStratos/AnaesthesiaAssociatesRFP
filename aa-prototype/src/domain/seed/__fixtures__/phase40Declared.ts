/**
 * Catch-up Phase 40's one declared seed move, at the seed level: Dr Sharma's
 * patient-billed history (`SHARMA_PATIENT_ACCOUNTS`, the `HS` id namespace),
 * appended after every earlier seed record. The domain-level seed baselines
 * (the canvas fingerprint and golden, 32d's parity) read the seed through
 * `seedWithoutPhase40`; the store's parity harnesses use
 * `store/__parity__/phase40Declared.ts`, which builds on this. Pure.
 */

import type { AuditEntry, Booking, List, Procedure, ProcedureEvent } from '../../types'

export const PHASE_40_REASON = "Dr Sharma's patient-billed history (the HS namespace) is appended"

// Heather Sinclair's credit (D24) adds the credit note, negative invoice, Xero credit notes and credit event: HSCRN, HSNEG, XCNHS, HSEV.
const HS_ID = /^(L-HIST-HS-|HSBK|HSP|HSINV|HSIL|HSBC|XRHS|XPHS|PMTHS|RCTHS|DSBHS|LDHS|HS-PAY-|HSCRN|HSNEG|XCNHS|HSEV)/

export function isPhase40Id(id: string): boolean {
  return HS_ID.test(id)
}

export function dropPhase40<T>(record: Readonly<Record<string, T>>, gone: (id: string, value: T) => boolean = (id) => isPhase40Id(id)): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [id, value] of Object.entries(record)) if (!gone(id, value)) out[id] = value
  return out
}

interface SeedLike {
  schedule: { lists: Readonly<Record<string, List>>; bookings: Readonly<Record<string, Booking>>; procedures: Readonly<Record<string, Procedure>>; procedureEvents?: Readonly<Record<string, ProcedureEvent>> }
  audit: readonly AuditEntry[]
}

/** The seed's schedule and audit without the `HS` history. */
export function seedWithoutPhase40<S extends SeedLike>(seed: S): S {
  return {
    ...seed,
    schedule: {
      ...seed.schedule,
      lists: dropPhase40(seed.schedule.lists),
      bookings: dropPhase40(seed.schedule.bookings),
      procedures: dropPhase40(seed.schedule.procedures),
      ...(seed.schedule.procedureEvents !== undefined ? { procedureEvents: dropPhase40(seed.schedule.procedureEvents) } : {}),
    },
    audit: seed.audit.filter((e) => !isPhase40Id(e.entityId)),
  }
}
