/**
 * The Master data sub-nav (catch-up Phase 17; regrouped by catch-up Phase 42).
 * The selected view lives in the `?view=` search param, so a profile page can
 * link back to its view (`/admin/masters?view=surgeons`). A plain module so
 * fast refresh stays clean. The registry itself is `masterViews.ts`.
 */

import { MASTER_VIEWS } from './masterViews'

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
  | 'publicHolidays'
  | 'emailTemplates'
  | 'prepaymentLetters'
  | 'xeroArchiving'
  | 'seedLoad'
  | 'goLive'

/** Sub-nav order: the registry's, group by group. */
export const MASTERS_NAV: readonly { view: MastersView; label: string }[] = MASTER_VIEWS.map((v) => ({ view: v.view, label: v.label }))

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
