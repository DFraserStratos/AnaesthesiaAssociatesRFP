/**
 * The Finances Ledger tab's three list bodies (build plan Phase 64; D107, D110,
 * US-13.2.1, US-08.3.4, US-08.3.5, US-06.5.1): what the toolbar's segmented
 * control picks for the fit main column. Each renders only the main column's
 * content; `LedgerTab` renders the toolbar, `PageBody` and rail and owns the URL.
 *
 * - Anaesthetists: one row per anaesthetist with their ledger figures and a
 *   Square or Out by pill; a row opens their account
 *   (docs/explorations/finances-section.html, `#p-ledger`).
 * - Invoice pairs: the whole ledger's pairs table, moved from LedgerScreen
 *   (catch-up Phases 36, 39, 39a, 43), its rows built only when it is chosen.
 * - AA Holding account: the Holding account panel without its outer card.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { ledgerRows, ledgerRowTotals, paymentWeeksForPair, useAppStore, type LedgerRow } from '../../../../store'
import { isCreditedPair } from '../../../../domain/billing/ledger'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { EmptyState, Pill } from '../../../../shared/ui'
import { drSurname, formatCurrency, plural } from '../../../../shared/format'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { FULL_SCALE } from '../../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../../components/Pager'
import { HoldingAccountPanel } from '../../components/HoldingAccountPanel'
import { ADMIN_PROSE_WIDTH } from '../../layout'
import { anaesthetistAccountPath, financePath, invoicePath } from './financePaths'

const PAGE_SIZE = FULL_SCALE.pageSizes.ledger

// ---------------------------------------------------------------------------
// Anaesthetists
// ---------------------------------------------------------------------------

export interface AnaesthetistLedgerListRow {
  anaesthetistId: string
  name: string
  billed: number
  paidIntoAa: number
  disbursed: number
  aaOwesThem: number
  theyOweAa: number
  inBalance: boolean
  imbalance: number
}

const ANAESTHETIST_MONEY_COLUMNS = ['Billed for them', 'Paid into AA', 'Disbursed', 'AA owes them', 'They owe AA'] as const

/** One row per anaesthetist, paged at the ledger's page size; a row opens the anaesthetist's account. */
export function AnaesthetistsLedgerList({
  rows,
  page,
  onPage,
  emptyText,
}: {
  rows: readonly AnaesthetistLedgerListRow[]
  page: number
  onPage: (p: number) => void
  emptyText: string
}) {
  const navigate = useNavigate()
  const pageRows = useMemo(() => pageOf(rows, PAGE_SIZE, page), [rows, page])
  if (rows.length === 0) return <EmptyState variant="card" shot="ledger-anaesthetists">{emptyText}</EmptyState>
  return (
    <TableShell
      fit
      label="Anaesthetists"
      shot="ledger-anaesthetists"
      density="dense"
      minWidth={640}
      {...(rows.length > PAGE_SIZE ? { footer: <Pager total={rows.length} size={PAGE_SIZE} page={page} onPage={onPage} lead="Anaesthetists" shot="ledger-anaesthetists-pager" /> } : {})}
    >
      <thead>
        <tr>
          <Th>Anaesthetist</Th>
          {ANAESTHETIST_MONEY_COLUMNS.map((h) => (
            <Th key={h} align="right" nowrap width="1%">{h}</Th>
          ))}
          <Th nowrap width="1%">Balance</Th>
        </tr>
      </thead>
      <tbody>
        {pageRows.map((row) => (
          <ClickableRow key={row.anaesthetistId} onOpen={() => navigate(anaesthetistAccountPath(row.anaesthetistId))} data-anaesthetist-id={row.anaesthetistId}>
            {/* The name alone, as the mock's table has it: the avatar cost the Balance column its room at 1280 (measured). */}
            <Td nowrap bold>{row.name}</Td>
            <Td mono align="right" nowrap>{formatCurrency(row.billed)}</Td>
            <Td mono align="right" nowrap>{formatCurrency(row.paidIntoAa)}</Td>
            <Td mono align="right" nowrap>{formatCurrency(row.disbursed)}</Td>
            <Td mono align="right" nowrap>{formatCurrency(row.aaOwesThem)}</Td>
            <Td mono align="right" nowrap>{formatCurrency(row.theyOweAa)}</Td>
            <Td nowrap data-in-balance={row.inBalance ? 'true' : 'false'}>
              {row.inBalance ? (
                <Pill tone="success" size="sm">Square</Pill>
              ) : (
                <Pill tone="error" size="sm">{`Out by ${formatCurrency(row.imbalance)}`}</Pill>
              )}
            </Td>
          </ClickableRow>
        ))}
      </tbody>
    </TableShell>
  )
}

// ---------------------------------------------------------------------------
// Invoice pairs
// ---------------------------------------------------------------------------

const KIND_TEXT: Record<LedgerRow['kind'], string> = {
  procedure: 'Procedure',
  prePayment: 'Pre-payment',
  transfer: 'Transfer',
  aaFee: 'AA fee',
}

/**
 * The whole ledger's pairs: a receivable and its linked payable per row, with the totals row, the
 * week each payout went out in and the footnotes. `page` null lands on the page holding `highlightId`
 * (opened from an invoice's `?pair=`), else page 1.
 */
export function PairsLedgerList({ filter, highlightId, page, onPage }: { filter: 'open' | 'all'; highlightId: string | null; page: number | null; onPage: (p: number) => void }) {
  const navigate = useNavigate()
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const xero = useAppStore((s) => s.xero)
  const rows = useMemo(
    () =>
      ledgerRows({ billing, masters, schedule, xero }, { openOnly: filter === 'open' }).filter(
        // A credited pair is closed: nothing is outstanding on it (catch-up Phase 39), so Open leaves it out.
        (row) => filter !== 'open' || billing.ledger[row.id] === undefined || !isCreditedPair(billing.ledger[row.id]!),
      ),
    [billing, masters, schedule, xero, filter],
  )
  // The footer totals the pairs; a transfer moves money already counted on its prepayment pair, so it is left out.
  const totals = useMemo(() => ledgerRowTotals(rows), [rows])
  const highlightIndex = highlightId !== null ? rows.findIndex((r) => r.id === highlightId) : -1
  const shownPage = page ?? (highlightIndex >= 0 ? Math.floor(highlightIndex / PAGE_SIZE) + 1 : 1)
  const pageRows = useMemo(() => pageOf(rows, PAGE_SIZE, shownPage), [rows, shownPage])
  // Per shown row, once: the weeks its payouts went out in (catch-up Phase 39a; US-10.2.7) and whether it is credited.
  const shownFacts = useMemo(() => {
    const facts = new Map<string, { weeks: string; credited: boolean }>()
    for (const row of pageRows) {
      const weeks = [...new Set(paymentWeeksForPair({ billing }, row.id).map((w) => w.week).filter((w): w is string => w !== undefined))].join(', ')
      const pair = billing.ledger[row.id]
      facts.set(row.id, { weeks, credited: pair !== undefined && isCreditedPair(pair) })
    }
    return facts
  }, [pageRows, billing])

  function openRow(row: LedgerRow) {
    if (row.kind === 'aaFee') navigate(financePath('aa-fees'))
    else if (row.invoiceId !== undefined) navigate(invoicePath(row.invoiceId))
  }

  return (
    <>
      {rows.length === 0 ? (
        <EmptyState variant="card" shot="ledger-pairs">{filter === 'open' ? 'Nothing outstanding or waiting to be paid out.' : 'No pairs yet.'}</EmptyState>
      ) : (
        <TableShell
          fit
          label="Ledger pairs"
          shot="ledger-pairs"
          density="dense"
          minWidth={1080}
          {...(rows.length > PAGE_SIZE ? { footer: <Pager total={rows.length} size={PAGE_SIZE} page={shownPage} onPage={onPage} shot="ledger-pager" /> } : {})}
        >
          <thead>
            <tr>
              <Th>Receivable</Th>
              <Th>Payable</Th>
              <Th>Kind</Th>
              <Th>Patient</Th>
              <Th>Payer</Th>
              <Th>Payee</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Received</Th>
              <Th align="right">Released</Th>
              <Th align="right" nowrap>Paid out</Th>
              <Th>Xero</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const facts = shownFacts.get(row.id)
              return (
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
                    {facts?.credited === true && (
                      <div style={{ marginTop: 2 }}>
                        <Pill tone="neutral" size="sm" shot="ledger-pair-credited">{CREDIT_LABELS.credited}</Pill>
                      </div>
                    )}
                  </Td>
                  <Td clip style={{ maxWidth: 130 }}>{row.patientName ?? ''}</Td>
                  <Td clip style={{ maxWidth: 150 }}>{row.payerName ?? ''}</Td>
                  <Td nowrap>{row.payeeIsHolding ? 'AA Holding account' : row.payeeAnaesthetistId !== undefined ? drSurname(masters.anaesthetists[row.payeeAnaesthetistId]?.name ?? row.payeeAnaesthetistId) : row.kind === 'aaFee' ? 'AA' : 'None'}</Td>
                  <Td align="right" mono>{formatCurrency(row.amount)}</Td>
                  <Td align="right" mono>{formatCurrency(row.received)}</Td>
                  <Td align="right" mono>{formatCurrency(row.released)}</Td>
                  <Td align="right" mono>
                    {formatCurrency(row.paidOut)}
                    {/* The week each payout went out in (catch-up Phase 39a; US-10.2.7). */}
                    {facts !== undefined && facts.weeks !== '' && <div data-shot="ledger-payment-week" style={{ fontSize: 11, color: neutral.mist }}>{facts.weeks}</div>}
                  </Td>
                  <Td nowrap>
                    {row.inXero ? <span style={{ fontSize: 12, color: neutral.slate }}>Mirrored</span> : <Pill tone="warning" size="sm">Not yet in Xero</Pill>}
                    {row.contactArchived && <div style={{ fontSize: 11, color: neutral.mist }}>Contact archived in Xero</div>}
                  </Td>
                </ClickableRow>
              )
            })}
            <tr style={{ borderTop: `1px solid ${neutral.line}` }}>
              <Td bold colSpan={6}>
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

      <div data-shot="ledger-footnotes" style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: neutral.mist, maxWidth: ADMIN_PROSE_WIDTH }}>
        <span>Receipts held is the money AA holds for anaesthetists, including pre-payments received, which sit in the AA Holding account until the List is authorised.</span>
        <span>One payable per invoice, for the same amount.</span>
        <span>At full practice volume this table pages.</span>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// AA Holding account
// ---------------------------------------------------------------------------

/** The AA Holding account, without its outer card, filling the fit main column (its entries scroll inside). */
export function HoldingLedgerList() {
  return <HoldingAccountPanel bare />
}
