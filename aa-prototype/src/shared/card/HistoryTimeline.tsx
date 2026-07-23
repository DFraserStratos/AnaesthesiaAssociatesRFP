import type { AuditEntry } from '../../domain/types'
import { accent, neutral } from '../../theme/tokens'
import { formatAuditChange } from '../format'

/**
 * A per-entity history timeline (Phase 07 shared affordance): the append-only
 * audit for one entity, oldest first, each row showing the time, action, who,
 * role · source and the before to after change. Pure over the entries it is
 * given (`auditForEntity`'s output) — used by the `HistorySheet` and reusable
 * anywhere an entity's reconstructable history is shown (A6/A7).
 */
export function HistoryTimeline({ entries }: { entries: readonly AuditEntry[] }) {
  if (entries.length === 0) {
    return <div style={{ fontSize: 13, color: neutral.mist }}>No recorded history yet.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map((entry) => {
        const change = formatAuditChange(entry)
        return (
          <div key={entry.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${neutral.line}` }}>
            <span className="mono" style={{ fontSize: 11, color: neutral.mist, flex: 'none', width: 116 }}>{entry.atISO.replace('T', ' ')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: accent.pressed }}>{entry.action}</span>
              <span style={{ fontSize: 12, color: neutral.slate }}>
                {entry.who} · {entry.role} · {entry.source}
              </span>
              {change !== '' && (
                <span className="mono" style={{ fontSize: 11.5, color: neutral.slate, wordBreak: 'break-word' }}>{change}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
