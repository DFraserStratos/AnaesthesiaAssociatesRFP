/**
 * Conflicts (catch-up Phase 30; US-01.5.4 "Availability conflict dashboard";
 * OQ-09 soft warning). Every live conflict across dates, grouped by day: the
 * catalogue's two kinds only, a List at a closed hospital and a List whose
 * anaesthetist is unavailable for the session (an office-recorded sickness
 * included). Recurring clashes and Lists an anaesthetist returns are Draft
 * Lists (Phase 31's view), not rows here. The Bookings stay in place: the
 * office reassigns to cover (the conflict clears when the new session is
 * available) or clears the flag. Filters live in the URL, like the Day view's
 * `?sort=`. Desktop layout in the Admin chrome (Admin Review's header and
 * table anatomy).
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { CONFLICT_REASONS, conflictFromCause, type ConflictReason, type ExpectedConflict } from '../../../domain/conflicts'
import { conflictRows, restoreListConflict, scheduleHorizon, useAppStore, type Actor, type ConflictRow } from '../../../store'
import { StatusChip } from '../../../shared'
import { drSurname, hhmm, locationName, shortDay } from '../../../shared/format'
import { UNASSIGNED } from '../../../shared/scheduleTerms'
import { isAssignedList } from '../../../domain/draftLists'
import { ConflictDot } from '../components/conflicts/ConflictDot'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { cellStyle as adminCell, headCellStyle as adminHead, textActionStyle } from '../tableChrome'
import { ReassignListFlow } from '../flows/ReassignListFlow'
import { UnassignedPill } from '../components/draftLists/DraftListParts'
import { ClearConflictSheet } from '../components/conflicts/ClearConflictSheet'
import { selectControlStyle } from '../flows/fieldChrome'

const cellStyle = { ...adminCell(), verticalAlign: 'top' as const }
const headCellStyle = adminHead()

type ReasonFilter = 'all' | 'closed' | 'unavailable'
type WhenFilter = 'today' | 'twoWeeks' | 'canvas' | 'past'

const REASON_OPTIONS: { value: ReasonFilter; label: string; reason?: ConflictReason }[] = [
  { value: 'all', label: 'All' },
  { value: 'closed', label: 'Hospital closed', reason: 'Hospital closed' },
  { value: 'unavailable', label: 'Anaesthetist unavailable', reason: 'Anaesthetist unavailable' },
]
const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: 'today', label: 'From today' },
  { value: 'twoWeeks', label: 'Next 2 weeks' },
  { value: 'canvas', label: 'Whole canvas' },
  { value: 'past', label: 'Include past' },
]

const smallSelect = { ...selectControlStyle, minHeight: 36, width: 'auto', fontSize: 13, padding: '0 10px', background: neutral.surface }

export function ConflictsScreen({ actor, onOpenSession, onOpenDraftList }: { actor: Actor; onOpenSession: (slotId: string) => void; onOpenDraftList?: (listId: string) => void }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const todayISO = clock.todayISO
  const horizon = scheduleHorizon({ clock, appSettings })

  // Unknown values in a hand-typed URL fall back to the defaults.
  const reasonParam: ReasonFilter = REASON_OPTIONS.some((o) => o.value === params.get('reason')) ? (params.get('reason') as ReasonFilter) : 'all'
  const whenParam: WhenFilter = WHEN_OPTIONS.some((o) => o.value === params.get('when')) ? (params.get('when') as WhenFilter) : 'today'
  const hospitalParam = params.get('hospital') ?? ''
  const anaesthetistParam = params.get('anaesthetist') ?? ''
  const showCleared = params.get('cleared') === '1'

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value === null || value === '') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const range = useMemo((): { fromISO?: string; toISO?: string } => {
    switch (whenParam) {
      case 'twoWeeks':
        return { fromISO: todayISO, toISO: format(addDays(parseISO(todayISO), 13), 'yyyy-MM-dd') }
      case 'canvas':
        return { fromISO: horizon.startISO, toISO: horizon.endISO }
      case 'past':
        return {}
      default:
        return { fromISO: todayISO, toISO: horizon.endISO }
    }
  }, [whenParam, todayISO, horizon.startISO, horizon.endISO])

  const reason = REASON_OPTIONS.find((o) => o.value === reasonParam)?.reason
  const rows = useMemo(
    () =>
      conflictRows(
        { schedule, masters },
        {
          ...range,
          ...(reason !== undefined ? { reason } : {}),
          ...(hospitalParam !== '' ? { hospitalId: hospitalParam } : {}),
          ...(anaesthetistParam !== '' ? { anaesthetistId: anaesthetistParam } : {}),
          includeCleared: showCleared,
        },
      ),
    [schedule, masters, range, reason, hospitalParam, anaesthetistParam, showCleared],
  )
  const liveCount = rows.filter((r) => r.clear === undefined).length
  const groups = useMemo(() => {
    const byDate = new Map<string, ConflictRow[]>()
    for (const r of rows) {
      const g = byDate.get(r.dateISO)
      if (g === undefined) byDate.set(r.dateISO, [r])
      else g.push(r)
    }
    return [...byDate.entries()]
  }, [rows])

  const [reassigning, setReassigning] = useState<string | null>(null)
  const [clearing, setClearing] = useState<{ listId: string; conflict: ExpectedConflict } | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const reassigningList = reassigning !== null ? schedule.lists[reassigning] : undefined
  const reassignList = isAssignedList(reassigningList) ? reassigningList : undefined

  // A Draft List has no anaesthetist: its row reads "Unassigned" (catch-up Phase 31).
  const nameOf = (id: string | undefined) => (id === undefined ? UNASSIGNED : (masters.anaesthetists[id]?.name ?? id))

  function onReassigned(listId: string) {
    const list = useAppStore.getState().schedule.lists[listId]
    setReassigning(null)
    if (list === undefined) return
    const who = drSurname(nameOf(list.anaesthetistId))
    const when = `${shortDay(list.dateISO)} ${list.session}`
    // Name what is left: a closure moves with the List, and a closed target flags it again.
    const left = [...new Set(list.conflicts.map((c) => CONFLICT_REASONS[c.kind].toLowerCase()))]
    setConfirmation(
      left.length === 0
        ? `Conflict cleared: ${who} now covers ${when}.`
        : `List moved: ${who} now covers ${when}. It is still flagged (${left.join(', ')}).`,
    )
  }

  return (
    <div data-testid="conflicts-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Conflicts</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 760, lineHeight: '19px' }}>
          Lists at a closed hospital, and Lists whose anaesthetist is unavailable for the session. Bookings stay in place; reassign to cover, or clear.{' '}
          <span data-shot="conflicts-count" style={{ color: neutral.ink, fontWeight: 600 }}>
            {liveCount} open
          </span>
          {' '}in this range.
        </div>
      </div>

      {/* Filters: Admin Review's chips and selects, state in the URL. */}
      <div data-shot="conflicts-filters" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <div role="group" aria-label="Reason" style={{ display: 'inline-flex', gap: 6 }}>
          {REASON_OPTIONS.map((o) => {
            const active = o.value === reasonParam
            return (
              <button
                key={o.value}
                type="button"
                className="aa-filter-toggle"
                aria-pressed={active}
                onClick={() => setParam('reason', o.value === 'all' ? null : o.value)}
                style={{ padding: '6px 12px', borderRadius: radius.pill, border: `1px solid ${active ? accent.base : neutral.line}`, background: active ? accent.tint : neutral.surface, color: active ? accent.pressed : neutral.slate, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        <select aria-label="When" value={whenParam} onChange={(e) => setParam('when', e.target.value === 'today' ? null : e.target.value)} style={smallSelect}>
          {WHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select aria-label="Hospital" value={hospitalParam} onChange={(e) => setParam('hospital', e.target.value)} style={smallSelect}>
          <option value="">Every hospital</option>
          {Object.values(masters.hospitals).map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <select aria-label="Anaesthetist" value={anaesthetistParam} onChange={(e) => setParam('anaesthetist', e.target.value)} style={smallSelect}>
          <option value="">Every anaesthetist</option>
          {Object.values(masters.anaesthetists)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
            ))}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: neutral.slate, cursor: 'pointer' }}>
          <input type="checkbox" checked={showCleared} onChange={(e) => setParam('cleared', e.target.checked ? '1' : null)} />
          Show cleared
        </label>
      </div>

      {confirmation !== null && (
        <div role="status" data-shot="conflicts-confirmation" style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{confirmation}</span>
          <button type="button" style={textActionStyle} onClick={() => setConfirmation(null)}>Dismiss</button>
        </div>
      )}

      {groups.length === 0 ? (
        <div data-shot="conflicts-empty" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 24, fontSize: 13, color: neutral.slate }}>
          No conflicts in this range.
        </div>
      ) : (
        <div data-shot="conflicts-table" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {groups.map(([dateISO, dayRows]) => {
            const open = dayRows.filter((r) => r.clear === undefined).length
            return (
              <section key={dateISO} aria-label={shortDay(dateISO)} data-conflict-date={dateISO}>
                <h2 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>
                  {shortDay(dateISO)}
                  <span style={{ color: neutral.mist, fontWeight: 500 }}> · {open} conflict{open === 1 ? '' : 's'}{dayRows.length > open ? `, ${dayRows.length - open} cleared` : ''}</span>
                </h2>
                <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1040, tableLayout: 'fixed' }}>
                    {/* One set of widths, so the day groups line up. */}
                    <colgroup>
                      {[64, 170, 160, 130, undefined, 130, 84, 236].map((w, i) => (
                        <col key={i} style={w !== undefined ? { width: w } : undefined} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        {['Session', 'Anaesthetist', 'Hospital', 'Surgeon', 'Reason', 'Availability', 'Bookings', ''].map((h, i) => (
                          <th key={h === '' ? 'actions' : h} style={{ ...headCellStyle, textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dayRows.map((r) => {
                        const cleared = r.clear !== undefined
                        const muted = cleared ? { color: neutral.mist } : {}
                        const rowName = `${r.anaesthetistId !== undefined ? drSurname(nameOf(r.anaesthetistId)) : UNASSIGNED} ${shortDay(r.dateISO)} ${r.session}`
                        return (
                          <tr key={r.key} data-conflict-row={r.listId} data-conflict-cleared={cleared ? 'true' : undefined}>
                            <td className="mono" style={{ ...cellStyle, ...muted, boxShadow: `inset 3px 0 0 ${cleared ? neutral.line : semantic.warning.solid}`, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.session}</td>
                            <td style={{ ...cellStyle, ...muted, fontWeight: 600 }}>{r.anaesthetistId === undefined ? <UnassignedPill /> : nameOf(r.anaesthetistId)}</td>
                            <td style={{ ...cellStyle, ...muted }}>{locationName(r.hospitalId, masters.hospitals)}</td>
                            <td style={{ ...cellStyle, ...muted }}>{masters.surgeons[r.surgeonId]?.name ?? r.surgeonId}</td>
                            <td style={{ ...cellStyle, maxWidth: 340 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 3px', borderRadius: radius.pill, background: cleared ? neutral.sunken : semantic.warning.tint, color: cleared ? neutral.slate : semantic.warning.onTint, fontSize: 12, fontWeight: 600 }}>
                                <ConflictDot muted={cleared} />
                                {r.reason}
                              </span>
                              <div style={{ marginTop: 4, fontSize: 12, color: neutral.slate, lineHeight: '17px' }}>{r.detail}</div>
                              {r.clear !== undefined && (
                                <div style={{ marginTop: 4, fontSize: 12, color: neutral.mist }}>
                                  Cleared by {r.clear.by}, <span className="mono">{hhmm(r.clear.atISO)}</span>
                                  {r.clear.note !== undefined ? `: ${r.clear.note}` : ''}
                                </div>
                              )}
                            </td>
                            <td style={cellStyle}>{r.statusKey !== '' && <StatusChip status={r.statusKey} />}</td>
                            <td className="mono" style={{ ...cellStyle, ...muted, textAlign: 'right', fontWeight: 600 }}>{r.bookingCount}</td>
                            <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', gap: 14 }}>
                                {cleared ? (
                                  <button type="button" aria-label={`Flag again, ${rowName}`} style={textActionStyle} onClick={() => restoreListConflict(useAppStore, actor, r.listId, r.cause)}>
                                    Flag again
                                  </button>
                                ) : (
                                  <>
                                    {r.listState !== 'DRAFT' && (
                                    <button
                                      type="button"
                                      aria-label={r.listState === 'AUTHORISED' ? `Reassign, ${rowName}: an authorised List is locked` : `Reassign, ${rowName}`}
                                      title={r.listState === 'AUTHORISED' ? 'An authorised List is locked' : undefined}
                                      disabled={r.listState === 'AUTHORISED'}
                                      style={r.listState === 'AUTHORISED' ? { ...textActionStyle, color: neutral.mist, cursor: 'default' } : textActionStyle}
                                      onClick={() => setReassigning(r.listId)}
                                    >
                                      Reassign
                                    </button>
                                    )}
                                    <button
                                      type="button"
                                      aria-label={`Clear conflict, ${rowName}`}
                                      style={textActionStyle}
                                      onClick={() => {
                                        const c = conflictFromCause(r.cause)
                                        if (c !== null) setClearing({ listId: r.listId, conflict: c })
                                      }}
                                    >
                                      Clear
                                    </button>
                                  </>
                                )}
                                <button type="button" aria-label={`Open the List, ${rowName}`} style={textActionStyle} onClick={() => (r.slotId !== undefined ? onOpenSession(r.slotId) : onOpenDraftList !== undefined ? onOpenDraftList(r.listId) : navigate(`/admin/day/${r.dateISO}`))}>Open</button>
                                <button type="button" aria-label={`Open the day, ${shortDay(r.dateISO)}`} style={textActionStyle} onClick={() => navigate(`/admin/day/${r.dateISO}`)}>Day</button>
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {reassignList !== undefined && (
        <ReassignListFlow open list={reassignList} actor={actor} onClose={() => setReassigning(null)} onReassigned={() => onReassigned(reassignList.id)} />
      )}
      <ClearConflictSheet
        open={clearing !== null}
        actor={actor}
        listId={clearing?.listId ?? ''}
        conflict={clearing?.conflict ?? null}
        onClose={() => setClearing(null)}
        onCleared={() => setConfirmation('Conflict cleared. It shows again under "Show cleared", where "Flag again" restores it.')}
      />
    </div>
  )
}
