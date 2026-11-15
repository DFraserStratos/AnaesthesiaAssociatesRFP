import { useState } from 'react'
import { useAppStore } from '@proto/store'
import { drSurname, pairingLine, waitingLabel } from '@proto/shared/format'
import { DRAFT_LIST, DRAFT_LISTS, UNASSIGNED, bookingCountLabel, unavailableDetail } from '@proto/shared/scheduleTerms'
import { blockGeometry, DAY_RULER, GRID_GUTTER, hoursOf } from '@proto/apps/admin/util'
import { LONG_WAIT_MINUTES, useWaitingMinutes } from '@proto/apps/admin/components/draftLists/DraftListParts'
import { useAdminDay, useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Echo } from '../pilot-a/Echo'

/** The fields of a prototype Draft List the band reads. */
export interface DraftListLike {
  id: string
  session: 'AM' | 'PM' | 'OOH'
  removedAtISO?: string
  draft: { origin: string; fromAnaesthetistId?: string; assignedAtISO?: string }
}

const LANE = 52

interface Ruler {
  start: number
  hours: number
}

/**
 * Today's Draft Lists on the day ruler, stacked in lanes when two share a
 * session. Each block is a button whose detail moves from the native title to
 * a Base UI Tooltip (hover and keyboard focus); same white body, strong border,
 * warning-solid left bar and micro-caps UNASSIGNED line. Rendered as a grid row
 * so it sits inside the DayGrid's role=grid.
 */
export function DraftListBand({ draftLists, bookingCounts, onOpen, ruler = DAY_RULER }: { draftLists: readonly DraftListLike[]; bookingCounts: ReadonlyMap<string, number>; onOpen: (listId: string) => void; ruler?: Ruler }) {
  const masters = useAppStore((s: { masters: { anaesthetists: Record<string, { name: string }> } }) => s.masters)
  const defaults = useAppStore((s: { appSettings: { schedule: { defaultTimes: Record<string, { startTime: string; endTime: string }> } } }) => s.appSettings.schedule.defaultTimes)
  if (draftLists.length === 0) return null

  const laneOf = new Map<string, number>()
  const perSession: Record<string, number> = { AM: 0, PM: 0, OOH: 0 }
  for (const l of draftLists) {
    laneOf.set(l.id, perSession[l.session] ?? 0)
    perSession[l.session] = (perSession[l.session] ?? 0) + 1
  }
  const lanes = Math.max(perSession.AM ?? 0, perSession.PM ?? 0, perSession.OOH ?? 0, 1)

  return (
    <div role="row" data-draft-band-count={draftLists.length} className="tw:flex tw:items-stretch tw:border-b tw:border-line-strong tw:bg-background">
      <span role="rowheader" className="tw:flex tw:w-[148px] tw:flex-none tw:flex-col tw:justify-center tw:gap-0.5 tw:pl-4">
        <span className="tw:text-[12.5px] tw:font-semibold tw:text-ink">
          {DRAFT_LISTS} <span className="tw:font-mono tw:tabular-nums tw:text-warning-on-tint">{draftLists.length}</span>
        </span>
        <span className="tw:text-[10px] tw:font-semibold tw:tracking-[0.06em] tw:text-warning-on-tint">{UNASSIGNED.toUpperCase()}</span>
      </span>
      <span role="gridcell" className="tw:relative tw:block tw:flex-1" style={{ height: lanes * LANE }}>
        {draftLists.map((l) => {
          const t = defaults[l.session]!
          const geo = blockGeometry(hoursOf(t.startTime), hoursOf(t.endTime), ruler) as { left: string; width: string }
          const lane = laneOf.get(l.id) ?? 0
          const from = l.draft.origin === 'recurringClash' && l.draft.fromAnaesthetistId !== undefined ? masters.anaesthetists[l.draft.fromAnaesthetistId] : undefined
          const count = bookingCounts.get(l.id) ?? 0
          const pairing = pairingLine(l, masters) as string
          const tip = `${UNASSIGNED} · ${pairing}${from !== undefined ? ` · ${unavailableDetail(drSurname(from.name))}` : ''} · ${bookingCountLabel(count)}`
          return (
            <Tooltip key={l.id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    data-draft-block={l.id}
                    onClick={() => onOpen(l.id)}
                    aria-label={tip}
                    className="tw:absolute tw:flex tw:cursor-pointer tw:flex-col tw:justify-center tw:gap-px tw:overflow-hidden tw:rounded-sm tw:border tw:border-line-strong tw:bg-surface tw:py-[3px] tw:pr-2 tw:pl-2.5 tw:text-left tw:shadow-[inset_3px_0_0_var(--warning)] tw:outline-none tw:focus-visible:shadow-[inset_3px_0_0_var(--warning),var(--focus-ring)]"
                    style={{ top: lane * LANE + 4, height: LANE - 8, left: geo.left, width: geo.width }}
                  />
                }
              >
                <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[9.5px] tw:leading-3 tw:font-bold tw:tracking-[0.06em] tw:text-warning-on-tint">
                  {UNASSIGNED.toUpperCase()}
                  <span className="tw:ml-auto tw:tracking-normal">
                    <WaitingTime list={l} />
                  </span>
                </span>
                <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-[5px]">
                  <span data-booking-count={count} className="tw:inline-flex tw:h-3 tw:min-w-3.5 tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-sunken tw:px-[3px]">
                    <span className={cn('tw:font-mono tw:text-[9px] tw:leading-3 tw:font-semibold tw:tabular-nums', count === 0 ? 'tw:text-mist' : 'tw:text-slate')}>{count}</span>
                  </span>
                  <span className="tw:truncate tw:text-[10.5px] tw:leading-[13px] tw:font-semibold tw:text-ink">{pairing}</span>
                </span>
                {from !== undefined && <span className="tw:truncate tw:text-[9.5px] tw:leading-3 tw:text-slate">{unavailableDetail(drSurname(from.name))}</span>}
              </TooltipTrigger>
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          )
        })}
      </span>
      <span aria-hidden className="tw:flex-none" style={{ width: GRID_GUTTER }} />
    </div>
  )
}

/** The live waiting time from the demo clock; a day or more is the warning on-tint at 600. */
function WaitingTime({ list }: { list: DraftListLike }) {
  const minutes = useWaitingMinutes(list) as number
  const long = minutes >= LONG_WAIT_MINUTES && list.removedAtISO === undefined && list.draft.assignedAtISO === undefined
  return <span className={cn('tw:font-mono tw:text-[10px] tw:tabular-nums', long ? 'tw:font-semibold tw:text-warning-on-tint' : 'tw:font-medium tw:text-slate')}>{waitingLabel(minutes)}</span>
}

/** The row's example: the band alone over today's seed, at the catalogue's 900px width. */
export function DraftListBandReplacement() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO) as { draftLists: DraftListLike[]; bookingCounts: ReadonlyMap<string, number> }
  const [opened, setOpened] = useState<string | null>(null)
  if (day.draftLists.length === 0) return <div className="tw:text-[13px] tw:text-mist">The seed has no {DRAFT_LISTS} today right now (try Demo reset).</div>
  return (
    <TooltipProvider delay={300}>
      <div className="tw:min-w-[900px]" role="grid" aria-label={DRAFT_LISTS}>
        <DraftListBand draftLists={day.draftLists} bookingCounts={day.bookingCounts} onOpen={setOpened} />
      </div>
      <Echo>{opened === null ? `Click a ${DRAFT_LIST} to open its drawer.` : `Open the ${DRAFT_LIST} drawer for ${opened} (stubbed).`}</Echo>
    </TooltipProvider>
  )
}
