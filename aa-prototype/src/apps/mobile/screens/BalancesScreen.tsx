import { useMemo, useState } from 'react'
import { CircleDollarSign } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { neutral, semantic } from '../../../theme/tokens'
import { statusColours } from '../../../theme/statusColours'
import {
  gstActivityFor,
  outstandingAccpayInvoicesFor,
  receivablesAgingFor,
  useAppStore,
  useToday,
} from '../../../store'
import { formatCurrency } from '../../../shared/format'
import { MobileHeader } from '../components'

type Section = 'outstanding' | 'gst'

/**
 * Balances tab (M11) — the anaesthetist's money, from the Billing Engine MIRROR
 * (never Xero; convention 9). Outstanding is a FLAT list of individual ACCPAY
 * invoices, no rollup (RFP); a fully-mobile card list, not a table. A GST peek
 * lists the amounts received this month with their GST component. Balances
 * appear the day AFTER billing (the RFP's next-day handover).
 */
export function BalancesScreen({ initials, anaesthetistId }: { initials: string; anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const [section, setSection] = useState<Section>('outstanding')

  const outstanding = useMemo(
    () => outstandingAccpayInvoicesFor({ billing, schedule, masters }, anaesthetistId, todayISO),
    [billing, schedule, masters, anaesthetistId, todayISO],
  )
  const aging = useMemo(
    () => receivablesAgingFor({ billing, schedule, masters }, anaesthetistId, todayISO).aging,
    [billing, schedule, masters, anaesthetistId, todayISO],
  )
  // GST this calendar month (the mobile peek; the web Accounts screen has the period selector).
  const monthStart = `${todayISO.slice(0, 7)}-01`
  const gst = useMemo(
    () => gstActivityFor({ billing, masters }, anaesthetistId, monthStart, todayISO),
    [billing, masters, anaesthetistId, monthStart, todayISO],
  )

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '64px 20px 116px' }}>
      <MobileHeader eyebrow="Your account" title="Balances" initials={initials} />

      {/* Outstanding total */}
      <div style={{ marginTop: 20, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: 999, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.slate, flex: 'none' }}>
          <CircleDollarSign size={22} strokeWidth={2} aria-hidden />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12, color: neutral.slate }}>Outstanding to you</span>
          <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(aging.total)}</span>
          <span style={{ fontSize: 12, color: neutral.mist }}>{outstanding.length} unpaid invoice{outstanding.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {(['outstanding', 'gst'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: section === s ? neutral.ink : neutral.sunken, color: section === s ? neutral.surface : neutral.slate }}
          >
            {s === 'outstanding' ? 'Outstanding' : 'GST this month'}
          </button>
        ))}
      </div>

      {section === 'outstanding' ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {outstanding.length === 0 ? (
            <EmptyCard>No outstanding invoices. Balances appear the day after billing.</EmptyCard>
          ) : (
            outstanding.map((r) => (
              <div key={r.caseId} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{r.patientName}</span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(r.outstanding)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: neutral.slate }}>
                    <span className="mono">{r.invoiceNumber}</span> · {r.counterpartyLabel}
                  </span>
                  <AgeChip days={r.agingDays} accRelated={r.accRelated} />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: neutral.slate, padding: '0 4px' }}>
            <span>{format(parseISO(monthStart), 'MMMM yyyy')} received</span>
            <span className="mono" style={{ fontWeight: 700, color: neutral.ink }}>{formatCurrency(gst.totalGross)}</span>
          </div>
          {gst.rows.length === 0 ? (
            <EmptyCard>No payments received this month yet.</EmptyCard>
          ) : (
            <>
              {gst.rows.map((r) => (
                <div key={r.receiptId} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 16, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{formatCurrency(r.grossAmount)}</span>
                    <span style={{ fontSize: 12, color: neutral.slate }}>{format(parseISO(r.atISO.slice(0, 10)), 'd MMM')} · {r.payerLabel}</span>
                  </span>
                  <span style={{ fontSize: 12, color: neutral.mist, textAlign: 'right' }}>GST<br /><span className="mono" style={{ color: neutral.slate }}>{formatCurrency(r.gstAmount)}</span></span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 13, fontWeight: 700 }}>
                <span>GST component</span>
                <span className="mono">{formatCurrency(gst.totalGst)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AgeChip({ days, accRelated }: { days: number; accRelated: boolean }) {
  const overdue = days > 60
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      {accRelated && (
        <span style={{ fontSize: 10.5, fontWeight: 600, color: statusColours.preop.onTint, background: statusColours.preop.tint, borderRadius: 999, padding: '2px 8px' }}>ACC</span>
      )}
      <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 9px', background: overdue ? semantic.warning.tint : neutral.sunken, color: overdue ? semantic.warning.onTint : neutral.slate }}>
        {days}d
      </span>
    </span>
  )
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 16, padding: '20px', textAlign: 'center', fontSize: 13.5, color: neutral.mist }}>
      {children}
    </div>
  )
}
