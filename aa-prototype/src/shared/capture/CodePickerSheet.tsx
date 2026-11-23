import { InfoTipHeader } from '../help/InfoTip'
import { OverlayHeader } from '../surface/OverlayHeader'
import { useEffect, useMemo, useState } from 'react'
import { neutral, radius } from '../../theme/tokens'
import type { RvgGroup, RvgGroupId } from '../../domain/types'
import { useSurface } from '../surface'
import { NameSearchBox } from '../ui/NameSearchBox'
import { RvgCodeList, rvgSections } from './RvgCodeList'
import { plural } from '../format'

interface CodePickerSheetProps {
  open: boolean
  /** The Procedure's current RVG group, tinted teal (and first in the default list). */
  currentId?: RvgGroupId
  rvgGroups: Record<string, RvgGroup>
  onPick: (id: RvgGroupId) => void
  onClose: () => void
  /** The RVG code tip beside the title (catch-up Phase 43a): Booking capture only, not the Contract editor, Intake or the add-Booking form. */
  help?: boolean
}

const SEARCH_LABEL = 'Search RVG code or description'

/**
 * The RVG code type-ahead (catch-up Phase 19; US-05.1.1, US-05.1.3): every
 * code under its anatomy heading (pinned while its rows scroll past), the search
 * box leading and focused. Each row shows its code (mono, in a fixed column so
 * rows sharing a code line up), its description and its base units. Typing "H1"
 * narrows it to every H1 row. Nothing is suggested from the Procedure's text.
 *
 * A bottom sheet on mobile, the surface's dialog on web and Admin. Each row is
 * a plain button (the current one marked `aria-current`).
 */
export function CodePickerSheet({ open, currentId, rvgGroups, onPick, onClose, help = false }: CodePickerSheetProps) {
  const { Overlay, variant } = useSurface()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const sections = useMemo(() => rvgSections(query, rvgGroups), [rvgGroups, query])
  const count = sections.reduce((n, sec) => n + sec.rows.length, 0)

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="rvg-type-ahead">
        {help ? <InfoTipHeader title="RVG code" topic="capture.rvg" style={{ marginBottom: 12 }} /> : <OverlayHeader title="RVG code" style={{ marginBottom: 12 }} />}
        {/* The 44px clear on the phone (UI unification U4's `touch`, question 25's floor). */}
        <NameSearchBox value={query} onChange={setQuery} label={SEARCH_LABEL} autoFocus fill="well" touch={variant === 'mobile'} />
        <div style={{ fontSize: 12.5, color: neutral.mist, padding: '6px 4px 6px', minHeight: 18 }} aria-live="polite">
          {query.trim() === ''
            ? 'Type a code such as H1, or a word from the description.'
            : plural(count, 'match', 'matches')}
        </div>
        <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.md, overflow: 'hidden' }}>
          <RvgCodeList sections={sections} {...(currentId !== undefined ? { currentId } : {})} onPick={onPick} maxHeight={420} role="list" />
        </div>
      </div>
    </Overlay>
  )
}
