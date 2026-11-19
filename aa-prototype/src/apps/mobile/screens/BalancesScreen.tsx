import { useMemo, useState } from 'react'
import { ChevronRight, CircleDollarSign } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { neutral, radius } from '../../../theme/tokens'
import { STATUS_PALETTE } from '../../../theme/statusColours'
import {
  anaesthetistLedgerPosition,
  gstReportFor,
  OUTSTANDING_STAGE_LABEL,
  outstandingPayableRowsFor,
  outstandingTotalFor,
  POSITION_LABEL,
  useAppStore,
  useToday,
  type PayableRow,
} from '../../../store'
import { formatCurrency, plural } from '../../../shared/format'
import { gstMonthLabel } from '../../../domain/billing/gstReport'
import { SlidingSegmentedControl } from '../../../shared/ui/SlidingSegmentedControl'
import { DockSpacer } from '../../../shared/ui/DockSpacer'
import { MobileHeader } from '../components'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Card } from '../../../shared/ui/Card'

type Section = 'outstanding' | 'gst'

/**
 * Balances tab (M11; US-12.2.1, US-12.2.2): the anaesthetist's money, from the
 * ledger (AA's system of record; never Xero, convention 9). Outstanding is a
 * FLAT list of the unpaid payables, oldest first, with no ageing or grouping
 * (catch-up Phase 38, D8): a row stays until AA pays you, and each card opens
 * its Booking. The header adds what was collected and paid out, and what you
 * owe AA (catch-up Phase 36), under the same labels as the web. "GST this
 * month" peeks at the current month's GST report on a cash basis (the payments
 * AA passed to you); past months, download, print and email are on the web.
 * An invoice shows the moment the office authorises its List (38a).
 */
export function BalancesScreen({
  initials,
  anaesthetistId,
  onOpenBooking,
}: {
  initials: string
  anaesthetistId: string
  onOpenBooking?: (listId: string, bookingId: string) => void
}) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const [section, setSection] = useState<Section>('outstanding')

  const outstanding = useMemo(
    () => outstandingPayableRowsFor({ billing, schedule, masters }, anaesthetistId),
    [billing, schedule, masters, anaesthetistId],
  )
  // Collected, paid out and what you owe AA, from the ledger's one position (catch-up Phase 36; US-08.3.5).
  const position = useMemo(() => anaesthetistLedgerPosition({ billing }, anaesthetistId), [billing, anaesthetistId])
  // The current month's GST report (the mobile peek; the web has the month picker and the actions).
  const monthISO = todayISO.slice(0, 7)
  const gst = useMemo(
    () => gstReportFor({ billing, masters }, anaesthetistId, monthISO, todayISO),
    [billing, masters, anaesthetistId, monthISO, todayISO],
  )

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        // Tab bar clearance is the `DockSpacer` at the tail, not padding here.
        padding: 'calc(var(--aa-inset-top, 54px) + 10px) 20px 0',
      }}
    >
      <MobileHeader eyebrow="Your account" title="Balances" initials={initials} />

      {/* Outstanding total */}
      <Card padding="panel" elevation="flat" style={{ marginTop: 20 }} shot="balances-total">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 44, height: 44, borderRadius: radius.pill, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.slate, flex: 'none' }}>
            <CircleDollarSign size={22} strokeWidth={2} aria-hidden />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: neutral.slate }}>Outstanding to you</span>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(outstandingTotalFor(outstanding))}</span>
            <span style={{ fontSize: 12, color: neutral.mist }}>{plural(outstanding.length, 'unpaid invoice')}</span>
            {/* Collected and paid out (catch-up Phase 36): each on its own line, never split inside a figure. */}
            <span data-shot="balances-collected-paid-out" className="mono" style={{ fontSize: 12, color: neutral.slate, marginTop: 4, display: 'flex', flexDirection: 'column' }}>
              <span style={{ whiteSpace: 'nowrap' }}>{POSITION_LABEL.collected} {formatCurrency(position.collected)}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{POSITION_LABEL.paidOut} {formatCurrency(position.paidOut)}</span>
            </span>
            {position.theyOweAa > 0 && (
              <span data-shot="balances-you-owe-aa" className="mono" style={{ fontSize: 12, color: neutral.slate }}>{POSITION_LABEL.theyOweAa} {formatCurrency(position.theyOweAa)}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Section toggle */}
      <SlidingSegmentedControl
        value={section}
        options={[
          { value: 'outstanding', label: 'Outstanding' },
          { value: 'gst', label: 'GST this month' },
        ]}
        onSelect={setSection}
        ariaLabel="Balance section"
        trackStyle={{ marginTop: 16 }}
      />

      {section === 'outstanding' ? (
        <div data-shot="balances-outstanding" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {outstanding.length === 0 ? (
            <EmptyState variant="card">Nothing outstanding. New invoices appear here as soon as the office authorises a List.</EmptyState>
          ) : (
            <>
              {outstanding.map((r) => (
                <OutstandingCard key={r.pairId} row={r} {...(onOpenBooking !== undefined ? { onOpen: () => onOpenBooking(r.listId, r.bookingId) } : {})} />
              ))}
              <div style={{ fontSize: 12, lineHeight: 1.5, color: neutral.mist, padding: '2px 4px' }}>
                A row stays until AA pays you. For a question about a line, contact the office.
              </div>
            </>
          )}
        </div>
      ) : (
        <div data-shot="balances-gst-month" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div data-shot="balances-gst-month-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: neutral.slate, padding: '0 4px' }}>
            <span>{gstMonthLabel(monthISO)} · paid to you</span>
            <span className="mono" style={{ fontWeight: 700, color: neutral.ink }}>{formatCurrency(gst.totals.paidToYou)}</span>
          </div>
          {gst.rows.length === 0 ? (
            <EmptyState variant="card">AA has not passed you any payments this month yet.</EmptyState>
          ) : (
            <>
              {gst.rows.map((r) => (
                <Card key={r.disbursementId} padding="card" elevation="flat" data-testid={`balances-gst-row-${r.invoiceNumber}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{formatCurrency(r.paidToYou)}</span>
                      <span style={{ fontSize: 12, color: neutral.slate }}>{format(parseISO(r.paidOnISO.slice(0, 10)), 'd MMM')} · {r.partyLabel}</span>
                    </span>
                    <span style={{ fontSize: 12, color: neutral.mist, textAlign: 'right' }}>GST<br /><span className="mono" style={{ color: neutral.slate }}>{formatCurrency(r.gst)}</span></span>
                  </div>
                </Card>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
                <span>GST total</span>
                <span className="mono">{formatCurrency(gst.totals.gst)}</span>
              </div>
            </>
          )}
          <div style={{ fontSize: 12, color: neutral.mist, padding: '0 4px' }}>Open the web app for past months, download, print or email.</div>
        </div>
      )}
      <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
    </div>
  )
}

/** One unpaid payable (catch-up Phase 38): the patient and what is still owed to you; tap to open its Booking. */
function OutstandingCard({ row, onOpen }: { row: PayableRow; onOpen?: () => void }) {
  const body = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{row.patientName}</span>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(row.outstandingToYou)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: neutral.slate }}>
          <span className="mono">{row.invoiceNumber}</span> · {row.counterpartyLabel} · Invoice date {format(parseISO(row.raisedAtISO.slice(0, 10)), 'd MMM')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          {row.accFunded && (
            <span style={{ fontSize: 10.5, fontWeight: 600, color: STATUS_PALETTE.preop.onTint, background: STATUS_PALETTE.preop.tint, borderRadius: radius.pill, padding: '2px 8px' }}>ACC</span>
          )}
          {onOpen !== undefined && <ChevronRight size={16} color={neutral.mist} aria-hidden />}
        </span>
      </div>
      {row.stage !== 'awaitingPayment' && (
        <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{OUTSTANDING_STAGE_LABEL[row.stage]}</span>
      )}
    </>
  )
  return (
    <Card padding="card" elevation="flat" flush data-testid={`balances-outstanding-${row.invoiceNumber}`} data-booking-id={row.bookingId}>
      {onOpen !== undefined ? (
        // The whole card is the target; its text is the button's name (amount, stage and party included).
        <button
          type="button"
          className="aa-ctl"
          onClick={onOpen}
          style={{ width: '100%', boxSizing: 'border-box', margin: 0, padding: '14px 16px', border: 'none', background: 'none', borderRadius: 'inherit', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {body}
        </button>
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>{body}</div>
      )}
    </Card>
  )
}
