/**
 * Today's messages on Sources (build plan Phase 71; US-02.1.7): one row per message received on the demo day,
 * newest first, with what it became and its state. A hospital file of several Lists is one row.
 */

import type { TodaysMessage } from '../../../../../domain/intake/sources'
import { hhmm } from '../../../../../shared/format'
import { TableShell, Td, Th } from '../../../../../shared/table'
import { EmptyState, Eyebrow, Pill } from '../../../../../shared/ui'

function StatePills({ m }: { m: TodaysMessage }) {
  if (m.state === 'held') return <Pill tone="error">Held</Pill>
  if (m.state === 'dismissed') return <Pill tone="neutral">Dismissed</Pill>
  if (m.state === 'decided') return <Pill tone="success">Decided</Pill>
  if (m.listCount > 1) {
    return (
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
        {m.waiting > 0 && <Pill tone="warning">{`${m.waiting} waiting`}</Pill>}
        {m.unchanged > 0 && <Pill tone="success">{`${m.unchanged} match exactly`}</Pill>}
      </span>
    )
  }
  return <Pill tone="warning">Waiting on you</Pill>
}

export function TodaysMessages({ messages }: { messages: readonly TodaysMessage[] }) {
  return (
    <section aria-labelledby="intake-sources-messages-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Eyebrow as="h2" id="intake-sources-messages-heading">
        Today&apos;s messages
      </Eyebrow>
      {messages.length === 0 ? (
        <EmptyState variant="card" shot="intake-sources-messages">
          Nothing has arrived today.
        </EmptyState>
      ) : (
        <TableShell label="Today's messages" density="compact" shot="intake-sources-messages">
          <thead>
            <tr>
              <Th width={88}>Received</Th>
              <Th>Source</Th>
              <Th>Message</Th>
              <Th>Became</Th>
              <Th>State</Th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.batchId} data-batch-id={m.batchId} data-source-id={m.sourceId} data-message-state={m.state}>
                <Td mono nowrap>
                  {hhmm(m.receivedAtISO)}
                </Td>
                <Td nowrap>{m.sourceName}</Td>
                <Td>{m.message}</Td>
                <Td>{m.became}</Td>
                <Td nowrap>
                  <StatePills m={m} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </section>
  )
}
