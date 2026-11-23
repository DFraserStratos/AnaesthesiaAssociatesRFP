import { useEffect, useMemo, useState } from 'react'
import { inDisplayOrder } from '../../../domain/billing/multiProcedure'
import { Link } from 'react-router-dom'
import { accent, neutral, radius } from '../../../theme/tokens'
import { bookingCountLabel, DRAFT_LIST, DRAFT_LISTS } from '../../../shared/scheduleTerms'
import { assignDraftList, bookingMovesOntoList, closeOutOfHoursRefusal, closeOutOfHoursSession, draftListsForDate, latestNotificationForList, listInSlot, procedureStackViewFor, useAppStore, useSlotView, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { useDemoTriggerContext } from '../../../shared/demoTriggers'
import { displayStatusLabel, isClosedKey, statusLine } from '../../../domain/slotStatus'
import { strongestOpen, useListWarnings, WarningTriangle, warningTone } from '../../../shared/warnings'
import { HistorySheet, ProcedureStack } from '../../../shared/booking'
import { AddBookingFlow, OfficeAlertLine, useBookingMoveEntries } from '../../../shared/flows'
import { drSurname, LIST_STATE_LABELS, locationName, pairingLine, slotTimeRange, shortDay } from '../../../shared/format'
import { surnameFirst } from '../util'
import { ConflictPanel } from './conflicts/ConflictPanel'
import { SidePanel } from '../../../shared/surface/SidePanel'
import { DRAWER_ACTION, DRAWER_ACTION_PRIMARY, DrawerLink, DrawerSection } from './drawerParts'
import { EditListSheet } from '../flows/EditListSheet'
import { ReassignListFlow } from '../flows/ReassignListFlow'
import { PhoneAdviceBooking } from '../flows/PhoneAdviceBooking'
import { MoveBookingFlow } from '../flows/MoveBookingFlow'
import { AssignListSheet } from '../flows/AssignListSheet'
import { EditSlotTimesSheet } from '../flows/EditSlotTimesSheet'
import { SessionStatusSheet } from '../flows/SessionStatusSheet'
import type { AssignedList, Slot } from '../../../domain/types'
import type { EffectiveSlotTimes } from '../../../domain/slots'
import { surgeonProfilePath } from '../mastersPaths'
import { withStubsInTimeOrder } from '../../../domain/intake/stubs'
import { useListStubs } from '../../../store/stubSelectors'
import { StubRow } from '../../../shared/stubs'
import { StubResolveLink } from './StubResolveLink'
import { isOutOfHours, sessionText } from '../../../domain/outOfHours'
import { CLOSE_OUT_OF_HOURS } from '../../../shared/outOfHoursTerms'
import { Button, DefList, DefRow, FormError, TextAction } from '../../../shared/ui'
import { Notice } from '../../../shared/ui/Notice'
import { NoticeLine } from '../../../shared/ui/NoticeLine'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ListOriginRow } from './ListOriginRow'
import { useListUpdateEmail } from '../flows/UpdateEmailActions'
import { SharedNotes } from '../../../shared/notes'

interface SlotDrawerProps {
  /** The session open in the drawer (a Slot id). */
  slotId: string
  actor: Actor
  onClose: () => void
  onOpenBooking: (bookingId: string) => void
  /** Open straight on Assign List, with a surgeon already chosen (Find available). */
  initialAssign?: { surgeonId?: string }
}

type Sheet = 'none' | 'edit' | 'addBooking' | 'reassign' | 'phone' | 'history' | 'assign' | 'times' | { move: string } | { status: string }

/**
 * The Admin Day drawer for one session (catch-up Phase 28; was the List
 * drawer). A session holding a List shows the List in place of the session's
 * status: header with the List's state and kind, Needs attention, Session,
 * Bookings, and Edit list, Reassign list, Change status and
 * History. An empty session shows its status (Free, Unavailable or Holiday),
 * its times and note, and Assign List, Book (phone advice), Edit times, Change
 * status and History; a session marked not available offers no Assign or Book
 * (US-01.6.3, D59: it is made available first). Change status on a session
 * holding a List asks where the List goes (catch-up Phase 32b). It keeps the
 * `admin-list-drawer` test id the capture recipes use.
 */
export function SlotDrawer({ slotId, actor, onClose, onOpenBooking, initialAssign }: SlotDrawerProps) {
  // A drawer opened on a List follows that List: after a reassign it moves to
  // the colleague's session, so the flow (and its success overlay) stays
  // mounted until it closes the drawer.
  const [followListId, setFollowListId] = useState(() => listInSlot(useAppStore.getState(), slotId)?.id)
  const followedSlotId = useAppStore((s) => (followListId !== undefined ? s.schedule.lists[followListId]?.slotId : undefined))
  const view = useSlotView(followedSlotId ?? slotId)
  // A List created here (Assign List, Book (phone advice)) is followed from then on too.
  const createdListId = view?.list?.id
  useEffect(() => {
    if (followListId === undefined && createdListId !== undefined) setFollowListId(createdListId)
  }, [followListId, createdListId])
  const [sheet, setSheet] = useState<Sheet>(initialAssign !== undefined ? 'assign' : 'none')
  useDemoTriggerContext('adminDay.selectedSlotId', followedSlotId ?? slotId)

  if (view === undefined) return null
  const slotId_ = view.slot.id
  return (
    <>
      {view.list === undefined ? (
        <EmptySessionDrawer slot={view.slot} times={view.times} actor={actor} sheet={sheet} setSheet={setSheet} onClose={onClose} />
      ) : (
        <ListBody list={view.list} slot={view.slot} times={view.times} actor={actor} sheet={sheet} setSheet={setSheet} onClose={onClose} onOpenBooking={onOpenBooking} />
      )}
      {/* The session's own sheets sit outside the two bodies: assigning turns
          the empty session into a List, and Book (phone advice) carries on to
          its Booking step across that switch. */}
      <AssignListSheet
        open={sheet === 'assign'}
        slotId={slotId_}
        actor={actor}
        initialSurgeonId={initialAssign?.surgeonId}
        onClose={() => setSheet('none')}
        onAssigned={() => setSheet('none')}
      />
      <PhoneAdviceBooking open={sheet === 'phone'} slotId={slotId_} actor={actor} onClose={() => setSheet('none')} onBooked={() => setSheet('none')} />
      <EditSlotTimesSheet open={sheet === 'times'} slotId={slotId_} actor={actor} onClose={() => setSheet('none')} />
      {/* Outside the bodies too: returning the List turns this drawer into the empty session's. */}
      {typeof sheet === 'object' && 'status' in sheet && <SessionStatusSheet open slotId={sheet.status} actor={actor} onClose={() => setSheet('none')} />}
    </>
  )
}

function ListBody({
  list,
  slot,
  times,
  actor,
  sheet,
  setSheet,
  onClose,
  onOpenBooking,
}: {
  list: AssignedList
  slot: Slot
  times: EffectiveSlotTimes
  actor: Actor
  sheet: Sheet
  setSheet: (s: Sheet) => void
  onClose: () => void
  onOpenBooking: (bookingId: string) => void
}) {
  const listId = list.id
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const warningsByBooking = useListWarnings(listId)
  // Stubs for rows waiting at intake (catch-up Phase 33a): drawn among the Bookings, never counted.
  const stubs = useListStubs(listId)
  // The cover-change email, once the List has an emailable change of anaesthetist (catch-up Phase 35; OQ-46).
  const updateEmail = useListUpdateEmail(listId, actor, DRAWER_ACTION)

  const bookings = Object.values(bookingsRecord)
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
  const activeBookings = bookings.filter((c) => c.cancellation === undefined)
  const anae = masters.anaesthetists[list.anaesthetistId]
  const hospital = locationName(list.hospitalId, masters.hospitals)
  const surgeon = masters.surgeons[list.surgeonId]?.name ?? list.surgeonId

  return (
    <>
      <SidePanel
        open
        onClose={onClose}
        width="list"
        testId="admin-list-drawer"
        panelAttrs={{ 'data-slot-id': slot.id, 'data-list-id': list.id }}
        title={anae !== undefined ? surnameFirst(anae.name) : list.anaesthetistId}
        meta={
          <>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{shortDay(list.dateISO)} · {sessionText(list.session)} · {LIST_STATE_LABELS[list.state]} · {bookingCountLabel(activeBookings.length)}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusChip status={list.kind} />
            </div>
          </>
        }
        footerTestId="admin-list-actions"
        footerLayout="wrap"
        footer={
          <>
            <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('edit')}>Edit list</Button>
            {list.state !== 'AUTHORISED' && <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('reassign')}>Reassign list</Button>}
            {list.state !== 'AUTHORISED' && <Button variant="secondary" size="compact" style={DRAWER_ACTION} shot="drawer-change-status" onClick={() => setSheet({ status: slot.id })}>Change status</Button>}
            <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('history')}>History</Button>
            {updateEmail.button}
          </>
        }
      >
          <ConflictPanel list={list} actor={actor} />
          {/* An open "Alert the office" on this List (catch-up Phase 32b, US-03.6.3), with the tick. */}
          <OfficeAlertLine actor={actor} target={{ listId: list.id }} />
          <MovedHereLine listId={list.id} anaesthetistId={list.anaesthetistId} />
          <BookingMovedHereLine listId={list.id} />

          <DrawerSection label="Session">
            <DefList>
              <DefRow label="Times">
                {slotTimeRange(times)}
                <span style={{ marginLeft: 8, fontSize: 12, color: neutral.mist }}>{times.overridden ? 'Own times' : 'Default'}</span>
              </DefRow>
              <DefRow label="Hospital">{hospital}</DefRow>
              <DefRow label="Surgeon">
                {masters.surgeons[list.surgeonId] !== undefined ? (
                  <Link
                    to={surgeonProfilePath(list.surgeonId)}
                    onClick={onClose}
                    data-shot="drawer-surgeon-link"
                    className="aa-table-entity-link"
                    style={{ color: accent.base }}
                  >
                    <span className="aa-table-entity-link-title">{surgeon}</span>
                  </Link>
                ) : (
                  surgeon
                )}
              </DefRow>
              {list.notes !== undefined && list.notes.trim() !== '' && <DefRow label="Note">{list.notes}</DefRow>}
              <ListOriginRow list={list} />
            </DefList>
          </DrawerSection>

          <DrawerSection label={`Bookings (${activeBookings.length})`}>
            {bookings.length === 0 && stubs.length === 0 && <EmptyState>No bookings on this List yet.</EmptyState>}
            {withStubsInTimeOrder(bookings, (b) => b.scheduledTime, stubs).map((entry) => {
              if (entry.kind === 'stub') {
                return <StubRow key={entry.stub.id} stub={entry.stub} density="table" trailing={<StubResolveLink stub={entry.stub} />} style={{ margin: '6px 0' }} />
              }
              const booking = entry.booking
              const patient = masters.patients[booking.patientId]
              const cancelled = booking.cancellation !== undefined
              const warnings = warningsByBooking.get(booking.id) ?? []
              // The Day view's outline carries down to the Booking (US-13.7.3):
              // the same colour as the block, strong red or mild amber.
              const strongest = strongestOpen(warnings)
              const outline = strongest !== undefined ? warningTone(strongest).solid : undefined
              return (
                <div
                  key={booking.id}
                  data-shot={outline !== undefined ? 'drawer-booking-warning' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    margin: '0 -10px',
                    borderBottom: `1px solid ${outline !== undefined ? 'transparent' : neutral.line}`,
                    borderRadius: outline !== undefined ? radius.ctl : 0,
                    boxShadow: outline !== undefined ? `inset 0 0 0 1.5px ${outline}` : 'none',
                    opacity: cancelled ? 0.5 : 1,
                  }}
                >
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient?.name ?? 'Unknown'}</span>
                      <WarningTriangle warnings={warnings} size="sm" />
                    </div>
                    <div style={{ fontSize: 11, color: neutral.slate }}>{cancelled ? 'Cancelled' : booking.completed ? 'Completed' : 'In progress'}</div>
                    {/* Each Procedure's stack, compact (catch-up Phase 20a; US-03.1.9). */}
                    {!cancelled && (
                      <div data-shot="drawer-procedure-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {inDisplayOrder(
                          Object.values(schedule.procedures)
                            .filter((p) => p.bookingId === booking.id)
                            .sort((a, b) => a.id.localeCompare(b.id)),
                        ).map((p, i, all) => {
                            const view = procedureStackViewFor({ masters, schedule, billing }, p.id, 'office')
                            return view === undefined ? null : (
                              <ProcedureStack key={p.id} view={view} density="compact" surface="office" heading={all.length > 1 ? `Procedure ${i + 1}` : 'Procedure'} />
                            )
                          })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <DrawerLink onClick={() => onOpenBooking(booking.id)}>Open</DrawerLink>
                    {!cancelled && list.state !== 'AUTHORISED' && <DrawerLink onClick={() => setSheet({ move: booking.id })}>Move</DrawerLink>}
                  </div>
                </div>
              )
            })}
            {/* The office adds a Booking to any List it may edit, booked or not (catch-up Phase 35; US-02.3.1, FT-02.3): the Draft List drawer's control. */}
            {list.state !== 'AUTHORISED' && (
              <TextAction size="sm" shot="list-add-booking" onClick={() => setSheet('addBooking')} style={{ alignSelf: 'flex-start' }}>
                Add Booking
              </TextAction>
            )}
          </DrawerSection>

          {/* The shared note on the List (catch-up Phase 40; US-11.3.3): the anaesthetist reads it on mobile and web. */}
          <DrawerSection label="Shared notes">
            <SharedNotes target={{ listId: list.id }} actor={actor} size="compact" />
          </DrawerSection>
      </SidePanel>

      <HistorySheet open={sheet === 'history'} entityIds={[listId, slot.id]} title="List history" onClose={() => setSheet('none')} />
      {updateEmail.composer}

      <EditListSheet open={sheet === 'edit'} list={list} actor={actor} onClose={() => setSheet('none')} />
      <AddBookingFlow open={sheet === 'addBooking'} listId={list.id} actor={actor} onClose={() => setSheet('none')} onCreated={() => setSheet('none')} />
      <ReassignListFlow open={sheet === 'reassign'} list={list} actor={actor} onClose={() => setSheet('none')} onReassigned={() => { setSheet('none'); onClose() }} />
      {typeof sheet === 'object' && 'move' in sheet && (
        <MoveBookingFlow open bookingId={sheet.move} actor={actor} onClose={() => setSheet('none')} onMoved={() => setSheet('none')} />
      )}
    </>
  )
}

/** An empty session: its status, times and note, and the office's ways to fill it. */
function EmptySessionDrawer({
  slot,
  times,
  actor,
  sheet,
  setSheet,
  onClose,
}: {
  slot: Slot
  times: EffectiveSlotTimes
  actor: Actor
  sheet: Sheet
  setSheet: (s: Sheet) => void
  onClose: () => void
}) {
  const anae = useAppStore((s) => s.masters.anaesthetists[slot.anaesthetistId])
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const masters = useAppStore((s) => s.masters)
  const open = !isClosedKey(statuses, slot.status)
  // The Draft Lists waiting for this day and session (an evening one included, catch-up Phase 32c): one tap puts one here.
  const lists = useAppStore((s) => s.schedule.lists)
  const waiting = useMemo(() => draftListsForDate({ schedule: { lists } }, slot.dateISO).filter((l) => l.session === slot.session), [lists, slot.dateISO, slot.session])
  const evening = isOutOfHours(slot)
  const closeBlocked = useAppStore((s) => (evening ? closeOutOfHoursRefusal(s, slot.id) : null))
  const [error, setError] = useState<string | null>(null)

  function assignDraft(listId: string) {
    setError(null)
    const out = assignDraftList(useAppStore, actor, listId, { anaesthetistId: slot.anaesthetistId })
    if (!out.ok) setError(out.message)
  }

  function closeSession() {
    setError(null)
    const out = closeOutOfHoursSession(useAppStore, actor, slot.id)
    if (!out.ok) setError(out.message)
    else onClose()
  }
  return (
    <>
      <SidePanel
        open
        onClose={onClose}
        width="list"
        testId="admin-list-drawer"
        shot="admin-slot-drawer"
        panelAttrs={{ 'data-slot-id': slot.id }}
        title={anae !== undefined ? surnameFirst(anae.name) : slot.anaesthetistId}
        meta={
          <>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{shortDay(slot.dateISO)} · {sessionText(slot.session)}</div>
            <div style={{ marginTop: 8 }}><StatusChip status={slot.status} /></div>
          </>
        }
        footerTestId="admin-list-actions"
        footerLayout="column"
        footer={
          <>
          {/* The one primary on its own row, the session's other actions beneath. */}
          {open ? (
            <>
              <div style={{ display: 'flex' }}>
                <Button variant="primary" size="compact" style={DRAWER_ACTION_PRIMARY} onClick={() => setSheet('assign')}>Assign List</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
                <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('phone')}>Book (phone advice)</Button>
                <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('times')}>Edit times</Button>
                <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('history')}>History</Button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
              <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('times')}>Edit times</Button>
              <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('history')}>History</Button>
            </div>
          )}
          {evening && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Button variant="secondary" size="compact" style={DRAWER_ACTION} shot="drawer-close-out-of-hours" disabled={closeBlocked !== null} disabledReason={closeBlocked ?? undefined} onClick={closeSession}>{CLOSE_OUT_OF_HOURS}</Button>
            </div>
          )}
          </>
        }
      >
          <DrawerSection label="Session">
            <DefList>
              <DefRow label="Status">
                {/* The status line (catch-up Phase 32d): "Public hospital · CPH", no List detail. */}
                {statusLine(slot, statuses, true)}
                {/* The office sets the anaesthetist's status here, a sickness phoned in included (catch-up Phase 32b). */}
                <TextAction size="sm" flush shot="drawer-change-status" onClick={() => setSheet({ status: slot.id })} style={{ marginLeft: 10 }}>
                  Change status
                </TextAction>
              </DefRow>
              <DefRow label="Times">
                {slotTimeRange(times)}
                <span style={{ marginLeft: 8, fontSize: 12, color: neutral.mist }}>{times.overridden ? 'Own times' : 'Default'}</span>
              </DefRow>
              {open && slot.note !== undefined && slot.note.trim() !== '' && <DefRow label="Note">{slot.note}</DefRow>}
            </DefList>
          </DrawerSection>
          {open ? (
            <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
              No List in this session yet. Assign one to give it a surgeon and hospital{waiting.length > 0 ? `, put a waiting ${DRAFT_LIST} here` : ''}, or book a patient straight from a call.
            </div>
          ) : (
            // A closed session takes no List (US-01.6.3, D59; catch-up Phase 32b): made available first.
            <div data-shot="drawer-closed-session" style={{ background: neutral.bg, color: neutral.ink, borderRadius: radius.card, padding: 12, fontSize: 13, lineHeight: '19px' }}>
              This session is marked {displayStatusLabel(slot.status, statuses)}. It needs to be made available, with {anae !== undefined ? drSurname(anae.name) : 'the anaesthetist'}'s agreement, before a List or Booking can go here.
            </div>
          )}
          {open && waiting.length > 0 && (
            <DrawerSection label={`${DRAFT_LISTS} for this session (${waiting.length})`}>
              <div data-shot="drawer-session-draft-lists" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {waiting.map((l) => (
                  <div key={l.id} data-draft-list-id={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', margin: '0 -10px', borderBottom: `1px solid ${neutral.line}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: neutral.ink }}>{pairingLine(l, masters)}</span>
                    <DrawerLink onClick={() => assignDraft(l.id)}>Assign here</DrawerLink>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}
          <FormError message={error} />
      </SidePanel>

      <HistorySheet open={sheet === 'history'} entityIds={[slot.id]} title="Session history" onClose={() => setSheet('none')} />
    </>
  )
}

/**
 * The drawer's line for a List an anaesthetist moved herself into this session
 * (catch-up Phase 32; US-13.8.2), read from the shared pool's latest record for
 * the List. Neutral: it needs no action. Nothing about pairing preferences.
 */
function MovedHereLine({ listId, anaesthetistId }: { listId: string; anaesthetistId: string }) {
  const n = useAppStore((s) => latestNotificationForList(s, listId))
  const from = useAppStore((s) => (n !== undefined ? s.masters.anaesthetists[n.fromAnaesthetistId]?.name : undefined))
  if (n === undefined || n.route !== 'colleague' || n.toAnaesthetistId !== anaesthetistId) return null
  return (
    <Notice tone="neutral" shot="drawer-moved-here">
      <NoticeLine
        stampInline
        text={`Moved here by ${from !== undefined ? drSurname(from) : 'its anaesthetist'}, an anaesthetist's own move`}
        {...(n.message !== undefined ? { message: n.message } : {})}
        atISO={n.atISO}
      />
    </Notice>
  )
}

/**
 * The drawer's line for a Booking an anaesthetist handed to a colleague, which
 * made this List (catch-up Phase 32a; US-01.4.7). Read from the move's audit
 * event, so it shows whether or not the mover told the office. Neutral: it
 * needs no action. Nothing about pairing preferences.
 */
function BookingMovedHereLine({ listId }: { listId: string }) {
  const entries = useBookingMoveEntries()
  const bookings = useAppStore((s) => s.schedule.bookings)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const moves = useMemo(() => bookingMovesOntoList({ audit: entries, schedule: { bookings } }, listId), [entries, bookings, listId])
  if (moves.length === 0) return null
  return (
    <div data-shot="drawer-booking-moved-here" style={{ background: neutral.bg, borderRadius: radius.card, padding: '10px 12px', fontSize: 13, lineHeight: '19px', color: neutral.ink, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {moves.map((m) => {
        const from = anaesthetists[m.fromAnaesthetistId]?.name
        return (
          <NoticeLine
            key={m.auditId}
            stampInline
            stampJoin=", "
            text={`Booking moved here by ${from !== undefined ? drSurname(from) : 'its anaesthetist'}`}
            {...(m.message !== undefined ? { message: m.message } : {})}
            atISO={m.atISO}
          />
        )
      })}
    </div>
  )
}
