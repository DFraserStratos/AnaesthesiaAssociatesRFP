/**
 * An authorised List's invoices, read only (catch-up Phase 38a; US-07.4.1,
 * US-03.1.6): number (mono), who it went to, when, the total and whether it is
 * paid. The anaesthetist's "what was invoiced" for a List found by search or by
 * date; backdrop invoices included (`invoicesForListView`). Both List detail
 * screens host it in their own chrome.
 */

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral, semantic } from '../../theme/tokens'
import { invoicesForListView, useAppStore, type ListInvoiceRow } from '../../store'
import { formatCurrency } from '../format'
import { EmptyState } from '../ui/EmptyState'

const PAID_LABEL: Record<ListInvoiceRow['paid'], string> = { paid: 'Paid', partPaid: 'Part paid', outstanding: 'Outstanding' }

export function useListInvoices(listId: string): ListInvoiceRow[] {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  return useMemo(() => invoicesForListView({ schedule, billing, masters }, listId), [schedule, billing, masters, listId])
}

export function ListInvoices({ rows }: { rows: readonly ListInvoiceRow[] }) {
  if (rows.length === 0) return <EmptyState>No invoices were raised for this List.</EmptyState>
  return (
    <ul data-shot="list-invoices" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {rows.map((r, i) => (
        <li
          key={r.invoiceId}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}` }}
        >
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{r.invoiceNumber}</span>
            <span style={{ fontSize: 12, color: neutral.slate }}>
              {r.party}
              {r.issuedISO !== undefined && <> · <span className="mono">{format(parseISO(r.issuedISO), 'd MMM yyyy')}</span></>}
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flex: 'none' }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{formatCurrency(r.total)}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: r.paid === 'paid' ? semantic.success.onTint : r.paid === 'partPaid' ? semantic.warning.onTint : neutral.slate }}>
              {PAID_LABEL[r.paid]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
