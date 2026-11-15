import { useMemo, useState } from 'react'
import { PenLineIcon, TriangleAlertIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { openWarnings, useAppStore, clockISO } from '@proto/store'
import { isOpen } from '@proto/domain/warnings'
import { strongestOpen } from '@proto/shared/warnings/useBookingWarnings'
import { dayWithYear, hhmm, waitingLabel } from '@proto/shared/format'
import { waitingMinutes } from '@proto/domain/draftLists'
import { DRAFT_STATE, UNASSIGNED, bookingNoun } from '@proto/shared/scheduleTerms'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'

// ---------------------------------------------------------------------------
// ConflictDot
// ---------------------------------------------------------------------------

/**
 * The conflict "!" as a round Badge: warning solid with a white glyph, mist once cleared.
 * Decorative (aria-hidden), as today: the text beside it always names the conflict.
 */
export function ConflictDot({ size = 14, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <Badge
      aria-hidden
      className={cn('tw:rounded-pill tw:p-0 tw:font-bold tw:text-white', muted ? 'tw:bg-mist' : 'tw:bg-warning')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.64), lineHeight: 1 }}
    >
      !
    </Badge>
  )
}

export function ConflictDotReplacement() {
  return (
    <div className="tw:flex tw:items-center tw:gap-4 tw:text-[13px] tw:text-slate">
      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
        <ConflictDot /> Default
      </span>
      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
        <ConflictDot size={12} /> Small
      </span>
      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
        <ConflictDot muted /> Muted (cleared)
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WarningTriangle
// ---------------------------------------------------------------------------

interface Warning {
  text: string
  strength: 'mild' | 'strong'
}

const TONE = {
  strong: { solid: 'tw:bg-error', onTint: 'tw:text-error-on-tint' },
  mild: { solid: 'tw:bg-warning', onTint: 'tw:text-warning-on-tint' },
  cleared: { solid: 'tw:bg-mist', onTint: 'tw:text-slate' },
} as const

/**
 * The booking's warning mark: a disc in the strongest open warning's colour with a white
 * triangle, and the open count when more than one. `tooltip` false keeps today's
 * non-interactive span (role img, label and title); true makes it a focusable Tooltip trigger.
 */
export function WarningTriangle({ warnings, size = 'md', tooltip }: { warnings: readonly Warning[]; size?: 'sm' | 'md'; tooltip: boolean }) {
  if (warnings.length === 0) return null
  const open = warnings.filter((w) => isOpen(w) as boolean)
  const shown = open.length > 0 ? open : warnings
  const strength = strongestOpen(warnings) as Warning['strength'] | undefined
  const tone = TONE[strength ?? 'cleared']
  const d = size === 'sm' ? 15 : 18
  const label =
    open.length === 0
      ? `${warnings.length === 1 ? 'Warning' : `${warnings.length} warnings`} cleared: ${warnings[0]!.text}`
      : `${open.length === 1 ? '1 warning' : `${open.length} warnings`}: ${open.map((w) => w.text).join(' ')}`
  const mark = (
    <>
      <Badge aria-hidden className={cn('tw:p-0 tw:text-white', tone.solid)} style={{ width: d, height: d }}>
        <TriangleAlertIcon strokeWidth={2.75} style={{ width: size === 'sm' ? 9 : 11, height: size === 'sm' ? 9 : 11 }} />
      </Badge>
      {open.length > 1 && (
        <span aria-hidden className={cn('tw:text-[11px] tw:font-bold tw:tabular-nums', tone.onTint)}>
          {open.length}
        </span>
      )}
    </>
  )
  const outer = 'tw:inline-flex tw:shrink-0 tw:items-center tw:gap-[3px] tw:align-middle'
  if (!tooltip) {
    return (
      <span role="img" aria-label={label} title={shown.map((w) => w.text).join('\n')} data-strength={strength ?? 'cleared'} className={outer}>
        {mark}
      </span>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
        render={<span role="img" tabIndex={0} aria-label={label} data-strength={strength ?? 'cleared'} className={cn(outer, 'tw:rounded-pill tw:outline-none tw:focus-visible:shadow-focus')} />}
      >
        {mark}
      </TooltipTrigger>
      <TooltipContent className="tw:flex-col tw:items-start">
        {shown.map((w, i) => (
          <span key={i}>{w.text}</span>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

export function WarningTriangleReplacement({ tooltip = false }: { tooltip?: boolean }) {
  const schedule = useAppStore((s: any) => s.schedule)
  const billing = useAppStore((s: any) => s.billing)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const clock = useAppStore((s: any) => s.clock)
  const masters = useAppStore((s: any) => s.masters)
  const warnings = useMemo<Warning[]>(
    () => (openWarnings({ schedule, billing, appSettings, clock, masters }) as { warning: Warning }[]).map((r) => r.warning),
    [schedule, billing, appSettings, clock, masters],
  )
  if (warnings.length === 0) return <div className="tw:text-[13px] tw:text-mist">No open warnings in the seed right now.</div>
  return (
    <div className="tw:flex tw:items-center tw:gap-4 tw:text-[13px] tw:text-slate">
      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
        <WarningTriangle warnings={warnings} tooltip={tooltip} /> md
      </span>
      <span className="tw:inline-flex tw:items-center tw:gap-1.5">
        <WarningTriangle warnings={warnings} size="sm" tooltip={tooltip} /> sm
      </span>
      <span>
        {warnings.length} open warning{warnings.length === 1 ? '' : 's'} from the seed
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChangedSinceSubmittedPill
// ---------------------------------------------------------------------------

interface Cue {
  count: number
  lastAtISO: string
}

/** The quiet warning-outlined pill as a Badge, its detail in a Tooltip the keyboard can reach. */
export function ChangedSinceSubmittedPill({ cue }: { cue: Cue }) {
  const changes = `${cue.count} change${cue.count === 1 ? '' : 's'}`
  const detail = `${changes} by the anaesthetist since the List was submitted, the last on ${dayWithYear(cue.lastAtISO)} at ${hhmm(cue.lastAtISO)}`
  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
        render={
          <Badge
            tabIndex={0}
            aria-description={detail}
            variant="outline"
            className="tw:gap-[5px] tw:border-warning/40 tw:px-2.5 tw:py-[3px] tw:text-xs tw:leading-4 tw:text-warning-on-tint tw:[&>svg]:size-3!"
          />
        }
      >
        <PenLineIcon strokeWidth={2.4} aria-hidden />
        Changed since submitted · <span className="tw:font-mono tw:tabular-nums">{cue.count}</span>
      </TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  )
}

export function ChangedSinceSubmittedReplacement() {
  const [count, setCount] = useState(2)
  return (
    <div className="tw:flex tw:flex-col tw:items-start tw:gap-2.5">
      <ChangedSinceSubmittedPill cue={{ count, lastAtISO: '2026-07-21T10:42:00' }} />
      <div className="tw:flex tw:gap-2">
        <Button variant="pill" className="tw:h-11" onClick={() => setCount((n) => n + 1)}>
          One more change
        </Button>
        <Button variant="pill" className="tw:h-11" onClick={() => setCount(1)}>
          Reset
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftListParts
// ---------------------------------------------------------------------------

const LONG_WAIT_MINUTES = 24 * 60
const DRAFT_PILL = 'tw:text-[11px] tw:leading-4'

interface DraftListLike {
  state: string
  draft?: { assignedAtISO?: string }
  removedAtISO?: string
}

function WaitingTime({ list }: { list: DraftListLike }) {
  const nowISO = useAppStore((s: any) => clockISO(s.clock)) as string
  const minutes = waitingMinutes(list, nowISO) as number
  const long = minutes >= LONG_WAIT_MINUTES && list.removedAtISO === undefined && list.draft?.assignedAtISO === undefined
  const text = (
    <span
      data-waiting-minutes={minutes}
      className={cn('tw:font-mono tw:tabular-nums', long ? 'tw:font-semibold tw:text-warning-on-tint' : 'tw:font-medium tw:text-slate')}
    >
      {waitingLabel(minutes) as string}
    </span>
  )
  if (!long) return text
  return (
    <Tooltip>
      <TooltipTrigger delay={300} render={<span tabIndex={0} className="tw:rounded-[4px] tw:outline-none tw:focus-visible:shadow-focus" />}>
        {text}
      </TooltipTrigger>
      <TooltipContent>Waiting over a day</TooltipContent>
    </Tooltip>
  )
}

function BookingCount({ count }: { count: number }) {
  return (
    <span>
      <span className={cn('tw:font-mono tw:text-[11px] tw:font-semibold tw:tabular-nums', count === 0 ? 'tw:text-mist' : 'tw:text-slate')}>{count}</span>{' '}
      {bookingNoun(count) as string}
    </span>
  )
}

export function DraftListPartsReplacement() {
  const { draftListId } = useSeedIds() as { draftListId?: string }
  const list = useAppStore((s: any) => (draftListId !== undefined ? s.schedule.lists[draftListId] : undefined)) as DraftListLike | undefined
  const [count, setCount] = useState(3)
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5 tw:text-[13px]">
      <Badge variant="warning" data-unassigned="true" className={cn(DRAFT_PILL, 'tw:gap-[5px]')}>
        <span aria-hidden className="tw:size-1.5 tw:rounded-pill tw:bg-warning" />
        {UNASSIGNED as string}
      </Badge>
      <Badge data-list-state="DRAFT" className={cn(DRAFT_PILL, 'tw:tracking-[0.06em]')}>
        {DRAFT_STATE as string}
      </Badge>
      {list !== undefined && list.state === 'DRAFT' && <WaitingTime list={list} />}
      <BookingCount count={count} />
      <Button variant="pill" className="tw:h-11" onClick={() => setCount((n) => (n + 1) % 6)}>
        Change count
      </Button>
    </div>
  )
}
