/**
 * The mutation wrapper — the ONLY module that raw-writes domain slices
 * (PROGRESS convention 7; mechanically enforced by `storeDiscipline`).
 *
 * Every domain write goes through `mutate()`, which in ONE commit:
 *   - applies the recipe's patch,
 *   - appends the append-only AuditEntry per meta (timestamp from the demo
 *     clock state, id from the persisted counter),
 *   - stamps `lastModifiedBy/AtISO` on the touched Booking — procedure and
 *     billing-line edits stamp the PARENT Booking (7th review A8: the summary
 *     fields and the log can never drift apart).
 *
 * Refusals are data, not exceptions: guards return `Outcome` so Phase 11's
 * the matching screen can show a refused decision's reason and change nothing.
 */

import type { ActorRole, AuditEntry, AuditSource, BookingId, ChangeSetId, ChangeSetKind } from '../domain/types'
import type { DemoClockState } from '../domain/clock'
import { freshAppState, type AppState, type AppStoreApi } from './appStore'
import { reconcileConflictsInPatch, type MutationResult } from './conflictReconcile'
import { clearScaleMode } from './scaleMode'
import { reportDiagnostic } from './diagnostics'
import { resumePersist } from './persistStorage'

export type { MutationResult } from './conflictReconcile'

// ---------------------------------------------------------------------------
// Actors & outcomes
// ---------------------------------------------------------------------------

export interface Actor {
  who: string
  role: ActorRole
  source: AuditSource
  /** Set for anaesthetist actors — ownership checks (own Lists only). */
  anaesthetistId?: string
}

/** Guard results as data. `ok: false` outcomes render verbatim in UI. */
export type Outcome<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string; details?: unknown }

export function ok<T>(value: T): Outcome<T> {
  return { ok: true, value }
}

export function refuse<T = undefined>(code: string, message: string, details?: unknown): Outcome<T> {
  // The messages people see are part of what the NHI leak scan reads (catch-up Phase 43).
  reportDiagnostic('refusal', message, { code })
  const outcome: Outcome<T> = { ok: false, code, message }
  if (details !== undefined) outcome.details = details
  return outcome
}

// ---------------------------------------------------------------------------
// Clock & id helpers
// ---------------------------------------------------------------------------

/** The demo clock as a local-naive ISO datetime (`2026-07-21T08:00:00`). */
export function clockISO(clock: DemoClockState): string {
  const h = Math.floor(clock.minutesSinceMidnight / 60)
  const m = clock.minutesSinceMidnight % 60
  return `${clock.todayISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** Runtime id prefixes per counter kind (seed ids share the formats). */
const ID_FORMATS: Record<string, { prefix: string; pad: number }> = {
  audit: { prefix: 'A', pad: 4 },
  booking: { prefix: 'BK', pad: 4 },
  procedure: { prefix: 'P', pad: 4 },
  // Events on a Procedure (catch-up Phase 38b; DM-17): seeded EV0001.
  procedureEvent: { prefix: 'EV', pad: 4 },
  // Contract event fees (catch-up Phase 39b): seeded CEF001.
  contractEventFee: { prefix: 'CEF', pad: 3 },
  patient: { prefix: 'PT', pad: 4 },
  billableParty: { prefix: 'BP', pad: 4 },
  dayNote: { prefix: 'DN', pad: 4 },
  // The shared notification pool (catch-up Phase 32; DM-41).
  notification: { prefix: 'NT', pad: 4 },
  // Lists created at runtime (assignment, phone advice);
  // projected and seeded Lists keep their `L-<reg>-<date>-<session>` ids.
  list: { prefix: 'LG', pad: 4 },
  // Availability statuses an admin adds and repeating days off (catch-up Phase 29).
  slotStatus: { prefix: 'ST', pad: 4 },
  availabilitySeries: { prefix: 'AS', pad: 4 },
  hospital: { prefix: 'HN', pad: 3 },
  // Catch-up Phase 18: runtime Parties (seeded ones are PY-<NAME>; PT is the patient prefix).
  party: { prefix: 'PYN', pad: 3 },
  contract: { prefix: 'CTN', pad: 3 },
  // Catch-up Phase 18a: runtime specialties and funding tags (seeded ones are SPC-<NAME>, TAG-<CODE>).
  specialty: { prefix: 'SPN', pad: 3 },
  fundingTag: { prefix: 'TGN', pad: 3 },
  // Runtime prefixes distinct from the seed's PL###/HH###/CP-… ids so an
  // allocation can never collide with a seeded master row (Phase 07).
  // Catch-up Phase 17: distinct from the seed's S-, SG- and PP- ids.
  surgeon: { prefix: 'SN', pad: 3 },
  surgeonGroup: { prefix: 'SGN', pad: 3 },
  pairingPreference: { prefix: 'PPN', pad: 3 },
  // Catch-up Phase 30 (DM-53): seeded rows are RCB###; RB is Phase 16's BCTI-history namespace.
  recurringBooking: { prefix: 'RCBN', pad: 3 },
  holiday: { prefix: 'HHN', pad: 3 },
  // Catch-up Phase 19: runtime RVG groups (seeded ones are RG###). Never shown.
  rvgGroup: { prefix: 'RGN', pad: 3 },
  // Catch-up Phase 19b: AA's own modifiers added by the office (seeded RVG rows are MOD-RVG-<code>). Never shown.
  modifier: { prefix: 'MOD-AA-', pad: 3 },
  // Billing run (Phase 08). `invoiceNumber` is the human-facing remittance
  // key (unique, RFP), separate from the invoice's entity id. The year is
  // deliberately pinned like DEMO_TODAY — the demo lives in July 2026.
  invoice: { prefix: 'INV', pad: 4 },
  invoiceLine: { prefix: 'IL', pad: 4 },
  // A ledger pair (catch-up Phase 36; was the billing case): the BC prefix kept, so every case reference stays valid.
  ledgerPair: { prefix: 'BC', pad: 4 },
  invoiceNumber: { prefix: 'AA-2026-', pad: 4 },
  // Xero simulation + payments (Phase 10). Top-level counters on AppState (not
  // under `billing`), like the billing kinds above.
  xeroContact: { prefix: 'XC', pad: 4 },
  xeroAccRec: { prefix: 'XR', pad: 4 },
  xeroAccPay: { prefix: 'XP', pad: 4 },
  paymentIn: { prefix: 'PMT', pad: 4 },
  disbursement: { prefix: 'DSB', pad: 4 },
  payablesRun: { prefix: 'PR', pad: 4 },
  receipt: { prefix: 'RCT', pad: 4 },
  // AA's monthly fee invoices (catch-up Phase 16): the record id and the
  // human-facing number. The seeded history uses its own H namespace.
  aaFeeInvoice: { prefix: 'AF', pad: 4 },
  aaFeeInvoiceNumber: { prefix: 'AA-FEE-2026-', pad: 4 },
  // Integration message-log rows (Phase 11).
  integrationMessage: { prefix: 'IM', pad: 4 },
  // The matching screen's import batches and rows (catch-up Phase 33).
  importBatch: { prefix: 'IB', pad: 4 },
  importRow: { prefix: 'IR', pad: 4 },
  // Stubs on Lists for rows waiting at intake (catch-up Phase 33a; DM-58), never the NHI.
  stub: { prefix: 'STB', pad: 4 },
  // The rooms' PDF lists as received (catch-up Phase 34; DM-61).
  pdfList: { prefix: 'PDL', pad: 4 },
  // Prepayment transfers from the AA Holding account and their Xero manual journals (catch-up Phase 27a).
  prepayTransfer: { prefix: 'PXT', pad: 4 },
  xeroJournal: { prefix: 'XJ', pad: 4 },
  xeroJournalNumber: { prefix: 'MJ-', pad: 4 },
  // The internal ledger (catch-up Phase 36): billing-run exceptions, receipts matching no invoice, and money out.
  billingException: { prefix: 'BX', pad: 4 },
  unmatchedReceipt: { prefix: 'UR', pad: 4 },
  ledgerDisbursement: { prefix: 'LD', pad: 4 },
  // A save's (or create's, cancel's, move's, reassignment's, applied row's) change set (catch-up Phase 35; DM-35).
  changeSet: { prefix: 'CS', pad: 4 },
  // The update email templates the office adds (catch-up Phase 35; US-02.3.4): seeded ET001 to ET004.
  emailTemplate: { prefix: 'ET', pad: 3 },
  // The prepayment letter templates (catch-up Phase 41; US-06.3.6): seeded LT001 to LT003.
  letterTemplate: { prefix: 'LT', pad: 3 },
  // Prepayment refunds paid by the system and their Xero mirror (catch-up Phase 41; US-06.5.2).
  prepaymentRefund: { prefix: 'RF', pad: 4 },
  xeroRefund: { prefix: 'XRF', pad: 4 },
  // Xero mirror resilience (catch-up Phase 37): the sync queue, divergence flags, and the Xero side's remittances and bank lines.
  xeroQueueItem: { prefix: 'XQ', pad: 4 },
  xeroDivergence: { prefix: 'XD', pad: 4 },
  remittance: { prefix: 'RMT', pad: 4 },
  bankLine: { prefix: 'BKL', pad: 4 },
  // Catch-up Phase 42: the master public-holiday calendar (seeded PH001 to PH007), seed loads and go-live batches.
  publicHoliday: { prefix: 'PHN', pad: 3 },
  masterLoad: { prefix: 'ML', pad: 3 },
  goLiveBatch: { prefix: 'GL', pad: 2 },
  // Catch-up Phase 39: credit notes (record id and human-facing number), negative invoices and their Xero credit notes.
  creditNote: { prefix: 'CRN', pad: 4 },
  creditNoteNumber: { prefix: 'CN-2026-', pad: 4 },
  negativeInvoice: { prefix: 'NEG', pad: 4 },
  xeroCreditNote: { prefix: 'XCN', pad: 4 },
  // Catch-up Phase 39a: the simulated bank download (not Xero's own bank lines, `bankLine` above), credit allocations and batch payments.
  bankDownloadLine: { prefix: 'BNK', pad: 4 },
  creditAllocation: { prefix: 'XCA', pad: 4 },
  batchPayment: { prefix: 'XBP', pad: 4 },
  // Catch-up Phase 40: the shared note on a List or Booking, and the patient follow-up log.
  sharedNote: { prefix: 'NTE', pad: 4 },
  followUp: { prefix: 'FUN', pad: 4 },
  // Catch-up Phase 43b: support tickets, the help line's and product support's (seeded TK0001 to TK0005).
  supportTicket: { prefix: 'TK', pad: 4 },
}

/** Allocate the next deterministic id of a kind from the counters record. */
export function allocateId(
  counters: Record<string, number>,
  kind: string,
): { id: string; counters: Record<string, number> } {
  const format = ID_FORMATS[kind] ?? { prefix: kind.toUpperCase(), pad: 4 }
  const n = counters[kind] ?? 1
  return {
    id: `${format.prefix}${String(n).padStart(format.pad, '0')}`,
    counters: { ...counters, [kind]: n + 1 },
  }
}

// ---------------------------------------------------------------------------
// mutate
// ---------------------------------------------------------------------------

export interface MutationMeta {
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  /**
   * Booking whose `lastModifiedBy/AtISO` this mutation stamps. Omit to derive
   * from the entity (booking → itself; procedure → parent booking);
   * pass null to stamp nothing (List/master mutations).
   */
  stampBookingId?: BookingId | null
}

/** What a recipe may replace. Audit is the wrapper's job — never the recipe's. */
export type DomainPatch = Partial<
  Pick<
    AppState,
    | 'masters'
    | 'schedule'
    | 'settings'
    | 'appSettings'
    | 'counters'
    | 'billing'
    | 'xero'
    | 'integrations'
    | 'intake'
    | 'masterLoads'
    | 'dayNotes'
    | 'officePrivate'
    | 'notifications'
    | 'patientCare'
    | 'support'
  >
>

function deriveStampBookingId(meta: MutationMeta, schedule: AppState['schedule']): BookingId | null {
  if (meta.stampBookingId !== undefined) return meta.stampBookingId
  if (meta.entityType === 'booking') return schedule.bookings[meta.entityId] !== undefined ? meta.entityId : null
  if (meta.entityType === 'procedure') return schedule.procedures[meta.entityId]?.bookingId ?? null
  return null
}

/**
 * Apply a domain mutation: recipe patch + conflict reconcile + audit append +
 * Booking stamp, one `setState` commit. `metas` may be a single entry or
 * several (e.g. List reassignment audits the move and the vacated session
 * together). The conflict reconcile (catch-up Phase 30,
 * `conflictReconcile.ts`) re-runs the one conflict rule over every List whose
 * facts the patch touched and appends its `list.conflict` /
 * `list.conflictResolved` metas to the same commit; the result says which
 * Lists gained or lost a conflict, so actions can report counts.
 */
/**
 * `mutate`'s options (catch-up Phase 35): `changeSet` groups every entry of
 * the call under one fresh `CS####` id and records its kind on the first.
 */
export interface MutateOptions {
  changeSet?: ChangeSetKind
}

/** What `mutate` returns: the conflict result, and the change set it allocated (null without one). */
export interface MutateResult extends MutationResult {
  changeSetId: ChangeSetId | null
}

/** The audit's own fields a recipe never reports as a change (catch-up Phase 35). */
const STAMP_FIELDS = ['lastModifiedBy', 'lastModifiedAtISO'] as const

/** Strip the Booking stamps from an audit `before` or `after` object (they are never a change). */
function withoutStamps(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  if (!STAMP_FIELDS.some((k) => k in (value as Record<string, unknown>))) return value
  const out = { ...(value as Record<string, unknown>) }
  for (const k of STAMP_FIELDS) delete out[k]
  return out
}

/** The change set every `mutate` on one store joins while `withChangeSet` runs (catch-up Phase 35). */
interface ActiveChangeSet {
  api: AppStoreApi
  kind: ChangeSetKind
  id: ChangeSetId | null
}
let activeChangeSet: ActiveChangeSet | null = null

/**
 * Run an action whose writes form ONE change set (catch-up Phase 35; DM-35):
 * every `mutate` on `api` inside `run` stamps the same `CS####` id, allocated
 * at the first write (none when nothing is written), and the first entry
 * records `kind`. Used for actions that write in several commits (a create,
 * a cancel, a move, a reassignment, an applied hospital row). A nested call
 * joins the outer change set. Synchronous only.
 */
export function withChangeSet<T>(api: AppStoreApi, kind: ChangeSetKind, run: () => T): T {
  if (activeChangeSet !== null) return run()
  activeChangeSet = { api, kind, id: null }
  try {
    return run()
  } finally {
    activeChangeSet = null
  }
}

export function mutate(
  api: AppStoreApi,
  actor: Actor,
  metas: MutationMeta | readonly MutationMeta[],
  recipe: (state: AppState) => DomainPatch,
  options?: MutateOptions,
): MutateResult {
  const state = api.getState()
  const recipePatch = recipe(state)
  const atISO = clockISO(state.clock)
  const recipeMetas = Array.isArray(metas) ? (metas as readonly MutationMeta[]) : [metas as MutationMeta]
  // Convention 7: no mutation without an audit entry. Callers that build their
  // metas in the recipe pass an array the recipe pushes into, so this is
  // checked after `recipe(state)` has run — an empty list is a programming
  // error (a raw write with zero audit entries and zero lastModified stamps).
  if (recipeMetas.length === 0) {
    throw new Error('mutate() requires at least one audit meta (convention 7: no mutation without an audit entry)')
  }
  const reconciled = reconcileConflictsInPatch(state, recipePatch, atISO)
  const patch = reconciled.patch
  const metaList = reconciled.metas.length === 0 ? recipeMetas : [...recipeMetas, ...reconciled.metas]

  let counters = patch.counters ?? state.counters
  let changeSetId: ChangeSetId | null = null
  let changeSetKind: ChangeSetKind | null = null
  const scope = activeChangeSet !== null && activeChangeSet.api === api ? activeChangeSet : null
  if (scope !== null && scope.id !== null) {
    changeSetId = scope.id
  } else if (options?.changeSet !== undefined || scope !== null) {
    const allocated = allocateId(counters, 'changeSet')
    counters = allocated.counters
    changeSetId = allocated.id
    changeSetKind = scope?.kind ?? options!.changeSet!
    if (scope !== null) scope.id = allocated.id
  }
  const entries: AuditEntry[] = []
  for (const meta of metaList) {
    const allocated = allocateId(counters, 'audit')
    counters = allocated.counters
    const entry: AuditEntry = {
      id: allocated.id,
      entityType: meta.entityType,
      entityId: meta.entityId,
      who: actor.who,
      role: actor.role,
      source: actor.source,
      action: meta.action,
      atISO,
    }
    if (meta.before !== undefined) entry.before = withoutStamps(meta.before)
    if (meta.after !== undefined) entry.after = withoutStamps(meta.after)
    if (changeSetId !== null) {
      entry.changeSetId = changeSetId
      if (entries.length === 0 && changeSetKind !== null) entry.changeSetKind = changeSetKind
    }
    entries.push(entry)
  }

  // Stamp the touched Bookings in the same commit as their audit entries.
  let schedule = patch.schedule ?? state.schedule
  for (const meta of metaList) {
    const bookingId = deriveStampBookingId(meta, schedule)
    if (bookingId === null) continue
    const booking = schedule.bookings[bookingId]
    if (booking === undefined) continue
    schedule = {
      ...schedule,
      bookings: {
        ...schedule.bookings,
        [bookingId]: { ...booking, lastModifiedBy: actor.who, lastModifiedAtISO: atISO },
      },
    }
  }

  api.setState({
    ...patch,
    schedule,
    counters,
    audit: [...state.audit, ...entries],
  })
  return { ...reconciled.result, changeSetId }
}

/**
 * Run several guarded writes as one decision (catch-up Phase 33's
 * `decideImportRow`): when a step is refused, every domain slice and the
 * audit go back to exactly what they were, so a refused step strands nothing
 * (the Phase 11 review-fix rule). Callers still check their guards first;
 * this is the backstop. Lives here because mutate.ts is the one permitted
 * raw writer of domain slices.
 */
export function transaction<T>(api: AppStoreApi, run: () => Outcome<T>): Outcome<T> {
  const before = api.getState()
  const snapshot: DomainPatch & Pick<AppState, 'audit'> = {
    masters: before.masters,
    schedule: before.schedule,
    settings: before.settings,
    appSettings: before.appSettings,
    counters: before.counters,
    billing: before.billing,
    xero: before.xero,
    integrations: before.integrations,
    intake: before.intake,
    masterLoads: before.masterLoads,
    dayNotes: before.dayNotes,
    officePrivate: before.officePrivate,
    notifications: before.notifications,
    patientCare: before.patientCare,
    support: before.support,
    audit: before.audit,
  }
  const result = run()
  if (!result.ok) api.setState(snapshot)
  return result
}

/**
 * Copy the real store's state into a Booking draft's private store (catch-up
 * Phase 35): a wholesale replace by reference, not an audited mutation,
 * because nothing is written to the real store. The draft keeps its own
 * functions. Lives here because mutate.ts is the one permitted raw writer.
 */
export function copyStateIntoDraft(draft: AppStoreApi, source: AppState): void {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(source)) if (typeof v !== 'function') out[k] = v
  draft.setState(out as Partial<AppState>)
}

/**
 * Restore the pristine seed (the demo Reset). Domain slices, clock and the
 * empty Phase 08 to 11 scaffolds reset; the shell slice is preserved. Lives
 * here because mutate.ts is the one permitted raw writer of domain slices —
 * a reset is a wholesale replace, not an audited mutation.
 */
const resetListeners = new Set<(api: AppStoreApi) => void>()

/**
 * Hear each demo Reset (catch-up Phase 35): a Booking draft discards itself,
 * even when the reset store is identical to the one it copied. Returns the
 * unsubscribe function.
 */
export function onDomainReset(listener: (api: AppStoreApi) => void): () => void {
  resetListeners.add(listener)
  return () => resetListeners.delete(listener)
}

export function resetDomainState(api: AppStoreApi): void {
  // Leaving full scale (catch-up Phase 43): back to demo mode, and saving resumes BEFORE the
  // pristine state is installed, so the pristine state is what gets written.
  clearScaleMode()
  resumePersist()
  resetDomainStateOnly(api)
  for (const listener of resetListeners) listener(api)
}

/** Every domain slice of the store (the shell and the store's functions excluded). */
export type DomainState = Pick<
  AppState,
  | 'clock'
  | 'masters'
  | 'schedule'
  | 'audit'
  | 'settings'
  | 'appSettings'
  | 'dayNotes'
  | 'officePrivate'
  | 'notifications'
  | 'patientCare'
  | 'support'
  | 'counters'
  | 'billing'
  | 'xero'
  | 'integrations'
  | 'intake'
  | 'masterLoads'
>

/**
 * The wholesale replace of every domain slice (catch-up Phase 43): Reset's
 * pristine seed and the full-scale install share this one code path. Not an
 * audited mutation; the shell survives, except the office picker counter
 * (catch-up Phase 17), so a fresh install replays the same within-tier orders.
 */
export function installDomainState(api: AppStoreApi, domain: DomainState): void {
  api.setState({ ...domain, shell: { ...api.getState().shell, suggestionSeq: 0 } })
}

function resetDomainStateOnly(api: AppStoreApi): void {
  // The same starting state as a first load (the core seed and the practice), the shared object itself: never
  // rebuilt, so saving finds nothing changed (persistDelta.ts). The shell survives, as `installDomainState` says.
  const { shell: _shell, ...domain } = freshAppState()
  void _shell
  installDomainState(api, domain)
  // Reset forgets each office user's last Contract grouping (build plan Phase 47).
  const { contractGrouping: _grouping, ...shell } = api.getState().shell
  void _grouping
  api.setState({ shell })
}
