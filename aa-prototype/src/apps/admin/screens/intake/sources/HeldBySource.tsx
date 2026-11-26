/**
 * Held on Sources (build plan Phase 71; US-02.1.7): each source's messages that could not become a List and are
 * not yet dismissed, with the reason. A held feed message offers View raw (the restricted raw view, office only,
 * with a reason); an unreadable PDF under the mailbox shows its reason and has no raw view.
 */

import type { HeldMessage } from '../../../../../domain/intake/sources'
import type { IntakeSource } from '../../../../../domain/types'
import { hhmm, shortDay } from '../../../../../shared/format'
import { Card, EmptyState, Eyebrow, Pill, TextAction } from '../../../../../shared/ui'
import { neutral, type as typeScale } from '../../../../../theme/tokens'

function receivedText(iso: string, todayISO: string): string {
  return iso.slice(0, 10) === todayISO ? `Received ${hhmm(iso)}` : `Received ${shortDay(iso)}, ${hhmm(iso)}`
}

export function HeldBySource({
  sources,
  held,
  todayISO,
  onViewRaw,
}: {
  sources: readonly IntakeSource[]
  held: Readonly<Record<string, HeldMessage[]>>
  todayISO: string
  /** Opens the raw view for a held message; absent where no one is signed in to view it. */
  onViewRaw?: (batchId: string, sourceName: string) => void
}) {
  const withHeld = sources.filter((s) => (held[s.id]?.length ?? 0) > 0)
  return (
    <section aria-labelledby="intake-sources-held-heading" data-shot="intake-sources-held" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Eyebrow as="h2" id="intake-sources-held-heading">
        Held
      </Eyebrow>
      {withHeld.length === 0 && <EmptyState variant="card">Nothing is held.</EmptyState>}
      {withHeld.map((source) => (
        <Card key={source.id} padding="card" title={source.name} titleLevel={3} data-source-id={source.id} data-held-source>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {held[source.id]!.map((m) => (
              <li
                key={m.batchId}
                data-batch-id={m.batchId}
                data-message-state={m.unreadable === true ? 'unreadable' : 'held'}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'start' }}
              >
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: typeScale.data.size, lineHeight: `${typeScale.data.line}px`, fontWeight: 600, color: neutral.ink }}>{m.message}</span>
                    {m.unreadable === true ? <Pill tone="warning">Cannot be read</Pill> : <Pill tone="error">Held</Pill>}
                  </div>
                  <div data-held-reason style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.ink }}>
                    {m.reason}
                  </div>
                  <div style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>{receivedText(m.receivedAtISO, todayISO)}</div>
                </div>
                {m.unreadable !== true && onViewRaw !== undefined && (
                  <TextAction size="sm" shot="intake-sources-held-raw" data-batch-id={m.batchId} onClick={() => onViewRaw(m.batchId, source.name)}>
                    View raw
                  </TextAction>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </section>
  )
}
