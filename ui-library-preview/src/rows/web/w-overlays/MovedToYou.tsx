import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { locationName } from '@proto/shared/format'
import { useBookingsMovedToMe, useMovableLists, useMovedToMe } from '@proto/shared/flows'
import { movedBookingToYouLine, movedToYouLine } from '@proto/shared/flows/MovedToYouPanel'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Echo, Hint, type WebFixtures } from './shared'

interface Row {
  key: string
  atISO: string
  line: string
  message?: string
  onOpen?: () => void
}

interface ListNotice {
  id: string
  atISO: string
  dateISO: string
  session: string
  hospitalId: string
  listId: string
  fromAnaesthetistId: string
  message?: string
}
interface BookingNotice {
  auditId: string
  atISO: string
  listId: string
  bookingId: string
  fromAnaesthetistId: string
  message?: string
}
interface StoreList {
  id: string
  anaesthetistId?: string
  state: string
  dateISO: string
  session: string
  hospitalId: string
}

/**
 * "Moved to you" on shadcn Alert (a neutral callout: a labelled region, not
 * role=alert, since it needs no action). Rows are the store's own notices with
 * the prototype's line helpers; a row that still opens something is a button
 * with a chevron, else plain. When nothing has been moved in the current data
 * (the seed has none), it previews two local sample notices built from her
 * real upcoming Lists and a colleague's name, so the replacement has
 * something to show; the current column renders nothing in that case.
 */
export function MovedToYouReplacement() {
  const f = useWebFixtures() as WebFixtures
  const notices = useMovedToMe(f.movedToId) as ListNotice[]
  const bookingNotices = useBookingsMovedToMe(f.movedToId) as BookingNotice[]
  const anaesthetists = useAppStore((s: { masters: { anaesthetists: Record<string, { name: string }> } }) => s.masters.anaesthetists)
  const hospitals = useAppStore((s: { masters: { hospitals: unknown } }) => s.masters.hospitals)
  const lists = useAppStore((s: { schedule: { lists: Record<string, StoreList> } }) => s.schedule.lists)
  const bookings = useAppStore((s: { schedule: { bookings: Record<string, { listId: string }> } }) => s.schedule.bookings)
  const upcoming = useMovableLists(f.anaesthetistId, 6) as StoreList[]
  const [said, setSaid] = useState<string | null>(null)
  const me = f.movedToId

  const live: Row[] = useMemo(
    () =>
      [
        ...notices.map((n) => ({
          key: n.id,
          atISO: n.atISO,
          line: movedToYouLine(n, { from: anaesthetists[n.fromAnaesthetistId]?.name, hospital: locationName(n.hospitalId, hospitals) }) as string,
          ...(n.message !== undefined ? { message: n.message } : {}),
          ...(lists[n.listId]?.anaesthetistId === me ? { onOpen: () => setSaid(`Would open List ${n.listId}`) } : {}),
        })),
        ...bookingNotices.map((m) => {
          const list = lists[m.listId]
          const where = list !== undefined && list.state !== 'DRAFT' ? { dateISO: list.dateISO, session: list.session, hospital: locationName(list.hospitalId, hospitals) } : undefined
          const stillHers = list?.anaesthetistId === me && bookings[m.bookingId]?.listId === m.listId
          return {
            key: m.auditId,
            atISO: m.atISO,
            line: movedBookingToYouLine(anaesthetists[m.fromAnaesthetistId]?.name, where) as string,
            ...(m.message !== undefined ? { message: m.message } : {}),
            ...(stillHers ? { onOpen: () => setSaid(`Would open Booking ${m.bookingId}`) } : {}),
          }
        }),
      ].sort((a, b) => b.atISO.localeCompare(a.atISO) || b.key.localeCompare(a.key)),
    [notices, bookingNotices, anaesthetists, hospitals, lists, bookings, me],
  )

  // The local preview: two of her real upcoming Lists, "moved" by the first colleague by id.
  const sample: Row[] = useMemo(() => {
    if (live.length > 0) return []
    const colleagueId = Object.keys(anaesthetists).sort().find((id) => id !== f.anaesthetistId)
    const from = colleagueId !== undefined ? anaesthetists[colleagueId]?.name : undefined
    return upcoming.slice(0, 2).map((l, i) => ({
      key: `sample-${l.id}`,
      atISO: `${f.todayISO}T${i === 0 ? '08:10' : '07:45'}:00`,
      line: movedToYouLine({ dateISO: l.dateISO, session: l.session }, { from, hospital: locationName(l.hospitalId, hospitals) }) as string,
      ...(i === 0 ? { message: 'Can you take this one? I am at a conference.' } : {}),
      onOpen: () => setSaid(`Would open List ${l.id}`),
    }))
  }, [live.length, anaesthetists, f.anaesthetistId, f.todayISO, upcoming, hospitals])

  const rows = live.length > 0 ? live : sample
  if (rows.length === 0) return <Hint>Nothing has been moved to anyone, and she has no upcoming Lists to preview with.</Hint>

  return (
    <>
      <Alert role="region" aria-label="Moved to you" className="tw:flex tw:flex-col tw:gap-2 tw:rounded-card tw:px-3.5 tw:py-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span aria-hidden className="tw:flex tw:size-7 tw:flex-none tw:items-center tw:justify-center tw:rounded-pill tw:bg-sunken tw:text-slate">
            <ArrowRightLeft className="tw:size-3.5" strokeWidth={2.4} />
          </span>
          <AlertTitle className="tw:text-[15px] tw:leading-5">Moved to you</AlertTitle>
        </div>
        <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
          {rows.map((r) => (
            <li key={r.key}>
              <NoticeRow row={r} />
            </li>
          ))}
        </ul>
      </Alert>
      <Echo>{said}</Echo>
      {live.length === 0 && <Hint>Nothing has been moved in the current data: these two notices are a local preview built from her own upcoming Lists.</Hint>}
    </>
  )
}

function NoticeRow({ row }: { row: Row }) {
  const body = (
    <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
      <span className="tw:text-[13.5px] tw:leading-[19px] tw:text-ink">{row.line}</span>
      {row.message !== undefined && <span className="tw:text-[12.5px] tw:leading-[18px] tw:text-slate">"{row.message}"</span>}
      <span className="tw:text-xs tw:text-mist">{format(parseISO(row.atISO), 'EEE d MMM, HH:mm')}</span>
    </span>
  )
  const box = 'tw:flex tw:w-full tw:items-center tw:gap-2 tw:rounded-ctl tw:bg-background tw:px-2.5 tw:py-2 tw:text-left'
  return row.onOpen !== undefined ? (
    <button type="button" onClick={row.onOpen} className={`${box} tw:cursor-pointer tw:border-0 tw:outline-none tw:hover:bg-sunken tw:focus-visible:shadow-focus`}>
      {body}
      <ChevronRight aria-hidden className="tw:size-4 tw:flex-none tw:text-mist" strokeWidth={2.2} />
    </button>
  ) : (
    <div className={box}>{body}</div>
  )
}
