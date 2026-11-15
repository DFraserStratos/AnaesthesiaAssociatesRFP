import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { ChevronRight, CircleDollarSign, LayoutGrid, List as ListIcon, Lock, Moon, MoreHorizontal, Paperclip, TriangleAlert, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { isOpenSlotView, rosterForDate, slotViewsForDate, useAppStore, useToday } from '@proto/store'
import { resolveDisplayStatus, useDefaultStatus, useDisplayStatus } from '@proto/shared'
import { monthOf, useAvailabilityMonth } from '@proto/shared/availability'
import { initialsOf, locationName } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { LIST_PROGRESS_LABEL, listProgress } from '@proto/domain/listProgress'
import { isAssignedList } from '@proto/domain/draftLists'
import { isOpen } from '@proto/domain/warnings'
import { strongestOpen } from '@proto/shared/warnings'
import { OUT_OF_HOURS } from '@proto/shared/outOfHoursTerms'
import { listRowModel } from '@proto/apps/mobile/screens/listRowModel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TickBadge } from './Motion'
import { HalfBlockView, useHalfBlockLabel, type CalendarSession } from './Calendars'
import { Bleed, blockFillStyle, ON_TINT, Said, SOLID_BG, TINT_BG, tintStyle, tokenOf, useMobilePersona, useSeedPicks, type ResolvedStatus, type StatusToken } from './shared'

// ===========================================================================
// The tip: Tooltip (hover and focus) or Popover (tap), the open choice for touch
// ===========================================================================

export type TipMode = 'tooltip' | 'popover'

/** Wraps a focusable trigger element with a Tooltip (hover, focus) or a Popover (tap, Escape). */
function Tip({ mode, content, trigger }: { mode: TipMode; content: ReactNode; trigger: ReactElement }) {
  if (mode === 'popover') {
    return (
      <Popover>
        <PopoverTrigger nativeButton={false} render={trigger} />
        <PopoverContent side="top" className="tw:w-auto tw:max-w-64 tw:gap-1 tw:px-3 tw:py-2 tw:text-[13px] tw:leading-[18px]">
          {content}
        </PopoverContent>
      </Popover>
    )
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={trigger} />
        <TooltipContent className="tw:flex-col tw:items-start tw:whitespace-pre-line">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ===========================================================================
// BottomTabBar: a nav of links with aria-current
// ===========================================================================

type Tab = 'lists' | 'availability' | 'balances' | 'more'
const TABS: readonly { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'lists', label: 'Lists', icon: ListIcon },
  { key: 'availability', label: 'Availability', icon: LayoutGrid },
  { key: 'balances', label: 'Balances', icon: CircleDollarSign },
  { key: 'more', label: 'More', icon: MoreHorizontal },
]

export function BottomTabBarReplacement() {
  const [tab, setTab] = useState<Tab>('lists')
  return (
    <Bleed>
      <div className="tw:p-5 tw:text-[15px] tw:text-slate">
        Showing the <strong className="tw:text-ink">{tab}</strong> tab.
      </div>
      <nav
        aria-label="Main"
        className="tw:absolute tw:inset-x-0 tw:bottom-0 tw:z-30 tw:grid tw:grid-cols-4 tw:border-t tw:border-line tw:bg-white/94 tw:px-2 tw:pt-2.5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)-8px),10px)] tw:backdrop-blur-[14px]"
      >
        {TABS.map((t) => {
          const on = t.key === tab
          const Icon = t.icon
          return (
            <a
              key={t.key}
              href="#"
              aria-current={on ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                setTab(t.key)
              }}
              className={cn(
                'tw:flex tw:flex-col tw:items-center tw:gap-[3px] tw:rounded-ctl tw:py-1 tw:no-underline tw:outline-none tw:focus-visible:shadow-focus',
                on ? 'tw:text-primary' : 'tw:text-mist',
              )}
            >
              <Icon className="tw:size-[22px]" strokeWidth={2} aria-hidden />
              <span className="tw:text-[11px] tw:leading-[normal] tw:font-semibold">{t.label}</span>
            </a>
          )
        })}
      </nav>
    </Bleed>
  )
}

// ===========================================================================
// MobileHeader: eyebrow, the title as a real h1, the persona Avatar
// ===========================================================================

export function MobileHeaderReplacement() {
  const { initials } = useMobilePersona()
  return (
    <header className="tw:flex tw:items-start tw:justify-between tw:gap-3">
      <div>
        <div className="tw:text-[11px] tw:leading-[normal] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">Find cover</div>
        <h1 className="tw:m-0 tw:mt-0.5 tw:text-[26px] tw:leading-8 tw:font-bold tw:tracking-[-0.015em]">Availability</h1>
      </div>
      <Avatar variant="elevated" size="lg">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </header>
  )
}

// ===========================================================================
// ListRow on Item
// ===========================================================================

type ListProgress = 'toFinish' | 'readyToSubmit' | 'submitted' | 'invoiced' | 'authorised' | 'upcoming'
type ListRowRight =
  | { kind: 'progress'; progress: Exclude<ListProgress, 'toFinish' | 'upcoming'> }
  | { kind: 'toFinish'; count: number }
  | { kind: 'count'; count: number; statusKey: string }
  | { kind: 'chip'; statusKey: string; label: string }
  | { kind: 'custom'; node: ReactNode }

interface ListRowProps {
  statusKey: string
  session?: string
  time?: string
  title: string
  subtitle?: string
  right: ListRowRight
  onClick?: () => void
  variant?: 'default' | 'open' | 'closed'
  badge?: string
  quiet?: boolean
}

function Chevron() {
  return <ChevronRight className="tw:size-4 tw:text-mist" strokeWidth={2.2} aria-hidden />
}

const ROW_PILL = 'tw:px-2.5 tw:py-[5px] tw:text-[11px] tw:leading-[normal]'

function useToken(statusKey: string) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  return tokenOf(resolved)
}

function RightCluster({ right }: { right: ListRowRight }) {
  if (right.kind === 'custom') return <>{right.node}</>
  if (right.kind === 'progress') {
    const label = LIST_PROGRESS_LABEL[right.progress] as string
    if (right.progress === 'submitted' || right.progress === 'readyToSubmit') {
      return (
        <span className="tw:flex tw:flex-none tw:flex-col tw:items-end tw:gap-1">
          <TickBadge size={24} />
          <span className="tw:text-[11px] tw:leading-[normal] tw:font-semibold tw:whitespace-nowrap tw:text-status-free-on-tint">{label}</span>
        </span>
      )
    }
    return (
      <span className="tw:flex tw:flex-none tw:items-center tw:gap-2">
        <Badge className={ROW_PILL}>{label}</Badge>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'toFinish') {
    return (
      <span className="tw:flex tw:flex-none tw:items-center tw:gap-2">
        <Badge variant="warning" className={ROW_PILL}>
          {right.count} {(LIST_PROGRESS_LABEL.toFinish as string).toLowerCase()}
        </Badge>
        <Chevron />
      </span>
    )
  }
  if (right.kind === 'count') return <CountPill count={right.count} statusKey={right.statusKey} />
  return <ChipPill statusKey={right.statusKey} label={right.label} />
}

function CountPill({ count, statusKey }: { count: number; statusKey: string }) {
  const { token } = useToken(statusKey)
  return (
    <span className="tw:flex tw:flex-none tw:items-center tw:gap-2">
      <Badge className={cn(ROW_PILL, TINT_BG[token], ON_TINT[token])}>
        {count} {count === 1 ? 'booking' : 'bookings'}
      </Badge>
      <Chevron />
    </span>
  )
}

function ChipPill({ statusKey, label }: { statusKey: string; label: string }) {
  const { token } = useToken(statusKey)
  return <Badge className={cn(ROW_PILL, 'tw:bg-surface', ON_TINT[token])}>{label}</Badge>
}

/** The Lists row on Item: status rail, session column, title and subtitle, right cluster. A button when it opens something. */
export function ListRowView({ statusKey, session, time, title, subtitle, right, onClick, variant = 'default', badge, quiet = false }: ListRowProps) {
  const { token, treatment } = useToken(statusKey)
  const outOfHours = session === 'OOH'
  const isOpen = variant === 'open'
  const isClosed = variant === 'closed'
  const coloured = isOpen || isClosed
  // Open: the status's own block fill, dashed outline for Free, no rail. Closed: the tint (holiday's pink edge).
  const style = isOpen
    ? { ...tintStyle(token, treatment), ...(treatment === 'dashed' ? { border: '1.5px dashed var(--status-' + token + ')' } : {}) }
    : isClosed
      ? { ...tintStyle(token, 'solid'), ...(token === 'holiday' ? { borderColor: 'color-mix(in srgb, var(--status-holiday) 18%, var(--aa-surface))' } : {}) }
      : undefined
  return (
    <Item
      variant="outline"
      render={onClick !== undefined ? <button type="button" onClick={onClick} /> : <div />}
      data-quiet={quiet ? 'true' : undefined}
      className={cn(
        'tw:flex-nowrap tw:gap-3 tw:rounded-card! tw:p-3.5 tw:text-left tw:font-[inherit]',
        onClick !== undefined && 'tw:cursor-pointer',
        !coloured && !quiet && 'tw:shadow-e1',
        coloured && 'tw:border-line',
      )}
      style={style}
    >
      {!isOpen && <span aria-hidden className={cn('tw:h-[46px] tw:w-1 tw:flex-none tw:rounded-pill', SOLID_BG[token], quiet && 'tw:opacity-45')} />}
      {session !== undefined && (
        <span className="tw:flex tw:w-[46px] tw:flex-none tw:flex-col">
          {outOfHours ? (
            <OutOfHoursMoonView className={quiet ? 'tw:text-slate' : isOpen ? ON_TINT[token] : 'tw:text-ink'} />
          ) : (
            <span className={cn('tw:text-sm tw:leading-5', quiet ? 'tw:font-semibold tw:text-slate' : 'tw:font-bold', !quiet && (isOpen ? ON_TINT[token] : 'tw:text-ink'))}>{sessionText(session) as string}</span>
          )}
          {time !== undefined && <span className={cn('tw:font-mono tw:text-[11px] tw:tabular-nums', isOpen ? cn(ON_TINT[token], 'tw:opacity-75') : 'tw:text-mist')}>{time}</span>}
        </span>
      )}
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
        <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
          <span className={cn('tw:text-base tw:leading-[22px]', quiet ? 'tw:font-medium' : 'tw:font-semibold', coloured ? ON_TINT[token] : quiet ? 'tw:text-slate' : 'tw:text-ink')}>{title}</span>
          {badge !== undefined && <Badge className="tw:flex-none tw:font-bold tw:text-ink tw:text-[11px]">{badge}</Badge>}
        </span>
        {(subtitle !== undefined || outOfHours) && (
          <span className={cn('tw:text-xs tw:leading-4', coloured ? cn(ON_TINT[token], 'tw:opacity-85') : 'tw:text-slate')}>
            {outOfHours ? [OUT_OF_HOURS as string, subtitle].filter((p) => p !== undefined && p !== '').join(' · ') : subtitle}
          </span>
        )}
      </span>
      <RightCluster right={right} />
    </Item>
  )
}

interface AssignedList {
  id: string
  dateISO: string
  kind: string
  session: string
}

export function ListRowReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const lists = useAppStore((s: { schedule: { lists: Record<string, unknown> } }) => s.schedule.lists)
  const bookings = useAppStore((s: { schedule: { bookings: unknown } }) => s.schedule.bookings) as Record<string, { listId: string; cancellation?: unknown }>
  const masters = useAppStore((s: { masters: unknown }) => s.masters)
  const todayISO = useToday() as string
  const [line, setLine] = useState<string | null>(null)
  const real = useMemo(() => {
    return picks.ownListIds
      .map((id) => lists[id])
      .filter((l): l is AssignedList => (isAssignedList(l) as boolean) && (l as AssignedList).dateISO >= todayISO)
      .slice(0, 2)
      .map((l) => {
        const active = Object.values(bookings).filter((b) => b.listId === l.id && b.cancellation === undefined)
        return { list: l, model: listRowModel(l, active, listProgress(l, active, todayISO), masters) as { title: string; subtitle?: string; right: ListRowRight; quiet: boolean } }
      })
  }, [picks.ownListIds, lists, bookings, masters, todayISO])
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {real.map(({ list, model }, i) => (
        <ListRowView key={list.id} statusKey={list.kind} session={list.session} {...model} {...(i === 0 ? { badge: 'New' } : {})} onClick={() => setLine(`Would open ${model.title}.`)} />
      ))}
      <ListRowView statusKey="free" variant="open" session="PM" title="Free session" subtitle="Open for bookings" right={{ kind: 'chip', statusKey: 'free', label: 'Free' }} />
      <ListRowView statusKey="holiday" variant="closed" title="On holiday" subtitle="On holiday" right={{ kind: 'chip', statusKey: 'holiday', label: 'Holiday' }} />
      <ListRowView statusKey="private" session="AM" title="A submitted List" subtitle="Quiet: less prominent, still editable" right={{ kind: 'progress', progress: 'submitted' }} quiet onClick={() => setLine('Would open the submitted List.')} />
      <Said line={line} />
    </div>
  )
}

// ===========================================================================
// Sticky submit dock
// ===========================================================================

type DockState = 'toFinish' | 'ready' | 'submitted' | 'authorised'
const DOCK_STATES: { value: DockState; label: string }[] = [
  { value: 'toFinish', label: 'To finish' },
  { value: 'ready', label: 'Ready' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'authorised', label: 'Authorised' },
]

const BAR = 'tw:flex tw:h-[54px] tw:items-center tw:justify-center tw:gap-2 tw:rounded-card'

export function SubmitDockReplacement() {
  const [state, setState] = useState<DockState>('toFinish')
  const [line, setLine] = useState<string | null>(null)
  const incomplete = 2
  return (
    <Bleed>
      <div className="tw:p-3.5">
        <ToggleGroup
          aria-label="Dock state"
          value={[state]}
          onValueChange={(v: unknown[]) => {
            const next = v[0]
            if (typeof next === 'string') setState(next as DockState)
          }}
          className="tw:w-full"
        >
          {DOCK_STATES.map((s) => (
            <ToggleGroupItem key={s.value} value={s.value} className="tw:text-[12.5px]">
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Said line={line} />
      </div>
      <div className="tw:absolute tw:inset-x-0 tw:bottom-0 tw:border-t tw:border-line tw:bg-[color-mix(in_srgb,var(--aa-bg)_92%,transparent)] tw:px-5 tw:pt-3.5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)-2px),14px)] tw:backdrop-blur-[14px]">
        {state === 'authorised' ? (
          <div className={cn(BAR, 'tw:bg-sunken tw:text-base tw:font-bold tw:text-slate')}>
            <Lock className="tw:size-[17px]" strokeWidth={2.4} aria-hidden />
            Authorised · read only
          </div>
        ) : state === 'submitted' ? (
          <div role="status" className={cn(BAR, 'tw:bg-success tw:text-[17px] tw:font-bold tw:text-white')} style={{ animation: 'aa-tick-pop 340ms cubic-bezier(0.65, 0, 0.35, 1)' }}>
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden>
              <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Submitted to office
          </div>
        ) : state === 'toFinish' ? (
          <Button
            size="cta"
            onClick={() => setLine('Would open the sheet naming what is left.')}
            className="tw:w-full tw:flex-col tw:gap-0 tw:bg-line tw:text-[15px] tw:leading-[18px] tw:font-semibold tw:text-mist tw:hover:bg-line-strong"
          >
            <span>Mark list completed · {incomplete} to finish</span>
            <span className="tw:text-[11px] tw:font-medium">Tap to see what is left</span>
          </Button>
        ) : (
          <Button size="cta" className="tw:w-full tw:shadow-e2" onClick={() => setLine('Would open the confirm sheet.')}>
            Mark list completed
          </Button>
        )}
      </div>
    </Bleed>
  )
}

// ===========================================================================
// DockSpacer
// ===========================================================================

/** The in-flow tail spacer (kept as is: part of the inset contract); outlined so you can see it. */
export function DockSpacer({ height }: { height: string }) {
  return <div aria-hidden data-testid="dock-spacer" className="tw:flex-none" style={{ height }} />
}

export function DockSpacerReplacement() {
  return (
    <Bleed>
      <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2.5 tw:overflow-auto tw:px-5 tw:pt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="tw:rounded-card tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3.5 tw:text-sm">
            Item {n}
          </div>
        ))}
        <div className="tw:relative tw:outline-[1.5px] tw:-outline-offset-1 tw:outline-primary tw:outline-dashed">
          <DockSpacer height="86px" />
          <span className="tw:absolute tw:top-1.5 tw:left-2 tw:text-[11px] tw:text-primary">DockSpacer (86px)</span>
        </div>
      </div>
      <div className="tw:absolute tw:inset-x-0 tw:bottom-0 tw:border-t tw:border-line tw:bg-[color-mix(in_srgb,var(--aa-bg)_92%,transparent)] tw:p-3.5 tw:backdrop-blur-[14px]">
        <Button size="cta" className="tw:w-full">Frosted dock</Button>
      </div>
    </Bleed>
  )
}

// ===========================================================================
// Colleague AM / PM cells
// ===========================================================================

interface SlotView {
  slot: { anaesthetistId: string; session: string; status: string; note?: string }
  list?: { kind: string; hospitalId: string; surgeonId: string }
  open: boolean
  displayKey: string
}
interface Anaesthetist {
  registrationNumber: string
  name: string
}

function useSlotState() {
  const lists = useAppStore((s: { schedule: { lists: unknown } }) => s.schedule.lists)
  const slots = useAppStore((s: { schedule: { slots: unknown } }) => s.schedule.slots)
  const appSettings = useAppStore((s: { appSettings: unknown }) => s.appSettings)
  const slotStatuses = useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
  return useMemo(() => ({ schedule: { slots, lists }, appSettings, masters: { slotStatuses } }), [slots, lists, appSettings, slotStatuses])
}

const isFree = (v: SlotView | undefined) => v !== undefined && (isOpenSlotView(v) as boolean)

export function ColleagueCellsReplacement({ tip }: { tip: TipMode }) {
  const { anaesthetistId } = useMobilePersona()
  const dateISO = useToday() as string
  const slotState = useSlotState()
  const anaesthetists = useAppStore((s: { masters: { anaesthetists: unknown } }) => s.masters.anaesthetists)
  const hospitals = useAppStore((s: { masters: { hospitals: unknown } }) => s.masters.hospitals)
  const surgeons = useAppStore((s: { masters: { surgeons: Record<string, { name: string }> } }) => s.masters.surgeons)
  const statuses = slotState.masters.slotStatuses
  const def = useDefaultStatus() as ResolvedStatus
  const defToken = tokenOf(def).token
  const [targets, setTargets] = useState(false)
  const [line, setLine] = useState<string | null>(null)

  const rows = useMemo(() => {
    const views = slotViewsForDate(slotState, dateISO) as SlotView[]
    const slot = (aid: string, session: string) => views.find((v) => v.slot.anaesthetistId === aid && v.slot.session === session)
    return (rosterForDate({ schedule: slotState.schedule, masters: { anaesthetists } }, dateISO) as Anaesthetist[])
      .filter((a) => a.registrationNumber !== anaesthetistId)
      .map((a) => ({ a, am: slot(a.registrationNumber, 'AM'), pm: slot(a.registrationNumber, 'PM') }))
      .sort((x, y) => {
        const fx = isFree(x.am) || isFree(x.pm) ? 0 : 1
        const fy = isFree(y.am) || isFree(y.pm) ? 0 : 1
        return fx - fy || x.a.name.localeCompare(y.a.name)
      })
      .slice(0, 3)
  }, [slotState, anaesthetists, dateISO, anaesthetistId])

  const resolve = (key: string) => resolveDisplayStatus(key, statuses) as ResolvedStatus
  function title(v: SlotView | undefined): string {
    if (v === undefined) return 'No session'
    if (v.list === undefined) return resolve(v.slot.status).label
    return v.list.kind === 'preop' ? 'Pre-op' : (locationName(v.list.hospitalId, hospitals) as string)
  }
  function subtitle(v: SlotView | undefined): string {
    if (v === undefined) return ''
    if (v.list === undefined) return v.open ? 'Open for bookings' : (v.slot.note ?? resolve(v.slot.status).longLabel)
    return [locationName(v.list.hospitalId, hospitals) as string, surgeons[v.list.surgeonId]?.name ?? ''].filter(Boolean).join(' · ')
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <Button variant="pill" className="tw:h-11 tw:w-full" onClick={() => setTargets((t) => !t)}>
        {targets ? 'Status only' : 'Show as move targets'}
      </Button>
      <div className="tw:flex tw:flex-col tw:gap-2">
        {rows.map((r) => {
          const anyFree = isFree(r.am) || isFree(r.pm)
          return (
            <div key={r.a.registrationNumber} className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:px-3.5 tw:py-3 tw:shadow-e1">
              <div className="tw:flex tw:items-center tw:gap-2.5">
                <Avatar className="tw:size-[34px]">
                  <AvatarFallback className="tw:text-xs">{initialsOf(r.a.name) as string}</AvatarFallback>
                </Avatar>
                <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[15px] tw:font-semibold">{r.a.name}</span>
                {anyFree && <Badge className={cn('tw:px-[9px] tw:py-[3px] tw:text-[11px] tw:leading-[normal]', TINT_BG[defToken], ON_TINT[defToken])}>{def.label}</Badge>}
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                {(['AM', 'PM'] as const).map((session) => {
                  const view = session === 'AM' ? r.am : r.pm
                  const canReceive = targets && isFree(view)
                  const sub = canReceive ? 'Tap to move your List here' : subtitle(view)
                  const t = title(view)
                  const resolved = view !== undefined ? resolve(view.displayKey) : undefined
                  const tk = resolved !== undefined ? tokenOf(resolved) : undefined
                  const cellStyle = tk === undefined ? undefined : tk.treatment === 'dashed' ? blockFillStyle(tk.token, 'dashed') : tintStyle(tk.token, tk.treatment)
                  const cls = cn(
                    'tw:flex tw:min-h-[52px] tw:min-w-0 tw:items-center tw:gap-2 tw:rounded-ctl tw:border tw:px-2.5 tw:py-2 tw:text-left tw:font-[inherit] tw:outline-none tw:focus-visible:shadow-focus',
                    tk === undefined ? 'tw:border-line tw:bg-sunken tw:text-mist' : cn(ON_TINT[tk.token], tk.treatment === 'hatched' ? 'tw:border-line' : 'tw:border-transparent'),
                    canReceive ? 'tw:cursor-pointer' : 'tw:cursor-default',
                  )
                  const inner = (
                    <>
                      <span className="tw:flex-none tw:font-mono tw:text-[10px] tw:font-semibold tw:opacity-70">{sessionText(session) as string}</span>
                      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
                        <span className="tw:truncate tw:text-[12.5px] tw:leading-[18px] tw:font-semibold">{t}</span>
                        <span className="tw:truncate tw:text-[10.5px] tw:leading-[14px] tw:opacity-75">{sub}</span>
                      </span>
                    </>
                  )
                  if (canReceive) {
                    return (
                      <button
                        key={session}
                        type="button"
                        className={cls}
                        style={cellStyle}
                        onClick={() => setLine(`Would open the move sheet: your ${session} List to ${r.a.name}.`)}
                      >
                        {inner}
                      </button>
                    )
                  }
                  // The tip spells the cell out once: the subtitle often repeats the hospital the title names.
                  const sub2 = subtitle(view)
                  const rest = sub2.startsWith(`${t} · `) ? sub2.slice(t.length + 3) : sub2 === t ? '' : sub2
                  const label = [`${sessionText(session) as string} ${t}`, rest].filter(Boolean).join(' · ')
                  return (
                    <Tip
                      key={session}
                      mode={tip}
                      content={label}
                      trigger={
                        <div role="button" tabIndex={0} aria-label={label} className={cls} style={cellStyle}>
                          {inner}
                        </div>
                      }
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <Said line={line} />
    </div>
  )
}

// ===========================================================================
// HalfBlock (its own row)
// ===========================================================================

function TippedHalfBlock({ session, tip }: { session: CalendarSession | undefined; tip: TipMode }) {
  const label = useHalfBlockLabel(session)
  if (session === undefined) return <HalfBlockView session={undefined} />
  return (
    <Tip
      mode={tip}
      content={label}
      trigger={
        <span role="button" tabIndex={0} aria-label={label} className="tw:block tw:cursor-default tw:rounded-[5px] tw:outline-none tw:focus-visible:shadow-focus">
          <HalfBlockView session={session} />
        </span>
      }
    />
  )
}

export function HalfBlockReplacement({ tip }: { tip: TipMode }) {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday() as string
  const days = useAvailabilityMonth(anaesthetistId, monthOf(todayISO)) as { AM?: CalendarSession; PM?: CalendarSession }[]
  const samples = useMemo(() => {
    const seen = new Map<string, CalendarSession>()
    for (const d of days) for (const s of [d.AM, d.PM]) if (s !== undefined && !seen.has(s.displayKey)) seen.set(s.displayKey, s)
    const out = [...seen.values()].slice(0, 4)
    const first = out[0]
    if (first !== undefined) {
      out.push({ ...first, slotId: `${first.slotId}-series`, series: first.series ?? { id: 'example', line: 'Every Friday' } })
      out.push({ ...first, slotId: `${first.slotId}-flag`, conflict: true })
    }
    return out
  }, [days])
  return (
    <div className="tw:grid tw:grid-cols-4 tw:gap-2.5">
      {samples.map((s) => (
        <div key={s.slotId} className="tw:flex tw:flex-col tw:gap-1">
          <TippedHalfBlock session={s} tip={tip} />
          <span className="tw:text-[10.5px] tw:leading-[normal] tw:text-mist">{s.conflict === true ? 'Flagged' : s.series !== undefined ? 'Series' : s.displayKey}</span>
        </div>
      ))}
      <div className="tw:flex tw:flex-col tw:gap-1">
        <HalfBlockView session={undefined} />
        <span className="tw:text-[10.5px] tw:leading-[normal] tw:text-mist">No session</span>
      </div>
    </div>
  )
}

// ===========================================================================
// WarningTriangle
// ===========================================================================

interface Warning {
  key: string
  bookingId: string
  ruleId: string
  kind: string
  strength: 'mild' | 'strong'
  text: string
  clearance?: unknown
}

const TONE: Record<'strong' | 'mild' | 'cleared', { disc: string; count: string }> = {
  strong: { disc: 'tw:bg-error', count: 'tw:text-error-on-tint' },
  mild: { disc: 'tw:bg-warning', count: 'tw:text-warning-on-tint' },
  cleared: { disc: 'tw:bg-mist', count: 'tw:text-slate' },
}

/** The warning marker: a disc in the strongest open warning's colour, the count when more than one. */
export function WarningMarker({ warnings, size = 'md', tooltip }: { warnings: readonly Warning[]; size?: 'sm' | 'md'; tooltip: boolean }) {
  if (warnings.length === 0) return null
  const open = warnings.filter((w) => isOpen(w) as boolean)
  const shown = open.length > 0 ? open : warnings
  const strength = (strongestOpen(warnings) as 'mild' | 'strong' | undefined) ?? 'cleared'
  const tone = TONE[strength]
  const label =
    open.length === 0
      ? `${warnings.length === 1 ? 'Warning' : `${warnings.length} warnings`} cleared: ${warnings[0]!.text}`
      : `${open.length === 1 ? '1 warning' : `${open.length} warnings`}: ${open.map((w) => w.text).join(' ')}`
  const d = size === 'sm' ? 'tw:size-[15px]' : 'tw:size-[18px]'
  const marker = (
    <span
      role="img"
      aria-label={label}
      {...(tooltip ? { tabIndex: 0 } : { title: shown.map((w) => w.text).join('\n') })}
      data-strength={strength}
      className="tw:inline-flex tw:flex-none tw:items-center tw:gap-[3px] tw:rounded-pill tw:align-middle tw:outline-none tw:focus-visible:shadow-focus"
    >
      <span aria-hidden className={cn('tw:inline-flex tw:items-center tw:justify-center tw:rounded-pill tw:text-white', d, tone.disc)}>
        <TriangleAlert className={size === 'sm' ? 'tw:size-[9px]' : 'tw:size-[11px]'} strokeWidth={2.75} />
      </span>
      {open.length > 1 && <span aria-hidden className={cn('tw:text-[11px] tw:leading-[normal] tw:font-bold tw:tabular-nums', tone.count)}>{open.length}</span>}
    </span>
  )
  if (!tooltip) return marker
  return <Tip mode="tooltip" content={shown.map((w) => w.text).join('\n')} trigger={marker} />
}

export function WarningTriangleReplacement({ tooltip }: { tooltip: boolean }) {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const todayISO = useToday() as string
  const bookingId = picks.bookingId ?? 'example'
  const base = { bookingId, ruleId: 'prepaymentUnpaid', kind: 'beforeProcedure' }
  const mild: Warning = { ...base, key: 'w1', strength: 'mild', text: 'Prepayment not yet received.' }
  const strong: Warning = { ...base, key: 'w2', strength: 'strong', text: 'Prepayment required before the procedure.' }
  const cleared: Warning = { ...mild, key: 'w3', clearance: { key: 'w3', bookingId, ruleId: 'prepaymentUnpaid', strength: 'mild', by: 'Office', role: 'office', atISO: `${todayISO}T09:00:00` } }
  const sets: { label: string; warnings: Warning[] }[] = [
    { label: 'Mild', warnings: [mild] },
    { label: 'Strong', warnings: [strong] },
    { label: 'Two open', warnings: [mild, strong] },
    { label: 'Cleared', warnings: [cleared] },
  ]
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {sets.map((s) => (
        <div key={s.label} className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:w-20 tw:text-[13px] tw:text-slate">{s.label}</span>
          <WarningMarker warnings={s.warnings} tooltip={tooltip} />
          <WarningMarker warnings={s.warnings} size="sm" tooltip={tooltip} />
        </div>
      ))}
    </div>
  )
}

// ===========================================================================
// OutOfHoursMoon
// ===========================================================================

/** The moon in a session column: lucide Moon in a 20px-tall box, colour from the caller. */
export function OutOfHoursMoonView({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('tw:flex tw:h-5 tw:items-center', className ?? 'tw:text-ink')}>
      <Moon size={size} strokeWidth={2.2} aria-hidden />
    </span>
  )
}

export function OutOfHoursMoonReplacement() {
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-[18px]">
      <OutOfHoursMoonView />
      <OutOfHoursMoonView size={13} className="tw:text-mist" />
      <OutOfHoursMoonView size={20} className="tw:text-primary" />
    </div>
  )
}

// ===========================================================================
// AttachmentStrip
// ===========================================================================

interface Attachment {
  id: string
  name: string
  kind: 'photo' | 'pdf' | 'other'
  dataUrl?: string
}

/** A sample thumbnail drawn from theme tokens (the prototype example's SVG thumbs, without hex). */
type ThumbTone = StatusToken | 'sunken' | 'teal'
function Thumb({ tone, label, name }: { tone: ThumbTone; label: string; name: string }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn('tw:flex tw:h-[92px] tw:w-[72px] tw:items-center tw:justify-center tw:rounded-[8px] tw:border tw:border-line tw:text-xs tw:text-ink', tone === 'sunken' ? 'tw:bg-sunken' : tone === 'teal' ? 'tw:bg-teal-tint' : TINT_BG[tone])}
    >
      {label}
    </span>
  )
}

type SampleAttachment = Attachment & { tone: ThumbTone; thumb: string }
const SAMPLE: SampleAttachment[] = [
  { id: 'a1', name: 'Consent form', kind: 'photo', tone: 'teal', thumb: 'Photo' },
  { id: 'a2', name: 'Referral letter', kind: 'pdf', tone: 'sunken', thumb: 'Letter' },
  { id: 'a3', name: 'Theatre list', kind: 'photo', tone: 'preop', thumb: 'List' },
]

/**
 * The attachment thumbnails, each with its remove mark always shown (a phone has no hover): a 44px
 * ghost Button around the 24px surface disc. A PDF carries a small PDF Badge. A refusal shows as a
 * destructive Alert under the strip.
 */
export function AttachmentStripView({ attachments, onRemove, emptyText }: { attachments: SampleAttachment[]; onRemove: (id: string) => { ok: true } | { ok: false; reason: string }; emptyText: string }) {
  const items = attachments
  const [error, setError] = useState<string | null>(null)
  function remove(id: string) {
    const r = onRemove(id)
    setError(r.ok ? null : r.reason)
  }
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {items.length === 0 ? (
        <div className="tw:text-[13px] tw:text-mist">{emptyText}</div>
      ) : (
        <ul aria-label="Attachments" className="tw:m-0 tw:flex tw:list-none tw:flex-wrap tw:gap-2 tw:p-0">
          {items.map((a) => (
            <li key={a.id} className="tw:relative tw:flex tw:w-[72px] tw:flex-col tw:gap-1">
              <Thumb tone={a.tone} label={a.thumb} name={a.name} />
              {a.kind === 'pdf' && (
                <Badge variant="outline" aria-hidden className="tw:absolute tw:top-[70px] tw:left-1 tw:rounded-[4px]! tw:px-1 tw:py-0 tw:text-[9px] tw:leading-[normal] tw:font-bold tw:tracking-[0.04em]">
                  PDF
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${a.name}`}
                onClick={() => remove(a.id)}
                className="tw:absolute tw:-top-4 tw:-right-4 tw:size-11 tw:p-0 tw:hover:bg-transparent"
              >
                <span className="tw:flex tw:size-6 tw:items-center tw:justify-center tw:rounded-pill tw:border tw:border-line tw:bg-surface tw:text-error-on-tint tw:shadow-e1">
                  <X className="tw:size-[13px]" strokeWidth={2.6} aria-hidden />
                </span>
              </Button>
              <span className="tw:truncate tw:text-[10px] tw:leading-[normal] tw:text-mist">{a.name}</span>
            </li>
          ))}
        </ul>
      )}
      {error !== null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/** As the current example: local samples, every removal succeeds (a refusal would show the Alert). */
export function AttachmentStripReplacement() {
  const [items, setItems] = useState(SAMPLE)
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <AttachmentStripView
        attachments={items}
        emptyText="No attachments on this List."
        onRemove={(id) => {
          setItems((xs) => xs.filter((x) => x.id !== id))
          return { ok: true }
        }}
      />
      <Button variant="pill" className="tw:h-11 tw:w-full" onClick={() => setItems(SAMPLE)}>
        <Paperclip className="tw:size-3.5" aria-hidden /> Put them back
      </Button>
    </div>
  )
}
