/**
 * Arrivals (build plan Phase 68; D117, D125; docs/explorations/intake-ideas.html #idea1): the feed beside the
 * docked Workbench in one `WorkbenchSplit`, so the office keeps its place and moves on with a key press.
 *
 * The URL holds the filter, the search and the picked item (`intakePaths.ts`). The picked item is `?item=`
 * when it is in the feed, else the feed's first item (derived, never written back). Picking writes `?item=`
 * with replace, keeping the filter and search; a new filter or search drops the item. When the Workbench
 * has decided an item, the pick moves to the next one in the feed (or the one before, at the end).
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { FeedFilter } from '../../../../domain/intake/arrivals'
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
  const selectedKey = itemParam !== undefined && keys.includes(itemParam) ? itemParam : keys[0]
  const selected = useArrival(selectedKey)

  const mailbox = useIntakeSources().find((s) => s.kind === 'mailbox' && s.state !== 'notConnected')

  const go = (next: { filter: FeedFilter; q: string; item?: string }) =>
    navigate(arrivalsPath({ filter: next.filter, q: next.q, ...(next.item !== undefined ? { item: next.item } : {}) }), { replace: true })

  const onSelect = (key: string) => go({ filter, q, item: key })
  const onFilterChange = (next: FeedFilter) => go({ filter: next, q })
  const onSearchChange = (next: string) => {
    setTyped(next)
    go({ filter, q: next })
  }
  const onDone = () => {
    const at = selectedKey === undefined ? -1 : keys.indexOf(selectedKey)
    const next = at === -1 ? undefined : (keys[at + 1] ?? keys[at - 1])
    go({ filter, q, ...(next !== undefined ? { item: next } : {}) })
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
        workbench={<Workbench arrival={selected} actor={actor} onDone={onDone} />}
      />
    </div>
  )
}
