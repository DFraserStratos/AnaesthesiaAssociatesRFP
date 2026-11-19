import { useBookingApi, useBookingStore, usePrimaryEditLabel } from '../booking/draft'
import { useEffect, useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import type { Contract, Procedure } from '../../domain/types'
import type { FeeResult } from '../../domain/billing/fee'
import { isRvgKind } from '../../domain/billing/contracts'
import { parseAmount } from '../../domain/billing/money'
import { anaesthetistPriceCaption } from '../../domain/billing/procedurePrice'
import { NEEDS_PRICE_LABEL } from '../../domain/billing/priceRanges'
import { anaesthetistPriceRightFor, priceChangeRefusal, setProcedurePrice, useProcedurePrepayment, isStillPrepaid, type Actor } from '../../store'
import { Button, Pill, TextField } from '../ui'
import { TextAction } from '../ui/TextAction'
import { formatMoney } from '../format'
import { CaptureSection, Caption, FailureNotes } from './ui'
import type { BillingValidationFailure } from '../../domain/billing'

interface PriceCardProps {
  procedure: Procedure
  actor: Actor
  /** This Procedure's fee from the one Booking assembler (its price ladder answer in `fee.price`). */
  fee: FeeResult
  contract?: Contract | undefined
  /** False on a List the actor can no longer change: the figures only (`locked`). */
  canCapture: boolean
  failures: BillingValidationFailure[]
  onError: (message: string) => void
}

export type PriceCardState = 'override' | 'amount' | 'read-only' | 'needs-price' | 'no-charge' | 'locked'

/**
 * What the price comes to, quietly, as the anaesthetist records (catch-up
 * Phase 24; US-03.3.10, US-03.5.1, US-05.4.1, US-05.4.3, RV-29). One card on
 * every surface through `useSurface()`'s `Pair`, always shown, in mono:
 * "12 units x $30.00 = $360.00", the Contract's discount as applied, "Fixed
 * price $2,800.00", or "Needs a price". It reads the fee engine's answer
 * (`fee.price`), so it moves as times and modifiers are added.
 *
 * Where the anaesthetist may change the price (`anaesthetistMayTypePrice`: an
 * RVG Contract whose setting allows it, or the amount on No contract · Fixed
 * price) it carries one "Price $" field, Save and "Use the computed price";
 * the computed line and the RVG detail stay shown. Where she may not, the
 * same figures read-only with the reason, and no input pretending. No reason
 * is ever asked. The office changes the price with Change price (Admin).
 */
export function PriceCard({ procedure, actor, fee, contract, canCapture, failures, onError }: PriceCardProps) {
  const bookingApi = useBookingApi()
  // "Apply" in the Admin draft (catch-up Phase 35): the draft's Save changes saves.
  const primaryLabel = usePrimaryEditLabel('Save price')
  const procedures = useBookingStore((s) => s.schedule.procedures)
  const bookings = useBookingStore((s) => s.schedule.bookings)
  const lists = useBookingStore((s) => s.schedule.lists)
  const invoiceLines = useBookingStore((s) => s.billing.invoiceLines)
  const masters = useBookingStore((s) => s.masters)
  // The store's gate, re-read when anything it reads changes, so the card never offers what the store refuses.
  const refusal = useMemo(
    () => (actor.role === 'anaesthetist' && canCapture ? priceChangeRefusal(bookingApi.getState(), actor, procedure.id) : null),
    [actor, canCapture, procedure.id, procedures, bookings, lists, invoiceLines, masters],
  )
  const right = anaesthetistPriceRightFor({ masters }, procedure)
  // A prepaid Procedure reads "Prepaid amount" and is never the anaesthetist's to change (catch-up Phase 27; D30, US-03.1.8).
  const prepayment = useProcedurePrepayment(procedure.id)
  const prepaid = isStillPrepaid(prepayment)
  const editable = actor.role === 'anaesthetist' && canCapture && refusal === null && right.may && !prepaid
  const mode = right.may ? right.mode : undefined

  const typed = procedure.enteredPrice
  const [text, setText] = useState(typed !== undefined ? typed.toFixed(2) : '')
  useEffect(() => {
    setText(typed !== undefined ? typed.toFixed(2) : '')
  }, [procedure.id, typed])
  const parsed = parseAmount(text)
  const dirty = parsed !== undefined && parsed !== typed

  const price = fee.price
  const computed = price.status === 'priced' ? price.computed : undefined
  const computedTotal = price.status === 'priced' ? price.computedTotal : undefined
  const kind = contract?.pricing.kind ?? 'rvgAnaesthetistRate'
  const rvg = isRvgKind(kind)
  const noCharge = price.status === 'priced' && price.heldBy === 'typed' && price.price === 0

  const state: PriceCardState = !canCapture
    ? 'locked'
    : editable && noCharge
      ? 'no-charge'
      : editable && mode !== undefined
        ? mode
        : price.status === 'needsPrice'
          ? 'needs-price'
          : noCharge
            ? 'no-charge'
            : 'read-only'

  function save(next: number | null) {
    const outcome = setProcedurePrice(bookingApi, actor, procedure.id, next)
    if (!outcome.ok) onError(outcome.message)
  }

  const held = price.status === 'priced' ? price.heldBy : null
  const heldLabel = prepaid ? null : held === 'typed' ? 'Price typed' : held === 'authorised' ? 'Invoiced' : held === 'prepaid' ? 'Prepaid' : null
  const refusalText = (() => {
    if (actor.role !== 'anaesthetist' || !canCapture || editable || prepaid) return null
    // The edit window, a raised prepayment or another fallback: the store's own sentence.
    if (refusal !== null && !refusal.ok && refusal.code !== 'priceSetByContract' && refusal.code !== 'pricePrepaid') return refusal.message
    if (right.may || right.reason === 'office' || contract === undefined) return refusal !== null && !refusal.ok ? refusal.message : null
    return anaesthetistPriceCaption(contract.name, right.reason)
  })()

  return (
    <CaptureSection
      label="Price"
      dataShot="price-card"
      data={{ 'data-state': state }}
      gap={10}
      footer={
        <>
          {editable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={() => save(parsed ?? null)} disabled={!dirty} shot="price-card-save">
                {primaryLabel}
              </Button>
              {mode === 'override' && typed !== undefined && (
                <TextAction onClick={() => save(null)} shot="price-card-clear">
                  Use the computed price
                </TextAction>
              )}
            </div>
          )}
          {editable && noCharge && (
            <Caption color={neutral.slate}>
              {rvg ? 'The RVG detail stays recorded. This gives a no-charge invoice.' : 'This gives a no-charge invoice.'}
            </Caption>
          )}
          {refusalText !== null && <Caption color={neutral.slate}>{refusalText}</Caption>}
          <FailureNotes failures={failures} />
        </>
      }
    >
      <div data-shot="price-card-figures" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {computed !== undefined && rvg && computed.units !== undefined && computed.rate !== undefined && (
          <Figure>
            {computed.units} {computed.units === 1 ? 'unit' : 'units'} x {formatMoney(computed.rate)} = {formatMoney(computed.gross)}
          </Figure>
        )}
        {computed !== undefined && computed.discountPercent !== undefined && (
          <Figure>
            Discount {computed.discountPercent}% · minus {formatMoney(computed.discountAmount)}
          </Figure>
        )}
        {computed !== undefined && computed.kind === 'fixed' && <Figure>Fixed price {formatMoney(computed.gross)}</Figure>}
        {price.status === 'needsPrice' ? (
          <span style={{ alignSelf: 'flex-start' }}>
            <Pill tone="warning" shot="price-card-needs-price">
              {NEEDS_PRICE_LABEL}
            </Pill>
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 13, color: neutral.slate }}>{prepaid ? 'Prepaid amount' : 'Price'}</span>
              {heldLabel !== null && <Pill tone="neutral" size="sm">{heldLabel}</Pill>}
            </span>
            <span className="mono" data-shot="price-card-price" style={{ fontSize: 15, fontWeight: 700, color: neutral.ink }}>
              {formatMoney(price.price)}
            </span>
          </div>
        )}
        {held !== null && computedTotal !== undefined && (
          <div className="mono" style={{ fontSize: 12.5, color: neutral.mist, textAlign: 'right' }}>
            Computed {formatMoney(computedTotal)}
          </div>
        )}
      </div>
      {editable && (
        <TextField
          label="Price $"
          value={text}
          onChange={setText}
          mono
          inputMode="decimal"
          placeholder={computedTotal !== undefined ? computedTotal.toFixed(2) : '0.00'}
          invalid={text.trim() !== '' && parsed === undefined}
          shot="price-card-input"
        />
      )}
    </CaptureSection>
  )
}

/** One figure line: quiet mono, never the loudest thing on the card. */
function Figure({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono" style={{ fontSize: 13, color: neutral.slate }}>
      {children}
    </div>
  )
}
