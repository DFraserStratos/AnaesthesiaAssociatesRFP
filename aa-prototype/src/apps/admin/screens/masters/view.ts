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
  | 'parties'
  | 'specialties'
  | 'fundingTags'
  | 'rvgCodes'
  | 'modifierCodes'
  | 'scheduleSettings'
  | 'availability-statuses'
  | 'xeroArchiving'

/** Sub-nav order (the phase doc's). */
export const MASTERS_NAV: readonly { view: MastersView; label: string }[] = [
  { view: 'anaesthetists', label: 'Anaesthetists' },
  { view: 'contracts', label: 'Contracts' },
  // Catch-up Phase 18a (US-13.4.5): AA's funding tags in step-rail order, beside the Contracts that carry them.
  { view: 'fundingTags', label: 'Funding tags' },
  // Catch-up Phase 18 (US-04.1.5): everyone who holds Contracts; replaces Insurers and Organisations (RV-39).
  { view: 'parties', label: 'Parties' },
  { view: 'recurringBookings', label: 'Recurring bookings' },
  { view: 'hospitals', label: 'Hospitals & holidays' },
  { view: 'surgeons', label: 'Surgeons' },
  // Catch-up Phase 18a (US-13.4.4): AA's broad specialties, beside the surgeons who hold them.
  { view: 'specialties', label: 'Specialties' },
  { view: 'surgeonRooms', label: "Surgeons' rooms" },
  { view: 'surgeonGroups', label: 'Surgeon groups' },
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
  // The Insurer master and the holder organisations folded into Parties (catch-up Phase 18).
  if (param === 'insurers' || param === 'organisations') return 'parties'
  return MASTERS_NAV.find((n) => n.view === param)?.view ?? DEFAULT_MASTERS_VIEW
}
