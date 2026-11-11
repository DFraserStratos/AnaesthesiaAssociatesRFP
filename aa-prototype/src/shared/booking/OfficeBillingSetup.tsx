import { useState } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { AssignedList, Procedure } from '../../domain/types'
import { billingReferenceMissing, procedureRequiresPrepayment } from '../../domain/billing'
import { billedPartyForProcedure, counterpartyName, useAppStore, type Actor } from '../../store'
import { Button } from '../ui'
import { formatCurrency } from '../format'
import { EditBillingSetupSheet, PriceOverrideSheet, FunderAllocationSheet } from '../flows'
import { ProcedureContractRow } from './ProcedureContractRow'

interface OfficeBillingSetupProps {
  procedure: Procedure
  list: AssignedList
  /** 1-based position on the Booking. */
  ordinal: number
  actor: Actor
  /** Office may edit (ACTIVE or SUBMITTED, not AUTHORISED, not cancelled). */
  canEdit: boolean
}

type Sheet = 'none' | 'setup' | 'override' | 'funder'

/**
 * The office billing-setup section (Phase 06; catch-up Phase 20), rendered per
 * procedure in `BookingDetailBody` only for an `office` actor: the one
 * Contract (chosen or changed on the step rail), who is billed (the Contract
 * says; INTERIM until Phase 21), the reference, the price override, the
 * funders (INTERIM until Phase 22) and whether a prepayment is required (from
 * a prepaid Contract; INTERIM until Phase 27). "Edit billing setup" opens
 * "Contract and payer" (the payer override and the reference).
 */
export function OfficeBillingSetup({ procedure, list, ordinal, actor, canEdit }: OfficeBillingSetupProps) {
  const masters = useAppStore((s) => s.masters)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const [sheet, setSheet] = useState<Sheet>('none')

  const schedule = useAppStore((s) => s.schedule)
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const holder = contract !== undefined ? masters.parties[contract.holderId] : undefined
  const billed = billedPartyForProcedure({ masters, schedule }, procedure.id)
  const lines = Object.values(billingLinesRecord).filter((l) => l.procedureId === procedure.id)
  const funderLines = lines.filter((l) => l.funderOverride !== undefined)
  const refMissing = billingReferenceMissing(procedure, masters.contracts, masters.parties)
  // Prepayment follows a prepaid Contract (INTERIM until Phase 27); read-only here.
  const prepaymentText = !procedureRequiresPrepayment(procedure, contract)
    ? 'Not required'
    : procedure.prepaymentDetail?.type === 'split' && procedure.prepaymentDetail.depositAmount !== undefined
      ? `Required · ${formatCurrency(procedure.prepaymentDetail.depositAmount)} seeded`
      : 'Required · prepaid Contract'

  const overrideLabel = (() => {
    const o = procedure.priceOverride
    if (o === undefined) return 'None'
    if (o.kind === 'fixedFee') return `Fixed fee $${o.amount.toFixed(2)}`
    if (o.kind === 'dollarAdjustment') return `Adjustment ${o.amount >= 0 ? '+' : ''}$${o.amount.toFixed(2)}`
    return `Adjustment ${o.percent >= 0 ? '+' : ''}${o.percent}%`
  })()

  return (
    <div data-shot={`office-billing-setup-${ordinal}`} style={{ background: accent.tint, border: `1px solid ${accent.base}33`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: accent.pressed, textTransform: 'uppercase' }}>
          Office billing setup · procedure {ordinal}
        </div>
      </div>

      <Row label="Contract">
        <ProcedureContractRow procedure={procedure} actor={actor} canEdit={false} shot="office-procedure-contract" />
        {holder !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>Held by {holder.name}</span>}
      </Row>
      <Row label="Billed to">{billed !== undefined ? counterpartyName({ masters }, billed) : <Missing>Needs an invoice destination</Missing>}</Row>
      <Row label="Reference">{refMissing ? <Missing>Missing</Missing> : (procedure.billingReference ?? 'None')}</Row>
      <Row label="Override">{overrideLabel}</Row>
      <Row label="Funders">
        {funderLines.length === 0 ? `${lines.length} line${lines.length === 1 ? '' : 's'}, single funder` : `${funderLines.length} of ${lines.length} lines reallocated`}
      </Row>
      <Row label="Prepayment">{prepaymentText}</Row>

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <Button variant="secondary" onClick={() => setSheet('setup')}>Edit billing setup</Button>
          <Button variant="secondary" onClick={() => setSheet('override')}>Price override</Button>
          <Button variant="secondary" onClick={() => setSheet('funder')}>Funder allocation</Button>
        </div>
      )}

      <EditBillingSetupSheet open={sheet === 'setup'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <PriceOverrideSheet open={sheet === 'override'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <FunderAllocationSheet open={sheet === 'funder'} procedure={procedure} list={list} actor={actor} onClose={() => setSheet('none')} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 84, flex: 'none', fontSize: 12, color: accent.pressed }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: neutral.ink, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</span>
    </div>
  )
}

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>{children}</span>
  )
}
