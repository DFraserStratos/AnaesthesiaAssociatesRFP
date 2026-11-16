import { useMemo } from 'react'
import { neutral } from '../../theme/tokens'
import { contractChangeFor, useAppStore } from '../../store'
import { stampText } from '../../domain/dateText'

export const AWAITING_OFFICE_APPROVAL = 'Awaiting office approval'
export const APPROVED_BY_THE_OFFICE = 'Approved by the office'

/**
 * The anaesthetist's view of their own Contract change (catch-up Phase 21a;
 * US-03.4.1, US-07.2.2): "Awaiting office approval" until the office approves
 * it on Review (or authorises the List), then "Approved by the office {time}".
 * Nothing when the anaesthetist never changed the Contract. Quiet text, never
 * a block, no money.
 */
export function ContractApprovalLine({ procedureId }: { procedureId: string }) {
  const audit = useAppStore((s) => s.audit)
  const masters = useAppStore((s) => s.masters)
  const change = useMemo(() => contractChangeFor({ audit, masters }, procedureId), [audit, masters, procedureId])
  if (change === undefined) return null
  const approved = change.status === 'approved' && change.approval !== undefined ? change.approval : undefined
  return (
    <span data-shot="contract-approval-status" data-status={change.status} style={{ fontSize: 12.5, color: neutral.slate }}>
      {approved !== undefined ? `${APPROVED_BY_THE_OFFICE} ${stampText(approved.atISO)}` : AWAITING_OFFICE_APPROVAL}
    </span>
  )
}
