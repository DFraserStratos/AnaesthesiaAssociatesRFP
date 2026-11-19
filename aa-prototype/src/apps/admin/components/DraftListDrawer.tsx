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
import { format, parseISO } from 'date-fns'
import { neutral } from '../../../theme/tokens'
import { useAppStore, type Actor } from '../../../store'
import { useDemoTriggerContext } from '../../../shared/demoTriggers'
import { HistorySheet } from '../../../shared/booking'
import { AddBookingFlow } from '../../../shared/flows'
import { LIST_KIND_LABELS, type List } from '../../../domain/types'
import { isDraftList } from '../../../domain/draftLists'
import { drSurname, locationName, pairingLine, shortDay } from '../../../shared/format'
import { DRAFT_LIST, ORIGIN_LABELS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, unavailableDetail } from '../../../shared/scheduleTerms'
import { removeBlockedReason } from '../../../domain/draftLists'
import { surnameFirst } from '../util'
import { ConflictPanel } from './conflicts/ConflictPanel'
import { EditListSheet } from '../flows/EditListSheet'
import { MoveBookingFlow } from '../flows/MoveBookingFlow'
import { AssignDraftListSheet } from '../flows/AssignDraftListSheet'
import { RedateDraftListSheet } from '../flows/RedateDraftListSheet'
import { RemoveDraftListSheet } from '../flows/RemoveDraftListSheet'
import { TierPill, PreferredPill, useSuggestionKey } from './pairing'
import { useDraftListCandidates } from './pairing/DraftListCandidates'
import { BookingCount, DraftStateChip, UnassignedPill, WaitingTime } from './draftLists/DraftListParts'
import { DRAWER_ACTION, DRAWER_ACTION_PRIMARY, DrawerLink, Section } from './drawerParts'
import { Button, DefList, DefRow, TextAction } from '../../../shared/ui'
import { SidePanel } from './SidePanel'
import { sessionText } from '../../../domain/outOfHours'
import { Notice } from '../../../shared/ui/Notice'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { withStubsInTimeOrder } from '../../../domain/intake/stubs'
import { useListStubs } from '../../../store/stubSelectors'
import { StubRow } from '../../../shared/stubs'
import { StubResolveLink } from './StubResolveLink'
import { ListOriginRow } from './ListOriginRow'
import { useListUpdateEmail } from '../flows/UpdateEmailActions'

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
  // Stubs for rows waiting at intake (catch-up Phase 33a): drawn among the Bookings, never counted.
  const stubs = useListStubs(list.id)
  // A Draft List that had an anaesthetist before: its earlier change of anaesthetist can still be emailed (catch-up Phase 35).
  const updateEmail = useListUpdateEmail(list.id, actor, DRAWER_ACTION)
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
      <SidePanel
        open
        onClose={onClose}
        width="list"
        testId="admin-list-drawer"
        shot="admin-draft-list-drawer"
        panelAttrs={{ 'data-list-id': list.id }}
        bodyGap={18}
        above={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <DraftStateChip />
              <UnassignedPill />
            </div>
        }
        title={locationName(list.hospitalId, masters.hospitals)}
        meta={
            <div style={{ fontSize: 13, color: neutral.slate, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{shortDay(list.dateISO)} · {sessionText(list.session)}</span>
              <span aria-hidden>·</span>
              <span>Waiting <WaitingTime list={list} /></span>
              <span aria-hidden>·</span>
              <BookingCount count={active.length} style={{ fontSize: 12.5 }} noun />
            </div>
        }
        footerTestId="admin-list-actions"
        footerLayout="wrap"
        footer={
          <>
          {/* Assign's reason is printed by the body's Notice, so it keeps only the title here. */}
          <Button variant="primary" size="compact" style={DRAWER_ACTION_PRIMARY} disabled={passed} {...(passed ? { title: 'This day has passed. Change its date or remove it.' } : {})} onClick={() => setSheet('assign')}>Assign</Button>
          <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('edit')}>Edit</Button>
          <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('redate')}>Change date</Button>
          <Button variant="secondary" size="compact" style={DRAWER_ACTION} disabled={active.length > 0} {...(active.length > 0 ? { title: removeBlockedReason(active.length), disabledReason: removeBlockedReason(active.length) } : {})} onClick={() => setSheet('remove')}>Remove</Button>
          <Button variant="secondary" size="compact" style={DRAWER_ACTION} onClick={() => setSheet('history')}>History</Button>
          {updateEmail.button}
          </>
        }
      >
          <ConflictPanel list={list} actor={actor} />
          {passed && (
            <Notice tone="neutral" live="status">
              This day has passed. Change its date or remove it.
            </Notice>
          )}

          <Section label="Request">
            <DefList>
              <DefRow label="Hospital">{locationName(list.hospitalId, masters.hospitals)}</DefRow>
              <DefRow label="Surgeon">{masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}</DefRow>
              <DefRow label="Kind">{LIST_KIND_LABELS[list.kind].label}</DefRow>
              {list.notes !== undefined && list.notes.trim() !== '' && <DefRow label="Note">{list.notes}</DefRow>}
              <ListOriginRow list={list} />
              {trail !== undefined && (
                <DefRow label="Came from">
                  {trail.origin === 'request' && trail.source !== undefined ? `${ORIGIN_LABELS.request} · ${SOURCE_LABELS[trail.source]}` : ORIGIN_LABELS[trail.origin]}
                  {trail.origin === 'recurringClash' && (
                    <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
                      {recurring !== undefined
                        ? `${format(parseISO(trail.projectedFor?.dateISO ?? list.dateISO), 'EEE')} ${sessionText(recurring.session)} · ${pairingLine(recurring, masters)}`
                        : ORIGIN_SHORT_LABELS.recurringClash}
                      {from !== undefined ? ` · ${unavailableDetail(drSurname(from.name))}` : ''}
                    </div>
                  )}
                  {/* Catch-up Phase 32: the anaesthetist's own return (US-13.8.2). */}
                  {(trail.origin === 'movedToOffice' || trail.origin === 'unavailableReturn') && from !== undefined && (
                    <div data-shot="draft-list-returned-by" style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
                      Returned to the office by {drSurname(from.name)}
                    </div>
                  )}
                </DefRow>
              )}
              {trail !== undefined && (
                <DefRow label="Since">
                  <span className="mono" style={{ fontSize: 13 }}>{format(parseISO(trail.sinceISO), 'd MMM HH:mm')}</span> · {trail.by}
                </DefRow>
              )}
            </DefList>
          </Section>

          <div style={{ fontSize: 13, color: neutral.slate }}>No anaesthetist yet. Nobody's schedule changes until it is assigned.</div>

          {!passed && (
            <Section label="Available that session">
              <div data-shot="draft-list-available" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {short.length === 0 && <EmptyState>No one is free and clear that session. See everyone for who could take it.</EmptyState>}
                {short.map((c) => (
                  <div key={c.anaesthetistId} data-available={c.anaesthetistId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', margin: '0 -10px', borderBottom: `1px solid ${neutral.line}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: neutral.ink }}>{surnameFirst(masters.anaesthetists[c.anaesthetistId]?.name ?? c.anaesthetistId)}</span>
                    {c.preferred && <PreferredPill />}
                    <TierPill tier={c.tier} />
                    <DrawerLink onClick={() => setSheet({ assignTo: c.anaesthetistId })}>Assign</DrawerLink>
                  </div>
                ))}
                <TextAction size="sm" onClick={() => setSheet('assign')} style={{ alignSelf: 'flex-start' }}>
                  See everyone ({everyone})
                </TextAction>
              </div>
            </Section>
          )}

          <Section label={`Bookings (${active.length})`}>
            {bookings.length === 0 && stubs.length === 0 && <EmptyState>No Bookings on this {DRAFT_LIST} yet.</EmptyState>}
            {withStubsInTimeOrder(bookings, (b) => b.scheduledTime, stubs).map((entry) => {
              if (entry.kind === 'stub') {
                return <StubRow key={entry.stub.id} stub={entry.stub} density="table" trailing={<StubResolveLink stub={entry.stub} />} style={{ margin: '6px 0' }} />
              }
              const booking = entry.booking
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
            <TextAction size="sm" shot="draft-list-add-booking" onClick={() => setSheet('addBooking')} style={{ alignSelf: 'flex-start' }}>
              Add Booking
            </TextAction>
          </Section>
      </SidePanel>

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
      {updateEmail.composer}
      <AddBookingFlow open={sheet === 'addBooking'} listId={list.id} actor={actor} onClose={() => setSheet('none')} onCreated={() => setSheet('none')} />
      {typeof sheet === 'object' && 'move' in sheet && (
        <MoveBookingFlow open bookingId={sheet.move} actor={actor} onClose={() => setSheet('none')} onMoved={() => setSheet('none')} />
      )}
    </>
  )
}
