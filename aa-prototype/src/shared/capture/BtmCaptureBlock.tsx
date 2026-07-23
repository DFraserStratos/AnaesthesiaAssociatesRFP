import { useMemo, useState } from 'react'
import { accent, neutral, semantic } from '../../theme/tokens'
import type { List, Procedure } from '../../domain/types'
import type { BillingValidationFailure } from '../../domain/billing'
import { useAppStore, type Actor } from '../../store'
import { procedureFee } from './feeContext'
import { AsaCard } from './AsaCard'
import { ProcedureCodeCard } from './ProcedureCodeCard'
import { TimesCard } from './TimesCard'
import { UnitsCard } from './UnitsCard'
import { FeeSummaryPanel } from './FeeSummaryPanel'
import { OverrideCard } from './OverrideCard'
import { BillingLinesCard } from './BillingLinesCard'
import { NotesCard } from './NotesCard'
import { Caption, FailureNotes } from './ui'

const ROUTE_LABEL: Record<string, string> = {
  hospital: 'Hospital / contract holder',
  billableParty: 'Billable party',
  insurer: 'Insurer (direct claim)',
}

/** Fields the read-only context line anchors (EditProcedureSheet owns them). */
const CONTEXT_FIELDS = [
  'billingRoute',
  'insurerId',
  'patientPaymentCategory',
  'billablePartyId',
  'prepaymentDetail',
] as const

interface BtmCaptureBlockProps {
  procedure: Procedure
  list: List
  actor: Actor
  /** 1-based position on the Card — feeds Type 3 second-procedure pricing. */
  ordinal: number
  /** True count of procedures (header shows PROCEDURE n only when > 1). */
  procedureCount: number
  canCapture: boolean
  /** This procedure's validation failures; rendered only after the latch. */
  failures: BillingValidationFailure[]
  showValidation: boolean
  /** Open the EditProcedureSheet for THIS procedure. */
  onEdit: () => void
  onError: (message: string) => void
}

/**
 * One procedure's Outcome/BTM capture block (mockup screen 3 = the skin; the
 * Phase 01 calculator = the maths). Composition: context header → ASA →
 * procedure code → times → B/T/M + chips → ink fee panel → override →
 * billing lines → notes. Write strategy (the logged capture-UX decision):
 * write-through per tap for steppers / chips / ASA / nudges / stamps — each
 * tap is one real audited procedure.update and drives the fee tick —
 * commit-on-blur/Save for all free text. Never debounced.
 */
export function BtmCaptureBlock({
  procedure,
  list,
  actor,
  ordinal,
  procedureCount,
  canCapture,
  failures,
  showValidation,
  onEdit,
  onError,
}: BtmCaptureBlockProps) {
  const masters = useAppStore((s) => s.masters)
  const billingLines = useAppStore((s) => s.schedule.billingLines)
  const [sheetHint, setSheetHint] = useState(false)

  const { fee, baseCode, contract, nonRvgLines } = useMemo(
    () => procedureFee({ procedure, list, ordinal, masters, billingLines }),
    [procedure, list, ordinal, masters, billingLines],
  )

  const shown = showValidation ? failures : []
  const forFields = (fields: readonly string[]) => shown.filter((f) => fields.includes(f.field))
  const contextFailures = forFields(CONTEXT_FIELDS)
  const anchored = new Set<string>([
    ...CONTEXT_FIELDS,
    'rvgBaseCode',
    'baseUnitsSelected',
    'anaestheticStartISO',
    'handoverISO',
    'billingLines',
    'priceOverride',
  ])
  const unanchored = shown.filter((f) => !anchored.has(f.field))

  const contractName = contract?.name
  const insurerName = procedure.insurerId !== undefined ? masters.insurers[procedure.insurerId]?.name : undefined
  const billablePartyName =
    procedure.billablePartyId !== undefined ? masters.billableParties[procedure.billablePartyId]?.name : undefined
  const contextParts = [contractName, insurerName, billablePartyName, procedure.billingReference].filter(
    (p): p is string => p !== undefined,
  )

  const editable = list.state === 'DRAFT' && procedure !== undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: PROCEDURE n · description · Edit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: procedureCount > 1 && ordinal > 1 ? 8 : 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {procedureCount > 1 && (
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist }}>
              PROCEDURE {ordinal}
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 600, color: procedure.description === '' ? neutral.mist : neutral.ink }}>
            {procedure.description === '' ? 'Operation to capture' : procedure.description}
          </span>
        </div>
        {editable && (
          <button
            type="button"
            onClick={onEdit}
            onMouseEnter={() => setSheetHint(true)}
            onMouseLeave={() => setSheetHint(false)}
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              color: contextFailures.length > 0 ? semantic.error.onTint : accent.base,
              cursor: 'pointer',
              textDecoration: sheetHint || contextFailures.length > 0 ? 'underline' : 'none',
              flex: 'none',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Read-only billing context line: route chip · contract · insurer ·
          billable party · reference. Route-setting is office knowledge
          (Phase 06); mobile corrects via the Edit sheet. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: neutral.sunken,
            fontSize: 12,
            fontWeight: 600,
            color: neutral.slate,
            flex: 'none',
          }}
        >
          {procedure.billingRoute !== undefined ? ROUTE_LABEL[procedure.billingRoute] : 'Route not set'}
        </span>
        {contextParts.length > 0 && (
          <span style={{ fontSize: 12, color: neutral.mist }}>{contextParts.join(' · ')}</span>
        )}
      </div>
      <FailureNotes failures={contextFailures} />

      {procedure.isAdditional && (
        <div style={{ background: accent.tint, color: accent.pressed, borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: '18px' }}>
          Additional procedure. It bills for time units only; base and modifier units stay on the
          first procedure.
        </div>
      )}

      <AsaCard procedure={procedure} actor={actor} disabled={!canCapture || procedure.isAdditional} onError={onError} />

      <ProcedureCodeCard
        procedure={procedure}
        baseCode={baseCode}
        rvgCodes={masters.rvgCodes}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['rvgBaseCode', 'baseUnitsSelected'])}
        onError={onError}
      />

      <TimesCard
        procedure={procedure}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['anaestheticStartISO', 'handoverISO'])}
        onError={onError}
      />

      <UnitsCard
        procedure={procedure}
        btm={fee.btm}
        baseCode={baseCode}
        actor={actor}
        canCapture={canCapture}
        isAdditional={procedure.isAdditional}
        onError={onError}
      />

      <FeeSummaryPanel fee={fee} isAdditional={procedure.isAdditional} />

      <OverrideCard
        procedure={procedure}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['priceOverride'])}
        onError={onError}
      />

      <BillingLinesCard
        procedure={procedure}
        nonRvgLines={nonRvgLines}
        contract={contract}
        masters={masters}
        actor={actor}
        canCapture={canCapture}
        failures={forFields(['billingLines'])}
      />

      <NotesCard procedure={procedure} actor={actor} canCapture={canCapture} onError={onError} />

      {unanchored.length > 0 && (
        <>
          <Caption color={semantic.error.onTint}>Also outstanding on this procedure:</Caption>
          <FailureNotes failures={unanchored} />
        </>
      )}
    </div>
  )
}
