import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowRightLeft, ChevronRight, CircleDollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { outstandingAccpayInvoicesFor, receivablesAgingFor, useAppStore, useToday } from '@proto/store'
import { formatCurrency, locationName } from '@proto/shared/format'
import { TickBadge } from '@proto/shared/ui'
import { movedToYouLine, useBookingsMovedToMe, useMovedToMe } from '@proto/shared/flows'
import { movedBookingToYouLine } from '@proto/shared/flows/MovedToYouPanel'
import { Col, Hint, Missing, Row, Said, useMobilePersona, useSeedPicks } from './shared'

// ---------------------------------------------------------------------------
// Hero figure card
// ---------------------------------------------------------------------------

/** Outstanding to you on a shadcn Card: the persona's real receivables, static figure. */
export function HeroFigureCardReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const billing = useAppStore((s: any) => s.billing)
  const schedule = useAppStore((s: any) => s.schedule)
  const masters = useAppStore((s: any) => s.masters)
  const todayISO = useToday() as string
  const outstanding = useMemo(
    () => outstandingAccpayInvoicesFor({ billing, schedule, masters }, anaesthetistId, todayISO) as unknown[],
    [billing, schedule, masters, anaesthetistId, todayISO],
  )
  const total = useMemo(
    () => (receivablesAgingFor({ billing, schedule, masters }, anaesthetistId, todayISO) as { aging: { total: number } }).aging.total,
    [billing, schedule, masters, anaesthetistId, todayISO],
  )
  return (
    <Card className="tw:flex-row tw:items-center tw:gap-3.5 tw:rounded-panel! tw:px-5 tw:py-[18px] tw:shadow-none">
      <span aria-hidden className="tw:flex tw:size-11 tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-sunken tw:text-slate">
        <CircleDollarSign size={22} strokeWidth={2} />
      </span>
      <div className="tw:flex tw:flex-col">
        <span className="tw:text-xs tw:leading-[18px] tw:text-slate">Outstanding to you</span>
        <span className="tw:font-mono tw:text-2xl tw:leading-9 tw:font-bold tw:tabular-nums">{formatCurrency(total) as string}</span>
        <span className="tw:text-xs tw:leading-[18px] tw:text-mist">
          {outstanding.length} unpaid invoice{outstanding.length === 1 ? '' : 's'}
        </span>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// EmptyCard
// ---------------------------------------------------------------------------

/** The muted "nothing yet" card on shadcn Empty: solid line border and surface as today, no icon or title. */
export function EmptyCardReplacement() {
  return (
    <Empty className="tw:flex-none tw:gap-0 tw:rounded-[16px] tw:border tw:border-solid tw:border-line tw:bg-surface tw:p-5">
      <EmptyDescription className="tw:text-[13.5px] tw:leading-[20.25px] tw:text-wrap tw:text-mist">
        No outstanding invoices. A List's invoices show here once the office authorises it.
      </EmptyDescription>
    </Empty>
  )
}

// ---------------------------------------------------------------------------
// MovedToYouPanel
// ---------------------------------------------------------------------------

interface NoticeRow {
  key: string
  atISO: string
  line: string
  message?: string
  onOpen?: () => void
}

interface ListLike {
  id: string
  dateISO: string
  session: string
  hospitalId: string
  anaesthetistId?: string
  state: string
}

/** One notice as an Item: a button when it opens something, a plain row otherwise. Neutral throughout. */
function Notice({ row }: { row: NoticeRow }) {
  const body = (
    <ItemContent className="tw:min-w-0 tw:gap-0.5">
      <ItemTitle className="tw:line-clamp-none tw:w-auto tw:text-[13.5px] tw:leading-[19px] tw:font-normal">{row.line}</ItemTitle>
      {row.message !== undefined && <ItemDescription className="tw:text-[12.5px] tw:leading-[18px]">"{row.message}"</ItemDescription>}
      <span className="tw:text-xs tw:leading-4 tw:text-mist">{format(parseISO(row.atISO), 'EEE d MMM, HH:mm')}</span>
    </ItemContent>
  )
  const cls = 'tw:flex-nowrap tw:gap-2 tw:border-0 tw:bg-background tw:px-2.5 tw:py-2 tw:text-left'
  return (
    <div role="listitem">
      {row.onOpen !== undefined ? (
        <Item render={<button type="button" />} onClick={row.onOpen} className={`${cls} tw:cursor-pointer tw:hover:bg-sunken`}>
          {body}
          <ItemActions>
            <ChevronRight size={16} strokeWidth={2.2} className="tw:text-mist" aria-hidden />
          </ItemActions>
        </Item>
      ) : (
        <Item className={cls}>{body}</Item>
      )}
    </div>
  )
}

/** Sample notices built from her own Lists and a real colleague, for when nothing was moved to her. Local only. */
function useSampleRows(anaesthetistId: string, onOpenList: () => void, onOpenBooking: () => void): NoticeRow[] {
  const picks = useSeedPicks(anaesthetistId)
  const lists = useAppStore((s: any) => s.schedule.lists) as Record<string, ListLike>
  const anaesthetists = useAppStore((s: any) => s.masters.anaesthetists) as Record<string, { name: string }>
  const hospitals = useAppStore((s: any) => s.masters.hospitals)
  const todayISO = useToday() as string
  return useMemo(() => {
    const own = picks.ownListIds.map((id) => lists[id]).filter((l): l is ListLike => l !== undefined && l.dateISO >= todayISO)
    const colleague = Object.entries(anaesthetists)
      .filter(([id]) => id !== anaesthetistId)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, a]) => ({ id, name: a.name }))[0]
    const [first, second] = own
    const rows: NoticeRow[] = []
    if (first !== undefined) {
      const n = { id: 'sample-1', atISO: `${todayISO}T09:12:00`, dateISO: first.dateISO, session: first.session, hospitalId: first.hospitalId, listId: first.id, fromAnaesthetistId: colleague?.id ?? '' }
      rows.push({
        key: n.id,
        atISO: n.atISO,
        line: movedToYouLine(n, { from: colleague?.name, hospital: locationName(first.hospitalId, hospitals) }) as string,
        message: 'Thanks for taking this one.',
        onOpen: onOpenList,
      })
    }
    if (second !== undefined) {
      rows.push({
        key: 'sample-2',
        atISO: `${todayISO}T08:40:00`,
        line: movedBookingToYouLine(colleague?.name, { dateISO: second.dateISO, session: second.session, hospital: locationName(second.hospitalId, hospitals) }) as string,
        onOpen: onOpenBooking,
      })
    }
    return rows
  }, [picks.ownListIds, lists, anaesthetists, hospitals, anaesthetistId, todayISO, onOpenList, onOpenBooking])
}

/** The panel on a shadcn Card with an Item list; reads the same store hooks, never writes. */
export function MovedToYouPanelReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const notices = useMovedToMe(anaesthetistId) as { id: string; atISO: string; listId: string; fromAnaesthetistId: string; hospitalId: string; message?: string }[]
  const bookingNotices = useBookingsMovedToMe(anaesthetistId) as { auditId: string; atISO: string; listId: string; bookingId: string; fromAnaesthetistId: string; message?: string }[]
  const anaesthetists = useAppStore((s: any) => s.masters.anaesthetists)
  const hospitals = useAppStore((s: any) => s.masters.hospitals)
  const lists = useAppStore((s: any) => s.schedule.lists) as Record<string, ListLike>
  const [line, setLine] = useState<string | null>(null)
  const [sample, setSample] = useState(false)
  const openList = useMemo(() => () => setLine('Would open the List.'), [])
  const openBooking = useMemo(() => () => setLine('Would open the Booking.'), [])
  const sampleRows = useSampleRows(anaesthetistId, openList, openBooking)

  const realRows: NoticeRow[] = [
    ...notices.map((n) => ({
      key: n.id,
      atISO: n.atISO,
      line: movedToYouLine(n, { from: anaesthetists[n.fromAnaesthetistId]?.name, hospital: locationName(n.hospitalId, hospitals) }) as string,
      ...(n.message !== undefined ? { message: n.message } : {}),
      ...(lists[n.listId]?.anaesthetistId === anaesthetistId ? { onOpen: openList } : {}),
    })),
    ...bookingNotices.map((m) => {
      const list = lists[m.listId]
      const where = list !== undefined && list.state !== 'DRAFT' ? { dateISO: list.dateISO, session: list.session, hospital: locationName(list.hospitalId, hospitals) } : undefined
      return {
        key: m.auditId,
        atISO: m.atISO,
        line: movedBookingToYouLine(anaesthetists[m.fromAnaesthetistId]?.name, where) as string,
        ...(m.message !== undefined ? { message: m.message } : {}),
        ...(list?.anaesthetistId === anaesthetistId ? { onOpen: openBooking } : {}),
      }
    }),
  ].sort((a, b) => b.atISO.localeCompare(a.atISO) || b.key.localeCompare(a.key))

  const rows = realRows.length > 0 ? realRows : sample ? sampleRows : []
  return (
    <>
      {rows.length > 0 && (
        <Card role="region" aria-label="Moved to you" className="tw:gap-2 tw:py-3 tw:shadow-none tw:[--card-spacing:--spacing(3.5)]">
          <CardHeader className="tw:flex tw:items-center tw:gap-2">
            <span aria-hidden className="tw:flex tw:size-7 tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-sunken tw:text-slate">
              <ArrowRightLeft size={14} strokeWidth={2.4} />
            </span>
            <CardTitle className="tw:text-[15px] tw:leading-[22px]">Moved to you</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGroup className="tw:gap-2">
              {rows.map((r) => (
                <Notice key={r.key} row={r} />
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
      {realRows.length === 0 && (
        <Col className={rows.length > 0 ? 'tw:mt-2.5' : undefined}>
          {!sample && <Hint>Nothing has been moved to this persona in the last week, so the panel renders nothing. Move a List to her from another persona to see it.</Hint>}
          <div>
            <Button variant="pill" onClick={() => setSample((s) => !s)}>
              {sample ? 'Hide the sample' : 'Show a sample (local only)'}
            </Button>
          </div>
        </Col>
      )}
      <Said line={line} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Booking card (Capture pill)
// ---------------------------------------------------------------------------

type CardState = 'capture' | 'done' | 'cancelled'
const NEXT: Record<CardState, CardState> = { capture: 'done', done: 'cancelled', cancelled: 'capture' }
const STATE_WORD: Record<CardState, string> = { capture: 'Capture', done: 'Complete', cancelled: 'Cancelled' }

interface BookingRow {
  id: string
  time: string
  patientName: string
  nhi?: string
  operation: string
}

/** The seeded List's first three Bookings, read the same way as the current example. */
function useBookingRows(): BookingRow[] {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const bookings = useAppStore((s: any) => s.schedule.bookings) as Record<string, { id: string; listId: string; scheduledTime?: string; patientId: string }>
  const procedures = useAppStore((s: any) => s.schedule.procedures) as Record<string, { id: string; bookingId: string; description: string }>
  const patients = useAppStore((s: any) => s.masters.patients) as Record<string, { name: string; nhi?: string }>
  return useMemo(() => {
    if (picks.listId === null) return []
    return Object.values(bookings)
      .filter((b) => b.listId === picks.listId)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((b) => {
        const proc = Object.values(procedures)
          .filter((p) => p.bookingId === b.id)
          .sort((x, y) => x.id.localeCompare(y.id))[0]
        const patient = patients[b.patientId]
        return { id: b.id, time: b.scheduledTime ?? '·', patientName: patient?.name ?? 'Unknown patient', nhi: patient?.nhi, operation: proc?.description || 'Procedure to capture' }
      })
  }, [picks.listId, bookings, procedures, patients])
}

/**
 * A Booking as a shadcn Item rendered as a button, ending in a Badge (Capture), the done tick
 * (TickBadge stays custom) or Cancelled. `label` composes a short accessible name instead of
 * letting the button read all its text run together.
 */
function BookingItem({ row, state, label, onClick }: { row: BookingRow; state: CardState; label: boolean; onClick: () => void }) {
  const cancelled = state === 'cancelled'
  const name = [row.patientName, row.time, row.nhi, row.operation, STATE_WORD[state]].filter(Boolean).join(', ')
  return (
    <Item
      render={<button type="button" />}
      variant="outline"
      onClick={onClick}
      aria-label={label ? name : undefined}
      className={`tw:cursor-pointer tw:flex-nowrap tw:gap-3 tw:rounded-card tw:px-4 tw:py-3.5 tw:text-left tw:hover:bg-sunken ${cancelled ? 'tw:opacity-60' : ''}`}
    >
      <ItemMedia className="tw:w-11 tw:self-center! tw:translate-y-0! tw:justify-start tw:font-mono tw:text-xs tw:font-semibold tw:text-mist">{row.time}</ItemMedia>
      <ItemContent className="tw:min-w-0 tw:gap-0.5">
        <ItemTitle className={`tw:text-base tw:leading-6 ${cancelled ? 'tw:line-through' : ''}`}>{row.patientName}</ItemTitle>
        {row.nhi !== undefined && <span className="tw:font-mono tw:text-[11px] tw:leading-4 tw:text-mist">{row.nhi}</span>}
        <ItemDescription className="tw:line-clamp-none tw:text-[13px] tw:leading-5">{row.operation}</ItemDescription>
      </ItemContent>
      <ItemActions className="tw:flex-none">
        {cancelled ? (
          <span className="tw:text-[11px] tw:font-semibold tw:text-error-on-tint">Cancelled</span>
        ) : state === 'done' ? (
          <TickBadge size={28} animate />
        ) : (
          <Badge className="tw:bg-teal-tint tw:px-4 tw:py-[9px] tw:text-[13px] tw:leading-[18px] tw:text-teal-pressed">Capture</Badge>
        )}
      </ItemActions>
    </Item>
  )
}

export function BookingCardReplacement({ label = false }: { label?: boolean }) {
  const rows = useBookingRows()
  const [states, setStates] = useState<Record<string, CardState>>({})
  if (rows.length === 0) return <Missing what="Bookings" />
  return (
    <ItemGroup className="tw:gap-2.5">
      {rows.map((r) => {
        const state = states[r.id] ?? 'capture'
        return (
          <div role="listitem" key={r.id}>
            <BookingItem row={r} state={state} label={label} onClick={() => setStates((s) => ({ ...s, [r.id]: NEXT[state] }))} />
          </div>
        )
      })}
    </ItemGroup>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

const SUCCESS_BAR = 'tw:[&_[data-slot=progress-indicator]]:bg-success tw:[&_[data-slot=progress-track]]:bg-line'

/**
 * The List's "n of m complete" on shadcn Progress (Base UI Progress: role=progressbar,
 * aria-valuenow / max, named by its label). `inline` keeps today's label-beside-bar line;
 * otherwise the shadcn layout puts the label above and the count at the right.
 */
export function ProgressBarReplacement({ inline = true }: { inline?: boolean }) {
  const [done, setDone] = useState(2)
  const total = 5
  const text = `${done} of ${total} complete`
  return (
    <Col>
      {inline ? (
        <Progress
          value={done}
          max={total}
          getAriaValueText={() => text}
          className={`tw:mt-3.5 tw:mb-1 tw:flex-nowrap tw:items-center tw:gap-2.5 ${SUCCESS_BAR} tw:[&_[data-slot=progress-track]]:flex-1`}
        >
          <ProgressLabel className="tw:flex-none tw:text-xs tw:leading-4 tw:text-slate">{text}</ProgressLabel>
        </Progress>
      ) : (
        <Progress value={done} max={total} getAriaValueText={() => text} className={`tw:mt-3.5 tw:mb-1 tw:gap-2 ${SUCCESS_BAR}`}>
          <ProgressLabel className="tw:text-xs tw:leading-4 tw:text-slate">Bookings complete</ProgressLabel>
          <ProgressValue className="tw:text-xs">{() => `${done} of ${total}`}</ProgressValue>
        </Progress>
      )}
      <Row>
        <Button variant="pill" onClick={() => setDone((d) => Math.max(0, d - 1))}>
          One fewer
        </Button>
        <Button variant="pill" onClick={() => setDone((d) => Math.min(total, d + 1))}>
          One more
        </Button>
      </Row>
    </Col>
  )
}
