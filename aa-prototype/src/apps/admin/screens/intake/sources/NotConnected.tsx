/**
 * The hospitals not connected, last on Sources (build plan Phase 71; US-02.1.7, OQ-109 part 1 as seeded): each
 * reads "Not connected", and its Lists come by PDF to the mailbox. No control connects one.
 */

import type { IntakeSource } from '../../../../../domain/types'
import { Card, Pill } from '../../../../../shared/ui'
import { neutral, type as typeScale } from '../../../../../theme/tokens'

export function NotConnected({ sources }: { sources: readonly IntakeSource[] }) {
  if (sources.length === 0) return null
  return (
    <Card padding="card" title="Not connected" titleLevel={2} shot="intake-sources-not-connected">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
        {sources.map((s, i) => (
          <li
            key={s.id}
            data-source-id={s.id}
            data-source-kind={s.kind}
            data-source-state={s.state}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${neutral.sunken}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: typeScale.data.size, lineHeight: `${typeScale.data.line}px`, fontWeight: 600, color: neutral.ink }}>{s.name}</div>
              <div style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>Lists come by PDF to the mailbox</div>
            </div>
            <Pill tone="neutral">Not connected</Pill>
          </li>
        ))}
      </ul>
    </Card>
  )
}
