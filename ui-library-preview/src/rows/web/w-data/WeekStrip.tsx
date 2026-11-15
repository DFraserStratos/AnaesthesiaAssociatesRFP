import { createContext, useContext, useMemo, useState, type ReactElement } from 'react'
import { addWeeks, endOfWeek, format, isSameWeek, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { DayPicker, type DayProps, type WeekProps } from 'react-day-picker'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { slotViewsForAnaesthetist, useAppStore } from '@proto/store'
import { resolveDisplayStatus } from '@proto/shared'
import { locationName, slotTimeRange } from '@proto/shared/format'
import { hasLeftMainView, LIST_PROGRESS_LABEL, listProgress } from '@proto/domain/listProgress'
import { sessionText } from '@proto/domain/outOfHours'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { blockClasses, Panel, Said, TONE, toneFor, Wide } from './shared'

interface View {
  slot: { id: string; dateISO: string; session: string; status: string; note?: string }
  displayKey: string
  open: boolean
  times: unknown
  list?: { id: string; kind: string; hospitalId: string; surgeonId: string; notes?: string; session: string; state: string; dateISO: string }
}

interface StripCtx {
  weekStart: Date
  todayISO: string
  slotFor: (dateISO: string, session: string) => View | undefined
  labels: (v: View) => { l1: string; l2: string }
  submitted: (v: View | undefined) => boolean
  slotStatuses: unknown
  onOpenList: (id: string) => void
}

const Ctx = createContext<StripCtx | null>(null)

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const WEEK = { weekStartsOn: 1 } as const

/**
 * The dashboard week on react-day-picker: one week of the month grid (a custom Week keeps only the
 * shown week), each Day cell drawing her AM and PM sessions from the same Slot views as today. DayPicker
 * supplies the grid and gridcell roles and the today modifier; the week arrows are our own buttons, as
 * DayPicker only pages by month. Truncated labels get a Tooltip with the whole text.
 */
export function WeekStripReplacement() {
  const f = useWebFixtures() as { anaesthetistId: string; todayISO: string }
  const [weekStart, setWeekStart] = useState(() => startOfWeek(parseISO(f.todayISO), WEEK))
  const [said, setSaid] = useState<string | null>(null)
  const lists = useAppStore((s: any) => s.schedule.lists)
  const slots = useAppStore((s: any) => s.schedule.slots)
  const bookings = useAppStore((s: any) => s.schedule.bookings)
  const appSettings = useAppStore((s: any) => s.appSettings)
  const hospitals = useAppStore((s: any) => s.masters.hospitals)
  const surgeons = useAppStore((s: any) => s.masters.surgeons)
  const slotStatuses = useAppStore((s: any) => s.masters.slotStatuses)

  const views = useMemo(() => {
    const out = new Map<string, View>()
    const all = slotViewsForAnaesthetist({ schedule: { slots, lists }, appSettings, masters: { slotStatuses } }, f.anaesthetistId, iso(weekStart), iso(endOfWeek(weekStart, WEEK))) as View[]
    for (const v of all) out.set(`${v.slot.dateISO}|${v.slot.session}`, v)
    return out
  }, [slots, lists, appSettings, slotStatuses, f.anaesthetistId, weekStart])

  const ctx: StripCtx = {
    weekStart,
    todayISO: f.todayISO,
    slotStatuses,
    onOpenList: (id) => setSaid(`Would open List ${id}`),
    slotFor: (dateISO, session) => {
      const v = views.get(`${dateISO}|${session}`)
      return v?.list !== undefined && hasLeftMainView(v.list) ? undefined : v
    },
    submitted: (v) => {
      const list = v?.list
      if (list === undefined) return false
      const active = (Object.values(bookings) as { listId: string; cancellation?: unknown }[]).filter((b) => b.listId === list.id && b.cancellation === undefined)
      return listProgress(list, active, f.todayISO) === 'submitted'
    },
    labels: (v) => {
      const list = v.list
      if (list === undefined) {
        const status = resolveDisplayStatus(v.slot.status, slotStatuses) as { label: string; longLabel: string }
        if (v.open) return { l1: `${status.label} · ${sessionText(v.slot.session)}`, l2: v.slot.note ?? 'Open for cover' }
        return { l1: status.longLabel, l2: v.slot.note ?? '' }
      }
      if (list.kind === 'preop') return { l1: 'Pre-op clinic', l2: locationName(list.hospitalId, hospitals) }
      const hospital = locationName(list.hospitalId, hospitals) as string
      const surgeon = list.kind !== 'private' && list.notes !== undefined ? list.notes : (surgeons[list.surgeonId]?.name ?? '')
      return { l1: hospital, l2: `${surgeon}${surgeon !== '' ? ' · ' : ''}${sessionText(list.session)}` }
    },
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <Said text={said} />
      <Wide width={1000}>
        <Panel
          title="This week"
          action={
            <div className="tw:flex tw:gap-1.5">
              <Button variant="outline" size="icon-sm" aria-label="Previous week" className="tw:rounded-[9px]! tw:text-slate" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
                <ChevronLeftIcon aria-hidden />
              </Button>
              <Button variant="outline" size="icon-sm" aria-label="Next week" className="tw:rounded-[9px]! tw:text-slate" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
                <ChevronRightIcon aria-hidden />
              </Button>
            </div>
          }
        >
          <Ctx.Provider value={ctx}>
            <DayPicker
              month={startOfMonth(weekStart)}
              today={parseISO(f.todayISO)}
              weekStartsOn={1}
              showOutsideDays
              hideNavigation
              hideWeekdays
              labels={{ labelGrid: () => `Week of ${format(weekStart, 'd MMMM yyyy')}` }}
              components={{ MonthCaption: NoCaption, Week: OneWeek, Day: SessionsDay }}
              classNames={{ root: 'tw:w-full', months: 'tw:w-full', month: 'tw:w-full', month_grid: 'tw:w-full tw:table-fixed tw:border-separate tw:border-spacing-x-2 tw:-mx-2 tw:w-[calc(100%+16px)]' }}
            />
          </Ctx.Provider>
        </Panel>
      </Wide>
    </div>
  )
}

function NoCaption(): ReactElement {
  return <></>
}

/** Only the week being shown: DayPicker renders the month, this keeps one row of it. */
function OneWeek({ week, ...props }: WeekProps) {
  const ctx = useContext(Ctx)
  const first = week.days[0]
  if (ctx === null || first === undefined || !isSameWeek(first.date, ctx.weekStart, WEEK)) return <></>
  return <tr {...props} />
}

/** A day column: its date, then the AM and PM blocks (a whole closed day merged into one tall block), then an opened out-of-hours session. */
function SessionsDay({ day, modifiers, className, children: _children, 'aria-label': _label, ...props }: DayProps) {
  const ctx = useContext(Ctx)
  if (ctx === null) return <td />
  const dateISO = iso(day.date)
  const isToday = modifiers.today === true
  const am = ctx.slotFor(dateISO, 'AM')
  const pm = ctx.slotFor(dateISO, 'PM')
  const ooh = ctx.slotFor(dateISO, 'OOH')
  const merged = am !== undefined && pm !== undefined && am.list === undefined && pm.list === undefined && !am.open && am.slot.status === pm.slot.status
  return (
    <td {...props} aria-current={isToday ? 'date' : undefined} className={cn(className, 'tw:p-0 tw:align-top')}>
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <div className={cn('tw:text-center tw:text-[11px] tw:tracking-[0.06em]', isToday ? 'tw:font-bold tw:text-brand' : 'tw:font-semibold tw:text-mist')}>{format(day.date, 'EEE d').toUpperCase()}</div>
        <div className={cn('tw:flex tw:flex-col tw:gap-1.5 tw:rounded-[12px] tw:border-2 tw:p-[5px]', isToday ? 'tw:border-brand' : 'tw:border-transparent')}>
          {merged ? (
            <Block view={am} tall />
          ) : (
            <>
              <Block view={am} />
              <Block view={pm} />
            </>
          )}
          {ooh !== undefined && <Block view={ooh} />}
        </div>
      </div>
    </td>
  )
}

function Block({ view, tall = false }: { view: View | undefined; tall?: boolean }) {
  const ctx = useContext(Ctx)!
  const height = tall ? 110 : 52
  if (view === undefined) return <div aria-hidden className="tw:rounded-[8px] tw:bg-sunken" style={{ height }} />
  const tone = toneFor(view.displayKey, ctx.slotStatuses)
  const { l1, l2 } = ctx.labels(view)
  const submitted = ctx.submitted(view)
  const list = view.list
  const time = list === undefined && !view.open ? undefined : (slotTimeRange(view.times) as string)
  const text = TONE[tone.token].text
  const body = (
    <>
      <span className={cn('tw:truncate tw:text-[11px] tw:font-semibold', text)}>
        {l1}
        {submitted && <span aria-hidden> ✓</span>}
      </span>
      <span className={cn('tw:truncate tw:text-[10px] tw:opacity-75', text)}>{l2}</span>
      {time !== undefined && <span className={cn('tw:truncate tw:font-mono tw:text-[9.5px] tw:opacity-70', text)}>{time}</span>}
    </>
  )
  const cls = cn(
    'tw:flex tw:w-full tw:flex-col tw:gap-px tw:overflow-hidden tw:rounded-[8px] tw:text-left tw:leading-[normal]',
    blockClasses(tone),
    tone.treatment === 'dashed' ? 'tw:px-2 tw:py-1.5' : 'tw:py-[7px] tw:pr-[9px] tw:pl-[9px]',
    submitted && 'tw:opacity-72',
  )
  const full = [l1, l2, time].filter((s) => s !== undefined && s !== '').join(' · ')
  const trigger =
    list !== undefined ? (
      <button
        type="button"
        data-slot-id={view.slot.id}
        aria-label={submitted ? `${l1}, ${l2}, ${LIST_PROGRESS_LABEL.submitted}` : undefined}
        onClick={() => ctx.onOpenList(list.id)}
        className={cn(cls, 'tw:cursor-pointer tw:outline-none tw:focus-visible:shadow-focus tw:[font-family:inherit]')}
        style={{ height }}
      />
    ) : (
      <div data-slot-id={view.slot.id} className={cls} style={{ height }} />
    )
  return (
    <Tooltip>
      <TooltipTrigger render={trigger}>{body}</TooltipTrigger>
      <TooltipContent>{full}</TooltipContent>
    </Tooltip>
  )
}
