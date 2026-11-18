import { useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { billingReferenceMissing, isPrepaidContract } from '../../domain/billing'
import { useAppStore, type Actor } from '../../store'
import { Button, DefList, DefRow, Eyebrow } from '../ui'
import { formatCurrency } from '../format'
import { EditBillingSetupSheet, PricingSheet } from '../flows'
import { lockStampText, lockViewFor, type BookingLock } from '../../domain/billing/lock'
import { LockBadge } from './LockBadge'
import { BILLS_LABEL, pricingLabel } from '../contracts'

interface OfficeBillingSetupProps {
  procedure: Procedure
  /** Its number in display order (the primary is 1): numbers the `office-billing-setup-n` hook recipes land on. */
  displayNumber: number
  actor: Actor
  /** Office may edit (ACTIVE or SUBMITTED, not AUTHORISED, not cancelled). */
  canEdit: boolean
}

type Sheet = 'none' | 'setup' | 'price'

/**
 * The office billing-setup section (Phase 06; catch-up Phase 20), rendered per
 * procedure in `BookingDetailBody` only for an `office` actor: the reference, the typed price (Change price, catch-up Phase 24)
 * and whether a prepayment is required (from a prepaid Contract; INTERIM until
 * Phase 27). The Contract, its holder, who is invoiced and the Split are the
 * procedure stack's (catch-up Phases 20a and 22), so they are not repeated
 * here. A neutral tint (UI unification README question 14: teal is never a
 * label or status tint). "Edit billing setup" opens
 * "Contract and reference" (the reference; the payer is on the Booking since catch-up Phase 21).
 */
export function OfficeBillingSetup({ procedure, displayNumber, actor, canEdit }: OfficeBillingSetupProps) {
  const masters = useAppStore((s) => s.masters)
  const lock = useAppStore((s) => s.billing.locks[procedure.bookingId])
  const [sheet, setSheet] = useState<Sheet>('none')
  // Once authorised, the office reads what was locked (catch-up Phase 25): no picker, no share editor.
  if (lock !== undefined && lock.state === 'locked') return <LockedBillingSetup lock={lock} procedure={procedure} displayNumber={displayNumber} />

  const contract = procedure.governingContractId !== undefined ? masters.contracts[procedure.governingContractId] : undefined
  const refMissing = billingReferenceMissing(procedure, masters.contracts, masters.parties)
  // Prepayment follows a prepaid Contract (catch-up Phase 27); read-only here, the panel above carries its status.
  const prepaymentText = isPrepaidContract(contract) ? 'Prepaid Contract' : 'Not prepaid'

  const typedLabel = procedure.enteredPrice !== undefined ? `Typed ${formatCurrency(procedure.enteredPrice)}` : 'From the Contract'

  return (
    <div data-shot={`office-billing-setup-${displayNumber}`} style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow tone="slate">
          Office billing setup · {procedure.isPrimary ? 'primary procedure' : 'additional procedure'}
        </Eyebrow>
      </div>

      {/* The Contract, its holder and who is invoiced show in the procedure stack above (catch-up Phase 20a). */}
      <DefList gap={10}>
        <DefRow labelTone="slate" valueStyle={STACK} label="Reference">{refMissing ? <Missing>Missing</Missing> : (procedure.billingReference ?? 'None')}</DefRow>
        <DefRow labelTone="slate" valueStyle={STACK} label="Price"><span data-shot="office-billing-price">{typedLabel}</span></DefRow>
        <DefRow labelTone="slate" valueStyle={STACK} label="Prepayment">{prepaymentText}</DefRow>
      </DefList>

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <Button variant="secondary" onClick={() => setSheet('setup')}>Edit billing setup</Button>
          <Button variant="secondary" onClick={() => setSheet('price')} shot="change-price">Change price</Button>
        </div>
      )}

      <EditBillingSetupSheet open={sheet === 'setup'} procedure={procedure} actor={actor} onClose={() => setSheet('none')} />
      <PricingSheet open={sheet === 'price'} procedureId={procedure.id} actor={actor} onClose={() => setSheet('none')} />
    </div>
  )
}

/**
 * The office billing setup on a locked Booking (catch-up Phase 25; US-04.3.5):
 * read-only from the lock (`lockViewFor`), never the masters: the Contract as
 * locked with its settings, who is billed, the pricing basis with its figure,
 * the split as typed and the payee.
 */
function LockedBillingSetup({ lock, procedure, displayNumber }: { lock: BookingLock; procedure: Procedure; displayNumber: number }) {
  const view = lockViewFor(lock, procedure.id)
  const p = view.procedure
  return (
    <div data-shot={`office-billing-setup-${displayNumber}`} data-locked="true" style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Eyebrow tone="slate">
          Office billing setup · {procedure.isPrimary ? 'primary procedure' : 'additional procedure'}
        </Eyebrow>
        <LockBadge bookingId={procedure.bookingId} />
      </div>
      <DefList gap={10}>
        {p !== undefined && (
          <>
            <DefRow labelTone="slate" valueStyle={STACK} label="Contract">
              <span>{p.contractName ?? 'Migrated history'}{p.contractAaCode !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.slate }}> · {p.contractAaCode}</span>}</span>
              {p.pricing !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>{pricingLabel(p.pricing)}{p.billsTo !== undefined ? ` · bills ${BILLS_LABEL[p.billsTo].toLowerCase()}` : ''}</span>}
            </DefRow>
            <DefRow labelTone="slate" valueStyle={STACK} label="Billed to">{p.billedName ?? 'As invoiced'}</DefRow>
            <DefRow labelTone="slate" valueStyle={STACK} label="Price">
              <span data-shot="office-billing-price" className="mono">{formatCurrency(p.price)}{p.typed ? ' · typed' : ''}</span>
              {p.basisText !== undefined && <span style={{ fontSize: 12.5, color: neutral.slate }}>{p.basisText}</span>}
            </DefRow>
            {p.splitText !== 'Full' && <DefRow labelTone="slate" valueStyle={STACK} label="Split">{p.splitText}</DefRow>}
          </>
        )}
        <DefRow labelTone="slate" valueStyle={STACK} label="Paid to">{view.payeeName}</DefRow>
      </DefList>
      <span data-shot="office-billing-locked-stamp" style={{ fontSize: 12, color: neutral.slate }}>{lockStampText(view)}</span>
    </div>
  )
}

/** The value column stacks a figure over its quiet line, as the card's rows always did. */
const STACK = { display: 'flex', flexDirection: 'column', gap: 2 } as const

function Missing({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>{children}</span>
  )
}
