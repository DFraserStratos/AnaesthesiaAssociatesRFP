/**
 * One record per NHI (catch-up Phase 40; US-11.1.1, DM-30). Pure. The index
 * reports a duplicate NHI instead of silently picking one record.
 */

import type { Patient } from '../types'

export interface NhiIndex {
  byNhi: Map<string, Patient>
  /** NHIs held by more than one record, with every record's id. */
  duplicates: { nhi: string; patientIds: string[] }[]
}

export function normaliseNhiKey(nhi: string): string {
  return nhi.replace(/\s+/g, '').toUpperCase()
}

export function buildNhiIndex(patients: Iterable<Pick<Patient, 'hiddenInternalId' | 'nhi'>>): NhiIndex {
  const byNhi = new Map<string, Patient>()
  const dupes = new Map<string, string[]>()
  for (const p of patients) {
    const key = normaliseNhiKey(p.nhi)
    const prev = byNhi.get(key)
    if (prev === undefined) {
      byNhi.set(key, p as Patient)
      continue
    }
    dupes.set(key, [...(dupes.get(key) ?? [prev.hiddenInternalId]), p.hiddenInternalId])
  }
  return { byNhi, duplicates: [...dupes.entries()].map(([nhi, patientIds]) => ({ nhi, patientIds })) }
}
