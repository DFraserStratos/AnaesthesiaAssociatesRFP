import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Screen state the URL cannot carry, published for the demo triggers (catch-up
 * Phase 14): a local tab, a selected row, an edit draft. UI state only, never
 * domain state, and not persisted, so no `PERSIST_VERSION` change. Later phases
 * add keys here.
 */
export interface DemoContextValues {
  /** Future scope: HL7 and FHIR, the simulator: the message selected in the library. */
  'integrationsSim.selectedMessageId': string
  /** Admin · Intake, Matching: the row open in the detail panel (an import row id; catch-up Phase 33's "Send update for a matched Booking"). */
  'matching.selectedRowId': string
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
  /** Admin · Master data: the Contract open in its detail (catch-up Phase 24's backdated range trigger). */
  'adminContracts.openContractId': string
  /** Mobile · My calendar: the last day opened in the session panel, `<anaesthetistId>|<dateISO>`, while the calendar shows (catch-up Phase 32d's office stand-in). */
  'mobileCalendar.day': string
  /** Admin · Booking detail: the Booking whose draft holds unsaved changes (catch-up Phase 35's Switch office user waits on it). */
  'adminBooking.dirtyBookingId': string
  /** Any surface that looks an NHI up through the simulated Hub is open (catch-up Phase 40a's Hub mode trigger). */
  'nhiHub.inUse': true
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
