import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { elevation, neutral, radius, semantic } from '../../theme/tokens'
import { STATUS_PALETTE } from '../../theme/statusColours'
import type { DisplayKey } from '../../domain/types'
import { useDisplayStatus } from '../status/useSlotStatuses'
import { TickBadge } from '../ui/TickBadge'

/** The right-hand state cluster of a list row (mockup screen 1). */
export type ListRowRight =
  | { kind: 'doneUnbilled' }
  | { kind: 'toFinish'; count: number }
  | { kind: 'count'; count: number; statusKey: DisplayKey }
  | { kind: 'chip'; statusKey: DisplayKey; label: string }
  | { kind: 'custom'; node: ReactNode }

interface ListRowProps {
  /** A List kind or an availability status ID (catch-up Phase 29). */
  statusKey: DisplayKey
  /** "AM" / "PM"; omit to hide the session column (e.g. a leave row). */
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
}

function Chevron() {
  return <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
}

function Pill({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return (
    <span style={{ padding: '5px 10px', borderRadius: 999, background: bg, fontSize: 11, fontWeight: 600, color }}>
      {children}
    </span>
  )
}

function RightCluster({ right }: { right: ListRowRight }) {
  if (right.kind === 'custom') return <>{right.node}</>
  if (right.kind === 'doneUnbilled') {
    const s = STATUS_PALETTE.free
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <TickBadge size={24} />
        <span style={{ fontSize: 11, fontWeight: 600, color: s.onTint }}>Done · unbilled</span>
      </span>
    )
  }
  if (right.kind === 'toFinish') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Pill bg={semantic.warning.tint} color={semantic.warning.onTint}>
          {right.count} to finish
        </Pill>
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
        <Pill bg={s.tint} color={s.onTint}>
          {count} {count === 1 ? 'booking' : 'bookings'}
        </Pill>
        <Chevron />
      </span>
  )
}

function ChipPill({ statusKey, label }: { statusKey: DisplayKey; label: string }) {
  const s = useDisplayStatus(statusKey).visual
  return (
    <Pill bg={neutral.surface} color={s.onTint}>
      {label}
    </Pill>
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
}: ListRowProps) {
  const resolved = useDisplayStatus(statusKey)
  const c = resolved.visual
  const isOpen = variant === 'open'
  const isClosed = variant === 'closed'

  const body =
    isOpen
      ? { background: c.blockBackground, border: c.border ?? `1px solid ${neutral.line}`, boxShadow: elevation.e0 }
      : isClosed
        ? { background: c.tint, border: `1px solid ${c.rowEdge}`, boxShadow: elevation.e0 }
        : { background: neutral.surface, border: `1px solid ${neutral.line}`, boxShadow: elevation.e1 }

  const titleColor = isOpen || isClosed ? c.onTint : neutral.ink
  const subColor = isOpen || isClosed ? c.onTint : neutral.slate
  const sessionColor = isOpen ? c.onTint : neutral.ink

  const Tag = onClick !== undefined ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      data-slot-id={slotId}
      data-list-id={listId}
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
        <span style={{ width: 4, height: 46, borderRadius: 99, background: c.solid, flex: 'none' }} aria-hidden />
      )}
      {session !== undefined && (
        <span style={{ width: 46, flex: 'none', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: sessionColor }}>{session}</span>
          {time !== undefined && (
            <span className="mono" style={{ fontSize: 11, color: isOpen ? c.onTint : neutral.mist, opacity: isOpen ? 0.75 : 1 }}>
              {time}
            </span>
          )}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: titleColor }}>{title}</span>
          {badge !== undefined && (
            <span data-shot="list-row-badge" style={{ flex: 'none', padding: '2px 8px', borderRadius: 999, background: neutral.sunken, color: neutral.ink, fontSize: 11, fontWeight: 700 }}>
              {badge}
            </span>
          )}
        </span>
        {subtitle !== undefined && (
          <span style={{ fontSize: 12, color: subColor, opacity: isOpen || isClosed ? 0.85 : 1 }}>{subtitle}</span>
        )}
      </span>
      <RightCluster right={right} />
    </Tag>
  )
}
