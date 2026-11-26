/**
 * The Finances section's Ledger tab (build plan Phases 58 and 64; US-13.2.1's tab half, D106, D107,
 * D114, D115; the mock's `#p-ledger`). One sentence says whether the books are square and what is
 * wrong, read from the Day view's reconciliation status (`useReconciliationStatus`, so the tab, the Day
 * view's card and the badge agree); four figures sit two by two beside it in the rail with the receipts
 * to place; the main column is one list at a time, picked by the segmented control: the anaesthetists
 * (one pass over the pairs, `anaesthetistLedgerRowsOf`), the invoice pairs, or the AA Holding account.
 *
 * List state lives in the URL (replace): `list` (anaesthetists, pairs, holding), `q`, `balance` (all,
 * out), `pairs` (open, all) and `page`. `?pair=<id>` (from an invoice) opens Invoice pairs on All, on
 * the page holding it. Each list is built only while it is shown.
 */

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { anaesthetistLedgerRowsOf, ledgerPositionOf, ledgerSentenceFor, receiptsToPlaceOf, useAppStore, useHoldingAccount } from '../../../../store'
import { FilterPills, NameSearchBox, SlidingSegmentedControl } from '../../../../shared/ui'
import { plural } from '../../../../shared/format'
import { useScreenTiming } from '../../../../shared/scale/useScreenTiming'
import { useAdminOutlet } from '../../outlet'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { pageParam } from '../../components/Pager'
import { useReconciliationStatus } from '../../components/ReconciliationCard'
import { FinancesPage } from './FinancesSection'
import { LedgerRail } from './LedgerRail'
import { AnaesthetistsLedgerList, HoldingLedgerList, PairsLedgerList } from './LedgerLists'

type LedgerList = 'anaesthetists' | 'pairs' | 'holding'
type BalanceFilter = 'all' | 'out'
type PairsFilter = 'open' | 'all'

const LISTS: readonly LedgerList[] = ['anaesthetists', 'pairs', 'holding']

export function LedgerTab() {
  const { actor } = useAdminOutlet()
  const [params, setParams] = useSearchParams()
  const highlightId = params.get('pair')
  const listParam = params.get('list')
  // A `?pair=` link lands on Invoice pairs, All.
  const list: LedgerList = highlightId !== null ? 'pairs' : LISTS.includes(listParam as LedgerList) ? (listParam as LedgerList) : 'anaesthetists'
  const q = params.get('q') ?? ''
  const balance: BalanceFilter = params.get('balance') === 'out' ? 'out' : 'all'
  const pairsFilter: PairsFilter = highlightId !== null || params.get('pairs') === 'all' ? 'all' : 'open'
  const pageValue = params.get('page')
  const page = pageParam(pageValue)

  /** Change the URL's list state in place (replace), dropping defaults; any change but paging goes back to page 1. */
  function update(next: Record<string, string | null>, keepPage = false) {
    const out = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') out.delete(k)
      else out.set(k, v)
    }
    if (!keepPage) out.delete('page')
    setParams(out, { replace: true })
  }

  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const status = useReconciliationStatus()
  const holdingAccount = useHoldingAccount()
  const position = useMemo(() => ledgerPositionOf({ billing }), [billing])
  const rows = useMemo(() => anaesthetistLedgerRowsOf({ billing, masters }), [billing, masters])
  const sentence = useMemo(() => ledgerSentenceFor(status, { billing, masters }), [status, billing, masters])
  const toPlace = useMemo(() => receiptsToPlaceOf({ billing }), [billing])

  const outCount = useMemo(() => rows.filter((r) => !r.inBalance).length, [rows])
  const shownRows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const named = needle === '' ? rows : rows.filter((r) => r.name.toLowerCase().includes(needle) || (masters.anaesthetists[r.anaesthetistId]?.name ?? '').toLowerCase().includes(needle))
    // Out of balance: the largest imbalance first; otherwise surname order (the selector's).
    return balance === 'out' ? named.filter((r) => !r.inBalance).sort((a, b) => Math.abs(b.imbalance) - Math.abs(a.imbalance)) : named
  }, [rows, q, balance, masters])

  useScreenTiming('ledger', [list, shownRows, pairsFilter, pageValue])

  const end =
    list === 'anaesthetists' ? (
      <span data-shot="ledger-summary">{`${plural(rows.length, 'anaesthetist')}, ${outCount === 0 ? (rows.length === 1 ? 'square' : 'every one square') : `${outCount} out of balance`}`}</span>
    ) : undefined

  return (
    <FinancesPage tab="ledger" mode="fit" data-ledger-list={list}>
      <PageToolbar {...(end !== undefined ? { end } : {})}>
        <SlidingSegmentedControl
          ariaLabel="Which list"
          size="sm"
          layout="wrap"
          value={list}
          options={[
            { value: 'anaesthetists', label: 'Anaesthetists' },
            { value: 'pairs', label: 'Invoice pairs' },
            { value: 'holding', label: 'AA Holding account' },
          ]}
          onSelect={(next) => update({ list: next === 'anaesthetists' ? null : next, pair: null, q: null, balance: null, pairs: null })}
        />
        {list === 'anaesthetists' && (
          <>
            <NameSearchBox size="pill" label="Anaesthetist" value={q} onChange={(v) => update({ q: v })} shot="ledger-search" />
            <FilterPills
              ariaLabel="Which anaesthetists"
              value={balance}
              onSelect={(v) => update({ balance: v === 'all' ? null : v })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'out', label: 'Out of balance' },
              ]}
            />
          </>
        )}
        {list === 'pairs' && (
          <FilterPills
            ariaLabel="Which pairs"
            value={pairsFilter}
            onSelect={(v) => update({ pairs: v === 'open' ? null : v, pair: null })}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'all', label: 'All' },
            ]}
          />
        )}
      </PageToolbar>
      <PageBody
        railLabel="The books"
        rail={
          <LedgerRail
            actor={actor}
            sentence={sentence}
            inBalance={sentence.square}
            checks={position.checks}
            figures={{
              owedToAa: position.receivablesOutstanding,
              owedToAnaesthetists: position.payablesDue,
              holding: position.holdingBalance,
              holdingBookings: holdingAccount.bookingsCovered,
              receiptsToPlaceTotal: toPlace.total,
              receiptsToPlaceCount: toPlace.count,
            }}
            receipts={toPlace.receipts}
          />
        }
      >
        {list === 'anaesthetists' && (
          <AnaesthetistsLedgerList
            rows={shownRows}
            page={page}
            onPage={(p) => update({ page: String(p) }, true)}
            emptyText={balance === 'out' && q === '' ? 'Every account is square.' : 'No anaesthetist matches.'}
          />
        )}
        {list === 'pairs' && <PairsLedgerList filter={pairsFilter} highlightId={highlightId} page={pageValue === null ? null : page} onPage={(p) => update({ page: String(p) }, true)} />}
        {list === 'holding' && <HoldingLedgerList />}
      </PageBody>
    </FinancesPage>
  )
}
