import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Moon, Plus, TriangleAlert } from 'lucide-react'
import { useAppStore, useConflictLookups } from '@proto/store'
import { resolveDisplayStatus, useLegendKeys, useSlotStatusRecords } from '@proto/shared'
import { isClosedKey } from '@proto/domain/slotStatus'
import { CONFLICT_REASONS } from '@proto/domain/conflicts'
import { compareSessions, isOutOfHours } from '@proto/domain/outOfHours'
import { surgeonSpecialtyLabel } from '@proto/domain/specialties'
import { OPEN_OUT_OF_HOURS, OUT_OF_HOURS } from '@proto/shared/outOfHoursTerms'
import { DRAFT_LIST, draftListCount } from '@proto/shared/scheduleTerms'
import { attentionReasons, blockGeometry, DAY_RULER, GRID_GUTTER, hoursOf, rulerEndLabel, rulerFor, rulerLabels, slotSpan, surnameFirst } from '@proto/apps/admin/util'
import { useAdminDay, useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Echo } from '../pilot-a/Echo'
import { DraftListBand, type DraftListLike } from './DraftListBand'
import { blockFillStyle, ON_TINT, TINT_BG, tokenOf, type ResolvedStatus } from './statusFill'

// ---------------------------------------------------------------------------
// Local types for the prototype data this row reads (TS never sees @proto).
// ---------------------------------------------------------------------------

export interface Ruler {
  start: number
  hours: number
}
interface Slot {
  id: string
  session: 'AM' | 'PM' | 'OOH'
  status: string
  note?: string
  anaesthetistId: string
}
interface ListLike {
  id: string
  kind: string
  notes?: string
  hospitalId: string
  surgeonId: string
  conflicts: { kind: string }[]
}
interface SlotView {
  slot: Slot
  list?: ListLike
  open: boolean
  displayKey: string
  times: { startTime: string; endTime: string }
}
interface WarningSummary {
  open: number
  strongest: 'strong' | 'mild'
}
interface Masters {
  hospitals: Record<string, { name: string; locationType?: string }>
  surgeons: Record<string, { name: string }>
  slotStatuses: unknown
}
interface Anaesthetist {
  registrationNumber: string
  name: string
}

interface Segment {
  view: SlotView
  start: number
  end: number
  displayKey: string
  listAttention: boolean
  needsAttention: boolean
  conflict: boolean
  hasNote: boolean
  warnings?: WarningSummary
}

type FocusFilter = 'attention' | 'conflicts' | 'note' | 'warnings'
/** How the keyboard reaches the blocks: one Tab stop per block (as today), or one Tab stop for the grid and arrow keys inside it. */
export type KeyboardModel = 'tab' | 'grid'

/** Merge a both-sessions pair under one closed status (no List in either) into one full-day block, as the prototype does. */
function segmentsFor(views: SlotView[], statuses: unknown): { view: SlotView; start: number; end: number }[] {
  const am = views.find((v) => v.slot.session === 'AM')
  const pm = views.find((v) => v.slot.session === 'PM')
  const evening = views.filter((v) => isOutOfHours(v.slot)).map((v) => ({ view: v, ...slotSpan(v) }))
  if (am !== undefined && pm !== undefined && am.list === undefined && pm.list === undefined && am.slot.status === pm.slot.status && isClosedKey(statuses, am.slot.status)) {
    return [{ view: am, start: 7, end: 18 }, ...evening]
  }
  return [...views].sort((a, b) => compareSessions(a.slot, b.slot)).map((v) => ({ view: v, ...slotSpan(v) }))
}

function hasNoteSignal(view: SlotView): boolean {
  const list = view.list
  return list !== undefined && list.notes !== undefined && list.notes.trim() !== '' && list.kind === 'private'
}

// ---------------------------------------------------------------------------
// Roving focus (the "grid" keyboard model)
// ---------------------------------------------------------------------------

/**
 * Arrow keys inside role=grid: Left/Right move along a row's blocks, Up/Down to
 * the block in the next row nearest in time, Home/End to the row's ends. One
 * block holds tabIndex 0; the rest -1. Blocks carry data-grid-row and data-start.
 */
function useRovingGrid(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)

  function blocks(): HTMLElement[] {
    return ref.current === null ? [] : [...ref.current.querySelectorAll<HTMLElement>('[data-grid-block]')]
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!enabled) return
    const current = (e.target as HTMLElement).closest<HTMLElement>('[data-grid-block]')
    if (current === null) return
    const all = blocks()
    const row = Number(current.dataset.gridRow)
    const start = Number(current.dataset.start)
    const inRow = (r: number) => all.filter((b) => Number(b.dataset.gridRow) === r)
    const rows = [...new Set(all.map((b) => Number(b.dataset.gridRow)))].sort((a, b) => a - b)
    let next: HTMLElement | undefined
    const same = inRow(row)
    const idx = same.indexOf(current)
    if (e.key === 'ArrowRight') next = same[idx + 1]
    else if (e.key === 'ArrowLeft') next = same[idx - 1]
    else if (e.key === 'Home') next = same[0]
    else if (e.key === 'End') next = same[same.length - 1]
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const ri = rows.indexOf(row)
      const step = e.key === 'ArrowDown' ? 1 : -1
      for (let r = ri + step; r >= 0 && r < rows.length && next === undefined; r += step) {
        const candidates = inRow(rows[r]!)
        next = [...candidates].sort((a, b) => Math.abs(Number(a.dataset.start) - start) - Math.abs(Number(b.dataset.start) - start))[0]
      }
    } else return
    e.preventDefault()
    if (next !== undefined) {
      setActive(next.dataset.gridBlock ?? null)
      next.focus()
    }
  }
  /** The tabIndex for a block: in the grid model, only the active one (else the first) is in the Tab order. */
  function tabIndexFor(id: string, isFirst: boolean, activeShown: boolean): number {
    if (!enabled) return 0
    if (active === null || !activeShown) return isFirst ? 0 : -1
    return active === id ? 0 : -1
  }
  return { ref, active, onKeyDown, tabIndexFor, setActive }
}

// ---------------------------------------------------------------------------
// The grid
// ---------------------------------------------------------------------------

/**
 * The Day canvas rebuilt on primitives: role=grid with row and rowheader roles,
 * each block a button with a Base UI Tooltip (replacing the native title), the
 * status legend as pressed Badge toggles, the focus filters as toggle buttons
 * and the out-of-hours control as a Button icon revealed on row hover or focus.
 * Same seed, same ten rows, same block maths (the prototype's util helpers).
 */
export function DayGridReplacement({ keyboard = 'tab' }: { keyboard?: KeyboardModel }) {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO, 10) as {
    anaesthetists: Anaesthetist[]
    viewsByAnaesthetist: Record<string, SlotView[]>
    masters: Masters
    warningFlags: ReadonlyMap<string, WarningSummary>
    draftLists: DraftListLike[]
    bookingCounts: ReadonlyMap<string, number>
  }
  const [echo, setEcho] = useState<string>(`Click a block for its session drawer, or a ${DRAFT_LIST} in the band.`)
  const eveningDefaults = useAppStore((s: { appSettings: { schedule: { defaultTimes: { OOH: { endTime: string } } } } }) => s.appSettings.schedule.defaultTimes.OOH)
  const slotStatuses = useSlotStatusRecords()
  const legendKeys = useLegendKeys() as string[]
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<string>>(() => new Set())
  const [focusFilters, setFocusFilters] = useState<Set<FocusFilter>>(() => new Set())
  const roving = useRovingGrid(keyboard === 'grid')

  const ruler: Ruler = useMemo(() => {
    const ends = Object.values(day.viewsByAnaesthetist).flatMap((vs) => vs.filter((v) => isOutOfHours(v.slot)).map((v) => slotSpan(v).end as number))
    const draftEnds = day.draftLists.some((l) => isOutOfHours(l)) ? [hoursOf(eveningDefaults.endTime) as number] : []
    return rulerFor([...ends, ...draftEnds])
  }, [day.viewsByAnaesthetist, day.draftLists, eveningDefaults])
  const afterHours = ruler.hours !== DAY_RULER.hours ? (blockGeometry(DAY_RULER.start + DAY_RULER.hours, ruler.start + ruler.hours, ruler) as { left: string; width: string }) : undefined

  const rows = useMemo(
    () =>
      day.anaesthetists.map((anaesthetist) => ({
        anaesthetist,
        segments: segmentsFor(day.viewsByAnaesthetist[anaesthetist.registrationNumber] ?? [], slotStatuses).map((segment): Segment => {
          const list = segment.view.list
          const listAttention = list !== undefined && (attentionReasons(list) as string[]).length > 0
          const warnings = list !== undefined ? day.warningFlags.get(list.id) : undefined
          return {
            ...segment,
            displayKey: segment.view.displayKey,
            listAttention,
            conflict: list !== undefined && list.conflicts.length > 0,
            needsAttention: listAttention || warnings !== undefined,
            hasNote: hasNoteSignal(segment.view),
            warnings,
          }
        }),
      })),
    [day.anaesthetists, day.viewsByAnaesthetist, day.warningFlags, slotStatuses],
  )

  const filteredRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        segments: row.segments.filter((s) => {
          if (hiddenStatuses.has(s.displayKey)) return false
          if (focusFilters.size === 0) return true
          return (focusFilters.has('attention') && s.listAttention) || (focusFilters.has('conflicts') && s.conflict) || (focusFilters.has('note') && s.hasNote) || (focusFilters.has('warnings') && s.warnings !== undefined)
        }),
      })),
    [rows, hiddenStatuses, focusFilters],
  )
  const filtered = hiddenStatuses.size > 0 || focusFilters.size > 0
  const matching = filteredRows.filter((r) => r.segments.length > 0).length
  const totalBlocks = rows.reduce((n, r) => n + r.segments.length, 0)
  const visibleBlocks = filteredRows.reduce((n, r) => n + r.segments.length, 0)
  const displayedRows = filtered ? [...filteredRows.filter((r) => r.segments.length > 0), ...filteredRows.filter((r) => r.segments.length === 0)] : filteredRows
  const shownIds = displayedRows.flatMap((r) => r.segments.map((s) => s.view.slot.id))
  const firstBlockId = shownIds[0]
  const activeShown = roving.active !== null && shownIds.includes(roving.active)

  const toggle = <T,>(set: (fn: (s: Set<T>) => Set<T>) => void, v: T) =>
    set((current) => {
      const next = new Set(current)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })

  return (
    <TooltipProvider delay={300}>
      <div className="tw:min-w-[1040px]">
        <div className="tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:bg-surface tw:shadow-e1">
          <div ref={roving.ref} role="grid" aria-label="Day schedule" aria-rowcount={displayedRows.length + 1} onKeyDown={roving.onKeyDown}>
            {/* Ruler header */}
            <div role="row" className="tw:flex tw:border-b tw:border-line tw:bg-background tw:py-2">
              <span role="columnheader" className="tw:w-[148px] tw:flex-none tw:pl-4 tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist">
                ANAESTHETIST
              </span>
              <span role="columnheader" aria-label="Time, 07:00 onwards" className="tw:flex tw:flex-1">
                {(rulerLabels(ruler) as string[]).map((t) => (
                  <span key={t} className="tw:flex-1 tw:font-mono tw:text-[10px] tw:text-mist">
                    {t}
                  </span>
                ))}
              </span>
              <span className="tw:flex-none tw:font-mono tw:text-[10px] tw:text-mist" style={{ width: GRID_GUTTER }}>
                {rulerEndLabel(ruler)}
              </span>
            </div>

            <DraftListBand draftLists={day.draftLists} bookingCounts={day.bookingCounts} ruler={ruler} onOpen={(id) => setEcho(`Open the ${DRAFT_LIST} drawer for ${id} (stubbed).`)} />

            {displayedRows.map(({ anaesthetist, segments }, index) => {
              const inactive = filtered && segments.length === 0
              const startsInactive = inactive && index === matching && matching > 0
              const name = surnameFirst(anaesthetist.name) as string
              const hasEvening = (day.viewsByAnaesthetist[anaesthetist.registrationNumber] ?? []).some((v) => isOutOfHours(v.slot))
              return (
                <div
                  key={anaesthetist.registrationNumber}
                  role="row"
                  data-filter-match={inactive ? 'false' : 'true'}
                  className={cn('tw:group/row tw:relative tw:flex tw:items-stretch tw:border-b tw:border-sunken', inactive ? 'tw:bg-background' : 'tw:bg-surface', startsInactive && 'tw:shadow-[inset_0_3px_0_var(--aa-line-strong)]')}
                >
                  <span role="rowheader" className={cn('tw:flex tw:w-[148px] tw:flex-none tw:items-center tw:truncate tw:pl-4 tw:text-[12.5px] tw:font-semibold', inactive ? 'tw:text-mist' : 'tw:text-ink')}>
                    {name}
                  </span>
                  <span
                    role="gridcell"
                    className="tw:relative tw:block tw:h-11 tw:flex-1"
                    style={{ backgroundImage: `repeating-linear-gradient(to right, var(--aa-sunken) 0, var(--aa-sunken) 1px, transparent 1px, transparent ${(100 / ruler.hours).toFixed(4)}%)` }}
                  >
                    {afterHours !== undefined && <span aria-hidden className="tw:absolute tw:inset-y-0 tw:border-l tw:border-dashed tw:border-line-strong tw:bg-background" style={{ left: afterHours.left, width: afterHours.width }} />}
                    {segments.map((seg) => (
                      <GridBlock
                        key={seg.view.slot.id}
                        seg={seg}
                        masters={day.masters}
                        ruler={ruler}
                        rowIndex={index}
                        tabIndex={roving.tabIndexFor(seg.view.slot.id, seg.view.slot.id === firstBlockId, activeShown)}
                        bookingCount={seg.view.list !== undefined ? (day.bookingCounts.get(seg.view.list.id) ?? 0) : undefined}
                        onClick={() => {
                          roving.setActive(seg.view.slot.id)
                          setEcho(`Open the session drawer for ${name}, ${seg.view.slot.session} (stubbed).`)
                        }}
                      />
                    ))}
                  </span>
                  <span className="tw:flex tw:flex-none tw:items-center tw:justify-center" style={{ width: GRID_GUTTER }}>
                    {!hasEvening && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon-xs"
                              aria-label={`${OPEN_OUT_OF_HOURS} for ${name}`}
                              className="tw:gap-px tw:border-primary tw:text-primary tw:opacity-0 tw:shadow-e1 tw:transition-opacity tw:group-hover/row:opacity-100 tw:focus-visible:opacity-100 tw:data-popup-open:opacity-100"
                              onClick={() => setEcho(`Open out-of-hours for ${anaesthetist.registrationNumber} (stubbed).`)}
                            />
                          }
                        >
                          <Plus className="tw:size-2.5!" strokeWidth={3} aria-hidden />
                          <Moon className="tw:size-[11px]!" strokeWidth={2.4} aria-hidden />
                        </TooltipTrigger>
                        <TooltipContent>{OPEN_OUT_OF_HOURS}</TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend chips + focus filters */}
          <div className={cn('tw:flex tw:flex-wrap tw:items-center tw:gap-3.5 tw:bg-background tw:px-4 tw:py-2.5', filtered && matching < rows.length && 'tw:shadow-[inset_0_3px_0_var(--aa-line-strong)]')}>
            <div role="group" aria-label="Status filters" className="tw:flex tw:flex-wrap tw:gap-2">
              {legendKeys.map((key) => {
                const resolved = resolveDisplayStatus(key, slotStatuses) as ResolvedStatus
                const active = !hiddenStatuses.has(key)
                return (
                  <Badge
                    key={key}
                    variant={tokenOf(resolved).token}
                    render={<button type="button" aria-pressed={active} aria-label={`${resolved.label} status`} onClick={() => toggle(setHiddenStatuses, key)} />}
                    className={cn('tw:cursor-pointer tw:transition-opacity', !active && 'tw:opacity-[0.42] tw:grayscale-[0.7]')}
                  >
                    {resolved.label}
                  </Badge>
                )
              })}
            </div>
            <div role="group" aria-label="List focus filters" className="tw:inline-flex tw:flex-wrap tw:gap-2">
              <SignalFilter label="Needs attention" active={focusFilters.has('attention')} icon={<Dot>!</Dot>} onClick={() => toggle(setFocusFilters, 'attention' as FocusFilter)} />
              <SignalFilter label="Conflict" active={focusFilters.has('conflicts')} icon={<ConflictSwatch />} onClick={() => toggle(setFocusFilters, 'conflicts' as FocusFilter)} />
              <SignalFilter label="Has note" active={focusFilters.has('note')} icon={<span aria-hidden className="tw:size-[7px] tw:rounded-pill tw:bg-ink tw:opacity-55" />} onClick={() => toggle(setFocusFilters, 'note' as FocusFilter)} />
              <SignalFilter label="Has warnings" active={focusFilters.has('warnings')} icon={<Dot><TriangleAlert className="tw:size-2!" strokeWidth={3} /></Dot>} onClick={() => toggle(setFocusFilters, 'warnings' as FocusFilter)} />
            </div>
            {filtered && (
              <Button
                variant="link"
                className="tw:text-[11.5px]!"
                onClick={() => {
                  setHiddenStatuses(new Set())
                  setFocusFilters(new Set())
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
          <div className="tw:bg-background tw:px-4 tw:pb-3 tw:text-[11px] tw:text-mist">
            {matching} of {rows.length} anaesthetists {matching === 1 ? 'has' : 'have'} matching blocks. Showing {visibleBlocks} of {totalBlocks} blocks
            {day.draftLists.length > 0 ? ` · ${draftListCount(day.draftLists.length)} unassigned` : ''}. At production scale (~85) this view pages and virtualises; scale is narrated here, not simulated.
          </div>
        </div>
        <Echo>{echo}</Echo>
      </div>
    </TooltipProvider>
  )
}

function Dot({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="tw:inline-flex tw:size-[13px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[9px] tw:font-bold tw:text-white">
      {children}
    </span>
  )
}

function ConflictSwatch() {
  return (
    <span aria-hidden className="tw:relative tw:inline-flex tw:h-[13px] tw:w-[22px] tw:items-center tw:justify-end tw:rounded-[4px] tw:border-[1.5px] tw:border-warning tw:bg-warning-tint tw:pr-px">
      <span className="tw:inline-flex tw:size-[9px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[7px] tw:font-bold tw:text-white">!</span>
    </span>
  )
}

/** A focus filter: a pressed toggle in the warning family (outline amber when on), as today. */
function SignalFilter({ label, active, icon, onClick }: { label: string; active: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-pill tw:border tw:px-2 tw:py-[3px] tw:text-[11.5px] tw:outline-none tw:focus-visible:shadow-focus',
        active ? 'tw:border-warning tw:bg-warning-tint tw:text-warning-on-tint' : 'tw:border-line tw:bg-surface tw:text-slate',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function GridBlock({ seg, masters, ruler, rowIndex, tabIndex, bookingCount, onClick }: { seg: Segment; masters: Masters; ruler: Ruler; rowIndex: number; tabIndex: number; bookingCount: number | undefined; onClick: () => void }) {
  const { slot, list } = seg.view
  const { listAttention, needsAttention, conflict, warnings } = seg
  const resolved = resolveDisplayStatus(seg.displayKey, masters.slotStatuses) as ResolvedStatus & { longLabel: string }
  const { token, treatment } = tokenOf(resolved)
  const conflictLookups = useConflictLookups()
  const reasons: string[] = list !== undefined ? attentionReasons(list, conflictLookups) : []
  const note = list !== undefined ? list.notes : slot.note
  const geo = blockGeometry(seg.start, seg.end, ruler) as { left: string; width: string }
  const evening = isOutOfHours(slot)
  const strong = warnings?.strongest === 'strong'
  const conflictReason: string | undefined = list !== undefined && list.conflicts[0] !== undefined ? CONFLICT_REASONS[list.conflicts[0].kind] : undefined
  const hospitalName = list !== undefined && masters.hospitals[list.hospitalId]?.locationType !== 'aaRooms' ? masters.hospitals[list.hospitalId]?.name : undefined
  const surgeon = list !== undefined ? masters.surgeons[list.surgeonId] : undefined
  const templateLabel = list !== undefined && list.kind !== 'private' && note !== undefined && note.trim() !== '' ? note : undefined

  let l1: string
  let l2: string
  if (list !== undefined && conflictReason !== undefined) {
    l1 = hospitalName ?? resolved.longLabel
    l2 = list.conflicts.length > 1 ? `${conflictReason} +${list.conflicts.length - 1}` : conflictReason
  } else if (list !== undefined) {
    l1 = hospitalName ?? resolved.longLabel
    if (templateLabel !== undefined) l2 = templateLabel
    else if (surgeon !== undefined) l2 = [surgeon.name, surgeonSpecialtyLabel(masters, surgeon) as string].filter((p) => p !== '').join(' · ')
    else l2 = note ?? ''
  } else if (seg.view.open) {
    l1 = resolved.label
    l2 = evening ? (note ?? OUT_OF_HOURS) : (note ?? '').replace(/^Free\s*\/\s*/i, '') || 'open for cover'
  } else {
    l1 = resolved.label
    l2 = note ?? (evening ? OUT_OF_HOURS : '')
  }

  const hasNote = note !== undefined && note.trim() !== ''
  const noteIsSubtitle = hasNote && l2 === note
  const warningTip = warnings !== undefined ? `${warnings.open} open warning${warnings.open === 1 ? '' : 's'}` : ''
  const surgeonTip = (conflict || templateLabel !== undefined) && surgeon !== undefined ? surgeon.name : ''
  const countTip = bookingCount !== undefined ? `${bookingCount} booking${bookingCount === 1 ? '' : 's'}` : ''
  const tip = [surgeonTip, ...reasons, warningTip, hasNote && !noteIsSubtitle ? `Note: ${note}` : '', countTip].filter(Boolean).join(' · ')

  // Border: a conflict outlines in amber (red for a strong warning); a dashed status keeps its dashes; attention outlines.
  const outline = strong ? 'var(--error)' : 'var(--warning)'
  const fill = blockFillStyle(token, treatment, 'inset')
  const border = conflict ? `1.5px solid ${outline}` : treatment === 'dashed' ? fill.border : needsAttention ? `1.5px solid ${outline}` : '1px solid transparent'

  // The focus ring is an outline, not a shadow: the inline box-shadow (the status bar) would hide a shadow ring.
  const block = (
    <button
      type="button"
      data-grid-block={slot.id}
      data-grid-row={rowIndex}
      data-start={seg.start}
      data-conflict={conflict ? 'true' : undefined}
      tabIndex={tabIndex}
      onClick={onClick}
      aria-label={[l1, l2, tip].filter(Boolean).join(', ')}
      className={cn(
        'tw:absolute tw:inset-y-1 tw:flex tw:cursor-pointer tw:flex-col tw:items-stretch tw:justify-center tw:overflow-hidden tw:rounded-sm tw:py-[3px] tw:pr-1.5 tw:pl-2 tw:text-left tw:outline-none tw:focus-visible:z-10 tw:focus-visible:outline-2 tw:focus-visible:outline-solid tw:focus-visible:outline-offset-1 tw:focus-visible:outline-primary',
        conflict ? 'tw:bg-warning-tint' : TINT_BG[token],
        ON_TINT[token],
      )}
      style={{ left: geo.left, width: geo.width, ...(conflict ? {} : fill), boxShadow: `inset 3px 0 0 var(--status-${token})`, border }}
    >
      <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-[3px] tw:text-[10.5px] tw:leading-[13px] tw:font-semibold">
        {evening && <Moon className="tw:size-[9px]! tw:flex-none" strokeWidth={2.6} aria-label={OUT_OF_HOURS} />}
        <span className="tw:truncate">{l1}</span>
      </span>
      {(l2 !== '' || bookingCount !== undefined) && (
        <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-[5px]">
          {bookingCount !== undefined && (
            <span className="tw:inline-flex tw:h-3 tw:min-w-3.5 tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-white/70 tw:px-[3px]">
              <span className={cn('tw:font-mono tw:text-[9px] tw:leading-3 tw:font-semibold tw:tabular-nums', bookingCount === 0 && 'tw:text-mist')}>{bookingCount}</span>
            </span>
          )}
          {l2 !== '' && <span className={cn('tw:truncate tw:text-[9.5px] tw:leading-3', conflict ? 'tw:font-semibold tw:text-warning-on-tint' : 'tw:opacity-75')}>{l2}</span>}
        </span>
      )}
      {listAttention && <span className="tw:absolute tw:top-[3px] tw:right-[3px] tw:flex tw:size-[13px] tw:items-center tw:justify-center tw:rounded-pill tw:bg-warning tw:text-[9px] tw:font-bold tw:text-white">!</span>}
      {seg.hasNote && !listAttention && <span className="tw:absolute tw:top-[5px] tw:right-[5px] tw:size-[7px] tw:rounded-pill tw:bg-ink tw:opacity-55" />}
      {warnings !== undefined && (
        <span
          role="img"
          aria-label={warningTip}
          className={cn('tw:absolute tw:right-[3px] tw:bottom-[3px] tw:flex tw:h-[13px] tw:items-center tw:justify-center tw:gap-px tw:rounded-pill tw:pr-1 tw:pl-[3px] tw:text-[9px] tw:font-bold tw:text-white', strong ? 'tw:bg-error' : 'tw:bg-warning')}
        >
          <TriangleAlert className="tw:size-2!" strokeWidth={3} aria-hidden />
          <span className="tw:leading-[13px] tw:tabular-nums">{warnings.open}</span>
        </span>
      )}
    </button>
  )

  if (tip === '') return block
  return (
    <Tooltip>
      <TooltipTrigger render={block} />
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

