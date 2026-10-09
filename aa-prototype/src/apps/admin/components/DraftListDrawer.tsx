/**
 * The Admin List drawer in its unassigned mode (catch-up Phase 31; FT-01.6,
 * US-01.6.1 to US-01.6.4). A Draft List has no session, so it opens by List id
 * from the Draft Lists page, the Day view's band and rail card, and the
 * Conflicts screen. Header: the DRAFT chip, the "Unassigned" flag, day and
 * session, waiting time and booking count. Then the request, a one-line
 * reminder that nobody's schedule changes yet, "Available that session" (the
 * first five clear candidates in tier order, US-01.6.3's note), the Bookings,
 * and Assign (teal), Edit, Change date, Remove and History. Once assigned, the
 * layout switches to the session drawer, which shows the List ACTIVE.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, scrim } from '../../../theme/tokens'
import { useAppStore, type Actor } from '../../../store'
import { useDemoTriggerContext } from '../../../shared/demoTriggers'
import { HistorySheet } from '../../../shared/booking'
import { AddBookingFlow } from '../../../shared/flows'
import { LIST_KIND_LABELS, type List } from '../../../domain/types'
import { isDraftList } from '../../../domain/draftLists'
import { drSurname, locationName, pairingLine } from '../../../shared/format'
import { DRAFT_LIST, ORIGIN_LABELS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, unavailableDetail } from '../../../shared/scheduleTerms'
import { removeBlockedReason } from '../../../domain/draftLists'
import { surnameFirst } from '../util'
import { ADMIN_LIST_DRAWER_WIDTH } from '../layout'
import { ConflictPanel } from './conflicts/ConflictPanel'
import { EditListSheet } from '../flows/EditListSheet'
import { MoveBookingFlow } from '../flows/MoveBookingFlow'
import { AssignDraftListSheet } from '../flows/AssignDraftListSheet'
import { RedateDraftListSheet } from '../flows/RedateDraftListSheet'
import { RemoveDraftListSheet } from '../flows/RemoveDraftListSheet'
import { TierPill, PreferredPill, useSuggestionKey } from './pairing'
import { useDraftListCandidates } from './pairing/DraftListCandidates'
import { BookingCount, DraftStateChip, UnassignedPill, WaitingTime } from './draftLists/DraftListParts'

type Sheet = 'none' | 'assign' | 'edit' | 'redate' | 'remove' | 'history' | 'addBooking' | { move: string } | { assignTo: string }

const SHORT_LIST = 5

interface DraftListDrawerProps {
  listId: string
  actor: Actor
  onClose: () => void
  onOpenBooking: (dateISO: string, bookingId: string) => void
  /** After assignment: show the List, now ACTIVE, in its session. */
  onAssigned: (listId: string, slotId: string) => void
  /** Open the List that already holds an anaesthetist's session. */
  onOpenList: (listId: string) => void
}

export function DraftListDrawer({ listId, actor, onClose, onOpenBooking, onAssigned, onOpenList }: DraftListDrawerProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const [sheet, setSheet] = useState<Sheet>('none')
  useDemoTriggerContext('adminDraftLists.openListId', listId)
  // Keep the drawer mounted through the assign sheet's success moment.
  if (list === undefined) return null
  if (!isDraftList(list) && !(typeof sheet === 'object' || sheet === 'assign')) return null
  return <DraftBody list={list} actor={actor} sheet={sheet} setSheet={setSheet} onClose={onClose} onOpenBooking={onOpenBooking} onAssigned={onAssigned} onOpenList={onOpenList} />
}

function DraftBody({
  list,
  actor,
  sheet,
  setSheet,
  onClose,
  onOpenBooking,
  onAssigned,
  onOpenList,
}: {
  list: List
  actor: Actor
  sheet: Sheet
  setSheet: (s: Sheet) => void
} & Omit<DraftListDrawerProps, 'listId' | 'actor'>) {
  const masters = useAppStore((s) => s.masters)
  const bookingsRecord = useAppStore((s) => s.schedule.bookings)
  const today = useAppStore((s) => s.clock.todayISO)
  const bookings = Object.values(bookingsRecord)
    .filter((b) => b.listId === list.id)
    .sort((a, b) => a.id.localeCompare(b.id))
  const active = bookings.filter((b) => b.cancellation === undefined)
  // One suggestion key per opening of the drawer, shared with the assign sheet,
  // so the short list is the first five of the order "See everyone" shows.
  const requestKey = useSuggestionKey(list.id, true)
  const candidates = useDraftListCandidates(list.id, requestKey, null)
  const short = (candidates?.free ?? []).slice(0, SHORT_LIST)
  const everyone = candidates === undefined ? 0 : candidates.free.length + candidates.notPreferred.length + candidates.notAvailable.length + candidates.occupied.length
  const trail = list.draft
  const passed = list.dateISO < today
  const from = trail?.fromAnaesthetistId !== undefined ? masters.anaesthetists[trail.fromAnaesthetistId] : undefined
  const recurring = list.recurringBookingId !== undefined ? masters.recurringBookings[list.recurringBookingId] : undefined
  const assignTo = typeof sheet === 'object' && 'assignTo' in sheet ? sheet.assignTo : undefined

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: scrim, zIndex: 40 }} />
      <div
        data-testid="admin-list-drawer"
        data-shot="admin-draft-list-drawer"
        data-list-id={list.id}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: ADMIN_LIST_DRAWER_WIDTH, maxWidth: '100%', background: neutral.surface, zIndex: 41, boxShadow: '-8px 0 24px rgba(23,35,32,0.16)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <DraftStateChip />
              <UnassignedPill />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{locationName(list.hospitalId, masters.hospitals)}</div>
            <div style={{ fontSize: 13, color: neutral.slate, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{format(parseISO(list.dateISO), 'EEE d MMM')} · {list.session}</span>
              <span aria-hidden>·</span>
              <span>Waiting <WaitingTime list={list} /></span>
              <span aria-hidden>·</span>
              <BookingCount count={active.length} style={{ fontSize: 12.5 }} noun />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4 }}>
            <X size={20} aria-hidden />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ConflictPanel list={list} actor={actor} />
          {passed && (
            <div role="status" style={{ background: neutral.sunken, color: neutral.slate, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
              This day has passed. Change its date or remove it.
            </div>
          )}

          <Section label="Request">
            <Row label="Hospital">{locationName(list.hospitalId, masters.hospitals)}</Row>
            <Row label="Surgeon">{masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}</Row>
            <Row label="Kind">{LIST_KIND_LABELS[list.kind].label}</Row>
            {list.notes !== undefined && list.notes.trim() !== '' && <Row label="Note">{list.notes}</Row>}
            {trail !== undefined && (
              <Row label="Came from">
                {trail.origin === 'request' && trail.source !== undefined ? `${ORIGIN_LABELS.request} · ${SOURCE_LABELS[trail.source]}` : ORIGIN_LABELS[trail.origin]}
                {trail.origin === 'recurringClash' && (
                  <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
                    {recurring !== undefined
                      ? `${format(parseISO(trail.projectedFor?.dateISO ?? list.dateISO), 'EEE')} ${recurring.session} · ${pairingLine(recurring, masters)}`
                      : ORIGIN_SHORT_LABELS.recurringClash}
                    {from !== undefined ? ` · ${unavailableDetail(drSurname(from.name))}` : ''}
                  </div>
                )}
              </Row>
            )}
            {trail !== undefined && (
              <Row label="Since">
                <span className="mono" style={{ fontSize: 13 }}>{format(parseISO(trail.sinceISO), 'd MMM HH:mm')}</span> · {trail.by}
              </Row>
            )}
          </Section>

          <div style={{ fontSize: 13, color: neutral.slate }}>No anaesthetist yet. Nobody's schedule changes until it is assigned.</div>

          {!passed && (
            <Section label="Available that session">
              <div data-shot="draft-list-available" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {short.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No one is free and clear that session. See everyone for who could take it.</div>}
                {short.map((c) => (
                  <div key={c.anaesthetistId} data-available={c.anaesthetistId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', margin: '0 -10px', borderBottom: `1px solid ${neutral.line}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: neutral.ink }}>{surnameFirst(masters.anaesthetists[c.anaesthetistId]?.name ?? c.anaesthetistId)}</span>
                    {c.preferred && <PreferredPill />}
                    <TierPill tier={c.tier} />
                    <DrawerLink onClick={() => setSheet({ assignTo: c.anaesthetistId })}>Assign</DrawerLink>
                  </div>
                ))}
                <button type="button" onClick={() => setSheet('assign')} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: '4px 0', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  See everyone ({everyone})
                </button>
              </div>
            </Section>
          )}

          <Section label={`Bookings (${active.length})`}>
            {bookings.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No Bookings on this {DRAFT_LIST} yet.</div>}
            {bookings.map((booking) => {
              const patient = masters.patients[booking.patientId]
              const cancelled = booking.cancellation !== undefined
              return (
                <div key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', margin: '0 -10px', borderBottom: `1px solid ${neutral.line}`, opacity: cancelled ? 0.5 : 1 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{patient?.name ?? 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: neutral.slate }}>{cancelled ? 'Cancelled' : (booking.scheduledTime ?? 'No time yet')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <DrawerLink onClick={() => onOpenBooking(list.dateISO, booking.id)}>Open</DrawerLink>
                    {!cancelled && <DrawerLink onClick={() => setSheet({ move: booking.id })}>Move</DrawerLink>}
                  </div>
                </div>
              )
            })}
            <button type="button" data-shot="draft-list-add-booking" onClick={() => setSheet('addBooking')} style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: '4px 0', color: accent.base, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Add Booking
            </button>
          </Section>
        </div>

        <div data-testid="admin-list-actions" style={{ padding: 20, borderTop: `1px solid ${neutral.line}`, display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
          <ActionBtn primary disabled={passed} title={passed ? 'This day has passed. Change its date or remove it.' : undefined} onClick={() => setSheet('assign')}>Assign</ActionBtn>
          <ActionBtn onClick={() => setSheet('edit')}>Edit</ActionBtn>
          <ActionBtn onClick={() => setSheet('redate')}>Change date</ActionBtn>
          <ActionBtn disabled={active.length > 0} title={active.length > 0 ? removeBlockedReason(active.length) : undefined} onClick={() => setSheet('remove')}>Remove</ActionBtn>
          <ActionBtn onClick={() => setSheet('history')}>History</ActionBtn>
        </div>
      </div>

      <AssignDraftListSheet
        open={sheet === 'assign' || assignTo !== undefined}
        listId={list.id}
        actor={actor}
        {...(assignTo !== undefined ? { initialAnaesthetistId: assignTo } : {})}
        onClose={() => setSheet('none')}
        requestKey={requestKey}
        onAssigned={(listId, slotId) => {
          setSheet('none')
          onAssigned(listId, slotId)
        }}
        onOpenOccupied={onOpenList}
        onEdit={() => setSheet('edit')}
      />
      <EditListSheet open={sheet === 'edit'} list={list} actor={actor} onClose={() => setSheet('none')} />
      <RedateDraftListSheet open={sheet === 'redate'} listId={list.id} actor={actor} onClose={() => setSheet('none')} onDone={() => setSheet('none')} />
      <RemoveDraftListSheet open={sheet === 'remove'} listId={list.id} actor={actor} onClose={() => setSheet('none')} onDone={() => { setSheet('none'); onClose() }} />
      <HistorySheet open={sheet === 'history'} entityIds={[list.id]} title={`${DRAFT_LIST} history`} onClose={() => setSheet('none')} />
      <AddBookingFlow open={sheet === 'addBooking'} listId={list.id} actor={actor} onClose={() => setSheet('none')} onCreated={() => setSheet('none')} />
      {typeof sheet === 'object' && 'move' in sheet && (
        <MoveBookingFlow open bookingId={sheet.move} actor={actor} onClose={() => setSheet('none')} onMoved={() => setSheet('none')} />
      )}
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
      <span style={{ width: 80, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
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

function ActionBtn({ onClick, children, primary, disabled, title }: { onClick: () => void; children: React.ReactNode; primary?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ flex: primary === true ? '1 1 auto' : '0 0 auto', minWidth: 0, minHeight: 40, padding: '0 12px', borderRadius: radius.ctl, border: primary === true ? 'none' : `1px solid ${neutral.line}`, background: primary === true ? (disabled === true ? neutral.lineStrong : accent.base) : neutral.surface, color: primary === true ? '#FFFFFF' : disabled === true ? neutral.mist : neutral.slate, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', cursor: disabled === true ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}
