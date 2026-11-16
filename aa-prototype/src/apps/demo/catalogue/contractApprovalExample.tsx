/**
 * `ContractApprovalLine` over the seeded review-flags List's Contract change
 * (catch-up Phase 21a): "Awaiting office approval" until the office approves
 * it, then "Approved by the office {time}". Reads the live demo store; writes
 * nothing.
 */
import { ContractApprovalLine } from '../../../shared/booking/ContractApprovalLine'
import { proceduresForBooking, useAppStore } from '../../../store'
import { SEED_MARKERS } from '../../../domain/seed'

export function ContractApprovalExample() {
  const bookingId = SEED_MARKERS.contractChangeBooking?.entityId
  const procedure = useAppStore((s) => (bookingId !== undefined ? proceduresForBooking(s, bookingId)[0] : undefined))
  if (procedure === undefined) return null
  return <ContractApprovalLine procedureId={procedure.id} />
}
