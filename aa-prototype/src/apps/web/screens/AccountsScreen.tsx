import { useMemo, useState } from 'react'
import { format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { type AgingBucketKey } from '../../../domain/seed'
import {
  gstActivityFor,
  receivablesAgingFor,
  useAppStore,
  useToday,
  type AccpayInvoiceRow,
} from '../../../store'
import { Segmented } from '../../../shared'
import { formatCurrency } from '../../../shared/format'
import { Panel } from '../components'

export type AccountsSubTab = 'overdue' | 'gst'

interface AccountsScreenProps {
  anaesthetistId: string
  subTab: AccountsSubTab
  onSubTab: (tab: AccountsSubTab) => void
}

const AGING_COLS: { key: AgingBucketKey; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'd31_60', label: '31 to 60' },
  { key: 'd61_90', label: '61 to 90' },
  { key: 'd90plus', label: '90 +' },
]

type GstPeriod = 'monthly' | 'biMonthly' | 'sixMonthly'

/**
 * The Accounts area (W4 + M11 GST report). Sub-nav: Overdue (a flat
 * accounts-outstanding table, ordered by date, NO rollup, one row per ACCPAY
 * invoice) and GST activity (a date-ranged transaction list of amounts received
 * with their GST component). BOTH now derive from the billing MIRROR (Phase 10;
 * convention 9 — never `state.xero`): outstanding ACCPAY invoices and the
 * receipts ledger.
 */
export function AccountsScreen({ anaesthetistId, subTab, onSubTab }: AccountsScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>Accounts</h1>
        <div style={{ fontSize: 14, color: neutral.slate, marginTop: 4 }}>Outstanding accounts and your GST activity.</div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}` }}>
        <SubTabButton active={subTab === 'overdue'} onClick={() => onSubTab('overdue')}>Overdue</SubTabButton>
        <SubTabButton active={subTab === 'gst'} onClick={() => onSubTab('gst')}>GST activity</SubTabButton>
      </div>

      {subTab === 'overdue' ? <OverdueTable anaesthetistId={anaesthetistId} /> : <GstReport anaesthetistId={anaesthetistId} />}
    </div>
  )
}

function OverdueTable({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()

  const { rows, aging } = useMemo(
    () => receivablesAgingFor({ billing, schedule, masters }, anaesthetistId, todayISO),
    [billing, schedule, masters, anaesthetistId, todayISO],
  )

  if (rows.length === 0) {
    return (
      <Panel>
        <div style={{ fontSize: 14, color: neutral.mist, padding: '8px 0' }}>
          No outstanding accounts. Unpaid ACCPAY invoices appear here the day after they are billed.
        </div>
      </Panel>
    )
  }

  return (
    <Panel flush>
      <div style={{ padding: '16px 20px 0', fontSize: 12, color: neutral.mist }}>
        One row per outstanding ACCPAY invoice, ordered by date raised. No rollup (per the RFP).
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
              <Th>Invoice</Th>
              <Th>Patient</Th>
              <Th>Payer</Th>
              <Th>Raised</Th>
              {AGING_COLS.map((c) => (
                <Th key={c.key} right>{c.label}</Th>
              ))}
              <Th center>ACC</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: AccpayInvoiceRow) => (
              <tr key={r.caseId} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                <Td mono>{r.invoiceNumber}</Td>
                <Td>{r.patientName}</Td>
                <Td>{r.counterpartyLabel}</Td>
                <Td mono>{format(parseISO(r.raisedAtISO.slice(0, 10)), 'd MMM yyyy')}</Td>
                {AGING_COLS.map((c) => (
                  <Td key={c.key} mono right>
                    {r.bucket === c.key ? formatCurrency(r.outstanding) : '·'}
                  </Td>
                ))}
                <Td center>{r.accRelated ? <span style={{ fontSize: 11, fontWeight: 600, color: neutral.slate }}>ACC</span> : '·'}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${neutral.line}` }}>
              <Td>Totals</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              {AGING_COLS.map((c) => (
                <Td key={c.key} mono right bold>
                  {formatCurrency(aging[c.key])}
                </Td>
              ))}
              <Td center>{''}</Td>
            </tr>
            <tr>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td right>Outstanding</Td>
              <Td mono right bold>{''}</Td>
              <Td mono right bold>{''}</Td>
              <Td mono right bold>{''}</Td>
              <Td mono right bold>{formatCurrency(aging.total)}</Td>
              <Td center>{''}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  )
}

/** The GST period window ending at today (rolling N calendar months). */
function periodWindow(period: GstPeriod, todayISO: string): { fromISO: string; toISO: string } {
  const months = period === 'monthly' ? 1 : period === 'biMonthly' ? 2 : 6
  const today = parseISO(todayISO)
  return { fromISO: format(startOfMonth(subMonths(today, months - 1)), 'yyyy-MM-dd'), toISO: format(today, 'yyyy-MM-dd') }
}

function GstReport({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const defaultPeriod = (masters.anaesthetists[anaesthetistId]?.gstPeriod ?? 'monthly') as GstPeriod
  const [period, setPeriod] = useState<GstPeriod>(defaultPeriod)

  const { fromISO, toISO } = periodWindow(period, todayISO)
  const activity = useMemo(
    () => gstActivityFor({ billing, masters }, anaesthetistId, fromISO, toISO),
    [billing, masters, anaesthetistId, fromISO, toISO],
  )

  const periodLabel: Record<GstPeriod, string> = { monthly: 'Monthly', biMonthly: 'Bi-monthly', sixMonthly: 'Six-monthly' }

  return (
    <Panel
      title="GST activity"
      action={
        <div style={{ width: 320 }}>
          <Segmented<GstPeriod>
            value={period}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'biMonthly', label: 'Bi-monthly' },
              { value: 'sixMonthly', label: 'Six-monthly' },
            ]}
            onChange={setPeriod}
          />
        </div>
      }
    >
      <div style={{ fontSize: 12, color: neutral.mist }}>
        {periodLabel[period]} period ({format(parseISO(fromISO), 'd MMM')} to {format(parseISO(toISO), 'd MMM yyyy')}) · one row per amount
        received, each with its GST component; period totals below.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
              <Th>Date received</Th>
              <Th>Invoice</Th>
              <Th>Payer</Th>
              <Th right>Amount received</Th>
              <Th right>GST component</Th>
            </tr>
          </thead>
          <tbody>
            {activity.rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '28px 20px', textAlign: 'center', color: neutral.mist }}>
                  No payments received in this period.
                </td>
              </tr>
            ) : (
              activity.rows.map((r) => (
                <tr key={r.receiptId} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                  <Td mono>{format(parseISO(r.atISO.slice(0, 10)), 'd MMM yyyy')}</Td>
                  <Td mono>{r.invoiceNumber}</Td>
                  <Td>{r.payerLabel}</Td>
                  <Td mono right>{formatCurrency(r.grossAmount)}</Td>
                  <Td mono right>{formatCurrency(r.gstAmount)}</Td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${neutral.line}` }}>
              <Td bold>Period total</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td mono right bold>{formatCurrency(activity.totalGross)}</Td>
              <Td mono right bold>{formatCurrency(activity.totalGst)}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  )
}

function SubTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        background: 'none',
        padding: '10px 14px',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? neutral.ink : neutral.slate,
        boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th style={{ textAlign: right === true ? 'right' : center === true ? 'center' : 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children, mono, right, center, bold }: { children: React.ReactNode; mono?: boolean; right?: boolean; center?: boolean; bold?: boolean }) {
  return (
    <td
      className={mono === true ? 'mono' : undefined}
      style={{ padding: '11px 16px', color: neutral.ink, textAlign: right === true ? 'right' : center === true ? 'center' : 'left', fontWeight: bold === true ? 700 : 400, whiteSpace: 'nowrap' }}
    >
      {children}
    </td>
  )
}
