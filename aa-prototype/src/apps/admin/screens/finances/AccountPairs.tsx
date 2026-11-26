/**
 * One anaesthetist's invoice pairs (build plan Phase 65; US-13.2.1, US-08.3.4, US-08.3.5): the
 * pairs card on the anaesthetist's account page, moved from LedgerScreen's pairs section (catch-up
 * Phases 36, 39, 39a). Each row is a receivable with its linked payable under it, what was billed,
 * paid in and disbursed, and the week each payout went out in; the totals row leaves out transfers.
 *
 * Open (the default) leaves out credited pairs, which are closed; All shows every pair. Opened with
 * `?pair=<pairId>` (from an invoice), the card shows All, lands on the page holding that pair and
 * highlights its row, as the whole ledger's pairs list does (`LedgerLists.tsx`).
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { ledgerRows, ledgerRowTotals, paymentWeeksForPair, useAppStore, type LedgerRow } from '../../../../store'
import { isCreditedPair } from '../../../../domain/billing/ledger'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { Card, EmptyState, FilterPills, Pill } from '../../../../shared/ui'
import { formatCurrency, plural } from '../../../../shared/format'
import { CREDIT_LABELS } from '../../../../shared/procedureEventCopy'
import { FULL_SCALE } from '../../../../domain/seed/fullScale/constants'
import { Pager, pageOf } from '../../components/Pager'
import { financePath, invoicePath } from './financePaths'

type PairFilter = 'open' | 'all'

const PAGE_SIZE = FULL_SCALE.pageSizes.ledger

export function AccountPairs({ anaesthetistId }: { anaesthetistId: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('pair')
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const xero = useAppStore((s) => s.xero)

  // A `?pair=` link shows All so a credited pair can be found; page null lands on the page holding it.
  const [filter, setFilter] = useState<PairFilter>(highlightId !== null ? 'all' : 'open')
  const [page, setPage] = useState<number | null>(null)
  // A new `?pair=` while the card is mounted (another invoice's link) lands afresh.
  const [seenHighlight, setSeenHighlight] = useState(highlightId)
  if (seenHighlight !== highlightId) {
    setSeenHighlight(highlightId)
    if (highlightId !== null) setFilter('all')
    setPage(null)
  }

  const rows = useMemo(
    () =>
      ledgerRows({ billing, masters, schedule, xero }, { anaesthetistId, openOnly: filter === 'open' }).filter(
        // A credited pair is closed: nothing is outstanding on it (catch-up Phase 39), so Open leaves it out.
        (row) => filter !== 'open' || billing.ledger[row.id] === undefined || !isCreditedPair(billing.ledger[row.id]!),
      ),
    [billing, masters, schedule, xero, anaesthetistId, filter],
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
    <Card
      title="Invoice pairs"
      shot="ledger-pairs-card"
      action={
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
    >
      {rows.length === 0 ? (
        <EmptyState shot="ledger-pairs">{filter === 'open' ? 'Nothing outstanding or waiting to be paid out.' : 'No pairs yet.'}</EmptyState>
      ) : (
        <TableShell
          nested
          label="Invoice pairs"
          shot="ledger-pairs"
          density="dense"
          {...(rows.length > PAGE_SIZE ? { footer: <Pager total={rows.length} size={PAGE_SIZE} page={shownPage} onPage={setPage} shot="ledger-pager" /> } : {})}
        >
          <thead>
            <tr>
              <Th>Invoice pair</Th>
              <Th align="right">Billed</Th>
              <Th align="right" nowrap>Paid in</Th>
              <Th align="right">Disbursed</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const facts = shownFacts.get(row.id)
              const highlighted = highlightId === row.id
              return (
                <ClickableRow
                  key={row.id}
                  onOpen={() => openRow(row)}
                  today={highlighted}
                  {...(highlighted ? { 'data-highlighted': 'true' } : {})}
                  data-pair-id={row.id}
                  data-pair-kind={row.kind}
                >
                  <Td nowrap>
                    <div className="mono">{row.receivableNumber ?? 'None'}</div>
                    <div className="mono" style={{ fontSize: 11, color: neutral.mist }}>{row.payableNumber ?? 'None'}</div>
                    {row.kind === 'transfer' && row.fromNumber !== undefined && <div style={{ fontSize: 11, color: neutral.mist }}>From {row.fromNumber}</div>}
                    {/* A credited pair (catch-up Phase 39): derived from the pair's credit, neutral, never red. */}
                    {facts?.credited === true && (
                      <div style={{ marginTop: 2 }}>
                        <Pill tone="neutral" size="sm" shot="ledger-pair-credited">{CREDIT_LABELS.credited}</Pill>
                      </div>
                    )}
                  </Td>
                  <Td align="right" mono>{formatCurrency(row.amount)}</Td>
                  <Td align="right" mono>{formatCurrency(row.received)}</Td>
                  <Td align="right" mono>
                    {formatCurrency(row.paidOut)}
                    {/* The week each payout went out in (catch-up Phase 39a; US-10.2.7). */}
                    {facts !== undefined && facts.weeks !== '' && <div data-shot="ledger-payment-week" style={{ fontSize: 11, color: neutral.mist }}>{facts.weeks}</div>}
                  </Td>
                </ClickableRow>
              )
            })}
            <tr style={{ borderTop: `1px solid ${neutral.line}` }}>
              <Td bold>
                {plural(rows.length, 'row')}
                {rows.some((r) => r.kind === 'transfer') && <span style={{ fontWeight: 400, color: neutral.mist }}> · totals leave out transfers</span>}
              </Td>
              <Td align="right" mono bold>{formatCurrency(totals.amount)}</Td>
              <Td align="right" mono bold>{formatCurrency(totals.received)}</Td>
              <Td align="right" mono bold>{formatCurrency(totals.paidOut)}</Td>
            </tr>
          </tbody>
        </TableShell>
      )}
    </Card>
  )
}
