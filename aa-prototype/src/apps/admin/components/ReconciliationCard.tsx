import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reconciliationStatusOf, useAppStore } from '../../../store'
import type { ReconciliationStatus, UnresolvedItemSource } from '../../../domain/billing/reconciliation'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { Card, Notice, TextAction } from '../../../shared/ui'
import { formatMoney, plural } from '../../../shared/format'
import { financePath } from '../screens/finances/financePaths'

const VISIBLE_ITEMS = 5

/** Where each kind of unresolved item is handled. */
const HANDLED_AT: Record<UnresolvedItemSource, { to: string; label: string }> = {
  unmatchedReceipt: { to: financePath('ledger'), label: 'Ledger · unmatched receipts' },
  xeroQueue: { to: financePath('xero'), label: 'Xero · sync queue' },
  xeroDivergence: { to: financePath('xero'), label: 'Xero · changed directly in Xero' },
  bankLine: { to: '/demo/xero/bank', label: 'Xero · bank reconciliation' },
}

/**
 * "Reconciliation" (catch-up Phase 37; US-13.2.4, DM-67): one status saying
 * whether the books are square, derived on every render from the ledger and
 * the Xero mirror and never stored. Out of balance, it names each failing
 * check with its difference, then the unresolved items oldest first with
 * their amount and age on the demo clock, each linking to where it is handled.
 * The story is Proposed, so a small caption says so; the checks it runs are
 * our reading until the posting design settles them.
 */
export function ReconciliationCard() {
  const status = useReconciliationStatus()
  const square = status.status === 'square'
  return (
    <Card shot="dashboard-reconciliation" headingId="admin-reconciliation-heading" title="Reconciliation" data-status={status.status}>
      <Notice tone={square ? 'success' : 'warning'} live="status" shot="dashboard-reconciliation-status">
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
          <span style={{ fontWeight: 700 }}>{square ? 'Books square' : 'Out of balance'}</span>
          {!square && <span>{plural(status.items.length, 'item')} to resolve</span>}
        </span>
      </Notice>
      <ReconciliationDetail status={status} />
    </Card>
  )
}

/** The reconciliation status, derived on every render from the ledger and the Xero mirror (never stored). */
export function useReconciliationStatus(): ReconciliationStatus {
  const billing = useAppStore((s) => s.billing)
  const xero = useAppStore((s) => s.xero)
  const clock = useAppStore((s) => s.clock)
  return useMemo(() => reconciliationStatusOf({ billing, xero, clock }), [billing, xero, clock])
}

/**
 * What sits under the status: square, one plain line; out of balance, each failing check with its
 * difference, then the unresolved items oldest first, each linking to where it is handled. Then the
 * Proposed caption. The card above and the rail's Books square tile both show it.
 */
export function ReconciliationDetail({ status }: { status: ReconciliationStatus }) {
  const [showAll, setShowAll] = useState(false)
  const square = status.status === 'square'
  const items = showAll ? status.items : status.items.slice(0, VISIBLE_ITEMS)
  return (
    <>
      {square ? (
        <div style={{ fontSize: 12.5, color: neutral.slate }}>The ledger, its Xero mirror and Xero's bank lines all agree.</div>
      ) : (
        <>
          <ul aria-label="Checks out of balance" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {status.failing.map((c) => (
              <li key={c.id} data-check-id={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                <span style={{ color: neutral.ink, fontWeight: 600 }}>{c.label}</span>
                <span className="mono" style={{ color: semantic.warning.onTint }}>{`off by ${formatMoney(Math.abs(c.difference))}`}</span>
              </li>
            ))}
          </ul>
          {status.items.length > 0 && (
            <ul aria-label="Unresolved items, oldest first" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((item) => {
                const at = HANDLED_AT[item.source]
                return (
                  <li key={item.id}>
                    <Link
                      to={at.to}
                      className="aa-ctl"
                      data-shot="reconciliation-item"
                      data-item-id={item.id}
                      data-source={item.source}
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '7px 10px', borderRadius: radius.ctl, background: neutral.bg, textDecoration: 'none', color: neutral.ink }}
                    >
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</span>
                        <span className="mono" style={{ fontSize: 12.5 }}>{formatMoney(item.amount)}</span>
                      </span>
                      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: neutral.slate }}>
                        <span>{at.label}</span>
                        <span className="mono">{plural(item.ageDays, 'day')}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {status.items.length > VISIBLE_ITEMS && (
            <TextAction size="sm" flush ariaExpanded={showAll} onClick={() => setShowAll(!showAll)} style={{ alignSelf: 'flex-start' }}>
              {showAll ? 'Show fewer' : `View all (${status.items.length})`}
            </TextAction>
          )}
        </>
      )}
      <div data-shot="dashboard-reconciliation-proposed" style={{ fontSize: 11, color: neutral.mist }}>
        Proposed · checks the ledger, the ledger against Xero, and Xero's bank lines.
      </div>
    </>
  )
}
