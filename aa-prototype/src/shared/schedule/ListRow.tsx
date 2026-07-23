import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { elevation, neutral, radius } from '../../theme/tokens'
import { freeDashedBorder, statusColours, type StatusKey } from '../../theme/statusColours'
import { TickBadge } from '../ui/TickBadge'

/** The right-hand state cluster of a list row (mockup screen 1). */
export type ListRowRight =
  | { kind: 'doneUnbilled' }
  | { kind: 'toFinish'; count: number }
  | { kind: 'count'; count: number; statusKey: StatusKey }
  | { kind: 'offerCover' }
  | { kind: 'chip'; statusKey: StatusKey; label: string }
  | { kind: 'custom'; node: ReactNode }

interface ListRowProps {
  statusKey: StatusKey
  /** "AM" / "PM"; omit to hide the session column (e.g. a leave row). */
  session?: string
  /** Mono start time under the session label. */
  time?: string
  title: string
  subtitle?: string
  right: ListRowRight
  onClick?: () => void
  /** Row body treatment. */
  variant?: 'default' | 'free' | 'holiday'
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
    const s = statusColours.free
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
        <Pill bg="#F9F0DC" color="#7C4D08">
          {right.count} to finish
        </Pill>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'count') {
    const s = statusColours[right.statusKey]
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Pill bg={s.tint} color={s.onTint}>
          {right.count} {right.count === 1 ? 'card' : 'cards'}
        </Pill>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'chip') {
    const s = statusColours[right.statusKey]
    return (
      <Pill bg={neutral.surface} color={s.onTint}>
        {right.label}
      </Pill>
    )
  }
  // offerCover
  return (
    <span
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        background: statusColours.free.solid,
        fontSize: 12,
        fontWeight: 600,
        color: neutral.surface,
      }}
    >
      Offer cover
    </span>
  )
}

/**
 * The Forward-Lists row (mockup screen 1): a status rail, the AM/PM + mono-time
 * column, the hospital/surgeon/count line, and a right-side state. Free rows use
 * a dashed-green body with an "Offer cover" pill; Holiday rows a crimson-tint
 * body. The load-bearing list primitive; moved to `src/shared/schedule` in
 * Phase 05 so the web app reuses it (mobile Forward Lists + web Lists / card
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
}: ListRowProps) {
  const c = statusColours[statusKey]
  const isFree = variant === 'free'
  const isHoliday = variant === 'holiday'

  const body =
    isFree
      ? { background: statusColours.free.tint, border: freeDashedBorder, boxShadow: elevation.e0 }
      : isHoliday
        ? { background: statusColours.holiday.tint, border: `1px solid #F2D5DC`, boxShadow: elevation.e0 }
        : { background: neutral.surface, border: `1px solid ${neutral.line}`, boxShadow: elevation.e1 }

  const titleColor = isFree ? statusColours.free.onTint : isHoliday ? statusColours.holiday.onTint : neutral.ink
  const subColor = isFree ? statusColours.free.onTint : isHoliday ? statusColours.holiday.onTint : neutral.slate
  const sessionColor = isFree ? statusColours.free.onTint : neutral.ink

  const Tag = onClick !== undefined ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
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
      {!isFree && (
        <span style={{ width: 4, height: 46, borderRadius: 99, background: c.solid, flex: 'none' }} aria-hidden />
      )}
      {session !== undefined && (
        <span style={{ width: 46, flex: 'none', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: sessionColor }}>{session}</span>
          {time !== undefined && (
            <span className="mono" style={{ fontSize: 11, color: isFree ? statusColours.free.onTint : neutral.mist, opacity: isFree ? 0.75 : 1 }}>
              {time}
            </span>
          )}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: titleColor }}>{title}</span>
        {subtitle !== undefined && (
          <span style={{ fontSize: 12, color: subColor, opacity: isFree || isHoliday ? 0.85 : 1 }}>{subtitle}</span>
        )}
      </span>
      <RightCluster right={right} />
    </Tag>
  )
}
