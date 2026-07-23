import { useState } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { List, Procedure } from '../../domain/types'
import { useAppStore, type Actor } from '../../store'
import { Button } from '../ui'
import { EditBillingSetupSheet, PriceOverrideSheet, FunderAllocationSheet } from '../flows'

interface OfficeBillingSetupProps {
  procedure: Procedure
  list: List
  /** 1-based position on the Card. */
  ordinal: number
  actor: Actor
  /** Office may edit (DRAFT or SUBMITTED, not AUTHORISED, not cancelled). */
  canEdit: boolean
}

const ROUTE_LABEL: Record<string, string> = {
  hospital: 'Contract holder',
  billableParty: 'Billable party',
  insurer: 'Insurer',
}

const CATEGORY_LABEL: Record<string, string> = {
  selfFundedPostProcedure: 'Self-funded',
  selfFundedPrepayment: 'Pre-payment',
  insuredReimbursement: 'Reimbursement',
}

type Sheet = 'none' | 'setup' | 'override' | 'funder'

/**
 * The office billing-setup section (Phase 06), rendered per procedure in
 * `CardDetailBody` only for an `office` actor. Surfaces the full RFP billing
 * setup as summary rows and opens the three office editors: billing setup
 * (route / insurer / category / governing contract / reference / guardian),
 * the full typed price override, and per-line funder allocation. Mobile and
 * the anaesthetist web keep the read-only capture context line unchanged.
 */
export function OfficeBillingSetup({ procedure, list, ordinal, actor, canEdit }: OfficeBillingSetupProps) {
  const masters = useAppStore((s) => s.masters)
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const [sheet, setSheet] = useState<Sheet>('none')

  const route = procedure.billingRoute
  const insurer = procedure.insurerId !== undefined ? masters.insurers[procedure.insurerId] : undefined
  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const payer = procedure.billablePartyId !== undefined ? masters.billableParties[procedure.billablePartyId] : undefined
  const lines = Object.values(billingLinesRecord).filter((l) => l.procedureId === procedure.id)
  const funderLines = lines.filter((l) => l.funderOverride !== undefined)
  const refMissing = route === 'hospital' && (procedure.billingReference === undefined || procedure.billingReference.trim() === '')

  const overrideLabel = (() => {
    const o = procedure.priceOverride
    if (o === undefined) return 'None'
    if (o.kind === 'fixedFee') return `Fixed fee $${o.amount.toFixed(2)}`
    if (o.kind === 'dollarAdjustment') return `Adjustment ${o.amount >= 0 ? '+' : ''}$${o.amount.toFixed(2)}`
    return `Adjustment ${o.percent >= 0 ? '+' : ''}${o.percent}%`
  })()

  return (
    <div style={{ background: accent.tint, border: `1px solid ${accent.base}33`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: accent.pressed, textTransform: 'uppercase' }}>
          Office billing setup · procedure {ordinal}
        </div>
      </div>

      <Row label="Route">{route !== undefined ? ROUTE_LABEL[route] : <Missing>Not set</Missing>}</Row>
      {route === 'insurer' && <Row label="Insurer">{insurer?.name ?? <Missing>Not set</Missing>}</Row>}
      {route === 'billableParty' && (
        <>
          <Row label="Category">{procedure.patientPaymentCategory !== undefined ? CATEGORY_LABEL[procedure.patientPaymentCategory] : <Missing>Not set</Missing>}</Row>
          <Row label="Payer">{payer !== undefined ? `${payer.name} (${payer.relationshipToPatient})` : 'Patient (default)'}</Row>
        </>
      )}
      <Row label="Contract">{contract?.name ?? 'None'}</Row>
      <Row label="Reference">{refMissing ? <Missing>Missing</Missing> : (procedure.billingReference ?? 'None')}</Row>
      <Row label="Override">{overrideLabel}</Row>
      <Row label="Funders">
        {funderLines.length === 0 ? `${lines.length} line${lines.length === 1 ? '' : 's'}, single funder` : `${funderLines.length} of ${lines.length} lines reallocated`}
      </Row>

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <Button variant="secondary" onClick={() => setSheet('setup')}>Edit billing setup</Button>
          <Button variant="secondary" onClick={() => setSheet('override')}>Price override</Button>
          <Button variant="secondary" onClick={() => setSheet('funder')}>Funder allocation</Button>
        </div>
      )}

      <EditBillingSetupSheet open={sheet === 'setup'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <PriceOverrideSheet open={sheet === 'override'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <FunderAllocationSheet open={sheet === 'funder'} procedure={procedure} list={list} ordinal={ordinal} actor={actor} onClose={() => setSheet('none')} />
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 84, flex: 'none', fontSize: 12, color: accent.pressed }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>{children}</span>
  )
}
