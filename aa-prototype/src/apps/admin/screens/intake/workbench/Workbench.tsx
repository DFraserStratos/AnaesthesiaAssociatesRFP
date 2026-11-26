/**
 * The Intake Workbench (build plan Phase 68; D117; `docs/explorations/intake-ideas.html` `#idea1`): the frame every
 * arrival kind shares, docked beside the feed. The header names the kind, where it came from and when, the List's
 * title line and its flags; below it, exactly one bench for the kind, each taking `BenchProps`.
 *
 * The workbench column is already the scroller (`WorkbenchSplit`), so the frame sets no height of its own.
 *
 * Hooks: `data-shot="intake-workbench"`, `data-arrival-kind`, `data-arrival-key`; `intake-workbench-kind`,
 * `-received`, `-title` and `-flags` inside the header (the source mark is `SourceMark`'s own `data-source-kind`); each bench's own `intake-bench-<kind>`.
 */

import { useId, type ReactElement } from 'react'
import {
  ARRIVAL_FLAG_LABELS,
  ARRIVAL_KIND_LABELS,
  type ArrivalFlag,
  type ArrivalItem,
  type ArrivalKind,
} from '../../../../../domain/intake/arrivals'
import type { Actor } from '../../../../../store/mutate'
import { stampText } from '../../../../../shared/format'
import { EmptyState, Pill, type PillTone, type PillVariant } from '../../../../../shared/ui'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { SourceMark } from '../feed/SourceMark'
import type { BenchProps } from './benchProps'
import { CancellationBench } from './CancellationBench'
import { HeldMessageBench } from './HeldMessageBench'
import { MatchesExactlyBench } from './MatchesExactlyBench'
import { NeedsNhiBench } from './NeedsNhiBench'
import { NewListBench } from './NewListBench'
import { UnreadableBench } from './UnreadableBench'
import { UpdateBench } from './UpdateBench'

/** Each kind's pill, as the mockup's kind chips draw them (update amber, new green, cancellation red, the rest quiet). */
const ARRIVAL_KIND_LOOK: Record<ArrivalKind, { tone: PillTone; variant: PillVariant }> = {
  update: { tone: 'warning', variant: 'tint' },
  newList: { tone: 'success', variant: 'tint' },
  cancellation: { tone: 'error', variant: 'tint' },
  unreadable: { tone: 'error', variant: 'outline' },
  matchesExactly: { tone: 'neutral', variant: 'tint' },
  held: { tone: 'neutral', variant: 'outline' },
  needsNhi: { tone: 'warning', variant: 'outline' },
}

/** Each flag's pill: removals read as a strong flag, the rest as something to check. */
const FLAG_LOOK: Record<ArrivalFlag, { tone: PillTone; variant: PillVariant }> = {
  needsNhi: { tone: 'warning', variant: 'outline' },
  toCheck: { tone: 'warning', variant: 'tint' },
  dataQuality: { tone: 'warning', variant: 'tint' },
  removals: { tone: 'error', variant: 'outline' },
}

const FLAG_ORDER: readonly ArrivalFlag[] = ['needsNhi', 'toCheck', 'removals', 'dataQuality']

const FRAME_PAD = `${space[4]}px ${space[6]}px ${space[6]}px`

/** Exactly one bench for the arrival's kind. */
function benchFor(props: BenchProps): ReactElement {
  const kind = props.arrival.kind
  switch (kind) {
    case 'update':
      return <UpdateBench {...props} />
    case 'newList':
      return <NewListBench {...props} />
    case 'cancellation':
      return <CancellationBench {...props} />
    case 'unreadable':
      return <UnreadableBench {...props} />
    case 'matchesExactly':
      return <MatchesExactlyBench {...props} />
    case 'held':
      return <HeldMessageBench {...props} />
    case 'needsNhi':
      return <NeedsNhiBench {...props} />
    default: {
      const unreachable: never = kind
      throw new Error(`No bench for arrival kind ${String(unreachable)}`)
    }
  }
}

export function Workbench({ arrival, actor, onDone }: { arrival: ArrivalItem | undefined; actor: Actor; onDone: () => void }) {
  const headingId = useId()
  if (arrival === undefined) {
    return (
      <div data-shot="intake-workbench" style={{ padding: FRAME_PAD }}>
        <EmptyState variant="card">Choose an arrival to see it here.</EmptyState>
      </div>
    )
  }
  const kindLook = ARRIVAL_KIND_LOOK[arrival.kind]
  const flags = FLAG_ORDER.filter((f) => (arrival.flags[f] ?? 0) > 0)
  return (
    <section
      aria-labelledby={headingId}
      data-shot="intake-workbench"
      data-arrival-kind={arrival.kind}
      data-arrival-key={arrival.key}
      style={{ display: 'flex', flexDirection: 'column', gap: space[4], padding: FRAME_PAD, minWidth: 0 }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: space[2], minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space[2] }}>
          <Pill tone={kindLook.tone} variant={kindLook.variant} shot="intake-workbench-kind">
            {ARRIVAL_KIND_LABELS[arrival.kind]}
          </Pill>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[2], minWidth: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
            <SourceMark source={arrival.source} size="md" />
            <span data-shot="intake-workbench-received">Received {stampText(arrival.receivedAtISO)}</span>
          </span>
        </div>
        <h2
          id={headingId}
          data-shot="intake-workbench-title"
          style={{
            margin: 0,
            fontSize: typeScale.title.size,
            lineHeight: `${typeScale.title.line}px`,
            fontWeight: typeScale.title.weight,
            letterSpacing: typeScale.title.tracking,
            color: neutral.ink,
            overflowWrap: 'anywhere',
          }}
        >
          {arrival.title}
        </h2>
        {flags.length > 0 && (
          <div data-shot="intake-workbench-flags" style={{ display: 'flex', flexWrap: 'wrap', gap: space[1] }}>
            {flags.map((flag) => (
              <Pill key={flag} size="sm" tone={FLAG_LOOK[flag].tone} variant={FLAG_LOOK[flag].variant} data-arrival-flag={flag}>
                {ARRIVAL_FLAG_LABELS[flag]} · {arrival.flags[flag]}
              </Pill>
            ))}
          </div>
        )}
      </header>
      {benchFor({ arrival, actor, onDone })}
    </section>
  )
}
