/**
 * The one app store (Phase 02). State = the seeded domain (masters, schedule,
 * audit, settings, counters) + the demo clock + typed empty scaffolds for the
 * Phase 08 to 11 slices + the shell slice migrated in from Phase 00.
 *
 * WRITE DISCIPLINE (mechanically enforced by `storeDiscipline` in
 * `mutate.test.ts`): domain slices are written ONLY through `mutate.ts` — the
 * audit wrapper. The shell action below and the clock writes in
 * `clockActions.ts` are the only writes outside it, and neither touches a
 * domain slice.
 *
 * Persistence: versioned localStorage key. A version bump discards stale
 * persisted state, so the next load reseeds — bump PERSIST_VERSION whenever
 * the seed shape or content changes.
 */

import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { INITIAL_CLOCK, type DemoClockState } from '../domain/clock'
import { buildSeed, buildSeedBillingSlice, SEED_PREPAID_CARD_ID, type SeedState } from '../domain/seed'
import type {
  BillingCase,
  BillingReceipt,
  Disbursement,
  IntegrationFeed,
  IntegrationMessage,
  Invoice,
  InvoiceLine,
  PaymentIn,
  XeroAccPay,
  XeroAccRec,
  XeroContact,
} from '../domain/types'
import type { AppId } from '../shell/appConfig'

// ---------------------------------------------------------------------------
// Slice shapes (typed now, filled in Phases 08 to 11)
// ---------------------------------------------------------------------------

export interface BillingSlice {
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  cases: Record<string, BillingCase>
  /** Append-only receipts ledger (Phase 10) — GST-report source + payment idempotency key-set. */
  receipts: Record<string, BillingReceipt>
  /**
   * PMS-side ContactID cache (Phase 10; RFP Appendix 2 contact resolution: a
   * cached ContactID is tried first, then a lookup by ContactNumber, then
   * create). Keyed by the composite `${kind}:${id}` (never a raw id — 4 disjoint
   * org namespaces). A hint only: never authoritative, never NHI-derived.
   */
  contactIdCache: Record<string, string>
}

export interface XeroSlice {
  contacts: Record<string, XeroContact>
  accRecs: Record<string, XeroAccRec>
  accPays: Record<string, XeroAccPay>
  payments: Record<string, PaymentIn>
  disbursements: Record<string, Disbursement>
}

export interface IntegrationsSlice {
  feeds: Record<string, IntegrationFeed>
  messages: Record<string, IntegrationMessage>
}

export interface ShellSlice {
  currentApp: AppId
}

export interface AppState extends SeedState {
  clock: DemoClockState
  billing: BillingSlice
  xero: XeroSlice
  integrations: IntegrationsSlice
  shell: ShellSlice
}

export interface AppActions {
  setCurrentApp: (app: AppId) => void
}

export type AppStore = AppState & AppActions
export type AppStoreApi = StoreApi<AppStore>
export type BoundAppStore = UseBoundStore<StoreApi<AppStore>>

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export const PERSIST_KEY = 'aa-demo'
/** v6: Phase 10 — new BillingCase money fields (received/authorised/disbursed +
 *  paidIn/disbursed stamps + handoffFailure), the `receipts` ledger on the
 *  billing slice, DemoSettings.volumeStory + failNextHandoff, seeded historical
 *  billing-mirror + Xero rows (Souter receivables/GST) and the seeded
 *  missed-webhook PaymentIn, new counters (XC/XR/XP/PMT/DSB/PR/RCT).
 *  v5: Phase 09 — new seed cards (relocated unpaid pre-payment card, the mixed
 *  + full pre-payment card, the multi-card billing-failure list), the seeded
 *  PAID pre-invoice billing slice, and new `Card` fields (cardType /
 *  addendumOfCardId). v4: Phase 06 — `dayNotes` slice added to SeedState (3
 *  seeded Tue-21 notes) + two advisory ListConflicts seeded onto Wed 22 booked
 *  Lists. v3: Phase 05 — seeded anaesthetist-dashboard figures added to
 *  SeedState (`dashboards`; W1/W4). v2: Phase 04 — Ellison handover unseeded
 *  (live Finish-now demo) + the Souter rate x time capture card + patient. */
export const PERSIST_VERSION = 6

export function emptyBillingSlice(): BillingSlice {
  return { invoices: {}, invoiceLines: {}, cases: {}, receipts: {}, contactIdCache: {} }
}
export function emptyXeroSlice(): XeroSlice {
  return { contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {} }
}
export function emptyIntegrationsSlice(): IntegrationsSlice {
  return { feeds: {}, messages: {} }
}

/** A pristine full app state from the deterministic seed. */
export function freshAppState(): AppState {
  const seed = buildSeed()
  // The pristine seed ships one PAID pre-payment slice (Phase 09), with the
  // counters bumped past the ids it consumed so the first runtime billing run
  // continues the sequence cleanly.
  const seedBilling = buildSeedBillingSlice(seed, SEED_PREPAID_CARD_ID)
  return {
    ...seed,
    counters: seedBilling.counters,
    clock: INITIAL_CLOCK,
    billing: {
      invoices: seedBilling.invoices,
      invoiceLines: seedBilling.invoiceLines,
      cases: seedBilling.cases,
      receipts: seedBilling.receipts,
      contactIdCache: seedBilling.contactIdCache,
    },
    xero: seedBilling.xero,
    integrations: emptyIntegrationsSlice(),
    shell: { currentApp: 'mobile' },
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Rehydration merge for the persisted store: start from the fresh `current`
 * state, overlay the `persisted` state, and for every object-valued top-level
 * slice overlay one level deep so a sub-key missing from the persisted store
 * (e.g. `settings.volumeStory`, `billing.receipts`, a new counter) is filled
 * from the fresh seed instead of vanishing. Exactly one level deep on purpose:
 * record maps live one level down and are copied wholesale, so a record the
 * demo deleted is never resurrected. Exported for the regression test.
 */
export function backfillMerge(current: AppStore, persisted: unknown): AppStore {
  const p = isPlainObject(persisted) ? persisted : {}
  const merged: Record<string, unknown> = { ...current, ...p }
  for (const key of Object.keys(current) as (keyof AppStore)[]) {
    const cv = current[key]
    const pv = p[key as string]
    if (isPlainObject(cv) && isPlainObject(pv)) {
      merged[key as string] = { ...cv, ...pv }
    }
  }
  return merged as unknown as AppStore
}

export interface CreateAppStoreOptions {
  /** Persist to localStorage under the versioned key (the app singleton does; tests do not). */
  persisted?: boolean
}

export function createAppStore(options: CreateAppStoreOptions = {}): BoundAppStore {
  const initializer = (set: (partial: Partial<AppStore>) => void): AppStore => ({
    ...freshAppState(),
    setCurrentApp: (app: AppId) => set({ shell: { currentApp: app } }),
  })

  if (options.persisted === true) {
    return create<AppStore>()(
      persist(initializer, {
        name: PERSIST_KEY,
        version: PERSIST_VERSION,
        // A PERSIST_VERSION bump means the seed shape/content CHANGED, so a
        // different-version persisted store must be DISCARDED and reseeded. zustand
        // does NOT auto-discard on a version mismatch, so migrate returns the
        // pristine current-shape seed. (This alone is not enough — see merge.)
        migrate: () => freshAppState() as AppStore,
        // migrate only fires on a version MISMATCH. A store persisted at the
        // CURRENT version but from before a nested field existed (dev churn, or
        // a shape change that forgot to bump the version) takes the no-migrate
        // path, and zustand's default merge is a SHALLOW spread: the persisted
        // `settings` (no `volumeStory`) clobbers the fresh one wholesale, so
        // DemoXero reads `undefined.softLimit` and the app blank-screens. Backfill
        // one level deep so every slice's sub-keys always exist: persisted (live)
        // values win where present, fresh seed fills the gaps. Only whole missing
        // sub-keys are added, and record maps (invoices, contacts, ...) are taken
        // wholesale from the persisted store, so no deleted seed record is
        // resurrected. Deep record-SHAPE changes still require a version bump.
        merge: (persisted, current) => backfillMerge(current as AppStore, persisted),
      }),
    )
  }
  return create<AppStore>()(initializer)
}

/**
 * The app singleton. Components read through it; guards and demo controls
 * receive it (or a test-created store) as their `api` argument.
 */
export const useAppStore: BoundAppStore = createAppStore({ persisted: true })
