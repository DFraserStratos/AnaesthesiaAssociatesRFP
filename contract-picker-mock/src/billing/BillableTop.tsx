import { AlertTriangle } from 'lucide-react'
import type { Approach } from '../App'
import { Card, Received } from '../booking/TopCards'
import { accent, neutral, radius, semantic } from '../theme/tokens'
import { BillingTree } from './BillingTree'
import { StepRail } from './StepVariants'
import type { BillableProps } from './parts'

/**
 * The top of the capture column for the billable-party-first options: the
 * procedure as received, full width, then a full-width Billing card holding the
 * chosen variant, then what is left for the anaesthetist (whose phone is docked
 * beside every option) and a flag when the anaesthetist has changed anything.
 */
export function BillableTop({ approach, review, onReviewed, ...props }: BillableProps & { approach: Approach; review: string | null; onReviewed: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex' }}>
        <Card>
          <Received scenario={props.scenario} title="Procedure as received" wide />
        </Card>
      </div>
      <div style={{ display: 'flex' }}>
        <Card title="Billing">
          {approach === 'bp-rail' && <StepRail {...props} />}
          {approach === 'bp-tree' && <BillingTree {...props} />}
          <div style={{ marginTop: review ? 14 : 0 }}>
            <HandoffStatus review={review} onReviewed={onReviewed} />
          </div>
        </Card>
      </div>
    </div>
  )
}

/** Any change the anaesthetist made on the phone, flagged for the office to review. */
export function HandoffStatus({ review, onReviewed }: { review: string | null; onReviewed: () => void }) {
  if (!review) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.ctl, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>
          <AlertTriangle size={17} />
          <span style={{ flex: 1 }}>Changed by the anaesthetist: {review}</span>
          <button type="button" onClick={onReviewed} style={{ border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Mark reviewed
          </button>
        </div>
      )}
    </div>
  )
}
