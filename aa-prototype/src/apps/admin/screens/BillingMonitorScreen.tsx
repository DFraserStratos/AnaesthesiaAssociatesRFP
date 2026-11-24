import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBookingWarnings, WarningTriangle } from '../../../shared/warnings'
import { isOpen } from '../../../domain/warnings'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { aaFeeMonthLabel } from '../../../domain/billing/aaFee'
import { needAddressText } from '../../../domain/billing/invoicePresentation'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor, AppState } from '../../../store'
import { isPricedKind } from '../../../store'
import { invoicesByBooking } from '../../../store/indexes'
import {
  billingMonitorView,
  handoffPairsForBooking,
  allAaFeeInvoices,
  monitorOptionsFromSearch,
  payablesDue,
  prepaidLeftOffText,
  retryBillingException,
  retryXeroItemNow,
  startsExpanded,
  useAppStore,
  DEFAULT_MONITOR_SORT,
  MONITOR_EXPAND_ALL_UP_TO,
  type MonitorAuthorisedRow,
  type MonitorAwaitingRow,
  type MonitorBookingRow,
  type MonitorGroup,
  type MonitorListStatus,
  type MonitorSortKey,
  type MonitorStage,
  type PrepaidLeftOff,
} from '../../../store'
import { dayMicroCap, formatCount, formatCurrency, hhmm, plural, shortDay } from '../../../shared/format'
import { FULL_SCALE } from '../../../domain/seed/fullScale/constants'
import { Pager, pageOf, pageParam } from '../components/Pager'
import { useScreenTiming } from '../../../shared/scale/useScreenTiming'
import { Button, Card, CountBadge, DisclosureButton, TickGlyph, EmptyState, FilterDateInput, FilterPills, FormError, Notice, Pill, SelectField, StatTile, TextAction, visuallyHidden, type PillTone } from '../../../shared/ui'
import { ClickableRow, Td, Th, TableShell } from '../../../shared/table'
import { sessionText } from '../../../domain/outOfHours'
import { HoldingAccountPanel } from '../components/HoldingAccountPanel'
import { approvedEventsAwaitingRun } from '../../../store/procedureEventActions'
import { freeFormSubtotal } from '../../../domain/billing/additionalInvoice'
import { creditDetailOf, eventLines } from '../../../domain/billing/procedureEvent'
import { ADDITIONAL_INVOICE_COPY, CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS, PRE_POST_OP_COPY, kindRowText, XERO_FLAG_COPY, XERO_FLAG_LABEL, XERO_FLAG_PAYOUT_LABEL, xeroFlagText } from '../../../shared/procedureEventCopy'
import { correctionQueuedFor } from '../../../store/ledgerSelectors'
import type { Invoice, XeroQueueItem } from '../../../domain/types'
import { XeroConnectionLine, XeroDivergencePanel, XeroQueuePanel } from '../components/XeroPanels'
import { PaymentCyclePanel } from '../components/PaymentCyclePanel'
import { AdminPage, PageBody, PageToolbar } from '../components/AdminPage'

interface BillingMonitorScreenProps {
  actor: Actor
}

/** Under a failure the run raised (not a hand-off fault): what the Retry does (catch-up Phase 25). */
export const RETRY_FROM_LOCK_NOTE = 'Retry rebuilds from the locked record. A wrong price after invoicing is corrected by a credit note and rebill.'

/** The intro (catch-up Phase 37; US-13.3.1, FT-13.3 Confirmed in the Admin App). */
export const BILLING_MONITOR_INTRO =
  'Every list awaiting approval or authorised, by anaesthetist: invoiced, sent, in Xero, or why it failed. Lists awaiting approval open in Review, where they are authorised.'

/** The URL search params this screen owns (filters, sort, expansion); nothing here is stored. */
const PARAM = { anaesthetist: 'anaesthetist', hospital: 'hospital', from: 'from', to: 'to', problems: 'problems', sort: 'sort', list: 'list', open: 'open', shut: 'shut', fold: 'fold', page: 'page' } as const
const FILTER_PARAMS = [PARAM.anaesthetist, PARAM.hospital, PARAM.from, PARAM.to, PARAM.problems] as const

const idsOf = (params: URLSearchParams, key: string): Set<string> => new Set((params.get(key) ?? '').split(',').filter((s) => s !== ''))

/** Columns of every group's table: chevron, then the List's columns; awaiting rows use the same columns. */
const COLUMNS = 11

/**
 * The billing-flow monitor, restyled as the processing monitor (Phase 09;
 * catch-up Phase 37, US-13.3.1). Grouped by anaesthetist: each group lists the
 * anaesthetist's Lists awaiting approval (they open in Review, where approval
 * stays) and their authorised Lists, sortable, each expanding to its pipeline
 * (List authorised, billing run, invoices, emailed, Xero) and per-Booking rows.
 * Filters, sort and expansion live in the URL (`billingMonitorView`'s options),
 * never in the store. A billing-run failure shows its reason and a "Retry"
 * that rebuilds from the lock; a hand-off waiting for Xero is retried by the
 * Xero sync queue, with "Retry now" on its queue row. Nothing here authorises
 * a List or edits a Contract or a Procedure.
 *
 * Proposed product UI, so it carries NO demo badge; only its simulation
 * triggers (in the harness bar's Demo actions on this screen) and the
 * simulated "Run payables in Xero" are badged (convention 13).
 */
export function BillingMonitorScreen({ actor }: BillingMonitorScreenProps) {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [focusListId, setFocusListId] = useState<string | null>(null)

  const options = useMemo(() => monitorOptionsFromSearch(params), [params])
  const view = useMemo(() => billingMonitorView({ schedule, billing, masters, audit }, options), [schedule, billing, masters, audit, options])
  const payablesDueTotal = useMemo(() => payablesDue({ billing }, view.applied.anaesthetistId !== undefined ? { anaesthetistId: view.applied.anaesthetistId } : {}).total, [billing, view.applied.anaesthetistId])
  const opened = idsOf(params, PARAM.open)
  const shut = idsOf(params, PARAM.shut)
  const folded = idsOf(params, PARAM.fold)
  const filtersOn = FILTER_PARAMS.some((k) => params.get(k) !== null)

  /** Write search params, dropping empty ones; `replace` for view toggles so Back is not flooded. */
  function update(changes: Record<string, string | null>, replace = false) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    // A filter or the sort changing returns the groups to page 1 (catch-up Phase 43).
    if (Object.keys(changes).some((k) => (FILTER_PARAMS as readonly string[]).includes(k) || k === PARAM.sort)) next.delete(PARAM.page)
    setParams(next, { replace })
  }

  const isOpen = (row: MonitorAuthorisedRow): boolean => {
    if (row.listId === options.listId) return true
    if (shut.has(row.listId)) return false
    if (opened.has(row.listId)) return true
    return startsExpanded(row, view.authorisedInView, MONITOR_EXPAND_ALL_UP_TO)
  }
  function setOpen(listIds: readonly string[], open: boolean) {
    const o = new Set(opened)
    const s = new Set(shut)
    for (const id of listIds) {
      if (open) {
        o.add(id)
        s.delete(id)
      } else {
        s.add(id)
        o.delete(id)
      }
    }
    update({ [PARAM.open]: [...o].sort().join(','), [PARAM.shut]: [...s].sort().join(','), ...(open ? {} : listIds.includes(options.listId ?? '') ? { [PARAM.list]: null } : {}) }, true)
  }
  function setFolded(anaesthetistId: string, fold: boolean) {
    const f = new Set(folded)
    if (fold) f.add(anaesthetistId)
    else f.delete(anaesthetistId)
    update({ [PARAM.fold]: [...f].sort().join(',') }, true)
  }
  function sortBy(key: MonitorSortKey) {
    const current = view.applied.sort
    const dir = current.key === key ? (current.dir === 'asc' ? 'desc' : 'asc') : key === 'run' || key === 'invoices' ? 'desc' : 'asc'
    update({ [PARAM.sort]: key === DEFAULT_MONITOR_SORT.key && dir === DEFAULT_MONITOR_SORT.dir ? null : `${key}-${dir}` }, true)
  }

  // `?list=` (the invoice rail's link): open that List, bring it into view and ring it briefly.
  useEffect(() => {
    const id = options.listId
    if (id === undefined) return
    const el = document.querySelector(`[data-shot="billing-pipeline-${CSS.escape(id)}"]`)
    if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start', behavior: 'auto' })
    setFocusListId(id)
    const t = window.setTimeout(() => setFocusListId(null), 2000)
    return () => window.clearTimeout(t)
  }, [options.listId])

  function openInReview(listId: string) {
    navigate(`/admin/review/${listId}`, { state: { from: 'billing', search: location.search } })
  }

  function retry(row: MonitorBookingRow) {
    if (row.exceptionId === undefined) return
    const outcome = retryBillingException(useAppStore, actor, row.exceptionId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    // The retry raised the Booking's invoices with their pairs (a split raises two); mirror each in Xero.
    handoffPairsForBooking(useAppStore, row.bookingId)
  }

  // The anaesthetist groups page at 20 (catch-up Phase 43; US-13.3.1, US-15.0.4), after every filter,
  // the sort and Problems only; the tiles above count everything kept, never the page. `?list=`
  // lands on the page that holds its List.
  const groupPageSize = FULL_SCALE.pageSizes.monitorGroups
  const listGroupIndex = options.listId !== undefined ? view.groups.findIndex((g) => g.authorised.some((r) => r.listId === options.listId) || g.awaiting.some((a) => a.list.id === options.listId)) : -1
  const groupPage = listGroupIndex >= 0 ? Math.floor(listGroupIndex / groupPageSize) + 1 : pageParam(params.get(PARAM.page))
  const shownGroups = pageOf(view.groups, groupPageSize, groupPage)
  const groupsPaged = view.groups.length > groupPageSize
  const setGroupPage = (p: number) => update({ [PARAM.page]: p <= 1 ? null : String(p), [PARAM.list]: null }, true)
  useScreenTiming('monitor', [view, groupPage])

  const nothingAtAll = view.anaesthetistOptions.length === 0
  const panelAnaesthetist = view.applied.anaesthetistId

  return (
    <AdminPage mode="fluid" title="Billing monitor" sub={BILLING_MONITOR_INTRO}>
      <XeroConnectionLine />

      {/* Summary tiles: Admin Review's tile anatomy. "With problems" turns its filter on; "Payables due" goes to the payables panel. */}
      <div data-shot="billing-monitor-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <StatTile variant="outlined" label="Awaiting approval" value={formatCount(view.totals.awaiting)} shot="billing-tile-awaiting" />
        <StatTile variant="outlined" label="Authorised" value={formatCount(view.totals.authorised)} shot="billing-tile-authorised" />
        <StatTile
          variant="outlined"
          label="With problems"
          value={formatCount(view.totals.withProblems)}
          {...(view.totals.withProblems > 0 ? { tone: 'warning' as const } : {})}
          sub="Show problems only"
          pressed={view.applied.problemsOnly}
          onClick={() => update({ [PARAM.problems]: view.applied.problemsOnly ? null : '1' })}
          shot="billing-tile-problems"
        />
        <StatTile
          variant="outlined"
          label="Payables due"
          value={formatCurrency(payablesDueTotal)}
          sub="Go to the payment cycle"
          onClick={() => document.querySelector('[data-shot="payment-cycle"]')?.scrollIntoView({ block: 'start' })}
          shot="billing-tile-payables"
        />
      </div>

      <PageToolbar
        shot="billing-monitor-filters"
        end={
          <>
            <span className="mono" data-shot="billing-monitor-count">{plural(view.listsInView, 'list')}</span>
            {filtersOn && (
              <TextAction size="sm" flush onClick={() => update({ [PARAM.anaesthetist]: null, [PARAM.hospital]: null, [PARAM.from]: null, [PARAM.to]: null, [PARAM.problems]: null })} shot="billing-filter-clear">
                Clear filters
              </TextAction>
            )}
          </>
        }
      >
        <SelectField label="Anaesthetist" hideLabel size="compact" fill="surface" width={160} value={view.applied.anaesthetistId ?? ''} onChange={(v) => update({ [PARAM.anaesthetist]: v })} shot="billing-filter-anaesthetist">
          <option value="">All anaesthetists</option>
          {view.anaesthetistOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>
        <SelectField label="Hospital" hideLabel size="compact" fill="surface" width={170} value={view.applied.hospitalId ?? ''} onChange={(v) => update({ [PARAM.hospital]: v })} shot="billing-filter-hospital">
          <option value="">All hospitals</option>
          {view.hospitalOptions.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </SelectField>
        <FilterDateInput label="From" labelPlacement="inline" value={view.applied.fromISO ?? ''} onChange={(v) => update({ [PARAM.from]: v })} shot="billing-filter-from" />
        <FilterDateInput label="To" labelPlacement="inline" value={view.applied.toISO ?? ''} onChange={(v) => update({ [PARAM.to]: v })} shot="billing-filter-to" />
        <FilterPills
          ariaLabel="Which lists"
          value={view.applied.problemsOnly ? 'problems' : 'all'}
          options={[
            { value: 'all', label: 'All lists' },
            { value: 'problems', label: 'Problems only' },
          ]}
          onSelect={(v) => update({ [PARAM.problems]: v === 'problems' ? '1' : null })}
        />
      </PageToolbar>

      <PageBody>
      {/* The Xero panels (catch-up Phase 37): the sync queue and changes made in Xero, which the anaesthetist filter narrows; then the weekly payment cycle (catch-up Phase 39a). */}
      <XeroQueuePanel actor={actor} {...(panelAnaesthetist !== undefined ? { anaesthetistId: panelAnaesthetist } : {})} />
      <XeroDivergencePanel actor={actor} {...(panelAnaesthetist !== undefined ? { anaesthetistId: panelAnaesthetist } : {})} />
      <PaymentCyclePanel actor={actor} />

      <EventsAwaitingRunPanel />

      <AaFeePanel />

      <HoldingAccountPanel />

      <FormError message={error} />

      {nothingAtAll ? (
        <EmptyState variant="inline">No lists are awaiting approval or authorised yet.</EmptyState>
      ) : view.groups.length === 0 ? (
        <EmptyState variant="inline">
          <span data-shot="billing-monitor-empty">
            {view.applied.problemsOnly && view.totals.withProblems === 0 ? 'No problems. Every authorised list has billed, been sent and reached Xero.' : 'No lists match these filters.'}{' '}
          </span>
          {filtersOn && (
            <TextAction size="sm" flush onClick={() => update({ [PARAM.anaesthetist]: null, [PARAM.hospital]: null, [PARAM.from]: null, [PARAM.to]: null, [PARAM.problems]: null })}>
              Clear filters
            </TextAction>
          )}
        </EmptyState>
      ) : (
        <>
        {groupsPaged && <Pager total={view.groups.length} size={groupPageSize} page={groupPage} onPage={setGroupPage} lead="Anaesthetists" shot="billing-monitor-pager" />}
        {shownGroups.map((group) => (
          <AnaesthetistGroup
            key={group.anaesthetistId}
            group={group}
            focusRowListId={options.listId}
            folded={folded.has(group.anaesthetistId) && !group.authorised.some((r) => r.listId === options.listId)}
            onFold={(fold) => setFolded(group.anaesthetistId, fold)}
            sort={view.applied.sort}
            onSort={sortBy}
            isOpen={isOpen}
            onToggle={(row) => setOpen([row.listId], !isOpen(row))}
            onExpandAll={(open) => setOpen(group.authorised.map((r) => r.listId), open)}
            focusListId={focusListId}
            onOpenInReview={openInReview}
            onRetry={retry}
            actor={actor}
          />
        ))}
        {groupsPaged && <Pager total={view.groups.length} size={groupPageSize} page={groupPage} onPage={setGroupPage} lead="Anaesthetists" />}
        </>
      )}
      </PageBody>
    </AdminPage>
  )
}

/** A Booking's credit whose Xero correction waits in the sync queue after a failed attempt (catch-up Phase 39), if any. */
function useFailedCorrection(bookingId: string): { item: XeroQueueItem; creditNoteNumber: string } | undefined {
  const billing = useAppStore((s) => s.billing)
  return useMemo(() => {
    for (const cn of Object.values(billing.creditNotes).sort((a, b) => a.id.localeCompare(b.id))) {
      if (cn.bookingId !== bookingId) continue
      const item = correctionQueuedFor({ billing }, cn.id)
      if (item !== undefined) return { item, creditNoteNumber: cn.creditNoteNumber }
    }
    return undefined
  }, [billing, bookingId])
}

/**
 * "Resolve and retry" on a Booking whose Xero correction failed (catch-up
 * Phase 39; US-08.6.2 "Both sides move"): retries the correction's queue item
 * now (`retryXeroItemNow`), which reverses the original's Xero records and
 * creates the new pairs together, or sets the next try.
 */
export function CorrectionRetry({ bookingId, actor }: { bookingId: string; actor: Actor }) {
  const failed = useFailedCorrection(bookingId)
  const [error, setError] = useState<string | null>(null)
  if (failed === undefined) return null
  function retryNow() {
    if (failed === undefined) return
    const out = retryXeroItemNow(useAppStore, actor, failed.item.id)
    setError(out.ok ? null : out.message)
  }
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <Button variant="primary" size="compact" onClick={retryNow} shot={`billing-correction-retry-${bookingId}`}>
        {CREDIT_LABELS.resolveAndRetry}
      </Button>
      <FormError message={error} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// One anaesthetist's group: awaiting approval first, then authorised Lists
// ---------------------------------------------------------------------------

const SORT_HEADS: { key: MonitorSortKey | null; label: string; align?: 'right' }[] = [
  { key: 'date', label: 'Date · session' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'status', label: 'Status' },
  { key: 'invoices', label: 'Invoices', align: 'right' },
  { key: null, label: 'Sent' },
  { key: null, label: 'Xero' },
  { key: null, label: 'Paid in' },
  { key: null, label: 'Disbursed' },
  { key: 'run', label: 'Run' },
]

function AnaesthetistGroup({
  group,
  focusRowListId,
  folded,
  onFold,
  sort,
  onSort,
  isOpen,
  onToggle,
  onExpandAll,
  focusListId,
  onOpenInReview,
  onRetry,
  actor,
}: {
  group: MonitorGroup
  /** `?list=`: its group shows all its rows, on the page that holds it. */
  focusRowListId?: string | undefined
  folded: boolean
  onFold: (fold: boolean) => void
  sort: { key: MonitorSortKey; dir: 'asc' | 'desc' }
  onSort: (key: MonitorSortKey) => void
  isOpen: (row: MonitorAuthorisedRow) => boolean
  onToggle: (row: MonitorAuthorisedRow) => void
  onExpandAll: (open: boolean) => void
  focusListId: string | null
  onOpenInReview: (listId: string) => void
  onRetry: (row: MonitorBookingRow) => void
  /** The office, for a failed Xero correction's Resolve and retry (catch-up Phase 39). */
  actor: Actor
}) {
  const headingId = `billing-group-${group.anaesthetistId}-name`
  // The first 25 authorised Lists in the sort, then "Show all N" pages them (catch-up Phase 43).
  const rowLimit = FULL_SCALE.pageSizes.monitorListsPerGroup
  const focusIndex = focusRowListId !== undefined ? group.authorised.findIndex((r) => r.listId === focusRowListId) : -1
  const [showAll, setShowAll] = useState(false)
  const [rowPage, setRowPage] = useState(1)
  const expanded = showAll || focusIndex >= rowLimit
  const effectiveRowPage = focusIndex >= rowLimit && !showAll ? Math.floor(focusIndex / rowLimit) + 1 : rowPage
  const capped = group.authorised.length > rowLimit
  const rows = !capped ? group.authorised : expanded ? pageOf(group.authorised, rowLimit, effectiveRowPage) : group.authorised.slice(0, rowLimit)
  const allOpen = group.authorised.length > 0 && group.authorised.every(isOpen)
  return (
    <Card
      shot={`billing-group-${group.anaesthetistId}`}
      headingId={headingId}
      flush
      title={
        <DisclosureButton open={!folded} onToggle={() => onFold(!folded)} style={{ gap: 8 }}>
          {group.name}
        </DisclosureButton>
      }
      aside={
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 400, color: neutral.slate }}>
          {`${group.counts.awaiting} awaiting approval · ${group.counts.authorised} authorised · `}
          <span style={{ color: group.counts.withProblems > 0 ? semantic.warning.onTint : neutral.slate, fontWeight: group.counts.withProblems > 0 ? 600 : 400 }}>{`${group.counts.withProblems} with problems`}</span>
        </span>
      }
      action={
        !folded && group.authorised.length > 1 ? (
          <TextAction size="sm" flush onClick={() => onExpandAll(!allOpen)} shot={`billing-group-expand-${group.anaesthetistId}`}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </TextAction>
        ) : undefined
      }
    >
      {!folded && (
        <TableShell label={`${group.name}: lists`} density="compact" nested minWidth={960} style={{ margin: '0 12px 12px' }}>
          <thead>
            <tr>
              <Th width={28}>
                <span style={visuallyHidden}>Expand</span>
              </Th>
              {SORT_HEADS.map((h) => (
                <Th
                  key={h.label}
                  {...(h.align !== undefined ? { align: h.align } : {})}
                  nowrap
                  {...(h.key !== null
                    ? { sort: { direction: sort.key === h.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none', onSort: () => onSort(h.key!) } as const }
                    : {})}
                >
                  {h.label}
                </Th>
              ))}
              <Th>
                <span style={visuallyHidden}>Action</span>
              </Th>
            </tr>
          </thead>
          {group.awaiting.length > 0 && (
            <tbody>
              {group.awaiting.map((a) => (
                <AwaitingRow key={a.list.id} row={a} onOpenInReview={onOpenInReview} />
              ))}
            </tbody>
          )}
          {rows.map((row) => (
            <AuthorisedRows key={row.listId} row={row} open={isOpen(row)} focused={focusListId === row.listId} onToggle={() => onToggle(row)} onRetry={onRetry} actor={actor} />
          ))}
        </TableShell>
      )}
      {!folded && capped && (
        <div style={{ margin: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {expanded ? (
            <div style={{ flex: 1 }}>
              <Pager total={group.authorised.length} size={rowLimit} page={effectiveRowPage} onPage={(p) => { setShowAll(true); setRowPage(p) }} lead="Lists" shot={`billing-group-pager-${group.anaesthetistId}`} nested />
            </div>
          ) : (
            <TextAction size="sm" flush onClick={() => { setShowAll(true); setRowPage(1) }} shot={`billing-group-show-all-${group.anaesthetistId}`}>
              {`Show all ${formatCount(group.authorised.length)}`}
            </TextAction>
          )}
        </div>
      )}
    </Card>
  )
}

function dateSession(list: { dateISO: string; session: string }): string {
  return `${shortDay(list.dateISO)} · ${sessionText(list.session)}`
}

function AwaitingRow({ row, onOpenInReview }: { row: MonitorAwaitingRow; onOpenInReview: (listId: string) => void }) {
  return (
    <tr data-shot={`billing-awaiting-${row.list.id}`} data-list-id={row.list.id}>
      <Td />
      <Td mono nowrap>{dateSession(row.list)}</Td>
      <Td>{row.hospitalName ?? row.list.hospitalId}</Td>
      <Td>
        <Pill tone="neutral" size="sm">Awaiting approval</Pill>
      </Td>
      <Td mono align="right" nowrap>{plural(row.bookingCount, 'booking')}</Td>
      <Td colSpan={4} style={{ color: neutral.mist }}>
        {row.submittedAtISO !== undefined ? (
          <>
            {'Submitted '}
            <span className="mono">{`${shortDay(row.submittedAtISO)} ${hhmm(row.submittedAtISO)}`}</span>
          </>
        ) : (
          'Submitted, not yet authorised'
        )}
      </Td>
      <Td />
      <Td align="right" nowrap>
        <Button variant="outline" size="compact" onClick={() => onOpenInReview(row.list.id)} shot={`billing-open-in-review-${row.list.id}`}>
          Open in Review
        </Button>
      </Td>
    </tr>
  )
}

const LIST_STATUS_TONE: Record<MonitorListStatus, PillTone> = {
  'Voided in Xero': 'error',
  'Needs attention': 'warning',
  Billing: 'success',
  Complete: 'success',
}

function xeroCell(row: MonitorAuthorisedRow): ReactNode {
  if (row.problems.includes('voidedInXero') || row.problems.includes('amendedInXero') || row.problems.includes('paidAfterCredit')) return <span style={{ color: semantic.error.onTint, fontWeight: 600 }}>Flagged</span>
  if (row.problems.includes('xeroAlert')) return <span style={{ color: semantic.error.onTint, fontWeight: 600 }}>Alert raised</span>
  if (row.problems.includes('waitingForXero')) return <span style={{ color: semantic.warning.onTint, fontWeight: 600 }}>Waiting for Xero</span>
  return <span className="mono">{`${row.inXeroCount} of ${row.invoiceCount} in Xero`}</span>
}

function moneyCounts(row: MonitorAuthorisedRow): { paid: number; disbursed: number; billed: number } {
  const billed = row.bookingRows.filter((b) => b.invoiceIds.length > 0)
  return { billed: billed.length, paid: billed.filter((b) => b.paidInAtISO !== undefined).length, disbursed: billed.filter((b) => b.disbursedAtISO !== undefined).length }
}

function AuthorisedRows({ row, open, focused, onToggle, onRetry, actor }: { row: MonitorAuthorisedRow; open: boolean; focused: boolean; onToggle: () => void; onRetry: (r: MonitorBookingRow) => void; actor: Actor }) {
  const money = moneyCounts(row)
  const detailId = `billing-detail-${row.listId}`
  return (
    <tbody
      data-shot={`billing-pipeline-${row.listId}`}
      data-list-id={row.listId}
      data-problems={row.problems.join(' ')}
      style={focused ? { outline: `2px solid ${accent.base}`, outlineOffset: -2 } : undefined}
    >
      <ClickableRow onOpen={onToggle} style={{ background: open ? neutral.bg : undefined }}>
        <Td>
          <DisclosureButton open={open} controls={detailId} label={`${dateSession(row.list)} details`} onToggle={onToggle} style={{ padding: '0 4px' }} />
        </Td>
        <Td mono nowrap bold>{dateSession(row.list)}</Td>
        <Td>{row.hospitalName ?? row.list.hospitalId}</Td>
        <Td>
          <Pill tone={LIST_STATUS_TONE[row.status]} size="sm">{row.status}</Pill>
        </Td>
        <Td mono align="right">{row.invoiceCount}</Td>
        <Td mono nowrap>{`${row.deliveredCount} of ${row.invoiceCount}`}</Td>
        <Td nowrap>{xeroCell(row)}</Td>
        <Td mono nowrap style={{ color: money.paid > 0 ? semantic.success.onTint : neutral.mist }}>{`${money.paid} of ${money.billed}`}</Td>
        <Td mono nowrap style={{ color: money.disbursed > 0 ? semantic.success.onTint : neutral.mist }}>{`${money.disbursed} of ${money.billed}`}</Td>
        <Td mono nowrap style={{ color: neutral.slate }}>{row.list.billedAtISO !== undefined ? `${shortDay(row.list.billedAtISO)} ${hhmm(row.list.billedAtISO)}` : 'Not yet run'}</Td>
        <Td />
      </ClickableRow>
      {open && (
        <tr id={detailId}>
          <Td colSpan={COLUMNS} style={{ background: neutral.bg, padding: '4px 12px 14px 40px' }}>
            <PipelineDetail row={row} onRetry={onRetry} actor={actor} />
          </Td>
        </tr>
      )}
    </tbody>
  )
}

/** Today's detail, inside an expanded List: the stage strip, the no-address line and the per-Booking table. */
function PipelineDetail({ row, onRetry, actor }: { row: MonitorAuthorisedRow; onRetry: (r: MonitorBookingRow) => void; actor: Actor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ol aria-label="Billing pipeline" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
        {row.stages.map((stage, i) => (
          <li key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StageChip stage={stage} />
            {i < row.stages.length - 1 && <span aria-hidden style={{ color: neutral.lineStrong, fontSize: 13 }}>→</span>}
          </li>
        ))}
      </ol>

      {/* An invoice raised with no invoice address (catch-up Phase 22): the office adds one and sends it from the invoice. */}
      {row.noAddressCount > 0 && row.firstNoAddressInvoiceId !== undefined && (
        <div data-shot="monitor-no-address" style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
          {`${row.noAddressCount === 1 ? '1 invoice' : `${row.noAddressCount} invoices`} ${needAddressText(row.noAddressCount).replace(/^\d+ /, '')}.`}{' '}
          <Link to={`/admin/invoices/${row.firstNoAddressInvoiceId}`} style={{ color: accent.base, fontWeight: 600 }}>
            Add an address and send
          </Link>
        </div>
      )}

      <TableShell label="Bookings on this list" density="compact" nested minWidth={720} style={{ background: neutral.surface }}>
        <thead>
          <tr>
            <Th>Booking</Th>
            <Th>Patient</Th>
            <Th>Status</Th>
            <Th>Detail</Th>
            <Th>
              <span style={visuallyHidden}>Action</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {row.bookingRows.map((bookingRow) => (
            <tr key={bookingRow.bookingId} data-booking-id={bookingRow.bookingId}>
              <Td mono>{bookingRow.bookingId}</Td>
              <Td>
                {bookingRow.patientName}
                <PatientBalanceTriangle bookingId={bookingRow.bookingId} />
              </Td>
              <Td>
                <BookingStatusPill row={bookingRow} />
              </Td>
              <Td>
                <BookingDetail row={bookingRow} />
              </Td>
              <Td align="right">
                {bookingRow.status === 'failed' && (
                  <Button variant="primary" size="compact" onClick={() => onRetry(bookingRow)} shot={`billing-retry-${bookingRow.bookingId}`}>
                    Retry
                  </Button>
                )}
                {/* A failed Xero correction retries on any row, a failed billing row too. */}
                <CorrectionRetry bookingId={bookingRow.bookingId} actor={actor} />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  )
}

/** An event's own invoice (catch-up Phase 39b): raised from a pre-op, post-op or billing event. */
function isEventInvoice(events: AppState['schedule']['procedureEvents'], invoice: Invoice): boolean {
  const kind = invoice.eventId !== undefined ? events[invoice.eventId]?.kind : undefined
  return kind !== undefined && isPricedKind(kind)
}

function BookingDetail({ row }: { row: MonitorBookingRow }) {
  // A Booking's additional invoices (catch-up Phase 38b): each its own invoice, linked to the original.
  // Catch-up Phase 39b: an event's own invoice is `kind: 'additional'` too; told apart by its event's kind.
  // Catch-up Phase 39b: an event's own invoice is `kind: 'additional'` too; told apart by its event's kind (two primitive selectors, so no re-render loop).
  const additionalCount = useAppStore((s) => (invoicesByBooking(s.billing.invoices).get(row.bookingId) ?? []).filter((i) => i.kind === 'additional' && !isEventInvoice(s.schedule.procedureEvents, i)).length)
  const eventInvoiceCount = useAppStore((s) => (invoicesByBooking(s.billing.invoices).get(row.bookingId) ?? []).filter((i) => i.kind === 'additional' && isEventInvoice(s.schedule.procedureEvents, i)).length)
  // A credit's Xero correction that failed and waits in the sync queue (catch-up Phase 39).
  const correction = useFailedCorrection(row.bookingId)
  // A paidAfterCredit flag on the payable reads as a payout (its divergence says which leg).
  const flagLeg = useAppStore((s) => (row.xeroFlag !== undefined ? s.billing.xeroDivergences[row.xeroFlag.divergenceId]?.leg : undefined))
  const correctionLine = correction !== undefined && (
    <span data-shot="monitor-correction-failed" data-credit-note={correction.creditNoteNumber} style={{ color: semantic.warning.onTint }}>
      {`${CREDIT_LABELS.correctionFailed} · ${correction.creditNoteNumber} · ${CREDIT_LABELS.correctionAttempt(correction.item.attempts)} · ${CREDIT_LABELS.nextTry} `}
      <span className="mono">{hhmm(correction.item.nextAttemptAtISO)}</span>
      {correction.item.lastError !== undefined ? `. ${correction.item.lastError}` : ''}
    </span>
  )
  if (row.status === 'failed') {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ color: semantic.error.onTint }}>{row.failure?.message ?? 'Needs manual review.'}</span>
        <span data-shot="monitor-retry-note" style={{ fontSize: 12, color: neutral.slate }}>{RETRY_FROM_LOCK_NOTE}</span>
        {/* A failed Xero correction on the same Booking is said too: its Resolve and retry sits beside Retry. */}
        {correctionLine}
      </span>
    )
  }
  if (correctionLine !== false) return correctionLine
  if (row.xeroFlag !== undefined) {
    return (
      <span data-shot="monitor-xero-flag" style={{ color: semantic.error.onTint }}>
        {`${xeroFlagText(row.xeroFlag.kind, row.xeroFlag.xeroTotal, undefined, flagLeg)} · ${XERO_FLAG_COPY.flaggedForOffice}`}
      </span>
    )
  }
  if (row.waitingForXero !== undefined) {
    return (
      <span data-shot={row.waitingForXero.kind === 'journal' ? 'monitor-journal-fault' : 'monitor-waiting-for-xero'} style={{ color: semantic.warning.onTint }}>
        {`${row.waitingForXero.kind === 'journal' ? 'Transfer journal waiting for Xero' : 'Waiting for Xero'} · attempt ${row.waitingForXero.attempts} · next try `}
        <span className="mono">{hhmm(row.waitingForXero.nextAttemptAtISO)}</span>
        {'. The invoice and its ledger pair stand; the Xero sync queue retries it.'}
      </span>
    )
  }
  if (row.status === 'cancelled') return <span style={{ color: neutral.mist }}>Cancelled · excluded from billing.</span>
  if (row.invoiceIds.length > 0) {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <MoneyDetail row={row} />
        {row.prepaidLeftOff !== undefined && <PrepaidLeftOffLine leftOff={row.prepaidLeftOff} />}
        {additionalCount > 0 && <span data-shot="monitor-additional-invoices" style={{ fontSize: 12, color: neutral.slate }}>{ADDITIONAL_INVOICE_COPY.plusAdditional(additionalCount)}</span>}
        {eventInvoiceCount > 0 && <span data-shot="monitor-event-invoices" style={{ fontSize: 12, color: neutral.slate }}>{PRE_POST_OP_COPY.eventInvoices(eventInvoiceCount)}</span>}
      </span>
    )
  }
  if (row.prepaidLeftOff !== undefined) return <PrepaidLeftOffLine leftOff={row.prepaidLeftOff} />
  return <span style={{ color: neutral.mist }}>No invoice (nothing to bill).</span>
}

const STAGE_TONE: Record<MonitorStage['state'], PillTone> = {
  done: 'success',
  partial: 'warning',
  failed: 'error',
  pending: 'neutral',
}
const STAGE_STATE_TEXT: Record<MonitorStage['state'], string> = {
  done: 'done',
  partial: 'in part',
  failed: 'needs attention',
  pending: 'not yet',
}

/** One pipeline stage; its state is in the text for assistive tech, not only in colour and `title`. */
function StageChip({ stage }: { stage: MonitorStage }) {
  return (
    <Pill tone={STAGE_TONE[stage.state]} size="sm" title={stage.detail} data-stage={stage.key} data-stage-state={stage.state}>
      {stage.label}
      <span style={visuallyHidden}>{`: ${STAGE_STATE_TEXT[stage.state]}. ${stage.detail}`}</span>
    </Pill>
  )
}

/** A prepaid Procedure left off the final invoice (catch-up Phase 27; US-08.2.2, D57): a fact, never an exception. */
function PrepaidLeftOffLine({ leftOff }: { leftOff: PrepaidLeftOff }) {
  return (
    <span data-shot="monitor-prepaid-left-off" style={{ fontSize: 12.5, color: neutral.slate }}>
      {prepaidLeftOffText(leftOff)}
    </span>
  )
}

/** Paid-in / disbursed as two INDEPENDENT dated states (RFP two-state money). */
function MoneyDetail({ row }: { row: MonitorBookingRow }) {
  const n = row.invoiceIds.length
  const paidLabel =
    row.paidInAtISO !== undefined
      ? <>Paid in <TickGlyph size={11} color={semantic.success.onTint} /> {dayMicroCap(row.paidInAtISO.slice(0, 10))}</>
      : row.receivedAmount > 0
        ? `Part paid ${formatCurrency(row.receivedAmount)}`
        : 'Awaiting payment'
  const disbursedLabel =
    row.disbursedAtISO !== undefined
      ? <>Disbursed <TickGlyph size={11} color={semantic.success.onTint} /> {dayMicroCap(row.disbursedAtISO.slice(0, 10))}</>
      : row.disbursedAmount > 0
        ? `Part disbursed ${formatCurrency(row.disbursedAmount)}`
        : 'Not disbursed'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: neutral.slate }}>{plural(n, 'invoice')} raised.</span>
      <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ color: row.paidInAtISO !== undefined ? semantic.success.onTint : neutral.mist }}>{paidLabel}</span>
        <span style={{ color: row.disbursedAtISO !== undefined ? semantic.success.onTint : neutral.mist }}>{disbursedLabel}</span>
      </span>
    </div>
  )
}

const BOOKING_STATUS: Record<string, { label: string; tone: PillTone }> = {
  invoiced: { label: 'Invoiced', tone: 'success' },
  handedOff: { label: 'Handed off', tone: 'success' },
  partPaid: { label: 'Part paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  disbursed: { label: 'Disbursed', tone: 'success' },
  // Catch-up Phase 39: the Booking's invoice was credited in full.
  credited: { label: CREDIT_LABELS.credited, tone: 'neutral' },
  failed: { label: 'Failed', tone: 'error' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'neutral' },
}

function BookingStatusPill({ row }: { row: MonitorBookingRow }) {
  const flagLeg = useAppStore((s) => (row.xeroFlag !== undefined ? s.billing.xeroDivergences[row.xeroFlag.divergenceId]?.leg : undefined))
  // A pair waiting for Xero keeps `invoiced`; surface it, and a change flagged in Xero, as its own pill (catch-up Phase 37).
  const it =
    row.prepaidLeftOff?.all === true && row.invoiceIds.length === 0 && row.status !== 'failed'
      ? { label: 'Prepaid', tone: 'success' as const }
      : row.xeroFlag !== undefined && row.status !== 'failed'
        ? { label: row.xeroFlag.kind === 'paidAfterCredit' && flagLeg === 'payable' ? XERO_FLAG_PAYOUT_LABEL : XERO_FLAG_LABEL[row.xeroFlag.kind], tone: 'error' as const }
        : row.waitingForXero !== undefined && row.status !== 'failed'
          ? row.waitingForXero.alerted
            ? { label: 'Alert raised', tone: 'error' as const }
            : { label: 'Waiting for Xero', tone: 'warning' as const }
          : BOOKING_STATUS[row.status] ?? { label: row.status, tone: 'neutral' as const }
  return (
    <Pill tone={it.tone} size="sm">
      {it.label}
    </Pill>
  )
}

/**
 * Approved events waiting for the next billing run (catch-up Phase 38b), so an
 * approved event is never invisible between its review and its run. Shown only
 * while one waits; each links to its Booking. The run itself is the demo
 * action "Run the next billing run" (the real system's run is scheduled).
 */
function EventsAwaitingRunPanel() {
  const state = useAppStore((s) => s)
  const waiting = approvedEventsAwaitingRun(state)
  if (waiting.length === 0) return null
  return (
    <Notice tone="neutral" icon={false} shot="events-awaiting-run" title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{EVENT_LABELS.awaitingRunTitle} <CountBadge count={waiting.length} mono srNoun="waiting" /></span>}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {waiting.map((e) => {
        const booking = state.schedule.bookings[e.bookingId]
        const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
        const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
        // A credit (catch-up Phase 39) names the invoice it credits and its total, never $0.
        const creditDetail = creditDetailOf(e)
        const credited = creditDetail !== undefined ? state.billing.invoices[creditDetail.originalInvoiceId] : undefined
        return (
          <div key={e.id} data-event-id={e.id} data-kind={e.kind} style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 13 }}>
            {list !== undefined ? (
              <Link to={`/admin/day/${list.dateISO}/bookings/${e.bookingId}`} style={{ color: neutral.ink, fontWeight: 600 }}>{patient?.name ?? e.bookingId}</Link>
            ) : (
              <span style={{ fontWeight: 600 }}>{patient?.name ?? e.bookingId}</span>
            )}
            <span style={{ color: neutral.slate }}>{credited !== undefined ? CREDIT_LABELS.creditsInFull(credited.invoiceNumber) : EVENT_KIND_LABEL[e.kind]}</span>
            <span className="mono" style={{ marginLeft: 'auto', color: neutral.ink }}>{credited !== undefined ? formatCurrency(credited.subtotal) : PRE_POST_OP_COPY.amount(kindRowText(state, e)?.amount ?? freeFormSubtotal(eventLines(e)))} <span style={{ color: neutral.slate }}>{EVENT_LABELS.exGst}</span></span>
          </div>
        )
      })}
      </span>
    </Notice>
  )
}

/** AA's monthly fee invoices at a glance (catch-up Phase 16): separate from the payables above. */
function AaFeePanel() {
  const billing = useAppStore((s) => s.billing)
  const invoices = useMemo(() => allAaFeeInvoices({ billing }), [billing])
  const latestMonth = invoices[0]?.monthISO
  const unpaid = invoices.filter((f) => f.status === 'unpaid')
  const unpaidTotal = unpaid.reduce((sum, f) => sum + f.total, 0)
  return (
    <div data-shot="billing-aa-fee-invoices" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>AA fee invoices</div>
        <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
          {latestMonth === undefined
            ? 'No fee invoices yet.'
            : `Latest month invoiced: ${aaFeeMonthLabel(latestMonth)} · ${unpaid.length} unpaid · ${formatCurrency(unpaidTotal)} incl GST owed to AA.`}
        </div>
      </div>
      <Link
        to="/admin/billing/aa-fees"
        style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.ink, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
      >
        Open AA fee invoices
      </Link>
    </div>
  )
}

/**
 * The patient balance warning on a monitor row (catch-up Phase 40; RV-36):
 * 15a's triangle when the Booking carries the open `patientBalance` warning,
 * read from `useBookingWarnings`, never recomputed. Replaces the old
 * prior-episode tag.
 */
function PatientBalanceTriangle({ bookingId }: { bookingId: string }) {
  const warnings = useBookingWarnings(bookingId)
  const open = useMemo(() => warnings.filter((w) => w.ruleId === 'patientBalance' && isOpen(w)), [warnings])
  if (open.length === 0) return null
  return (
    <span data-shot="billing-patient-balance" style={{ marginLeft: 8 }}>
      <WarningTriangle warnings={open} size="sm" />
    </span>
  )
}
