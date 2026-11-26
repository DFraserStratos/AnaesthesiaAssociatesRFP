/**
 * One arrival in the feed (build plan Phase 68; docs/explorations/intake-ideas.html #idea1, layout A's
 * `.fi`): the title line, the source mark and what it holds in words, its flags as small pills, and on
 * the right its kind and when it arrived. Every kind renders from the read model alone (`ArrivalItem`).
 *
 * The item is an option of the feed's listbox (`IntakeFeed`): `role="option"` with `aria-selected`, a
 * roving tab stop, picked by a click, Enter or Space. It is not a command button, so it is no `Button`
 * or `OptionRow` (whose `aria-pressed` would misname the pick). The picked item takes the mockup's
 * treatment: the accent tint with a 3px teal edge. Inside a hospital file (`grouped`) the file's heading
 * carries the source and the time, so the item leaves them out.
 */

import type { KeyboardEvent } from 'react'
import {
  ARRIVAL_FLAG_LABELS,
  ARRIVAL_KIND_LABELS,
  type ArrivalFlag,
  type ArrivalItem,
  type ArrivalKind,
} from '../../../../../domain/intake/arrivals'
import { Pill, type PillTone, type PillVariant } from '../../../../../shared/ui'
import { useToday } from '../../../../../store'
import { accent, elevation, fontFamily, neutral, radius, type as typeScale } from '../../../../../theme/tokens'
import { itemCountsText, receivedText } from './feedText'
import { SourceMark } from './SourceMark'

/** Each kind's pill (Design Language tints): a new List succeeds, an update or a row to check warns, a cancellation errs. */
const KIND_LOOK: Record<ArrivalKind, { tone: PillTone; variant: PillVariant }> = {
  update: { tone: 'warning', variant: 'tint' },
  newList: { tone: 'success', variant: 'tint' },
  cancellation: { tone: 'error', variant: 'tint' },
  unreadable: { tone: 'error', variant: 'outline' },
  matchesExactly: { tone: 'neutral', variant: 'tint' },
  held: { tone: 'error', variant: 'outline' },
  needsNhi: { tone: 'warning', variant: 'outline' },
}

/** The flags in the order they show; Data quality carries no number. */
const FLAG_ORDER: readonly ArrivalFlag[] = ['needsNhi', 'toCheck', 'removals', 'dataQuality']

export interface FeedItemProps {
  item: ArrivalItem
  selected: boolean
  onSelect: (key: string) => void
  /** Inside a hospital file: its heading shows the source and the time. */
  grouped?: boolean
  /** The feed's one tab stop (the picked item, else the first). */
  tabStop?: boolean
  id?: string
  itemRef?: (element: HTMLDivElement | null) => void
}

export function FeedItem({ item, selected, onSelect, grouped = false, tabStop = false, id, itemRef }: FeedItemProps) {
  const todayISO = useToday()
  const kind = KIND_LOOK[item.kind]
  const counts = itemCountsText(item)
  const flags = FLAG_ORDER.filter((f) => item.flags[f] !== undefined && !(f === 'needsNhi' && item.kind === 'needsNhi'))
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(item.key)
  }
  return (
    <div
      ref={itemRef}
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={tabStop ? 0 : -1}
      className="aa-ctl"
      data-shot="intake-feed-item"
      data-arrival-kind={item.kind}
      data-arrival-key={item.key}
      {...(item.decided ? { 'data-decided': '' } : {})}
      onClick={() => onSelect(item.key)}
      onKeyDown={onKeyDown}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        columnGap: 10,
        rowGap: 4,
        padding: '9px 10px 9px 12px',
        borderRadius: radius.sm,
        background: selected ? accent.tint : neutral.surface,
        boxShadow: selected ? `inset 3px 0 0 ${accent.base}` : elevation.e1,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontSize: typeScale.small.size,
            lineHeight: '17px',
            fontWeight: 600,
            color: item.decided ? neutral.slate : neutral.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={item.title}
        >
          {item.title}
        </div>
        {(!grouped || counts !== '') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: typeScale.captionSm.size, lineHeight: '16px', color: neutral.slate }}>
            {!grouped && <SourceMark source={item.source} />}
            {counts !== '' && <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{counts}</span>}
          </div>
        )}
        {flags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} data-arrival-flags="">
            {flags.map((f) => (
              <Pill key={f} size="sm" tone={f === 'dataQuality' ? 'neutral' : 'warning'} variant="outline" data-arrival-flag={f}>
                {f === 'dataQuality' ? ARRIVAL_FLAG_LABELS[f] : `${ARRIVAL_FLAG_LABELS[f]} ${item.flags[f] ?? 0}`}
              </Pill>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <Pill size="sm" tone={kind.tone} variant={kind.variant} data-arrival-kind-pill={item.kind}>
          {ARRIVAL_KIND_LABELS[item.kind]}
        </Pill>
        {!grouped && (
          <span style={{ fontFamily: fontFamily.mono, fontVariantNumeric: 'tabular-nums', fontSize: 11, lineHeight: '14px', color: neutral.mist }}>
            {receivedText(item.receivedAtISO, todayISO)}
          </span>
        )}
      </div>
    </div>
  )
}
