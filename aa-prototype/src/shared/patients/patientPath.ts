/** The patient's page (catch-up Phase 40; under People since build plan Phase 53): the NHI is the key, never the internal id. Every caller builds it here. */
export function patientPath(nhi: string): string {
  return `/admin/people/patients/${encodeURIComponent(nhi)}`
}
