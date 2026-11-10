import { format, parseISO } from 'date-fns'
import { ArrowRightLeft, ChevronRight } from 'lucide-react'
import { neutral, radius } from '../../theme/tokens'
import { useAppStore } from '../../store'
import type { Notification } from '../../domain/types'
import { drSurname, locationName } from '../format'
import { useBookingsMovedToMe, useMovedToMe } from './useListMoves'

/** The mover as the apps name them ("Dr Hughes"), or a plain fallback when the record is gone. */
function moverName(fromName: string | undefined): string {
  return fromName !== undefined ? drSurname(fromName) : 'A colleague'
}

/** "Dr Hughes moved Thu 23 Jul AM, St George's, to you." from the pool's record (a snapshot). */
export function movedToYouLine(n: Notification, names: { from: string | undefined; hospital: string }): string {
  return `${moverName(names.from)} moved ${format(parseISO(n.dateISO), 'EEE d MMM')} ${n.session}, ${names.hospital}, to you.`
}

/** "Dr Souter moved a Booking to you: Wed 22 Jul AM, Christchurch Eye Surgery" (a single Booking, Phase 32a), from the move's audit event. */
export function movedBookingToYouLine(fromName: string | undefined, where: { dateISO: string; session: string; hospital: string } | undefined): string {
  const tail = where !== undefined ? `: ${format(parseISO(where.dateISO), 'EEE d MMM')} ${where.session}, ${where.hospital}` : ''
  return `${moverName(fromName)} moved a Booking to you${tail}`
}

/** List detail's line: "Moved to you by Dr Hughes on Tue 21 Jul" (a List, or a single Booking, Phase 32a). */
export function movedToYouByLine(atISO: string, fromName: string | undefined): string {
  return `Moved to you by ${moverName(fromName)} on ${format(parseISO(atISO), 'EEE d MMM')}`
}

/**
 * The receiving colleague's notice (catch-up Phase 32; US-01.4.3 AC2): Lists a
 * colleague moved to her in the last week, read from the shared pool's
 * records, neutral (it needs no action), with any message typed. It says
 * nothing about pairing preferences (US-01.4.5 "Nothing revealed"). Shown at
 * the top of Find cover on mobile and web while there is something to show.
 */
export function MovedToYouPanel({
  anaesthetistId,
  onOpenList,
  onOpenBooking,
}: {
  anaesthetistId: string
  onOpenList?: (listId: string) => void
  /** A single Booking a colleague handed her (Phase 32a): open it on its new List. */
  onOpenBooking?: (listId: string, bookingId: string) => void
}) {
  const notices = useMovedToMe(anaesthetistId)
  const bookingNotices = useBookingsMovedToMe(anaesthetistId)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const lists = useAppStore((s) => s.schedule.lists)
  const bookings = useAppStore((s) => s.schedule.bookings)
  if (notices.length === 0 && bookingNotices.length === 0) return null
  // One list, newest first, whichever kind: a List a colleague moved to her, or a single Booking (Phase 32a).
  const rows: Row[] = [
    ...notices.map((n) => ({
      key: n.id,
      shot: 'moved-to-you-row',
      atISO: n.atISO,
      line: movedToYouLine(n, { from: anaesthetists[n.fromAnaesthetistId]?.name, hospital: locationName(n.hospitalId, hospitals) }),
      ...(n.message !== undefined ? { message: n.message } : {}),
      ...(onOpenList !== undefined && lists[n.listId]?.anaesthetistId === anaesthetistId ? { onOpen: () => onOpenList(n.listId) } : {}),
    })),
    ...bookingNotices.map((m) => {
      const list = lists[m.listId]
      const where = list !== undefined && list.state !== 'DRAFT' ? { dateISO: list.dateISO, session: list.session, hospital: locationName(list.hospitalId, hospitals) } : undefined
      const stillHers = list?.anaesthetistId === anaesthetistId && bookings[m.bookingId]?.listId === m.listId
      return {
        key: m.auditId,
        shot: 'moved-to-you-booking-row',
        atISO: m.atISO,
        line: movedBookingToYouLine(anaesthetists[m.fromAnaesthetistId]?.name, where),
        ...(m.message !== undefined ? { message: m.message } : {}),
        ...(onOpenBooking !== undefined && stillHers ? { onOpen: () => onOpenBooking(m.listId, m.bookingId) } : {}),
      }
    }),
  ].sort((a, b) => b.atISO.localeCompare(a.atISO) || b.key.localeCompare(a.key))
  return (
    <section
      data-shot="moved-to-you"
      aria-label="Moved to you"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{ width: 28, height: 28, borderRadius: 999, background: neutral.sunken, color: neutral.slate, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <ArrowRightLeft size={14} strokeWidth={2.4} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>Moved to you</span>
      </div>
      {rows.map((r) => (
        <NoticeRow key={r.key} row={r} />
      ))}
    </section>
  )
}

interface Row {
  key: string
  shot: string
  atISO: string
  line: string
  message?: string
  /** Present while the List or Booking is still hers: the row opens it. */
  onOpen?: () => void
}

/** One notice: a button when it opens something, a plain row otherwise. Neutral; it needs no action. */
function NoticeRow({ row }: { row: Row }) {
  const body = (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 13.5, lineHeight: '19px', color: neutral.ink }}>{row.line}</span>
      {row.message !== undefined && <span style={{ fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>"{row.message}"</span>}
      <span style={{ fontSize: 12, color: neutral.mist }}>{format(parseISO(row.atISO), 'EEE d MMM, HH:mm')}</span>
    </span>
  )
  return row.onOpen !== undefined ? (
    <button
      type="button"
      data-shot={row.shot}
      onClick={row.onOpen}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: radius.ctl, border: 'none', background: neutral.bg, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
    >
      {body}
      <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
    </button>
  ) : (
    <div data-shot={row.shot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: radius.ctl, background: neutral.bg }}>
      {body}
    </div>
  )
}
