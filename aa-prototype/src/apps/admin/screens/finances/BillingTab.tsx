/**
 * The Finances section's Billing tab (build plan Phases 58 and 60; D107, D109,
 * D116; US-13.3.1, US-13.3.2): one table of Bookings under their List, grouped
 * by anaesthetist, opening on Problems, with each problem's reason under the
 * patient's name and its fix beside it. The rail holds the Lists awaiting
 * approval (they open in Review; nothing here approves) and, while a hand-off
 * has alerted, a line to the Xero tab.
 *
 * Its state is the URL (`q`, `show`, `anaesthetist`, `page`), every write a
 * functional `setSearchParams` with replace so two quick edits both land and
 * Back never steps through filters. The page of groups is built once per
 * render from the shared billing status model (`billingStatusesFor`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../../../../store'
import { invoiceAddresseeName } from '../../../../store/selectors'
import { invoicesByBooking } from '../../../../store/indexes'
import { surnameOf } from '../../../../shared/format'
import { FilterPills, NameSearchBox, SelectField } from '../../../../shared/ui'
import { useScreenTiming } from '../../../../shared/scale/useScreenTiming'
import { useAdminOutlet } from '../../outlet'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { FinancesPage } from './FinancesSection'
import { billingStatusesFor } from './financeCounts'
import { billingParamsFrom, billingTabView, summaryLine, type BillingShow } from './billingTabState'
import { BillingTable } from './BillingTable'
import { BillingRail } from './BillingRail'

const SHOW_OPTIONS: readonly { value: BillingShow; label: string }[] = [
  { value: 'problems', label: 'Problems' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
]

/** What a toolbar or pager write changes; `page` alone keeps the filters and pages. */
interface BillingParamPatch {
  q?: string
  show?: BillingShow
  anaesthetist?: string
  page?: number
}

const NO_LISTS: ReadonlySet<string> = new Set()

export function BillingTab() {
  const { actor } = useAdminOutlet()
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const [search, setSearchParams] = useSearchParams()
  const params = useMemo(() => billingParamsFrom(search), [search])
  /** The box shows what was typed (a trailing space included); the view reads it trimmed. */
  const typed = search.get('q') ?? ''

  const update = useCallback(
    (patch: BillingParamPatch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          // Keep the view the office is on: a List opened from elsewhere shows All until a filter says otherwise.
          const show = patch.show ?? billingParamsFrom(prev).show
          const paging = patch.page !== undefined && Object.keys(patch).length === 1
          if (patch.q !== undefined) {
            if (patch.q.trim() === '') next.delete('q')
            else next.set('q', patch.q)
          }
          if (patch.anaesthetist !== undefined) {
            if (patch.anaesthetist === '') next.delete('anaesthetist')
            else next.set('anaesthetist', patch.anaesthetist)
          }
          if (show === 'problems') next.delete('show')
          else next.set('show', show)
          if (paging && patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page))
          else next.delete('page')
          // The legacy shapes (`?problems=1`, `?list=`) go once the office moves on.
          next.delete('problems')
          next.delete('list')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Show all is per List and lasts only while the filters stay as they are.
  const filterKey = `${params.show}|${params.q}|${params.anaesthetistId ?? ''}`
  const [showAllState, setShowAllState] = useState<{ key: string; ids: ReadonlySet<string> }>({ key: filterKey, ids: NO_LISTS })
  const showAll = showAllState.key === filterKey ? showAllState.ids : NO_LISTS
  const setShowAll = useCallback(
    (listId: string, on: boolean) =>
      setShowAllState((prev) => {
        const ids = new Set(prev.key === filterKey ? prev.ids : NO_LISTS)
        if (on) ids.add(listId)
        else ids.delete(listId)
        return { key: filterKey, ids }
      }),
    [filterKey],
  )

  const lists = useMemo(() => billingStatusesFor({ schedule, billing, masters }), [schedule, billing, masters])

  // Who each Booking's invoices are addressed to, for search only: read lazily, never while the box is empty.
  const payerNames = useMemo(() => {
    const nameState = { masters, schedule: { procedures: schedule.procedures }, billing: { invoices: billing.invoices } }
    return (bookingId: string): readonly string[] => (invoicesByBooking(billing.invoices).get(bookingId) ?? []).map((invoice) => invoiceAddresseeName(nameState, invoice))
  }, [masters, schedule.procedures, billing.invoices])

  const view = useMemo(() => billingTabView(lists, params, { showAll, payerNames }), [lists, params, showAll, payerNames])
  useScreenTiming('monitor', [lists, params, showAll])

  const anaesthetists = useMemo(() => {
    const names = new Map<string, string>()
    for (const l of lists) if (!names.has(l.anaesthetistId)) names.set(l.anaesthetistId, l.anaesthetistName)
    return [...names].map(([id, name]) => ({ id, name })).sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.id.localeCompare(b.id))
  }, [lists])

  // A List opened from elsewhere (`?list=`): bring its heading into view, once.
  const landed = useRef<string | undefined>(undefined)
  useEffect(() => {
    const id = params.listId
    if (id === undefined || landed.current === id) return
    const el = document.querySelector(`[data-shot="billing-list-${CSS.escape(id)}"]`)
    if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start', behavior: 'auto' })
    landed.current = id
  }, [params.listId, view])

  return (
    <FinancesPage tab="billing" mode="fit">
      <PageToolbar
        shot="billing-filters"
        end={
          <span className="mono" data-shot="billing-summary">
            {summaryLine(view)}
          </span>
        }
      >
        <NameSearchBox size="pill" width={300} value={typed} onChange={(q) => update({ q })} label="Search by patient, Booking, payer, hospital or anaesthetist" placeholder="Patient, Booking, payer, hospital or anaesthetist" shot="billing-search" />
        <FilterPills ariaLabel="Which Bookings" value={params.show} options={SHOW_OPTIONS} onSelect={(show) => update({ show })} />
        <SelectField label="Anaesthetist" hideLabel size="compact" fill="surface" width={190} value={params.anaesthetistId ?? ''} onChange={(anaesthetist) => update({ anaesthetist })} shot="billing-filter-anaesthetist">
          <option value="">All anaesthetists</option>
          {anaesthetists.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>
      </PageToolbar>
      <PageBody rail={<BillingRail />} railLabel="Awaiting approval and Xero">
        <BillingTable
          view={view}
          params={params}
          actor={actor}
          onShowAll={setShowAll}
          onPage={(page) => update({ page })}
          onShow={(show) => update({ show })}
          onClearSearch={() => update({ q: '', anaesthetist: '' })}
        />
      </PageBody>
    </FinancesPage>
  )
}
