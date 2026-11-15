import { useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { isOpenSlotView, rosterForDate, slotViewsForDate, useAppStore } from '@proto/store'
import { resolveDisplayStatus, useLegendKeys } from '@proto/shared'
import { initialsOf, locationName, matchesNameQuery } from '@proto/shared/format'
import { useMovableSessions } from '@proto/shared/flows'
import { sessionText } from '@proto/domain/outOfHours'
import { OUT_OF_HOURS } from '@proto/shared/outOfHoursTerms'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SearchField } from '../../shared/searchField'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Panel, Said, StatusBadge, TONE, toneFor, useSlotStatuses, Wide } from './shared'

export interface SlotView {
  slot: { id: string; anaesthetistId: string; session: string; status: string; note?: string; dateISO: string }
  displayKey: string
  open: boolean
  list?: { id: string; kind: string; hospitalId: string; surgeonId: string; notes?: string }
}

export interface Labels {
  l1: string
  l2: string
}

/** The cell's two lines, as AvailabilityGrid's cellLabels. */
export function useCellLabels(): (view: SlotView | undefined) => Labels {
  const slotStatuses = useSlotStatuses()
  const hospitals = useAppStore((s: any) => s.masters.hospitals)
  const surgeons = useAppStore((s: any) => s.masters.surgeons)
  return (view) => {
    if (view === undefined) return { l1: 'No session', l2: '' }
    const list = view.list
    if (list === undefined) {
      const status = resolveDisplayStatus(view.slot.status, slotStatuses) as { label: string; longLabel: string }
      if (view.open) return { l1: status.label, l2: 'Open for booking' }
      return { l1: status.longLabel, l2: view.slot.note ?? '' }
    }
    if (list.kind === 'preop') return { l1: 'Pre-op clinic', l2: locationName(list.hospitalId, hospitals) }
    const l2 = list.kind !== 'private' && list.notes !== undefined ? list.notes : (surgeons[list.surgeonId]?.name ?? '')
    return { l1: locationName(list.hospitalId, hospitals), l2 }
  }
}

/* ------------------------------------------------------------------ */
/* Cell                                                                */
/* ------------------------------------------------------------------ */

export interface CellProps {
  view: SlotView | undefined
  labels: Labels
  onAct?: () => void
  action?: string
  /** What the action does, shown in a Tooltip (today a native title). */
  title?: string
  quietEmpty?: boolean
  /** `disabled`: a non-actionable cell is a disabled button, skipped by Tab (as today). `reachable`: focusable, aria-disabled, its full text in a Tooltip. */
  inert?: 'disabled' | 'reachable'
  /** Roving focus from a grid: this cell's tab stop and its key into the grid. */
  tabIndex?: number
  cellKey?: string
}

/**
 * One colleague session on Find cover: the status fill and bar, two lines, and Move or Move here when her
 * List can go there. Custom anatomy on the status tokens; the hint is a shadcn Tooltip.
 */
export function AvailabilityCell({ view, labels, onAct, action, title, quietEmpty = false, inert = 'disabled', tabIndex, cellKey }: CellProps) {
  const slotStatuses = useSlotStatuses()
  if (view === undefined) {
    if (quietEmpty) return <div aria-hidden={tabIndex === undefined ? true : undefined} aria-label={tabIndex === undefined ? undefined : 'No session'} data-cell={cellKey} tabIndex={tabIndex} className="tw:h-[52px] tw:rounded-[9px] tw:border tw:border-dashed tw:border-line tw:outline-none tw:focus-visible:shadow-focus" />
    return (
      <div data-cell={cellKey} tabIndex={tabIndex} className="tw:flex tw:h-[52px] tw:items-center tw:rounded-[9px] tw:bg-sunken tw:px-2.5 tw:text-xs tw:text-mist tw:outline-none tw:focus-visible:shadow-focus">
        No session
      </div>
    )
  }
  const tone = toneFor(view.displayKey, slotStatuses)
  const isFree = isOpenSlotView(view) as boolean
  const text = TONE[tone.token].text
  const acts = onAct !== undefined
  const button = (
    <button
      type="button"
      data-slot-id={view.slot.id}
      data-cell={cellKey}
      tabIndex={tabIndex}
      onClick={acts ? onAct : undefined}
      disabled={!acts && inert === 'disabled'}
      aria-disabled={!acts && inert === 'reachable' ? true : undefined}
      className={cn(
        'tw:flex tw:h-[52px] tw:w-full tw:items-center tw:gap-2 tw:rounded-[9px] tw:px-2.5 tw:text-left tw:outline-none tw:[font:inherit] tw:focus-visible:shadow-focus',
        TONE[tone.token].tint,
        tone.treatment === 'hatched' && 'aa-status-hatched',
        isFree && tone.treatment === 'dashed' ? 'aa-status-dashed' : 'tw:border-[1.5px] tw:border-solid tw:border-transparent',
        acts ? 'tw:cursor-pointer' : 'tw:cursor-default',
      )}
    >
      {!isFree && <span aria-hidden className={cn('tw:h-[34px] tw:w-1 tw:flex-none tw:rounded-pill', TONE[tone.token].bar)} />}
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <span className={cn('tw:truncate tw:text-xs tw:font-semibold', text)}>{labels.l1}</span>
        <span className={cn('tw:truncate tw:text-[11px] tw:opacity-75', text)}>{labels.l2}</span>
      </span>
      {action !== undefined && <span className={cn('tw:flex-none tw:text-xs tw:font-semibold', text)}>{action}</span>}
    </button>
  )
  const hint = acts ? title : inert === 'reachable' ? [labels.l1, labels.l2].filter((s) => s !== '').join(' · ') : undefined
  if (hint === undefined) return button
  return (
    <Tooltip>
      <TooltipTrigger render={button as ReactElement<Record<string, unknown>>} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** The Cell row: the same four real session views for today, and No session; only a free one acts. */
export function AvailabilityCellReplacement({ inert = 'disabled' }: { inert?: 'disabled' | 'reachable' }) {
  const f = useWebFixtures() as { todayISO: string }
  const schedule = useAppStore((s: any) => s.schedule)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const slotStatuses = useSlotStatuses()
  const labels = useCellLabels()
  const [said, setSaid] = useState<string | null>(null)
  const views = useMemo(() => {
    const all = slotViewsForDate({ schedule, appSettings, masters: { slotStatuses } }, f.todayISO) as SlotView[]
    const seen = new Set<string>()
    const out: SlotView[] = []
    for (const v of [...all].sort((a, b) => a.slot.id.localeCompare(b.slot.id))) {
      const k = v.open ? 'open' : v.displayKey
      if (seen.has(k)) continue
      seen.add(k)
      out.push(v)
      if (out.length === 4) break
    }
    return out
  }, [schedule, appSettings, slotStatuses, f.todayISO])
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        {views.map((v) => (
          <AvailabilityCell
            key={v.slot.id}
            view={v}
            labels={labels(v)}
            inert={inert}
            {...(v.open ? { onAct: () => setSaid('Would open the move sheet into this free session.'), action: 'Move here', title: 'Move your List here' } : {})}
          />
        ))}
        <AvailabilityCell view={undefined} labels={{ l1: 'No session', l2: '' }} />
      </div>
      <Said text={said} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

interface GridRow {
  id: string
  name: string
  initials: string
  am?: SlotView
  pm?: SlotView
  ooh?: SlotView
  hasFree: boolean
}

interface Movable {
  list: { id: string }
  targetSlotIds: Set<string>
}

/**
 * Find cover as a custom ARIA grid: rows of anaesthetists, a row header each, AM / PM (and an opened
 * evening) cells as gridcells with one roving tab stop (arrows, Home, End, Ctrl+Home/End). Built on
 * library pieces: Button for the day stepper and filters, InputGroup for the name search, Avatar,
 * Badge for the legend, Tooltip for each cell's hint. Moves only report here (no demo data changes).
 */
export function AvailabilityGridReplacement() {
  const f = useWebFixtures() as { anaesthetistId: string; todayISO: string }
  const me = f.anaesthetistId
  const lists = useAppStore((s: any) => s.schedule.lists)
  const slots = useAppStore((s: any) => s.schedule.slots)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const anaesthetists = useAppStore((s: any) => s.masters.anaesthetists)
  const slotStatuses = useSlotStatuses()
  const legendKeys = useLegendKeys() as string[]
  const labels = useCellLabels()
  const [date, setDate] = useState(f.todayISO)
  const [filter, setFilter] = useState<'all' | 'free'>('all')
  const [query, setQuery] = useState('')
  const [said, setSaid] = useState<string | null>(null)
  const [active, setActive] = useState<[number, number]>([0, 0])
  const gridRef = useRef<HTMLDivElement>(null)
  const movable = useMovableSessions(me, date) as Partial<Record<string, Movable>>

  const { rows, freeCount } = useMemo(() => {
    const schedule = { slots, lists }
    const views = slotViewsForDate({ schedule, appSettings, masters: { slotStatuses } }, date) as SlotView[]
    const slot = (aid: string, s: string) => views.find((v) => v.slot.anaesthetistId === aid && v.slot.session === s)
    const open = (v: SlotView | undefined) => v !== undefined && (isOpenSlotView(v) as boolean)
    const all: GridRow[] = (rosterForDate({ schedule, masters: { anaesthetists } }, date) as { registrationNumber: string; name: string }[])
      .map((a) => {
        const am = slot(a.registrationNumber, 'AM')
        const pm = slot(a.registrationNumber, 'PM')
        const ooh = slot(a.registrationNumber, 'OOH')
        return { id: a.registrationNumber, name: a.name, initials: initialsOf(a.name), am, pm, ooh, hasFree: open(am) || open(pm) || open(ooh) }
      })
      .sort((x, y) => x.name.localeCompare(y.name))
    const count = all.reduce((n, r) => n + (open(r.am) ? 1 : 0) + (open(r.pm) ? 1 : 0) + (open(r.ooh) ? 1 : 0), 0)
    return { rows: all, freeCount: count }
  }, [lists, slots, appSettings, slotStatuses, anaesthetists, date])

  const evening = rows.some((r) => r.ooh !== undefined)
  const sessions = evening ? ['AM', 'PM', 'OOH'] : ['AM', 'PM']
  const cols = evening ? 'tw:grid-cols-[220px_1fr_1fr_1fr]' : 'tw:grid-cols-[220px_1fr_1fr]'
  const visible = rows.filter((r) => (filter === 'free' ? r.hasFree : true)).filter((r) => matchesNameQuery(r.name, query))
  const [ar, ac] = [Math.min(active[0], Math.max(0, visible.length - 1)), Math.min(active[1], sessions.length)]

  function focusCell(r: number, c: number) {
    setActive([r, c])
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`)?.focus())
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const lastR = visible.length - 1
    const lastC = sessions.length
    let [r, c] = [ar, ac]
    if (e.key === 'ArrowRight') c = Math.min(lastC, c + 1)
    else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1)
    else if (e.key === 'ArrowDown') r = Math.min(lastR, r + 1)
    else if (e.key === 'ArrowUp') r = Math.max(0, r - 1)
    else if (e.key === 'Home') [r, c] = e.ctrlKey ? [0, 0] : [r, 0]
    else if (e.key === 'End') [r, c] = e.ctrlKey ? [lastR, lastC] : [r, lastC]
    else return
    e.preventDefault()
    focusCell(r, c)
  }

  const shift = (d: number) => setDate(format(addDays(parseISO(date), d), 'yyyy-MM-dd'))

  return (
    <Wide width={1180}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <Said text={said} />
        <div className="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4">
          <div>
            <h1 className="tw:m-0 tw:text-[28px] tw:leading-[34px] tw:font-bold tw:tracking-[-0.015em]">Availability</h1>
            <div className="tw:mt-1 tw:text-sm tw:text-slate">Find cover fast. Move one of your Lists into a colleague's free session.</div>
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button variant="outline" size="icon" aria-label="Previous day" className="tw:size-[38px] tw:text-slate" onClick={() => shift(-1)}>
              <ChevronLeftIcon aria-hidden />
            </Button>
            <div aria-live="polite" className="tw:flex tw:h-[38px] tw:items-center tw:rounded-ctl tw:border tw:border-line tw:bg-surface tw:px-[18px] tw:text-sm tw:font-semibold">
              {format(parseISO(date), 'EEEE d MMMM')}
            </div>
            <Button variant="outline" size="icon" aria-label="Next day" className="tw:size-[38px] tw:text-slate" onClick={() => shift(1)}>
              <ChevronRightIcon aria-hidden />
            </Button>
            <Button variant="outline" className="tw:h-[38px] tw:border-primary tw:px-3.5 tw:text-[13px] tw:text-primary" onClick={() => setDate(f.todayISO)}>
              Today
            </Button>
          </div>
        </div>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-2">
            {(
              [
                ['all', 'All anaesthetists'],
                ['free', `Free only · ${freeCount}`],
              ] as const
            ).map(([v, label]) => (
              <Button key={v} variant={filter === v ? 'default' : 'outline'} aria-pressed={filter === v} onClick={() => setFilter(v)} className={cn('tw:h-9 tw:rounded-pill! tw:px-4 tw:text-[13px]', filter !== v && 'tw:text-slate')}>
                {label}
              </Button>
            ))}
            <SearchField size="pill" value={query} onChange={setQuery} label="Search name" />
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-1.5">
            {legendKeys.map((k) => (
              <StatusBadge key={k} status={k} />
            ))}
          </div>
        </div>

        <Panel flush className="tw:gap-0 tw:overflow-hidden">
          <div ref={gridRef} role="grid" aria-label={`Sessions on ${format(parseISO(date), 'EEEE d MMMM')}`} aria-rowcount={visible.length + 1} onKeyDown={onKey} className="tw:min-w-[720px]">
            <div role="row" className={cn('tw:grid tw:gap-x-3 tw:border-b tw:border-line tw:bg-[var(--aa-bg)] tw:px-5 tw:py-2.5', cols)}>
              {['Anaesthetist', 'AM', 'PM', ...(evening ? [OUT_OF_HOURS as string] : [])].map((h) => (
                <span key={h} role="columnheader" className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">
                  {h}
                </span>
              ))}
            </div>
            {visible.length === 0 && <div className="tw:px-5 tw:py-6 tw:text-center tw:text-mist">No anaesthetists match.</div>}
            {visible.map((row, r) => {
              const mine = row.id === me
              const stop = (c: number) => (r === ar && c === ac ? 0 : -1)
              return (
                <div key={row.id} role="row" onFocus={(e) => {
                  const k = (e.target as HTMLElement).dataset.cell
                  if (k !== undefined) {
                    const [rr, cc] = k.split('-').map(Number)
                    if (rr !== ar || cc !== ac) setActive([rr!, cc!])
                  }
                }} className={cn('tw:grid tw:items-center tw:gap-x-3 tw:border-b tw:border-sunken tw:px-5 tw:py-[7px]', cols)}>
                  <span role="rowheader" className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
                    <Avatar className="tw:size-[30px]">
                      <AvatarFallback className="tw:text-[11px]">{row.initials}</AvatarFallback>
                    </Avatar>
                    <span className="tw:truncate tw:text-sm tw:font-semibold">
                      {row.name}
                      {mine && <span className="tw:ml-1.5 tw:text-[11px] tw:text-mist">(you)</span>}
                    </span>
                    {mine ? (
                      <Button variant="link" data-cell={`${r}-0`} tabIndex={stop(0)} className="tw:flex-none tw:text-xs" onClick={() => setSaid(`Would open My availability on ${date}`)}>
                        Change
                      </Button>
                    ) : (
                      <span data-cell={`${r}-0`} tabIndex={stop(0)} className="tw:sr-only">
                        {row.name}
                      </span>
                    )}
                  </span>
                  {sessions.map((s, i) => {
                    const view = s === 'AM' ? row.am : s === 'PM' ? row.pm : row.ooh
                    const m = movable[s]
                    const own = mine && m !== undefined && view?.list?.id === m.list.id
                    const receive = !mine && m !== undefined && view !== undefined && m.targetSlotIds.has(view.slot.id)
                    const act = (own || receive) && view !== undefined
                    return (
                      <div role="gridcell" key={s}>
                        <AvailabilityCell
                          view={view}
                          labels={labels(view)}
                          quietEmpty={s === 'OOH'}
                          inert="reachable"
                          cellKey={`${r}-${i + 1}`}
                          tabIndex={stop(i + 1)}
                          {...(act
                            ? {
                                onAct: () => setSaid(own ? `Would open the move sheet for your ${sessionText(s)} List` : `Would open the move sheet: your ${sessionText(s)} List to ${row.name}`),
                                action: own ? 'Move' : 'Move here',
                                title: own ? 'Move this List' : `Move your ${sessionText(s)} List to ${row.name}`,
                              }
                            : {})}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </Wide>
  )
}
