/**
 * The Arrivals feed (build plan Phase 68; D117, D125; docs/explorations/intake-ideas.html #idea1, layout A):
 * the search and filters on top, then every arrival in the read model's groups. A hospital file is a
 * heading over its Lists on the page's `bg`; an arrival on its own is one item; the rows waiting for an
 * NHI gather under "Waiting for an NHI". An empty feed says so in words fitting its filter.
 *
 * The groups sit in one listbox, its items options with one roving tab stop: Up and Down (and J and K
 * anywhere on the page, `useFeedKeys`) move the pick, Home and End jump to either end, and a moved pick
 * scrolls into view and takes focus when focus was already in the feed. A foot line (the rooms' mailbox
 * and "Add a PDF by hand", layout B) sits under the list when given.
 */

import { useEffect, useId, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react'
import type { ArrivalGroup, FeedFilter } from '../../../../../domain/intake/arrivals'
import { EmptyState, Eyebrow } from '../../../../../shared/ui'
import { useConnectedHospitals } from '../../../../../store/intakeSelectors'
import { neutral, radius, type as typeScale } from '../../../../../theme/tokens'
import { FeedFilters } from './FeedFilters'
import { FeedGroupHeader } from './FeedGroupHeader'
import { FeedItem } from './FeedItem'
import { emptyFeedText } from './feedText'
import { feedKeyAfter, useFeedKeys } from './useFeedKeys'

export interface IntakeFeedProps {
  groups: ArrivalGroup[]
  filter: FeedFilter
  /** The search box's text as typed. */
  q: string
  selectedKey: string | undefined
  onSelect: (key: string) => void
  onFilterChange: (filter: FeedFilter) => void
  onSearchChange: (q: string) => void
  /** The foot line under the list (left words, right action). */
  footer?: ReactNode
}

export function IntakeFeed({ groups, filter, q, selectedKey, onSelect, onFilterChange, onSearchChange, footer }: IntakeFeedProps) {
  const baseId = useId()
  const hospitals = useConnectedHospitals()
  const keys = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.key)), [groups])
  const tabStopKey = selectedKey !== undefined && keys.includes(selectedKey) ? selectedKey : keys[0]
  const listRef = useRef<HTMLDivElement>(null)
  const items = useRef(new Map<string, HTMLDivElement>())

  useFeedKeys(keys, selectedKey, onSelect)

  // A moved pick comes into view; it takes focus only when focus was already in the feed.
  useEffect(() => {
    if (selectedKey === undefined) return
    const element = items.current.get(selectedKey)
    if (element === undefined) return
    if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' })
    const list = listRef.current
    if (list !== null && list.contains(document.activeElement) && document.activeElement !== element) element.focus()
  }, [selectedKey])

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: string | undefined
    if (event.key === 'ArrowDown') next = feedKeyAfter(keys, selectedKey, 1)
    else if (event.key === 'ArrowUp') next = feedKeyAfter(keys, selectedKey, -1)
    else if (event.key === 'Home') next = keys[0]
    else if (event.key === 'End') next = keys[keys.length - 1]
    else return
    event.preventDefault()
    if (next !== undefined && next !== selectedKey) onSelect(next)
  }

  const hospitalName = filter.kind === 'hospital' ? hospitals.find((h) => h.hospitalId === filter.hospitalId)?.name : undefined
  const itemFor = (item: ArrivalGroup['items'][number], grouped: boolean) => (
    <FeedItem
      key={item.key}
      item={item}
      grouped={grouped}
      selected={item.key === selectedKey}
      tabStop={item.key === tabStopKey}
      onSelect={onSelect}
      itemRef={(element) => {
        if (element === null) items.current.delete(item.key)
        else items.current.set(item.key, element)
      }}
    />
  )

  return (
    <div data-shot="intake-feed" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 'none', padding: '14px 16px 12px', borderBottom: `1px solid ${neutral.line}` }}>
        <FeedFilters filter={filter} q={q} onFilterChange={onFilterChange} onSearchChange={onSearchChange} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '10px 10px 12px' }}>
        {keys.length === 0 ? (
          <EmptyState shot="intake-feed-empty" style={{ padding: '12px 6px' }}>
            {emptyFeedText(filter, q, hospitalName)}
          </EmptyState>
        ) : (
          <div ref={listRef} role="listbox" aria-label="Arrivals" onKeyDown={onListKeyDown} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groups.map((group) => {
              const headingId = `${baseId}-${group.key}`
              if (group.kind === 'file' && group.heading !== undefined) {
                return (
                  <div
                    key={group.key}
                    role="group"
                    aria-labelledby={headingId}
                    data-feed-group="file"
                    style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 6, borderRadius: radius.md, background: neutral.bg }}
                  >
                    <FeedGroupHeader heading={group.heading} batchId={group.items[0]?.batchId ?? group.key} id={headingId} />
                    {group.items.map((item) => itemFor(item, true))}
                  </div>
                )
              }
              if (group.kind === 'waiting') {
                return (
                  <div key={group.key} role="group" aria-labelledby={headingId} data-feed-group="waiting" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 6px 2px' }}>
                      <Eyebrow id={headingId}>Waiting for an NHI</Eyebrow>
                      <span aria-hidden style={{ flex: 1, borderTop: `1px solid ${neutral.line}` }} />
                    </div>
                    {group.items.map((item) => itemFor(item, false))}
                  </div>
                )
              }
              return (
                <div key={group.key} data-feed-group="single" style={{ display: 'contents' }}>
                  {group.items.map((item) => itemFor(item, false))}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {footer !== undefined && (
        <div
          data-shot="intake-feed-foot"
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '6px 16px',
            borderTop: `1px solid ${neutral.line}`,
            fontSize: typeScale.captionSm.size,
            color: neutral.slate,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
