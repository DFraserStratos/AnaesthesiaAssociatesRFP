import type { ReactNode } from 'react'
import { StubMarker } from '../stubs/StubMarker'
import { ChevronRight } from 'lucide-react'
import { elevation, neutral, radius } from '../../theme/tokens'
import type { DisplayKey } from '../../domain/types'
import type { ListProgress } from '../../domain/listProgress'
import { PILL_TONES } from '../ui/Pill'
import { PROGRESS_DONE_COLOR, progressLabel, progressTone } from './ProgressPill'
import { useDisplayStatus } from '../status/useSlotStatuses'
import { TickBadge } from '../ui/TickBadge'
import { OutOfHoursMoon } from './OutOfHoursMark'
import { OUT_OF_HOURS } from '../outOfHoursTerms'
import { sessionText } from '../../domain/outOfHours'
import { plural } from '../format'

/**
 * The right-hand state cluster of a list row (mockup screen 1). `progress` reads
 * `LIST_PROGRESS_LABEL` (catch-up Phase 38a), the one source of "Done · unbilled",
 * "Ready to submit", "Authorised" and "Invoiced"; `toFinish` carries the count.
 */
export type ListRowRight =
  | { kind: 'progress'; progress: Exclude<ListProgress, 'toFinish' | 'upcoming'> }
  | { kind: 'toFinish'; count: number }
  | { kind: 'count'; count: number; statusKey: DisplayKey }
  | { kind: 'chip'; statusKey: DisplayKey; label: string }
  | { kind: 'custom'; node: ReactNode }

interface ListRowProps {
  /** A List kind or an availability status ID (catch-up Phase 29). */
  statusKey: DisplayKey
  /** "AM" / "PM" / "OOH"; omit to hide the session column (e.g. a leave row). */
  session?: string
  /** Mono start time under the session label. */
  time?: string
  title: string
  subtitle?: string
  right: ListRowRight
  onClick?: () => void
  /**
   * Row body treatment: `open` an open session (the status's own fill, dashed
   * for Free), `closed` a closed status (its tint), `default` a List.
   */
  variant?: 'default' | 'open' | 'closed'
  /** The session the row shows (a Slot id; catch-up Phase 28), for test and capture hooks. */
  slotId?: string
  /** The List the row opens, if any. */
  listId?: string
  /** A small neutral pill after the title, e.g. "New" on a List a colleague moved to her (catch-up Phase 32). */
  badge?: string
  /** Stubs standing on the List (catch-up Phase 33a): the triangle marker after the title. Never counted as Bookings. */
  stubCount?: number
  /**
   * Less prominent than active work: a submitted List (US-07.4.2, FT-07.2). Still a
   * normal tap target and still editable; only the weight and lift drop.
   */
  quiet?: boolean
  /**
   * The out-of-hours session (catch-up Phase 32c; set by itself when `session`
   * is `OOH`): the session column shows a moon and the start time in place of
   * AM or PM, and the subtitle starts with "Out-of-hours" (the title stays on
   * one line, as on any row).
   */
  outOfHours?: boolean
}

function Chevron() {
  return <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
}

/** The Mobile App mockup's row pill (`5px 10px` 11/600, kept as drawn; README section 5); tones from the shared `Pill`. */
function RowPill({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return (
    <span style={{ padding: '5px 10px', borderRadius: radius.pill, background: bg, fontSize: 11, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function RightCluster({ right, held = false }: { right: ListRowRight; held?: boolean }) {
  if (right.kind === 'custom') return <>{right.node}</>
  if (right.kind === 'progress') {
    const label = progressLabel(right.progress)
    const tone = progressTone(right.progress)
    // Submitted and ready to submit share the design's done tick cluster (stacked,
    // narrow, no chevron); a submitted row is also quieter (`quiet`). A List holding
    // a stub never reads complete (catch-up Phase 33a): its done label is an amber pill, no tick.
    if (tone === 'done' && !held) {
      return (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none' }}>
          <TickBadge size={24} />
          <span style={{ fontSize: 11, fontWeight: 600, color: PROGRESS_DONE_COLOR, whiteSpace: 'nowrap' }}>{label}</span>
        </span>
      )
    }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <RowPill bg={PILL_TONES[tone === 'done' ? 'warning' : tone].tint} color={PILL_TONES[tone === 'done' ? 'warning' : tone].onTint}>
          {/* Held by a stub, a done List does not read done, so the row and the Done filter agree (Wave 7 join; 72). */}
          {tone === 'done' && held ? 'Waiting at intake' : label}
        </RowPill>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'toFinish') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <RowPill bg={PILL_TONES.warning.tint} color={PILL_TONES.warning.onTint}>
          {right.count} {progressLabel('toFinish').toLowerCase()}
        </RowPill>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'count') return <CountPill count={right.count} statusKey={right.statusKey} />
  return <ChipPill statusKey={right.statusKey} label={right.label} />
}

function CountPill({ count, statusKey }: { count: number; statusKey: DisplayKey }) {
  const s = useDisplayStatus(statusKey).visual
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RowPill bg={s.tint} color={s.onTint}>
          {plural(count, 'booking')}
        </RowPill>
        <Chevron />
      </span>
  )
}

function ChipPill({ statusKey, label }: { statusKey: DisplayKey; label: string }) {
  const s = useDisplayStatus(statusKey).visual
  return (
    <RowPill bg={neutral.surface} color={s.onTint}>
      {label}
    </RowPill>
  )
}

/**
 * The Forward-Lists row (mockup screen 1): a status rail, the AM/PM + mono-time
 * column, the hospital/surgeon/count line, and a right-side state. An open
 * session's row takes its status's own fill (dashed green for Free); a closed
 * status's row its tint (holiday pink for On
 * holiday). Colours come from the status master (catch-up Phase 29). The load-bearing list primitive; moved to `src/shared/schedule` in
 * Phase 05 so the web app reuses it (mobile Forward Lists + web Lists / booking
 * rows).
 */
export function ListRow({
  statusKey,
  session,
  time,
  title,
  subtitle,
  right,
  onClick,
  variant = 'default',
  slotId,
  listId,
  badge,
  stubCount = 0,
  quiet = false,
  outOfHours: outOfHoursProp = false,
}: ListRowProps) {
  const resolved = useDisplayStatus(statusKey)
  // The out-of-hours session (catch-up Phase 32c): a moon in the session column, the words in the subtitle.
  const outOfHours = outOfHoursProp || session === 'OOH'
  const c = resolved.visual
  const isOpen = variant === 'open'
  const isClosed = variant === 'closed'

  const body =
    isOpen
      ? { background: c.blockBackground, border: c.border ?? `1px solid ${neutral.line}`, boxShadow: elevation.e0 }
      : isClosed
        ? { background: c.tint, border: `1px solid ${c.rowEdge}`, boxShadow: elevation.e0 }
        : quiet
          ? { background: neutral.surface, border: `1px solid ${neutral.line}`, boxShadow: elevation.e0 }
          : { background: neutral.surface, border: `1px solid ${neutral.line}`, boxShadow: elevation.e1 }

  const titleColor = isOpen || isClosed ? c.onTint : quiet ? neutral.slate : neutral.ink
  const subColor = isOpen || isClosed ? c.onTint : neutral.slate
  const sessionColor = isOpen ? c.onTint : neutral.ink

  const Tag = onClick !== undefined ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      {...(onClick !== undefined ? { type: 'button' as const } : {})}
      data-slot-id={slotId}
      data-list-id={listId}
      data-quiet={quiet ? 'true' : undefined}
      data-shot={outOfHours ? 'out-of-hours-row' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: radius.card,
        width: '100%',
        textAlign: 'left',
        fontFamily: 'inherit',
        cursor: onClick !== undefined ? 'pointer' : 'default',
        ...body,
      }}
    >
      {!isOpen && (
        <span style={{ width: 4, height: 46, borderRadius: radius.pill, background: c.solid, flex: 'none', opacity: quiet ? 0.45 : 1 }} aria-hidden />
      )}
      {session !== undefined && (
        <span style={{ width: 46, flex: 'none', display: 'flex', flexDirection: 'column' }}>
          {outOfHours ? (
            <OutOfHoursMoon color={quiet ? neutral.slate : sessionColor} />
          ) : (
            <span style={{ fontSize: 14, fontWeight: quiet ? 600 : 700, color: quiet ? neutral.slate : sessionColor }}>{sessionText(session)}</span>
          )}
          {time !== undefined && (
            <span className="mono" style={{ fontSize: 11, color: isOpen ? c.onTint : neutral.mist, opacity: isOpen ? 0.75 : 1 }}>
              {time}
            </span>
          )}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: quiet ? 500 : 600, color: titleColor }}>{title}</span>
          {badge !== undefined && (
            <span data-shot="list-row-badge" style={{ flex: 'none', padding: '2px 8px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.ink, fontSize: 11, fontWeight: 700 }}>
              {badge}
            </span>
          )}
          <StubMarker count={stubCount} shot="list-row-stub" />
        </span>
        {(subtitle !== undefined || outOfHours) && (
          <span style={{ fontSize: 12, color: subColor, opacity: isOpen || isClosed ? 0.85 : 1 }}>
            {outOfHours ? [OUT_OF_HOURS, subtitle].filter((p) => p !== undefined && p !== '').join(' · ') : subtitle}
          </span>
        )}
      </span>
      <RightCluster right={right} held={stubCount > 0} />
    </Tag>
  )
}
