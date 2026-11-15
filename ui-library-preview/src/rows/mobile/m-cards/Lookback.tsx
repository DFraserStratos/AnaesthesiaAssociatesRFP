import { useMemo, useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchField } from '../../shared/searchField'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { useAppStore, useToday } from '@proto/store'
import { useBookingWarnings, WarningTriangle } from '@proto/shared'
import { SEARCH_EMPTY, useBookingSearch } from '@proto/shared/schedule'
import { LIST_PROGRESS_LABEL } from '@proto/domain/listProgress'
import { sessionText } from '@proto/domain/outOfHours'
import { nhiBadge, shortDay } from '@proto/shared/format'
import { ProgressBadge } from './Chips'
import { Hint, Said, useMobilePersona } from './shared'

// ---------------------------------------------------------------------------
// LookbackSearchRow
// ---------------------------------------------------------------------------

/**
 * The search field on shadcn InputGroup (search icon addon, input, Clear button addon) and
 * the calendar button on Button: 48px tall, teal outline as today.
 */
export function LookbackSearchRowReplacement() {
  const [query, setQuery] = useState('')
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <SearchField className="tw:w-auto tw:min-w-0 tw:flex-1" value={query} onChange={setQuery} label="Search your Bookings" placeholder="Search patient name or NHI" />
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Go to a date"
          onClick={() => setLine('Go to a date: would open the date sheet.')}
          className="tw:border-[1.5px] tw:border-primary tw:text-primary tw:hover:bg-teal-tint tw:hover:text-primary tw:[&>svg]:size-5!"
        >
          <CalendarDays strokeWidth={2.2} aria-hidden />
        </Button>
      </div>
      <Said line={query !== '' ? `Query: "${query}"` : line} />
    </>
  )
}

// ---------------------------------------------------------------------------
// LookbackResults (ResultRow)
// ---------------------------------------------------------------------------

type ListProgress = 'toFinish' | 'readyToSubmit' | 'submitted' | 'authorised' | 'invoiced' | 'upcoming'

interface SearchRow {
  bookingId: string
  listId: string
  dateISO: string
  session: string
  scheduledTime?: string
  hospitalName?: string
  procedureNames: string[]
  patientName: string
  nhi?: string
  progress: ListProgress
}

/** A found Booking as an Item rendered as a button; its name is the row read in order, as today. */
function ResultItem({ row, onOpen }: { row: SearchRow; onOpen: () => void }) {
  const warnings = useBookingWarnings(row.bookingId)
  const subtitle = [shortDay(row.dateISO), sessionText(row.session), row.hospitalName, row.procedureNames[0]].filter(Boolean).join(' · ')
  const nhi = (nhiBadge(row.nhi) as { text: string }).text
  const progress = row.progress === 'upcoming' ? '' : (LIST_PROGRESS_LABEL[row.progress] as string)
  return (
    <div role="listitem">
      <Item
        render={<button type="button" />}
        variant="outline"
        data-booking-id={row.bookingId}
        aria-label={[row.patientName, subtitle, nhi, progress].filter(Boolean).join(', ')}
        onClick={onOpen}
        className="tw:cursor-pointer tw:flex-nowrap tw:gap-3 tw:rounded-card tw:p-3.5 tw:text-left tw:shadow-e1 tw:hover:bg-sunken"
      >
        <ItemMedia className="tw:w-[46px] tw:translate-y-0! tw:flex-col tw:items-start tw:gap-0 tw:self-center!">
          <span className="tw:text-sm tw:leading-[21px] tw:font-bold tw:text-ink">{sessionText(row.session) as string}</span>
          {row.scheduledTime !== undefined && <span className="tw:font-mono tw:text-[11px] tw:leading-[16.5px] tw:text-mist">{row.scheduledTime}</span>}
        </ItemMedia>
        <ItemContent className="tw:min-w-0 tw:gap-0.5">
          <ItemTitle className="tw:line-clamp-none tw:gap-1.5 tw:text-base tw:leading-6">
            {row.patientName}
            <WarningTriangle warnings={warnings} size="sm" />
          </ItemTitle>
          <ItemDescription className="tw:line-clamp-none tw:text-xs tw:leading-[18px]">{subtitle}</ItemDescription>
          <span className="tw:font-mono tw:text-[11.5px] tw:leading-[17.25px] tw:text-mist">{nhi}</span>
        </ItemContent>
        <ItemActions className="tw:flex-none tw:gap-1.5">
          <ProgressBadge progress={row.progress} />
          <ChevronRight size={16} strokeWidth={2.2} className="tw:text-mist" aria-hidden />
        </ItemActions>
      </Item>
    </div>
  )
}

function Group({ title, rows, onOpen }: { title: string; rows: SearchRow[]; onOpen: () => void }) {
  if (rows.length === 0) return null
  return (
    <section aria-label={`${title} Bookings`}>
      <h3 className="tw:mt-4 tw:mb-2 tw:text-[13px] tw:leading-[19.5px] tw:font-semibold tw:text-slate">{title}</h3>
      <ItemGroup className="tw:gap-2">
        {rows.map((r) => (
          <ResultItem key={r.bookingId} row={r} onOpen={onOpen} />
        ))}
      </ItemGroup>
    </section>
  )
}

export function LookbackResultsReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const todayISO = useToday() as string
  const patients = useAppStore((s: any) => s.masters.patients) as Record<string, { name: string }>
  const bookings = useAppStore((s: any) => s.schedule.bookings) as Record<string, { id: string; listId: string; patientId: string }>
  const lists = useAppStore((s: any) => s.schedule.lists) as Record<string, { anaesthetistId?: string }>
  // A surname from one of her own Bookings, so the search finds something real (as the current example).
  const query = useMemo(() => {
    const b = Object.values(bookings)
      .filter((x) => lists[x.listId]?.anaesthetistId === anaesthetistId)
      .sort((x, y) => x.id.localeCompare(y.id))[0]
    const name = b !== undefined ? patients[b.patientId]?.name : undefined
    return name?.split(/[ ,]+/).find((p) => p.length >= 3) ?? ''
  }, [bookings, lists, patients, anaesthetistId])
  const results = useBookingSearch(anaesthetistId, query, todayISO) as { upcoming: SearchRow[]; past: SearchRow[] }
  const [line, setLine] = useState<string | null>(null)
  const upcoming = results.upcoming.slice(0, 3)
  const past = results.past.slice(0, 3)
  const open = () => setLine('Would open the Booking.')
  return (
    <>
      <Hint>Results for "{query}"</Hint>
      {upcoming.length === 0 && past.length === 0 ? (
        <div className="tw:mt-5 tw:text-center tw:text-sm tw:text-mist">{SEARCH_EMPTY as string}</div>
      ) : (
        <div>
          <Group title="Upcoming" rows={upcoming} onOpen={open} />
          <Group title="Past" rows={past} onOpen={open} />
        </div>
      )}
      <Said line={line} />
    </>
  )
}
