import { useMemo, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { accent, neutral, semantic } from '../../../theme/tokens'
import type { DisplayKey, DraftList } from '../../../domain/types'
import { isClosedKey } from '../../../domain/slotStatus'
import type { Anaesthetist } from '../../../domain/types'
import type { AppState, ListWarningSummary, SlotView } from '../../../store'
import { useConflictLookups } from '../../../store'
import { CONFLICT_REASONS } from '../../../domain/conflicts'
import { resolveDisplayStatus, StatusLegend, useLegendKeys, useSlotStatusRecords } from '../../../shared'
import { attentionReasons, blockGeometry, slotSpan, surnameFirst } from '../util'
import { DraftListBand } from './DraftListBand'
import { BookingCount } from './draftLists/DraftListParts'
import { draftListCount } from '../../../shared/scheduleTerms'

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
}

const RULER_LABELS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

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
  if (
    am !== undefined &&
    pm !== undefined &&
    am.list === undefined &&
    pm.list === undefined &&
    am.slot.status === pm.slot.status &&
    isClosedKey(statuses, am.slot.status)
  ) {
    return [{ view: am, start: 7, end: 18 }]
  }
  return [...views].sort((a, b) => a.slot.session.localeCompare(b.slot.session)).map((v) => ({ view: v, ...slotSpan(v) }))
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

export function DayGrid({ anaesthetists, viewsByAnaesthetist, masters, warningFlags, onSelectSlot, draftLists = NO_DRAFTS, bookingCounts = NO_COUNTS, onOpenDraftList }: DayGridProps) {
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
    <div style={{ flex: 1, minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(23,35,32,0.05),0 2px 6px rgba(23,35,32,0.05)' }}>
      {/* Ruler header */}
      <div style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
        <span style={{ width: 148, flex: 'none', paddingLeft: 16, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, boxSizing: 'border-box' }}>ANAESTHETIST</span>
        <span style={{ flex: 1, display: 'flex' }}>
          {RULER_LABELS.map((t) => (
            <span key={t} className="mono" style={{ flex: 1, fontSize: 10, color: neutral.mist }}>{t}</span>
          ))}
        </span>
      </div>

      {/* The day's Draft Lists, above the anaesthetists on the same ruler; never filtered. */}
      <DraftListBand draftLists={draftLists} bookingCounts={bookingCounts} onOpen={(id) => onOpenDraftList?.(id)} />

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
            display: 'flex',
            alignItems: 'stretch',
            borderBottom: '1px solid #F1F4F2',
            background: inactive ? neutral.bg : neutral.surface,
            boxShadow: startsInactiveGroup ? `inset 0 3px 0 ${neutral.lineStrong}` : undefined,
          }}
        >
          <span style={{ width: 148, flex: 'none', display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 12.5, fontWeight: 600, boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: inactive ? neutral.mist : neutral.ink }}>
            {surnameFirst(anaesthetist.name)}
          </span>
          <span style={{ flex: 1, position: 'relative', height: 44, display: 'block', backgroundImage: 'repeating-linear-gradient(to right,#F1F4F2 0,#F1F4F2 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 9.0909%)' }}>
            {segments.map((seg) => (
              <GridBlock key={seg.view.slot.id} seg={seg} masters={masters} bookingCount={seg.view.list !== undefined ? (bookingCounts.get(seg.view.list.id) ?? 0) : undefined} onClick={() => onSelectSlot(seg.view.slot.id)} />
            ))}
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
        borderRadius: 999,
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
          <span style={{ width: 9, height: 9, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 7, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
        </span>
      ) : icon === 'note' ? (
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: neutral.ink, opacity: 0.55 }} />
      ) : icon === 'warning' ? (
        <span aria-hidden style={{ width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><TriangleAlert size={8} strokeWidth={3} /></span>
      ) : (
        <span aria-hidden style={{ width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      )}
      {label}
    </button>
  )
}

function GridBlock({ seg, masters, bookingCount, onClick }: { seg: DisplaySegment; masters: AppState['masters']; bookingCount: number | undefined; onClick: () => void }) {
  const { slot, list } = seg.view
  const { displayKey, listAttention, needsAttention, conflict, hasNote: hasNoteSignal, warnings } = seg
  const resolved = resolveDisplayStatus(displayKey, masters.slotStatuses)
  const colour = resolved.visual
  const isOpenEmpty = list === undefined && seg.view.open
  const conflictLookups = useConflictLookups()
  const reasons = list !== undefined ? attentionReasons(list, conflictLookups) : []
  // The block's note: the List's when a List is in the session, else the session's own.
  const note = list !== undefined ? list.notes : slot.note
  const geo = blockGeometry(seg.start, seg.end)

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
    else if (surgeon !== undefined) l2 = surgeon.name + (surgeon.specialty !== undefined ? ` · ${surgeon.specialty}` : '')
    else l2 = note ?? ''
  } else if (isOpenEmpty) {
    l1 = resolved.label
    l2 = (note ?? '').replace(/^Free\s*\/\s*/i, '') || 'open for cover'
  } else {
    l1 = resolved.label
    l2 = note ?? ''
  }

  // The has-note dot marks a genuine office annotation, not a note already shown
  // as the block's subtitle (recurring-booking notes, free-cover text).
  const hasNote = note !== undefined && note.trim() !== ''
  const noteIsSubtitle = hasNote && l2 === note
  const showNoteDot = hasNoteSignal && !listAttention
  const warningTip = warnings !== undefined ? `${warnings.open} open warning${warnings.open === 1 ? '' : 's'}` : ''
  const surgeonTip = (conflict || templateLabel !== undefined) && surgeon !== undefined ? surgeon.name : ''
  const countTip = bookingCount !== undefined ? `${bookingCount} booking${bookingCount === 1 ? '' : 's'}` : ''
  const tooltip = [surgeonTip, ...reasons, warningTip, hasNote && !noteIsSubtitle ? `Note: ${note}` : '', countTip].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      data-slot-id={slot.id}
      data-list-id={list?.id}
      data-shot={warnings !== undefined ? 'daygrid-block-warnings' : conflict ? 'daygrid-block-conflict' : undefined}
      data-conflict={conflict ? 'true' : undefined}
      title={tooltip !== '' ? tooltip : undefined}
      style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        boxSizing: 'border-box',
        borderRadius: 6,
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
      <span style={{ fontSize: 10.5, lineHeight: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: colour.onTint }}>{l1}</span>
      {(l2 !== '' || bookingCount !== undefined) && (
        // The second line starts with the List's booking count (US-13.1.1): the block's bottom-left corner.
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          {bookingCount !== undefined && (
            <span data-shot="daygrid-block-count" data-booking-count={bookingCount} style={{ flex: 'none', minWidth: 14, height: 12, padding: '0 3px', boxSizing: 'border-box', borderRadius: 99, background: 'rgba(255,255,255,0.72)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookingCount count={bookingCount} style={{ fontSize: 9, lineHeight: '12px', color: bookingCount === 0 ? neutral.mist : colour.onTint }} />
            </span>
          )}
          {l2 !== '' && (
            <span style={conflict ? { fontSize: 9.5, lineHeight: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: semantic.warning.onTint } : { fontSize: 9.5, lineHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: colour.onTint, opacity: 0.75 }}>{l2}</span>
          )}
        </span>
      )}
      {listAttention && (
        <span style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
      )}
      {showNoteDot && (
        <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 99, background: neutral.ink, opacity: 0.55 }} />
      )}
      {warnings !== undefined && (
        <span
          role="img"
          aria-label={`${warnings.open} open warning${warnings.open === 1 ? '' : 's'}`}
          title={`${warnings.open} open warning${warnings.open === 1 ? '' : 's'}`}
          style={{ position: 'absolute', bottom: 3, right: 3, height: 13, padding: '0 4px 0 3px', boxSizing: 'border-box', borderRadius: 99, background: warnings.strongest === 'strong' ? semantic.error.solid : ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
        >
          <TriangleAlert size={8} strokeWidth={3} aria-hidden />
          <span style={{ fontVariantNumeric: 'tabular-nums', lineHeight: '13px' }}>{warnings.open}</span>
        </span>
      )}
    </button>
  )
}
