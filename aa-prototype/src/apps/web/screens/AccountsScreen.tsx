import { useMemo, useState } from 'react'
import { neutral, semantic } from '../../../theme/tokens'
import {
  aaFeeInvoicesFor,
  anaesthetistLedgerPosition,
  gstReportFor,
  gstReportMonthsFor,
  OUTSTANDING_STAGE_LABEL,
  outstandingPayableRowsFor,
  outstandingTotalFor,
  paymentHistoryFor,
  POSITION_LABEL,
  useAppStore,
  useToday,
  type AaFeeInvoiceRow,
  type PayableRow,
  type PaymentHistoryRow,
  type PaymentHistoryStatus,
} from '../../../store'
import { formatCurrency, plainDate, plural } from '../../../shared/format'
import { aaFeeFixedTotal, aaFeeMonthLabel } from '../../../domain/billing/aaFee'
import { gstMonthLabel, gstReportCsv, gstReportFileName } from '../../../domain/billing/gstReport'
import { roundToCents } from '../../../domain/billing/money'
import { Button, Card, EmptyState, LineTabLink, LineTabs, Notice, PageHeader, Pill, SelectField, StatTile, TextAction } from '../../../shared/ui'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { downloadTextFile } from '../../../shared/download'
import { HELD_UNTIL_AUTHORISED } from '../../../domain/billing/prepayHolding'

export type AccountsSubTab = 'outstanding' | 'payments' | 'gst' | 'fees'

export const ACCOUNTS_SUB_TABS: readonly AccountsSubTab[] = ['outstanding', 'payments', 'gst', 'fees']

const SUB_TAB_LABEL: Record<AccountsSubTab, string> = {
  outstanding: 'Outstanding',
  payments: 'Payments',
  gst: 'GST report',
  fees: 'AA fees',
}

interface AccountsScreenProps {
  anaesthetistId: string
  subTab: AccountsSubTab
  onSubTab: (tab: AccountsSubTab) => void
  /** Opens a Booking from its Outstanding line (US-12.2.1). */
  onOpenBooking?: (listId: string, bookingId: string) => void
  focusInvoiceNumber?: string
}

/**
 * The Accounts area (W4; FT-12.2). Sub-tabs: Outstanding (a flat list of the
 * unpaid payables, oldest first, no ageing: US-12.2.1, D8), Payments, the
 * monthly GST report (the payments AA passed to you, cash basis: US-12.2.2) and
 * AA fees. Everything reads the ledger, AA's system of record (catch-up Phases
 * 36 and 38; never `state.xero`), and the "Your position" strip above the
 * sub-tabs carries the same figures and labels as the dashboard (US-08.3.5).
 */
export function AccountsScreen({
  anaesthetistId,
  subTab,
  onSubTab,
  onOpenBooking,
  focusInvoiceNumber,
}: AccountsScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader size="web" title="Accounts" sub="Outstanding invoices, payments, your GST report and AA fees." />

      <PositionStrip anaesthetistId={anaesthetistId} onOpenFees={() => onSubTab('fees')} />

      <LineTabs label="Accounts">
        {ACCOUNTS_SUB_TABS.map((tab) => (
          <LineTabLink key={tab} to={`/web/accounts/${tab}`} active={subTab === tab}>
            {SUB_TAB_LABEL[tab]}
          </LineTabLink>
        ))}
      </LineTabs>

      {subTab === 'outstanding' ? (
        <OutstandingTable anaesthetistId={anaesthetistId} {...(onOpenBooking !== undefined ? { onOpenBooking } : {})} />
      ) : subTab === 'payments' ? (
        <PaymentsTable
          anaesthetistId={anaesthetistId}
          focusInvoiceNumber={focusInvoiceNumber}
          onOpenFees={() => onSubTab('fees')}
        />
      ) : subTab === 'fees' ? (
        <AaFeesTable anaesthetistId={anaesthetistId} focusInvoiceNumber={focusInvoiceNumber} />
      ) : (
        <GstReport anaesthetistId={anaesthetistId} onOpenFees={() => onSubTab('fees')} />
      )}
    </div>
  )
}

/**
 * "Your position" (catch-up Phase 36; US-08.3.5): owed to you (awaiting
 * collection and due to you now), collected, paid out to you, and what you owe
 * AA (unpaid AA fee invoices), from the one definition the dashboard and the
 * Admin Ledger's anaesthetist scope use, under the one set of labels (38).
 */
function PositionStrip({ anaesthetistId, onOpenFees }: { anaesthetistId: string; onOpenFees: () => void }) {
  const billing = useAppStore((s) => s.billing)
  const p = useMemo(() => anaesthetistLedgerPosition({ billing }, anaesthetistId), [billing, anaesthetistId])
  return (
    <Card padding="panel" title="Your position" shot="web-accounts-position">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <StatTile
          variant="quiet"
          label={POSITION_LABEL.owedToThem}
          value={formatCurrency(p.owedToThem)}
          sub={
            <>
              <span style={{ display: 'block' }}>{POSITION_LABEL.awaitingCollection} <span className="mono">{formatCurrency(p.awaitingCollection)}</span></span>
              <span style={{ display: 'block' }}>{POSITION_LABEL.dueNow} <span className="mono">{formatCurrency(p.dueNow)}</span>, which AA holds for you</span>
            </>
          }
        />
        <StatTile variant="quiet" label={POSITION_LABEL.collected} value={formatCurrency(p.collected)} />
        <StatTile variant="quiet" label={POSITION_LABEL.paidOut} value={formatCurrency(p.paidOut)} />
        <StatTile
          variant="quiet"
          label={POSITION_LABEL.theyOweAa}
          value={formatCurrency(p.theyOweAa)}
          sub={<TextAction size="sm" flush onClick={onOpenFees}>Your AA fee invoices</TextAction>}
        />
      </div>
    </Card>
  )
}

/**
 * Outstanding (catch-up Phase 38; US-12.2.1, RV-35, D8): one row per unpaid
 * payable, oldest first, no grouping or ageing. A row stays until AA pays the
 * anaesthetist; its total equals "Owed to you". Each line opens its Booking.
 */
function OutstandingTable({ anaesthetistId, onOpenBooking }: { anaesthetistId: string; onOpenBooking?: (listId: string, bookingId: string) => void }) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)

  const rows = useMemo(
    () => outstandingPayableRowsFor({ billing, schedule, masters }, anaesthetistId),
    [billing, schedule, masters, anaesthetistId],
  )
  const total = outstandingTotalFor(rows)

  return (
    <Card padding="panel" flush shot="web-accounts-outstanding">
      {rows.length === 0 ? (
        <EmptyState style={{ padding: '20px' }}>Nothing outstanding. New invoices appear here as soon as the office authorises a List.</EmptyState>
      ) : (
        <>
          <div style={{ padding: '16px 20px 0', fontSize: 12, lineHeight: 1.5, color: neutral.mist }}>
            One row per invoice not yet paid to you, oldest first. A row stays until AA pays you. For a question about a line, contact the office.
          </div>
          <TableShell label="Outstanding invoices" bare minWidth={820}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
                <Th>Invoice date</Th>
                <Th>Invoice</Th>
                <Th>Patient</Th>
                <Th>Billable party</Th>
                <Th>Stage</Th>
                <Th align="center">ACC</Th>
                <Th align="right">Outstanding to you</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: PayableRow) => {
                const open = onOpenBooking !== undefined ? () => onOpenBooking(r.listId, r.bookingId) : undefined
                return (
                  <ClickableRow
                    key={r.pairId}
                    {...(open !== undefined ? { onOpen: open } : {})}
                    data-testid={`outstanding-row-${r.invoiceNumber}`}
                    data-booking-id={r.bookingId}
                    style={{ borderBottom: `1px solid ${neutral.sunken}` }}
                  >
                    <Td mono nowrap>{plainDate(r.raisedAtISO)}</Td>
                    <Td mono nowrap>
                      {open !== undefined ? (
                        <RowOpenButton label={`Open the Booking for ${r.invoiceNumber}, ${r.patientName}`} onOpen={open}>{r.invoiceNumber}</RowOpenButton>
                      ) : (
                        r.invoiceNumber
                      )}
                    </Td>
                    <Td>{r.patientName}</Td>
                    <Td>{r.counterpartyLabel}</Td>
                    <Td nowrap>{OUTSTANDING_STAGE_LABEL[r.stage]}</Td>
                    <Td align="center">{r.accFunded ? <span style={{ fontSize: 11, fontWeight: 600, color: neutral.slate }}>ACC</span> : '·'}</Td>
                    <Td mono align="right" nowrap>{formatCurrency(r.outstandingToYou)}</Td>
                  </ClickableRow>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${neutral.line}` }}>
                <Td bold>Total outstanding</Td>
                <Td colSpan={5} style={{ color: neutral.slate }}>{plural(rows.length, 'invoice')}</Td>
                <Td mono bold align="right" nowrap data-testid="outstanding-total">{formatCurrency(total)}</Td>
              </tr>
            </tfoot>
          </TableShell>
        </>
      )}
    </Card>
  )
}

const PAYMENT_STATUS_LABEL: Record<PaymentHistoryStatus, string> = {
  // A prepayment in the AA Holding account (catch-up Phase 27a): nothing released until the List is authorised.
  held: HELD_UNTIL_AUTHORISED,
  partPayment: 'Part payment received',
  customerPaid: 'Customer paid',
  partPaidOut: 'Part paid to you',
  paidOut: 'Paid to you',
}

function focusStyle(focused: boolean) {
  return {
    borderBottom: `1px solid ${neutral.sunken}`,
    background: focused ? semantic.success.tint : undefined,
    boxShadow: focused ? `inset 3px 0 0 ${semantic.success.solid}` : undefined,
  }
}

function PaymentsTable({
  anaesthetistId,
  focusInvoiceNumber,
  onOpenFees,
}: {
  anaesthetistId: string
  focusInvoiceNumber?: string
  onOpenFees: () => void
}) {
  const billing = useAppStore((s) => s.billing)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const rows = useMemo(
    () => paymentHistoryFor({ billing, schedule, masters }, anaesthetistId),
    [billing, schedule, masters, anaesthetistId],
  )

  return (
    <Card padding="panel" flush>
      <div style={{ padding: '16px 20px 0', fontSize: 12, lineHeight: 1.5, color: neutral.mist }}>
        Received invoices remain here once they are paid to you. Everything AA receives for an
        invoice is released to you in full. A prepayment is held by AA until the List is
        authorised, then moves to you. AA&apos;s own fee is{' '}
        <TextAction inline onClick={onOpenFees}>invoiced to you monthly</TextAction>.
      </div>
      <TableShell label="Payments" bare minWidth={960}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
            <Th>Date received</Th>
            <Th>Invoice</Th>
            <Th>Patient</Th>
            <Th>Billable party</Th>
            <Th align="right">Received by AA</Th>
            <Th align="right">Released to you</Th>
            <Th align="right">Paid to you</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState style={{ padding: '28px 20px', textAlign: 'center' }}>No payments received yet.</EmptyState>
              </td>
            </tr>
          ) : (
            rows.map((row: PaymentHistoryRow) => {
              const focused = row.invoiceNumber === focusInvoiceNumber
              return (
                <tr key={row.pairId} data-testid={`payment-history-row-${row.invoiceNumber}`} style={focusStyle(focused)}>
                  <Td mono nowrap>{plainDate(row.receivedAtISO)}</Td>
                  <Td mono bold={focused} nowrap>{row.invoiceNumber}</Td>
                  <Td>{row.patientName}</Td>
                  <Td>{row.payerLabel}</Td>
                  <Td mono align="right" nowrap>{formatCurrency(row.grossReceived)}</Td>
                  <Td mono align="right" bold nowrap>{formatCurrency(row.releasedAmount)}</Td>
                  <Td mono align="right" nowrap>{formatCurrency(row.disbursedAmount)}</Td>
                  <Td>
                    <Pill size="lg" tone={row.status === 'paidOut' ? 'success' : 'neutral'} shot={row.status === 'held' ? 'payment-held' : undefined}>
                      {PAYMENT_STATUS_LABEL[row.status]}
                    </Pill>
                  </Td>
                </tr>
              )
            })
          )}
        </tbody>
      </TableShell>
    </Card>
  )
}

/**
 * AA's monthly fee invoices to this anaesthetist (catch-up Phase 16;
 * US-10.3.2): paid or unpaid, from the ledger (never Xero). A fee
 * invoice shows as soon as it is raised.
 */
function AaFeesTable({ anaesthetistId, focusInvoiceNumber }: { anaesthetistId: string; focusInvoiceNumber?: string }) {
  const billing = useAppStore((s) => s.billing)
  const rows = useMemo(() => aaFeeInvoicesFor({ billing }, anaesthetistId), [billing, anaesthetistId])
  const unpaidTotal = rows.filter((r) => r.status === 'unpaid').reduce((sum, r) => sum + r.total, 0)

  return (
    <Card padding="panel" flush>
      <div data-shot="web-accounts-aa-fees">
        <div style={{ padding: '16px 20px 0', fontSize: 12, lineHeight: 1.5, color: neutral.mist, maxWidth: 860 }}>
          AA invoices its fee monthly: fixed charges plus a charge for each buyer-created tax invoice (BCTI) AA
          issued for your work and was paid for that month. It is a separate invoice you pay into AA&apos;s own
          account, never deducted from your payments.
        </div>
        <TableShell label="AA fees" bare minWidth={960}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
              <Th>Invoice</Th>
              <Th>Month</Th>
              <Th align="right">BCTIs</Th>
              <Th align="right">Fixed charges</Th>
              <Th align="right">Per-BCTI charge</Th>
              <Th align="right">Fee (ex GST)</Th>
              <Th align="right">GST</Th>
              <Th align="right">Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState style={{ padding: '28px 20px', textAlign: 'center' }}>No AA fee invoices yet.</EmptyState>
                </td>
              </tr>
            ) : (
              rows.map((row: AaFeeInvoiceRow) => {
                const focused = row.invoiceNumber === focusInvoiceNumber
                const fixed = aaFeeFixedTotal(row.settings)
                return (
                  <tr key={row.id} data-testid={`aa-fee-history-row-${row.invoiceNumber}`} style={focusStyle(focused)}>
                    <Td mono bold={focused} nowrap>{row.invoiceNumber}</Td>
                    <Td>{aaFeeMonthLabel(row.monthISO)}</Td>
                    <Td mono align="right">{row.bctiCount}</Td>
                    <Td mono align="right" nowrap>{formatCurrency(fixed)}</Td>
                    <Td mono align="right" nowrap>{formatCurrency(roundToCents(row.subtotal - fixed))}</Td>
                    <Td mono align="right" nowrap>{formatCurrency(row.subtotal)}</Td>
                    <Td mono align="right" nowrap>{formatCurrency(row.gst)}</Td>
                    <Td mono align="right" bold nowrap>{formatCurrency(row.total)}</Td>
                    <Td>
                      <Pill tone={row.status === 'paid' ? 'success' : 'neutral'}>
                        {row.status === 'paid' && row.paidAtISO !== undefined ? `Paid ${plainDate(row.paidAtISO)}` : 'Unpaid'}
                      </Pill>
                    </Td>
                  </tr>
                )
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${neutral.line}` }}>
              <Td colSpan={7} style={{ color: neutral.slate }}>Unpaid AA fees (incl GST)</Td>
              <Td mono bold align="right" nowrap>{formatCurrency(unpaidTotal)}</Td>
              <Td />
            </tr>
          </tfoot>
        </TableShell>
      </div>
    </Card>
  )
}

/**
 * The monthly GST report (catch-up Phase 38; US-12.2.2, DM-29, RV-33): for a
 * calendar month on the picker (default the demo clock's month), each payment
 * AA passed to the anaesthetist, from the ledger's disbursements, with the GST
 * component of each (`gstReportFor`; the maths in `domain/billing/gstReport`).
 * Cash basis: a receipt alone adds nothing. Download (CSV), Print (the report
 * alone) and Email to me (a demo confirmation: no mail is sent, no store
 * write). There is no GST period.
 */
function GstReport({ anaesthetistId, onOpenFees }: { anaesthetistId: string; onOpenFees: () => void }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const todayISO = useToday()
  const anaesthetist = masters.anaesthetists[anaesthetistId]

  const months = useMemo(() => gstReportMonthsFor({ billing }, anaesthetistId, todayISO), [billing, anaesthetistId, todayISO])
  const [chosen, setChosen] = useState<string | undefined>(undefined)
  const monthISO = chosen !== undefined && months.includes(chosen) ? chosen : (months[0] ?? todayISO.slice(0, 7))
  const [sentMonth, setSentMonth] = useState<string | undefined>(undefined)

  const report = useMemo(
    () => gstReportFor({ billing, masters }, anaesthetistId, monthISO, todayISO),
    [billing, masters, anaesthetistId, monthISO, todayISO],
  )
  const empty = report.rows.length === 0
  const monthLabel = gstMonthLabel(monthISO)
  const emptyReason = 'No payments in this month'

  return (
    <div className="aa-print-report">
    <Card
      padding="panel"
      flush
      title="GST report"
      action={
        <div className="aa-print-hide" data-shot="web-gst-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="outline" size="compact" disabled={empty} title={empty ? emptyReason : undefined} onClick={() => downloadTextFile(gstReportFileName(monthISO), gstReportCsv(report))}>
            Download
          </Button>
          <Button variant="outline" size="compact" disabled={empty} title={empty ? emptyReason : undefined} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outline" size="compact" disabled={empty} title={empty ? emptyReason : undefined} onClick={() => setSentMonth(monthISO)}>
            Email to me
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="aa-print-only" style={{ fontSize: 13, color: neutral.slate }}>
          {monthLabel} · {anaesthetist?.name ?? ''} · the payments AA passed to you, with their GST component
        </div>
        <div className="aa-print-hide" style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <SelectField
            label="Month"
            value={monthISO}
            onChange={(m) => {
              setChosen(m)
              setSentMonth(undefined)
            }}
            size="compact"
            shot="web-gst-month-picker"
          >
            {months.map((m) => (
              <option key={m} value={m}>{gstMonthLabel(m)}</option>
            ))}
          </SelectField>
          {empty && (
            <span data-shot="web-gst-actions-hint" style={{ fontSize: 12, color: neutral.mist, paddingBottom: 8 }}>
              {emptyReason}: nothing to download, print or email.
            </span>
          )}
        </div>
        <Notice tone="success" live="status" shot="web-gst-email-sent" style={sentMonth === monthISO ? undefined : { display: 'none' }}>
          {sentMonth === monthISO ? `Sent to ${anaesthetist?.email ?? 'your email'}: the GST report for ${monthLabel}.` : ''}
        </Notice>
        <div data-shot="gst-month" style={{ fontSize: 12, lineHeight: 1.5, color: neutral.mist }}>
          {monthLabel} · GST on a cash basis: each payment AA passed to you in the month, with its GST component. An
          invoice paid in part appears in each month it is paid.
        </div>
        {report.notYetPaid !== undefined && report.notYetPaid > 0 && (
          <div data-shot="web-gst-not-yet-paid" style={{ fontSize: 13, color: neutral.slate }}>
            <span className="mono" style={{ fontWeight: 600, color: neutral.ink }}>{formatCurrency(report.notYetPaid)}</span> collected by AA is not yet paid to you. It falls into the month AA pays it in.
          </div>
        )}
      </div>
      <TableShell label={`GST report, ${monthLabel}`} bare minWidth={760} shot="web-gst-report">
        <thead>
          <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
            <Th>Date paid</Th>
            <Th>Invoice</Th>
            <Th>Billable party</Th>
            <Th align="right">Paid to you (incl GST)</Th>
            <Th align="right">GST component</Th>
            <Th align="right">Paid ex GST</Th>
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={6}>
                <EmptyState style={{ padding: '28px 20px', textAlign: 'center' }}>AA has not passed you any payments in this month.</EmptyState>
              </td>
            </tr>
          ) : (
            report.rows.map((r) => (
              <tr key={r.disbursementId} data-testid={`gst-report-row-${r.invoiceNumber}`} style={{ borderBottom: `1px solid ${neutral.sunken}` }}>
                <Td mono nowrap>{plainDate(r.paidOnISO)}</Td>
                <Td mono nowrap>{r.invoiceNumber}</Td>
                <Td>{r.partyLabel}</Td>
                <Td mono align="right" nowrap>{formatCurrency(r.paidToYou)}</Td>
                <Td mono align="right" nowrap>{formatCurrency(r.gst)}</Td>
                <Td mono align="right" nowrap>{formatCurrency(r.paidExGst)}</Td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `2px solid ${neutral.line}` }}>
            <Td bold>Month total</Td>
            <Td colSpan={2} style={{ color: neutral.slate }}>{plural(report.rows.length, 'payment')}</Td>
            <Td mono bold align="right" nowrap>{formatCurrency(report.totals.paidToYou)}</Td>
            <Td mono bold align="right" nowrap>{formatCurrency(report.totals.gst)}</Td>
            <Td mono bold align="right" nowrap>{formatCurrency(report.totals.paidExGst)}</Td>
          </tr>
        </tfoot>
      </TableShell>
      <div className="aa-print-hide" style={{ padding: '12px 20px 16px', fontSize: 12, color: neutral.mist }}>
        AA&apos;s fee invoices to you are not income and are not on this report: see{' '}
        <TextAction inline onClick={onOpenFees}>AA fees</TextAction>.
      </div>
    </Card>
    </div>
  )
}
