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
  | 'surgeonGroups'
  | 'parties'
  | 'specialties'
  | 'fundingTags'
  | 'rvgGroups'
  | 'modifiers'
  | 'scheduleSettings'
  | 'availability-statuses'
  | 'emailTemplates'
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
  { view: 'surgeonGroups', label: 'Surgeon groups' },
  // Catch-up Phase 19 (US-05.1.1): the RVG groups as published plus AA's own; replaces the view-only RVG codes.
  { view: 'rvgGroups', label: 'RVG groups' },
  // Catch-up Phase 19b (US-05.1.5): the RVG modifier table as printed plus AA's own; replaces the demo Modifier codes.
  { view: 'modifiers', label: 'Modifiers' },
  { view: 'scheduleSettings', label: 'Schedule settings' },
  // Catch-up Phase 29 (US-01.2.2): the user-maintained availability statuses; never "slot" in the UI (OQ-64).
  { view: 'availability-statuses', label: 'Availability statuses' },
  // Catch-up Phase 35 (US-02.3.4): the update email's wording per kind of change.
  { view: 'emailTemplates', label: 'Email templates' },
  { view: 'xeroArchiving', label: 'Xero & archiving' },
]

export const DEFAULT_MASTERS_VIEW: MastersView = 'anaesthetists'

/** The view a `?view=` value names; a missing or unknown value falls back to Anaesthetists. */
export function parseMastersView(param: string | null): MastersView {
  // The pre-Phase 29 view id still opens the same page.
  if (param === 'listStatuses') return 'availability-statuses'
  // The Insurer master and the holder organisations folded into Parties (catch-up Phase 18).
  if (param === 'insurers' || param === 'organisations') return 'parties'
  // The flat RVG code table became the RVG groups (catch-up Phase 19).
  if (param === 'rvgCodes') return 'rvgGroups'
  // The demo Modifier codes table became Modifiers (catch-up Phase 19b).
  if (param === 'modifierCodes') return 'modifiers'
  // The surgeons' rooms master went with catch-up Phase 17b (D74): its old URL opens Surgeons.
  if (param === 'surgeonRooms') return 'surgeons'
  return MASTERS_NAV.find((n) => n.view === param)?.view ?? DEFAULT_MASTERS_VIEW
}
