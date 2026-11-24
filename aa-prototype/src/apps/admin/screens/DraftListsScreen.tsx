/**
 * Draft Lists (catch-up Phase 31; US-01.6.2 "one visible place", FT-01.6):
 * every List with no anaesthetist yet, flagged "Unassigned", with how long it
 * has waited, in ascending date order (soonest first; Vanessa, 7 October:
 * "sorted by how close they are to the procedure date"), through the one
 * comparator. The waiting times read the demo clock, so they move with it.
 * Assign (teal), Change date and Remove act on a row; a row click opens the
 * drawer, and so does the row's one keyboard handle, its session (UI
 * unification U6). History lists the ones assigned or removed. The shared
 * table kit at the admin `compact` density; the flag is the warning tint,
 * never a status colour.
 */

import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Plus, TriangleAlert } from 'lucide-react'
import { accent, fontFamily, neutral, semantic } from '../../../theme/tokens'
import { removeBlockedReason } from '../../../domain/draftLists'
import { bookingCountsByList, finishedDraftLists, useAppStore, waitingDraftLists, type Actor } from '../../../store'
import { Button, LineTabLink, LineTabs, TextAction } from '../../../shared/ui'
import { AdminPage, PageBody } from '../components/AdminPage'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { drSurname, hhmm, initialsOf, locationName, shortDay } from '../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, UNASSIGNED, draftListCount, unavailableDetail } from '../../../shared/scheduleTerms'
import type { List } from '../../../domain/types'
import { surnameFirst } from '../util'
import { BookingCount, UnassignedPill, WaitingTime } from '../components/draftLists/DraftListParts'
import { AssignDraftListSheet } from '../flows/AssignDraftListSheet'
import { RedateDraftListSheet } from '../flows/RedateDraftListSheet'
import { RemoveDraftListSheet } from '../flows/RemoveDraftListSheet'
import { DraftListSheet } from '../flows/DraftListSheet'
import { sessionText } from '../../../domain/outOfHours'
import { ResultLine } from '../../../shared/ui/ResultLine'
import { Pill } from '../../../shared/ui/Pill'
import { EmptyState } from '../../../shared/ui/EmptyState'

/** Draft List rows keep the plain admin table's top alignment beside their stacked Origin cell. */

type Sheet = { kind: 'assign' | 'redate' | 'remove'; listId: string } | { kind: 'new' } | null

export function DraftListsScreen({
  actor,
  onOpenDraftList,
  onOpenList,
}: {
  actor: Actor
  /** Open a Draft List's drawer (the layout's overlay). */
  onOpenDraftList: (listId: string) => void
  /** Open an assigned List on its day (the Day view's drawer). */
  onOpenList: (listId: string) => void
}) {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const tab = params.get('tab') === 'history' ? 'history' : 'unassigned'
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const masters = useAppStore((s) => s.masters)
  const today = useAppStore((s) => s.clock.todayISO)
  const waiting = useMemo(() => waitingDraftLists({ schedule: { lists: listsRecord } }), [listsRecord])
  const finished = useMemo(() => finishedDraftLists({ schedule: { lists: listsRecord } }), [listsRecord])
  const counts = bookingCountsByList(bookings)
  const [sheet, setSheet] = useState<Sheet>(null)
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

  // A tab's link: this page with `tab=history` set (or dropped for Unassigned), `open` dropped, the rest kept.
  function tabHref(next: 'unassigned' | 'history'): string {
    const p = new URLSearchParams(params)
    if (next === 'history') p.set('tab', 'history')
    else p.delete('tab')
    p.delete('open')
    const search = p.toString()
    return search === '' ? pathname : `${pathname}?${search}`
  }

  const surgeon = (l: List) => masters.surgeons[l.surgeonId]?.name ?? l.surgeonId
  const origin = (l: List): string => {
    const t = l.draft
    if (t === undefined) return ''
    if (t.origin === 'request') return `${ORIGIN_SHORT_LABELS.request}${t.source !== undefined ? ` · ${SOURCE_LABELS[t.source]}` : ''}`
    if (t.origin === 'recurringClash') {
      const a = t.fromAnaesthetistId !== undefined ? masters.anaesthetists[t.fromAnaesthetistId] : undefined
      return `${ORIGIN_SHORT_LABELS.recurringClash}${a !== undefined ? ` · ${unavailableDetail(drSurname(a.name))}` : ''}`
    }
    return ORIGIN_SHORT_LABELS[t.origin]
  }
  // A person's initials ("KW"); a system or simulated actor in full.
  const byLabel = (by: string) => (/^[A-Z][a-z]+ [A-Z]\.?$/.test(by) ? initialsOf(by) : by)
  const since = (l: List) => (l.draft !== undefined ? `${format(parseISO(l.draft.sinceISO), 'd MMM')} ${hhmm(l.draft.sinceISO)} · ${byLabel(l.draft.by)}` : '')

  // Day dividers between dates in the one order.
  const byDay: [string, List[]][] = []
  for (const l of waiting) {
    const last = byDay[byDay.length - 1]
    if (last !== undefined && last[0] === l.dateISO) last[1].push(l)
    else byDay.push([l.dateISO, [l]])
  }

  return (
    <AdminPage
      mode="fit"
      shot="admin-draft-lists"
      title={DRAFT_LISTS}
      sub="Lists with no anaesthetist yet, soonest first. Assign each one to an anaesthetist for its session."
      actions={
        <Button variant="primary" size="desktop" onClick={() => setSheet({ kind: 'new' })}>
          <Plus size={16} aria-hidden /> New {DRAFT_LIST}
        </Button>
      }
      tabs={
      <LineTabs label={DRAFT_LISTS}>
        {(
          [
            ['unassigned', `${UNASSIGNED}`, waiting.length],
            ['history', 'History', finished.length],
          ] as const
        ).map(([value, label, n]) => {
          const active = tab === value
          return (
            <LineTabLink
              key={value}
              to={tabHref(value)}
              replace
              active={active}
              data-draft-tab={value}
              badge={<span style={{ fontFamily: fontFamily.mono, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: active ? accent.base : neutral.slate }}>{n}</span>}
            >
              {label}
            </LineTabLink>
          )
        })}
      </LineTabs>
      }
    >
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

      {tab === 'unassigned' ? (
        waiting.length === 0 ? (
          <EmptyState variant="card" shot="draft-lists-empty">
            No {DRAFT_LISTS} are waiting. New requests appear here until they are assigned.
          </EmptyState>
        ) : (
          <TableShell fit shot="draft-lists-table" label={DRAFT_LISTS} density="compact" minWidth={880} tableStyle={{ tableLayout: 'fixed' }}>
              {/* Fits a 1280 laptop's 1008px: the surgeon sits under the hospital, when and by whom under the origin; the note takes the spare width. */}
              <colgroup>
                {[84, 68, 176, 84, 78, 176, undefined, 214].map((w, i) => (
                  <col key={i} style={w !== undefined ? { width: w } : undefined} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {['Day', 'Session', 'Hospital · Surgeon', 'Bookings', 'Waiting', 'Origin', 'Note', ''].map((h, i) => (
                    <Th key={h === '' ? 'actions' : h} nowrap align={i === 3 || i === 4 ? 'right' : 'left'}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDay.map(([dateISO, rows], g) =>
                  rows.map((l, i) => {
                    const passed = l.dateISO < today
                    const holiday = l.conflicts.some((c) => c.kind === 'holiday')
                    return (
                      <ClickableRow
                        key={l.id}
                        align="top"
                        data-draft-list-row={l.id}
                        onOpen={() => onOpenDraftList(l.id)}
                        {...(i === 0 && g > 0 ? { style: { borderTop: `2px solid ${neutral.lineStrong}` } } : {})}
                      >
                        <Td nowrap style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? neutral.ink : neutral.mist }}>{i === 0 ? shortDay(dateISO) : ''}</Td>
                        <Td mono bold>
                          {/* The row's keyboard handle (bug 3): the session opens the Draft List's drawer, as the row click does. */}
                          <RowOpenButton
                            label={`Open ${DRAFT_LIST} ${shortDay(l.dateISO)} ${sessionText(l.session)}, ${locationName(l.hospitalId, masters.hospitals)}, ${surgeon(l)}`}
                            onOpen={() => onOpenDraftList(l.id)}
                          >
                            {sessionText(l.session)}
                          </RowOpenButton>
                        </Td>
                        <Td>
                          <div style={{ fontWeight: 600 }}>{locationName(l.hospitalId, masters.hospitals)}</div>
                          <div style={{ marginTop: 2, fontSize: 12.5, color: neutral.slate }}>{surgeon(l)}</div>
                        </Td>
                        <Td align="right"><BookingCount count={counts.get(l.id) ?? 0} style={{ fontSize: 13 }} /></Td>
                        <Td align="right" nowrap><WaitingTime list={l} style={{ fontSize: 13 }} /></Td>
                        <Td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <UnassignedPill />
                            <span style={{ fontSize: 12.5, color: neutral.slate }}>{origin(l)}</span>
                            <span className="mono" title={since(l)} style={{ fontSize: 12, color: neutral.slate }}>{since(l)}</span>
                            {passed && <Pill tone="warning" data-day-passed="true">Day passed</Pill>}
                            {holiday && (
                              <span data-holiday-flag="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: semantic.warning.onTint }}>
                                <TriangleAlert size={12} aria-hidden style={{ color: semantic.warning.solid }} />
                                Hospital closed that day
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td clip style={{ color: neutral.slate }}><span title={l.notes}>{l.notes ?? ''}</span></Td>
                        <Td nowrap>
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
                              disabled={(counts.get(l.id) ?? 0) > 0}
                              {...((counts.get(l.id) ?? 0) > 0 ? { title: removeBlockedReason(counts.get(l.id) ?? 0) } : {})}
                              onClick={() => setSheet({ kind: 'remove', listId: l.id })}
                            >
                              Remove
                            </TextAction>
                          </span>
                        </Td>
                      </ClickableRow>
                    )
                  }),
                )}
              </tbody>
          </TableShell>
        )
      ) : finished.length === 0 ? (
        <EmptyState variant="card">
          Nothing yet. {DRAFT_LISTS} appear here once they are assigned or removed.
        </EmptyState>
      ) : (
        <TableShell fit shot="draft-lists-history" label={`${DRAFT_LISTS} history`} density="compact" minWidth={880}>
            <thead>
              <tr>
                {['Day', 'Hospital', 'Surgeon', 'Outcome', 'Waited', 'By', ''].map((h) => (
                  <Th key={h === '' ? 'actions' : h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {finished.map((l) => {
                const assigned = l.state !== 'DRAFT'
                const who = assigned ? masters.anaesthetists[l.anaesthetistId] : undefined
                const by = assigned ? l.draft?.assignedBy : l.removedBy
                const at = assigned ? l.draft?.assignedAtISO : l.removedAtISO
                return (
                  <tr key={l.id} data-draft-history-row={l.id}>
                    <Td nowrap>{shortDay(l.dateISO)} {sessionText(l.session)}</Td>
                    <Td nowrap>{locationName(l.hospitalId, masters.hospitals)}</Td>
                    <Td nowrap>{surgeon(l)}</Td>
                    <Td>
                      {assigned
                        ? `Assigned to ${drSurname(who?.name ?? l.anaesthetistId ?? '')}, ${shortDay(l.dateISO)} ${sessionText(l.session)}`
                        : `Removed${l.removeReason !== undefined ? `: ${l.removeReason}` : ''}`}
                    </Td>
                    <Td nowrap><WaitingTime list={l} style={{ fontSize: 13 }} /></Td>
                    <Td mono nowrap style={{ fontSize: 12, color: neutral.slate }}>
                      {at !== undefined ? `${format(parseISO(at), 'd MMM')} ${hhmm(at)}` : ''} · {by ?? ''}
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
      {/* The count the nav badge shows, for screen readers on this page. */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{draftListCount(waiting.length)} waiting</span>
    </AdminPage>
  )
}
