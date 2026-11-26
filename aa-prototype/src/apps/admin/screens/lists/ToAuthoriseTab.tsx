/**
 * Lists › To authorise (US-07.2.4; US-13.1.3): every submitted List waiting for the office, oldest
 * submitted first (`toAuthoriseRows`), so the office works through them in the order they arrived.
 * Each row says what needs a closer look (Procedures that need a price, Contract changes to approve,
 * other review flags, the anaesthetist's changes since submitting) and opens the List's review page
 * (`reviewPath`), the only place a List is authorised. A search (anaesthetist, surgeon or hospital),
 * a List date and Needs a look narrow it, all in the URL (`useListParams`).
 *
 * The rail shows where authorised Lists went (the billing run raises a List's invoices the moment it
 * is authorised; Finances › Billing follows them) and points to Finances › Payments, where the
 * events on Procedures awaiting approval now live (docs/explorations/lists-ideas.html, idea A).
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fontFamily, neutral } from '../../../../theme/tokens'
import { billedLists, invoiceCountsByList, useAppStore } from '../../../../store'
import { useScreenTiming } from '../../../../shared/scale/useScreenTiming'
import { dayMicroCap, hhmm, plural, shortDay, stampText } from '../../../../shared/format'
import type { List } from '../../../../domain/types'
import { Card, EmptyState, FilterPills, NameSearchBox, Pill, SelectField, TextAction } from '../../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { ChangedSinceSubmittedPill } from '../../components/ChangedSinceSubmitted'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { listShortLabel, listSourceLabels } from '../../util'
import { financePath } from '../finances/financePaths'
import { useEventsAwaitingApprovalCount } from '../finances/EventsAwaitingApproval'
import { useListParams } from '../../useListParams'
import { filterToAuthorise, toAuthoriseRows, type ToAuthoriseNeeds } from './toAuthoriseRows'
import { reviewPath } from './listsPaths'
import { ListsPage } from './ListsSection'

/** The tab's URL state: `q` the search, `date` one List date, `look=1` Needs a look only. */
const DEFAULTS = { q: '', date: '', look: '' } as const

/** Lists per page; the backlog is a few dozen at most, so the pager rarely shows. */
const PAGE_SIZE = 25

/** How many recently authorised Lists the rail shows. */
const RECENT_SHOWN = 6

export function ToAuthoriseTab() {
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const clock = useAppStore((s) => s.clock)
  const { get, set } = useListParams(DEFAULTS)
  const q = get('q')
  const dateISO = get('date')
  const look = get('look') === '1'

  // Review's flag selectors read the whole state: rebuilt when the slices they read change.
  const rows = useMemo(() => toAuthoriseRows({ ...useAppStore.getState(), schedule, billing, masters, audit, clock }), [schedule, billing, masters, audit, clock])
  const lookCount = useMemo(() => rows.filter((r) => r.needsALook).length, [rows])
  const dates = useMemo(() => [...new Set(rows.map((r) => r.list.dateISO))].sort(), [rows])
  const shown = useMemo(() => filterToAuthorise(rows, { q, dateISO, look }, masters), [rows, q, dateISO, look, masters])
  const page = pageWindow(shown.length, PAGE_SIZE, pageParam(get('page'))).page
  const pageRows = pageOf(shown, PAGE_SIZE, page)
  const narrowed = q.trim() !== '' || dateISO !== '' || look

  const recentlyAuthorised = useMemo(() => billedLists({ schedule }).slice(0, RECENT_SHOWN), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])
  // Timed at both scales, paged at 25: its backlog is a few dozen Lists at most (catch-up Phase 43).
  useScreenTiming('review', [rows])

  const onOpen = (listId: string) => navigate(reviewPath(listId))

  return (
    <ListsPage tab="to-authorise" testId="review-queue-screen">
      <PageToolbar
        shot="to-authorise-filters"
        end={
          <span data-shot="to-authorise-count">
            {narrowed ? `${shown.length} of ${plural(rows.length, 'List')}` : plural(rows.length, 'List')} · oldest submitted first
          </span>
        }
      >
        <NameSearchBox size="pill" width={300} value={q} onChange={(v) => set({ q: v })} label="Search by anaesthetist, surgeon or hospital" placeholder="Anaesthetist, surgeon or hospital" shot="to-authorise-search" />
        <SelectField label="List date" hideLabel size="compact" fill="surface" width={170} value={dateISO} onChange={(v) => set({ date: v })} shot="to-authorise-date">
          <option value="">Any List date</option>
          {dates.map((d) => (
            <option key={d} value={d}>{shortDay(d)}</option>
          ))}
        </SelectField>
        <FilterPills
          ariaLabel="Which Lists"
          value={look ? 'look' : 'all'}
          options={[
            { value: 'all', label: <>All <PillCount n={rows.length} /></> },
            { value: 'look', label: <>Needs a look <PillCount n={lookCount} /></> },
          ]}
          onSelect={(v) => set({ look: v === 'look' ? '1' : '' })}
        />
      </PageToolbar>
      <PageBody
        railLabel="Recently authorised"
        rail={
          <>
            <RecentlyAuthorisedCard lists={recentlyAuthorised} invoiceCountByList={invoiceCountByList} />
            <EventsMovedCard />
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyState variant="card" shot="to-authorise-empty">
            Nothing waiting to be authorised. A List shows here once its anaesthetist submits it.
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState
            variant="card"
            shot="to-authorise-none-match"
            action={
              <TextAction size="sm" flush onClick={() => set({ q: '', date: '', look: '' })}>
                Show every List
              </TextAction>
            }
          >
            {look && q.trim() === '' && dateISO === '' ? 'Nothing needs a closer look. Every submitted List is ready to review.' : 'No submitted Lists match.'}
          </EmptyState>
        ) : (
          <TableShell
            fit
            testId="review-queue-table-shell"
            label="To authorise"
            density="compact"
            minWidth={820}
            {...(shown.length > PAGE_SIZE ? { footer: <Pager total={shown.length} size={PAGE_SIZE} page={page} onPage={(p) => set({ page: String(p) })} lead="Lists" shot="to-authorise-pager" /> } : {})}
          >
            <thead>
              <tr>
                <Th nowrap>Anaesthetist · List</Th>
                <Th nowrap>List date</Th>
                <Th align="right" nowrap>Bookings</Th>
                <Th nowrap>Submitted</Th>
                <Th align="right" nowrap>Waiting</Th>
                <Th nowrap>Needs a look</Th>
                <Th nowrap />
              </tr>
            </thead>
            <tbody data-shot="to-authorise-rows">
              {pageRows.map((row) => {
                const { list } = row
                const anaesthetist = masters.anaesthetists[list.anaesthetistId]
                const source = listSourceLabels(list, masters)
                return (
                  <ClickableRow key={list.id} onOpen={() => onOpen(list.id)} data-list-id={list.id} data-needs-a-look={row.needsALook ? 'true' : 'false'}>
                    <Td>
                      <div style={{ fontWeight: 600 }}>{anaesthetist?.name ?? 'Anaesthetist unavailable'}</div>
                      <div style={{ marginTop: 2, fontSize: 12.5, color: neutral.slate }}>
                        {source.primary}
                        {source.secondary !== undefined && <span style={{ color: neutral.mist }}> · {source.secondary}</span>}
                      </div>
                    </Td>
                    <Td mono nowrap>{dayMicroCap(list.dateISO)}</Td>
                    <Td mono bold align="right" nowrap>{row.bookings}</Td>
                    <Td mono nowrap>{row.submittedAtISO !== undefined ? stampText(row.submittedAtISO) : 'Submitted'}</Td>
                    <Td mono align="right" nowrap>{row.waitingDays === undefined ? '' : row.waitingDays === 0 ? 'Today' : plural(row.waitingDays, 'day')}</Td>
                    <Td>
                      <NeedsALook needs={row.needs} />
                    </Td>
                    <Td align="right" nowrap>
                      {/* The row's keyboard handle, named in full; the row click stays for the mouse. */}
                      <TextAction size="sm" flush label={`Review ${anaesthetist?.name ?? 'the'} List, ${source.primary}, ${shortDay(list.dateISO)}`} onClick={() => onOpen(list.id)}>
                        Review →
                      </TextAction>
                    </Td>
                  </ClickableRow>
                )
              })}
            </tbody>
          </TableShell>
        )}
      </PageBody>
    </ListsPage>
  )
}

/** A filter pill's count, in the data face. */
function PillCount({ n }: { n: number }) {
  return <span style={{ marginLeft: 4, fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{n}</span>
}

/** What a List needs a look at, as pills; nothing when it is ready to review. */
function NeedsALook({ needs }: { needs: ToAuthoriseNeeds }) {
  const pills = [
    needs.needsPrice > 0 && (
      <Pill key="price" size="lg" tone="error" shot="to-authorise-needs-price">
        {needs.needsPrice === 1 ? '1 needs a price' : `${needs.needsPrice} need a price`}
      </Pill>
    ),
    needs.contractChanges > 0 && (
      <Pill key="changes" size="lg" tone="warning" shot="to-authorise-contract-changes">
        {plural(needs.contractChanges, 'Contract change')} to approve
      </Pill>
    ),
    needs.changed !== null && <ChangedSinceSubmittedPill key="changed" cue={needs.changed} />,
    needs.flags > 0 && (
      <Pill key="flags" size="lg" tone="warning" variant="outline" shot="to-authorise-flags">
        {plural(needs.flags, 'review flag')}
      </Pill>
    ),
  ].filter(Boolean)
  if (pills.length === 0) return null
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{pills}</div>
}

/**
 * Where authorised Lists went: the billing run raises a List's invoices in the moment it is
 * authorised, so authorising is never a dead end. Finances › Billing follows each one.
 */
function RecentlyAuthorisedCard({ lists, invoiceCountByList }: { lists: List[]; invoiceCountByList: Record<string, number> }) {
  const masters = useAppStore((s) => s.masters)
  return (
    <Card
      data-testid="review-queue-recently-billed"
      title="Recently authorised"
      action={
        <TextAction size="sm" flush to={financePath('billing')} shot="to-authorise-open-billing">
          See in Billing →
        </TextAction>
      }
      style={{ gap: 10 }}
    >
      <div style={{ fontSize: 12.5, color: neutral.slate }}>Authorising a List hands it to the Billing Engine as a unit; its invoices are raised in the same moment.</div>
      {lists.length === 0 ? (
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing authorised yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lists.map((l) => {
            const n = invoiceCountByList[l.id] ?? 0
            return (
              <div key={l.id} style={{ fontSize: 12.5 }}>
                <div style={{ color: neutral.ink, fontWeight: 600 }}>{listShortLabel(l, masters)}</div>
                <div style={{ marginTop: 2, color: neutral.mist }}>
                  <span className="mono">{dayMicroCap(l.dateISO)}</span> · billed <span className="mono">{l.billedAtISO !== undefined ? hhmm(l.billedAtISO) : ''}</span> · {plural(n, 'invoice')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/** Events on Procedures are approved in Finances › Payments, beside the events awaiting the run. */
function EventsMovedCard() {
  const n = useEventsAwaitingApprovalCount()
  return (
    <Card
      title="Events to approve"
      shot="to-authorise-events"
      action={
        <TextAction size="sm" flush to={financePath('payments')} shot="to-authorise-open-payments">
          {n > 0 ? `${n} in Payments →` : 'Open Payments →'}
        </TextAction>
      }
      style={{ gap: 10 }}
    >
      <div style={{ fontSize: 12.5, color: neutral.slate }}>Credits and pre-op, post-op and billing events are approved in Finances › Payments, beside the events awaiting the run.</div>
    </Card>
  )
}
