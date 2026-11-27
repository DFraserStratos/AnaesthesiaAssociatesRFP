/**
 * Lists › Draft Lists (US-01.6.2, FT-01.6; US-13.1.3): every List with no anaesthetist yet, flagged
 * "Unassigned", soonest first under a group row per day (today's labelled as today), with its
 * Bookings, how long it has waited and why it has no anaesthetist. One toolbar: Waiting or History
 * (`?view=history`, the ones assigned or removed), a search (surgeon, hospital, note), When (from
 * today by default, the next two weeks, or past ones included, each still flagged "Day passed"),
 * Hospital and Why, the result count at its end; every filter in the URL (`useListParams`), 50 a
 * page. Assign (teal), Change date and Remove act on a row; a row click opens the drawer, and so does
 * the row's one keyboard handle, its session. The filtering, grouping and the why text live in
 * `draftListsRows.ts`; this file only renders.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { neutral } from '../../../../theme/tokens'
import { removeBlockedReason } from '../../../../domain/draftLists'
import { bookingCountsByList, finishedDraftLists, useAppStore, waitingDraftLists } from '../../../../store'
import { Button, EmptyState, FilterPills, NameSearchBox, SelectField, TextAction } from '../../../../shared/ui'
import { ResultLine } from '../../../../shared/ui/ResultLine'
import { Pill } from '../../../../shared/ui/Pill'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { drSurname, formatCount, initialsOf, locationName, shortDay, stampText } from '../../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS, draftListCount } from '../../../../shared/scheduleTerms'
import type { List } from '../../../../domain/types'
import { surnameFirst } from '../../util'
import { BookingCount, UnassignedPill, WaitingTime } from '../../components/draftLists/DraftListParts'
import { AssignDraftListSheet } from '../../flows/AssignDraftListSheet'
import { RedateDraftListSheet } from '../../flows/RedateDraftListSheet'
import { RemoveDraftListSheet } from '../../flows/RemoveDraftListSheet'
import { DraftListSheet } from '../../flows/DraftListSheet'
import { sessionText } from '../../../../domain/outOfHours'
import { useAdminOutlet } from '../../outlet'
import { useListParams } from '../../useListParams'
import { ListsPage } from './ListsSection'
import {
  DRAFT_LISTS_DEFAULTS,
  DRAFT_LISTS_PAGE_SIZE,
  WHEN_OPTIONS,
  WHY_OPTIONS,
  draftOriginText,
  groupByDay,
  historyDraftRows,
  hospitalOptions,
  parseView,
  parseWhen,
  parseWhy,
  waitingDraftRows,
} from './draftListsRows'

type Sheet = { kind: 'assign' | 'redate' | 'remove'; listId: string } | { kind: 'new' } | null

const COLUMNS = 7

export function DraftListsTab() {
  const { actor, onOpenDraftList, onOpenList } = useAdminOutlet()
  const [params, setParams] = useSearchParams()
  const list = useListParams(DRAFT_LISTS_DEFAULTS)
  const view = parseView(list.get('view'))
  const q = list.get('q')
  const when = parseWhen(list.get('when'))
  const why = parseWhy(list.get('why'))
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const masters = useAppStore((s) => s.masters)
  const today = useAppStore((s) => s.clock.todayISO)
  const waiting = useMemo(() => waitingDraftLists({ schedule: { lists: listsRecord } }), [listsRecord])
  const finished = useMemo(() => finishedDraftLists({ schedule: { lists: listsRecord } }), [listsRecord])
  const counts = bookingCountsByList(bookings)
  const [sheet, setSheet] = useState<Sheet>(null)

  const hospitalParam = list.get('hospital')
  const base: readonly List[] = view === 'history' ? finished : waiting
  const hospitalChoices = useMemo(() => hospitalOptions(base, masters.hospitals, hospitalParam), [base, masters.hospitals, hospitalParam])
  const hospitalId = hospitalChoices.some((h) => h.value === hospitalParam) ? hospitalParam : 'all'
  const waitingResult = useMemo(
    () => waitingDraftRows(waiting, { q, hospitalId, why, when }, today, masters),
    [waiting, q, hospitalId, why, when, today, masters],
  )
  const historyRows = useMemo(() => historyDraftRows(finished, { q, hospitalId, why }, masters), [finished, q, hospitalId, why, masters])
  const rows: readonly List[] = view === 'history' ? historyRows : waitingResult.rows
  const pages = pageWindow(rows.length, DRAFT_LISTS_PAGE_SIZE, pageParam(list.get('page')))
  const shown = pageOf(rows, DRAFT_LISTS_PAGE_SIZE, pages.page)
  const narrowed = q.trim() !== '' || hospitalId !== 'all' || why !== 'all' || (view === 'waiting' && when === 'fortnight')
  const pager =
    pages.pages > 1 ? (
      <Pager total={rows.length} size={DRAFT_LISTS_PAGE_SIZE} page={pages.page} onPage={(p) => list.set({ page: String(p) })} lead={DRAFT_LISTS} shot="draft-lists-pager" />
    ) : undefined

  // The outcome of an assignment made on this page (the row's sheet or the drawer): `?assigned=<listId>`.
  const assignedId = params.get('assigned')
  const assignedNote = useMemo(() => {
    if (assignedId === null) return null
    const l = listsRecord[assignedId]
    if (l === undefined || l.anaesthetistId === undefined) return null
    const a = masters.anaesthetists[l.anaesthetistId]
    return { listId: assignedId, text: `${DRAFT_LIST} assigned to ${surnameFirst(a?.name ?? '')}, ${shortDay(l.dateISO)} ${sessionText(l.session)}. It is now an active List.` }
  }, [assignedId, listsRecord, masters.anaesthetists])
  function setAssigned(listId: string | null) {
    const p = new URLSearchParams(params)
    if (listId === null) p.delete('assigned')
    else p.set('assigned', listId)
    setParams(p, { replace: true })
  }

  const surgeon = (l: List) => masters.surgeons[l.surgeonId]?.name ?? l.surgeonId
  const hospital = (l: List) => locationName(l.hospitalId, masters.hospitals)
  // A person's initials ("KW"); a system or simulated actor in full.
  const byLabel = (by: string) => (/^[A-Z][a-z]+ [A-Z]\.?$/.test(by) ? initialsOf(by) : by)
  const since = (l: List) => (l.draft !== undefined ? `Waiting since ${stampText(l.draft.sinceISO, { weekday: false })} · ${byLabel(l.draft.by)}` : '')

  const resultCount =
    view === 'history' ? (
      <span data-shot="draft-lists-count">
        <span className="mono">{formatCount(rows.length)}</span> assigned or removed
      </span>
    ) : (
      <>
        {waitingResult.pastHidden > 0 && (
          <TextAction size="sm" flush onClick={() => list.set({ when: 'all' })} data-show-past="true">
            Show {formatCount(waitingResult.pastHidden)} past
          </TextAction>
        )}
        <span data-shot="draft-lists-count">
          <span className="mono">{formatCount(rows.length)}</span> {rows.length === 1 ? DRAFT_LIST : DRAFT_LISTS}
          {q.trim() !== '' ? ` matching "${q.trim()}"` : ''}
        </span>
      </>
    )

  return (
    <ListsPage
      tab="draft-lists"
      shot="admin-draft-lists"
      actions={
        <Button variant="primary" size="desktop" onClick={() => setSheet({ kind: 'new' })}>
          <Plus size={16} aria-hidden /> New {DRAFT_LIST}
        </Button>
      }
    >
      <PageToolbar shot="draft-lists-toolbar" end={resultCount}>
        <FilterPills
          ariaLabel={`${DRAFT_LISTS} view`}
          value={view}
          onSelect={(next) => list.set({ view: next })}
          options={[
            { value: 'waiting', label: `Waiting ${formatCount(waiting.length)}` },
            { value: 'history', label: `History ${formatCount(finished.length)}` },
          ]}
        />
        <NameSearchBox size="pill" width={240} value={q} onChange={(next) => list.set({ q: next })} label="Search by surgeon, hospital or note" placeholder="Surgeon, hospital or note" shot="draft-lists-search" />
        {view === 'waiting' && (
          <SelectField label="When" hideLabel width={150} size="compact" fill="surface" value={when} onChange={(next) => list.set({ when: next })} shot="draft-lists-when">
            {WHEN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
        )}
        <SelectField label="Hospital" hideLabel width={200} size="compact" fill="surface" value={hospitalId} onChange={(next) => list.set({ hospital: next })} shot="draft-lists-hospital">
          <option value="all">Any hospital</option>
          {hospitalChoices.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </SelectField>
        <SelectField label="Why it has no anaesthetist" hideLabel width={230} size="compact" fill="surface" value={why} onChange={(next) => list.set({ why: next })} shot="draft-lists-why">
          <option value="all">Any reason</option>
          {WHY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
      </PageToolbar>
      <PageBody>
        <ResultLine
          shot="draft-lists-assigned"
          line={assignedNote?.text}
          actions={
            assignedNote !== null ? (
              <span style={{ display: 'inline-flex', gap: 14 }}>
                <TextAction size="sm" flush onClick={() => onOpenList(assignedNote.listId)}>Open List</TextAction>
                <TextAction size="sm" flush onClick={() => setAssigned(null)}>Dismiss</TextAction>
              </span>
            ) : undefined
          }
        />

        {rows.length === 0 ? (
          narrowed || (view === 'waiting' && waitingResult.pastHidden > 0) ? (
            <EmptyState
              variant="card"
              shot="draft-lists-empty"
              title={`No ${DRAFT_LISTS} match.`}
              action={<TextAction size="sm" flush onClick={() => list.set({ q: '', hospital: 'all', why: 'all', when: 'all' })}>Show every {DRAFT_LIST}</TextAction>}
            >
              Check the spelling, or widen the filters.
            </EmptyState>
          ) : view === 'waiting' ? (
            <EmptyState variant="card" shot="draft-lists-empty">
              No {DRAFT_LISTS} are waiting. New requests appear here until they are assigned.
            </EmptyState>
          ) : (
            <EmptyState variant="card" shot="draft-lists-empty">
              Nothing yet. {DRAFT_LISTS} appear here once they are assigned or removed.
            </EmptyState>
          )
        ) : view === 'waiting' ? (
          <TableShell
            fit
            shot="draft-lists-table"
            label={DRAFT_LISTS}
            density="compact"
            minWidth={900}
            tableStyle={{ tableLayout: 'fixed' }}
            {...(pager !== undefined ? { footer: pager } : {})}
          >
            {/* Fits a 1280 laptop's 1008px: the hospital and the note share the spare width. */}
            <colgroup>
              {[72, undefined, 78, 78, 220, undefined, 206].map((w, i) => (
                <col key={i} style={w !== undefined ? { width: w } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {['Session', 'Hospital · Surgeon', 'Bookings', 'Waiting', 'Why it has no anaesthetist', 'Note', ''].map((h, i) => (
                  <Th key={h === '' ? 'actions' : h} nowrap align={i === 2 || i === 3 ? 'right' : 'left'}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupByDay(shown, today).map((g) => [
                <GroupRow key={`day-${g.dateISO}`} span={COLUMNS} counts={draftListCount(g.lists.length)} data-draft-day={g.dateISO} {...(g.past ? { tone: 'warning' as const } : {})}>
                  {g.label}
                </GroupRow>,
                ...g.lists.map((l) => {
                  const passed = l.dateISO < today
                  const closed = l.conflicts.some((c) => c.kind === 'holiday')
                  const booked = counts.get(l.id) ?? 0
                  return (
                    <ClickableRow key={l.id} align="top" data-draft-list-row={l.id} onOpen={() => onOpenDraftList(l.id)}>
                      <Td mono bold>
                        {/* The row's keyboard handle (bug 3): the session opens the Draft List's drawer, as the row click does. */}
                        <RowOpenButton label={`Open ${DRAFT_LIST} ${shortDay(l.dateISO)} ${sessionText(l.session)}, ${hospital(l)}, ${surgeon(l)}`} onOpen={() => onOpenDraftList(l.id)}>
                          {sessionText(l.session)}
                        </RowOpenButton>
                      </Td>
                      <Td>
                        <span style={{ fontWeight: 600 }}>{hospital(l)}</span> <span style={{ color: neutral.slate }}>· {surgeon(l)}</span>
                        {(closed || passed) && (
                          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {closed && <Pill tone="error" data-holiday-flag="true">Hospital closed</Pill>}
                            {passed && <Pill tone="warning" data-day-passed="true">Day passed</Pill>}
                          </span>
                        )}
                      </Td>
                      <Td align="right"><BookingCount count={booked} style={{ fontSize: 13 }} /></Td>
                      <Td align="right" nowrap><span title={since(l)}><WaitingTime list={l} style={{ fontSize: 13 }} /></span></Td>
                      <Td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <UnassignedPill />
                          <span style={{ fontSize: 12.5, color: neutral.slate }} data-draft-origin={l.draft?.origin}>{draftOriginText(l, masters.anaesthetists)}</span>
                        </div>
                      </Td>
                      <Td clip style={{ color: neutral.slate }}><span title={l.notes}>{l.notes ?? ''}</span></Td>
                      <Td nowrap align="right">
                        <span style={{ display: 'inline-flex', gap: 12 }}>
                          <TextAction
                            size="sm"
                            flush
                            label={`Assign ${DRAFT_LIST}, ${shortDay(l.dateISO)} ${sessionText(l.session)}`}
                            disabled={passed}
                            {...(passed ? { title: 'This day has passed. Change its date or remove it.' } : {})}
                            onClick={() => setSheet({ kind: 'assign', listId: l.id })}
                          >
                            Assign
                          </TextAction>
                          <TextAction size="sm" flush onClick={() => setSheet({ kind: 'redate', listId: l.id })}>Change date</TextAction>
                          <TextAction
                            size="sm"
                            flush
                            disabled={booked > 0}
                            {...(booked > 0 ? { title: removeBlockedReason(booked) } : {})}
                            onClick={() => setSheet({ kind: 'remove', listId: l.id })}
                          >
                            Remove
                          </TextAction>
                        </span>
                      </Td>
                    </ClickableRow>
                  )
                }),
              ])}
            </tbody>
          </TableShell>
        ) : (
          <TableShell fit shot="draft-lists-history" label={`${DRAFT_LISTS} history`} density="compact" minWidth={880} {...(pager !== undefined ? { footer: pager } : {})}>
            <thead>
              <tr>
                {['Day', 'Hospital', 'Surgeon', 'Outcome', 'Waited', 'By', ''].map((h) => (
                  <Th key={h === '' ? 'actions' : h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => {
                const assigned = l.state !== 'DRAFT'
                const who = assigned && l.anaesthetistId !== undefined ? masters.anaesthetists[l.anaesthetistId] : undefined
                const by = assigned ? l.draft?.assignedBy : l.removedBy
                const at = assigned ? l.draft?.assignedAtISO : l.removedAtISO
                return (
                  <tr key={l.id} data-draft-history-row={l.id}>
                    <Td nowrap>{shortDay(l.dateISO)} {sessionText(l.session)}</Td>
                    <Td nowrap>{hospital(l)}</Td>
                    <Td nowrap>{surgeon(l)}</Td>
                    <Td>
                      {assigned
                        ? `Assigned to ${drSurname(who?.name ?? l.anaesthetistId ?? '')}, ${shortDay(l.dateISO)} ${sessionText(l.session)}`
                        : `Removed${l.removeReason !== undefined ? `: ${l.removeReason}` : ''}`}
                    </Td>
                    <Td nowrap><WaitingTime list={l} style={{ fontSize: 13 }} /></Td>
                    <Td mono nowrap style={{ fontSize: 12, color: neutral.slate }}>
                      {at !== undefined ? stampText(at, { weekday: false }) : ''} · {by ?? ''}
                    </Td>
                    <Td nowrap>
                      {assigned && <TextAction size="sm" flush onClick={() => onOpenList(l.id)}>Open List</TextAction>}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </TableShell>
        )}
      </PageBody>

      {sheet !== null && sheet.kind === 'assign' && (
        <AssignDraftListSheet
          open
          listId={sheet.listId}
          actor={actor}
          onClose={() => setSheet(null)}
          onAssigned={(listId) => {
            setSheet(null)
            setAssigned(listId)
          }}
          onOpenOccupied={onOpenList}
        />
      )}
      {sheet !== null && sheet.kind === 'redate' && (
        <RedateDraftListSheet open listId={sheet.listId} actor={actor} onClose={() => setSheet(null)} onDone={() => setSheet(null)} />
      )}
      {sheet !== null && sheet.kind === 'remove' && (
        <RemoveDraftListSheet open listId={sheet.listId} actor={actor} onClose={() => setSheet(null)} onDone={() => setSheet(null)} />
      )}
      <DraftListSheet
        open={sheet !== null && sheet.kind === 'new'}
        actor={actor}
        initialDateISO={params.get('date') ?? today}
        onClose={() => setSheet(null)}
        onCreated={() => setSheet(null)}
      />
    </ListsPage>
  )
}
