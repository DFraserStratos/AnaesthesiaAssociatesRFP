/**
 * Exactly one bench for the arrival's kind (build plan Phase 68; D117; the opened arrival's O1). Each bench takes
 * `BenchProps` and lays itself out with `BenchLayout`; the opened arrival's page header names the arrival, so the
 * bench draws no header of its own.
 */

import type { ReactElement } from 'react'
import type { BenchProps } from './benchProps'
import { CancellationBench } from './CancellationBench'
import { HeldMessageBench } from './HeldMessageBench'
import { MatchesExactlyBench } from './MatchesExactlyBench'
import { NeedsNhiBench } from './NeedsNhiBench'
import { NewListBench } from './NewListBench'
import { UnreadableBench } from './UnreadableBench'
import { UpdateBench } from './UpdateBench'

export function Bench(props: BenchProps): ReactElement {
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
