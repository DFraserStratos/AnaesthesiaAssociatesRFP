import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { listInSlot, useAppStore, useSlotView, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { useDemoTriggerContext } from '../../../shared/demoTriggers'
import { displayStatusLabel, isClosedKey } from '../../../domain/slotStatus'
import { strongestOpen, useListWarnings, WarningTriangle, warningTone } from '../../../shared/warnings'
import { HistorySheet } from '../../../shared/booking'
import { LIST_STATE_LABELS, slotTimeRange } from '../../../shared/format'
import { AttachmentStrip } from '../../../shared/attachments'
import { attentionReasons, surnameFirst } from '../util'
import { EditListSheet } from '../flows/EditListSheet'
import { ReassignListFlow } from '../flows/ReassignListFlow'
import { PhoneAdviceBooking } from '../flows/PhoneAdviceBooking'
import { MoveBookingFlow } from '../flows/MoveBookingFlow'
import { AssignListSheet } from '../flows/AssignListSheet'
import { EditSlotTimesSheet } from '../flows/EditSlotTimesSheet'
import type { List, Slot } from '../../../domain/types'
import type { EffectiveSlotTimes } from '../../../domain/slots'
import { ADMIN_LIST_DRAWER_WIDTH } from '../layout'
import { surgeonProfilePath } from '../mastersPaths'

interface SlotDrawerProps {
  /** The session open in the drawer (a Slot id). */
  slotId: string
  actor: Actor
  onClose: () => void
  onOpenBooking: (bookingId: string) => void
  /** Open straight on Assign List, with a surgeon already chosen (Find available). */
  initialAssign?: { surgeonId?: string }
}

type Sheet = 'none' | 'edit' | 'reassign' | 'phone' | 'history' | 'assign' | 'times' | { move: string }

/**
 * The Admin Day drawer for one session (catch-up Phase 28; was the List
 * drawer). A session holding a List shows the List in place of the session's
 * status: header with the List's state and kind, Needs attention, Session,
 * Bookings, Attachments, and Edit list, Reassign list and History. An empty
 * session shows its status (Free, Unavailable or Holiday), its times and note,
 * and Assign List, Book (phone advice), Edit times and History. It keeps the
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
        <EmptySessionDrawer slot={view.slot} times={view.times} sheet={sheet} setSheet={setSheet} onClose={onClose} />
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
  list: List
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
  const warningsByBooking = useListWarnings(listId)

  const bookings = Object.values(bookingsRecord)
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
  const activeBookings = bookings.filter((c) => c.cancellation === undefined)
  const anae = masters.anaesthetists[list.anaesthetistId]
  const hospital = list.hospitalId !== undefined ? masters.hospitals[list.hospitalId]?.name : 'Unassigned'
  const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId]?.name : 'Not assigned'
  const reasons = attentionReasons(list)
  // The anaesthetist marked this session with a closed status while it holds a
  // List: the List stays (with its conflict flag) until Phase 32's return or
  // assign (US-01.5.5). Say so beside the flag.
  if (isClosedKey(masters.slotStatuses, slot.status)) {
    reasons.push(`The session is marked ${displayStatusLabel(slot.status, masters.slotStatuses).toLowerCase()}.`)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(23,35,32,0.32)', zIndex: 40 }} />
      <div data-testid="admin-list-drawer" data-slot-id={slot.id} data-list-id={list.id} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: ADMIN_LIST_DRAWER_WIDTH, maxWidth: '100%', background: neutral.surface, zIndex: 41, boxShadow: '-8px 0 24px rgba(23,35,32,0.16)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{anae !== undefined ? surnameFirst(anae.name) : list.anaesthetistId}</div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(list.dateISO), 'EEE d MMM')} · {list.session} · {LIST_STATE_LABELS[list.state]}</div>
            <div style={{ marginTop: 8 }}><StatusChip status={list.kind} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4 }}>
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reasons.length > 0 && (
            <div style={{ background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>Needs attention</strong>
              {reasons.map((r, i) => <span key={i}>{r}</span>)}
            </div>
          )}

          <Section label="Session">
            <Row label="Times">
              {slotTimeRange(times)}
              <span style={{ marginLeft: 8, fontSize: 12, color: neutral.mist }}>{times.overridden ? 'Own times' : 'Default'}</span>
            </Row>
            <Row label="Hospital">{hospital}</Row>
            <Row label="Surgeon">
              {list.surgeonId !== undefined && surgeon !== undefined ? (
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
            </Row>
            {list.notes !== undefined && list.notes.trim() !== '' && <Row label="Note">{list.notes}</Row>}
          </Section>

          <Section label={`Bookings (${activeBookings.length})`}>
            {bookings.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No bookings on this List yet.</div>}
            {bookings.map((booking) => {
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
                    alignItems: 'center',
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: neutral.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient?.name ?? 'Unknown'}</span>
                      <WarningTriangle warnings={warnings} size="sm" />
                    </div>
                    <div style={{ fontSize: 11, color: neutral.slate }}>{cancelled ? 'Cancelled' : booking.completed ? 'Completed' : 'In progress'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <DrawerLink onClick={() => onOpenBooking(booking.id)}>Open</DrawerLink>
                    {!cancelled && list.state !== 'AUTHORISED' && <DrawerLink onClick={() => setSheet({ move: booking.id })}>Move</DrawerLink>}
                  </div>
                </div>
              )
            })}
          </Section>

          {/* The List's own attachments (US-03.1.3), read-only by design in the
              drawer: the phase adds no Admin attach UI, although the store's
              rights would let the office attach on ACTIVE and SUBMITTED. */}
          <div data-shot="admin-list-attachments">
            <Section label={`Attachments (${(list.attachments ?? []).length})`}>
              <AttachmentStrip attachments={list.attachments ?? []} canRemove={false} emptyText="No attachments on this List." />
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div data-testid="admin-list-actions" style={{ padding: 20, borderTop: `1px solid ${neutral.line}`, display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
          <ActionBtn onClick={() => setSheet('edit')}>Edit list</ActionBtn>
          {list.state !== 'AUTHORISED' && <ActionBtn onClick={() => setSheet('reassign')}>Reassign list</ActionBtn>}
          <ActionBtn onClick={() => setSheet('history')}>History</ActionBtn>
        </div>
      </div>

      <HistorySheet open={sheet === 'history'} entityIds={[listId, slot.id]} title="List history" onClose={() => setSheet('none')} />

      <EditListSheet open={sheet === 'edit'} list={list} actor={actor} onClose={() => setSheet('none')} />
      <ReassignListFlow open={sheet === 'reassign'} list={list} actor={actor} onClose={() => setSheet('none')} onReassigned={() => { setSheet('none'); onClose() }} />
      {typeof sheet === 'object' && (
        <MoveBookingFlow open bookingId={sheet.move} actor={actor} onClose={() => setSheet('none')} onMoved={() => setSheet('none')} />
      )}
    </>
  )
}

/** An empty session: its status, times and note, and the office's ways to fill it. */
function EmptySessionDrawer({
  slot,
  times,
  sheet,
  setSheet,
  onClose,
}: {
  slot: Slot
  times: EffectiveSlotTimes
  sheet: Sheet
  setSheet: (s: Sheet) => void
  onClose: () => void
}) {
  const anae = useAppStore((s) => s.masters.anaesthetists[slot.anaesthetistId])
  const statuses = useAppStore((s) => s.masters.slotStatuses)
  const open = !isClosedKey(statuses, slot.status)
  const cover = slot.coverRequest
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(23,35,32,0.32)', zIndex: 40 }} />
      <div data-testid="admin-list-drawer" data-shot="admin-slot-drawer" data-slot-id={slot.id} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: ADMIN_LIST_DRAWER_WIDTH, maxWidth: '100%', background: neutral.surface, zIndex: 41, boxShadow: '-8px 0 24px rgba(23,35,32,0.16)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{anae !== undefined ? surnameFirst(anae.name) : slot.anaesthetistId}</div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(slot.dateISO), 'EEE d MMM')} · {slot.session}</div>
            <div style={{ marginTop: 8 }}><StatusChip status={slot.status} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4 }}>
            <X size={20} aria-hidden />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section label="Session">
            <Row label="Status">{displayStatusLabel(slot.status, statuses, true)}</Row>
            <Row label="Times">
              {slotTimeRange(times)}
              <span style={{ marginLeft: 8, fontSize: 12, color: neutral.mist }}>{times.overridden ? 'Own times' : 'Default'}</span>
            </Row>
            {slot.note !== undefined && slot.note.trim() !== '' && <Row label="Note">{slot.note}</Row>}
            {cover !== undefined && <Row label="Cover">{cover.kind === 'offer' ? 'Offered for cover' : 'Cover requested'} by {cover.by}</Row>}
          </Section>
          {open ? (
            <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
              No List in this session yet. Assign one to give it a surgeon and hospital, or book a patient straight from a call.
            </div>
          ) : (
            <div style={{ background: neutral.bg, borderRadius: radius.card, padding: 12, fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
              This session is marked {displayStatusLabel(slot.status, statuses).toLowerCase()}, so it is not open for a List in this build.
            </div>
          )}
        </div>

        {/* The one primary on its own row, the session's other actions beneath. */}
        <div data-testid="admin-list-actions" style={{ padding: 20, borderTop: `1px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {open && (
            <div style={{ display: 'flex' }}>
              <ActionBtn primary onClick={() => setSheet('assign')}>Assign List</ActionBtn>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
            {open && <ActionBtn onClick={() => setSheet('phone')}>Book (phone advice)</ActionBtn>}
            <ActionBtn onClick={() => setSheet('times')}>Edit times</ActionBtn>
            <ActionBtn onClick={() => setSheet('history')}>History</ActionBtn>
          </div>
        </div>
      </div>

      <HistorySheet open={sheet === 'history'} entityIds={[slot.id]} title="Session history" onClose={() => setSheet('none')} />
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 72, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

function DrawerLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ border: `1px solid ${neutral.line}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 8, padding: '4px 10px' }}>
      {children}
    </button>
  )
}

function ActionBtn({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ flex: primary === true ? '1 1 auto' : '0 0 auto', minWidth: 0, minHeight: 40, padding: '0 14px', borderRadius: radius.ctl, border: primary === true ? 'none' : `1px solid ${neutral.line}`, background: primary === true ? accent.base : neutral.surface, color: primary === true ? '#FFFFFF' : neutral.slate, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}
