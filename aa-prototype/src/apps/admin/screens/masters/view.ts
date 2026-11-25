/**
 * The Master data sub-nav (catch-up Phase 17; regrouped by catch-up Phase 42).
 * The selected view lives in the `?view=` search param, so a link can open
 * a view (`/admin/masters?view=hospitals`). A plain module so
 * fast refresh stays clean. The registry itself is `masterViews.ts`.
 */

import { MASTER_VIEWS } from './masterViews'

export type MastersView =
  | 'recurringBookings'
  | 'hospitals'
  | 'rvgGroups'
  | 'modifiers'
  | 'scheduleSettings'
  | 'availability-statuses'
  | 'publicHolidays'
  | 'emailTemplates'
  | 'prepaymentLetters'
  | 'xeroArchiving'
  | 'patientBalance'
  | 'seedLoad'
  | 'goLive'

/** Sub-nav order: the registry's, group by group. */
export const MASTERS_NAV: readonly { view: MastersView; label: string }[] = MASTER_VIEWS.map((v) => ({ view: v.view, label: v.label }))

export const DEFAULT_MASTERS_VIEW: MastersView = 'hospitals'

/**
 * The view a `?view=` value names; a missing or unknown value falls back to Hospitals.
 * Contracts, Parties (and the old Insurers and Organisations) and Funding tags left Master data
 * for the Contracts section (build plan Phases 45 and 48), and Anaesthetists, Surgeons (with the old
 * Surgeon groups and surgeons' rooms) and Specialties for People (Phase 53): `mastersRedirect` sends
 * those first.
 */
export function parseMastersView(param: string | null): MastersView {
  // The pre-Phase 29 view id still opens the same page.
  if (param === 'listStatuses') return 'availability-statuses'
  // The flat RVG code table became the RVG groups (catch-up Phase 19).
  if (param === 'rvgCodes') return 'rvgGroups'
  // The demo Modifier codes table became Modifiers (catch-up Phase 19b).
  if (param === 'modifierCodes') return 'modifiers'
  return MASTERS_NAV.find((n) => n.view === param)?.view ?? DEFAULT_MASTERS_VIEW
}
