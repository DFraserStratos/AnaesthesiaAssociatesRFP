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
import { buildSeed, type SeedState } from '../domain/seed'
import type {
  BillingCase,
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
/** v2: Phase 04 — Ellison handover unseeded (live Finish-now demo) + the
 *  Souter rate x time capture card + patient (Decisions log 2026-07-23). */
export const PERSIST_VERSION = 2

export function emptyBillingSlice(): BillingSlice {
  return { invoices: {}, invoiceLines: {}, cases: {} }
}
export function emptyXeroSlice(): XeroSlice {
  return { contacts: {}, accRecs: {}, accPays: {}, payments: {}, disbursements: {} }
}
export function emptyIntegrationsSlice(): IntegrationsSlice {
  return { feeds: {}, messages: {} }
}

/** A pristine full app state from the deterministic seed. */
export function freshAppState(): AppState {
  return {
    ...buildSeed(),
    clock: INITIAL_CLOCK,
    billing: emptyBillingSlice(),
    xero: emptyXeroSlice(),
    integrations: emptyIntegrationsSlice(),
    shell: { currentApp: 'mobile' },
  }
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
    return create<AppStore>()(persist(initializer, { name: PERSIST_KEY, version: PERSIST_VERSION }))
  }
  return create<AppStore>()(initializer)
}

/**
 * The app singleton. Components read through it; guards and demo controls
 * receive it (or a test-created store) as their `api` argument.
 */
export const useAppStore: BoundAppStore = createAppStore({ persisted: true })
