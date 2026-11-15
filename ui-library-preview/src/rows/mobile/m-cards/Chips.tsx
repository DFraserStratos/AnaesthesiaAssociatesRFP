import { useState } from 'react'
import { Moon, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAnaesthetistStatusChoices, useDisplayStatus } from '@proto/shared'
import { TickBadge } from '@proto/shared/ui'
import { LIST_PROGRESS_LABEL } from '@proto/domain/listProgress'
import { OUT_OF_HOURS } from '@proto/shared/outOfHoursTerms'
import { dayWithYear, longDay } from '@proto/shared/format'
import { useToday } from '@proto/store'
import { Col, Row, useMobilePersona, type BadgeStatus } from './shared'

// ---------------------------------------------------------------------------
// StatusChip
// ---------------------------------------------------------------------------

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: BadgeStatus }
}

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

/** One chip as a Badge: a List kind keeps its variant; a status takes its master colour token. */
function StatusBadge({ statusKey, label }: { statusKey: string; label?: string }) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return <Badge>Unknown status</Badge>
  const variant: BadgeStatus = LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : resolved.status!.colour
  return (
    <Badge variant={variant} data-status-key={statusKey}>
      {label ?? resolved.label}
    </Badge>
  )
}

/** The example's chips: the three List kinds, then her status choices with their long labels. */
export function StatusChipReplacement() {
  const choices = useAnaesthetistStatusChoices() as { key: string; longLabel: string }[]
  return (
    <Row>
      {LIST_KINDS.map((k) => (
        <StatusBadge key={k} statusKey={k} />
      ))}
      {choices.map((s) => (
        <StatusBadge key={s.key} statusKey={s.key} label={s.longLabel} />
      ))}
    </Row>
  )
}

// ---------------------------------------------------------------------------
// ProgressPill
// ---------------------------------------------------------------------------

type ListProgress = 'toFinish' | 'readyToSubmit' | 'submitted' | 'authorised' | 'invoiced' | 'upcoming'

/** The prototype pill's box (3px 9px, 12px 600) on the Badge. */
const PILL = 'tw:px-[9px] tw:py-[3px] tw:text-xs tw:leading-4'

/** A List's progress as a Badge. Ready and submitted keep the done tick (TickBadge stays custom). */
export function ProgressBadge({ progress }: { progress: ListProgress }) {
  if (progress === 'upcoming') return null
  const label = LIST_PROGRESS_LABEL[progress] as string
  if (progress === 'submitted' || progress === 'readyToSubmit') {
    return (
      <Badge data-progress={progress} className="tw:gap-1.5 tw:bg-transparent tw:px-0 tw:text-xs tw:leading-4 tw:text-status-free-on-tint">
        <TickBadge size={18} />
        {label}
      </Badge>
    )
  }
  return (
    <Badge data-progress={progress} variant={progress === 'toFinish' ? 'warning' : 'default'} className={PILL}>
      {label}
    </Badge>
  )
}

export function ProgressPillReplacement() {
  const all: ListProgress[] = ['toFinish', 'readyToSubmit', 'submitted', 'authorised', 'invoiced']
  return (
    <Row className="tw:gap-y-2.5">
      {all.map((p) => (
        <ProgressBadge key={p} progress={p} />
      ))}
    </Row>
  )
}

// ---------------------------------------------------------------------------
// OutOfHoursPill
// ---------------------------------------------------------------------------

/** The neutral pill as a default Badge, ink 11/700 as today; the moon is an inline-start icon. */
export function OutOfHoursBadge({ moon = false }: { moon?: boolean }) {
  return (
    <Badge className="tw:gap-1 tw:px-2 tw:py-0.5 tw:text-[11px] tw:leading-4 tw:font-bold tw:text-ink tw:[&>svg]:size-[11px]!">
      {moon && <Moon data-icon="inline-start" strokeWidth={2.4} aria-hidden />}
      {OUT_OF_HOURS as string}
    </Badge>
  )
}

export function OutOfHoursPillReplacement() {
  return (
    <Row>
      <OutOfHoursBadge />
      <OutOfHoursBadge moon />
    </Row>
  )
}

// ---------------------------------------------------------------------------
// AgeChip
// ---------------------------------------------------------------------------

/** Age in days (warning past 60) and the ACC chip, as Badges at today's sizes. */
function AgeBadges({ days, accFunded }: { days: number; accFunded: boolean }) {
  const overdue = days > 60
  return (
    <span className="tw:inline-flex tw:items-center tw:gap-1.5">
      {accFunded && (
        <Badge className="tw:bg-status-preop-tint tw:py-0.5 tw:text-[10.5px] tw:leading-[15.75px] tw:text-status-preop-on-tint">ACC</Badge>
      )}
      <Badge variant={overdue ? 'warning' : 'default'} className="tw:px-[9px] tw:py-0.5 tw:font-mono tw:text-[11px] tw:leading-[16.5px] tw:tabular-nums">
        {days}d
      </Badge>
    </span>
  )
}

export function AgeChipReplacement() {
  const [days, setDays] = useState(45)
  const [acc, setAcc] = useState(true)
  return (
    <Col>
      <div className="tw:flex tw:items-center tw:justify-between tw:rounded-[16px] tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3.5">
        <span className="tw:text-[12.5px] tw:text-slate">
          <span className="tw:font-mono">INV-0001</span> · Southern Cross
        </span>
        <AgeBadges days={days} accFunded={acc} />
      </div>
      <Row>
        <Button variant="pill" onClick={() => setDays((d) => Math.max(0, d - 15))}>
          −15 days
        </Button>
        <Button variant="pill" onClick={() => setDays((d) => d + 15)}>
          +15 days
        </Button>
        <Button variant="pill" onClick={() => setAcc((a) => !a)}>
          {acc ? 'Not ACC' : 'ACC'}
        </Button>
      </Row>
    </Col>
  )
}

// ---------------------------------------------------------------------------
// DayChip
// ---------------------------------------------------------------------------

/** The teal day chip: a Badge rendered as a button, 44px tall, with the dismiss X at the end. */
export function DayChipReplacement() {
  const todayISO = useToday() as string
  const [open, setOpen] = useState(true)
  if (!open) {
    return (
      <Button variant="pill" onClick={() => setOpen(true)}>
        Bring the chip back
      </Button>
    )
  }
  return (
    <Badge
      render={<button type="button" />}
      aria-label={`${longDay(todayISO)}. Close the day and go back to your Lists`}
      onClick={() => setOpen(false)}
      className="tw:h-11 tw:min-w-11 tw:cursor-pointer tw:gap-2 tw:border-0 tw:bg-primary tw:pr-2.5 tw:pl-4 tw:text-[13px] tw:text-white tw:transition-colors tw:hover:bg-teal-hover tw:active:bg-teal-pressed tw:[&>svg]:size-4!"
    >
      <span className="tw:font-mono">{dayWithYear(todayISO) as string}</span>
      <X data-icon="inline-end" strokeWidth={2.4} aria-hidden />
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/** px sizes as today (34, 44, 56); the initials scale at 0.34 of the diameter. */
const AVATAR_SIZES = [
  { px: 34, box: 'tw:size-[34px]', text: 'tw:text-[12px]!' },
  { px: 44, box: 'tw:size-11', text: 'tw:text-[15px]!' },
  { px: 56, box: 'tw:size-14', text: 'tw:text-[19px]!' },
] as const

export function AvatarReplacement() {
  const { initials } = useMobilePersona()
  return (
    <Row className="tw:gap-3.5">
      {AVATAR_SIZES.map((s) => (
        <Avatar key={s.px} variant="elevated" aria-hidden className={s.box}>
          <AvatarFallback className={`tw:font-bold ${s.text}`}>{initials}</AvatarFallback>
        </Avatar>
      ))}
    </Row>
  )
}
