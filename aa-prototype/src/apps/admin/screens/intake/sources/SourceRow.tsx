/**
 * One connected or reading source on Sources (build plan Phase 71; US-02.1.7): its name, protocol or mailbox
 * address, its state, when it last sent, today's messages and what each became, and its held count. Read only:
 * no control switches, retries or writes to a source.
 */

import type { BecameCounts, SourceRowModel } from '../../../../../domain/intake/sources'
import { hhmm, plural, shortDay } from '../../../../../shared/format'
import { Card, Pill } from '../../../../../shared/ui'
import { fontFamily, neutral, type as typeScale } from '../../../../../theme/tokens'

/** "Last sent 06:10" today, else "Last sent Mon 23 Nov"; "Nothing received yet" when it never sent. */
function lastSentText(lastSentISO: string | undefined, todayISO: string): string {
  if (lastSentISO === undefined) return 'Nothing received yet'
  return lastSentISO.slice(0, 10) === todayISO ? `Last sent ${hhmm(lastSentISO)}` : `Last sent ${shortDay(lastSentISO)}`
}

/** Today's mix as short counts, only the kinds that came. */
function becameParts(b: BecameCounts): { key: string; n: number; label: string }[] {
  return [
    { key: 'newList', n: b.newList, label: b.newList === 1 ? 'new List' : 'new Lists' },
    { key: 'update', n: b.update, label: b.update === 1 ? 'update' : 'updates' },
    { key: 'cancellation', n: b.cancellation, label: b.cancellation === 1 ? 'cancellation' : 'cancellations' },
    { key: 'unchanged', n: b.unchanged, label: 'unchanged' },
    { key: 'held', n: b.held, label: 'held' },
    { key: 'unreadable', n: b.unreadable, label: 'cannot be read' },
  ].filter((p) => p.n > 0)
}

const numStyle = { fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontSize: typeScale.data.size, fontWeight: 600, color: neutral.ink } as const
const smallStyle = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate } as const

export function SourceRow({ row, todayISO }: { row: SourceRowModel; todayISO: string }) {
  const { source } = row
  const detail = source.kind === 'mailbox' ? source.address : source.protocol
  const parts = becameParts(row.became)
  return (
    <Card
      padding="card"
      title={source.name}
      titleLevel={3}
      action={<Pill tone="success">{row.receiving === 'reading' ? 'Reading' : 'Receiving'}</Pill>}
      shot="intake-sources-row"
      data-source-id={source.id}
      data-source-kind={source.kind}
      data-source-state={source.state}
      style={{ minWidth: 0 }}
    >
      {detail !== undefined && detail !== '' && (
        <div style={{ ...smallStyle, ...(source.kind === 'mailbox' ? { fontFamily: fontFamily.mono } : {}) }}>{detail}</div>
      )}
      <div data-source-last-sent style={{ ...smallStyle, color: neutral.ink }}>
        {lastSentText(row.lastSentISO, todayISO)}
      </div>
      <div data-source-today style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'baseline' }}>
        <span style={smallStyle}>
          <span style={numStyle}>{row.todayCount}</span> today
        </span>
        {parts.map((p) => (
          <span key={p.key} data-became={p.key} style={smallStyle}>
            <span style={numStyle}>{p.n}</span> {p.label}
          </span>
        ))}
      </div>
      {row.heldCount > 0 && (
        <div>
          <Pill tone="warning" shot="intake-sources-row-held">
            {`${plural(row.heldCount, 'message')} held`}
          </Pill>
        </div>
      )}
    </Card>
  )
}
