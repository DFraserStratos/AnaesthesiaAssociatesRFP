import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Screen state the URL cannot carry, published for the demo triggers (catch-up
 * Phase 14): a local tab, a selected row, an edit draft. UI state only, never
 * domain state, and not persisted, so no `PERSIST_VERSION` change. Later phases
 * add keys here.
 */
export interface DemoContextValues {
  /** Admin · AA fee invoices: the month in the picker (`YYYY-MM`; catch-up Phase 16). */
  'aaFees.month': string
  /**
   * Admin · Day: the session open in the drawer (a Slot id; catch-up Phase 28).
   * Nothing consumes it yet: Phase 30's "Simulate sickness" acts on it.
   */
  'adminDay.selectedSlotId': string
  /** Admin · the Draft List open in its drawer (a List id; catch-up Phase 31). */
  'adminDraftLists.openListId': string
  /** Admin · Master data: the view in the sub-nav (`?view=`; catch-up Phase 31's "Stage recurring clash"). */
  'adminMasters.view': string
  /** Admin · the List an open Assign or Reassign picker is placing (catch-up Phase 32b's colleague stand-in). */
  'adminPicker.listId': string
  /** Admin · the Contract whose page is open (catch-up Phase 24's backdated range trigger; a page since build plan Phase 45). */
  'adminContracts.openContractId': string
  /** Admin · Contracts: the section's tab on show (build plan Phase 45; 48 adds Parties and Funding tags). */
  'adminContracts.tab': 'contracts' | 'parties' | 'fundingTags'
  /** Admin · People: the section's tab on show (build plan Phase 53); the sample-sheet trigger reads it. */
  'adminPeople.tab': 'anaesthetists' | 'surgeons' | 'specialties' | 'patients'
  /** Admin · Finances: the section's tab on show (build plan Phase 58; D107). */
  'adminFinances.tab': 'billing' | 'invoices' | 'payments' | 'ledger' | 'xero' | 'aa-fees'
  /** Admin · Lists: the section's tab on show (US-13.1.3). */
  'adminLists.tab': 'draft-lists' | 'conflicts' | 'contracts-to-set' | 'to-authorise'
  /** Mobile · My calendar: the last day opened in the session panel, `<anaesthetistId>|<dateISO>`, while the calendar shows (catch-up Phase 32d's office stand-in). */
  'mobileCalendar.day': string
  /** Admin · Booking detail: the Booking whose draft holds unsaved changes (catch-up Phase 35's Switch office user waits on it). */
  'adminBooking.dirtyBookingId': string
  /** Any surface that looks an NHI up through the simulated Hub is open (catch-up Phase 40a's Hub mode trigger). */
  'nhiHub.inUse': true
  /** Any app · the support panel is open, on this tab (catch-up Phase 43b's support triggers show only then). */
  'support.tab': 'helpLine' | 'productSupport'
  /** Any app · whose requests the open support panel lists: the persona's name, or '' for the office (every request). */
  'support.requester': string
  /** Mobile and PWA · the sign-in screen is showing (build plan Phase 52's "try signing in after the last day"). */
  'mobile.signIn': true
}

export type DemoContextKey = keyof DemoContextValues

interface DemoContextStore {
  values: Partial<DemoContextValues>
  publish: <K extends DemoContextKey>(key: K, value: DemoContextValues[K]) => void
  withdraw: (key: DemoContextKey) => void
}

/**
 * A small UI-only store of its own (not the app store: no domain state, no
 * audit, no persistence), written only through its two actions.
 */
export const useDemoContextStore = create<DemoContextStore>((set) => ({
  values: {},
  publish: (key, value) => set((s) => ({ values: { ...s.values, [key]: value } })),
  withdraw: (key) =>
    set((s) => {
      const { [key]: _removed, ...rest } = s.values
      return { values: rest }
    }),
}))

/** Publish `value` under `key` while the calling component is mounted. */
export function useDemoTriggerContext<K extends DemoContextKey>(key: K, value: DemoContextValues[K]): void {
  useEffect(() => {
    useDemoContextStore.getState().publish(key, value)
  }, [key, value])
  useEffect(() => () => useDemoContextStore.getState().withdraw(key), [key])
}

/** Publish `value` under `key` only while `active` (a sheet that stays mounted when closed). */
export function useDemoTriggerContextWhile<K extends DemoContextKey>(key: K, value: DemoContextValues[K], active: boolean): void {
  useEffect(() => {
    if (!active) return undefined
    useDemoContextStore.getState().publish(key, value)
    return () => useDemoContextStore.getState().withdraw(key)
  }, [key, value, active])
}

/** Everything currently published (read by the bar menu and the PWA sheet). */
export function useDemoTriggerPublished(): Partial<DemoContextValues> {
  return useDemoContextStore((s) => s.values)
}
