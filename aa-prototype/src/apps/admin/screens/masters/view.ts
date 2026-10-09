/**
 * The Master data sub-nav (catch-up Phase 17). The selected view lives in the
 * `?view=` search param, so a profile page can link back to its view
 * (`/admin/masters?view=surgeons`). A plain module so fast refresh stays clean.
 */

export type MastersView =
  | 'anaesthetists'
  | 'contracts'
  | 'recurringBookings'
  | 'hospitals'
  | 'surgeons'
  | 'surgeonRooms'
  | 'surgeonGroups'
  | 'insurers'
  | 'organisations'
  | 'rvgCodes'
  | 'modifierCodes'
  | 'scheduleSettings'
  | 'availability-statuses'
  | 'xeroArchiving'

/** Sub-nav order (the phase doc's). */
export const MASTERS_NAV: readonly { view: MastersView; label: string }[] = [
  { view: 'anaesthetists', label: 'Anaesthetists' },
  { view: 'contracts', label: 'Contracts' },
  { view: 'recurringBookings', label: 'Recurring bookings' },
  { view: 'hospitals', label: 'Hospitals & holidays' },
  { view: 'surgeons', label: 'Surgeons' },
  { view: 'surgeonRooms', label: "Surgeons' rooms" },
  { view: 'surgeonGroups', label: 'Surgeon groups' },
  { view: 'insurers', label: 'Insurers' },
  { view: 'organisations', label: 'Organisations' },
  { view: 'rvgCodes', label: 'RVG codes' },
  { view: 'modifierCodes', label: 'Modifier codes' },
  { view: 'scheduleSettings', label: 'Schedule settings' },
  // Catch-up Phase 29 (US-01.2.2): the user-maintained availability statuses; never "slot" in the UI (OQ-64).
  { view: 'availability-statuses', label: 'Availability statuses' },
  { view: 'xeroArchiving', label: 'Xero & archiving' },
]

export const DEFAULT_MASTERS_VIEW: MastersView = 'anaesthetists'

/** The view a `?view=` value names; a missing or unknown value falls back to Anaesthetists. */
export function parseMastersView(param: string | null): MastersView {
  // The pre-Phase 29 view id still opens the same page.
  if (param === 'listStatuses') return 'availability-statuses'
  return MASTERS_NAV.find((n) => n.view === param)?.view ?? DEFAULT_MASTERS_VIEW
}
