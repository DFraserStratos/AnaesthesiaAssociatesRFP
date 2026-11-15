import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { draftListsForDate, useAppStore, useConflictLookups, useSlotView } from '@proto/store'
import { describeConflict } from '@proto/domain/conflicts'
import { displayStatusLabel, isClosedKey } from '@proto/domain/slotStatus'
import { isOutOfHours, sessionText } from '@proto/domain/outOfHours'
import { strongestOpen, useListWarnings } from '@proto/shared/warnings'
import { LIST_STATE_LABELS, drSurname, locationName, pairingLine, slotTimeRange } from '@proto/shared/format'
import { DRAFT_LIST, DRAFT_LISTS, bookingCountLabel } from '@proto/shared/scheduleTerms'
import { CLOSE_OUT_OF_HOURS } from '@proto/shared/outOfHoursTerms'
import { surnameFirst } from '@proto/apps/admin/util'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HistoryDialog } from './HistorySheet'
import { ActionBar, DrawerLink, Echo, Row, Section, SideDrawer, StatusBadge, type DrawerAction } from './parts'

interface Times {
  startTime: string
  endTime: string
  overridden: boolean
}
interface Slot {
  id: string
  anaesthetistId: string
  dateISO: string
  session: string
  status: string
  note?: string
}
interface List {
  id: string
  anaesthetistId: string
  dateISO: string
  session: string
  state: string
  kind: string
  hospitalId: string
  surgeonId: string
  notes?: string
  recurringBookingId?: string
  conflicts: { cause: string }[]
  attachments?: unknown[]
}
interface Booking {
  id: string
  listId: string
  patientId: string
  cancellation?: unknown
  completed?: boolean
}
interface Masters {
  anaesthetists: Record<string, { name: string }>
  surgeons: Record<string, { name: string }>
  patients: Record<string, { name: string }>
  hospitals: Record<string, { name: string }>
  slotStatuses: Record<string, unknown>
}
type Stub = (what: string) => void

/** The open-conflicts box at the top of a List's body (ConflictPanel), read-only here. */
export function ConflictBox({ list }: { list: List }) {
  const lookups = useConflictLookups()
  if (list.conflicts.length === 0) return null
  return (
    <Alert variant="warning" className="tw:gap-y-2 tw:rounded-card tw:border-[1.5px] tw:border-warning tw:p-3 tw:leading-[18px]">
      <AlertTitle>{list.conflicts.length === 1 ? 'Conflict' : `${list.conflicts.length} conflicts`}</AlertTitle>
      {list.conflicts.map((c) => {
        const d = describeConflict(c, list, lookups) as { reason: string; detail: string }
        return (
          <AlertDescription key={c.cause} className="tw:flex tw:flex-col tw:gap-0.5 tw:leading-[18px]">
            <span className="tw:font-semibold">{d.reason}</span>
            <span>{d.detail}</span>
          </AlertDescription>
        )
      })}
    </Alert>
  )
}

function ListBody({ list, times, stub }: { list: List; times: Times; stub: Stub }) {
  const bookingsRecord: Record<string, Booking> = useAppStore((s: { schedule: { bookings: Record<string, Booking> } }) => s.schedule.bookings)
  const masters: Masters = useAppStore((s: { masters: Masters }) => s.masters)
  const warningsByBooking = useListWarnings(list.id) as ReadonlyMap<string, unknown[]>
  const bookings = Object.values(bookingsRecord)
    .filter((b) => b.listId === list.id)
    .sort((a, b) => a.id.localeCompare(b.id))
  const active = bookings.filter((b) => b.cancellation === undefined)
  const surgeon = masters.surgeons[list.surgeonId]?.name ?? list.surgeonId
  return (
    <>
      <ConflictBox list={list} />
      <Section label="Session">
        <Row label="Times">
          {slotTimeRange(times)}
          <span className="tw:ml-2 tw:text-xs tw:text-mist">{times.overridden ? 'Own times' : 'Default'}</span>
        </Row>
        <Row label="Hospital">{locationName(list.hospitalId, masters.hospitals)}</Row>
        <Row label="Surgeon">
          {masters.surgeons[list.surgeonId] !== undefined ? (
            <a
              href="#"
              className="tw:font-semibold tw:text-primary tw:no-underline tw:hover:text-teal-pressed tw:hover:underline"
              onClick={(e) => {
                e.preventDefault()
                stub(`the surgeon profile of ${surgeon} (a page link)`)
              }}
            >
              {surgeon}
            </a>
          ) : (
            surgeon
          )}
        </Row>
        {list.notes !== undefined && list.notes.trim() !== '' && <Row label="Note">{list.notes}</Row>}
        {list.recurringBookingId !== undefined && <Row label="Source">From a recurring booking</Row>}
      </Section>
      <Section label={`Bookings (${active.length})`}>
        {bookings.length === 0 && <div className="tw:text-[13px] tw:text-mist">No bookings on this List yet.</div>}
        {bookings.map((b) => {
          const patient = masters.patients[b.patientId]?.name ?? 'Unknown'
          const cancelled = b.cancellation !== undefined
          const strongest = strongestOpen(warningsByBooking.get(b.id) ?? []) as 'mild' | 'strong' | undefined
          return (
            <div
              key={b.id}
              className={cn(
                'tw:-mx-2.5 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-2.5 tw:py-2',
                strongest === undefined ? 'tw:border-b tw:border-line' : 'tw:rounded-ctl',
                strongest === 'strong' && 'tw:shadow-[inset_0_0_0_1.5px_var(--error)]',
                strongest === 'mild' && 'tw:shadow-[inset_0_0_0_1.5px_var(--warning)]',
                cancelled && 'tw:opacity-50',
              )}
            >
              <div className="tw:min-w-0">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-ink">{patient}</div>
                <div className="tw:text-[11px] tw:text-slate">{cancelled ? 'Cancelled' : b.completed === true ? 'Completed' : 'In progress'}</div>
              </div>
              <div className="tw:flex tw:flex-none tw:gap-1.5">
                <DrawerLink label={`Open ${patient}`} onClick={() => stub(`the Booking for ${patient}`)}>
                  Open
                </DrawerLink>
                {!cancelled && list.state !== 'AUTHORISED' && (
                  <DrawerLink label={`Move ${patient}`} onClick={() => stub(`Move for ${patient}`)}>
                    Move
                  </DrawerLink>
                )}
              </div>
            </div>
          )
        })}
      </Section>
      <Section label={`Attachments (${(list.attachments ?? []).length})`}>
        {(list.attachments ?? []).length === 0 && <div className="tw:text-[13px] tw:text-mist">No attachments on this List.</div>}
      </Section>
    </>
  )
}

function EmptyBody({ slot, times, stub }: { slot: Slot; times: Times; stub: Stub }) {
  const statuses: Record<string, unknown> = useAppStore((s: { masters: Masters }) => s.masters.slotStatuses)
  const masters: Masters = useAppStore((s: { masters: Masters }) => s.masters)
  const lists: Record<string, List> = useAppStore((s: { schedule: { lists: Record<string, List> } }) => s.schedule.lists)
  const anae = masters.anaesthetists[slot.anaesthetistId]
  const open = !isClosedKey(statuses, slot.status)
  const waiting = useMemo(
    () => (draftListsForDate({ schedule: { lists } }, slot.dateISO) as List[]).filter((l) => l.session === slot.session),
    [lists, slot.dateISO, slot.session],
  )
  return (
    <>
      <Section label="Session">
        <Row label="Status">
          {displayStatusLabel(slot.status, statuses, true)}
          <Button variant="link" className="tw:ml-2.5 tw:text-[13px]" onClick={() => stub('Change status')}>
            Change status
          </Button>
        </Row>
        <Row label="Times">
          {slotTimeRange(times)}
          <span className="tw:ml-2 tw:text-xs tw:text-mist">{times.overridden ? 'Own times' : 'Default'}</span>
        </Row>
        {slot.note !== undefined && slot.note.trim() !== '' && <Row label="Note">{slot.note}</Row>}
      </Section>
      {open ? (
        <div className="tw:text-[13px] tw:leading-[19px] tw:text-slate">
          No List in this session yet. Assign one to give it a surgeon and hospital{waiting.length > 0 ? `, put a waiting ${DRAFT_LIST} here` : ''}, or book a patient straight from a call.
        </div>
      ) : (
        <div className="tw:rounded-card tw:bg-background tw:p-3 tw:text-[13px] tw:leading-[19px] tw:text-ink">
          This session is marked {displayStatusLabel(slot.status, statuses)}. It needs to be made available, with {anae !== undefined ? drSurname(anae.name) : 'the anaesthetist'}'s agreement, before a List or Booking can go here.
        </div>
      )}
      {open && waiting.length > 0 && (
        <Section label={`${DRAFT_LISTS} for this session (${waiting.length})`}>
          {waiting.map((l) => (
            <div key={l.id} className="tw:-mx-2.5 tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-line tw:px-2.5 tw:py-2">
              <span className="tw:min-w-0 tw:flex-1 tw:text-sm tw:text-ink">{pairingLine(l, masters)}</span>
              <DrawerLink onClick={() => stub(`Assign here for ${l.id}`)}>Assign here</DrawerLink>
            </div>
          ))}
        </Section>
      )}
    </>
  )
}

/**
 * The session drawer on shadcn Sheet: header (name, day and session, state and
 * count, the kind or status Badge), the List's Session / Bookings / Attachments
 * or the empty session's status and waiting Draft Lists, and the action footer.
 * History opens the rebuilt HistoryDialog nested in the Sheet; every other
 * action and link is stubbed to a line in the drawer (they write to the store
 * or leave the page).
 */
function SlotSheet({ slotId, open, onOpenChange, layout }: { slotId: string; open: boolean; onOpenChange: (o: boolean) => void; layout: 'buttons' | 'menu' }) {
  const view = useSlotView(slotId) as { slot: Slot; list?: List; times: Times } | undefined
  const masters: Masters = useAppStore((s: { masters: Masters }) => s.masters)
  const statuses = masters.slotStatuses
  const bookingsRecord: Record<string, Booking> = useAppStore((s: { schedule: { bookings: Record<string, Booking> } }) => s.schedule.bookings)
  const [history, setHistory] = useState(false)
  const [stubbed, setStubbed] = useState<string | null>(null)
  if (view === undefined) return null
  const { slot, list, times } = view
  const stub: Stub = (what) => setStubbed(`Would open ${what}: not rebuilt in this row.`)
  const anae = masters.anaesthetists[(list ?? slot).anaesthetistId]
  const name = anae !== undefined ? (surnameFirst(anae.name) as string) : slot.anaesthetistId
  const day = `${format(parseISO((list ?? slot).dateISO), 'EEE d MMM')} · ${sessionText((list ?? slot).session)}`

  let actions: DrawerAction[]
  if (list !== undefined) {
    const activeCount = Object.values(bookingsRecord).filter((b) => b.listId === list.id && b.cancellation === undefined).length
    actions = [
      { label: 'Edit list', onClick: () => stub('Edit list') },
      ...(list.state !== 'AUTHORISED'
        ? [
            { label: 'Reassign list', onClick: () => stub('Reassign list') },
            { label: 'Change status', onClick: () => stub('Change status') },
          ]
        : []),
      { label: 'History', onClick: () => setHistory(true) },
    ]
    return (
      <>
        <SideDrawer
          open={open}
          onOpenChange={onOpenChange}
          title={name}
          meta={
            <>
              <span className="tw:w-full tw:text-[13px] tw:text-slate">
                {day} · {LIST_STATE_LABELS[list.state]} · {bookingCountLabel(activeCount)}
              </span>
              <span className="tw:mt-1">
                <StatusBadge statusKey={list.kind} />
              </span>
            </>
          }
          footer={
            <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
              <ActionBar actions={actions} layout={layout} wrap />
              <Echo>{stubbed ?? ''}</Echo>
            </div>
          }
        >
          <ListBody list={list} times={times} stub={stub} />
        </SideDrawer>
        <HistoryDialog open={history} onOpenChange={setHistory} entityIds={[list.id, slot.id]} title="List history" />
      </>
    )
  }

  const openSession = !isClosedKey(statuses, slot.status)
  actions = openSession
    ? [
        { label: 'Assign List', primary: true, onClick: () => stub('Assign List') },
        { label: 'Book (phone advice)', onClick: () => stub('Book (phone advice)') },
        { label: 'Edit times', onClick: () => stub('Edit times') },
        { label: 'History', onClick: () => setHistory(true) },
      ]
    : [
        { label: 'Edit times', onClick: () => stub('Edit times') },
        { label: 'History', onClick: () => setHistory(true) },
      ]
  const evening = isOutOfHours(slot) as boolean
  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={name}
        meta={
          <>
            <span className="tw:w-full tw:text-[13px] tw:text-slate">{day}</span>
            <span className="tw:mt-1">
              <StatusBadge statusKey={slot.status} />
            </span>
          </>
        }
        footer={
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
            {layout === 'buttons' && openSession ? (
              <>
                <div className="tw:flex">
                  <ActionBar actions={actions.slice(0, 1)} />
                </div>
                <ActionBar actions={actions.slice(1)} />
              </>
            ) : (
              <ActionBar actions={actions} layout={layout} />
            )}
            {evening && <ActionBar actions={[{ label: CLOSE_OUT_OF_HOURS, onClick: () => stub(CLOSE_OUT_OF_HOURS) }]} />}
            <Echo>{stubbed ?? ''}</Echo>
          </div>
        }
      >
        <EmptyBody slot={slot} times={times} stub={stub} />
      </SideDrawer>
      <HistoryDialog open={history} onOpenChange={setHistory} entityIds={[slot.id]} title="Session history" />
    </>
  )
}

export function SlotDrawerReplacement({ layout = 'buttons' }: { layout?: 'buttons' | 'menu' }) {
  const { activeSlotId, emptySlotId } = useSeedIds() as { activeSlotId?: string; emptySlotId?: string }
  const [slotId, setSlotId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const show = (id: string | undefined) => {
    if (id === undefined) return
    setSlotId(id)
    setOpen(true)
  }
  return (
    <div className="tw:flex tw:flex-wrap tw:gap-2.5">
      <Button variant="outline" size="lg" disabled={activeSlotId === undefined} onClick={() => show(activeSlotId)}>
        Session with a List
      </Button>
      <Button variant="outline" size="lg" disabled={emptySlotId === undefined} onClick={() => show(emptySlotId)}>
        Empty session
      </Button>
      {slotId !== null && <SlotSheet key={slotId} slotId={slotId} open={open} onOpenChange={setOpen} layout={layout} />}
    </div>
  )
}
