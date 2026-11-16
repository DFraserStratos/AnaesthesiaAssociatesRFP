/**
 * The Booking's insurer or funder as the Booking shows it (catch-up Phase 21;
 * US-11.4.3): the Party's name and kind, then the approval number itself
 * (shown to the anaesthetist too, OQ-93 part 4), or a warning-tint "No
 * approval number" chip when `approvalNumberMissing` says so. "None, the
 * patient pays" when blank. Shared by the Funder section in all three apps; it
 * derives nothing (the caller passes the `insurance.ts` result). No money.
 */

import { neutral } from '../../theme/tokens'
import type { Party } from '../../domain/types'
import { Pill } from '../ui'

export function FunderDetailsView({
  funder,
  approvalNumber,
  approvalMissing,
}: {
  funder: Pick<Party, 'name' | 'kind'> | undefined
  approvalNumber: string | undefined
  /** `approvalNumberMissing` (an insurer with no number). */
  approvalMissing: boolean
}) {
  if (funder === undefined) {
    return <span style={{ fontSize: 14, color: neutral.mist }}>None, the patient pays</span>
  }
  const number = approvalNumber !== undefined && approvalNumber.trim() !== '' ? approvalNumber : undefined
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{funder.name}</span>
        <span style={{ fontSize: 13, color: neutral.slate }}>{funder.kind === 'insurer' ? 'Insurer' : 'Funder'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist }}>Approval number</span>
        {number !== undefined ? (
          <span data-aa-selectable data-shot="funder-approval-number" className="mono" style={{ fontSize: 14, color: neutral.ink }}>
            {number}
          </span>
        ) : approvalMissing ? (
          <Pill tone="warning" shot="funder-approval-missing">
            No approval number
          </Pill>
        ) : (
          <span style={{ fontSize: 14, color: neutral.mist }}>None recorded</span>
        )}
      </div>
    </div>
  )
}
