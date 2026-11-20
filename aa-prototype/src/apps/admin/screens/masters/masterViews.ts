/**
 * Every Master data view in one registry (catch-up Phase 42; US-13.4.1 "in
 * one place"): the grouped sub-nav renders from it, and its test maps every
 * row of US-13.4.1's list to a view that can add and edit. `seeded` names the
 * seed-load sheets that load the master once at go-live: it drives the
 * subtitle line, the waiting-load banner and the sample trigger's choices,
 * never a button. No office view has a load action (the load is the
 * developer's step, on the demo-badged Go-live views).
 */

import type { LoadEntity } from '../../../../domain/masterLoad/types'
import type { MastersView } from './view'

export type MasterViewGroup = 'People and places' | 'Schedule' | 'Billing' | 'Settings' | 'Go-live'

export const MASTER_VIEW_GROUPS: readonly MasterViewGroup[] = ['People and places', 'Schedule', 'Billing', 'Settings', 'Go-live']

export interface MasterViewEntry {
  view: MastersView
  label: string
  group: MasterViewGroup
  /** US-13.4.1's rows this view maintains, in the catalogue's words. */
  catalogueRows: readonly string[]
  add: boolean
  edit: boolean
  retire: boolean
  /** Rows referenced by nothing keep a delete (holidays). */
  remove: boolean
  seeded?: readonly LoadEntity[]
  /** A demo-only view (the developer's load), badged as such. */
  demo?: boolean
}

export const MASTER_VIEWS: readonly MasterViewEntry[] = [
  { view: 'anaesthetists', label: 'Anaesthetists', group: 'People and places', catalogueRows: ['anaesthetists'], add: true, edit: true, retire: false, remove: false, seeded: ['anaesthetists'] },
  { view: 'hospitals', label: 'Hospitals & holidays', group: 'People and places', catalogueRows: ['hospitals, each with a contact email for booking updates', "each hospital's own holiday calendar"], add: true, edit: true, retire: true, remove: true, seeded: ['hospitals', 'hospitalHolidays'] },
  { view: 'surgeons', label: 'Surgeons', group: 'People and places', catalogueRows: ['surgeons'], add: true, edit: true, retire: true, remove: false, seeded: ['surgeons'] },
  { view: 'specialties', label: 'Specialties', group: 'People and places', catalogueRows: ['specialties'], add: true, edit: true, retire: false, remove: true, seeded: ['specialties'] },
  { view: 'surgeonGroups', label: 'Surgeon groups', group: 'People and places', catalogueRows: ['surgeon groups'], add: true, edit: true, retire: true, remove: false },
  { view: 'recurringBookings', label: 'Recurring bookings', group: 'Schedule', catalogueRows: ['recurring bookings'], add: true, edit: true, retire: true, remove: false },
  { view: 'availability-statuses', label: 'Availability statuses', group: 'Schedule', catalogueRows: ['Slot availability statuses'], add: true, edit: true, retire: true, remove: false },
  { view: 'publicHolidays', label: 'Public holidays', group: 'Schedule', catalogueRows: ['the master (public holiday) calendar'], add: true, edit: true, retire: false, remove: true, seeded: ['publicHolidays'] },
  { view: 'scheduleSettings', label: 'Schedule settings', group: 'Schedule', catalogueRows: [], add: false, edit: true, retire: false, remove: false },
  { view: 'parties', label: 'Parties', group: 'Billing', catalogueRows: ['Parties, insurers and funders among them'], add: true, edit: true, retire: false, remove: false, seeded: ['parties'] },
  { view: 'fundingTags', label: 'Funding tags', group: 'Billing', catalogueRows: ['funding tags'], add: true, edit: true, retire: false, remove: true, seeded: ['fundingTags'] },
  { view: 'contracts', label: 'Contracts', group: 'Billing', catalogueRows: ['Contracts, with their price ranges'], add: true, edit: true, retire: true, remove: false, seeded: ['contracts', 'priceRanges'] },
  { view: 'rvgGroups', label: 'RVG groups', group: 'Billing', catalogueRows: ['RVG codes and groups'], add: true, edit: true, retire: true, remove: false, seeded: ['rvgGroups'] },
  { view: 'modifiers', label: 'Modifiers', group: 'Billing', catalogueRows: ['modifier codes'], add: true, edit: true, retire: true, remove: false, seeded: ['modifiers'] },
  { view: 'emailTemplates', label: 'Email templates', group: 'Settings', catalogueRows: [], add: true, edit: true, retire: false, remove: false },
  { view: 'xeroArchiving', label: 'Xero & archiving', group: 'Settings', catalogueRows: [], add: false, edit: true, retire: false, remove: false },
  { view: 'seedLoad', label: 'Seed load', group: 'Go-live', catalogueRows: [], add: false, edit: false, retire: false, remove: false, demo: true },
  { view: 'goLive', label: 'Go-live load', group: 'Go-live', catalogueRows: [], add: false, edit: false, retire: false, remove: false, demo: true },
]

export function masterViewEntry(view: MastersView): MasterViewEntry {
  return MASTER_VIEWS.find((v) => v.view === view)!
}

/** The one subtitle line a seeded view ends with. */
export const SEEDED_SUBTITLE = "Loaded once at go-live from AA's controlled spreadsheet, then kept here by hand."
