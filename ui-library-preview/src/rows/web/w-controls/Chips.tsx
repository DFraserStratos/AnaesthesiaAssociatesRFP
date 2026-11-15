import { useMemo, useState } from 'react'
import { Check, TriangleAlert, X } from 'lucide-react'
import { slotViewsForDate, useAppStore } from '@proto/store'
import { useDefaultStatus, useDisplayStatus, useLegendKeys } from '@proto/shared'
import { dayWithYear, drSurname, longDay } from '@proto/shared/format'
import { LIST_PROGRESS_LABEL } from '@proto/domain/listProgress'
import { isOpen } from '@proto/domain/warnings'
import { strongestOpen } from '@proto/shared/warnings/useBookingWarnings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Echo, KnobButton, Knobs, StageHint, radioItemRender, useWebFixtures } from './shared'

type StatusColour = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: StatusColour }
}

const LIST_KIND_KEYS: readonly string[] = ['private', 'public', 'preop']

/** A legend key's Badge variant: a List kind is its own; a status takes its master colour token. */
function useStatusVariant(key: string): { label: string; variant: StatusColour | undefined } {
  const resolved = useDisplayStatus(key) as ResolvedStatus
  if (!resolved.known) return { label: 'Unknown status', variant: undefined }
  return { label: resolved.label, variant: LIST_KIND_KEYS.includes(key) ? (key as StatusColour) : resolved.status?.colour }
}

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

/**
 * Find cover's two filter pills as a single-select ToggleGroup (outline, no
 * track): radio semantics and arrow keys. `on="filled"` keeps today's filled
 * teal pill; `on="tint"` uses the kit toggle's teal-tint selection.
 */
export function FilterChipReplacement({ on = 'filled' }: { on?: 'filled' | 'tint' }) {
  const f = useWebFixtures()
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const schedule = useAppStore((s: { schedule: unknown }) => s.schedule)
  const appSettings = useAppStore((s: { appSettings: unknown }) => s.appSettings)
  const slotStatuses = useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
  const freeCount = useMemo(
    () => (slotViewsForDate({ schedule, appSettings, masters: { slotStatuses } }, f.todayISO) as { open: boolean }[]).filter((v) => v.open).length,
    [schedule, appSettings, slotStatuses, f.todayISO],
  )
  const selected =
    on === 'filled'
      ? 'tw:data-pressed:border-primary tw:data-pressed:bg-primary! tw:data-pressed:text-white! tw:aria-pressed:bg-primary! tw:aria-pressed:text-white!'
      : 'tw:data-pressed:border-teal-tint tw:data-pressed:bg-teal-tint! tw:data-pressed:text-teal-pressed! tw:aria-pressed:bg-teal-tint! tw:aria-pressed:text-teal-pressed!'
  return (
    <div>
      <ToggleGroup
        variant="outline"
        role="radiogroup"
        aria-label="Who to show"
        value={[filter]}
        onValueChange={(next) => {
          const picked = next[0] as 'all' | 'free' | undefined
          if (picked !== undefined) setFilter(picked)
        }}
      >
        {(
          [
            { value: 'all', label: 'All anaesthetists' },
            { value: 'free', label: `Free only · ${freeCount}` },
          ] as const
        ).map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            role="radio"
            aria-checked={filter === o.value}
            render={radioItemRender}
            className={cn('tw:h-9 tw:flex-none tw:rounded-pill! tw:border-line tw:px-4 tw:text-[13px] tw:text-slate tw:hover:bg-surface tw:hover:text-ink', selected)}
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Echo>Showing: {filter === 'all' ? 'all anaesthetists' : 'free sessions only'}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatusLegend (toggle mode)
// ---------------------------------------------------------------------------

function LegendBadge({ statusKey }: { statusKey: string }) {
  const { label, variant } = useStatusVariant(statusKey)
  return <Badge variant={variant}>{label}</Badge>
}

function LegendToggle({ statusKey, active }: { statusKey: string; active: boolean }) {
  const { label } = useStatusVariant(statusKey)
  return (
    <ToggleGroupItem
      value={statusKey}
      aria-label={`${label} status`}
      title={`${active ? 'Hide' : 'Show'} ${label.toLowerCase()} sessions`}
      className="tw:h-auto tw:min-w-0 tw:flex-none tw:rounded-pill! tw:border-0 tw:bg-transparent! tw:p-0 tw:opacity-[0.42] tw:shadow-none! tw:grayscale-[0.7] tw:data-pressed:opacity-100 tw:data-pressed:grayscale-0"
    >
      <LegendBadge statusKey={statusKey} />
    </ToggleGroupItem>
  )
}

/** The compact legend as a multiple ToggleGroup of status Badges: one Tab stop, arrows between chips, Space toggles. */
export function StatusLegendReplacement() {
  const keys = useLegendKeys() as string[]
  const [active, setActive] = useState<string[]>(() => [...keys])
  return (
    <>
      <ToggleGroup variant="outline" multiple aria-label="Status filters" value={active} onValueChange={(next) => setActive(next as string[])} className="tw:flex-wrap tw:gap-2">
        {keys.map((k) => (
          <LegendToggle key={k} statusKey={k} active={active.includes(k)} />
        ))}
      </ToggleGroup>
      <StageHint>
        {active.length} of {keys.length} statuses shown.
      </StageHint>
    </>
  )
}

// ---------------------------------------------------------------------------
// ProgressPill
// ---------------------------------------------------------------------------

type ListProgress = 'toFinish' | 'readyToSubmit' | 'submitted' | 'invoiced' | 'authorised'
const PROGRESSES: ListProgress[] = ['toFinish', 'readyToSubmit', 'submitted', 'invoiced', 'authorised']
const LABEL = LIST_PROGRESS_LABEL as Record<ListProgress, string>

/** Today's pill size (3px 9px, 12/16) on the Badge anatomy. */
const PILL = 'tw:px-[9px] tw:py-[3px] tw:text-xs tw:leading-4'

function DoneTick() {
  return (
    <span aria-hidden className="tw:flex tw:size-[18px] tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:bg-success-tint">
      <Check className="tw:size-2.5 tw:text-success-on-tint" strokeWidth={3.4} />
    </span>
  )
}

/**
 * A List's progress on Badge. `done="tick"` keeps today's tick-and-text for
 * Ready to submit and Done · unbilled; `done="badge"` folds them into a success
 * Badge too, so every state is one pill family.
 */
export function ProgressPillReplacement({ done = 'tick' }: { done?: 'tick' | 'badge' }) {
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5">
      {PROGRESSES.map((p) => {
        const label = LABEL[p]
        if (p === 'toFinish')
          return (
            <Badge key={p} variant="warning" data-progress={p} className={PILL}>
              {label}
            </Badge>
          )
        if (p === 'invoiced' || p === 'authorised')
          return (
            <Badge key={p} variant="default" data-progress={p} className={PILL}>
              {label}
            </Badge>
          )
        return done === 'tick' ? (
          <span key={p} data-progress={p} className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:whitespace-nowrap tw:text-status-free-on-tint">
            <DoneTick />
            {label}
          </span>
        ) : (
          <Badge key={p} variant="success" data-progress={p} className={PILL}>
            <Check data-icon="inline-start" strokeWidth={3} aria-hidden />
            {label}
          </Badge>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WebDayChip
// ---------------------------------------------------------------------------

/**
 * The picked day on Lists. `separate={false}` keeps today's whole-chip button
 * (shadcn Button, teal pill); `separate` is a teal-tint label with its own
 * labelled close button, so the date reads as a label and only the X acts.
 */
export function DayChipReplacement({ separate = false }: { separate?: boolean }) {
  const f = useWebFixtures()
  const dateISO = f.pastDayISO ?? f.todayISO
  const [shown, setShown] = useState(true)
  if (!shown) return <KnobButton onClick={() => setShown(true)}>Show the chip again</KnobButton>
  if (separate)
    return (
      <Badge className="tw:h-8 tw:gap-1.5 tw:bg-teal-tint tw:py-0 tw:pr-1 tw:pl-3.5 tw:text-[13px] tw:text-teal-pressed">
        <span className="tw:font-mono">{dayWithYear(dateISO)}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Close ${longDay(dateISO)} and go back to your Lists`}
          onClick={() => setShown(false)}
          className="tw:rounded-pill! tw:text-teal-pressed tw:hover:bg-surface tw:hover:text-teal-pressed"
        >
          <X strokeWidth={2.4} aria-hidden />
        </Button>
      </Badge>
    )
  return (
    <Button aria-label={`${longDay(dateISO)}. Close the day and go back to your Lists`} onClick={() => setShown(false)} className="tw:h-8 tw:gap-2 tw:rounded-pill! tw:pr-2.5 tw:pl-3.5 tw:text-[13px]">
      <span className="tw:font-mono">{dayWithYear(dateISO)}</span>
      <X className="tw:size-3.5" strokeWidth={2.4} aria-hidden />
    </Button>
  )
}

// ---------------------------------------------------------------------------
// WarningTriangle
// ---------------------------------------------------------------------------

type Strength = 'mild' | 'strong'
interface Warning {
  kind: 'afterProcedure'
  bookingId: string
  ruleId: 'baseUnitsOutsideGuide'
  strength: Strength
  text: string
  key: string
  clearance?: { key: string; bookingId: string; ruleId: string; strength: Strength; by: string; role: string; atISO: string }
}
type WarningKind = 'mild' | 'strong' | 'two' | 'cleared' | 'none'

/** The same sample warnings as the current example. */
function warningsFor(kind: WarningKind, todayISO: string): Warning[] {
  const base = { kind: 'afterProcedure' as const, bookingId: 'catalogue', ruleId: 'baseUnitsOutsideGuide' as const }
  const mk = (strength: Strength, text: string, n: number): Warning => ({ ...base, strength, text, key: `catalogue:${n}` })
  if (kind === 'mild') return [mk('mild', 'Base units are outside the guide range for this RVG code.', 1)]
  if (kind === 'strong') return [mk('strong', 'Prepayment is still unpaid.', 1)]
  if (kind === 'two') return [mk('strong', 'Prepayment is still unpaid.', 1), mk('mild', 'Base units are outside the guide range for this RVG code.', 2)]
  if (kind === 'cleared') {
    const w = mk('mild', 'Base units are outside the guide range for this RVG code.', 1)
    return [{ ...w, clearance: { key: w.key, bookingId: w.bookingId, ruleId: w.ruleId, strength: 'mild', by: 'Kirsty W.', role: 'office', atISO: `${todayISO}T09:00:00` } }]
  }
  return []
}

const TONE: Record<Strength | 'cleared', { disc: string; count: string }> = {
  strong: { disc: 'tw:bg-error', count: 'tw:text-error-on-tint' },
  mild: { disc: 'tw:bg-warning', count: 'tw:text-warning-on-tint' },
  cleared: { disc: 'tw:bg-mist', count: 'tw:text-slate' },
}

/** The marker itself: the same disc and count, its explanation in a Tooltip instead of title=. */
function Marker({ warnings, focusable }: { warnings: Warning[]; focusable: boolean }) {
  if (warnings.length === 0) return null
  const open = warnings.filter((w) => isOpen(w))
  const shown = open.length > 0 ? open : warnings
  const strength = strongestOpen(warnings) as Strength | undefined
  const tone = TONE[strength ?? 'cleared']
  const label =
    open.length === 0
      ? `${warnings.length === 1 ? 'Warning' : `${warnings.length} warnings`} cleared: ${warnings[0]!.text}`
      : `${open.length === 1 ? '1 warning' : `${open.length} warnings`}: ${open.map((w) => w.text).join(' ')}`
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        role="img"
        aria-label={label}
        tabIndex={focusable ? 0 : undefined}
        data-strength={strength ?? 'cleared'}
        className="tw:inline-flex tw:flex-none tw:items-center tw:gap-[3px] tw:rounded-pill tw:align-middle tw:outline-none tw:focus-visible:shadow-focus"
      >
        <span aria-hidden className={cn('tw:inline-flex tw:size-[18px] tw:items-center tw:justify-center tw:rounded-full tw:text-white', tone.disc)}>
          <TriangleAlert className="tw:size-[11px]" strokeWidth={2.75} />
        </span>
        {open.length > 1 && (
          <span aria-hidden className={cn('tw:text-[11px] tw:font-bold tw:tabular-nums', tone.count)}>
            {open.length}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="tw:flex-col tw:items-start tw:gap-0.5">
        {open.length === 0 && <span className="tw:font-semibold">Cleared</span>}
        {shown.map((w) => (
          <span key={w.key}>{w.text}</span>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * WarningTriangle with a shadcn Tooltip. `focusable={false}` keeps today's rule
 * (not interactive, safe inside a row button; the tooltip shows on hover and
 * the label is read by screen readers); `focusable` adds a Tab stop so keyboard
 * users can open it too.
 */
export function WarningTriangleReplacement({ focusable = false }: { focusable?: boolean }) {
  const f = useWebFixtures()
  const [kind, setKind] = useState<WarningKind>('mild')
  return (
    <TooltipProvider>
      <Knobs
        label="Warnings"
        value={kind}
        options={[
          { value: 'mild', label: 'Mild' },
          { value: 'strong', label: 'Strong' },
          { value: 'two', label: 'Two' },
          { value: 'cleared', label: 'Cleared' },
          { value: 'none', label: 'None' },
        ]}
        onChange={setKind}
      />
      <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold">
        Patient name <Marker warnings={warningsFor(kind, f.todayISO)} focusable={focusable} />
      </span>
      <StageHint>{focusable ? 'Hover or Tab to the marker: its text shows in a tooltip.' : 'Hover the marker: its text shows in a tooltip.'}</StageHint>
    </TooltipProvider>
  )
}

// ---------------------------------------------------------------------------
// Who's free chip
// ---------------------------------------------------------------------------

const CHIP_TONE: Record<StatusColour, string> = {
  private: 'tw:bg-status-private-tint tw:text-status-private-on-tint',
  public: 'tw:bg-status-public-tint tw:text-status-public-on-tint',
  preop: 'tw:bg-status-preop-tint tw:text-status-preop-on-tint',
  holiday: 'tw:bg-status-holiday-tint tw:text-status-holiday-on-tint',
  unavailable: 'tw:bg-status-unavailable-tint tw:text-status-unavailable-on-tint',
  free: 'tw:bg-status-free-tint tw:text-status-free-on-tint',
}

/**
 * The Who's free name chips with a shadcn Tooltip each. Both chips are
 * focusable buttons so the reason reaches keyboard and touch users; the one
 * that cannot act is aria-disabled (it stays in the Tab order, does nothing).
 */
export function WhosFreeChipReplacement() {
  const f = useWebFixtures()
  const open = useDefaultStatus() as ResolvedStatus
  const tone = CHIP_TONE[open.status?.colour ?? 'free']
  const anaesthetists = useAppStore((s: { masters: { anaesthetists: Record<string, { registrationNumber: string; name: string }> } }) => s.masters.anaesthetists)
  const names = Object.values(anaesthetists as Record<string, { registrationNumber: string; name: string }>)
    .filter((a) => a.registrationNumber !== f.anaesthetistId)
    .map((a) => a.name)
    .sort()
    .slice(0, 2)
  const [a = 'Dr A', b = 'Dr B'] = names
  const [said, setSaid] = useState<string | null>(null)
  const chip = cn('tw:cursor-pointer tw:rounded-pill tw:border-0 tw:px-[11px] tw:py-[5px] tw:text-xs tw:font-semibold tw:outline-none tw:focus-visible:shadow-focus', tone)
  return (
    <TooltipProvider>
      <div className="tw:flex tw:gap-1.5">
        <Tooltip>
          <TooltipTrigger className={chip} onClick={() => setSaid(`Would open the move sheet for ${a}.`)}>
            {drSurname(a)}
          </TooltipTrigger>
          <TooltipContent>Move your AM List to {a}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger className={cn(chip, 'tw:cursor-default')} aria-disabled="true">
            {drSurname(b)}
          </TooltipTrigger>
          <TooltipContent>You have no List in this session</TooltipContent>
        </Tooltip>
      </div>
      <Echo>{said}</Echo>
      <StageHint>Hover or Tab to either chip: the reason shows in a tooltip. Only the first one acts.</StageHint>
    </TooltipProvider>
  )
}
