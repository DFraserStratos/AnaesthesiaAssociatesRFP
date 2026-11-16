import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import {
  bookingRequiresPrepayment,
  moveBookingToAnaesthetist,
  proceduresForBooking,
  useAppStore,
  type Actor,
  type BookingMoveResult,
} from '../../store'
import { bookingMoveReceivers, freeColleagues, type BookingMoveInput, type BookingReceiver } from '../../domain/bookingMoves'
import type { AssignedList, Booking } from '../../domain/types'
import { drSurname, locationName } from '../format'
import { Button, NameSearchBox, TextArea, TickBadge } from '../ui'
import { useSurface } from '../surface'
import { Avatar } from '../Avatar'
import { sessionText } from '../../domain/outOfHours'
import { procedureLabel } from '../../domain/billing/procedureStack'

/**
 * Move to a colleague: an anaesthetist hands one Booking to a colleague free in
 * that session (catch-up Phase 32a; US-01.4.7, US-01.4.6; OQ-85 answered, D61).
 * The sibling of `MoveListSheet` (Mobile Availability anatomy): a bottom sheet
 * on mobile, a dialog on web.
 *
 * - FIND: the colleagues free that session, in name order, before anything is
 *   typed; the shared type-ahead box narrows every colleague as each letter is
 *   typed, so someone away or already holding a List shows when searched for,
 *   as a neutral row that cannot be picked. Never ordered, grouped or marked by
 *   a preference or a tier (D44, D54).
 * - CONFIRM: where it lands (always a new List in their session), who is paid,
 *   the honour-system line for a prepaid Booking, an optional message and the
 *   optional "Tell the office" tick (off by default). No warning of any kind.
 * - DONE: the tick, and Back to your List.
 *
 * The Booking and its List are snapshot when the sheet opens, so the header and
 * the done state survive the move (after it, the Booking is a colleague's).
 */
interface MoveBookingToColleagueSheetProps {
  open: boolean
  actor: Actor
  bookingId: string
  onClose: () => void
  /** Done: back to the List the Booking left. */
  onBackToList: () => void
  onMoved?: (result: BookingMoveResult) => void
}

type Step = 'find' | 'confirm' | 'done'

interface Snapshot {
  booking: Booking
  list: AssignedList
  patientName: string
  procedure: string | undefined
  bookingsOnList: number
  prepaid: boolean
}

export function MoveBookingToColleagueSheet({ open, actor, bookingId, onClose, onBackToList, onMoved }: MoveBookingToColleagueSheetProps) {
  const { Overlay, variant } = useSurface()
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const lists = useAppStore((s) => s.schedule.lists)
  const slots = useAppStore((s) => s.schedule.slots)
  const bookings = useAppStore((s) => s.schedule.bookings)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const input: BookingMoveInput = useMemo(() => ({ lists, slots, bookings, anaesthetists, slotStatuses }), [lists, slots, bookings, anaesthetists, slotStatuses])

  const [step, setStep] = useState<Step>('find')
  const [query, setQuery] = useState('')
  const [receiverId, setReceiverId] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [tellOffice, setTellOffice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | undefined>(undefined)
  const [done, setDone] = useState<{ name: string; toldOffice: boolean } | null>(null)

  useEffect(() => {
    if (!open) return
    const s = useAppStore.getState()
    const booking = s.schedule.bookings[bookingId]
    const list = booking !== undefined ? s.schedule.lists[booking.listId] : undefined
    if (booking === undefined || list === undefined || list.state === 'DRAFT') {
      setSnapshot(undefined)
    } else {
      const procedures = proceduresForBooking(s, bookingId)
      setSnapshot({
        booking,
        list,
        patientName: s.masters.patients[booking.patientId]?.name ?? 'Patient',
        procedure: (() => {
          const first = procedures.find((p) => !p.isAdditional) ?? procedures[0]
          return first !== undefined ? procedureLabel(first, s.masters.rvgGroups, 1) : undefined
        })(),
        bookingsOnList: Object.values(s.schedule.bookings).filter((b) => b.listId === list.id && b.cancellation === undefined).length,
        prepaid: bookingRequiresPrepayment(s, bookingId),
      })
    }
    setStep('find')
    setQuery('')
    setReceiverId(undefined)
    setMessage('')
    setTellOffice(false)
    setError(null)
    setDone(null)
  }, [open, bookingId])

  const mover = actor.anaesthetistId ?? ''
  const rows: BookingReceiver[] = useMemo(() => {
    if (!open || step === 'done') return []
    return query.trim() === '' ? freeColleagues(input, bookingId, mover) : bookingMoveReceivers(input, bookingId, mover, query)
  }, [open, input, bookingId, mover, query, step])

  if (snapshot === undefined) return null
  const { list } = snapshot
  const day = format(parseISO(list.dateISO), 'EEE d MMM')
  const hospital = locationName(list.hospitalId, hospitals)
  const surgeon = surgeons[list.surgeonId]?.name
  const receiver = receiverId !== undefined ? anaesthetists[receiverId] : undefined
  const receiverShort = receiver !== undefined ? drSurname(receiver.name) : 'Your colleague'
  const searching = query.trim() !== ''

  function submit() {
    if (receiverId === undefined) return
    setError(null)
    const msg = message.trim()
    const out = moveBookingToAnaesthetist(useAppStore, actor, bookingId, receiverId, {
      ...(msg !== '' ? { message: msg } : {}),
      tellOffice,
    })
    if (!out.ok) {
      setError(out.message)
      return
    }
    setDone({ name: anaesthetists[receiverId]?.name ?? '', toldOffice: tellOffice })
    setStep('done')
    onMoved?.(out.value)
  }

  const header = (
    <div data-shot="move-booking-header" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>Move to a colleague</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>
        {snapshot.patientName}
        {snapshot.procedure !== undefined && <span style={{ fontWeight: 400, color: neutral.slate }}>, {snapshot.procedure}</span>}
      </span>
      <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>
        {[day, sessionText(list.session), hospital, surgeon].filter((p): p is string => p !== undefined).join(' · ')}
      </span>
    </div>
  )

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="move-booking-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: variant === 'web' ? 460 : undefined, maxWidth: '100%' }}>
        {step === 'find' && (
          <>
            {header}
            <NameSearchBox value={query} onChange={setQuery} label="Find a colleague" placeholder="Type a name" shot="move-booking-search" />
            <div style={{ fontSize: 13, color: neutral.slate }}>
              {searching ? 'Matching colleagues, in name order' : `Free this session · ${day} ${sessionText(list.session)}`}
            </div>
            <ul
              data-shot="move-booking-receivers"
              aria-label={searching ? 'Colleagues matching your search' : 'Colleagues free this session'}
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.card,
                overflow: 'hidden',
                maxHeight: variant === 'web' ? 340 : undefined,
                overflowY: 'auto',
              }}
            >
              {rows.length === 0 && (
                <li style={{ padding: 14, fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
                  {searching ? 'No anaesthetist matches' : 'No colleague is free this session. Type a name to see who else works that day.'}
                </li>
              )}
              {rows.map((r, i) => (
                <ReceiverRow
                  key={r.anaesthetistId}
                  receiver={r}
                  first={i === 0}
                  onPick={() => {
                    setReceiverId(r.anaesthetistId)
                    setError(null)
                    setStep('confirm')
                  }}
                />
              ))}
            </ul>
          </>
        )}

        {step === 'confirm' && receiver !== undefined && (
          <div data-shot="move-booking-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={receiver.name} size={44} variant="neutral" />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: neutral.ink }}>{receiver.name}</span>
                <span style={{ fontSize: 13, color: neutral.slate }}>
                  {snapshot.patientName}, {day} {sessionText(list.session)}
                </span>
              </div>
            </div>

            <LandingPath hospital={hospital} session={list.session} receiverShort={receiverShort} bookingsOnList={snapshot.bookingsOnList} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
              <span data-shot="move-booking-landing">
                A new List is created in {receiverShort}&apos;s {day} {sessionText(list.session)} session at {hospital}.
              </span>
              <span data-shot="move-booking-payable">{receiverShort} is paid for it.</span>
            </div>
            {snapshot.prepaid && (
              <div data-shot="move-booking-honour" style={{ background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, lineHeight: '19px', color: neutral.ink }}>
                This Booking is prepaid. The prepaid amount stays as agreed, and {receiverShort} claims it.
              </div>
            )}

            <TextArea label="Add a message" value={message} onChange={setMessage} placeholder={`Optional note for ${receiverShort}`} />

            <label
              data-shot="move-booking-tell-office"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: radius.card, border: `1px solid ${tellOffice ? accent.base : neutral.line}`, background: tellOffice ? accent.tint : neutral.surface, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={tellOffice}
                onChange={(e) => setTellOffice(e.target.checked)}
                style={{ width: 20, height: 20, margin: '1px 0 0', accentColor: accent.base, flex: 'none', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>Tell the office</span>
                <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>Optional. Adds a note to the office&apos;s notifications.</span>
              </span>
            </label>

            {error !== null && (
              <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span data-shot="move-booking-submit" style={{ display: 'contents' }}>
                <Button variant="primary" block onClick={submit}>
                  Move Booking
                </Button>
              </span>
              <Button variant="secondary" block onClick={() => setStep('find')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && done !== null && (
          <div data-shot="move-booking-done" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
            <TickBadge size={72} animate />
            <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>Moved to {drSurname(done.name)}.</div>
            <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center', lineHeight: '19px' }}>
              It is on a new List in their {day} {sessionText(list.session)} session.
              {done.toldOffice && (
                <>
                  <br />
                  <span data-shot="move-booking-office-told">The office has been told.</span>
                </>
              )}
            </div>
            <Button variant="secondary" block onClick={onBackToList} style={{ marginTop: 4 }}>
              Back to your List
            </Button>
          </div>
        )}
      </div>
    </Overlay>
  )
}

/**
 * One colleague. Offered: a button (initials, name, line, chevron). Blocked
 * (away, or already holding a List): the same row in neutral, not a button,
 * never error red; its line says why.
 */
function ReceiverRow({ receiver, first, onPick }: { receiver: BookingReceiver; first: boolean; onPick: () => void }) {
  const base = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    minHeight: 60,
    border: 'none',
    borderTop: first ? 'none' : `1px solid ${neutral.sunken}`,
    fontFamily: 'inherit',
    textAlign: 'left' as const,
  }
  const text = (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: receiver.offer !== null ? neutral.ink : neutral.slate }}>{receiver.name}</span>
      <span style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>{receiver.line}</span>
    </span>
  )
  if (receiver.offer === null) {
    return (
      <li style={{ display: 'flex' }}>
        <div data-shot="move-booking-blocked" data-anaesthetist-id={receiver.anaesthetistId} aria-disabled="true" style={{ ...base, background: neutral.bg }}>
          <Avatar name={receiver.name} size={36} variant="neutral" muted />
          {text}
        </div>
      </li>
    )
  }
  return (
    <li style={{ display: 'flex' }}>
      <button type="button" data-shot="move-booking-receiver" data-anaesthetist-id={receiver.anaesthetistId} onClick={onPick} style={{ ...base, background: neutral.surface, cursor: 'pointer' }}>
        <Avatar name={receiver.name} size={36} variant="neutral" />
        {text}
        <ChevronRight size={16} strokeWidth={2.2} color={neutral.mist} aria-hidden />
      </button>
    </li>
  )
}

/**
 * Where the Booking goes, drawn: it leaves her List and becomes a new List of
 * the colleague's in the same session. Never "into" an existing List (D61).
 */
function LandingPath({ hospital, session, receiverShort, bookingsOnList }: { hospital: string; session: string; receiverShort: string; bookingsOnList: number }) {
  const left = bookingsOnList - 1
  const stays = left === 0 ? 'no other Booking stays' : `${left} ${left === 1 ? 'Booking stays' : 'Bookings stay'}`
  return (
    <div aria-hidden style={{ display: 'grid', gridTemplateColumns: '14px 1fr', columnGap: 12, padding: '12px 14px', borderRadius: radius.card, background: neutral.bg }}>
      <span style={{ width: 10, height: 10, marginTop: 4, marginLeft: 2, borderRadius: radius.pill, border: `2px solid ${neutral.lineStrong}`, background: neutral.surface, boxSizing: 'border-box' }} />
      <span style={{ fontSize: 13, color: neutral.slate }}>
        Your {hospital} {sessionText(session)} List · {stays}
      </span>
      <span style={{ justifySelf: 'center', width: 2, height: 14, background: neutral.lineStrong, margin: '2px 0' }} />
      <span />
      <span style={{ width: 10, height: 10, marginTop: 4, marginLeft: 2, borderRadius: radius.pill, background: neutral.ink }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>New List for {receiverShort} · this Booking</span>
    </div>
  )
}
