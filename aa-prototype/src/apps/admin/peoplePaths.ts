/**
 * The People section's URLs (build plan Phase 53; D99, D100): its four tabs and
 * the anaesthetist's and surgeon's pages, each keyed by an id that never
 * changes. The one home every in-app link builds them from; a patient's page is
 * `shared/patients`' `patientPath`. Old Master data, profile and Patients links
 * redirect here (`mastersRedirect.ts`, `router.tsx`).
 */

export type PeopleTab = 'anaesthetists' | 'surgeons' | 'specialties' | 'patients'

export const PEOPLE_BASE = '/admin/people'

/** A People tab, with any list state (`q`, `status`, `tier`, `specialty`, `page`, `show`) as its query. */
export function peoplePath(tab: PeopleTab, query: Readonly<Record<string, string>> = {}): string {
  const search = new URLSearchParams(query).toString()
  return `${PEOPLE_BASE}/${tab}${search === '' ? '' : `?${search}`}`
}

/** An anaesthetist's page, keyed by the registration number (the anaesthetist's id). */
export function anaesthetistRecordPath(anaesthetistId: string): string {
  return `${PEOPLE_BASE}/anaesthetists/${encodeURIComponent(anaesthetistId)}`
}

export function surgeonProfilePath(surgeonId: string): string {
  return `${PEOPLE_BASE}/surgeons/${encodeURIComponent(surgeonId)}`
}
