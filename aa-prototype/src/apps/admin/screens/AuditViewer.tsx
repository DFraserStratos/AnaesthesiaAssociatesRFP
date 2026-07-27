import { useMemo, useState, type CSSProperties } from 'react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { useAppStore } from '../../../store'
import {
  actionLabel,
  auditFieldChanges,
  formatAuditStamp,
  sortAuditNewestFirst,
  summariseAuditChanges,
} from '../../../shared/audit'
import { cellStyle as cellFactory, headCellStyle as headFactory } from '../tableChrome'

const cellStyle = cellFactory(true)
const headCellStyle = headFactory(true)
const selectStyle: CSSProperties = { font: 'inherit', fontSize: 13, padding: '6px 8px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink }

const SOURCES = ['all', 'anaesthetist', 'office', 'integration', 'system', 'demo'] as const

const CAP = 500

/**
 * The global audit viewer (Phase 07): a filterable feed over the one append-only
 * `state.audit`, newest first. Filter by entity type, source (anaesthetist /
 * office / integration / system / demo) and a date range. Each row shows the
 * acting Role · Source on every entry — the RBAC "who did what, as which role,
 * from which source" surface (A7). Reconstructs a Card edited + reassigned +
 * authorised as a single mixed-source trail.
 *
 * Reads through the shared audit-narrative layer: the human action label leads,
 * with the machine code beneath it (this is the compliance surface, so the code
 * stays greppable), and the change cell is a COMPACT one-liner — the leading
 * field's movement plus a count of the rest. The full field ledger belongs on the
 * Card history sheet, where someone is reading a single record; a 500-row feed
 * has to stay scannable.
 *
 * Unlike the Card sheet, this surface never collapses `Role · source` and never
 * coalesces consecutive edits: the compliance view stays explicit and one stored
 * entry stays one row.
 */
export function AuditViewer() {
  const audit = useAppStore((s) => s.audit)
  const [entityType, setEntityType] = useState('all')
  const [source, setSource] = useState('all')
  const [fromISO, setFromISO] = useState('')
  const [toISO, setToISO] = useState('')

  const entityTypes = useMemo(() => ['all', ...Array.from(new Set(audit.map((a) => a.entityType))).sort()], [audit])

  const filtered = useMemo(() => {
    const rows = audit.filter((a) => {
      if (entityType !== 'all' && a.entityType !== entityType) return false
      if (source !== 'all' && a.source !== source) return false
      const date = a.atISO.slice(0, 10)
      if (fromISO !== '' && date < fromISO) return false
      if (toISO !== '' && date > toISO) return false
      return true
    })
    // Sorted on `atISO` (id as the tiebreak), not insertion order — the same
    // shared sort the Card history sheet uses, so the two agree (finding 01.3).
    return sortAuditNewestFirst(rows)
  }, [audit, entityType, source, fromISO, toISO])

  const shown = filtered.slice(0, CAP)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Audit</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4 }}>
          Every recorded action, with the acting role and source. Nothing here is ever edited or deleted.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Filter label="Entity type">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={selectStyle}>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Filter>
        <Filter label="Source">
          <select value={source} onChange={(e) => setSource(e.target.value)} style={selectStyle}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Filter>
        <Filter label="From">
          <input type="date" value={fromISO} onChange={(e) => setFromISO(e.target.value)} style={selectStyle} />
        </Filter>
        <Filter label="To">
          <input type="date" value={toISO} onChange={(e) => setToISO(e.target.value)} style={selectStyle} />
        </Filter>
        <span style={{ fontSize: 12.5, color: neutral.mist, paddingBottom: 6 }}>{filtered.length} entries</span>
      </div>

      <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900 }}>
          <thead>
            <tr>
              {['At', 'Action', 'Who', 'Role · source', 'Entity', 'Change'].map((h) => (
                <th key={h} style={headCellStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td style={cellStyle} colSpan={6}>No matching audit entries.</td>
              </tr>
            )}
            {shown.map((entry) => {
              const change = summariseAuditChanges(auditFieldChanges(entry))
              return (
                <tr key={entry.id}>
                  <td className="mono" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{formatAuditStamp(entry.atISO)}</td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600, color: accent.pressed }}>{actionLabel(entry.action)}</div>
                    <div className="mono" style={{ fontSize: 11, color: neutral.mist }}>{entry.action}</div>
                  </td>
                  <td style={cellStyle}>{entry.who}</td>
                  <td style={cellStyle}>{entry.role} · {entry.source}</td>
                  <td style={cellStyle}>
                    <div style={{ fontSize: 12 }}>{entry.entityType}</div>
                    <div className="mono" style={{ fontSize: 11, color: neutral.mist }}>{entry.entityId}</div>
                  </td>
                  <td className="mono" style={{ ...cellStyle, fontSize: 11.5, maxWidth: 300, color: neutral.slate }}>{change}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > CAP && (
        <div style={{ fontSize: 12, color: neutral.mist }}>Showing the {CAP} most recent of {filtered.length} matching entries. Narrow the filters to see older ones.</div>
      )}
    </div>
  )
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>{label}</span>
      {children}
    </label>
  )
}
