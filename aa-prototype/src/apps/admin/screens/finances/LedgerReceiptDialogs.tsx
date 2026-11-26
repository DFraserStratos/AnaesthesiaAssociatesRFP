/**
 * A receipt that matched no invoice, placed from the Ledger tab's "Receipts to place" (build plan
 * Phase 64; catch-up Phase 36, US-08.3.5): Allocate to an invoice whose balance covers it, or Mark
 * refunded with a note. Moved out of `LedgerScreen.tsx` unchanged.
 */

import { useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import type { Actor } from '../../../../store'
import { allocateUnmatchedReceipt, allocationRefusal, counterpartyName, markUnmatchedRefunded, receivableOutstanding, useAppStore } from '../../../../store'
import { isBookingPair } from '../../../../domain/billing/ledger'
import { OverlayHeader, SheetActions, useSurface } from '../../../../shared/surface'
import { Button, EmptyState, FormError, OptionRow, TextArea } from '../../../../shared/ui'
import { dateTimeMicroCap, drSurname, formatCurrency } from '../../../../shared/format'
import type { UnmatchedReceipt } from '../../../../domain/types'

export function AllocateDialog({ receipt, actor, onClose }: { receipt: UnmatchedReceipt | null; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => {
    if (receipt === null) return []
    const open = Object.values(billing.ledger).filter((p) => isBookingPair(p) && allocationRefusal({ billing }, receipt.id, p.id) === null)
    // The named anaesthetist's receivables first, when the receipt names one.
    return open
      .map((p) => {
        const pair = p as Extract<typeof p, { kind: 'procedure' | 'prePayment' }>
        return { pair, named: receipt.anaesthetistId !== undefined && pair.anaesthetistId === receipt.anaesthetistId }
      })
      .sort((a, b) => Number(b.named) - Number(a.named) || a.pair.receivable.number.localeCompare(b.pair.receivable.number))
  }, [billing, receipt])

  function allocate(pairId: string) {
    if (receipt === null) return
    const out = allocateUnmatchedReceipt(useAppStore, actor, receipt.id, pairId)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onClose()
  }

  return (
    <Overlay open={receipt !== null} onClose={onClose}>
      <div data-shot="ledger-allocate-dialog" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Allocate to invoice" description={receipt !== null ? `${formatCurrency(receipt.amount)} received ${dateTimeMicroCap(receipt.atISO)}, reference ${receipt.reference}. Choose the invoice it pays; only invoices whose balance covers it are listed.` : undefined} />
        {options.length === 0 ? (
          <EmptyState variant="inline">No open invoice has a balance that covers this receipt. Mark it refunded instead.</EmptyState>
        ) : (
          <div role="list" aria-label="Invoices this receipt can pay" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {options.map(({ pair, named }) => (
              <div key={pair.id} role="listitem">
                {/* The named anaesthetist's invoices come first, marked "Named" (the receipt's reference names them). */}
                <OptionRow
                  onClick={() => allocate(pair.id)}
                  data-allocate-pair={pair.id}
                  trailing={
                    <span className="mono">
                      {named && <span style={{ fontFamily: 'inherit', marginRight: 8 }}>Named</span>}
                      {formatCurrency(receivableOutstanding(pair))}
                    </span>
                  }
                >
                  <span className="mono">{pair.receivable.number}</span>
                  {' · '}
                  {billing.invoices[pair.invoiceId]?.billedTo?.name ?? (pair.receivable.counterparty.kind === 'anaesthetist' ? '' : counterpartyName({ masters }, pair.receivable.counterparty, pair.bookingId))}
                  {' · '}
                  <span style={{ color: neutral.slate }}>{pair.anaesthetistId !== undefined ? drSurname(masters.anaesthetists[pair.anaesthetistId]?.name ?? '') : 'AA Holding account'}</span>
                </OptionRow>
              </div>
            ))}
          </div>
        )}
        <FormError message={error} />
        <SheetActions primary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>} />
      </div>
    </Overlay>
  )
}

export function RefundDialog({ receipt, actor, onClose }: { receipt: UnmatchedReceipt | null; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function refund() {
    if (receipt === null) return
    const out = markUnmatchedRefunded(useAppStore, actor, receipt.id, note)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setNote('')
    setError(null)
    onClose()
  }

  return (
    <Overlay open={receipt !== null} onClose={onClose}>
      <div data-shot="ledger-refund-dialog" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Mark refunded" description={receipt !== null ? `${formatCurrency(receipt.amount)}, reference ${receipt.reference}. Say how the money went back.` : undefined} />
        <TextArea label="Note" value={note} onChange={setNote} />
        <FormError message={error} />
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
          primary={<Button variant="primary" size="desktop" block onClick={refund} shot="ledger-refund-confirm">Mark refunded</Button>}
        />
      </div>
    </Overlay>
  )
}
