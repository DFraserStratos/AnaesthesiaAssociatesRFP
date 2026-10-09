/**
 * Draft Lists (catch-up Phase 31; US-01.6.2 "one visible place", FT-01.6):
 * every List with no anaesthetist yet, flagged "Unassigned", with how long it
 * has waited, in ascending date order (soonest first; Vanessa, 7 October:
 * "sorted by how close they are to the procedure date"), through the one
 * comparator. The waiting times read the demo clock, so they move with it.
 * Assign (teal), Change date and Remove act on a row; a row click opens the
 * drawer. History lists the ones assigned or removed. The Review table's
 * rhythm (`tableChrome.ts`); the flag is the warning tint, never a status
 * colour.
 */

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Plus, TriangleAlert } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { removeBlockedReason } from '../../../domain/draftLists'
import { bookingCountsByList, finishedDraftLists, useAppStore, waitingDraftLists, type Actor } from '../../../store'
import { Button } from '../../../shared/ui'
import { drSurname, hhmm, initialsOf, locationName, shortDay } from '../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, UNASSIGNED, draftListCount, unavailableDetail } from '../../../shared/scheduleTerms'
import type { List } from '../../../domain/types'
import { cellStyle as adminCell, headCellStyle as adminHead, isInteractiveRowTarget, textActionStyle } from '../tableChrome'
import { surnameFirst } from '../util'
import { BookingCount, UnassignedPill, WaitingTime } from '../components/draftLists/DraftListParts'
import { AssignDraftListSheet } from '../flows/AssignDraftListSheet'
import { RedateDraftListSheet } from '../flows/RedateDraftListSheet'
import { RemoveDraftListSheet } from '../flows/RemoveDraftListSheet'
import { DraftListSheet } from '../flows/DraftListSheet'

const cellStyle = adminCell()
const headCellStyle = adminHead()

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
    return { listId: assignedId, text: `${DRAFT_LIST} assigned to ${surnameFirst(a?.name ?? '')}, ${shortDay(l.dateISO)} ${l.session}. It is now an active List.` }
  }, [assignedId, listsRecord, masters.anaesthetists])
  function setAssigned(listId: string | null) {
    const p = new URLSearchParams(params)
    if (listId === null) p.delete('assigned')
    else p.set('assigned', listId)
    setParams(p, { replace: true })
  }

  function setTab(next: 'unassigned' | 'history') {
    const p = new URLSearchParams(params)
    if (next === 'history') p.set('tab', 'history')
    else p.delete('tab')
    p.delete('open')
    setParams(p, { replace: true })
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
    <div data-shot="admin-draft-lists" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{DRAFT_LISTS}</h1>
          <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 720, lineHeight: '19px' }}>
            Lists with no anaesthetist yet, soonest first. Assign each one to an anaesthetist for its session.
          </div>
        </div>
        <Button variant="primary" onClick={() => setSheet({ kind: 'new' })}>
          <Plus size={16} aria-hidden /> New {DRAFT_LIST}
        </Button>
      </div>

      <div role="tablist" aria-label={DRAFT_LISTS} style={{ display: 'inline-flex', gap: 6 }}>
        {(
          [
            ['unassigned', `${UNASSIGNED}`, waiting.length],
            ['history', 'History', finished.length],
          ] as const
        ).map(([value, label, n]) => {
          const active = tab === value
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              data-draft-tab={value}
              onClick={() => setTab(value)}
              style={{ padding: '6px 12px', borderRadius: radius.pill, border: `1px solid ${active ? accent.base : neutral.line}`, background: active ? accent.tint : neutral.surface, color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {label} <span className="mono" style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 2 }}>{n}</span>
            </button>
          )
        })}
      </div>

      {assignedNote !== null && (
        <div role="status" data-shot="draft-lists-assigned" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{assignedNote.text}</span>
          <span style={{ display: 'inline-flex', gap: 14 }}>
            <button type="button" style={textActionStyle} onClick={() => onOpenList(assignedNote.listId)}>Open List</button>
            <button type="button" style={textActionStyle} onClick={() => setAssigned(null)}>Dismiss</button>
          </span>
        </div>
      )}

      {tab === 'unassigned' ? (
        waiting.length === 0 ? (
          <div data-shot="draft-lists-empty" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 24, fontSize: 13, color: neutral.slate }}>
            No {DRAFT_LISTS} are waiting. New requests appear here until they are assigned.
          </div>
        ) : (
          <div data-shot="draft-lists-table" style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1140, tableLayout: 'fixed' }}>
              <colgroup>
                {[84, 56, 136, 112, 84, 78, 168, undefined, 172, 214].map((w, i) => (
                  <col key={i} style={w !== undefined ? { width: w } : undefined} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {['Day', 'Session', 'Hospital', 'Surgeon', 'Bookings', 'Waiting', 'Origin', 'Note', 'Since', ''].map((h, i) => (
                    <th key={h === '' ? 'actions' : h} style={{ ...headCellStyle, textAlign: i === 4 || i === 5 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDay.map(([dateISO, rows], g) =>
                  rows.map((l, i) => {
                    const passed = l.dateISO < today
                    const holiday = l.conflicts.some((c) => c.kind === 'holiday')
                    return (
                      <tr
                        key={l.id}
                        data-draft-list-row={l.id}
                        onClick={(e) => {
                          if (!isInteractiveRowTarget(e.target)) onOpenDraftList(l.id)
                        }}
                        style={{ cursor: 'pointer', ...(i === 0 && g > 0 ? { borderTop: `2px solid ${neutral.lineStrong}` } : {}) }}
                      >
                        <td style={{ ...cellStyle, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? neutral.ink : neutral.mist, whiteSpace: 'nowrap' }}>{i === 0 ? shortDay(dateISO) : ''}</td>
                        <td className="mono" style={{ ...cellStyle, fontWeight: 600 }}>{l.session}</td>
                        <td style={{ ...cellStyle, fontWeight: 600 }}>{locationName(l.hospitalId, masters.hospitals)}</td>
                        <td style={cellStyle}>{surgeon(l)}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}><BookingCount count={counts.get(l.id) ?? 0} style={{ fontSize: 13 }} /></td>
                        <td style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}><WaitingTime list={l} style={{ fontSize: 13 }} /></td>
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <UnassignedPill />
                            <span style={{ fontSize: 12.5, color: neutral.slate }}>{origin(l)}</span>
                            {passed && <span data-day-passed="true" style={{ fontSize: 11, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.pill, padding: '1px 8px' }}>Day passed</span>}
                            {holiday && (
                              <span data-holiday-flag="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: semantic.warning.onTint }}>
                                <TriangleAlert size={12} aria-hidden style={{ color: semantic.warning.solid }} />
                                Hospital closed that day
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...cellStyle, color: neutral.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.notes}>{l.notes ?? ''}</td>
                        <td className="mono" title={since(l)} style={{ ...cellStyle, fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{since(l)}</td>
                        <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', gap: 12 }}>
                            <button
                              type="button"
                              aria-label={`Assign ${DRAFT_LIST}, ${shortDay(l.dateISO)} ${l.session}`}
                              disabled={passed}
                              title={passed ? 'This day has passed. Change its date or remove it.' : undefined}
                              style={passed ? { ...textActionStyle, color: neutral.mist, cursor: 'default' } : textActionStyle}
                              onClick={() => setSheet({ kind: 'assign', listId: l.id })}
                            >
                              Assign
                            </button>
                            <button type="button" style={textActionStyle} onClick={() => setSheet({ kind: 'redate', listId: l.id })}>Change date</button>
                            <button
                              type="button"
                              disabled={(counts.get(l.id) ?? 0) > 0}
                              title={(counts.get(l.id) ?? 0) > 0 ? removeBlockedReason(counts.get(l.id) ?? 0) : undefined}
                              style={(counts.get(l.id) ?? 0) > 0 ? { ...textActionStyle, color: neutral.mist, cursor: 'default' } : textActionStyle}
                              onClick={() => setSheet({ kind: 'remove', listId: l.id })}
                            >
                              Remove
                            </button>
                          </span>
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
        )
      ) : finished.length === 0 ? (
        <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 24, fontSize: 13, color: neutral.slate }}>
          Nothing yet. {DRAFT_LISTS} appear here once they are assigned or removed.
        </div>
      ) : (
        <div data-shot="draft-lists-history" style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 960 }}>
            <thead>
              <tr>
                {['Day', 'Hospital', 'Surgeon', 'Outcome', 'Waited', 'By', ''].map((h) => (
                  <th key={h === '' ? 'actions' : h} style={headCellStyle}>{h}</th>
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
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{shortDay(l.dateISO)} {l.session}</td>
                    <td style={cellStyle}>{locationName(l.hospitalId, masters.hospitals)}</td>
                    <td style={cellStyle}>{surgeon(l)}</td>
                    <td style={cellStyle}>
                      {assigned
                        ? `Assigned to ${drSurname(who?.name ?? l.anaesthetistId ?? '')}, ${shortDay(l.dateISO)} ${l.session}`
                        : `Removed${l.removeReason !== undefined ? `: ${l.removeReason}` : ''}`}
                    </td>
                    <td style={cellStyle}><WaitingTime list={l} style={{ fontSize: 13 }} /></td>
                    <td className="mono" style={{ ...cellStyle, fontSize: 12, color: neutral.slate, whiteSpace: 'nowrap' }}>
                      {at !== undefined ? `${format(parseISO(at), 'd MMM')} ${hhmm(at)}` : ''} · {by ?? ''}
                    </td>
                    <td style={cellStyle}>
                      {assigned && <button type="button" style={textActionStyle} onClick={() => onOpenList(l.id)}>Open List</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  )
}
