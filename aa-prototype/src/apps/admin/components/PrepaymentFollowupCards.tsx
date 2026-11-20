/**
 * The Admin Booking detail's prepayment follow-up (catch-up Phase 41;
 * US-06.5.3, US-06.5.4): the moved prepaid Booking's card with the optional
 * patient email, the office's "Rebook with another anaesthetist" on a cancelled
 * prepaid Booking, and the prepayment history across a rebook. The pieces are
 * shared (`shared/booking`); this places them and passes the office-private
 * not-preferred warning in.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/ui'
import { PrepaymentMovedCard } from '../../../shared/booking/PrepaymentMovedCard'
import { PrepaymentHistory } from '../../../shared/booking/PrepaymentHistory'
import { RebookDialog } from '../../../shared/booking/RebookDialog'
import { useAppStore, type Actor } from '../../../store'
import { prePaymentInvoicesForBooking } from '../../../store/selectors'
import { rebookedBookingOf } from '../../../store/rebookActions'
import { selectPairingPreferences } from '../../../store/officePrivate'
import { notPreferredWarning } from '../../../domain/pairingPreferences'

export const REBOOK_LABEL = 'Rebook with another anaesthetist'

export function PrepaymentFollowupCards({ bookingId, actor }: { bookingId: string; actor: Actor }) {
  const navigate = useNavigate()
  const [rebooking, setRebooking] = useState(false)
  const booking = useAppStore((s) => s.schedule.bookings[bookingId])
  const hadPrepayment = useAppStore((s) => prePaymentInvoicesForBooking(s, bookingId).length > 0)
  const rebooked = useAppStore((s) => rebookedBookingOf(s, bookingId))
  const masters = useAppStore((s) => s.masters)
  const entries = useAppStore(selectPairingPreferences)
  if (booking === undefined) return null
  const office = actor.role === 'office'
  const canRebook = office && booking.cancellation !== undefined && hadPrepayment && rebooked === undefined

  return (
    <>
      <PrepaymentMovedCard bookingId={bookingId} actor={actor} />
      {canRebook && (
        <div data-shot="rebook-open-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="secondary" size="compact" shot="rebook-open" onClick={() => setRebooking(true)}>
            {REBOOK_LABEL}
          </Button>
        </div>
      )}
      <PrepaymentHistory bookingId={bookingId} />
      {rebooking && (
        <RebookDialog
          bookingId={bookingId}
          actor={actor}
          onClose={() => setRebooking(false)}
          notPreferredMessageFor={(a, s) => notPreferredWarning({ anaesthetists: masters.anaesthetists, surgeons: masters.surgeons }, entries, a, s)?.message ?? null}
          onRebooked={(newId) => {
            setRebooking(false)
            const s = useAppStore.getState()
            const list = s.schedule.lists[s.schedule.bookings[newId]?.listId ?? '']
            if (list !== undefined) navigate(`/admin/day/${list.dateISO}/bookings/${newId}`)
          }}
        />
      )}
    </>
  )
}
