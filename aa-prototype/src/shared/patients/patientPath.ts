/** The patient record's URL (catch-up Phase 40): the NHI is the key, never the internal id. Every caller builds it here. */
export function patientPath(nhi: string): string {
  return `/admin/patients/${encodeURIComponent(nhi)}`
}
