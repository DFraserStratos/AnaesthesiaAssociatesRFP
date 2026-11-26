/**
 * The decision column's shared head (27 Nov 2026; docs/explorations/intake-arrival-kind-header.html, A1): what the
 * arrival does, named in the same place and shape for every kind, so stepping between arrivals reads at a glance.
 * The kind's icon bare in the title line ("New List", "Update to Dr Visser's List", "No changes to Dr Visser's List",
 * "Cancels Dr Visser's List", the cancellation in red), the held List's state under it, then the four-part strip
 * (Surgeon, Hospital, Day and session, Patients; `MatchBasisStrip`).
 *
 * `BenchLayout` draws it at the top of the column for the arrival `Bench` provides (`ArrivalHeadContext`), so no bench
 * draws its own. Hooks: `intake-arrival-head` (`data-arrival-kind`).
 */

import { Ban, CheckCheck, FileX, MessageSquare, Plus, RefreshCw, UserRound, type LucideIcon } from 'lucide-react'
import { createContext, useContext } from 'react'
import { ARRIVAL_KIND_LABELS, type ArrivalItem, type ArrivalKind } from '../../../../../domain/intake/arrivals'
import { drSurname } from '../../../../../shared/format'
import { PageHeader } from '../../../../../shared/ui'
import { useAppStore } from '../../../../../store'
import { neutral, semantic, space } from '../../../../../theme/tokens'
import { MatchBasisStrip } from './update/MatchBasisStrip'
import { useHeldList } from './update/updateReads'
import { listStateLine } from './update/updateText'

/** The arrival whose head the column draws; `Bench` provides it. */
export const ArrivalHeadContext = createContext<ArrivalItem | undefined>(undefined)

const ICONS: Record<ArrivalKind, LucideIcon> = {
  newList: Plus,
  update: RefreshCw,
  matchesExactly: CheckCheck,
  cancellation: Ban,
  unreadable: FileX,
  held: MessageSquare,
  needsNhi: UserRound,
}

function titleText(kind: ArrivalKind, owner: string | undefined): string {
  const list = owner !== undefined ? `${owner}'s List` : 'the List'
  switch (kind) {
    case 'update':
      return `Update to ${list}`
    case 'matchesExactly':
      return `No changes to ${list}`
    case 'cancellation':
      return `Cancels ${list}`
    default:
      return ARRIVAL_KIND_LABELS[kind]
  }
}

export function ArrivalRailHead() {
  const arrival = useContext(ArrivalHeadContext)
  const list = useHeldList(arrival?.heldListId)
  const ownerName = useAppStore((s) => {
    const id = list?.anaesthetistId
    return id !== undefined && id !== null ? s.masters.anaesthetists[id]?.name : undefined
  })
  if (arrival === undefined) return null

  const Icon = ICONS[arrival.kind]
  const cancels = arrival.kind === 'cancellation'
  const state = list !== undefined && arrival.kind !== 'newList' ? listStateLine(list.state) : undefined
  return (
    <div data-shot="intake-arrival-head" data-arrival-kind={arrival.kind} style={{ display: 'flex', flexDirection: 'column', gap: space[3], minWidth: 0 }}>
      <PageHeader
        size="section"
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}>
            <Icon size={18} strokeWidth={2.2} aria-hidden style={{ flex: 'none', color: cancels ? semantic.error.onTint : neutral.slate }} />
            {titleText(arrival.kind, ownerName !== undefined ? drSurname(ownerName) : undefined)}
          </span>
        }
        // The state line's space is kept when there is no state (a New List), so the strip sits at the same height on every kind.
        sub={state ?? <span aria-hidden>{'\u00a0'}</span>}
        {...(cancels ? { style: { color: semantic.error.onTint } } : {})}
      />
      <MatchBasisStrip arrival={arrival} />
    </div>
  )
}
