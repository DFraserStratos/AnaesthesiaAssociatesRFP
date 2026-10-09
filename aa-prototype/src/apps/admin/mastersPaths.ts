/**
 * The Master data URLs (catch-up Phase 17): a view of the sub-nav, the surgeon
 * profile and the Admin anaesthetist record. One home so the tables, the
 * profile pages, the pairing section and the List drawer agree.
 */

import type { MastersView } from './screens/masters/view'

/** A Master data view by its `?view=` value (the profile pages' back links). */
export function mastersViewPath(view: MastersView): string {
  return `/admin/masters?view=${view}`
}

export function surgeonProfilePath(surgeonId: string): string {
  return `/admin/masters/surgeons/${encodeURIComponent(surgeonId)}`
}

export function anaesthetistRecordPath(anaesthetistId: string): string {
  return `/admin/masters/anaesthetists/${encodeURIComponent(anaesthetistId)}`
}
