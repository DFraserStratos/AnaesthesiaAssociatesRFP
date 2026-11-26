/**
 * Lists › Conflicts (US-01.5.4, US-01.5.2; OQ-09 soft warning; US-13.1.3): every List at a hospital
 * closed that day, across every date, one group per day naming the closure. A conflict is a hospital
 * closure only (an anaesthetist's unavailability goes back to the office as a Draft List, and a
 * not-preferred pairing is "not preferred"). The Bookings stay in place: from the row the office
 * reassigns the List (assigns a Draft List), clears the flag with an optional note, or flags a cleared
 * one again. Filters live in the URL (`?when=`, `?hospital=`, `?anaesthetist=`, `?cleared=1`); the
 * filtering and grouping are `conflictsView.ts`.
 */

import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONFLICT_REASONS, conflictFromCause, type ExpectedConflict } from '../../../../domain/conflicts'
import { conflictRows, restoreListConflict, scheduleHorizon, useAppStore } from '../../../../store'
import { drSurname, hhmm, locationName, shortDay } from '../../../../shared/format'
import { DRAFT_LIST, DRAFT_LISTS } from '../../../../shared/scheduleTerms'
import { isAssignedList } from '../../../../domain/draftLists'
import { AttentionDot } from '../../../../shared/warnings/AttentionDot'
import { neutral, semantic, type as typeScale } from '../../../../theme/tokens'
import { GroupRow, TableShell, Td, Th } from '../../../../shared/table'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { useAdminOutlet } from '../../outlet'
import { useListParams } from '../../useListParams'
import { ListsPage } from './ListsSection'
import { ReassignListFlow } from '../../flows/ReassignListFlow'
import { AssignDraftListSheet } from '../../flows/AssignDraftListSheet'
import { ClearConflictSheet } from '../../components/conflicts/ClearConflictSheet'
import { sessionText } from '../../../../domain/outOfHours'
import { ResultLine } from '../../../../shared/ui/ResultLine'
import { EmptyState } from '../../../../shared/ui/EmptyState'
import { Pill } from '../../../../shared/ui/Pill'
import { Checkbox, SelectField, TextAction } from '../../../../shared/ui'
import { CONFLICTS_DEFAULTS, CONFLICTS_WHEN_OPTIONS, conflictListCounts, conflictsRange, groupConflictsByDay, parseConflictsWhen } from './conflictsView'

const COLUMNS: { label: string; width?: number; align?: 'right' }[] = [
  { label: 'Session', width: 72 },
  { label: 'Anaesthetist' },
  { label: 'Hospital', width: 190 },
  { label: 'Surgeon', width: 160 },
  { label: 'Bookings', width: 86, align: 'right' },
  { label: '', width: 250 },
]

/** A Draft List in the Anaesthetist column: it has none yet (the Draft List flag's warning tint and dot). */
function DraftListPill() {
  return (
    <Pill tone="warning" data-draft-list-pill="true" leading={<span aria-hidden style={{ width: 6, height: 6, borderRadius: 3, background: semantic.warning.solid }} />}>
      {DRAFT_LIST}
    </Pill>
  )
}

export function ConflictsTab() {
  const { actor, onSelectSlot: onOpenSession, onOpenDraftList, onOpenList } = useAdminOutlet()
  const navigate = useNavigate()
  const list = useListParams(CONFLICTS_DEFAULTS)
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  const todayISO = clock.todayISO
  const { startISO, endISO } = scheduleHorizon({ clock, appSettings })

  const when = parseConflictsWhen(list.get('when'))
  const hospitalId = list.get('hospital')
  const anaesthetistId = list.get('anaesthetist')
  const showCleared = list.get('cleared') === '1'
  const narrowed = when !== 'today' || hospitalId !== '' || anaesthetistId !== ''

  const range = useMemo(() => conflictsRange(when, todayISO, { startISO, endISO }), [when, todayISO, startISO, endISO])
  const rows = useMemo(
    () =>
      conflictRows(
        { schedule, masters },
        {
          ...range,
          ...(hospitalId !== '' ? { hospitalId } : {}),
          ...(anaesthetistId !== '' ? { anaesthetistId } : {}),
          includeCleared: showCleared,
        },
      ),
    [schedule, masters, range, hospitalId, anaesthetistId, showCleared],
  )
  const days = useMemo(() => groupConflictsByDay(rows, masters), [rows, masters])
  const counts = conflictListCounts(rows)

  const [reassigning, setReassigning] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [clearing, setClearing] = useState<{ listId: string; conflict: ExpectedConflict } | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const reassigningList = reassigning !== null ? schedule.lists[reassigning] : undefined
  const reassignList = isAssignedList(reassigningList) ? reassigningList : undefined

  const nameOf = (id: string) => masters.anaesthetists[id]?.name ?? id

  /** After a reassign or an assign: who covers it now, and whether a closure went with the List. */
  function onCovered(listId: string, assigned: boolean) {
    const l = useAppStore.getState().schedule.lists[listId]
    if (l === undefined || l.anaesthetistId === undefined) return
    const who = drSurname(nameOf(l.anaesthetistId))
    const at = `${shortDay(l.dateISO)} ${sessionText(l.session)}`
    const left = [...new Set(l.conflicts.map((c) => CONFLICT_REASONS[c.kind].toLowerCase()))]
    const moved = assigned ? `${DRAFT_LIST} assigned: ${who} now covers ${at}.` : `List moved: ${who} now covers ${at}.`
    setConfirmation(left.length === 0 ? `Conflict cleared: ${who} now covers ${at}.` : `${moved} It is still flagged (${left.join(', ')}).`)
  }

  return (
    <ListsPage tab="conflicts" testId="conflicts-screen">
      <PageToolbar
        shot="conflicts-filters"
        end={
          <span data-shot="conflicts-count">
            <span className="mono" style={{ color: neutral.ink, fontWeight: 600 }}>{counts.open}</span> {counts.open === 1 ? 'List' : 'Lists'} at a closed hospital
            {showCleared && counts.cleared > 0 ? `, ${counts.cleared} cleared` : ''}
          </span>
        }
      >
        <SelectField label="When" hideLabel size="compact" fill="surface" value={when} onChange={(v) => list.set({ when: v })} shot="conflicts-when">
          {CONFLICTS_WHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
        <SelectField label="Hospital" hideLabel size="compact" fill="surface" value={hospitalId} onChange={(v) => list.set({ hospital: v })} shot="conflicts-hospital">
          <option value="">Any hospital</option>
          {Object.values(masters.hospitals)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
        </SelectField>
        <SelectField label="Anaesthetist" hideLabel size="compact" fill="surface" value={anaesthetistId} onChange={(v) => list.set({ anaesthetist: v })} shot="conflicts-anaesthetist">
          <option value="">Any anaesthetist</option>
          {Object.values(masters.anaesthetists)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
            ))}
        </SelectField>
        <Checkbox checked={showCleared} onChange={(c) => list.set({ cleared: c ? '1' : '' })} shot="conflicts-show-cleared" style={{ display: 'inline-flex', gap: 6, fontSize: 13, color: neutral.slate }}>
          Show cleared
        </Checkbox>
      </PageToolbar>

      <PageBody>
        <ResultLine
          shot="conflicts-confirmation"
          line={confirmation}
          actions={
            <TextAction size="sm" flush onClick={() => setConfirmation(null)}>
              Dismiss
            </TextAction>
          }
        />

        {days.length === 0 ? (
          <EmptyState
            variant="card"
            shot="conflicts-empty"
            title="No Lists at a closed hospital"
            action={
              narrowed ? (
                <TextAction size="sm" flush onClick={() => list.set({ when: CONFLICTS_DEFAULTS.when, hospital: '', anaesthetist: '' })}>
                  Show every hospital from today
                </TextAction>
              ) : undefined
            }
          >
            {narrowed
              ? 'Nothing matches these filters. Widen the dates or show every hospital and anaesthetist.'
              : 'Every List is at a hospital that is open that day. When a hospital closes, its Lists show here with their Bookings, ready to reassign or clear.'}
          </EmptyState>
        ) : (
          <TableShell
            fit
            shot="conflicts-table"
            label="Conflicts"
            density="compact"
            minWidth={900}
            tableStyle={{ tableLayout: 'fixed' }}
            footer={
              <span style={{ fontSize: typeScale.small.size, color: neutral.slate }}>
                Closures come from each hospital's holidays and the public holidays in Master data. A {DRAFT_LIST} at a closed hospital shows here and on {DRAFT_LISTS}.
              </span>
            }
          >
            <colgroup>
              {COLUMNS.map((c, i) => (
                <col key={i} style={c.width !== undefined ? { width: c.width } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <Th key={c.label === '' ? 'actions' : c.label} nowrap align={c.align ?? 'left'}>
                    {c.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <Fragment key={day.dateISO}>
                  <GroupRow
                    span={COLUMNS.length}
                    data-conflict-date={day.dateISO}
                    counts={`${day.open} open${day.cleared > 0 ? `, ${day.cleared} cleared` : ''}`}
                  >
                    <span style={{ color: neutral.ink }}>{shortDay(day.dateISO)}</span>
                    {day.closures.map((label) => (
                      <span key={label} data-conflict-closure="" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: day.open > 0 ? semantic.warning.onTint : neutral.mist }}>
                        <AttentionDot size={13} tone={day.open > 0 ? 'warning' : 'muted'} />
                        {label}
                      </span>
                    ))}
                  </GroupRow>
                  {day.rows.map((r) => {
                    const cleared = r.clear !== undefined
                    const draft = r.listState === 'DRAFT'
                    const muted = cleared ? { color: neutral.mist } : {}
                    const rowName = `${r.anaesthetistId !== undefined ? drSurname(nameOf(r.anaesthetistId)) : DRAFT_LIST} ${shortDay(r.dateISO)} ${sessionText(r.session)}`
                    const locked = r.listState === 'AUTHORISED'
                    return (
                      <tr key={r.key} data-conflict-row={r.listId} data-conflict-cleared={cleared ? 'true' : undefined} data-list-state={r.listState}>
                        <Td mono bold nowrap style={{ ...muted, boxShadow: `inset 3px 0 0 ${cleared ? neutral.line : semantic.warning.solid}` }}>
                          {sessionText(r.session)}
                        </Td>
                        <Td bold style={muted}>
                          {r.anaesthetistId === undefined ? <DraftListPill /> : nameOf(r.anaesthetistId)}
                          {r.clear !== undefined && (
                            <div data-conflict-cleared-by="" style={{ marginTop: 3, fontSize: 12, fontWeight: 400, color: neutral.mist }}>
                              Cleared by {r.clear.by}, <span className="mono">{hhmm(r.clear.atISO)}</span>
                              {r.clear.note !== undefined ? `: ${r.clear.note}` : ''}
                            </div>
                          )}
                        </Td>
                        <Td style={{ color: cleared ? neutral.mist : neutral.slate }}>{locationName(r.hospitalId, masters.hospitals)}</Td>
                        <Td style={{ color: cleared ? neutral.mist : neutral.slate }}>{masters.surgeons[r.surgeonId]?.name ?? r.surgeonId}</Td>
                        <Td mono bold align="right" style={muted}>
                          {r.bookingCount}
                        </Td>
                        <Td nowrap align="right">
                          <span style={{ display: 'inline-flex', gap: 14 }}>
                            {cleared ? (
                              <TextAction size="sm" flush label={`Flag again, ${rowName}`} onClick={() => restoreListConflict(useAppStore, actor, r.listId, r.cause)}>
                                Flag again
                              </TextAction>
                            ) : (
                              <>
                                {draft ? (
                                  <TextAction size="sm" flush label={`Assign ${DRAFT_LIST}, ${rowName}`} onClick={() => setAssigning(r.listId)}>
                                    Assign
                                  </TextAction>
                                ) : (
                                  <TextAction
                                    size="sm"
                                    flush
                                    label={locked ? `Reassign, ${rowName}: an authorised List is locked` : `Reassign, ${rowName}`}
                                    {...(locked ? { title: 'An authorised List is locked' } : {})}
                                    disabled={locked}
                                    onClick={() => setReassigning(r.listId)}
                                  >
                                    Reassign
                                  </TextAction>
                                )}
                                <TextAction
                                  size="sm"
                                  flush
                                  label={`Clear conflict, ${rowName}`}
                                  onClick={() => {
                                    const c = conflictFromCause(r.cause)
                                    if (c !== null) setClearing({ listId: r.listId, conflict: c })
                                  }}
                                >
                                  Clear
                                </TextAction>
                              </>
                            )}
                            <TextAction size="sm" flush label={`Open the List, ${rowName}`} onClick={() => (r.slotId !== undefined ? onOpenSession(r.slotId) : onOpenDraftList(r.listId))}>
                              Open
                            </TextAction>
                            <TextAction size="sm" flush label={`Open the day, ${shortDay(r.dateISO)}`} onClick={() => navigate(`/admin/day/${r.dateISO}`)}>
                              Day
                            </TextAction>
                          </span>
                        </Td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </TableShell>
        )}
      </PageBody>

      {reassignList !== undefined && (
        <ReassignListFlow
          open
          list={reassignList}
          actor={actor}
          onClose={() => setReassigning(null)}
          onReassigned={() => {
            setReassigning(null)
            onCovered(reassignList.id, false)
          }}
        />
      )}
      {assigning !== null && (
        <AssignDraftListSheet
          open
          listId={assigning}
          actor={actor}
          onClose={() => setAssigning(null)}
          onAssigned={(listId) => {
            setAssigning(null)
            onCovered(listId, true)
          }}
          onOpenOccupied={onOpenList}
        />
      )}
      <ClearConflictSheet
        open={clearing !== null}
        actor={actor}
        listId={clearing?.listId ?? ''}
        conflict={clearing?.conflict ?? null}
        onClose={() => setClearing(null)}
        onCleared={() => setConfirmation('Conflict cleared. It shows again under "Show cleared", where "Flag again" restores it.')}
      />
    </ListsPage>
  )
}
