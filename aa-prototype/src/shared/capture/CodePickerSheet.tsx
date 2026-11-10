import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { RvgGroup, RvgGroupId } from '../../domain/types'
import { baseUnitsShort, defaultPickerRows, searchRvgGroups } from '../../domain/billing/rvgGroups'
import { useSurface } from '../surface'
import { NameSearchBox } from '../ui/NameSearchBox'
import { Pill } from '../ui/Pill'

interface CodePickerSheetProps {
  open: boolean
  /** The Procedure's current RVG group, tinted teal (and first in the default list). */
  currentId?: RvgGroupId
  rvgGroups: Record<string, RvgGroup>
  onPick: (id: RvgGroupId) => void
  onClose: () => void
}

const SEARCH_LABEL = 'Search RVG code or description'

/**
 * The RVG code type-ahead (catch-up Phase 19; US-05.1.1, US-05.1.3): one flat
 * list on code and description, the search box leading and focused. Every
 * matching row shows its code (mono, in a fixed column so rows sharing a code
 * line up), its description, its anatomy heading as a small neutral label and
 * its base units, so two rows with one code are told apart at a glance. Typing
 * "H1" lists every H1 row. No tabs, no grouping, no body-section jump.
 *
 * A bottom sheet on mobile, the surface's dialog on web and Admin. Each row is
 * a plain button (the current one marked `aria-current`).
 */
export function CodePickerSheet({ open, currentId, rvgGroups, onPick, onClose }: CodePickerSheetProps) {
  const { Overlay } = useSurface()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const rows = useMemo(
    () => (query.trim() === '' ? defaultPickerRows(rvgGroups, currentId) : searchRvgGroups(query, rvgGroups)),
    [rvgGroups, query, currentId],
  )

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="rvg-type-ahead">
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>RVG code</div>
        <NameSearchBox value={query} onChange={setQuery} label={SEARCH_LABEL} autoFocus />
        <div style={{ fontSize: 12.5, color: neutral.mist, padding: '6px 4px 6px', minHeight: 18 }} aria-live="polite">
          {query.trim() === ''
            ? 'Type a code such as H1, or a word from the description.'
            : `${rows.length} ${rows.length === 1 ? 'match' : 'matches'}`}
        </div>
        <div aria-label="RVG codes" style={{ maxHeight: 420, overflow: 'auto' }}>
          {rows.length === 0 && (
            <div style={{ padding: '18px 4px', fontSize: 14, color: neutral.mist }}>No RVG codes match that search.</div>
          )}
          {rows.map((group) => {
            const selected = group.id === currentId
            return (
              <button
                key={group.id}
                type="button"
                aria-current={selected ? 'true' : undefined}
                aria-label={`${group.code}, ${group.description}, ${group.anatomy}, ${baseUnitsShort(group)}`}
                data-rvg-code={group.code}
                onClick={() => onPick(group.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr auto',
                  alignItems: 'start',
                  columnGap: 12,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: `1px solid ${neutral.sunken}`,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: '12px 10px',
                  borderRadius: radius.ctl,
                  background: selected ? accent.tint : 'transparent',
                }}
              >
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: accent.base, paddingTop: 1 }}>
                  {group.code}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: neutral.ink, lineHeight: 1.35 }}>{group.description}</span>
                  <Pill size="small" shot="rvg-anatomy">{group.anatomy}</Pill>
                </span>
                <span
                  className="mono"
                  data-shot="rvg-base-units"
                  style={{ fontSize: 12.5, fontWeight: 600, color: neutral.slate, whiteSpace: 'nowrap', paddingTop: 1 }}
                >
                  {baseUnitsShort(group)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Overlay>
  )
}
