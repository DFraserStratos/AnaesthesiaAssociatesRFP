import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { AddBookingFlow, type AddBookingMode } from '../../shared/flows'
import { useDemoTriggerMemory } from '../../shared/demoTriggers/memory'
import { SlideStack, type SlideLayer } from './components'
import {
  AvailabilityScreen,
  MyAvailabilityCalendarScreen,
  BalancesScreen,
  BookingDetailScreen,
  ForwardListsScreen,
  ListDetailScreen,
  MoreScreen,
} from './screens'
import { LegacyBookingRedirect, legacyBookingPath } from '../../shared/legacy'
import { availabilityStackLocation, listsStackLocation } from './navigation'
import { useAnaesthetistStatusChoices, useSurface } from '../../shared'
import { AvailabilityEditor } from '../../shared/availability'
import { SEED_STATUS } from '../../domain/slotStatus'
import { useMobileOutlet } from './outlet'

/**
 * The mobile app's route elements. The three simple tabs are thin wrappers; the
 * Lists tab is one splat route hosting the whole slide stack, with its depth and
 * ids read off the URL.
 */

// ---------------------------------------------------------------------------
// Lists — `/mobile/lists/*` (the slide stack)
// ---------------------------------------------------------------------------

export function MobileListsRoute() {
  const { actor, anaesthetistId, personaName, initials } = useMobileOutlet()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { depth, listId: urlListId, bookingId: urlBookingId } = listsStackLocation(pathname)

  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState<AddBookingMode>('manual')
  const [addResetKey, setAddResetKey] = useState(0)

  // "Photo capture (Future scope)" (catch-up Phase 15b): the demo action leaves
  // a UI-only request for the List in the URL; this opens the Add a booking
  // sheet on the photo prong and clears it. Photo capture is Future Work
  // (US-02.4.4), so the List's own "Add a booking" never reaches it.
  const photoRequest = useDemoTriggerMemory((m) => m.photoCaptureRequest)
  useEffect(() => {
    if (photoRequest === null || photoRequest.listId !== urlListId) return
    setAddMode('photo')
    setAddResetKey(photoRequest.n)
    setAddOpen(true)
    useDemoTriggerMemory.getState().clearPhotoCaptureRequest()
  }, [photoRequest, urlListId])

  // A POPPED layer has to stay mounted so it can slide out — exactly what the
  // old `onBack={() => setDepth(0)}` did, which moved depth but left listId /
  // bookingId in place. So the last-seen ids are remembered here and never cleared:
  // the URL drives which layer is ACTIVE, this ref keeps the outgoing one alive.
  const seen = useRef<{ listId: string | null; bookingId: string | null }>({ listId: null, bookingId: null })
  useEffect(() => {
    if (urlListId !== null) seen.current.listId = urlListId
    if (urlBookingId !== null) seen.current.bookingId = urlBookingId
  }, [urlListId, urlBookingId])

  // Stale ids fall back a layer rather than blanking (URLs outlive the seed).
  // A List she has moved on (catch-up Phase 32) has left her schedule: back to Lists, like a stale id.
  const listMissing = useAppStore((s) => {
    if (urlListId === null) return false
    const l = s.schedule.lists[urlListId]
    return l === undefined || l.state === 'DRAFT' || l.anaesthetistId !== anaesthetistId
  })
  const bookingMissing = useAppStore((s) => urlBookingId !== null && s.schedule.bookings[urlBookingId] === undefined)
  // A pre-Phase-15 `/cards/` link: hand it to the `/bookings/` URL first.
  if (legacyBookingPath(pathname) !== null) return <LegacyBookingRedirect />
  if (listMissing) return <Navigate to="/mobile/lists" replace />
  if (bookingMissing) return <Navigate to={`/mobile/lists/${urlListId}`} replace />

  const listId = urlListId ?? seen.current.listId
  const bookingId = urlBookingId ?? seen.current.bookingId
  // Both pops REPLACE the current entry. Drill-ins stay pushes, so history
  // still records the way in, but a pop that PUSHED left the screen just exited
  // sitting FORWARD of us: installed as a PWA the OS back gesture is history,
  // and one press after a chevron tap re-drilled into the booking instead of
  // unwinding. Replace is not free either — it leaves the destination twice in a
  // row ([lists, list, list] after popping a booking), so the first system back
  // press after a pop lands on an identical URL and nothing visibly moves. One
  // dead press beats a surprise re-entry.
  const backToLists = () => navigate('/mobile/lists', { replace: true })
  const backToList = () =>
    navigate(listId !== null ? `/mobile/lists/${listId}` : '/mobile/lists', { replace: true })

  // Edge-swipe-back on the drilled-in layer, wired per depth to the SAME two
  // handlers the on-screen back affordances use. Deliberately not a history
  // `go(-1)`: the stack's depth lives in the URL, but history can also hold
  // entries that are not part of this stack (a tab switch, or a deep link
  // landed on directly), so stepping back would sometimes leave the Lists tab
  // altogether. Installed as a PWA there is no browser chrome to fall back on,
  // which is exactly why the gesture exists. The alternative that would spend
  // the duplicate entry — counting how many entries behind us this stack pushed
  // and calling `go(-1)` only then — needs bookkeeping that a refresh or a deep
  // link wipes, which is the same unreliability, just hidden.
  const popLayer = depth === 2 ? backToList : depth === 1 ? backToLists : undefined

  const listsLayers: SlideLayer[] = [
    {
      key: 'home',
      mounted: true,
      node: (
        <ForwardListsScreen
          anaesthetistId={anaesthetistId}
          personaName={personaName}
          initials={initials}
          onOpenList={(id) => navigate(`/mobile/lists/${id}`)}
        />
      ),
    },
    {
      key: 'list',
      mounted: listId !== null,
      node:
        listId !== null ? (
          <ListDetailScreen
            listId={listId}
            actor={actor}
            onBack={backToLists}
            onOpenBooking={(id) => navigate(`/mobile/lists/${listId}/bookings/${id}`)}
            onAddBooking={() => {
              setAddMode('manual')
              setAddOpen(true)
            }}
          />
        ) : null,
    },
    {
      key: 'booking',
      mounted: bookingId !== null,
      node:
        bookingId !== null ? (
          <BookingDetailScreen key={bookingId} bookingId={bookingId} actor={actor} onBack={backToList} />
        ) : null,
    },
  ]

  return (
    <>
      <SlideStack layers={listsLayers} depth={depth} onPop={popLayer} />

      {listId !== null && (
        <AddBookingFlow
          open={addOpen}
          listId={listId}
          actor={actor}
          initialMode={addMode}
          resetKey={addResetKey}
          onClose={() => {
            setAddOpen(false)
            setAddMode('manual')
          }}
          onCreated={() => undefined}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// The other three tabs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Availability — `/mobile/availability/*` (catch-up Phase 29): Find cover, then
// My calendar slid in at `/mobile/availability/calendar`; a day's sessions and
// the form in one bottom sheet.
// ---------------------------------------------------------------------------

interface AvailabilitySheet {
  fromISO: string
  /** "Add days off": open on the form, preset. */
  addDaysOff?: boolean
}

export function MobileAvailabilityRoute() {
  const { actor, anaesthetistId, initials } = useMobileOutlet()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { depth } = availabilityStackLocation(pathname)
  const [sheet, setSheet] = useState<AvailabilitySheet | null>(null)
  const { Overlay } = useSurface()
  // "Add days off" opens on On holiday (its fixed ID) while it is offered, else the first closed choice.
  const choices = useAnaesthetistStatusChoices()
  const presetStatus = (choices.find((s) => s.key === SEED_STATUS.holiday) ?? choices.find((s) => !s.bookable))?.key
  // Seen once, the calendar stays mounted so it can slide out when popped.
  const seenCalendar = useRef(false)
  if (depth === 1) seenCalendar.current = true

  const backToFindCover = () => navigate('/mobile/availability', { replace: true })

  const layers: SlideLayer[] = [
    {
      key: 'availability',
      mounted: true,
      node: (
        <AvailabilityScreen
          anaesthetistId={anaesthetistId}
          initials={initials}
          onChangeDay={(dateISO) => setSheet({ fromISO: dateISO })}
          onOpenCalendar={() => navigate('/mobile/availability/calendar')}
        />
      ),
    },
    {
      key: 'calendar',
      mounted: seenCalendar.current,
      node: (
        <MyAvailabilityCalendarScreen
          actor={actor}
          anaesthetistId={anaesthetistId}
          onBack={backToFindCover}
          onOpenDay={(dateISO) => setSheet({ fromISO: dateISO })}
          onAddDaysOff={(fromISO) => setSheet({ fromISO, addDaysOff: true })}
        />
      ),
    },
  ]

  return (
    <>
      <SlideStack layers={layers} depth={depth} onPop={depth === 1 ? backToFindCover : undefined} />
      <Overlay open={sheet !== null} onClose={() => setSheet(null)}>
        {sheet !== null && (
          <AvailabilityEditor
            key={`${sheet.fromISO}-${sheet.addDaysOff === true ? 'add' : 'day'}`}
            actor={actor}
            anaesthetistId={anaesthetistId}
            fromISO={sheet.fromISO}
            {...(sheet.addDaysOff === true
              ? { formPreset: { sessions: 'both' as const, span: 'week' as const, ...(presetStatus !== undefined ? { statusKey: presetStatus } : {}) } }
              : {})}
            shot="mobile-availability-sheet"
            onDone={() => setSheet(null)}
          />
        )}
      </Overlay>
    </>
  )
}

export function MobileBalancesRoute() {
  const { anaesthetistId, initials } = useMobileOutlet()
  return <BalancesScreen initials={initials} anaesthetistId={anaesthetistId} />
}

export function MobileMoreRoute() {
  const { personaName, personaRole, initials, moreExtra } = useMobileOutlet()
  return <MoreScreen personaName={personaName} personaRole={personaRole} initials={initials} extra={moreExtra} />
}
