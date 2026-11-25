/**
 * The Ledger tab's right column (build plan Phase 64; US-13.2.1, US-08.3.4, US-08.3.5): "The books"
 * (whether the ledger is square, said in one sentence, with the failed checks behind "See the
 * checks", and four figures two by two) and "Receipts to place" (each receipt that matched no
 * invoice, with Allocate and Mark refunded). docs/explorations/finances-section.html `#p-ledger`'s
 * `.rail`. The parent puts it in `PageBody rail`; every figure comes in as a prop.
 */

import { useMemo, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { neutral, space } from '../../../../theme/tokens'
import type { Actor } from '../../../../store'
import { unmatchedReceiptRows, useAppStore } from '../../../../store'
import { isBookingPair, type LedgerCheck } from '../../../../domain/billing/ledger'
import type { UnmatchedReceipt } from '../../../../domain/types'
import { Card, Notice, RailSection, StatTile, TextAction } from '../../../../shared/ui'
import { drSurname, formatCurrency, plural, receivedDay } from '../../../../shared/format'
import { anaesthetistAccountPath, financePath, invoicePath } from './financePaths'
import { AllocateDialog, RefundDialog } from './LedgerReceiptDialogs'

export interface LedgerSentenceView {
  tone: 'success' | 'warning' | 'error'
  title: string
  detail: readonly string[]
}

export interface LedgerFigures {
  /** Receivables outstanding. */
  owedToAa: number
  /** Payables due now. */
  owedToAnaesthetists: number
  /** The AA Holding account's balance. */
  holding: number
  /** The prepaid Bookings the Holding account covers. */
  holdingBookings: number
  receiptsToPlaceTotal: number
  receiptsToPlaceCount: number
}

const CHECK_TEXT: Record<LedgerCheck['code'], string> = {
  unmatchedReceiptHeld: 'Receipt with no matching invoice',
  pairAmountMismatch: 'Payable differs from its invoice',
  transferMismatch: 'Transfer out differs from what was held',
  releasedNotReceived: 'Released differs from what was received',
  disbursedAboveReleased: 'Paid out above what was released',
  receivedAboveAmount: 'Received above the invoice total',
}

/**
 * The narrowest a figure tile gets: the widest figure ($662,062.67, 11 characters of the 22px mono at
 * 0.6em) is 146px, plus the tile's 16px padding and 1px border each side. Two tiles sit side by side
 * when the rail is wide enough for two of these (its full width); on a narrower rail they stack.
 */
const TILE_MIN_WIDTH = 180

export function LedgerRail({
  actor,
  sentence,
  inBalance,
  checks,
  figures,
  receipts,
}: {
  actor: Actor
  sentence: LedgerSentenceView
  inBalance: boolean
  checks: readonly LedgerCheck[]
  figures: LedgerFigures
  receipts: readonly UnmatchedReceipt[]
}) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const allReceipts = useMemo(() => unmatchedReceiptRows({ billing }), [billing])
  // The checks show from the start while the books are out; "See the checks" toggles them either way.
  // Null follows the books (open while out, so an injected receipt shows its check at once) until the presenter toggles.
  const [chosen, setShowChecks] = useState<boolean | null>(null)
  const showChecks = chosen ?? !inBalance
  const [allocating, setAllocating] = useState<UnmatchedReceipt | null>(null)
  const [refunding, setRefunding] = useState<UnmatchedReceipt | null>(null)

  const describe = (c: LedgerCheck): { text: string; to?: string } => {
    if (c.code === 'unmatchedReceiptHeld') {
      const u = allReceipts.find((x) => x.id === c.targetId)
      return { text: `${CHECK_TEXT[c.code]}: ${u?.reference ?? c.targetId}, ${formatCurrency(c.amount)}` }
    }
    const pair = billing.ledger[c.targetId]
    const invoiceId = pair !== undefined && isBookingPair(pair) ? pair.invoiceId : undefined
    return { text: `${CHECK_TEXT[c.code]}: ${pair?.receivable.number ?? c.targetId}, ${formatCurrency(c.amount)}`, ...(invoiceId !== undefined ? { to: invoicePath(invoiceId) } : {}) }
  }

  const nameOf = (id: string | undefined): string => (id === undefined ? 'No anaesthetist named' : drSurname(masters.anaesthetists[id]?.name ?? id))

  return (
    <>
      <Card
        title="The books"
        shot="ledger-books"
        action={
          <TextAction size="sm" flush ariaExpanded={showChecks} onClick={() => setShowChecks(!showChecks)} shot="ledger-see-checks">
            {showChecks ? 'Hide the checks' : 'See the checks'}
          </TextAction>
        }
      >
        <Notice
          tone={sentence.tone}
          title={sentence.title}
          {...(sentence.tone === 'success' ? { icon: <CircleCheck size={16} aria-hidden /> } : {})}
          live="status"
          shot="ledger-balance"
          data-in-balance={inBalance ? 'true' : 'false'}
        >
          {sentence.detail.length > 0 && <span>{sentence.detail.join(' ')}</span>}
        </Notice>
        {showChecks &&
          (checks.length === 0 ? (
            <span data-shot="ledger-checks" style={{ fontSize: 12.5, color: neutral.slate }}>Every check passes.</span>
          ) : (
            <ul data-shot="ledger-checks" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12.5, color: neutral.ink }}>
              {checks.map((c) => {
                const d = describe(c)
                return (
                  <li key={`${c.code}-${c.targetId}`} data-check={c.code}>
                    {d.to !== undefined ? <TextAction size="sm" flush inline to={d.to}>{d.text}</TextAction> : d.text}
                  </li>
                )
              })}
            </ul>
          ))}
        <div data-shot="ledger-tiles" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${TILE_MIN_WIDTH}px, 1fr))`, gap: 10 }}>
          <StatTile variant="outlined" label="Owed to AA" value={formatCurrency(figures.owedToAa)} sub="Unpaid invoices" data-ledger-tile="owed-to-aa" />
          <StatTile variant="outlined" label="Owed to anaesthetists" value={formatCurrency(figures.owedToAnaesthetists)} sub="Due in the next payment run" data-ledger-tile="owed-to-anaesthetists" />
          <StatTile variant="outlined" label="AA Holding account" value={formatCurrency(figures.holding)} sub={plural(figures.holdingBookings, 'prepaid Booking')} data-ledger-tile="holding" />
          <StatTile
            variant="outlined"
            label="Receipts to place"
            value={formatCurrency(figures.receiptsToPlaceTotal)}
            sub={plural(figures.receiptsToPlaceCount, 'receipt')}
            {...(figures.receiptsToPlaceCount > 0 ? { tone: 'warning' as const } : {})}
            data-ledger-tile="receipts-to-place"
          />
        </div>
      </Card>

      <RailSection
        title="Receipts to place"
        shot="ledger-unmatched"
        empty="Nothing to place"
        countNoun="receipts to place"
        rows={receipts.map((u) => ({
          key: u.id,
          title: `${u.reference} · ${formatCurrency(u.amount)}`,
          to: u.anaesthetistId !== undefined ? anaesthetistAccountPath(u.anaesthetistId) : financePath('ledger', { list: 'pairs' }),
          data: { 'data-unmatched-id': u.id },
          sub: (
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>{`Received ${receivedDay(u.atISO)} · ${nameOf(u.anaesthetistId)}`}</span>
              <span style={{ display: 'flex', gap: space[3] }}>
                <TextAction size="sm" flush onClick={() => setAllocating(u)} shot="ledger-allocate">Allocate</TextAction>
                <TextAction size="sm" flush onClick={() => setRefunding(u)} shot="ledger-refund">Mark refunded</TextAction>
              </span>
            </span>
          ),
        }))}
      />

      <AllocateDialog key={`allocate-${allocating?.id ?? 'none'}`} receipt={allocating} actor={actor} onClose={() => setAllocating(null)} />
      <RefundDialog key={`refund-${refunding?.id ?? 'none'}`} receipt={refunding} actor={actor} onClose={() => setRefunding(null)} />
    </>
  )
}
