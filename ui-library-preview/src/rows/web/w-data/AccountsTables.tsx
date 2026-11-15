import { useMemo, useState } from 'react'
import { format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { aaFeeInvoicesFor, gstActivityFor, paymentHistoryFor, receivablesAgingFor, useAppStore, useToday } from '@proto/store'
import { formatCurrency } from '@proto/shared/format'
import { aaFeeFixedTotal, aaFeeMonthLabel } from '@proto/domain/billing/aaFee'
import { roundToCents } from '@proto/domain/billing/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableRow } from '@/components/ui/table'
import { coreFeatures, DataTable, FootCell, Panel, Segmented, Wide } from './shared'

type SubTab = 'overdue' | 'payments' | 'gst' | 'fees'
type Bucket = 'current' | 'd31_60' | 'd61_90' | 'd90plus'

const money = (n: number) => formatCurrency(n) as string
const day = (atISO: string) => format(parseISO(atISO.slice(0, 10)), 'd MMM yyyy')

function useMirror() {
  const billing = useAppStore((s: any) => s.billing)
  const schedule = useAppStore((s: any) => s.schedule)
  const masters = useAppStore((s: any) => s.masters)
  return { billing, schedule, masters }
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="tw:max-w-[860px] tw:px-5 tw:pt-4 tw:text-xs tw:leading-[1.5] tw:text-mist">{children}</div>
}

/* ------------------------------------------------------------------ */
/* Overdue                                                             */
/* ------------------------------------------------------------------ */

interface OverdueRow {
  caseId: string
  invoiceNumber: string
  patientName: string
  counterpartyLabel: string
  raisedAtISO: string
  bucket: Bucket
  outstanding: number
  accFunded: boolean
}

const AGING: { key: Bucket; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: 'd31_60', label: '31 to 60' },
  { key: 'd61_90', label: '61 to 90' },
  { key: 'd90plus', label: '90 +' },
]

const overdueHelper = createColumnHelper<typeof coreFeatures, OverdueRow>()
const overdueColumns = overdueHelper.columns([
  overdueHelper.accessor('invoiceNumber', { id: 'invoice', header: 'Invoice' }),
  overdueHelper.accessor('patientName', { id: 'patient', header: 'Patient' }),
  overdueHelper.accessor('counterpartyLabel', { id: 'payer', header: 'Payer' }),
  overdueHelper.accessor('raisedAtISO', { id: 'raised', header: 'Raised', cell: (i) => day(i.getValue()) }),
  ...AGING.map((c) => overdueHelper.display({ id: c.key, header: c.label, cell: ({ row }) => (row.original.bucket === c.key ? money(row.original.outstanding) : '·') })),
  overdueHelper.accessor('accFunded', { id: 'acc', header: 'ACC', cell: (i) => (i.getValue() ? <span className="tw:text-[11px] tw:font-semibold tw:text-slate">ACC</span> : '·') }),
])

function OverdueTable({ anaesthetistId }: { anaesthetistId: string }) {
  const m = useMirror()
  const todayISO = useToday() as string
  const { rows, aging } = useMemo(() => receivablesAgingFor(m, anaesthetistId, todayISO) as { rows: OverdueRow[]; aging: Record<Bucket, number> & { total: number } }, [m.billing, m.schedule, m.masters, anaesthetistId, todayISO])
  const table = useTable({ features: coreFeatures, columns: overdueColumns, data: rows, getRowId: (r) => r.caseId })
  if (rows.length === 0) {
    return (
      <Panel>
        <div className="tw:py-2 tw:text-sm tw:text-mist">No outstanding accounts. A List's invoices show here once the office authorises it.</div>
      </Panel>
    )
  }
  return (
    <Panel flush className="tw:gap-0">
      <Note>One row per outstanding ACCPAY invoice, ordered by date raised. No rollup (per the RFP).</Note>
      <DataTable
        table={table}
        density="compact"
        className="tw:min-w-[820px] tw:text-[13px]"
        mono={['invoice', 'raised', 'current', 'd31_60', 'd61_90', 'd90plus']}
        align={{ current: 'right', d31_60: 'right', d61_90: 'right', d90plus: 'right', acc: 'center' }}
        footer={
          <>
            <TableRow className="tw:hover:bg-transparent">
              <FootCell header colSpan={4}>Totals</FootCell>
              {AGING.map((c) => (
                <FootCell key={c.key} right bold mono>
                  {money(aging[c.key])}
                </FootCell>
              ))}
              <FootCell />
            </TableRow>
            <TableRow className="tw:border-0 tw:hover:bg-transparent">
              <FootCell header colSpan={7} className="tw:text-right tw:font-normal">
                Outstanding
              </FootCell>
              <FootCell right bold mono>
                {money(aging.total)}
              </FootCell>
              <FootCell />
            </TableRow>
          </>
        }
      />
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

type PaymentStatus = 'partPayment' | 'customerPaid' | 'partPaidOut' | 'paidOut'
interface PaymentRow {
  caseId: string
  receivedAtISO: string
  invoiceNumber: string
  patientName: string
  payerLabel: string
  grossReceived: number
  releasedAmount: number
  disbursedAmount: number
  status: PaymentStatus
}
const PAYMENT_STATUS: Record<PaymentStatus, string> = { partPayment: 'Part payment received', customerPaid: 'Customer paid', partPaidOut: 'Part paid to you', paidOut: 'Paid to you' }

const payHelper = createColumnHelper<typeof coreFeatures, PaymentRow>()
const payColumns = payHelper.columns([
  payHelper.accessor('receivedAtISO', { id: 'received', header: 'Date received', cell: (i) => day(i.getValue()) }),
  payHelper.accessor('invoiceNumber', { id: 'invoice', header: 'Invoice' }),
  payHelper.accessor('patientName', { id: 'patient', header: 'Patient' }),
  payHelper.accessor('payerLabel', { id: 'payer', header: 'Payer' }),
  payHelper.accessor('grossReceived', { id: 'gross', header: 'Received by AA', cell: (i) => money(i.getValue()) }),
  payHelper.accessor('releasedAmount', { id: 'released', header: 'Released to you', cell: (i) => <span className="tw:font-bold">{money(i.getValue())}</span> }),
  payHelper.accessor('disbursedAmount', { id: 'paid', header: 'Paid to you', cell: (i) => money(i.getValue()) }),
  payHelper.accessor('status', {
    header: 'Status',
    cell: (i) => (
      <Badge variant={i.getValue() === 'paidOut' ? 'success' : 'default'} className="tw:px-2 tw:py-1 tw:leading-[normal]">
        {PAYMENT_STATUS[i.getValue()]}
      </Badge>
    ),
  }),
])

function PaymentsTable({ anaesthetistId, onOpenFees }: { anaesthetistId: string; onOpenFees: () => void }) {
  const m = useMirror()
  const rows = useMemo(() => paymentHistoryFor(m, anaesthetistId) as PaymentRow[], [m.billing, m.schedule, m.masters, anaesthetistId])
  const table = useTable({ features: coreFeatures, columns: payColumns, data: rows, getRowId: (r) => r.caseId })
  return (
    <Panel flush className="tw:gap-0">
      <Note>
        Received invoices remain here after they leave Overdue. Everything AA receives for an invoice is released to you in full. AA's own fee is{' '}
        <Button variant="link" onClick={onOpenFees} className="tw:text-xs tw:underline">
          invoiced to you monthly
        </Button>
        .
      </Note>
      <DataTable
        table={table}
        density="compact"
        className="tw:min-w-[960px] tw:text-[13px]"
        mono={['received', 'invoice', 'gross', 'released', 'paid']}
        align={{ gross: 'right', released: 'right', paid: 'right' }}
        empty="No payments received yet."
      />
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* AA fees                                                             */
/* ------------------------------------------------------------------ */

interface FeeRow {
  id: string
  invoiceNumber: string
  monthISO: string
  bctiCount: number
  settings: unknown
  subtotal: number
  gst: number
  total: number
  status: 'paid' | 'unpaid'
  paidAtISO?: string
}

const feeHelper = createColumnHelper<typeof coreFeatures, FeeRow>()
const feeColumns = feeHelper.columns([
  feeHelper.accessor('invoiceNumber', { id: 'invoice', header: 'Invoice' }),
  feeHelper.accessor('monthISO', { id: 'month', header: 'Month', cell: (i) => aaFeeMonthLabel(i.getValue()) }),
  feeHelper.accessor('bctiCount', { id: 'bctis', header: 'BCTIs' }),
  feeHelper.accessor((r) => aaFeeFixedTotal(r.settings) as number, { id: 'fixed', header: 'Fixed charges', cell: (i) => money(i.getValue()) }),
  feeHelper.accessor((r) => roundToCents(r.subtotal - (aaFeeFixedTotal(r.settings) as number)) as number, { id: 'perBcti', header: 'Per-BCTI charge', cell: (i) => money(i.getValue()) }),
  feeHelper.accessor('subtotal', { id: 'fee', header: 'Fee (ex GST)', cell: (i) => money(i.getValue()) }),
  feeHelper.accessor('gst', { header: 'GST', cell: (i) => money(i.getValue()) }),
  feeHelper.accessor('total', { header: 'Total', cell: (i) => <span className="tw:font-bold">{money(i.getValue())}</span> }),
  feeHelper.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      const r = row.original
      return (
        <Badge variant={r.status === 'paid' ? 'success' : 'default'} className="tw:px-2 tw:py-1 tw:leading-[normal]">
          {r.status === 'paid' && r.paidAtISO !== undefined ? `Paid ${day(r.paidAtISO)}` : 'Unpaid'}
        </Badge>
      )
    },
  }),
])

function AaFeesTable({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s: any) => s.billing)
  const rows = useMemo(() => aaFeeInvoicesFor({ billing }, anaesthetistId) as FeeRow[], [billing, anaesthetistId])
  const unpaid = rows.filter((r) => r.status === 'unpaid').reduce((n, r) => n + r.total, 0)
  const table = useTable({ features: coreFeatures, columns: feeColumns, data: rows, getRowId: (r) => r.id })
  return (
    <Panel flush className="tw:gap-0">
      <Note>
        AA invoices its fee monthly: fixed charges plus a charge for each buyer-created tax invoice (BCTI) AA issued for your work and was paid for that month. It is a separate invoice you pay into
        AA's own account, never deducted from your payments.
      </Note>
      <DataTable
        table={table}
        density="compact"
        className="tw:min-w-[960px] tw:text-[13px]"
        mono={['invoice', 'bctis', 'fixed', 'perBcti', 'fee', 'gst', 'total']}
        align={{ bctis: 'right', fixed: 'right', perBcti: 'right', fee: 'right', gst: 'right', total: 'right' }}
        empty="No AA fee invoices yet."
        footer={
          <TableRow className="tw:hover:bg-transparent">
            <FootCell header colSpan={7} className="tw:font-normal tw:text-slate">
              Unpaid AA fees (incl GST)
            </FootCell>
            <FootCell right bold mono>
              {money(unpaid)}
            </FootCell>
            <FootCell />
          </TableRow>
        }
      />
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* GST activity                                                        */
/* ------------------------------------------------------------------ */

type GstPeriod = 'monthly' | 'biMonthly' | 'sixMonthly'
interface GstRow {
  receiptId: string
  atISO: string
  invoiceNumber: string
  payerLabel: string
  grossAmount: number
  gstAmount: number
}
const PERIODS: { value: GstPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biMonthly', label: 'Bi-monthly' },
  { value: 'sixMonthly', label: 'Six-monthly' },
]

const gstHelper = createColumnHelper<typeof coreFeatures, GstRow>()
const gstColumns = gstHelper.columns([
  gstHelper.accessor('atISO', { id: 'received', header: 'Date received', cell: (i) => day(i.getValue()) }),
  gstHelper.accessor('invoiceNumber', { id: 'invoice', header: 'Invoice' }),
  gstHelper.accessor('payerLabel', { id: 'payer', header: 'Payer' }),
  gstHelper.accessor('grossAmount', { id: 'gross', header: 'Amount received', cell: (i) => money(i.getValue()) }),
  gstHelper.accessor('gstAmount', { id: 'gst', header: 'GST component', cell: (i) => money(i.getValue()) }),
])

function GstReport({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s: any) => s.billing)
  const masters = useAppStore((s: any) => s.masters)
  const todayISO = useToday() as string
  const [period, setPeriod] = useState<GstPeriod>((masters.anaesthetists[anaesthetistId]?.gstPeriod ?? 'monthly') as GstPeriod)
  const months = period === 'monthly' ? 1 : period === 'biMonthly' ? 2 : 6
  const today = parseISO(todayISO)
  const fromISO = format(startOfMonth(subMonths(today, months - 1)), 'yyyy-MM-dd')
  const activity = useMemo(() => gstActivityFor({ billing, masters }, anaesthetistId, fromISO, todayISO) as { rows: GstRow[]; totalGross: number; totalGst: number }, [billing, masters, anaesthetistId, fromISO, todayISO])
  const table = useTable({ features: coreFeatures, columns: gstColumns, data: activity.rows, getRowId: (r) => r.receiptId })
  const label = PERIODS.find((p) => p.value === period)?.label ?? ''
  return (
    <Panel title="GST activity" action={<Segmented label="GST period" value={period} options={PERIODS} onChange={setPeriod} className="tw:w-[320px]" />}>
      <div className="tw:text-xs tw:text-mist">
        {label} period ({format(parseISO(fromISO), 'd MMM')} to {format(today, 'd MMM yyyy')}) · one row per amount received, each with its GST component; period totals below.
      </div>
      <DataTable
        table={table}
        density="compact"
        className="tw:min-w-[560px] tw:text-[13px]"
        mono={['received', 'invoice', 'gross', 'gst']}
        align={{ gross: 'right', gst: 'right' }}
        empty="No payments received in this period."
        footer={
          <TableRow className="tw:hover:bg-transparent">
            <FootCell header colSpan={3} className="tw:font-bold">
              Period total
            </FootCell>
            <FootCell right bold mono>
              {money(activity.totalGross)}
            </FootCell>
            <FootCell right bold mono>
              {money(activity.totalGst)}
            </FootCell>
          </TableRow>
        }
      />
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* The screen                                                          */
/* ------------------------------------------------------------------ */

/**
 * The Accounts screen's four tables on TanStack Table v9 + shadcn Table, its sub-tabs on shadcn Tabs (line
 * variant). Totals sit in a real tfoot (TableFooter) with the label cell a row header.
 */
export function AccountsReplacement() {
  const f = useWebFixtures() as { anaesthetistId: string }
  const [tab, setTab] = useState<SubTab>('overdue')
  return (
    <Wide width={1100}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <div>
          <h1 className="tw:m-0 tw:text-[28px] tw:leading-[34px] tw:font-bold tw:tracking-[-0.015em]">Accounts</h1>
          <div className="tw:mt-1 tw:text-sm tw:text-slate">Outstanding accounts, payments, your GST activity and AA's fee invoices to you.</div>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as SubTab)} className="tw:gap-4">
          <TabsList variant="line" className="tw:w-full tw:justify-start tw:gap-1">
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="gst">GST activity</TabsTrigger>
            <TabsTrigger value="fees">AA fees</TabsTrigger>
          </TabsList>
          <TabsContent value="overdue">
            <OverdueTable anaesthetistId={f.anaesthetistId} />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTable anaesthetistId={f.anaesthetistId} onOpenFees={() => setTab('fees')} />
          </TabsContent>
          <TabsContent value="gst">
            <GstReport anaesthetistId={f.anaesthetistId} />
          </TabsContent>
          <TabsContent value="fees">
            <AaFeesTable anaesthetistId={f.anaesthetistId} />
          </TabsContent>
        </Tabs>
      </div>
    </Wide>
  )
}
