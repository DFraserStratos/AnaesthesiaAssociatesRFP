/**
 * The Admin Ledger (catch-up Phase 36; US-13.2.1, US-08.3.4, US-08.3.5,
 * FT-08.3). The Billing Engine's own ledger, AA's system of record, at its
 * two scopes: the whole ledger (receivables outstanding, receipts held,
 * payables due, the AA Holding account and disbursed, with the balance
 * indicator, the anaesthetists out of balance and any receipt that matched no
 * invoice) and one anaesthetist (the same view scoped, with who owes whom said
 * in words). Every figure comes from `store/ledgerSelectors.ts`; the maths is
 * `domain/billing/ledger.ts`. No mockup draws a ledger: it extends the Admin
 * Review tile row and table and the Admin Day nav. URL-driven, so Back works.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  allocateUnmatchedReceipt,
  allocationRefusal,
  anaesthetistLedgerPosition,
  anaesthetistsInRosterOrder,
  anaesthetistsOutOfBalanceOf,
  ledgerPositionOf,
  counterpartyName,
  ledgerRows,
  ledgerRowTotals,
  markUnmatchedRefunded,
  negativeInvoicesFor,
  receivableOutstanding,
  replacementsOf,
  unmatchedReceiptRows,
  useAppStore,
  type LedgerRow,
} from '../../../store'
import { isBookingPair, isCreditedPair, type LedgerCheck } from '../../../domain/billing/ledger'
import { Avatar } from '../../../shared/Avatar'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { Button, Card, EmptyState, FilterPills, FormError, Notice, OptionRow, PageHeader, Pill, Segmented, SelectField, StatTile, TextAction, TextArea } from '../../../shared/ui'
import { dateTimeMicroCap, drSurname, formatCurrency, plural } from '../../../shared/format'
import { CREDIT_LABELS } from '../../../shared/procedureEventCopy'
import type { LedgerPair, NegativeInvoice, UnmatchedReceipt } from '../../../domain/types'

type Scope = 'whole' | 'one'
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

export function LedgerScreen({ actor, anaesthetistId }: { actor: Actor; anaesthetistId?: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const highlightId = params.get('pair')
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const xero = useAppStore((s) => s.xero)
  // Opened from an invoice (`?pair=`): show every row, so a paid-out pair is still there to highlight.
  const [filter, setFilter] = useState<RowFilter>(highlightId !== null ? 'all' : 'open')
  const [allocating, setAllocating] = useState<UnmatchedReceipt | null>(null)
  const [refunding, setRefunding] = useState<UnmatchedReceipt | null>(null)

  const scope: Scope = anaesthetistId !== undefined ? 'one' : 'whole'
  const roster = useMemo(() => anaesthetistsInRosterOrder({ masters }), [masters])
  const whole = useMemo(() => ledgerPositionOf({ billing }), [billing])
  const one = useMemo(() => (anaesthetistId !== undefined ? anaesthetistLedgerPosition({ billing }, anaesthetistId) : undefined), [billing, anaesthetistId])
  const outOfBalance = useMemo(() => anaesthetistsOutOfBalanceOf({ billing, masters }), [billing, masters])
  const unmatched = useMemo(() => unmatchedReceiptRows({ billing }), [billing])
  const rows = useMemo(
    () => ledgerRows({ billing, masters, schedule, xero }, { ...(anaesthetistId !== undefined ? { anaesthetistId } : {}), openOnly: filter === 'open' }).filter(
        // A credited pair is closed: nothing is outstanding on it (catch-up Phase 39), so Open leaves it out.
        (row) => filter !== 'open' || billing.ledger[row.id] === undefined || !isCreditedPair(billing.ledger[row.id]!),
      ),
    [billing, masters, schedule, xero, anaesthetistId, filter],
  )
  const surname = anaesthetistId !== undefined ? drSurname(masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId) : ''
  const firstOther = roster[0]?.registrationNumber

  // The footer totals the pairs; a transfer moves money already counted on its prepayment pair, so it is left out.
  const totals = useMemo(() => ledgerRowTotals(rows), [rows])

  function openRow(row: LedgerRow) {
    if (row.kind === 'aaFee') navigate('/admin/billing/aa-fees')
    else if (row.invoiceId !== undefined) navigate(`/admin/invoices/${row.invoiceId}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        size="admin"
        title="Ledger"
        sub="The Billing Engine's own ledger is AA's system of record. Every invoice is a receivable from the billable party and a linked payable to the anaesthetist. Xero mirrors it for receivables and banking."
        subStyle={{ maxWidth: 820 }}
        shot="ledger-system-of-record"
      />

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 320 }}>
        <Segmented
          label="Scope"
          value={scope}
          options={[
            { value: 'whole', label: 'Whole ledger' },
            { value: 'one', label: 'One anaesthetist' },
          ]}
          onChange={(next) => {
            if (next === 'whole') navigate('/admin/ledger')
            else if (anaesthetistId === undefined && firstOther !== undefined) navigate(`/admin/ledger/anaesthetists/${outOfBalance[0]?.anaesthetistId ?? firstOther}`)
          }}
        />
        </div>
        {scope === 'one' && (
          <SelectField label="Anaesthetist" size="compact" fill="surface" value={anaesthetistId ?? ''} onChange={(id) => navigate(`/admin/ledger/anaesthetists/${id}`)} shot="ledger-anaesthetist-select">
            {roster.map((a) => (
              <option key={a.registrationNumber} value={a.registrationNumber}>
                {drSurname(a.name)}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      {scope === 'whole' ? (
        <BalanceIndicator
          inBalance={whole.inBalance}
          headline={whole.inBalance ? 'In balance · receipts held equal payables due' : `Out of balance by ${formatCurrency(whole.imbalance)}`}
          // The equation as the ledger states it (catch-up Phase 39 adds the two credit terms; neither is an imbalance).
          equation={`Receipts held ${formatCurrency(whole.receiptsHeld)} less payables due ${formatCurrency(whole.payablesDue)}, the AA Holding account ${formatCurrency(whole.holdingBalance)} and credits held for payers ${formatCurrency(whole.creditsHeldForPayers)}, plus negative invoices to net ${formatCurrency(whole.recoveryDueFromAnaesthetists)} = ${formatCurrency(whole.imbalance)}`}
          checks={whole.checks}
          unmatched={unmatched}
          rows={billing.ledger}
        />
      ) : (
        one !== undefined && (
          <BalanceIndicator
            inBalance={one.inBalance}
            headline={one.inBalance ? `${surname}'s ledger is in balance` : `${surname}'s ledger is out of balance by ${formatCurrency(one.imbalance)}`}
            equation={`Collected ${formatCurrency(one.collected)} and held receipts ${formatCurrency(one.unmatchedHeld)} less paid out ${formatCurrency(one.paidOut)} and due now ${formatCurrency(one.dueNow)} = ${formatCurrency(one.imbalance)}`}
            checks={one.checks}
            unmatched={unmatched}
            rows={billing.ledger}
          />
        )
      )}

      {scope === 'whole' ? (
        <div data-shot="ledger-tiles" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <StatTile variant="outlined" label="Receivables outstanding" value={formatCurrency(whole.receivablesOutstanding)} sub="Owed by billable parties" />
            <StatTile variant="outlined" label="Receipts held" value={formatCurrency(whole.receiptsHeld)} sub="Money AA holds for anaesthetists" />
            <StatTile
              variant="outlined"
              label="Payables due"
              value={formatCurrency(whole.payablesDue)}
              sub={whole.payablesDue > 0 ? <TextAction size="sm" flush onClick={() => navigate('/admin/billing')}>Run payables in the Billing monitor</TextAction> : 'No payables due'}
            />
            <StatTile variant="outlined" label="Disbursed" value={formatCurrency(whole.disbursed)} sub="Paid out to anaesthetists" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <StatTile variant="outlined" label="Awaiting collection" value={formatCurrency(whole.awaitingCollection)} sub="Billed, not yet paid by the payer" />
            <StatTile
              variant="outlined"
              label="AA Holding account"
              value={formatCurrency(whole.holdingBalance)}
              sub={<TextAction size="sm" flush onClick={() => navigate('/admin/billing')}>Pre-payments for procedures not yet done</TextAction>}
            />
            <StatTile
              variant="outlined"
              label="AA fees outstanding"
              value={formatCurrency(whole.aaFees.outstanding)}
              sub={<TextAction size="sm" flush onClick={() => navigate('/admin/billing/aa-fees')}>Unpaid monthly fee invoices</TextAction>}
            />
            <StatTile variant="outlined" label="Not yet in Xero" value={String(whole.notInXero)} sub={whole.notInXero === 1 ? 'pair waiting for its mirror' : 'pairs waiting for their mirror'} />
          </div>
          {/* The credit terms (catch-up Phase 39; US-08.6.5, OQ-42): what payers paid on credited invoices, and what was paid out on them to net. */}
          <div data-shot="ledger-credit-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <StatTile variant="outlined" label={CREDIT_LABELS.creditsHeldForPayers} value={formatCurrency(whole.creditsHeldForPayers)} sub={CREDIT_LABELS.creditsHeldSub} />
            <StatTile variant="outlined" label={CREDIT_LABELS.negativeToNet} value={formatCurrency(whole.recoveryDueFromAnaesthetists)} sub={CREDIT_LABELS.negativeToNetSub} />
          </div>
        </div>
      ) : (
        one !== undefined && (
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
                sub={<TextAction size="sm" flush onClick={() => navigate('/admin/billing/aa-fees')}>Monthly fee invoices</TextAction>}
              />
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignContent: 'start' }}>
              <StatTile variant="outlined" label="Collected for them" value={formatCurrency(one.collected)} />
              <StatTile variant="outlined" label="Paid out to them" value={formatCurrency(one.paidOut)} />
            </div>
          </div>
        )
      )}

      {scope === 'whole' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PageHeader size="section" level={2} title="Anaesthetists out of balance" />
          {outOfBalance.length === 0 ? (
            <EmptyState variant="card" shot="ledger-anaesthetists-out-of-balance">Every anaesthetist's ledger is in balance.</EmptyState>
          ) : (
            <TableShell label="Anaesthetists out of balance" shot="ledger-anaesthetists-out-of-balance">
              <thead>
                <tr>
                  <Th>Anaesthetist</Th>
                  <Th align="right">Out by</Th>
                  <Th>Why</Th>
                  <Th align="right"> </Th>
                </tr>
              </thead>
              <tbody>
                {outOfBalance.map((row) => (
                  <ClickableRow key={row.anaesthetistId} onOpen={() => navigate(`/admin/ledger/anaesthetists/${row.anaesthetistId}`)} data-anaesthetist-id={row.anaesthetistId}>
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={masters.anaesthetists[row.anaesthetistId]?.name ?? row.name} size={28} />
                        <span style={{ fontWeight: 600 }}>{row.name}</span>
                      </span>
                    </Td>
                    <Td align="right" mono bold>{formatCurrency(row.imbalance)}</Td>
                    <Td>{row.checks.map((c) => `${CHECK_TEXT[c.code]}, ${formatCurrency(c.amount)}`).join('; ')}</Td>
                    <Td align="right">
                      <TextAction size="sm" flush onClick={() => navigate(`/admin/ledger/anaesthetists/${row.anaesthetistId}`)}>Open</TextAction>
                    </Td>
                  </ClickableRow>
                ))}
              </tbody>
            </TableShell>
          )}
        </section>
      )}

      {scope === 'whole' && unmatched.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PageHeader size="section" level={2} title="Receipts with no matching invoice" />
          <TableShell label="Receipts with no matching invoice" shot="ledger-unmatched">
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>Reference</Th>
                <Th>Named anaesthetist</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th align="right"> </Th>
              </tr>
            </thead>
            <tbody>
              {unmatched.map((u) => (
                <tr key={u.id} data-unmatched-id={u.id} style={{ borderTop: `1px solid ${neutral.line}` }}>
                  <Td nowrap>{dateTimeMicroCap(u.atISO)}</Td>
                  <Td mono>{u.reference}</Td>
                  <Td>{u.anaesthetistId !== undefined ? drSurname(masters.anaesthetists[u.anaesthetistId]?.name ?? u.anaesthetistId) : 'None'}</Td>
                  <Td align="right" mono>{formatCurrency(u.amount)}</Td>
                  <Td>
                    {u.status === 'held' ? (
                      <Pill tone="warning" size="sm">Held</Pill>
                    ) : u.status === 'allocated' ? (
                      <Pill tone="success" size="sm">Allocated to {billing.ledger[u.allocatedToPairId ?? '']?.receivable.number ?? 'an invoice'}</Pill>
                    ) : (
                      <Pill tone="neutral" size="sm" title={u.note}>Refunded{u.note !== undefined ? `: ${u.note}` : ''}</Pill>
                    )}
                  </Td>
                  <Td align="right" nowrap>
                    {u.status === 'held' && (
                      <span style={{ display: 'inline-flex', gap: 14 }}>
                        <TextAction size="sm" flush onClick={() => setAllocating(u)} shot="ledger-allocate">Allocate to invoice</TextAction>
                        <TextAction size="sm" flush onClick={() => setRefunding(u)} shot="ledger-refund">Mark refunded</TextAction>
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      {scope === 'one' && anaesthetistId !== undefined && <CreditTrails anaesthetistId={anaesthetistId} surname={surname} />}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <PageHeader size="section" level={2} title={scope === 'whole' ? 'Pairs' : `${surname}'s pairs`} />
          <FilterPills
            ariaLabel="Which pairs"
            value={filter}
            onSelect={setFilter}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
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
                {scope === 'whole' && <Th>Payee</Th>}
                <Th align="right">Amount</Th>
                <Th align="right">Received</Th>
                <Th align="right">Released</Th>
                <Th align="right" nowrap>Paid out</Th>
                <Th>Xero</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ClickableRow
                  key={row.id}
                  onOpen={() => openRow(row)}
                  today={highlightId === row.id}
                  {...(highlightId === row.id ? { 'data-highlighted': 'true' } : {})}
                  data-pair-id={row.id}
                  data-pair-kind={row.kind}
                >
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
                  {scope === 'whole' && (
                    <Td nowrap>{row.payeeIsHolding ? 'AA Holding account' : row.payeeAnaesthetistId !== undefined ? drSurname(masters.anaesthetists[row.payeeAnaesthetistId]?.name ?? row.payeeAnaesthetistId) : row.kind === 'aaFee' ? 'AA' : 'None'}</Td>
                  )}
                  <Td align="right" mono>{formatCurrency(row.amount)}</Td>
                  <Td align="right" mono>{formatCurrency(row.received)}</Td>
                  <Td align="right" mono>{formatCurrency(row.released)}</Td>
                  <Td align="right" mono>{formatCurrency(row.paidOut)}</Td>
                  <Td nowrap>
                    {row.inXero ? <span style={{ fontSize: 12, color: neutral.slate }}>Mirrored</span> : <Pill tone="warning" size="sm">Not yet in Xero</Pill>}
                    {row.contactArchived && <div style={{ fontSize: 11, color: neutral.mist }}>Contact archived in Xero</div>}
                  </Td>
                </ClickableRow>
              ))}
              <tr style={{ borderTop: `1px solid ${neutral.line}` }}>
                <Td bold colSpan={scope === 'whole' ? 6 : 5}>
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
      </section>

      <div data-shot="ledger-footnotes" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: neutral.mist, maxWidth: 820 }}>
        <span>Receipts held is the money AA holds for anaesthetists, including pre-payments received, which sit in the AA Holding account until the List is authorised.</span>
        <span>One payable per invoice, for the same amount.</span>
        <span>At around 28,000 invoices a year this table pages.</span>
      </div>

      <AllocateDialog key={`allocate-${allocating?.id ?? 'none'}`} receipt={allocating} actor={actor} onClose={() => setAllocating(null)} />
      <RefundDialog key={`refund-${refunding?.id ?? 'none'}`} receipt={refunding} actor={actor} onClose={() => setRefunding(null)} />
    </div>
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
    return { text: `${CHECK_TEXT[c.code]}: ${pair?.receivable.number ?? c.targetId}, ${formatCurrency(c.amount)}`, ...(invoiceId !== undefined ? { open: () => navigate(`/admin/invoices/${invoiceId}`) } : {}) }
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

function AllocateDialog({ receipt, actor, onClose }: { receipt: UnmatchedReceipt | null; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const [error, setError] = useState<string | null>(null)
  const options = useMemo(() => {
    if (receipt === null) return []
    const open = Object.values(billing.ledger).filter((p) => isBookingPair(p) && allocationRefusal({ billing }, receipt.id, p.id) === null)
    // The named anaesthetist's receivables first, when the receipt names one.
    return open
      .map((p) => {
        const pair = p as Extract<typeof p, { kind: 'procedure' | 'prePayment' }>
        return { pair, named: receipt.anaesthetistId !== undefined && pair.anaesthetistId === receipt.anaesthetistId }
      })
      .sort((a, b) => Number(b.named) - Number(a.named) || a.pair.receivable.number.localeCompare(b.pair.receivable.number))
  }, [billing, receipt])

  function allocate(pairId: string) {
    if (receipt === null) return
    const out = allocateUnmatchedReceipt(useAppStore, actor, receipt.id, pairId)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onClose()
  }

  return (
    <Overlay open={receipt !== null} onClose={onClose}>
      <div data-shot="ledger-allocate-dialog" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Allocate to invoice" description={receipt !== null ? `${formatCurrency(receipt.amount)} received ${dateTimeMicroCap(receipt.atISO)}, reference ${receipt.reference}. Choose the invoice it pays; only invoices whose balance covers it are listed.` : undefined} />
        {options.length === 0 ? (
          <EmptyState variant="inline">No open invoice has a balance that covers this receipt. Mark it refunded instead.</EmptyState>
        ) : (
          <div role="list" aria-label="Invoices this receipt can pay" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {options.map(({ pair, named }) => (
              <div key={pair.id} role="listitem">
                {/* The named anaesthetist's invoices come first, marked "Named" (the receipt's reference names them). */}
                <OptionRow
                  onClick={() => allocate(pair.id)}
                  data-allocate-pair={pair.id}
                  trailing={
                    <span className="mono">
                      {named && <span style={{ fontFamily: 'inherit', marginRight: 8 }}>Named</span>}
                      {formatCurrency(receivableOutstanding(pair))}
                    </span>
                  }
                >
                  <span className="mono">{pair.receivable.number}</span>
                  {' · '}
                  {billing.invoices[pair.invoiceId]?.billedTo?.name ?? (pair.receivable.counterparty.kind === 'anaesthetist' ? '' : counterpartyName({ masters }, pair.receivable.counterparty, pair.bookingId))}
                  {' · '}
                  <span style={{ color: neutral.slate }}>{pair.anaesthetistId !== undefined ? drSurname(masters.anaesthetists[pair.anaesthetistId]?.name ?? '') : 'AA Holding account'}</span>
                </OptionRow>
              </div>
            ))}
          </div>
        )}
        <FormError message={error} />
        <SheetActions primary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>} />
      </div>
    </Overlay>
  )
}

function RefundDialog({ receipt, actor, onClose }: { receipt: UnmatchedReceipt | null; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function refund() {
    if (receipt === null) return
    const out = markUnmatchedRefunded(useAppStore, actor, receipt.id, note)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setNote('')
    setError(null)
    onClose()
  }

  return (
    <Overlay open={receipt !== null} onClose={onClose}>
      <div data-shot="ledger-refund-dialog" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Mark refunded" description={receipt !== null ? `${formatCurrency(receipt.amount)}, reference ${receipt.reference}. Say how the money went back.` : undefined} />
        <TextArea label="Note" value={note} onChange={setNote} />
        <FormError message={error} />
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
          primary={<Button variant="primary" size="desktop" block onClick={refund} shot="ledger-refund-confirm">Mark refunded</Button>}
        />
      </div>
    </Overlay>
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
    if (original !== undefined) out.push({ kind: 'debit', step: CREDIT_LABELS.trailDebit, record: number(original.invoiceNumber, `/admin/invoices/${original.id}`), amount: formatCurrency(original.total) })
    if (cn !== undefined) out.push({ kind: 'credit', step: CREDIT_LABELS.trailCredit, record: number(cn.creditNoteNumber, `/admin/credit-notes/${cn.id}`), amount: formatCurrency(-cn.total, { sign: 'always' }) })
    out.push({
      kind: 'contra',
      step: CREDIT_LABELS.trailContra,
      record: number(n.number, cn !== undefined ? `/admin/credit-notes/${cn.id}` : undefined),
      amount: formatCurrency(-n.amount, { sign: 'always' }),
      note: n.status === 'toNet' && n.recoveryDue > 0 ? `${CREDIT_LABELS.netsNextRun} · ${formatCurrency(n.recoveryDue)}` : CREDIT_LABELS.offsetDone,
    })
    for (const r of replacementsOf({ billing }, n.originalInvoiceId)) out.push({ kind: 'newDebit', step: CREDIT_LABELS.trailNewDebit, record: number(r.invoiceNumber, `/admin/invoices/${r.id}`), amount: formatCurrency(r.total) })
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
