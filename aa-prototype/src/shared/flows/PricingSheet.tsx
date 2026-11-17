import { useEffect, useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { parseAmount } from '../../domain/billing/money'
import { priceChangeRefusal, setProcedurePrice, useAppStore, type Actor } from '../../store'
import { procedurePriceViewFor } from '../../store/priceSelectors'
import { Button, FormError, Notice, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { formatMoney } from '../format'

interface PricingSheetProps {
  open: boolean
  procedureId: string
  actor: Actor
  onClose: () => void
}

/**
 * The office's Change price (catch-up Phase 24; US-05.4.2, FT-05.4): one
 * "Price $" field beside the computed price, on any Contract, no reason asked.
 * Saving types the price (`setProcedurePrice`, audited, the last change
 * standing); "Use the computed price" clears it so the price follows its
 * Contract again. A prepaid price whose prepayment invoice is raised is
 * read-only with the gate's sentence (A16). A dialog on Admin and web.
 */
export function PricingSheet({ open, procedureId, actor, onClose }: PricingSheetProps) {
  const { Overlay } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const procedures = useAppStore((s) => s.schedule.procedures)
  const billingLines = useAppStore((s) => s.schedule.billingLines)
  const invoices = useAppStore((s) => s.billing.invoices)
  const invoiceLines = useAppStore((s) => s.billing.invoiceLines)
  const view = useMemo(
    () => procedurePriceViewFor({ masters, schedule: { lists, bookings, procedures, billingLines }, billing: { invoices, invoiceLines } }, procedureId),
    [masters, lists, bookings, procedures, billingLines, invoices, invoiceLines, procedureId],
  )
  // Re-read whenever what the gates read changes (the List's state, the Contract, the invoices).
  const refusal = useMemo(
    () => (open ? priceChangeRefusal(useAppStore.getState(), actor, procedureId) : null),
    [open, actor, procedureId, procedures, lists, masters, invoices, invoiceLines],
  )
  const typed = view?.procedure.enteredPrice
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setText(typed !== undefined ? typed.toFixed(2) : '')
      setError(null)
    }
    // Only when the dialog opens: typing must not be reset by a store change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (view === undefined) return null
  const parsed = parseAmount(text)
  const refusalMessage = refusal !== null && !refusal.ok ? refusal.message : null
  const readOnly = refusalMessage !== null

  function save(price: number | null) {
    const outcome = setProcedurePrice(useAppStore, actor, procedureId, price)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const computedText = view.computed !== undefined ? formatMoney(view.computed) : 'None'
  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="pricing-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <OverlayHeader title="Change price" description={view.contract !== undefined ? view.contract.name : 'No Contract yet'} />
        <div data-shot="pricing-sheet-computed" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13.5, color: neutral.slate }}>Computed from the Contract</span>
          <span className="mono" style={{ fontSize: 15, color: neutral.ink }}>{computedText}</span>
        </div>
        {readOnly ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: neutral.slate }}>Price</span>
              <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>
                {view.price.status === 'priced' ? formatMoney(view.price.price) : 'Needs a price'}
              </span>
            </div>
            <Notice tone="warning" shot="pricing-sheet-refusal">{refusalMessage}</Notice>
          </>
        ) : (
          <>
            <TextField
              label="Price $"
              value={text}
              onChange={setText}
              mono
              inputMode="decimal"
              placeholder={view.computed !== undefined ? view.computed.toFixed(2) : '0.00'}
              invalid={text.trim() !== '' && parsed === undefined}
              hint="No reason needed. Every change shows in History."
              shot="pricing-sheet-price"
            />
            <FormError message={error} />
          </>
        )}
        {!readOnly && (
          <SheetActions
            primary={
              <Button variant="primary" block onClick={() => save(parsed ?? null)} disabled={parsed === undefined} shot="pricing-sheet-save">
                Save price
              </Button>
            }
            secondary={
              // Only where the Contract works out a price: clearing an open price's amount would leave it with none.
              typed !== undefined && view.computed !== undefined ? (
                <Button variant="secondary" block onClick={() => save(null)} shot="pricing-sheet-clear">
                  Use the computed price
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </Overlay>
  )
}
