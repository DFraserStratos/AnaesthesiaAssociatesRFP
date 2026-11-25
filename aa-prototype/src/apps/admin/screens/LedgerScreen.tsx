/**
 * One anaesthetist's ledger (catch-up Phase 36; US-13.2.1, US-08.3.4, US-08.3.5,
 * FT-08.3): the account under the Finances section's Ledger tab, with who owes
 * whom said in words, their payment runs, credit trails and pairs. Every figure
 * comes from `store/ledgerSelectors.ts`; the maths is `domain/billing/ledger.ts`.
 *
 * Build plan Phase 64 (D107, D114): the whole ledger left this file for the
 * Ledger tab (`finances/LedgerTab.tsx`, `LedgerRail.tsx`, `LedgerLists.tsx`, and
 * the receipt dialogs in `LedgerReceiptDialogs.tsx`). What stays is the
 * one-anaesthetist view for the account route, with a Back link to the Ledger in
 * place of the Whole / One switch and the picker, until Phase 65 rebuilds the
 * page on the record pattern.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import {
  anaesthetistLedgerPosition,
  ledgerRows,
  ledgerRowTotals,
  negativeInvoicesFor,
  negativeOpenAmount,
  paymentWeekFor,
  paymentWeeksForPair,
  replacementsOf,
  unmatchedReceiptRows,
  useAppStore,
  type LedgerRow,
} from '../../../store'
import { isBookingPair, isCreditedPair, type LedgerCheck } from '../../../domain/billing/ledger'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import { Card, EmptyState, FilterPills, Notice, PageHeader, Pill, StatTile, TextAction } from '../../../shared/ui'
import { drSurname, formatCurrency, plural } from '../../../shared/format'
import { CREDIT_LABELS } from '../../../shared/procedureEventCopy'
import type { LedgerPair, NegativeInvoice, UnmatchedReceipt } from '../../../domain/types'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../components/Pager'
import { LedgerPaymentRuns, StillToNetNotice } from '../components/LedgerPaymentRuns'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { AdminPage } from '../components/AdminPage'
import { creditNotePath, financePath, invoicePath } from './finances/financePaths'
import { ADMIN_PROSE_WIDTH } from '../layout'

type RowFilter = 'open' | 'all'

const CHECK_TEXT: Record<LedgerCheck['code'], string> = {
  unmatchedReceiptHeld: 'Receipt with no matching invoice',
  pairAmountMismatch: 'Payable differs from its invoice',
  transferMismatch: 'Transfer out differs from what was held',
  releasedNotReceived: 'Released differs from what was received',
  disbursedAboveReleased: 'Paid out above what was released',
  receivedAboveAmount: 'Received above the invoice total',
}

const KIND_TEXT: Record<LedgerRow['kind'], string> = {
  procedure: 'Procedure',
  prePayment: 'Pre-payment',
  transfer: 'Transfer',
  aaFee: 'AA fee',
}

export function LedgerScreen({ anaesthetistId }: { anaesthetistId: string }) {
  const navigate = useNavigate()
  const billing = useAppStore((s) => s.billing)
  const weeksOfRow = (id: string): string => [...new Set(paymentWeeksForPair({ billing }, id).map((w) => w.week).filter((w): w is string => w !== undefined))].join(', ')
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const xero = useAppStore((s) => s.xero)
  const [filter, setFilter] = useState<RowFilter>('open')
  const one = useMemo(() => anaesthetistLedgerPosition({ billing }, anaesthetistId), [billing, anaesthetistId])
  const unmatched = useMemo(() => unmatchedReceiptRows({ billing }), [billing])
  const rows = useMemo(
    () => ledgerRows({ billing, masters, schedule, xero }, { anaesthetistId, openOnly: filter === 'open' }).filter(
        // A credited pair is closed: nothing is outstanding on it (catch-up Phase 39), so Open leaves it out.
        (row) => filter !== 'open' || billing.ledger[row.id] === undefined || !isCreditedPair(billing.ledger[row.id]!),
      ),
    [billing, masters, schedule, xero, anaesthetistId, filter],
  )
  const surname = drSurname(masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId)

  // The footer totals the pairs; a transfer moves money already counted on its prepayment pair, so it is left out.
  const totals = useMemo(() => ledgerRowTotals(rows), [rows])
  const pageSize = FULL_SCALE.pageSizes.ledger
  const [page, setPage] = useState(1)
  const pageRows = useMemo(() => pageOf(rows, pageSize, page), [rows, pageSize, page])
  useScreenTiming('ledger', [rows, page])

  function openRow(row: LedgerRow) {
    if (row.kind === 'aaFee') navigate(financePath('aa-fees'))
    else if (row.invoiceId !== undefined) navigate(invoicePath(row.invoiceId))
  }

  const sub = (
    <span data-shot="ledger-system-of-record">
      The Billing Engine's ledger is AA's system of record: each invoice is a receivable from the billable party and a linked payable to the anaesthetist. Xero mirrors it.
    </span>
  )

  // One anaesthetist's account is a record under Ledger: Back to the Ledger, no tab strip.
  return (
    <AdminPage mode="fluid" title="Ledger" sub={sub} back={{ label: 'Ledger', to: financePath('ledger'), shot: 'ledger-back' }}>
      <BalanceIndicator
        inBalance={one.inBalance}
        headline={one.inBalance ? `${surname}'s ledger is in balance` : `${surname}'s ledger is out of balance by ${formatCurrency(one.imbalance)}`}
        equation={`Collected ${formatCurrency(one.collected)} and held receipts ${formatCurrency(one.unmatchedHeld)} less paid out ${formatCurrency(one.paidOut)} and due now ${formatCurrency(one.dueNow)} = ${formatCurrency(one.imbalance)}`}
        checks={one.checks}
        unmatched={unmatched}
        rows={billing.ledger}
      />

      <div data-shot="ledger-tiles" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr) minmax(0, 2fr)', gap: 12 }} data-shot-scope="anaesthetist">
        <Card title={`AA owes ${surname}`} shot="ledger-aa-owes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <StatTile variant="quiet" label="Due now" value={formatCurrency(one.dueNow)} sub="AA holds it, ready to pay out" />
            <StatTile variant="quiet" label="Awaiting collection" value={formatCurrency(one.awaitingCollection)} sub="Billed, not yet paid by the payer" />
            <StatTile variant="quiet" label="Total" value={formatCurrency(one.owedToThem)} />
          </div>
        </Card>
        <Card title={`${surname} owes AA`} shot="ledger-owes-aa">
          <StatTile
            variant="quiet"
            label="Unpaid AA fees"
            value={formatCurrency(one.theyOweAa)}
            sub={<TextAction size="sm" flush onClick={() => navigate(financePath('aa-fees'))}>Monthly fee invoices</TextAction>}
          />
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignContent: 'start' }}>
          <StatTile variant="outlined" label="Collected for them" value={formatCurrency(one.collected)} />
          <StatTile variant="outlined" label="Paid out to them" value={formatCurrency(one.paidOut)} />
        </div>
      </div>

      <StillToNetNotice anaesthetistId={anaesthetistId} surname={surname} />
      <LedgerPaymentRuns anaesthetistId={anaesthetistId} />
      <CreditTrails anaesthetistId={anaesthetistId} surname={surname} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PageHeader
          size="section"
          level={2}
          title={`${surname}'s pairs`}
          actions={
            <FilterPills
              ariaLabel="Which pairs"
              value={filter}
              onSelect={(v) => {
                setFilter(v)
                setPage(1)
              }}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'all', label: 'All' },
              ]}
            />
          }
        />
        {rows.length === 0 ? (
          <EmptyState variant="card" shot="ledger-pairs">{filter === 'open' ? 'Nothing outstanding or waiting to be paid out.' : 'No pairs yet.'}</EmptyState>
        ) : (
          <TableShell label="Ledger pairs" shot="ledger-pairs" density="dense">
            <thead>
              <tr>
                <Th>Receivable</Th>
                <Th>Payable</Th>
                <Th>Kind</Th>
                <Th>Patient</Th>
                <Th>Payer</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Received</Th>
                <Th align="right">Released</Th>
                <Th align="right" nowrap>Paid out</Th>
                <Th>Xero</Th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <ClickableRow key={row.id} onOpen={() => openRow(row)} data-pair-id={row.id} data-pair-kind={row.kind}>
                  <Td mono nowrap>{row.receivableNumber ?? 'None'}</Td>
                  <Td mono nowrap>{row.payableNumber ?? 'None'}</Td>
                  <Td nowrap>
                    {KIND_TEXT[row.kind]}
                    {row.kind === 'transfer' && row.fromNumber !== undefined && <div style={{ fontSize: 11, color: neutral.mist }}>From {row.fromNumber}</div>}
                    {/* A credited pair (catch-up Phase 39): derived from the pair's credit, neutral, never red. */}
                    {billing.ledger[row.id] !== undefined && isCreditedPair(billing.ledger[row.id]!) && (
                      <div style={{ marginTop: 2 }}>
                        <Pill tone="neutral" size="sm" shot="ledger-pair-credited">{CREDIT_LABELS.credited}</Pill>
                      </div>
                    )}
                  </Td>
                  <Td clip style={{ maxWidth: 130 }}>{row.patientName ?? ''}</Td>
                  <Td clip style={{ maxWidth: 150 }}>{row.payerName ?? ''}</Td>
                  <Td align="right" mono>{formatCurrency(row.amount)}</Td>
                  <Td align="right" mono>{formatCurrency(row.received)}</Td>
                  <Td align="right" mono>{formatCurrency(row.released)}</Td>
                  <Td align="right" mono>
                    {formatCurrency(row.paidOut)}
                    {/* The week each payout went out in (catch-up Phase 39a; US-10.2.7). */}
                    {weeksOfRow(row.id) !== '' && <div data-shot="ledger-payment-week" style={{ fontSize: 11, color: neutral.mist }}>{weeksOfRow(row.id)}</div>}
                  </Td>
                  <Td nowrap>
                    {row.inXero ? <span style={{ fontSize: 12, color: neutral.slate }}>Mirrored</span> : <Pill tone="warning" size="sm">Not yet in Xero</Pill>}
                    {row.contactArchived && <div style={{ fontSize: 11, color: neutral.mist }}>Contact archived in Xero</div>}
                  </Td>
                </ClickableRow>
              ))}
              <tr style={{ borderTop: `1px solid ${neutral.line}` }}>
                <Td bold colSpan={5}>
                  {plural(rows.length, 'row')}
                  {rows.some((r) => r.kind === 'transfer') && <span style={{ fontWeight: 400, color: neutral.mist }}> · totals leave out transfers</span>}
                </Td>
                <Td align="right" mono bold>{formatCurrency(totals.amount)}</Td>
                <Td align="right" mono bold>{formatCurrency(totals.received)}</Td>
                <Td align="right" mono bold>{formatCurrency(totals.released)}</Td>
                <Td align="right" mono bold>{formatCurrency(totals.paidOut)}</Td>
                <Td> </Td>
              </tr>
            </tbody>
          </TableShell>
        )}
        {rows.length > pageSize && <Pager total={rows.length} size={pageSize} page={page} onPage={setPage} shot="ledger-pager" />}
      </section>

      <div data-shot="ledger-footnotes" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: neutral.mist, maxWidth: ADMIN_PROSE_WIDTH }}>
        <span>One payable per invoice, for the same amount.</span>
        <span>At full practice volume this table pages.</span>
      </div>
    </AdminPage>
  )
}

/** The balance indicator: the one emphatic element on the screen. Semantic tints only (never a status colour, never crimson). */
function BalanceIndicator({
  inBalance,
  headline,
  equation,
  checks,
  unmatched,
  rows,
}: {
  inBalance: boolean
  headline: string
  equation: string
  checks: readonly LedgerCheck[]
  unmatched: readonly UnmatchedReceipt[]
  rows: Readonly<Record<string, LedgerPair>>
}) {
  const navigate = useNavigate()
  const describe = (c: LedgerCheck): { text: string; open?: () => void } => {
    if (c.code === 'unmatchedReceiptHeld') {
      const u = unmatched.find((x) => x.id === c.targetId)
      return { text: `${CHECK_TEXT[c.code]}: ${u?.reference ?? c.targetId}, ${formatCurrency(c.amount)}` }
    }
    const pair = rows[c.targetId]
    const invoiceId = pair !== undefined && isBookingPair(pair) ? pair.invoiceId : undefined
    return { text: `${CHECK_TEXT[c.code]}: ${pair?.receivable.number ?? c.targetId}, ${formatCurrency(c.amount)}`, ...(invoiceId !== undefined ? { open: () => navigate(invoicePath(invoiceId)) } : {}) }
  }
  return (
    <Notice tone={inBalance ? 'success' : 'error'} title={headline} {...(inBalance ? { icon: <CircleCheck size={16} aria-hidden /> } : {})} live="status" shot="ledger-balance" data-in-balance={inBalance ? 'true' : 'false'}>
      <div className="mono" style={{ fontSize: 12.5, marginTop: 2 }}>{equation}</div>
      {checks.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {checks.map((c) => {
            const d = describe(c)
            return (
              <li key={`${c.code}-${c.targetId}`} data-check={c.code} style={{ fontSize: 12.5 }}>
                {d.open !== undefined ? <TextAction size="sm" flush inline onClick={d.open}>{d.text}</TextAction> : d.text}
              </li>
            )
          })}
        </ul>
      )}
    </Notice>
  )
}

/**
 * One anaesthetist's credits (catch-up Phase 39, work item 12; US-08.6.2 "Both
 * sides move"): each credit in the trail's order, debit, credit, contra, new
 * debit. The contra is the negative invoice: offset against the unpaid payable,
 * or an amount that nets in their next payment run (39a nets it). Every number
 * opens its document.
 */
export function CreditTrails({ anaesthetistId, surname }: { anaesthetistId: string; surname: string }) {
  const navigate = useNavigate()
  const billing = useAppStore((s) => s.billing)
  const negatives = useMemo(() => negativeInvoicesFor({ billing }, anaesthetistId), [billing, anaesthetistId])
  if (negatives.length === 0) return null
  // What the negative's contra row says (catch-up Phase 39a): offset at once, netted in which weeks, or what is still to net.
  const nettingNote = (n: NegativeInvoice): string => {
    if (n.status === 'offset' || n.recoveryDue <= 0) return CREDIT_LABELS.offsetDone
    const weeks = [...new Set((n.nettings ?? []).map((x) => paymentWeekFor({ billing }, x.runId)).filter((w): w is string => w !== undefined))]
    const open = negativeOpenAmount({ billing }, n.id)
    if (n.status === 'netted') return `Netted in ${weeks.join(' and ')}`
    return `${CREDIT_LABELS.netsNextRun} · ${formatCurrency(open)}${weeks.length > 0 ? ` (part netted in ${weeks.join(' and ')})` : ''}`
  }
  const number = (text: string, to: string | undefined) =>
    to !== undefined ? (
      <TextAction size="sm" flush onClick={() => navigate(to)}>
        <span className="mono">{text}</span>
      </TextAction>
    ) : (
      <span className="mono">{text}</span>
    )
  const rowsOf = (n: NegativeInvoice) => {
    const original = billing.invoices[n.originalInvoiceId]
    const cn = billing.creditNotes[n.creditNoteId]
    const out: { step: string; record: ReactNode; amount: string; note?: string; kind: string }[] = []
    if (original !== undefined) out.push({ kind: 'debit', step: CREDIT_LABELS.trailDebit, record: number(original.invoiceNumber, invoicePath(original.id)), amount: formatCurrency(original.total) })
    if (cn !== undefined) out.push({ kind: 'credit', step: CREDIT_LABELS.trailCredit, record: number(cn.creditNoteNumber, creditNotePath(cn.id)), amount: formatCurrency(-cn.total) })
    out.push({
      kind: 'contra',
      step: CREDIT_LABELS.trailContra,
      record: number(n.number, cn !== undefined ? creditNotePath(cn.id) : undefined),
      amount: formatCurrency(-n.amount),
      note: nettingNote(n),
    })
    for (const r of replacementsOf({ billing }, n.originalInvoiceId)) out.push({ kind: 'newDebit', step: CREDIT_LABELS.trailNewDebit, record: number(r.invoiceNumber, invoicePath(r.id)), amount: formatCurrency(r.total) })
    return out
  }
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <PageHeader size="section" level={2} title={CREDIT_LABELS.creditsOf(surname)} />
      <TableShell label={CREDIT_LABELS.creditsOf(surname)} shot="ledger-credit-trail" density="dense">
        <thead>
          <tr>
            <Th>{CREDIT_LABELS.trailStep}</Th>
            <Th>{CREDIT_LABELS.trailRecord}</Th>
            <Th align="right">{CREDIT_LABELS.trailAmount}</Th>
            <Th> </Th>
          </tr>
        </thead>
        <tbody>
          {negatives.map((n, g) =>
            rowsOf(n).map((r, i) => (
              <tr
                key={`${n.id}-${i}`}
                data-negative-invoice-id={n.id}
                data-trail-kind={r.kind}
                style={{ borderTop: `1px solid ${i === 0 && g > 0 ? neutral.lineStrong : neutral.line}` }}
              >
                <Td nowrap style={{ color: neutral.slate, fontWeight: 600 }}>{r.step}</Td>
                <Td nowrap>{r.record}</Td>
                <Td align="right" mono nowrap>{r.amount}</Td>
                <Td>
                  {r.note !== undefined && (
                    <span data-shot={n.status === 'toNet' && r.kind === 'contra' ? 'ledger-nets-next-run' : undefined} style={{ fontSize: 12.5, color: neutral.slate }}>
                      {r.note}
                    </span>
                  )}
                </Td>
              </tr>
            )),
          )}
        </tbody>
      </TableShell>
    </section>
  )
}
