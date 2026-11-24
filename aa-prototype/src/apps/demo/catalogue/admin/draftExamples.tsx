/**
 * Catalogue examples for the Admin Booking draft (catch-up Phase 35): the save
 * bar and saved strip, another office user's saved notice, the as-at view and
 * the leave dialog. Demo only.
 */

import { useMemo, useState } from 'react'
import type { Blocker } from 'react-router-dom'
import { Button } from '../../../../shared'
import { LeaveWithoutSavingDialog } from '../../../../shared/booking'
import { BookingAsAtPanel } from '../../../../shared/booking/BookingAsAtPanel'
import { OfficeSavedNotice } from '../../../../shared/booking/OfficeSavedNotice'
import { SEED_MARKERS } from '../../../../domain/seed'
import type { FieldChange } from '../../../../domain/changeSets'
import { OFFICE_ACTOR, saveBookingPatch, SECOND_OFFICE_ACTOR, useAppStore, type ChangeSetSummary } from '../../../../store'
import { BookingSaveBar, BookingSavedStrip } from '../../../admin/components/BookingSaveBar'

const BOOKING = SEED_MARKERS.pendingCaptureBooking?.entityId ?? ''

/** The unsaved bar (three drafted changes) and the saved strip, with sample changes; Save and Discard write nothing here. */
export function BookingSaveBarExample() {
  const procedures = useAppStore((s) => s.schedule.procedures)
  const own = useMemo(() => Object.values(procedures).filter((p) => p.bookingId === BOOKING), [procedures])
  const first = own[0]?.id ?? 'P'
  const changes: FieldChange[] = [
    { entityType: 'booking', entityId: BOOKING, field: 'notes', before: undefined, after: 'Rooms called', kind: 'update' },
    { entityType: 'booking', entityId: BOOKING, field: 'scheduledTime', before: '09:00', after: '09:30', kind: 'update' },
    { entityType: 'procedure', entityId: first, field: 'governingContractId', before: undefined, after: 'CT', kind: 'update' },
  ]
  const summary: ChangeSetSummary = {
    changeSetId: 'CS0042',
    kind: 'save',
    who: OFFICE_ACTOR.who,
    atISO: '2026-11-24T09:14:00',
    count: changes.length,
    fields: changes.map((c) => ({ entityType: c.entityType, entityId: c.entityId, field: c.field })),
    index: 0,
  }
  const [dismissed, setDismissed] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <BookingSaveBar changes={changes} procedures={own} onSave={() => 'Sample only: nothing is saved here.'} onDiscard={() => {}} />
      {dismissed ? (
        <Button variant="secondary" size="compact" onClick={() => setDismissed(false)}>Show the saved strip</Button>
      ) : (
        <BookingSavedStrip summary={summary} procedures={own} onDismiss={() => setDismissed(true)} />
      )}
    </div>
  )
}

/** Another office user's save landing while the Booking is open. The button saves a note as Sam T. in the demo store. */
export function OfficeSavedNoticeExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <OfficeSavedNotice bookingId={BOOKING} actor={OFFICE_ACTOR} onViewHistory={() => {}} />
      <Button variant="secondary" size="compact" onClick={() => saveBookingPatch(useAppStore, SECOND_OFFICE_ACTOR, BOOKING, { booking: { notes: 'Sam T. called the rooms' } })}>
        Save a note as Sam T.
      </Button>
    </div>
  )
}

/** The Booking as at its newest audit entry (read-only). */
export function BookingAsAtPanelExample() {
  const audit = useAppStore((s) => s.audit)
  const entryId = useMemo(() => [...audit].reverse().find((e) => e.entityId === BOOKING)?.id, [audit])
  const [open, setOpen] = useState(true)
  if (entryId === undefined) return null
  return open ? <BookingAsAtPanel bookingId={BOOKING} entryId={entryId} onClose={() => setOpen(false)} /> : <Button variant="secondary" size="compact" onClick={() => setOpen(true)}>View as at</Button>
}

/** "Leave without saving?" on a stand-in blocker (the real one comes from the data router). */
export function LeaveWithoutSavingDialogExample() {
  const [open, setOpen] = useState(false)
  const blocker: Blocker = open
    ? { state: 'blocked', reset: () => setOpen(false), proceed: () => setOpen(false), location: { pathname: '/admin', search: '', hash: '', state: null, key: 'demo' } }
    : { state: 'unblocked', reset: undefined, proceed: undefined, location: undefined }
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>Try to leave</Button>
      <LeaveWithoutSavingDialog blocker={blocker} count={3} onDiscard={() => {}} />
    </div>
  )
}
