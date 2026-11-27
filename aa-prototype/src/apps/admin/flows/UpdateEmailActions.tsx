/**
 * Where the office drafts an update email from (catch-up Phase 35; US-02.3.3,
 * US-01.4.1 note, US-13.8.2; OQ-69, OQ-46, OQ-65, OQ-82): on demand, never
 * prompted, and nothing is ever sent.
 *
 * - `BookingUpdateEmailButton`: the Admin Booking detail's Draft update email,
 *   on every Booking (cancelled ones too). It reads saved history only, so it
 *   waits while the page has unsaved changes.
 * - `useListUpdateEmail`: the List drawers' Draft update email, offered once
 *   the List has an emailable change of anaesthetist.
 * - `NotificationEmailAction`: the pool row's draft for an anaesthetist's
 *   own move. Drafting never marks, removes or reorders the notification.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Mail } from 'lucide-react'
import { neutral } from '../../../theme/tokens'
import type { AuditEntry, Notification } from '../../../domain/types'
import type { PickableChange } from '../../../domain/updateEmail'
import { useAppStore, type Actor } from '../../../store'
import { Button, TextAction } from '../../../shared/ui'
import { useBookingDraft } from '../../../shared/booking'
import { drSurname } from '../../../shared/format'
import { UpdateEmailComposer, usePickableChanges } from './UpdateEmailComposer'

export const SAVE_FIRST_REASON = 'Save your changes first. The email uses saved changes.'
export const NOTHING_SAVED_REASON = 'No saved changes to email yet'

const MAIL_ICON = <Mail size={15} aria-hidden />

/** The Admin Booking detail's Draft update email, with its composer. */
export function BookingUpdateEmailButton({ bookingId, actor }: { bookingId: string; actor: Actor }) {
  const draft = useBookingDraft()
  const dirty = draft?.dirty === true
  const subject = useMemo(() => ({ kind: 'booking' as const, bookingId }), [bookingId])
  const rows = usePickableChanges(subject)
  const newest = rows.find((r) => r.emailable)
  const [open, setOpen] = useState(false)
  const reason = dirty ? SAVE_FIRST_REASON : newest === undefined ? NOTHING_SAVED_REASON : null

  return (
    // The reason sits beside the button, not under it, so the header's actions row keeps its height.
    <span style={{ display: 'inline-flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
      <Button
        variant="outline"
        size="compact"
        shot="booking-update-email"
        disabled={reason !== null}
        title={reason ?? undefined}
        onClick={() => setOpen(true)}
      >
        {MAIL_ICON}
        Draft update email
      </Button>
      {reason !== null && (
        <span data-shot="booking-update-email-reason" style={{ fontSize: 12, lineHeight: '16px', color: neutral.slate, textAlign: 'right', maxWidth: 200 }}>
          {reason}
        </span>
      )}
      {open && (
        <UpdateEmailComposer
          open
          onClose={() => setOpen(false)}
          actor={actor}
          subject={subject}
          initialPickedKeys={newest !== undefined ? [newest.key] : []}
        />
      )}
    </span>
  )
}

/** The newest emailable change of anaesthetist on a List, or undefined. */
function newestCover(rows: readonly PickableChange[]): PickableChange | undefined {
  return rows.find((r) => r.kind === 'cover' && r.emailable)
}

/**
 * The List drawers' Draft update email: `button` (null until the List has an
 * emailable owner change) for the footer's action row, and `composer` to
 * render beside the drawer's other sheets.
 */
export function useListUpdateEmail(listId: string, actor: Actor, buttonStyle?: CSSProperties): { button: ReactNode; composer: ReactNode } {
  const subject = useMemo(() => ({ kind: 'list' as const, listId }), [listId])
  const rows = usePickableChanges(subject)
  const cover = newestCover(rows)
  const [open, setOpen] = useState(false)
  // The Booking's control (outline, the Mail icon). In a wrapping drawer footer it fills the row it lands
  // on, so it never sits as a stray half-width button on a line of its own.
  const button =
    cover === undefined ? null : (
      <Button variant="outline" size="compact" style={{ ...buttonStyle, flex: '1 1 auto' }} shot="drawer-update-email" onClick={() => setOpen(true)}>
        {MAIL_ICON}
        Draft update email
      </Button>
    )
  const composer = open ? (
    <UpdateEmailComposer
      open
      onClose={() => setOpen(false)}
      actor={actor}
      subject={subject}
      initialPickedKeys={cover !== undefined ? [cover.key] : []}
      defaultKind="anaesthetistChange"
      defaultSendTo="hospital"
    />
  ) : null
  return { button, composer }
}

/** The picker key of the audit entry that recorded a notification's move (its `after.notificationId`). */
export function moveKeyFor(audit: readonly AuditEntry[], notificationId: string): string | undefined {
  for (let i = audit.length - 1; i >= 0; i--) {
    const e = audit[i]!
    const after = e.after as { notificationId?: unknown } | undefined
    if (after?.notificationId !== notificationId) continue
    return e.changeSetId !== undefined ? `cs:${e.changeSetId}` : `a:${e.id}`
  }
  return undefined
}

/**
 * The email a pool row offers, as a quiet "Email" text action on the Notifications feed: a List moved
 * into a colleague's session drafts the cover-change email (the hospital, the move ticked, the typed
 * message quoted for the admin); a single Booking moved drafts the update email for that Booking (the
 * surgeon's office). A List returned to the office offers none: its row opens the Draft List, and the
 * cover email is drafted from the List drawer once it is assigned. Alerts offer none.
 */
export function NotificationEmailAction({ notification, actor }: { notification: Notification; actor: Actor }) {
  if (notification.kind === 'listMoved' && notification.route === 'colleague') return <PoolDraft notification={notification} actor={actor} />
  if (notification.kind === 'bookingMoved' && notification.bookingId !== undefined) return <PoolDraft notification={notification} actor={actor} />
  return null
}

function PoolDraft({ notification, actor }: { notification: Notification; actor: Actor }) {
  const forBooking = notification.kind === 'bookingMoved' && notification.bookingId !== undefined
  const subject = useMemo(
    () => (forBooking ? { kind: 'booking' as const, bookingId: notification.bookingId! } : { kind: 'list' as const, listId: notification.listId }),
    [forBooking, notification.bookingId, notification.listId],
  )
  const audit = useAppStore((s) => s.audit)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const rows = usePickableChanges(subject)
  const [open, setOpen] = useState(false)

  // The move's own row; else the newest change of anaesthetist at or after the notice.
  const key = useMemo(() => {
    const exact = moveKeyFor(audit, notification.id)
    if (exact !== undefined && rows.some((r) => r.key === exact && r.emailable)) return exact
    return rows.find((r) => r.kind === 'cover' && r.emailable && r.atISO >= notification.atISO)?.key
  }, [audit, notification.id, notification.atISO, rows])
  if (key === undefined) return null

  const from = anaesthetists[notification.fromAnaesthetistId]?.name
  const message = notification.message?.trim()
  return (
    <>
      <TextAction
        size="sm"
        flush
        shot={forBooking ? 'pool-booking-email' : 'pool-cover-email'}
        label={forBooking ? 'Draft update email' : 'Draft cover-change email'}
        title={forBooking ? 'Draft update email' : 'Draft cover-change email'}
        onClick={() => setOpen(true)}
      >
        Email
      </TextAction>
      {open && (
        <UpdateEmailComposer
          open
          onClose={() => setOpen(false)}
          actor={actor}
          subject={subject}
          initialPickedKeys={[key]}
          defaultKind={forBooking ? 'bookingChange' : 'anaesthetistChange'}
          defaultSendTo={forBooking ? 'office' : 'hospital'}
          {...(message !== undefined && message !== '' ? { contextMessage: { from: from !== undefined ? drSurname(from) : notification.byActor, text: message } } : {})}
        />
      )}
    </>
  )
}
