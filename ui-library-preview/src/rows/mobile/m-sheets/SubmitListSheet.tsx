import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { completionBlockersFor, useAppStore } from '@proto/store'
import { cn } from '@/lib/utils'
import { Missing, useMobilePersona, useSeedPicks } from './shared'
import { PRESS } from './Controls'

interface BookingLite {
  id: string
  listId: string
  patientId: string
  scheduledTime?: string
  completed?: boolean
  cancellation?: unknown
}
interface Blocker {
  code: string
  message: string
  details?: unknown
}
interface BlockerRow {
  bookingId: string
  patientName: string
  time: string
  messages: string[]
}

/** The same read as SubmitListSheet's blockers mode: every not-complete, not-cancelled Booking and why. */
function useBlockerRows(listId: string, open: boolean): BlockerRow[] {
  const state = useAppStore() as any
  return useMemo(() => {
    if (!open) return []
    return (Object.values(state.schedule.bookings) as BookingLite[])
      .filter((c) => c.listId === listId && c.cancellation === undefined && !c.completed)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
      .map((booking) => {
        const blockers = completionBlockersFor(state, booking) as Blocker[]
        const messages = blockers.flatMap((b) =>
          b.code === 'validationFailed' ? (b.details as { message: string }[]).map((f) => f.message) : [b.message],
        )
        return {
          bookingId: booking.id,
          patientName: (state.masters.patients[booking.patientId]?.name as string | undefined) ?? 'Unknown patient',
          time: booking.scheduledTime ?? '·',
          messages,
        }
      })
  }, [open, state, listId])
}

/**
 * The blockers sheet on shadcn Drawer: title and the why as DrawerTitle / DrawerDescription
 * (so the sheet is named and described), one row per Booking still to finish, its failures
 * verbatim, then Close. Read only, as the current example.
 */
export function SubmitListSheetReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const [open, setOpen] = useState(false)
  const rows = useBlockerRows(picks.listId ?? '', open)
  if (picks.listId === null) return <Missing what="List" />
  return (
    <>
      <Button variant="outline" size="lg" className={PRESS} onClick={() => setOpen(true)}>
        What is left to finish?
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="tw:flex tw:flex-col tw:gap-3.5 tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            <DrawerTitle>Bookings still to finish</DrawerTitle>
            <DrawerDescription>
              Every booking must be marked complete before the list can be submitted to the office. Cancelled bookings do not count.
            </DrawerDescription>
            <ul aria-label="Bookings still to finish" className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3.5 tw:p-0">
              {rows.map((row) => (
                <li key={row.bookingId} className="tw:flex tw:flex-col tw:gap-1.5 tw:rounded-[12px] tw:border tw:border-line tw:bg-background tw:px-3.5 tw:py-3">
                  <div className="tw:flex tw:items-baseline tw:gap-2.5">
                    <span className="tw:flex-none tw:font-mono tw:text-xs tw:font-semibold tw:text-mist tw:tabular-nums">{row.time}</span>
                    <span className="tw:text-[15px] tw:font-semibold">{row.patientName}</span>
                  </div>
                  {row.messages.length > 0 ? (
                    row.messages.map((message, i) => (
                      <div key={i} className="tw:text-xs tw:leading-[17px] tw:text-error-on-tint">
                        {message}
                      </div>
                    ))
                  ) : (
                    <div className="tw:text-xs tw:leading-[17px] tw:text-slate">Ready to complete. Open the booking and tap Mark complete.</div>
                  )}
                </li>
              ))}
            </ul>
            <DrawerClose render={<Button variant="outline" size="lg" className={cn('tw:w-full', PRESS)} />}>Close</DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
