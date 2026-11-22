import { OFFICE_PRIVATE_AUDIT_ACTIONS } from '../../domain/pairingPreferences'

/**
 * An audit entry only the office may read: a pairing preference, a priority tier or a
 * not-preferred pairing acknowledged (catch-up Phase 17's boundary). A Booking's history
 * reaches List entries through its List's reassignments (catch-up Phase 35), and an
 * acknowledgement rides in that change set, so the anaesthetist's history drops these
 * (catch-up Phase 43a). One home for the check: the action set stays 17's.
 */
export function isOfficeOnlyAuditEntry(entry: { action: string }): boolean {
  return OFFICE_PRIVATE_AUDIT_ACTIONS.has(entry.action)
}
