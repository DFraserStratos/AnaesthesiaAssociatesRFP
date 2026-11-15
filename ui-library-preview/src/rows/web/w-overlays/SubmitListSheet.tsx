import { useMemo, useState } from 'react'
import { completionBlockersFor, useAppStore } from '@proto/store'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Echo, Missing, useReturnFocus, type WebFixtures } from './shared'

interface BlockerRow {
  bookingId: string
  patientName: string
  time: string
  messages: string[]
}

interface StoreBooking {
  id: string
  listId: string
  patientId: string
  scheduledTime?: string
  completed?: boolean
  cancellation?: unknown
}

/** The same rows as SubmitListSheet's blockers mode, read once from the store when the dialog opens. */
function blockerRows(listId: string): BlockerRow[] {
  const state = useAppStore.getState()
  return (Object.values(state.schedule.bookings) as StoreBooking[])
    .filter((c) => c.listId === listId && c.cancellation === undefined && c.completed !== true)
    .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    .map((booking) => {
      const blockers = completionBlockersFor(state, booking) as { code: string; message: string; details?: unknown }[]
      const messages = blockers.flatMap((b) =>
        b.code === 'validationFailed' ? (b.details as { message: string }[]).map((x) => x.message) : [b.message],
      )
      return {
        bookingId: booking.id,
        patientName: state.masters.patients[booking.patientId]?.name ?? 'Unknown patient',
        time: booking.scheduledTime ?? '·',
        messages,
      }
    })
}

/**
 * The submit flow on library dialogs: blockers mode is a shadcn Dialog listing
 * each Booking still to finish and why; confirm mode is an AlertDialog (no
 * scrim dismiss, focus starts on Not yet). Submitting is local here: nothing
 * changes the List.
 */
export function SubmitListSheetReplacement() {
  const f = useWebFixtures() as WebFixtures
  const [mode, setMode] = useState<'blockers' | 'confirm' | null>(null)
  const [said, setSaid] = useState<string | null>(null)
  const { finalFocus, remember } = useReturnFocus()
  const listId = f.detailListId
  const rows = useMemo(() => (mode === 'blockers' && listId !== undefined ? blockerRows(listId) : []), [mode, listId])
  if (listId === undefined) return <Missing what="active List" />

  return (
    <>
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        <Button variant="outline" onClick={(e) => {
            remember(e)
            setMode('blockers')
          }}>
          Open Bookings still to finish
        </Button>
        <Button variant="outline" onClick={(e) => {
            remember(e)
            setMode('confirm')
          }}>
          Open the submit confirm
        </Button>
      </div>
      <Echo>{said}</Echo>

      <Dialog open={mode === 'blockers'} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent showCloseButton={false} finalFocus={finalFocus}>
          <DialogHeader className="tw:gap-3.5">
            <DialogTitle className="tw:pr-0">Bookings still to finish</DialogTitle>
            <DialogDescription>
              Every booking must be marked complete before the list can be submitted to the office. Cancelled bookings do not count.
            </DialogDescription>
          </DialogHeader>
          <ul aria-label="Bookings still to finish" className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-3.5 tw:p-0">
            {rows.map((row) => (
              <li key={row.bookingId} className="tw:flex tw:flex-col tw:gap-1.5 tw:rounded-[12px] tw:border tw:border-line tw:bg-background tw:px-3.5 tw:py-3">
                <div className="tw:flex tw:items-baseline tw:gap-2.5">
                  <span className="tw:flex-none tw:font-mono tw:text-xs tw:font-semibold tw:text-mist tw:tabular-nums">{row.time}</span>
                  <span className="tw:text-[15px] tw:font-semibold">{row.patientName}</span>
                </div>
                {row.messages.length > 0 ? (
                  row.messages.map((m, i) => (
                    <div key={i} className="tw:text-xs tw:leading-[17px] tw:text-error-on-tint">
                      {m}
                    </div>
                  ))
                ) : (
                  <div className="tw:text-xs tw:leading-[17px] tw:text-slate">Ready to complete. Open the booking and tap Mark complete.</div>
                )}
              </li>
            ))}
          </ul>
          <DialogClose render={<Button variant="outline" size="lg" className="tw:w-full" />}>Close</DialogClose>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mode === 'confirm'} onOpenChange={(o) => !o && setMode(null)}>
        <AlertDialogContent finalFocus={finalFocus} className="tw:data-[size=default]:max-w-[min(520px,calc(100%-48px))]">
          <AlertDialogHeader className="tw:gap-3.5">
            <AlertDialogTitle>Submit this list to the office?</AlertDialogTitle>
            <AlertDialogDescription className="tw:text-sm tw:leading-[21px] tw:text-balance">
              Submitting tells the office this list is ready for review and billing. You can still change these bookings until the office authorises the list; the office sees any change at review.
            </AlertDialogDescription>
            <p className="tw:m-0 tw:text-sm tw:leading-[21px] tw:text-ink">
              Submitting says you did every procedure on this List. If a colleague is doing one, move it to them first.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="tw:mt-0 tw:flex-col! tw:gap-2.5">
            <Button
              size="cta"
              className="tw:w-full"
              onClick={() => {
                setMode(null)
                setSaid('Would submit the List to the office (local only, nothing changed).')
              }}
            >
              Submit to office
            </Button>
            <AlertDialogCancel autoFocus size="lg" className="tw:w-full">
              Not yet
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
