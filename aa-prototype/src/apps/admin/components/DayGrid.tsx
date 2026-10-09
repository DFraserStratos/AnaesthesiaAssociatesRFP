import { useMemo, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { accent, neutral, semantic } from '../../../theme/tokens'
import type { DisplayKey } from '../../../domain/types'
import { isClosedKey } from '../../../domain/slotStatus'
import type { Anaesthetist } from '../../../domain/types'
import type { AppState, ListWarningSummary, SlotView } from '../../../store'
import { resolveDisplayStatus, StatusLegend, useLegendKeys, useSlotStatusRecords } from '../../../shared'
import { attentionReasons, blockGeometry, slotSpan, surnameFirst } from '../util'

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
}

const RULER_LABELS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

/** The needs-attention amber (the warning token, not the pre-op status hue). */
const ATTENTION = semantic.warning.solid

interface Segment {
  view: SlotView
  start: number
  end: number
}

type FocusFilter = 'attention' | 'note' | 'warnings'

interface DisplaySegment extends Segment {
  displayKey: DisplayKey
  /** List-level attention (conflicts, surgeon TBC; `attentionReasons`): the amber `!` corner. */
  listAttention: boolean
  /** List-level attention or an open warning on one of its Bookings: the outline. */
  needsAttention: boolean
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

/** A note signal is an annotation beyond the subtitle already visible in a block. */
function hasNoteSignal(view: SlotView): boolean {
  const list = view.list
  if (list === undefined) return false
  return list.notes !== undefined && list.notes.trim() !== '' && list.surgeonId !== undefined
}

export function DayGrid({ anaesthetists, viewsByAnaesthetist, masters, warningFlags, onSelectSlot }: DayGridProps) {
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
            const warnings = list !== undefined ? warningFlags.get(list.id) : undefined
            return {
              ...segment,
              displayKey: segment.view.displayKey,
              listAttention,
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
              <GridBlock key={seg.view.slot.id} seg={seg} masters={masters} onClick={() => onSelectSlot(seg.view.slot.id)} />
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
        {matchingAnaesthetists} of {rows.length} anaesthetists {matchingAnaesthetists === 1 ? 'has' : 'have'} matching blocks. Showing {visibleBlocks} of {totalBlocks} blocks. At production scale (~85) this view pages and virtualises (the legacy dashboard's "1 of 3" pager); scale is narrated here, not simulated.
      </div>
    </div>
  )
}

function SignalFilterButton({ label, active, icon, onClick }: { label: string; active: boolean; icon: '!' | 'warning' | 'note'; onClick: () => void }) {
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
      {icon === 'note' ? (
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

function GridBlock({ seg, masters, onClick }: { seg: DisplaySegment; masters: AppState['masters']; onClick: () => void }) {
  const { slot, list } = seg.view
  const { displayKey, listAttention, needsAttention, hasNote: hasNoteSignal, warnings } = seg
  const resolved = resolveDisplayStatus(displayKey, masters.slotStatuses)
  const colour = resolved.visual
  const isOpenEmpty = list === undefined && seg.view.open
  const reasons = list !== undefined ? attentionReasons(list) : []
  // The block's note: the List's when a List is in the session, else the session's own.
  const note = list !== undefined ? list.notes : slot.note
  const geo = blockGeometry(seg.start, seg.end)

  const bg = colour.blockBackground
  // A strong open warning outlines the block in the error red; otherwise any
  // attention (List-level, or a mild warning) is the amber outline (US-13.7.3).
  const outline = warnings?.strongest === 'strong' ? semantic.error.solid : ATTENTION
  const border = colour.border !== undefined ? colour.border : needsAttention ? `1.5px solid ${outline}` : '1px solid rgba(0,0,0,0)'

  const hospitalName = list?.hospitalId !== undefined ? masters.hospitals[list.hospitalId]?.name : undefined
  const surgeon = list?.surgeonId !== undefined ? masters.surgeons[list.surgeonId] : undefined

  let l1: string
  let l2: string
  if (list !== undefined) {
    l1 = hospitalName ?? resolved.longLabel
    if (surgeon !== undefined) l2 = surgeon.name + (surgeon.specialty !== undefined ? ` · ${surgeon.specialty}` : '')
    else if (note !== undefined && note.trim() !== '') l2 = note
    else l2 = displayKey === 'private' ? 'Surgeon TBC' : ''
  } else if (isOpenEmpty) {
    l1 = resolved.label
    l2 = (note ?? '').replace(/^Free\s*\/\s*/i, '') || 'open for cover'
  } else {
    l1 = resolved.label
    l2 = note ?? ''
  }

  // The has-note dot marks a genuine office annotation, not a note already shown
  // as the block's subtitle (template labels, free-cover text).
  const hasNote = note !== undefined && note.trim() !== ''
  const noteIsSubtitle = hasNote && l2 === note
  const showNoteDot = hasNoteSignal && !listAttention
  const warningTip = warnings !== undefined ? `${warnings.open} open warning${warnings.open === 1 ? '' : 's'}` : ''
  const tooltip = [...reasons, warningTip, hasNote && !noteIsSubtitle ? `Note: ${note}` : ''].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
      data-slot-id={slot.id}
      data-list-id={list?.id}
      data-shot={warnings !== undefined ? 'daygrid-block-warnings' : undefined}
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
      {l2 !== '' && (
        <span style={{ fontSize: 9.5, lineHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: colour.onTint, opacity: 0.75 }}>{l2}</span>
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
