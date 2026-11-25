/**
 * An index of groups with their counts (build plan Phase 47; US-04.1.2), the left pane of a grouped
 * list: "All" first, then each group, with a mist caption where the groups' section changes, and an
 * optional note under the list. Generic, so the Contract catalogue and the Parties tab (48) share it.
 * Drawn from `docs/explorations/contracts-section.html` #catalogue's `.gidx`: each item is the shared
 * `OptionRow` `nav` variant (teal on the accent tint when picked, never crimson; the count in mono at
 * the right; a long name clipped, its full text in the title). It scrolls on its own inside
 * `PageBody nav`. It does not replace Master data's view list.
 */

import { Fragment } from 'react'
import { formatCount } from '../../../shared/format'
import { OptionRow } from '../../../shared/ui'
import { dataAttributesOf, type DataAttributes } from '../../../shared/ui/Field'
import { neutral, type as typeScale } from '../../../theme/tokens'

export interface GroupIndexItem {
  key: string
  label: string
  count: number
  /** The caption above this item when it differs from the one before (the Holder grouping's kinds). */
  section?: string
}

export interface GroupIndexProps extends DataAttributes {
  /** The nav's accessible name ("Groups"). */
  label: string
  items: readonly GroupIndexItem[]
  /** The picked key; `''` is All. */
  value: string
  allLabel: string
  allCount: number
  onSelect: (key: string) => void
  /** A line under the list ("A Contract linked to two surgeons shows under both."). */
  note?: string
  shot?: string
}

export function GroupIndex({ label, items, value, allLabel, allCount, onSelect, note, shot, ...rest }: GroupIndexProps) {
  let lastSection: string | undefined
  return (
    <nav aria-label={label} data-shot={shot} {...dataAttributesOf(rest)} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <OptionRow variant="nav" selected={value === ''} onClick={() => onSelect('')} trailing={formatCount(allCount)} title={allLabel} data-group-key="">
        {allLabel}
      </OptionRow>
      {items.map((item) => {
        const caption = item.section !== undefined && item.section !== lastSection ? item.section : undefined
        lastSection = item.section
        return (
          <Fragment key={item.key}>
            {caption !== undefined && (
              <div data-group-section style={{ fontSize: typeScale.captionSm.size, fontWeight: 700, color: neutral.mist, padding: '10px 10px 4px' }}>
                {caption}
              </div>
            )}
            <OptionRow variant="nav" selected={item.key === value} onClick={() => onSelect(item.key)} trailing={formatCount(item.count)} title={item.label} data-group-key={item.key}>
              {item.label}
            </OptionRow>
          </Fragment>
        )
      })}
      {note !== undefined && (
        <div data-group-note style={{ fontSize: typeScale.caption.size, color: neutral.slate, padding: 10, marginTop: 8, borderTop: `1px solid ${neutral.line}` }}>
          {note}
        </div>
      )}
    </nav>
  )
}
