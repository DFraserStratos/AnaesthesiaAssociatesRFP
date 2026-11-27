/**
 * The Finances section's Xero tab (build plan Phases 58 and 61; D107, D109,
 * D110, D114, D115; US-13.3.2, US-13.3.3): one grouped table opening on Needs
 * action, Hand-offs failing first, then Hand-offs waiting, then Changed
 * directly in Xero, each row with its fix beside it (Retry now, or Resolve in
 * its side panel). What drained after waiting stays folded under the table.
 * The rail holds the connection and a short "What happens here".
 *
 * Its state is the URL (`q`, `show`, `anaesthetist`, `page`), as the Billing
 * tab keeps it: every write a functional `setSearchParams` with replace, the
 * page dropped on any filter change. The page is built once per render from
 * the queue and the open divergences (`xeroTabRows`).
 */

import { useLiveSearchParams } from '../../../../shared/useLiveSearchParams'
import { useCallback, useMemo, useState } from 'react'
import { useAppStore } from '../../../../store'
import { today } from '../../../../domain/clock'
import { surnameOf } from '../../../../shared/format'
import { EmptyState, FilterPills, NameSearchBox, SelectField, TextAction } from '../../../../shared/ui'
import { TableShell } from '../../../../shared/table'
import { useAdminOutlet } from '../../outlet'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager } from '../../components/Pager'
import { XeroConnectionCard, XeroDivergenceRows, XeroQueueRows, XeroSentTable, XeroTableHead, XeroWhatHappensCard } from '../../components/XeroPanels'
import { FinancesPage } from './FinancesSection'
import { GROUP_TITLES, XERO_PAGE_SIZE, xeroParamsFrom, xeroTabRows, type XeroGroupKey, type XeroShow, type XeroTabGroup } from './xeroTabRows'

/** The groups in the table's order. Each stays mounted while the table shows, so a Retry now result or an open Resolve panel outlives its last row. */
const GROUP_ORDER: readonly XeroGroupKey[] = ['failing', 'waiting', 'changed']

const SHOW_OPTIONS: readonly { value: XeroShow; label: string }[] = [
  { value: 'needs-action', label: 'Needs action' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'sent', label: 'Sent after waiting' },
  { value: 'all', label: 'All' },
]

/** What a toolbar or pager write changes; `page` alone keeps the filters and pages. */
interface XeroParamPatch {
  q?: string
  show?: XeroShow
  anaesthetist?: string
  page?: number
}

export function XeroTab() {
  const { actor } = useAdminOutlet()
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const todayISO = useAppStore((s) => today(s.clock))
  const [search, setSearchParams] = useLiveSearchParams()
  const params = useMemo(() => xeroParamsFrom(search), [search])
  /** The box shows what was typed (a trailing space included); the view reads it trimmed. */
  const typed = search.get('q') ?? ''

  const update = useCallback(
    (patch: XeroParamPatch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const show = patch.show ?? xeroParamsFrom(prev).show
          const paging = patch.page !== undefined && Object.keys(patch).length === 1
          if (patch.q !== undefined) {
            if (patch.q.trim() === '') next.delete('q')
            else next.set('q', patch.q)
          }
          if (patch.anaesthetist !== undefined) {
            if (patch.anaesthetist === '') next.delete('anaesthetist')
            else next.set('anaesthetist', patch.anaesthetist)
          }
          if (show === 'needs-action') next.delete('show')
          else next.set('show', show)
          if (paging && patch.page !== undefined && patch.page > 1) next.set('page', String(patch.page))
          else next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const view = useMemo(() => xeroTabRows({ billing, masters, schedule }, params, todayISO), [billing, masters, schedule, params, todayISO])

  const anaesthetists = useMemo(
    () =>
      Object.entries(masters.anaesthetists)
        .map(([id, a]) => ({ id, name: a.name }))
        .sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.id.localeCompare(b.id)),
    [masters.anaesthetists],
  )

  // The folded Sent after waiting list: open on its own pill, otherwise as the office leaves it on this view.
  const [sentFold, setSentFold] = useState<{ show: XeroShow; open: boolean }>({ show: params.show, open: params.show === 'sent' })
  const sentOpen = sentFold.show === params.show ? sentFold.open : params.show === 'sent'
  const toggleSent = () => setSentFold({ show: params.show, open: !sentOpen })

  const narrowed = params.q !== '' || params.anaesthetistId !== undefined
  const hasRows = view.groups.some((g) => g.queue.length > 0 || g.divergences.length > 0)
  const groupOf = (key: XeroGroupKey): XeroTabGroup | undefined => view.groups.find((g) => g.key === key)
  const pager = view.pages > 1 ? <Pager total={view.total} size={XERO_PAGE_SIZE} page={view.page} onPage={(page) => update({ page })} lead="Items" shot="xero-pager" /> : undefined

  return (
    <FinancesPage tab="xero" mode="fit">
      <PageToolbar
        shot="xero-filters"
        end={
          <span className="mono" data-shot="xero-count-line">
            {view.countLine}
          </span>
        }
      >
        <NameSearchBox size="pill" width={300} value={typed} onChange={(q) => update({ q })} label="Search by invoice, payer or anaesthetist" placeholder="Invoice, payer or anaesthetist" shot="xero-search" />
        <FilterPills ariaLabel="Which Xero items" value={params.show} options={SHOW_OPTIONS} onSelect={(show) => update({ show })} />
        <SelectField label="Anaesthetist" hideLabel size="compact" fill="surface" width={190} value={params.anaesthetistId ?? ''} onChange={(anaesthetist) => update({ anaesthetist })} shot="xero-filter-anaesthetist">
          <option value="">All anaesthetists</option>
          {anaesthetists.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </SelectField>
      </PageToolbar>
      <PageBody
        rail={
          <>
            <XeroConnectionCard />
            <XeroWhatHappensCard />
          </>
        }
        railLabel="Connection to Xero"
      >
        {params.show !== 'sent' &&
          (hasRows ? (
            <TableShell label="Xero" shot="xero-table" density="dense" fit {...(pager !== undefined ? { footer: pager } : {})}>
              <XeroTableHead />
              <tbody>
                {GROUP_ORDER.map((key) => {
                  const g = groupOf(key)
                  const title = g?.title ?? GROUP_TITLES[key]
                  const count = g?.count ?? 0
                  return key === 'changed' ? (
                    <XeroDivergenceRows key={key} title={title} count={count} rows={g?.divergences ?? []} actor={actor} facts={view.facts} shot={`xero-group-${key}`} />
                  ) : (
                    <XeroQueueRows key={key} title={title} count={count} rows={g?.queue ?? []} actor={actor} tone={key === 'failing' ? 'error' : 'warning'} facts={view.facts} shot={`xero-group-${key}`} />
                  )
                })}
              </tbody>
            </TableShell>
          ) : (
            <XeroEmpty narrowed={narrowed} show={params.show} onClear={() => update({ q: '', anaesthetist: '' })} />
          ))}
        {view.counts.sent > 0 ? (
          <>
            <div>
              <TextAction size="sm" flush ariaExpanded={sentOpen} onClick={toggleSent} shot="billing-xero-sent-toggle">
                {`Sent after waiting (${view.counts.sent})`}
              </TextAction>
            </div>
            {sentOpen && (
              // The sent list scrolls on its own inside the fit page; on its pill it pages at 50.
              <div data-shot="xero-sent" style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <XeroSentTable rows={view.sent} />
                {params.show === 'sent' && pager}
              </div>
            )}
          </>
        ) : (
          params.show === 'sent' && (
            <EmptyState variant="card" shot="xero-empty" title="Nothing was sent after waiting.">
              {narrowed ? 'Check the spelling, or clear the search and the anaesthetist.' : 'A call that waited for Xero lists here once it is sent.'}
            </EmptyState>
          )
        )}
      </PageBody>
    </FinancesPage>
  )
}

const EMPTY_LINE: Record<Exclude<XeroShow, 'sent'>, string> = {
  'needs-action': 'Every hand-off has reached Xero, and nothing was changed directly in Xero.',
  waiting: 'Nothing is waiting for Xero.',
  all: 'Every hand-off has reached Xero, and nothing was changed directly in Xero.',
}

function XeroEmpty({ narrowed, show, onClear }: { narrowed: boolean; show: Exclude<XeroShow, 'sent'>; onClear: () => void }) {
  if (narrowed) {
    return (
      <EmptyState
        variant="card"
        shot="xero-empty"
        title="Nothing matches."
        action={
          <TextAction size="sm" flush onClick={onClear} shot="xero-empty-clear">
            Clear the search
          </TextAction>
        }
      >
        Check the spelling, or clear the search and the anaesthetist.
      </EmptyState>
    )
  }
  return (
    <EmptyState variant="card" shot="xero-empty" title="Nothing needs action in Xero.">
      {EMPTY_LINE[show]}
    </EmptyState>
  )
}
