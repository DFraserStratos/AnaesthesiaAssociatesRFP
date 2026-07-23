import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { type AgingBucketKey, type DerivedOutstanding } from '../../../domain/seed'
import { useAppStore } from '../../../store'
import { Segmented } from '../../../shared'
import { formatCurrency } from '../../../shared/format'
import { Panel } from '../components'
import { useDashboardFigures } from '../useDashboardFigures'

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
 * accounts-outstanding table, ordered by date, NO rollup, per Appendix 5) and
 * GST activity (a date-ranged transaction list of amounts received with their
 * GST component). Overdue reads the seeded outstanding accounts (Phase 10
 * replaces with billing-mirror derivation); GST is honest-empty with a working
 * period selector until Phase 10's payment simulation produces received money.
 *
 * Phase 08 note: `state.billing` now holds real invoices once a list is
 * billed, but these views stay seeded/honest-empty deliberately — the RFP's
 * balance view is one flat row per ACCPAY invoice, which exists only after
 * Phase 10's Xero handoff ("awaiting Xero sync"). The Phase 08 view effect
 * here is the billed list DISAPPEARING from Lists/Dashboard (isListBilled).
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

      {subTab === 'overdue' ? <OverdueTable anaesthetistId={anaesthetistId} /> : <GstReport />}
    </div>
  )
}

function OverdueTable({ anaesthetistId }: { anaesthetistId: string }) {
  const patients = useAppStore((s) => s.masters.patients)
  const contracts = useAppStore((s) => s.masters.contracts)
  const surgeons = useAppStore((s) => s.masters.surgeons)

  const figures = useDashboardFigures(anaesthetistId)

  if (figures === undefined || figures.outstanding.length === 0) {
    return (
      <Panel>
        <div style={{ fontSize: 14, color: neutral.mist, padding: '8px 0' }}>
          No outstanding accounts. Balances appear here once billing runs (Phase 10).
        </div>
      </Panel>
    )
  }

  const rows = figures.outstanding
  return (
    <Panel flush>
      <div style={{ padding: '16px 20px 0', fontSize: 12, color: neutral.mist }}>
        One row per outstanding account, ordered by first-account date. No rollup (per the RFP).
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
              <Th>Patient</Th>
              <Th>Contract</Th>
              <Th>Surgeon</Th>
              <Th>First account</Th>
              {AGING_COLS.map((c) => (
                <Th key={c.key} right>{c.label}</Th>
              ))}
              <Th center>ACC</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: DerivedOutstanding) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                <Td>{patients[r.patientId]?.name ?? r.patientId}</Td>
                <Td>{contracts[r.contractId]?.name ?? r.contractId}</Td>
                <Td>{surgeons[r.surgeonId]?.name ?? r.surgeonId}</Td>
                <Td mono>{format(parseISO(r.firstAccountDateISO), 'd MMM yyyy')}</Td>
                {AGING_COLS.map((c) => (
                  <Td key={c.key} mono right>
                    {r.bucket === c.key ? formatCurrency(r.amount) : '·'}
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
              <Td right>{''}</Td>
              {AGING_COLS.map((c) => (
                <Td key={c.key} mono right bold>
                  {formatCurrency(figures.aging[c.key])}
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
              <Td mono right bold>{formatCurrency(figures.aging.total)}</Td>
              <Td center>{''}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  )
}

function GstReport() {
  const [period, setPeriod] = useState<GstPeriod>('monthly')
  const periodLabel: Record<GstPeriod, string> = {
    monthly: 'Monthly',
    biMonthly: 'Bi-monthly',
    sixMonthly: 'Six-monthly',
  }
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
        {periodLabel[period]} period · one row per receipt, each with its GST component; period totals below.
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
            <tr>
              <td colSpan={5} style={{ padding: '28px 20px', textAlign: 'center', color: neutral.mist }}>
                No payments received in this period yet. Received money (and its GST) appears here once the
                billing and payment simulation runs (Phase 10).
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${neutral.line}` }}>
              <Td bold>Period total</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td mono right bold>{formatCurrency(0)}</Td>
              <Td mono right bold>{formatCurrency(0)}</Td>
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
