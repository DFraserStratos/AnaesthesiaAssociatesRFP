import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { lockedAgainstContract, useAppStore } from '../../../store'
import { contractHistoryFor, replacesFor } from '../../../domain/billing/contractHistory'
import { plainDate, stampText } from '../../../domain/dateText'
import { HistoryTimeline } from '../../../shared/booking'
import { EmptyState } from '../../../shared/ui'
import { invoicePath } from '../screens/finances/financePaths'

/**
 * A Contract's History tab (catch-up Phase 25; US-04.1.3): every audited
 * change to it, newest first, with who, when and the values before and after
 * (the shared `HistoryTimeline`, as every History in the app), then the
 * Procedures locked against it at authorise (`lockedAgainstContract`, read
 * from `billing.locks`) with their Bookings and invoices. Nothing is deleted:
 * a Disabled Contract keeps every row. This is not a list of the Procedures a
 * change would affect (OQ-133).
 */
export function ContractHistory({ contractId }: { contractId: string }) {
  const audit = useAppStore((s) => s.audit)
  const billing = useAppStore((s) => s.billing)
  const lists = useAppStore((s) => s.schedule.lists)
  const contracts = useAppStore((s) => s.masters.contracts)
  const rows = useMemo(() => contractHistoryFor(audit, contractId), [audit, contractId])
  // A Contract that replaces this one shows its create here (build plan Phase 49): "Replaced by UNI-002 from 1 Jan 2027".
  const entityLabels = useMemo(() => {
    const out: Record<string, string> = {}
    for (const r of rows) {
      if (r.entityId === contractId) continue
      const replaced = replacesFor(audit, r.entityId)
      if (replaced !== null) out[r.entityId] = `Replaced by ${contracts[r.entityId]?.aaCode ?? r.entityId} from ${plainDate(replaced.fromISO)}`
    }
    return out
  }, [rows, audit, contractId, contracts])
  const locked = useMemo(() => lockedAgainstContract({ billing }, contractId), [billing, contractId])

  return (
    <div data-shot="contract-history" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {rows.length === 0 ? (
        <EmptyState title="No changes yet" shot="contract-history-empty">Every change to this Contract is kept here, with its values before and after.</EmptyState>
      ) : (
        <HistoryTimeline entries={rows} subject="contract" entityLabels={entityLabels} />
      )}

      <section data-shot="contract-locked-against" aria-label="Procedures locked against this Contract" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: neutral.ink }}>Procedures locked against this Contract</h3>
        <p style={{ margin: 0, fontSize: 12.5, color: neutral.slate }}>
          Locked when their List was authorised. Their invoices keep the price and settings they were raised with, whatever changes here.
        </p>
        {locked.length === 0 ? (
          <span style={{ fontSize: 13, color: neutral.mist }}>None yet.</span>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}>
            {locked.map((row, i) => {
              const dateISO = lists[row.listId]?.dateISO ?? ''
              return (
                <li
                  key={row.bookingId}
                  data-shot="contract-locked-row"
                  style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', padding: '8px 12px', borderTop: i === 0 ? 'none' : `1px solid ${neutral.line}`, fontSize: 13 }}
                >
                  <Lock size={11} strokeWidth={2.25} color={neutral.mist} aria-hidden style={{ alignSelf: 'center' }} />
                  <Link to={`/admin/day/${dateISO}/bookings/${row.bookingId}`} style={{ color: accent.base, fontWeight: 600 }}>
                    {row.patientName}
                  </Link>
                  <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{row.bookingId}</span>
                  <span style={{ fontSize: 12, color: neutral.slate }}>{row.origin === 'migrated' ? 'Migrated history' : `Locked ${stampText(row.takenAtISO)}`}</span>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10 }}>
                    {row.invoiceIds.map((id) => (
                      <Link key={id} to={invoicePath(id)} className="mono" style={{ color: accent.base, fontSize: 12 }}>
                        {billing.invoices[id]?.invoiceNumber ?? id}
                      </Link>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
