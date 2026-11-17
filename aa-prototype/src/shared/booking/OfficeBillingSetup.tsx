import { useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { billingReferenceMissing, procedureRequiresPrepayment } from '../../domain/billing'
import { useAppStore, type Actor } from '../../store'
import { Button } from '../ui'
import { formatCurrency } from '../format'
import { EditBillingSetupSheet, PriceOverrideSheet } from '../flows'

interface OfficeBillingSetupProps {
  procedure: Procedure
  /** Its number in display order (the primary is 1): numbers the `office-billing-setup-n` hook recipes land on. */
  displayNumber: number
  actor: Actor
  /** Office may edit (ACTIVE or SUBMITTED, not AUTHORISED, not cancelled). */
  canEdit: boolean
}

type Sheet = 'none' | 'setup' | 'override'

/**
 * The office billing-setup section (Phase 06; catch-up Phase 20), rendered per
 * procedure in `BookingDetailBody` only for an `office` actor: the reference, the price override
 * and whether a prepayment is required (from a prepaid Contract; INTERIM until
 * Phase 27). The Contract, its holder, who is invoiced and the Split are the
 * procedure stack's (catch-up Phases 20a and 22), so they are not repeated
 * here. A neutral tint (UI unification README question 14: teal is never a
 * label or status tint). "Edit billing setup" opens
 * "Contract and reference" (the reference; the payer is on the Booking since catch-up Phase 21).
 */
export function OfficeBillingSetup({ procedure, displayNumber, actor, canEdit }: OfficeBillingSetupProps) {
  const masters = useAppStore((s) => s.masters)
  const [sheet, setSheet] = useState<Sheet>('none')

  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const refMissing = billingReferenceMissing(procedure, masters.contracts, masters.parties)
  // Prepayment follows a prepaid Contract (INTERIM until Phase 27); read-only here.
  const prepaymentText = !procedureRequiresPrepayment(contract)
    ? 'Not required'
    : procedure.prepaymentDetail?.type === 'split' && procedure.prepaymentDetail.depositAmount !== undefined
      ? `Required · ${formatCurrency(procedure.prepaymentDetail.depositAmount)} seeded`
      : 'Required · prepaid Contract'

  const overrideLabel = (() => {
    const o = procedure.priceOverride
    if (o === undefined) return 'None'
    if (o.kind === 'fixedFee') return `Fixed fee ${formatCurrency(o.amount)}`
    if (o.kind === 'dollarAdjustment') return `Adjustment ${o.amount >= 0 ? '+' : ''}${formatCurrency(o.amount)}`
    return `Adjustment ${o.percent >= 0 ? '+' : ''}${o.percent}%`
  })()

  return (
    <div data-shot={`office-billing-setup-${displayNumber}`} style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.slate, textTransform: 'uppercase' }}>
          Office billing setup · {procedure.isPrimary ? 'primary procedure' : 'additional procedure'}
        </div>
      </div>

      {/* The Contract, its holder and who is invoiced show in the procedure stack above (catch-up Phase 20a). */}
      <Row label="Reference">{refMissing ? <Missing>Missing</Missing> : (procedure.billingReference ?? 'None')}</Row>
      <Row label="Override">{overrideLabel}</Row>
      <Row label="Prepayment">{prepaymentText}</Row>

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <Button variant="secondary" onClick={() => setSheet('setup')}>Edit billing setup</Button>
          <Button variant="secondary" onClick={() => setSheet('override')}>Price override</Button>
        </div>
      )}

      <EditBillingSetupSheet open={sheet === 'setup'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <PriceOverrideSheet open={sheet === 'override'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 84, flex: 'none', fontSize: 12, color: neutral.slate }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: neutral.ink, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</span>
    </div>
  )
}

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>{children}</span>
  )
}
