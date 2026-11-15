import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { clockISO, useAppStore } from '@proto/store'
import { LIST_KIND_LABELS } from '@proto/domain/types'
import { removeBlockedReason, waitingMinutes } from '@proto/domain/draftLists'
import { sessionText } from '@proto/domain/outOfHours'
import { PAIRING_LABELS, tierLabel } from '@proto/domain/pairingPreferences'
import { drSurname, locationName, pairingLine, waitingLabel } from '@proto/shared/format'
import { DRAFT_LIST, DRAFT_LISTS, DRAFT_STATE, ORIGIN_LABELS, ORIGIN_SHORT_LABELS, SOURCE_LABELS, UNASSIGNED, bookingNoun, unavailableDetail } from '@proto/shared/scheduleTerms'
import { surnameFirst } from '@proto/apps/admin/util'
import { useDraftListCandidates } from '@proto/apps/admin/components/pairing/DraftListCandidates'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HistoryDialog } from './HistorySheet'
import { ConflictBox } from './SlotDrawer'
import { ActionBar, DrawerLink, Echo, Missing, Row, Section, SideDrawer, type DrawerAction } from './parts'

const SHORT_LIST = 5
const LONG_WAIT_MINUTES = 24 * 60

interface Draft {
  origin: string
  source?: string
  sinceISO: string
  by: string
  fromAnaesthetistId?: string
  projectedFor?: { dateISO: string }
  assignedAtISO?: string
}
interface List {
  id: string
  dateISO: string
  session: string
  kind: string
  hospitalId: string
  surgeonId: string
  notes?: string
  recurringBookingId?: string
  conflicts: { cause: string }[]
  state: string
  draft?: Draft
  removedAtISO?: string
  anaesthetistId: string
}
interface Booking {
  id: string
  listId: string
  patientId: string
  cancellation?: unknown
  scheduledTime?: string
}
interface Masters {
  anaesthetists: Record<string, { name: string }>
  surgeons: Record<string, { name: string }>
  patients: Record<string, { name: string }>
  hospitals: Record<string, { name: string }>
  recurringBookings: Record<string, { session: string }>
}
interface Candidate {
  anaesthetistId: string
  tier: string
  preferred: boolean
}

/** The waiting time in mono; a day or more in the warning on-tint (WaitingTime). */
function Waiting({ list }: { list: List }) {
  const nowISO = useAppStore((s: { clock: unknown }) => clockISO(s.clock)) as string
  const minutes = waitingMinutes(list, nowISO) as number
  const long = minutes >= LONG_WAIT_MINUTES && list.removedAtISO === undefined && list.draft?.assignedAtISO === undefined
  return <span className={cn('tw:font-mono tw:tabular-nums', long ? 'tw:font-semibold tw:text-warning-on-tint' : 'tw:font-medium tw:text-slate')}>{waitingLabel(minutes)}</span>
}

/**
 * The Draft List drawer on shadcn Sheet: DRAFT and Unassigned Badges, the
 * hospital, day, waiting time and count; Request, the reminder, Available that
 * session (the first five clear candidates), Bookings and the five actions.
 * Assign's and Remove's disabled reasons are reachable (Tooltip, or a line).
 * History opens the rebuilt HistoryDialog; every other action is stubbed.
 */
function DraftSheet({ list, open, onOpenChange, reasons, layout }: { list: List; open: boolean; onOpenChange: (o: boolean) => void; reasons: 'tooltip' | 'line'; layout: 'buttons' | 'menu' }) {
  const masters: Masters = useAppStore((s: { masters: Masters }) => s.masters)
  const bookingsRecord: Record<string, Booking> = useAppStore((s: { schedule: { bookings: Record<string, Booking> } }) => s.schedule.bookings)
  const today: string = useAppStore((s: { clock: { todayISO: string } }) => s.clock.todayISO)
  // Read-only request key: the prototype's useSuggestionKey bumps a store counter on open.
  const seq: number = useAppStore((s: { shell: { suggestionSeq: number } }) => s.shell.suggestionSeq)
  const candidates = useDraftListCandidates(list.id, `${list.id}:${seq + 1}`, null) as
    | { free: Candidate[]; notPreferred: Candidate[]; notAvailable: Candidate[]; occupied: Candidate[] }
    | undefined
  const [history, setHistory] = useState(false)
  const [stubbed, setStubbed] = useState<string | null>(null)
  const stub = (what: string) => setStubbed(`Would open ${what}: not rebuilt in this row.`)

  const bookings = Object.values(bookingsRecord)
    .filter((b) => b.listId === list.id)
    .sort((a, b) => a.id.localeCompare(b.id))
  const active = bookings.filter((b) => b.cancellation === undefined)
  const short = (candidates?.free ?? []).slice(0, SHORT_LIST)
  const everyone = candidates === undefined ? 0 : candidates.free.length + candidates.notPreferred.length + candidates.notAvailable.length + candidates.occupied.length
  const trail = list.draft
  const passed = list.dateISO < today
  const from = trail?.fromAnaesthetistId !== undefined ? masters.anaesthetists[trail.fromAnaesthetistId] : undefined
  const recurring = list.recurringBookingId !== undefined ? masters.recurringBookings[list.recurringBookingId] : undefined
  const hospital = locationName(list.hospitalId, masters.hospitals) as string

  const actions: DrawerAction[] = [
    { label: 'Assign', primary: true, disabledReason: passed ? 'This day has passed. Change its date or remove it.' : null, onClick: () => stub('Assign') },
    { label: 'Edit', onClick: () => stub('Edit') },
    { label: 'Change date', onClick: () => stub('Change date') },
    { label: 'Remove', disabledReason: active.length > 0 ? (removeBlockedReason(active.length) as string) : null, onClick: () => stub('Remove') },
    { label: 'History', onClick: () => setHistory(true) },
  ]

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        shot="admin-draft-list-drawer-replacement"
        eyebrow={
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <Badge className="tw:text-[11px] tw:leading-4 tw:tracking-[0.06em]">{DRAFT_STATE}</Badge>
            <Badge variant="warning" className="tw:gap-[5px] tw:text-[11px] tw:leading-4">
              <span aria-hidden className="tw:size-1.5 tw:rounded-full tw:bg-warning" />
              {UNASSIGNED}
            </Badge>
          </div>
        }
        title={hospital}
        meta={
          <span className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-slate">
            <span>
              {format(parseISO(list.dateISO), 'EEE d MMM')} · {sessionText(list.session)}
            </span>
            <span aria-hidden>·</span>
            <span>
              Waiting <Waiting list={list} />
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className={cn('tw:font-mono tw:text-[12.5px] tw:font-semibold tw:tabular-nums', active.length === 0 ? 'tw:text-mist' : 'tw:text-slate')}>{active.length}</span> {bookingNoun(active.length)}
            </span>
          </span>
        }
        footer={
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
            <ActionBar actions={actions} reasons={reasons} layout={layout} />
            <Echo>{stubbed ?? ''}</Echo>
          </div>
        }
      >
        <ConflictBox list={list} />
        {passed && (
          <div role="status" className="tw:rounded-ctl tw:bg-sunken tw:px-3 tw:py-2.5 tw:text-[13px] tw:text-slate">
            This day has passed. Change its date or remove it.
          </div>
        )}
        <Section label="Request">
          <Row label="Hospital">{hospital}</Row>
          <Row label="Surgeon">{masters.surgeons[list.surgeonId]?.name ?? list.surgeonId}</Row>
          <Row label="Kind">{LIST_KIND_LABELS[list.kind].label}</Row>
          {list.notes !== undefined && list.notes.trim() !== '' && <Row label="Note">{list.notes}</Row>}
          {trail !== undefined && (
            <Row label="Came from">
              {trail.origin === 'request' && trail.source !== undefined ? `${ORIGIN_LABELS.request} · ${SOURCE_LABELS[trail.source]}` : ORIGIN_LABELS[trail.origin]}
              {trail.origin === 'recurringClash' && (
                <div className="tw:mt-0.5 tw:text-[12.5px] tw:text-slate">
                  {recurring !== undefined
                    ? `${format(parseISO(trail.projectedFor?.dateISO ?? list.dateISO), 'EEE')} ${sessionText(recurring.session)} · ${pairingLine(recurring, masters)}`
                    : ORIGIN_SHORT_LABELS.recurringClash}
                  {from !== undefined ? ` · ${unavailableDetail(drSurname(from.name))}` : ''}
                </div>
              )}
              {(trail.origin === 'movedToOffice' || trail.origin === 'unavailableReturn') && from !== undefined && (
                <div className="tw:mt-0.5 tw:text-[12.5px] tw:text-slate">Returned to the office by {drSurname(from.name)}</div>
              )}
            </Row>
          )}
          {trail !== undefined && (
            <Row label="Since">
              <span className="tw:font-mono tw:text-[13px]">{format(parseISO(trail.sinceISO), 'd MMM HH:mm')}</span> · {trail.by}
            </Row>
          )}
        </Section>

        <div className="tw:text-[13px] tw:text-slate">No anaesthetist yet. Nobody's schedule changes until it is assigned.</div>

        {!passed && (
          <Section label="Available that session">
            <div className="tw:flex tw:flex-col tw:gap-1.5">
              {short.length === 0 && <div className="tw:text-[13px] tw:text-mist">No one is free and clear that session. See everyone for who could take it.</div>}
              {short.map((c) => (
                <div key={c.anaesthetistId} className="tw:-mx-2.5 tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-line tw:px-2.5 tw:py-2">
                  <span className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-ink">{surnameFirst(masters.anaesthetists[c.anaesthetistId]?.name ?? c.anaesthetistId)}</span>
                  {c.preferred && <Badge className="tw:bg-teal-tint tw:text-[11px] tw:leading-4 tw:text-teal-pressed">{PAIRING_LABELS.kind.PREFERRED}</Badge>}
                  <Badge className="tw:text-[11px] tw:leading-4">{tierLabel(c.tier)}</Badge>
                  <DrawerLink onClick={() => stub(`Assign to ${surnameFirst(masters.anaesthetists[c.anaesthetistId]?.name ?? c.anaesthetistId)}`)}>Assign</DrawerLink>
                </div>
              ))}
              <Button variant="link" className="tw:self-start tw:py-1 tw:text-[13px]" onClick={() => stub('See everyone')}>
                See everyone ({everyone})
              </Button>
            </div>
          </Section>
        )}

        <Section label={`Bookings (${active.length})`}>
          {bookings.length === 0 && <div className="tw:text-[13px] tw:text-mist">No Bookings on this {DRAFT_LIST} yet.</div>}
          {bookings.map((b) => {
            const patient = masters.patients[b.patientId]?.name ?? 'Unknown'
            const cancelled = b.cancellation !== undefined
            return (
              <div key={b.id} className={cn('tw:-mx-2.5 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-line tw:px-2.5 tw:py-2', cancelled && 'tw:opacity-50')}>
                <div className="tw:min-w-0">
                  <div className="tw:text-sm tw:font-semibold tw:text-ink">{patient}</div>
                  <div className="tw:text-[11px] tw:text-slate">{cancelled ? 'Cancelled' : (b.scheduledTime ?? 'No time yet')}</div>
                </div>
                <div className="tw:flex tw:flex-none tw:gap-1.5">
                  <DrawerLink label={`Open ${patient}`} onClick={() => stub(`the Booking for ${patient}`)}>
                    Open
                  </DrawerLink>
                  {!cancelled && (
                    <DrawerLink label={`Move ${patient}`} onClick={() => stub(`Move for ${patient}`)}>
                      Move
                    </DrawerLink>
                  )}
                </div>
              </div>
            )
          })}
          <Button variant="link" className="tw:self-start tw:py-1 tw:text-[13px]" onClick={() => stub('Add Booking')}>
            Add Booking
          </Button>
        </Section>
      </SideDrawer>
      <HistoryDialog open={history} onOpenChange={setHistory} entityIds={[list.id]} title={`${DRAFT_LIST} history`} />
    </>
  )
}

export function DraftListDrawerReplacement({ reasons = 'tooltip', layout = 'buttons' }: { reasons?: 'tooltip' | 'line'; layout?: 'buttons' | 'menu' }) {
  const { draftListId } = useSeedIds() as { draftListId?: string }
  const list: List | undefined = useAppStore((s: { schedule: { lists: Record<string, List> } }) => (draftListId !== undefined ? s.schedule.lists[draftListId] : undefined))
  const [open, setOpen] = useState(false)
  if (draftListId === undefined || list === undefined) return <Missing what={DRAFT_LISTS} />
  return (
    <div>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>{`Open ${DRAFT_LIST} drawer`}</Button>
      <DraftSheet list={list} open={open} onOpenChange={setOpen} reasons={reasons} layout={layout} />
    </div>
  )
}
