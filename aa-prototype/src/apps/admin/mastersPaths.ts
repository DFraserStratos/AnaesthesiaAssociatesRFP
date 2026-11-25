/**
 * The Master data URLs (catch-up Phase 17): a view of the sub-nav. The
 * anaesthetist's and surgeon's pages moved to People (build plan Phase 53):
 * their paths are in `peoplePaths.ts`.
 */

import type { MastersView } from './screens/masters/view'

/** A Master data view by its `?view=` value. */
export function mastersViewPath(view: MastersView): string {
  return `/admin/masters?view=${view}`
}
