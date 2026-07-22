import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import { StatusChip } from '../../shared'
import { SEED_MARKERS, type SeedMarker } from '../../domain/seed'
import type { ListState } from '../../domain/types'
import {
  authoriseList,
  cancelCard,
  completeCard,
  editCard,
  entityCounts,
  submitList,
  useAppStore,
  useClockTimeLabel,
  useToday,
  type Actor,
  type Outcome,
} from '../../store'
import { neutral, accent, semantic, radius, elevation } from '../../theme/tokens'

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        boxShadow: elevation.e1,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h2>
        {subtitle !== undefined && (
          <span style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.45 }}>{subtitle}</span>
        )}
      </div>
      {children}
    </section>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12.5,
  borderBottom: `1px solid ${neutral.line}`,
  textAlign: 'left',
  verticalAlign: 'top',
}

const headCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: neutral.mist,
  borderBottom: `1px solid ${neutral.lineStrong}`,
}

const selectStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  padding: '6px 8px',
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.lineStrong}`,
  background: neutral.surface,
  color: neutral.ink,
  maxWidth: 320,
}

// ---------------------------------------------------------------------------
// Guard console personas & actions
// ---------------------------------------------------------------------------

const PERSONA_ACTORS: Record<string, Actor> = {
  souter: { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: '34821' },
  kirsty: { who: 'Kirsty W.', role: 'office', source: 'office' },
  integration: { who: 'HL7 feed', role: 'system', source: 'integration' },
}

type GuardAction = 'completeCard' | 'cancelCard' | 'editCard' | 'submitList' | 'authoriseList'

// ---------------------------------------------------------------------------
// The inspector
// ---------------------------------------------------------------------------

/**
 * Data inspector (`/demo/data`) — Phase 02's demoable surface and every later
 * session's debugging window: entity counts, today's canvas, the seeded
 * scenario finder, per-entity audit trails, lifecycle filters and a guard
 * console that shows the refusal messages for forbidden transitions.
 */
export function DemoData() {
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const audit = useAppStore((s) => s.audit)
  const state = useAppStore()

  const [markerKey, setMarkerKey] = useState<string>('')
  const [auditEntityId, setAuditEntityId] = useState<string>('')
  const [stateFilter, setStateFilter] = useState<ListState | 'ALL'>('ALL')

  const [personaKey, setPersonaKey] = useState<string>('souter')
  const [guardAction, setGuardAction] = useState<GuardAction>('completeCard')
  const [guardCardId, setGuardCardId] = useState<string>('')
  const [guardListId, setGuardListId] = useState<string>('')
  const [guardResult, setGuardResult] = useState<{ action: string; outcome: Outcome<unknown> } | null>(null)

  const counts = useMemo(() => entityCounts(state), [state])

  const todaysLists = useMemo(
    () =>
      Object.values(schedule.lists)
        .filter((l) => l.dateISO === todayISO)
        .sort((a, b) =>
          a.anaesthetistId === b.anaesthetistId
            ? a.session.localeCompare(b.session)
            : (masters.anaesthetists[a.anaesthetistId]?.name ?? '').localeCompare(
                masters.anaesthetists[b.anaesthetistId]?.name ?? '',
              ),
        ),
    [schedule.lists, todayISO, masters.anaesthetists],
  )

  const twoPerDayOk = useMemo(() => {
    const byAnae = new Map<string, number>()
    for (const l of todaysLists) byAnae.set(l.anaesthetistId, (byAnae.get(l.anaesthetistId) ?? 0) + 1)
    return (
      byAnae.size === Object.keys(masters.anaesthetists).length &&
      [...byAnae.values()].every((n) => n === 2)
    )
  }, [todaysLists, masters.anaesthetists])

  const cardCountByList = useMemo(() => {
    const byList = new Map<string, number>()
    for (const card of Object.values(schedule.cards)) {
      byList.set(card.listId, (byList.get(card.listId) ?? 0) + 1)
    }
    return byList
  }, [schedule.cards])

  const filteredLists = useMemo(
    () =>
      Object.values(schedule.lists)
        .filter((l) => (stateFilter === 'ALL' ? l.state !== 'DRAFT' : l.state === stateFilter))
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
    [schedule.lists, stateFilter],
  )

  const stateCounts = useMemo(() => {
    const out = { DRAFT: 0, SUBMITTED: 0, AUTHORISED: 0 }
    for (const l of Object.values(schedule.lists)) out[l.state] += 1
    return out
  }, [schedule.lists])

  const selectedMarker: SeedMarker | undefined = SEED_MARKERS[markerKey]

  const markerEntity = useMemo(() => {
    if (selectedMarker === undefined) return undefined
    switch (selectedMarker.entityType) {
      case 'list':
        return schedule.lists[selectedMarker.entityId]
      case 'card':
        return schedule.cards[selectedMarker.entityId]
      case 'procedure':
        return schedule.procedures[selectedMarker.entityId]
      case 'patient':
        return masters.patients[selectedMarker.entityId]
      case 'contract':
        return masters.contracts[selectedMarker.entityId]
    }
  }, [selectedMarker, schedule, masters])

  const auditTrail = useMemo(
    () => (auditEntityId === '' ? [] : audit.filter((a) => a.entityId === auditEntityId)),
    [audit, auditEntityId],
  )

  const guardTargets = useMemo(() => {
    const interestingLists = Object.values(schedule.lists)
      .filter((l) => l.state !== 'DRAFT' || l.dateISO === todayISO)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    const listIds = new Set(interestingLists.map((l) => l.id))
    const cards = Object.values(schedule.cards)
      .filter((c) => listIds.has(c.listId))
      .sort((a, b) => a.id.localeCompare(b.id))
    return { lists: interestingLists, cards }
  }, [schedule, todayISO])

  function describeList(listId: string): string {
    const list = schedule.lists[listId]
    if (list === undefined) return listId
    const who = masters.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId
    const hosp = list.hospitalId !== undefined ? (masters.hospitals[list.hospitalId]?.name ?? '') : ''
    return `${list.dateISO} ${list.session} · ${who}${hosp !== '' ? ` · ${hosp}` : ''} · ${list.state}`
  }

  function describeCard(cardId: string): string {
    const card = schedule.cards[cardId]
    if (card === undefined) return cardId
    const patient = masters.patients[card.patientId]?.name ?? card.patientId
    const status = card.cancellation !== undefined ? 'cancelled' : card.completed ? 'complete' : 'pending'
    return `${cardId} · ${patient} · ${status} (${describeList(card.listId)})`
  }

  function runGuard() {
    const actor = PERSONA_ACTORS[personaKey]
    if (actor === undefined) return
    let outcome: Outcome<unknown>
    switch (guardAction) {
      case 'completeCard':
        outcome = completeCard(useAppStore, actor, guardCardId)
        break
      case 'cancelCard':
        outcome = cancelCard(useAppStore, actor, guardCardId, 'Guard console test cancellation')
        break
      case 'editCard':
        outcome = editCard(useAppStore, actor, guardCardId, { notes: `Edited via guard console at ${timeLabel}` })
        break
      case 'submitList':
        outcome = submitList(useAppStore, actor, guardListId)
        break
      case 'authoriseList':
        outcome = authoriseList(useAppStore, actor, guardListId)
        break
    }
    setGuardResult({ action: guardAction, outcome })
  }

  const needsCard = guardAction === 'completeCard' || guardAction === 'cancelCard' || guardAction === 'editCard'

  return (
    <DemoSurface
      title="Data inspector"
      subtitle="A window into the fake in-browser backend: the seeded canvas, the ready-made scenario states, per-entity audit trails, and a guard console for trying forbidden lifecycle transitions."
    >
      {/* Clock + counts */}
      <Panel
        title={`Demo clock: ${format(parseISO(todayISO), 'EEEE d MMMM yyyy')} · ${timeLabel}`}
        subtitle="Entity counts refresh live as the store changes."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {Object.entries(counts).map(([key, value]) => (
            <div
              key={key}
              style={{
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.ctl,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{value.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: neutral.mist }}>{key}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Today's canvas */}
      <Panel
        title="Today's Lists"
        subtitle={
          twoPerDayOk
            ? 'Canvas invariant holds: exactly 2 Lists per anaesthetist today.'
            : 'CANVAS INVARIANT BROKEN: an anaesthetist does not have exactly 2 Lists today.'
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={headCellStyle}>Anaesthetist</th>
                <th style={headCellStyle}>Session</th>
                <th style={headCellStyle}>Status</th>
                <th style={headCellStyle}>Hospital</th>
                <th style={headCellStyle}>Surgeon</th>
                <th style={headCellStyle}>Times</th>
                <th style={headCellStyle}>Cards</th>
                <th style={headCellStyle}>State</th>
                <th style={headCellStyle}>Notes / conflicts</th>
              </tr>
            </thead>
            <tbody>
              {todaysLists.map((list) => (
                <tr
                  key={list.id}
                  onClick={() => setAuditEntityId(list.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={cellStyle}>{masters.anaesthetists[list.anaesthetistId]?.name ?? list.anaesthetistId}</td>
                  <td style={cellStyle}>{list.session}</td>
                  <td style={cellStyle}><StatusChip status={list.statusKey} /></td>
                  <td style={cellStyle}>{list.hospitalId !== undefined ? masters.hospitals[list.hospitalId]?.name : ''}</td>
                  <td style={cellStyle}>{list.surgeonId !== undefined ? masters.surgeons[list.surgeonId]?.name : ''}</td>
                  <td style={cellStyle} className="mono">
                    {list.startTime !== undefined ? `${list.startTime} to ${list.endTime ?? ''}` : ''}
                  </td>
                  <td style={cellStyle} className="mono">{cardCountByList.get(list.id) ?? 0}</td>
                  <td style={cellStyle}>{list.state}</td>
                  <td style={{ ...cellStyle, maxWidth: 260 }}>
                    {list.notes}
                    {list.conflicts.map((c, i) => (
                      <span key={i} style={{ color: semantic.warning.onTint, display: 'block' }}>
                        {c.kind}: {c.message}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Scenario finder */}
      <Panel
        title="Seeded scenario finder"
        subtitle="Every ready-made checklist state, one click away. Selecting a scenario also loads its audit trail below."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(SEED_MARKERS).map(([key, marker]) => {
            const active = key === markerKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMarkerKey(active ? '' : key)
                  if (!active) setAuditEntityId(marker.entityId)
                }}
                style={{
                  font: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${active ? accent.base : neutral.lineStrong}`,
                  background: active ? accent.tint : neutral.surface,
                  color: active ? accent.pressed : neutral.ink,
                  cursor: 'pointer',
                }}
              >
                {marker.label}
              </button>
            )
          })}
        </div>
        {selectedMarker !== undefined && (
          <div
            style={{
              border: `1px solid ${neutral.line}`,
              borderRadius: radius.ctl,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: neutral.bg,
            }}
          >
            <span style={{ fontSize: 13, color: neutral.slate }}>{selectedMarker.detail}</span>
            <span className="mono" style={{ fontSize: 12, color: neutral.mist }}>
              {selectedMarker.entityType} · {selectedMarker.entityId}
            </span>
            <pre
              className="mono"
              style={{
                margin: 0,
                fontSize: 11.5,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 260,
                overflow: 'auto',
                background: neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.ctl,
                padding: 10,
              }}
            >
              {JSON.stringify(markerEntity, null, 2)}
            </pre>
          </div>
        )}
      </Panel>

      {/* Audit trail */}
      <Panel
        title="Audit trail"
        subtitle="Pick any Card (or click a row/scenario above) to read its append-only history."
      >
        <select value={auditEntityId} onChange={(e) => setAuditEntityId(e.target.value)} style={selectStyle}>
          <option value="">Choose a card</option>
          {guardTargets.cards.map((c) => (
            <option key={c.id} value={c.id}>
              {describeCard(c.id)}
            </option>
          ))}
        </select>
        {auditEntityId !== '' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={headCellStyle}>At</th>
                  <th style={headCellStyle}>Action</th>
                  <th style={headCellStyle}>Who</th>
                  <th style={headCellStyle}>Role · source</th>
                  <th style={headCellStyle}>Before → after</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.length === 0 && (
                  <tr>
                    <td style={cellStyle} colSpan={5}>
                      No audit entries for {auditEntityId}. Seed history is minimal by design; runtime
                      mutations always audit.
                    </td>
                  </tr>
                )}
                {auditTrail.map((entry) => (
                  <tr key={entry.id}>
                    <td style={cellStyle} className="mono">{entry.atISO.replace('T', ' ')}</td>
                    <td style={cellStyle} className="mono">{entry.action}</td>
                    <td style={cellStyle}>{entry.who}</td>
                    <td style={cellStyle}>{entry.role} · {entry.source}</td>
                    <td style={{ ...cellStyle, maxWidth: 340 }} className="mono">
                      {entry.before !== undefined ? JSON.stringify(entry.before) : ''}
                      {entry.before !== undefined && entry.after !== undefined ? ' to ' : ''}
                      {entry.after !== undefined ? JSON.stringify(entry.after) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Lifecycle filters */}
      <Panel
        title="Lifecycle states"
        subtitle={`DRAFT ${stateCounts.DRAFT.toLocaleString()} · SUBMITTED ${stateCounts.SUBMITTED} · AUTHORISED ${stateCounts.AUTHORISED}`}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 'SUBMITTED', 'AUTHORISED', 'DRAFT'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStateFilter(f as ListState | 'ALL')}
              style={{
                font: 'inherit',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${stateFilter === f ? accent.base : neutral.lineStrong}`,
                background: stateFilter === f ? accent.tint : neutral.surface,
                color: stateFilter === f ? accent.pressed : neutral.ink,
                cursor: 'pointer',
              }}
            >
              {f === 'ALL' ? 'Non draft' : f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(stateFilter === 'DRAFT' ? filteredLists.slice(0, 20) : filteredLists).map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => setAuditEntityId(list.id)}
              style={{
                font: 'inherit',
                fontSize: 12.5,
                textAlign: 'left',
                padding: '6px 10px',
                borderRadius: radius.ctl,
                border: `1px solid ${neutral.line}`,
                background: neutral.surface,
                cursor: 'pointer',
              }}
            >
              <span className="mono" style={{ color: neutral.mist, marginRight: 8 }}>{list.id}</span>
              {describeList(list.id)}
            </button>
          ))}
          {stateFilter === 'DRAFT' && filteredLists.length > 20 && (
            <span style={{ fontSize: 12, color: neutral.mist }}>
              Showing 20 of {filteredLists.length.toLocaleString()} draft Lists.
            </span>
          )}
        </div>
      </Panel>

      {/* Guard console */}
      <Panel
        title="Guard console"
        subtitle="Attempt a lifecycle action as any persona and see the guard's outcome. Forbidden transitions return their refusal messages; nothing bypasses a guard."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <select value={personaKey} onChange={(e) => setPersonaKey(e.target.value)} style={selectStyle}>
            <option value="souter">Dr Melanie Souter (anaesthetist)</option>
            <option value="kirsty">Kirsty W. (office)</option>
            <option value="integration">Integration feed (HL7)</option>
          </select>
          <select
            value={guardAction}
            onChange={(e) => setGuardAction(e.target.value as GuardAction)}
            style={selectStyle}
          >
            <option value="completeCard">Complete card</option>
            <option value="cancelCard">Cancel card</option>
            <option value="editCard">Edit card (notes)</option>
            <option value="submitList">Submit list</option>
            <option value="authoriseList">Authorise list</option>
          </select>
          {needsCard ? (
            <select value={guardCardId} onChange={(e) => setGuardCardId(e.target.value)} style={selectStyle}>
              <option value="">Choose a card</option>
              {guardTargets.cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {describeCard(c.id)}
                </option>
              ))}
            </select>
          ) : (
            <select value={guardListId} onChange={(e) => setGuardListId(e.target.value)} style={selectStyle}>
              <option value="">Choose a list</option>
              {guardTargets.lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {describeList(l.id)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={runGuard}
            disabled={needsCard ? guardCardId === '' : guardListId === ''}
            style={{
              font: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 16px',
              borderRadius: radius.ctl,
              border: 'none',
              background: accent.base,
              color: '#FFFFFF',
              cursor: 'pointer',
              opacity: (needsCard ? guardCardId === '' : guardListId === '') ? 0.5 : 1,
            }}
          >
            Attempt
          </button>
        </div>
        {guardResult !== null && (
          <div
            style={{
              borderRadius: radius.ctl,
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              background: guardResult.outcome.ok ? semantic.success.tint : semantic.error.tint,
              color: guardResult.outcome.ok ? semantic.success.onTint : semantic.error.onTint,
              border: `1px solid ${guardResult.outcome.ok ? semantic.success.solid : semantic.error.solid}`,
            }}
          >
            {guardResult.outcome.ok ? (
              <span>
                <strong style={{ fontWeight: 600 }}>Allowed.</strong> {guardResult.action} succeeded and
                was audited.
              </span>
            ) : (
              <span>
                <strong style={{ fontWeight: 600 }}>Refused ({guardResult.outcome.code}).</strong>{' '}
                {guardResult.outcome.message}
              </span>
            )}
          </div>
        )}
      </Panel>
    </DemoSurface>
  )
}
