import { useMemo } from 'react'
import { neutral, semantic } from '../../../theme/tokens'
import { statusColours, unavailableHatchTint, freeDashedBorder } from '../../../theme/statusColours'
import type { Anaesthetist, List } from '../../../domain/types'
import type { AppState } from '../../../store'
import { StatusLegend } from '../../../shared'
import { attentionReasons, blockGeometry, isBooked, listSpan, surnameFirst } from '../util'

interface DayGridProps {
  anaesthetists: Anaesthetist[]
  /** AM/PM lists for the selected date, keyed by anaesthetist id. */
  listsByAnaesthetist: Record<string, List[]>
  masters: AppState['masters']
  /** Active (non-cancelled) card count per list — a Free list that gains cards
   *  via the phone-advice path renders as a booked block. */
  activeCardCounts: Record<string, number>
  /** Lists holding a card whose pre-payment is flagged (Phase 09): outstanding
   *  (required / invoiced-unpaid) or an office-overridden gate. */
  prepaymentFlags: Map<string, 'outstanding' | 'overridden'>
  onSelectList: (listId: string) => void
}

const RULER_LABELS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

/** The needs-attention amber (the warning token, not the pre-op status hue). */
const ATTENTION = semantic.warning.solid

interface Segment {
  list: List
  start: number
  end: number
}

/** Merge a both-sessions holiday/unavailable pair into one full-day block. */
function segmentsFor(lists: List[]): Segment[] {
  const am = lists.find((l) => l.session === 'AM')
  const pm = lists.find((l) => l.session === 'PM')
  if (
    am !== undefined &&
    pm !== undefined &&
    am.statusKey === pm.statusKey &&
    (am.statusKey === 'holiday' || am.statusKey === 'unavailable') &&
    am.conflicts.length === 0 &&
    pm.conflicts.length === 0
  ) {
    return [{ list: am, start: 7, end: 18 }]
  }
  return lists.map((l) => ({ list: l, ...listSpan(l) }))
}

export function DayGrid({ anaesthetists, listsByAnaesthetist, masters, activeCardCounts, prepaymentFlags, onSelectList }: DayGridProps) {
  const rows = useMemo(
    () => anaesthetists.map((a) => ({ anaesthetist: a, segments: segmentsFor(listsByAnaesthetist[a.registrationNumber] ?? []) })),
    [anaesthetists, listsByAnaesthetist],
  )

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

      {rows.map(({ anaesthetist, segments }) => (
        <div key={anaesthetist.registrationNumber} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #F1F4F2' }}>
          <span style={{ width: 148, flex: 'none', display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 12.5, fontWeight: 600, boxSizing: 'border-box', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {surnameFirst(anaesthetist.name)}
          </span>
          <span style={{ flex: 1, position: 'relative', height: 44, display: 'block', backgroundImage: 'repeating-linear-gradient(to right,#F1F4F2 0,#F1F4F2 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 9.0909%)' }}>
            {segments.map((seg) => (
              <GridBlock key={seg.list.id} seg={seg} masters={masters} hasCards={(activeCardCounts[seg.list.id] ?? 0) > 0} prepaymentFlag={prepaymentFlags.get(seg.list.id)} onClick={() => onSelectList(seg.list.id)} />
            ))}
          </span>
        </div>
      ))}

      {/* Legend strip + adornments */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: '10px 16px', background: neutral.bg }}>
        <StatusLegend variant="chips" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: neutral.slate }}>
          <span style={{ width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
          Needs attention
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: neutral.slate }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: neutral.ink, opacity: 0.55 }} />
          Has note
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: neutral.slate }}>
          <span style={{ width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>$</span>
          Pre-payment flagged
        </span>
      </div>
      <div style={{ padding: '0 16px 12px', background: neutral.bg, fontSize: 11, color: neutral.mist }}>
        Showing the demo's 14 anaesthetists. At production scale (~85) this view pages and virtualises (the legacy dashboard's "1 of 3" pager); scale is narrated here, not simulated.
      </div>
    </div>
  )
}

function GridBlock({ seg, masters, hasCards, prepaymentFlag, onClick }: { seg: Segment; masters: AppState['masters']; hasCards: boolean; prepaymentFlag?: 'outstanding' | 'overridden'; onClick: () => void }) {
  const { list } = seg
  // A Free list booked via the phone-advice path (cards added or a hospital
  // assigned) renders as a booked block, even though its statusKey stays free
  // (status is reassign/reconcile-owned, not office-editable).
  const bookedFree = list.statusKey === 'free' && (hasCards || list.hospitalId !== undefined)
  const displayKey = bookedFree ? 'private' : list.statusKey
  const colour = statusColours[displayKey]
  const reasons = attentionReasons(list)
  const needsAttention = reasons.length > 0
  const geo = blockGeometry(seg.start, seg.end)

  const bg = displayKey === 'unavailable' ? unavailableHatchTint : colour.tint
  const border = displayKey === 'free' ? freeDashedBorder : needsAttention ? `1.5px solid ${ATTENTION}` : '1px solid rgba(0,0,0,0)'

  const hospitalName = list.hospitalId !== undefined ? masters.hospitals[list.hospitalId]?.name : undefined
  const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId] : undefined

  let l1: string
  let l2: string
  if (isBooked(displayKey)) {
    l1 = hospitalName ?? colour.longLabel
    if (surgeon !== undefined) l2 = surgeon.name + (surgeon.specialty !== undefined ? ` · ${surgeon.specialty}` : '')
    else if (list.notes !== undefined && list.notes.trim() !== '') l2 = list.notes
    else l2 = displayKey === 'private' ? 'Surgeon TBC' : ''
  } else if (displayKey === 'free') {
    l1 = 'Free'
    l2 = (list.notes ?? '').replace(/^Free\s*\/\s*/i, '') || 'open for cover'
  } else {
    l1 = colour.longLabel
    l2 = list.notes ?? ''
  }

  // The has-note dot marks a genuine office annotation, not a note already shown
  // as the block's subtitle (template labels, free-cover text).
  const hasNote = list.notes !== undefined && list.notes.trim() !== ''
  const noteIsSubtitle = hasNote && l2 === list.notes
  const showNoteDot = hasNote && !noteIsSubtitle && !needsAttention && displayKey !== 'free'
  const tooltip = [...reasons, hasNote && !noteIsSubtitle ? `Note: ${list.notes}` : ''].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onClick}
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
      {needsAttention && (
        <span style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
      )}
      {showNoteDot && (
        <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 99, background: neutral.ink, opacity: 0.55 }} />
      )}
      {prepaymentFlag !== undefined && (
        <span title={prepaymentFlag === 'overridden' ? 'Pre-payment gate overridden' : 'Pre-payment outstanding'} style={{ position: 'absolute', bottom: 3, right: 3, width: 13, height: 13, borderRadius: 99, background: ATTENTION, color: '#FFFFFF', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>$</span>
      )}
    </button>
  )
}
