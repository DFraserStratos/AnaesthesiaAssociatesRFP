import { useMemo, useState } from 'react'
import { Moon, Plus, TriangleAlert } from 'lucide-react'
import { accent, neutral, semantic, radius, elevation } from '../../../theme/tokens'
import { AttentionDot } from '../../../shared/warnings/AttentionDot'
import type { DisplayKey, DraftList } from '../../../domain/types'
import { isClosedKey } from '../../../domain/slotStatus'
import type { Anaesthetist } from '../../../domain/types'
import type { AppState, ListWarningSummary, SlotView } from '../../../store'
import { useAppStore, useConflictLookups } from '../../../store'
import { CONFLICT_REASONS } from '../../../domain/conflicts'
import { resolveDisplayStatus, StatusLegend, useLegendKeys, useSlotStatusRecords } from '../../../shared'
import { attentionReasons, blockGeometry, DAY_RULER, GRID_GUTTER, hoursOf, rulerEndLabel, rulerFor, rulerLabels, slotSpan, surnameFirst, type Ruler } from '../util'
import { compareSessions, isOutOfHours } from '../../../domain/outOfHours'
import { OPEN_OUT_OF_HOURS, OUT_OF_HOURS } from '../../../shared/outOfHoursTerms'
import { DraftListBand } from './DraftListBand'
import { BookingCount } from './draftLists/DraftListParts'
import { draftListCount } from '../../../shared/scheduleTerms'
import { surgeonSpecialtyLabel } from '../../../domain/specialties'
import { plural } from '../../../shared/format'

interface DayGridProps {
  anaesthetists: Anaesthetist[]
  /**
   * The selected date's sessions, keyed by anaesthetist id (catch-up Phase 28:
   * Slot views, so the displayed status is the one `displayStatusKey`: the
   * List's kind when a List is in the session, its status otherwise).
   */
  viewsByAnaesthetist: Record<string, SlotView[]>
  masters: AppState['masters']
  /** Open warnings per List on the selected date (catch-up Phase 15a): the
   *  count and the strongest strength, from `warningSummaryByList`. */
  warningFlags: ReadonlyMap<string, ListWarningSummary>
  onSelectSlot: (slotId: string) => void
  /** Catch-up Phase 31 (US-13.1.1): the day's Draft Lists for the band, in the one order. */
  draftLists?: readonly DraftList[]
  /** Active (not cancelled) Bookings per List id: every block's count. */
  bookingCounts?: ReadonlyMap<string, number>
  onOpenDraftList?: (listId: string) => void
  /**
   * "Open out-of-hours session" on a row (catch-up Phase 32c; US-01.1.6), for
   * an anaesthetist with none open that day; absent on a past day.
   */
  onOpenOutOfHours?: (anaesthetistId: string) => void
}

/** The needs-attention amber (the warning token, not the pre-op status hue). */
const ATTENTION = semantic.warning.solid

interface Segment {
  view: SlotView
  start: number
  end: number
}

type FocusFilter = 'attention' | 'conflicts' | 'note' | 'warnings'

interface DisplaySegment extends Segment {
  displayKey: DisplayKey
  /** List-level attention (a live conflict; `attentionReasons`): the amber `!` corner. */
  listAttention: boolean
  /** List-level attention or an open warning on one of its Bookings: the outline. */
  needsAttention: boolean
  /**
   * A live conflict (catch-up Phase 30; US-01.5.2 "the List changes colour"):
   * the block takes the warning tint and border, keeping its kind's left bar
   * and label.
   */
  conflict: boolean
  hasNote: boolean
  warnings?: ListWarningSummary
}

/** Merge a both-sessions pair under one closed status (no List in either) into one full-day block (display only). */
function segmentsFor(views: SlotView[], statuses: AppState['masters']['slotStatuses']): Segment[] {
  const am = views.find((v) => v.slot.session === 'AM')
  const pm = views.find((v) => v.slot.session === 'PM')
  // An opened out-of-hours session draws after PM in its own block, whatever the day's status (catch-up Phase 32c).
  const evening = views.filter((v) => isOutOfHours(v.slot)).map((v) => ({ view: v, ...slotSpan(v) }))
  if (
    am !== undefined &&
    pm !== undefined &&
    am.list === undefined &&
    pm.list === undefined &&
    am.slot.status === pm.slot.status &&
    isClosedKey(statuses, am.slot.status)
  ) {
    return [{ view: am, start: 7, end: 18 }, ...evening]
  }
  return [...views].sort((a, b) => compareSessions(a.slot, b.slot)).map((v) => ({ view: v, ...slotSpan(v) }))
}

/**
 * A note signal is an annotation beyond the subtitle already visible in a
 * block. A public or pre-op List's note is its template label ("Acute theatre",
 * "Pre-op clinic / AA rooms"), shown as the subtitle, so only a private List's
 * note signals.
 */
function hasNoteSignal(view: SlotView): boolean {
  const list = view.list
  if (list === undefined) return false
  return list.notes !== undefined && list.notes.trim() !== '' && list.kind === 'private'
}

const NO_DRAFTS: readonly DraftList[] = []
const NO_COUNTS: ReadonlyMap<string, number> = new Map()

export function DayGrid({ anaesthetists, viewsByAnaesthetist, masters, warningFlags, onSelectSlot, draftLists = NO_DRAFTS, bookingCounts = NO_COUNTS, onOpenDraftList, onOpenOutOfHours }: DayGridProps) {
  // The ruler: 07:00 to 18:00, longer only on a day with an out-of-hours session or an evening Draft List.
  const eveningDefaults = useAppStore((s) => s.appSettings.schedule.defaultTimes.OOH)
  const ruler = useMemo(() => {
    const ends = Object.values(viewsByAnaesthetist).flatMap((vs) => vs.filter((v) => isOutOfHours(v.slot)).map((v) => slotSpan(v).end))
    const draftEnds = draftLists.some((l) => isOutOfHours(l)) ? [hoursOf(eveningDefaults.endTime)] : []
    return rulerFor([...ends, ...draftEnds])
  }, [viewsByAnaesthetist, draftLists, eveningDefaults])
  const gridline = `repeating-linear-gradient(to right,${neutral.gridline} 0,${neutral.gridline} 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) ${(100 / ruler.hours).toFixed(4)}%)`
  const afterHours = ruler.hours !== DAY_RULER.hours ? blockGeometry(DAY_RULER.start + DAY_RULER.hours, ruler.start + ruler.hours, ruler) : undefined
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<DisplayKey>>(() => new Set())
  const slotStatuses = useSlotStatusRecords()
  const legendKeys = useLegendKeys()
  const [focusFilters, setFocusFilters] = useState<Set<FocusFilter>>(() => new Set())

  const rows = useMemo(
    () =>
      anaesthetists.map((anaesthetist) => ({
        anaesthetist,
        segments: segmentsFor(viewsByAnaesthetist[anaesthetist.registrationNumber] ?? [], slotStatuses).map(
          (segment): DisplaySegment => {
            const list = segment.view.list
            const listAttention = list !== undefined && attentionReasons(list).length > 0
            const conflict = list !== undefined && list.conflicts.length > 0
            const warnings = list !== undefined ? warningFlags.get(list.id) : undefined
            return {
              ...segment,
              displayKey: segment.view.displayKey,
              listAttention,
              conflict,
              needsAttention: listAttention || warnings !== undefined,
              hasNote: hasNoteSignal(segment.view),
              warnings,
            }
          },
        ),
      })),
    [anaesthetists, viewsByAnaesthetist, warningFlags, slotStatuses],
  )

  const filteredRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        segments: row.segments.filter((segment) => {
          if (hiddenStatuses.has(segment.displayKey)) return false
          if (focusFilters.size === 0) return true
          return (
            (focusFilters.has('attention') && segment.listAttention) ||
            (focusFilters.has('conflicts') && segment.conflict) ||
            (focusFilters.has('note') && segment.hasNote) ||
            (focusFilters.has('warnings') && segment.warnings !== undefined)
          )
        }),
      })),
    [focusFilters, hiddenStatuses, rows],
  )

  const activeStatuses = useMemo(
    () => new Set(legendKeys.filter((status) => !hiddenStatuses.has(status))),
    [hiddenStatuses, legendKeys],
  )
  const totalBlocks = rows.reduce((total, row) => total + row.segments.length, 0)
  const matchingAnaesthetists = filteredRows.filter((row) => row.segments.length > 0).length
  const visibleBlocks = filteredRows.reduce((total, row) => total + row.segments.length, 0)
  const filtered = hiddenStatuses.size > 0 || focusFilters.size > 0
  const displayedRows = useMemo(() => {
    if (!filtered) return filteredRows
    const matching = []
    const inactive = []
    for (const row of filteredRows) {
      if (row.segments.length > 0) matching.push(row)
      else inactive.push(row)
    }
    return [...matching, ...inactive]
  }, [filtered, filteredRows])

  function toggleStatus(status: DisplayKey) {
    setHiddenStatuses((current) => {
      const next = new Set(current)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  function toggleFocus(filter: FocusFilter) {
    setFocusFilters((current) => {
      const next = new Set(current)
      if (next.has(filter)) next.delete(filter)
      else next.add(filter)
      return next
    })
  }

  function resetFilters() {
    setHiddenStatuses(new Set())
    setFocusFilters(new Set())
  }

  return (
    <div style={{ flex: 1, minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflow: 'hidden', boxShadow: elevation.e1 }}>
      {/* Ruler header */}
      <div style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
        <span style={{ width: 148, flex: 'none', paddingLeft: 16, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, boxSizing: 'border-box' }}>ANAESTHETIST</span>
        <span style={{ flex: 1, display: 'flex' }}>
          {rulerLabels(ruler).map((t) => (
            <span key={t} className="mono" style={{ flex: 1, fontSize: 10, color: neutral.mist }}>{t}</span>
          ))}
        </span>
        {/* The ruler's end hour, in the gutter above the row controls, so the ruler reads to its end (18:00, or later on an evening). */}
        <span className="mono" style={{ width: GRID_GUTTER, flex: 'none', fontSize: 10, color: neutral.mist }}>{rulerEndLabel(ruler)}</span>
      </div>

      {/* The day's Draft Lists, above the anaesthetists on the same ruler; never filtered. */}
      <DraftListBand draftLists={draftLists} bookingCounts={bookingCounts} onOpen={(id) => onOpenDraftList?.(id)} ruler={ruler} />

      {displayedRows.map(({ anaesthetist, segments }, index) => {
        const inactive = filtered && segments.length === 0
        const startsInactiveGroup = inactive && index === matchingAnaesthetists && matchingAnaesthetists > 0
        return (
        <div
          key={anaesthetist.registrationNumber}
          data-day-grid-row={anaesthetist.registrationNumber}
          data-filter-match={inactive ? 'false' : 'true'}
          data-filter-divider={startsInactiveGroup ? 'true' : undefined}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'stretch',
            borderBottom: `1px solid ${neutral.gridline}`,
            background: inactive ? neutral.bg : neutral.surface,
            boxShadow: startsInactiveGroup ? `inset 0 3px 0 ${neutral.lineStrong}` : undefined,
          }}
        >
          <span style={{ width: 148, flex: 'none', display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 12.5, fontWeight: 600, boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: inactive ? neutral.mist : neutral.ink }}>
            {surnameFirst(anaesthetist.name)}
          </span>
          <span style={{ flex: 1, position: 'relative', height: 44, display: 'block', backgroundImage: gridline }}>
            {afterHours !== undefined && (
              // After 18:00: a quiet zone, so the evening reads as outside the AM and PM sessions.
              <span aria-hidden data-after-hours style={{ position: 'absolute', top: 0, bottom: 0, left: afterHours.left, width: afterHours.width, background: neutral.bg, borderLeft: `1px dashed ${neutral.lineStrong}` }} />
            )}
            {segments.map((seg) => (
              <GridBlock key={seg.view.slot.id} seg={seg} masters={masters} ruler={ruler} bookingCount={seg.view.list !== undefined ? (bookingCounts.get(seg.view.list.id) ?? 0) : undefined} onClick={() => onSelectSlot(seg.view.slot.id)} />
            ))}
          </span>
          {/* The row's right gutter (catch-up Phase 32c): "Open out-of-hours session" beside where the evening session
              appears, shown only when the pointer is over the gutter or the control has keyboard focus. Last in the row,
              so a row's first button is still its first block. */}
          <span className="aa-row-gutter" style={{ width: GRID_GUTTER, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {onOpenOutOfHours !== undefined && !(viewsByAnaesthetist[anaesthetist.registrationNumber] ?? []).some((v) => isOutOfHours(v.slot)) && (
              <button
                type="button"
                className="aa-row-reveal"
                data-shot="out-of-hours-open"
                aria-label={`${OPEN_OUT_OF_HOURS} for ${surnameFirst(anaesthetist.name)}`}
                title={OPEN_OUT_OF_HOURS}
                onClick={() => onOpenOutOfHours(anaesthetist.registrationNumber)}
                style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${accent.base}`, background: neutral.surface, color: accent.base, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, padding: 0, cursor: 'pointer', boxShadow: '0 1px 2px rgba(23,35,32,0.08),0 2px 6px rgba(23,35,32,0.08)' }}
              >
                <Plus size={10} strokeWidth={3} aria-hidden />
                <Moon size={11} strokeWidth={2.4} aria-hidden />
              </button>
            )}
          </span>
        </div>
        )
      })}

      {/* Interactive legend strip + focus filters */}
      <div
        data-filter-footer-divider={filtered && matchingAnaesthetists < rows.length ? 'true' : undefined}
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '10px 16px',
          background: neutral.bg,
          boxShadow:
            filtered && matchingAnaesthetists < rows.length
              ? `inset 0 3px 0 ${neutral.lineStrong}`
              : undefined,
        }}
      >
        <StatusLegend variant="chips" activeStatuses={activeStatuses} onToggleStatus={toggleStatus} />
        <div role="group" aria-label="List focus filters" style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <SignalFilterButton
            label="Needs attention"
            active={focusFilters.has('attention')}
            icon="!"
            onClick={() => toggleFocus('attention')}
          />
          <SignalFilterButton
            label="Conflict"
            active={focusFilters.has('conflicts')}
            icon="conflict"
            onClick={() => toggleFocus('conflicts')}
          />
          <SignalFilterButton
            label="Has note"
            active={focusFilters.has('note')}
            icon="note"
            onClick={() => toggleFocus('note')}
          />
          <SignalFilterButton
            label="Has warnings"
            active={focusFilters.has('warnings')}
            icon="warning"
            onClick={() => toggleFocus('warnings')}
          />
        </div>
        {filtered && (
          <button type="button" className="aa-filter-toggle" onClick={resetFilters} style={{ border: 0, padding: '4px 2px', background: 'transparent', color: accent.base, font: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
            Reset filters
          </button>
        )}
      </div>
      <div style={{ padding: '0 16px 12px', background: neutral.bg, fontSize: 11, color: neutral.mist }}>
        {matchingAnaesthetists} of {rows.length} anaesthetists {matchingAnaesthetists === 1 ? 'has' : 'have'} matching blocks. Showing {visibleBlocks} of {totalBlocks} blocks{draftLists.length > 0 ? ` · ${draftListCount(draftLists.length)} unassigned` : ''}. At production scale (~85) this view pages and virtualises (the legacy dashboard's "1 of 3" pager); scale is narrated here, not simulated.
      </div>
    </div>
  )
}

function SignalFilterButton({ label, active, icon, onClick }: { label: string; active: boolean; icon: '!' | 'conflict' | 'warning' | 'note'; onClick: () => void }) {
  return (
    <button
      type="button"
      className="aa-filter-toggle"
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        border: `1px solid ${active ? ATTENTION : neutral.line}`,
        borderRadius: radius.pill,
        background: active ? semantic.warning.tint : neutral.surface,
        color: active ? semantic.warning.onTint : neutral.slate,
        font: 'inherit',
        fontSize: 11.5,
        cursor: 'pointer',
      }}
    >
      {icon === 'conflict' ? (
        // The conflict swatch: the block's warning tint and border with its "!" (the legend entry and the filter in one).
        <span aria-hidden data-shot="daygrid-legend-conflict" style={{ position: 'relative', width: 22, height: 13, borderRadius: 4, boxSizing: 'border-box', background: semantic.warning.tint, border: `1.5px solid ${ATTENTION}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 1 }}>
          <AttentionDot size={9} />
        </span>
      ) : icon === 'note' ? (
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: radius.pill, background: neutral.ink, opacity: 0.55 }} />
      ) : icon === 'warning' ? (
        <AttentionDot glyph="triangle" />
      ) : (
        <AttentionDot />
      )}
      {label}
    </button>
  )
}

function GridBlock({ seg, masters, ruler, bookingCount, onClick }: { seg: DisplaySegment; masters: AppState['masters']; ruler: Ruler; bookingCount: number | undefined; onClick: () => void }) {
  const { slot, list } = seg.view
  const { displayKey, listAttention, needsAttention, conflict, hasNote: hasNoteSignal, warnings } = seg
  const resolved = resolveDisplayStatus(displayKey, masters.slotStatuses)
  const colour = resolved.visual
  const isOpenEmpty = list === undefined && seg.view.open
  const conflictLookups = useConflictLookups()
  const reasons = list !== undefined ? attentionReasons(list, conflictLookups) : []
  // The block's note: the List's when a List is in the session, else the session's own.
  const note = list !== undefined ? list.notes : slot.note
  const geo = blockGeometry(seg.start, seg.end, ruler)
  // The out-of-hours session (catch-up Phase 32c): a moon before its first line, and "Out-of-hours" on an empty one.
  const evening = isOutOfHours(slot)

  // A conflicted List takes the warning tint (the design's amber attention
  // treatment, no new hex); its kind's left bar and label stay.
  const bg = conflict ? semantic.warning.tint : colour.blockBackground
  // A strong open warning outlines the block in the error red; otherwise any
  // attention (List-level, or a mild warning) is the amber outline (US-13.7.3).
  const outline = warnings?.strongest === 'strong' ? semantic.error.solid : ATTENTION
  const border = conflict ? `1.5px solid ${outline}` : colour.border !== undefined ? colour.border : needsAttention ? `1.5px solid ${outline}` : '1px solid rgba(0,0,0,0)'
  const conflictReason = list !== undefined && list.conflicts[0] !== undefined ? CONFLICT_REASONS[list.conflicts[0].kind] : undefined

  // AA rooms keeps the design's first line, the kind's long label ("Pre-op Assessment"); its name is in the subtitle.
  const hospitalName = list !== undefined && masters.hospitals[list.hospitalId]?.locationType !== 'aaRooms' ? masters.hospitals[list.hospitalId]?.name : undefined
  const surgeon = list !== undefined ? masters.surgeons[list.surgeonId] : undefined
  // Every List names its surgeon (US-01.3.1). A public or pre-op block keeps its template label as the subtitle
  // ("Acute theatre", "Pre-op clinic / AA rooms") and carries the surgeon in its tooltip, as the design shows.
  const templateLabel = list !== undefined && list.kind !== 'private' && note !== undefined && note.trim() !== '' ? note : undefined

  let l1: string
  let l2: string
  if (list !== undefined && conflictReason !== undefined) {
    // The reason replaces the surgeon line; the surgeon stays in the tooltip and the drawer.
    l1 = hospitalName ?? resolved.longLabel
    l2 = list.conflicts.length > 1 ? `${conflictReason} +${list.conflicts.length - 1}` : conflictReason
  } else if (list !== undefined) {
    l1 = hospitalName ?? resolved.longLabel
    if (templateLabel !== undefined) l2 = templateLabel
    else if (surgeon !== undefined) l2 = [surgeon.name, surgeonSpecialtyLabel(masters, surgeon)].filter((p) => p !== '').join(' · ')
    else l2 = note ?? ''
  } else if (isOpenEmpty) {
    l1 = resolved.label
    l2 = evening ? (note ?? OUT_OF_HOURS) : (note ?? '').replace(/^Free\s*\/\s*/i, '') || 'open for cover'
  } else {
    l1 = resolved.label
    l2 = note ?? (evening ? OUT_OF_HOURS : '')
  }

  // The has-note dot marks a genuine office annotation, not a note already shown
  // as the block's subtitle (recurring-booking notes, free-cover text).
  const hasNote = note !== undefined && note.trim() !== ''
  const noteIsSubtitle = hasNote && l2 === note
  const showNoteDot = hasNoteSignal && !listAttention
  const warningTip = warnings !== undefined ? plural(warnings.open, 'open warning') : ''
  const surgeonTip = (conflict || templateLabel !== undefined) && surgeon !== undefined ? surgeon.name : ''
  const countTip = bookingCount !== undefined ? plural(bookingCount, 'booking') : ''
  const tooltip = [surgeonTip, ...reasons, warningTip, hasNote && !noteIsSubtitle ? `Note: ${note}` : '', countTip].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      data-slot-id={slot.id}
      data-list-id={list?.id}
      data-shot={warnings !== undefined ? 'daygrid-block-warnings' : conflict ? 'daygrid-block-conflict' : evening ? 'daygrid-evening-block' : undefined}
      data-conflict={conflict ? 'true' : undefined}
      data-out-of-hours={evening ? 'true' : undefined}
      title={tooltip !== '' ? tooltip : undefined}
      style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        boxSizing: 'border-box',
        borderRadius: radius.xs,
        padding: '3px 6px 3px 8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        textAlign: 'left',
        cursor: 'pointer',
        left: geo.left,
        width: geo.width,
        background: bg,
        border,
        boxShadow: `inset 3px 0 0 ${colour.solid}`,
        fontFamily: 'inherit',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, fontSize: 10.5, lineHeight: '13px', fontWeight: 600, color: colour.onTint }}>
        {evening && <Moon size={9} strokeWidth={2.6} aria-label={OUT_OF_HOURS} style={{ flex: 'none' }} />}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l1}</span>
      </span>
      {(l2 !== '' || bookingCount !== undefined) && (
        // The second line starts with the List's booking count (US-13.1.1): the block's bottom-left corner.
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {bookingCount !== undefined && (
            <span data-shot="daygrid-block-count" data-booking-count={bookingCount} style={{ flex: 'none', minWidth: 14, height: 12, padding: '0 3px', boxSizing: 'border-box', borderRadius: radius.pill, background: 'rgba(255,255,255,0.72)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookingCount count={bookingCount} style={{ fontSize: 9, lineHeight: '12px', color: bookingCount === 0 ? neutral.mist : colour.onTint }} />
            </span>
          )}
          {l2 !== '' && (
            <span style={conflict ? { fontSize: 9.5, lineHeight: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: semantic.warning.onTint } : { fontSize: 9.5, lineHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: colour.onTint, opacity: 0.75 }}>{l2}</span>
          )}
        </span>
      )}
      {listAttention && (
        // A marker, never a control: the reasons reach assistive tech through the block button's title, so the glyph stays out of its name (U1).
        <AttentionDot style={{ position: 'absolute', top: 3, right: 3 }} />
      )}
      {showNoteDot && (
        <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: radius.pill, background: neutral.ink, opacity: 0.55 }} />
      )}
      {warnings !== undefined && (
        <span
          role="img"
          aria-label={plural(warnings.open, 'open warning')}
          title={plural(warnings.open, 'open warning')}
          style={{ position: 'absolute', bottom: 3, right: 3, height: 13, padding: '0 4px 0 3px', boxSizing: 'border-box', borderRadius: radius.pill, background: warnings.strongest === 'strong' ? semantic.error.solid : ATTENTION, color: neutral.surface, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
        >
          <TriangleAlert size={8} strokeWidth={3} aria-hidden />
          <span style={{ fontVariantNumeric: 'tabular-nums', lineHeight: '13px' }}>{warnings.open}</span>
        </span>
      )}
    </button>
  )
}
