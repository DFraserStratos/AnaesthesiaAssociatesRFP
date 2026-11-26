/**
 * Arrivals (build plan Phase 68; D117, D125; docs/explorations/intake-ideas.html #idea1): the feed beside the
 * docked Workbench in one `WorkbenchSplit`, so the office keeps its place and moves on with a key press.
 *
 * The URL holds the filter, the search and the picked item (`intakePaths.ts`). The picked item is `?item=`
 * when that arrival exists (in the feed or not), else the feed's first item (derived, never written back).
 * Picking writes `?item=` with replace, keeping the filter and search; a new filter or search drops the item.
 * When the Workbench decides an item, `?item=` is written for it and its bench stays, showing the decision,
 * though the item has left the filter: the office moves on by picking (a click, or J and K, which from an
 * item no longer listed go to the first). A Needs NHI item stops existing once its NHI is added, so the last
 * arrival shown is held for its key and its bench keeps the outcome. The Workbench remounts per item, so no
 * bench's state (an open sheet, an outcome) carries over to the next.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ArrivalItem, FeedFilter } from '../../../../domain/intake/arrivals'
import { WorkbenchSplit } from '../../../../shared/surface'
import { useArrival, useArrivalFeed, useIntakeSources } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { IntakeFeed } from './feed/IntakeFeed'
import { useIntakeOutlet } from './intakeOutlet'
import { arrivalsPath, feedFilterFromParam } from './intakePaths'
import { Workbench } from './workbench/Workbench'

export function ArrivalsView({ actor }: { actor: Actor }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { addPdfByHand } = useIntakeOutlet()
  const filter = feedFilterFromParam(params.get('filter'))
  const q = params.get('q') ?? ''
  const itemParam = params.get('item') ?? undefined

  // The box keeps what is typed (spaces included); the URL keeps it trimmed. A new `q` from outside resets it.
  const [typed, setTyped] = useState(q)
  const [seenQ, setSeenQ] = useState(q)
  if (q !== seenQ) {
    setSeenQ(q)
    if (typed.trim() !== q) setTyped(q)
  }

  const groups = useArrivalFeed(filter, q)
  const keys = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.key)), [groups])
  // The picked arrival, by key from every arrival (a decided one has left To decide), else the last one shown
  // under that key (a Needs NHI item is gone once its NHI is added); failing both, the feed's first.
  const fromUrl = useArrival(itemParam)
  const [held, setHeld] = useState<ArrivalItem | undefined>(undefined)
  const kept = fromUrl ?? (itemParam !== undefined && held?.key === itemParam ? held : undefined)
  const first = useArrival(kept === undefined ? keys[0] : undefined)
  const selected = kept ?? first
  const selectedKey = selected?.key
  if (selected !== undefined && selected !== held) setHeld(selected)

  const mailbox = useIntakeSources().find((s) => s.kind === 'mailbox' && s.state !== 'notConnected')

  const go = (next: { filter: FeedFilter; q: string; item?: string }) =>
    navigate(arrivalsPath({ filter: next.filter, q: next.q, ...(next.item !== undefined ? { item: next.item } : {}) }), { replace: true })

  const onSelect = (key: string) => go({ filter, q, item: key })
  const onFilterChange = (next: FeedFilter) => go({ filter: next, q })
  const onSearchChange = (next: string) => {
    setTyped(next)
    go({ filter, q: next })
  }
  // Decided: keep the item picked (it may have been the derived first), so its bench stays with the outcome.
  const onDone = () => {
    if (selectedKey !== undefined && selectedKey !== itemParam) go({ filter, q, item: selectedKey })
  }

  const footer =
    mailbox !== undefined || addPdfByHand !== undefined ? (
      <>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mailbox !== undefined ? [mailbox.name, mailbox.address].filter((part) => part !== undefined && part !== '').join(' · ') : null}
        </span>
        {addPdfByHand}
      </>
    ) : undefined

  return (
    <div data-shot="intake-arrivals" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <WorkbenchSplit
        shot="intake-split"
        feedWidth={400}
        feedLabel="Arrivals"
        workbenchLabel="Workbench"
        feed={
          <IntakeFeed
            groups={groups}
            filter={filter}
            q={typed}
            selectedKey={selectedKey}
            onSelect={onSelect}
            onFilterChange={onFilterChange}
            onSearchChange={onSearchChange}
            {...(footer !== undefined ? { footer } : {})}
          />
        }
        workbench={<Workbench key={selectedKey ?? ''} arrival={selected} actor={actor} onDone={onDone} />}
      />
    </div>
  )
}
