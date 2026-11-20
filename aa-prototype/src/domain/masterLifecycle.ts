/**
 * Retire, never delete, anything referenced by identity (catch-up Phase 42;
 * US-13.4.1, DM-38). Hospitals, surgeons, surgeon groups and AA's own
 * modifiers retire with a stated reason when nothing upcoming depends on
 * them, and come back with Reinstate. Pickers stop offering a retired record
 * (`activeOnly`), and every existing reference keeps resolving: display paths
 * read the record as before.
 *
 * Parties and Contracts (Active or Disabled, 18), specialties and funding tags
 * (18a), RVG groups (19), availability statuses (29) and recurring bookings
 * (30) keep the lifecycle their phases gave them. Anaesthetists keep their
 * `active` flag ("Inactive").
 *
 * Pure: the caller (the store) gathers the facts; no React, no store.
 */

/** Anything that can be retired. */
export interface Retirable {
  retiredAtISO?: string
  retiredReason?: string
}

export function isRetired(record: Retirable | undefined | null): boolean {
  return record !== undefined && record !== null && record.retiredAtISO !== undefined
}

/**
 * The records a picker offers: the active ones, plus the current value when it
 * is retired, so an edit form never silently drops a stored record.
 */
export function activeOnly<T extends Retirable & { id: string }>(
  records: Readonly<Record<string, T>> | readonly T[],
  keepId?: string | null,
): T[] {
  const rows = Array.isArray(records) ? (records as readonly T[]) : Object.values(records as Record<string, T>)
  return rows.filter((r) => !isRetired(r) || (keepId !== undefined && keepId !== null && r.id === keepId))
}

/** "St George's (retired)" for a retired current value in a picker; the name otherwise. */
export function retiredLabel(name: string, record: Retirable | undefined): string {
  return isRetired(record) ? `${name} (retired)` : name
}

export type RetireKind = 'hospital' | 'surgeon' | 'surgeonGroup' | 'aaModifier'

/** What depends on a record, gathered by the store. Every count is of things on or after the demo clock's today. */
export interface RetireFacts {
  name: string
  /** Upcoming Lists (not AUTHORISED, not Draft) at the hospital or with the surgeon. */
  upcomingLists?: number
  /** Upcoming Draft Lists. */
  upcomingDraftLists?: number
  /** Recurring bookings still running. */
  activeRecurringBookings?: number
  /** A hospital's Party, while it holds an Active Contract. */
  partyActiveContracts?: { partyName: string; count: number }
  /** Active Contracts whose only link is the surgeon (AR-58 A39: a Contract held by a surgeon needs one). */
  soleLinkContracts?: number
  /** Surgeons still in the group. */
  members?: number
  /** 31's built-in AA rooms location. */
  builtIn?: boolean
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

/**
 * Why a record cannot be retired yet, as readable sentences with counts; empty
 * when it can. Each says what to do first.
 */
export function retireBlockers(kind: RetireKind, facts: RetireFacts): string[] {
  const out: string[] = []
  if (facts.builtIn === true) return [`${facts.name} is built in and cannot be retired.`]
  const at = kind === 'hospital' ? `at ${facts.name}` : `with ${facts.name}`
  if ((facts.upcomingLists ?? 0) > 0) {
    const n = facts.upcomingLists!
    out.push(`${plural(n, 'upcoming List is', 'upcoming Lists are')} ${at}. Move or reassign ${n === 1 ? 'it' : 'them'} first.`)
  }
  if ((facts.upcomingDraftLists ?? 0) > 0) {
    const n = facts.upcomingDraftLists!
    out.push(`${plural(n, 'upcoming Draft List is', 'upcoming Draft Lists are')} ${at}. Assign or remove ${n === 1 ? 'it' : 'them'} first.`)
  }
  if ((facts.activeRecurringBookings ?? 0) > 0) {
    const n = facts.activeRecurringBookings!
    out.push(`${plural(n, 'recurring booking uses', 'recurring bookings use')} ${facts.name}. Retire or change ${n === 1 ? 'it' : 'them'} first.`)
  }
  if (facts.partyActiveContracts !== undefined && facts.partyActiveContracts.count > 0) {
    const { partyName, count } = facts.partyActiveContracts
    out.push(`Disable its Contracts first: ${partyName}, ${plural(count, 'Active Contract', 'Active Contracts')}.`)
  }
  if ((facts.soleLinkContracts ?? 0) > 0) {
    const n = facts.soleLinkContracts!
    out.push(`${plural(n, 'Active Contract is', 'Active Contracts are')} linked only to ${facts.name}. Disable ${n === 1 ? 'it' : 'them'} or link another surgeon first.`)
  }
  if ((facts.members ?? 0) > 0) {
    const n = facts.members!
    out.push(`${plural(n, 'surgeon is', 'surgeons are')} still in ${facts.name}. Take them out first.`)
  }
  return out
}
