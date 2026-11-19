import { Fragment, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { accent, fontFamily, neutral } from '../../../theme/tokens'
import { billedLists, changedSinceSubmitted, eventPartyName, invoiceCountsByList, procedureOwner, reviewRowsAwaiting, useAppStore, OFFICE_ACTOR, type Actor } from '../../../store'
import { freeFormSubtotal } from '../../../domain/billing/additionalInvoice'
import { creditDetailOf, eventLines } from '../../../domain/billing/procedureEvent'
import type { ProcedureEvent } from '../../../domain/types'
import { procedureLabel } from '../../../domain/billing/procedureStack'
import { daysBetween } from '../../../domain/dateDays'
import { CREDIT_LABELS, EVENT_KIND_LABEL, EVENT_LABELS } from '../../../shared/procedureEventCopy'
import { drSurname, formatCurrency, plural } from '../../../shared/format'
import { EventReviewSheet } from '../flows/EventReviewSheet'
import { ChangedSinceSubmittedPill } from '../components/ChangedSinceSubmitted'
import { dayMicroCap, hhmm, shortDay } from '../../../shared/format'
import type { AssignedList } from '../../../domain/types'
import { listShortLabel, listSourceLabels } from '../util'
import { Card, LineTabLink, LineTabs, PageHeader, TextAction } from '../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'

interface ReviewQueueProps {
  onOpen: (listId: string) => void
  onViewInvoices: () => void
  /** The office, for the Events tab's review step (catch-up Phase 38b); the default office user when not given. */
  actor?: Actor
}

type ReviewTab = 'lists' | 'events'

/**
 * The authorisation review queue (Phase 07): every SUBMITTED list awaiting
 * sanity-check + authorisation, ordered by date then anaesthetist. Selecting one
 * opens the `ReviewScreen`. At the foot, a "Recently billed" panel shows where
 * authorised lists went — the Phase 08 billing run raises invoices in the same
 * moment a list is authorised, so authorising is never a dead end. (An
 * AUTHORISED-but-unbilled list is a transient state that Phase 09's monitor
 * surfaces if a run ever leaves one behind.)
 */
export function ReviewQueue({ onOpen, onViewInvoices, actor = OFFICE_ACTOR }: ReviewQueueProps) {
  const [params] = useSearchParams()
  const tab: ReviewTab = params.get('tab') === 'events' ? 'events' : 'lists'
  const schedule = useAppStore((s) => s.schedule)
  // One per correction: a credit and its new invoices count once (catch-up Phase 39).
  const awaitingEvents = useMemo(() => reviewRowsAwaiting({ schedule }), [schedule])
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const listsRecord = schedule.lists
  const bookingsRecord = schedule.bookings

  const bookingCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(bookingsRecord)) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    return counts
  }, [bookingsRecord])

  const submitTimes = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of audit) if (a.action === 'list.submit') map[a.entityId] = a.atISO
    return map
  }, [audit])

  const submitted = useMemo(
    () =>
      Object.values(listsRecord)
        .filter((l): l is AssignedList => l.state === 'SUBMITTED')
        .sort((a, b) => (a.dateISO === b.dateISO ? a.anaesthetistId.localeCompare(b.anaesthetistId) : a.dateISO.localeCompare(b.dateISO))),
    [listsRecord],
  )

  // The anaesthetist's changes since submit, per queued List (catch-up Phase 38a).
  const changedByList = useMemo(() => {
    const map = new Map<string, NonNullable<ReturnType<typeof changedSinceSubmitted>>>()
    for (const l of submitted) {
      const cue = changedSinceSubmitted({ schedule, audit, masters }, l.id)
      if (cue !== null) map.set(l.id, cue)
    }
    return map
  }, [submitted, schedule, audit, masters])

  const recentlyBilled = useMemo(() => billedLists({ schedule }).slice(0, 6), [schedule])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])

  return (
    <div data-testid="review-queue-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <PageHeader size="admin" title="Review queue" sub={<>Submitted lists awaiting a sanity check and authorisation for billing. {submitted.length} in the queue.</>} />

      {/* Lists (the queue as it was) and Events (catch-up Phase 38b: every event's one review step). */}
      <LineTabs label="Review queue">
        {(
          [
            ['lists', EVENT_LABELS.listsTab, submitted.length],
            ['events', EVENT_LABELS.eventsTab, awaitingEvents.length],
          ] as const
        ).map(([value, label, n]) => {
          const active = tab === value
          return (
            <LineTabLink
              key={value}
              to={value === 'events' ? '?tab=events' : '?'}
              replace
              active={active}
              data-review-tab={value}
              badge={<span style={{ fontFamily: fontFamily.mono, fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: active ? accent.base : neutral.slate }}>{n}</span>}
            >
              {label}
            </LineTabLink>
          )
        })}
      </LineTabs>

      {tab === 'events' ? (
        <EventsQueue actor={actor} />
      ) : (
      <>
      {submitted.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>Nothing awaiting review.</div>
      ) : (
        <TableShell testId="review-queue-table-shell" label="Review queue" density="compact" minWidth={980}>
          <thead>
            <tr>
              <Th>Anaesthetist</Th>
              <Th>List</Th>
              <Th nowrap>List date</Th>
              <Th align="right" nowrap>Bookings</Th>
              <Th nowrap>Submitted</Th>
              <Th nowrap />
            </tr>
          </thead>
          <tbody>
            {submitted.map((list) => {
              const anaesthetist = masters.anaesthetists[list.anaesthetistId]
              const source = listSourceLabels(list, masters)
              return (
                <ClickableRow key={list.id} onOpen={() => onOpen(list.id)}>
                  <Td bold>{anaesthetist?.name ?? 'Anaesthetist unavailable'}</Td>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{source.primary}</div>
                    {source.secondary !== undefined && (
                      <div style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist }}>{source.secondary}</div>
                    )}
                  </Td>
                  <Td mono nowrap>{dayMicroCap(list.dateISO)}</Td>
                  <Td mono bold align="right" nowrap>
                    {bookingCount[list.id] ?? 0}
                  </Td>
                  <Td nowrap>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono">{submitTimes[list.id] !== undefined ? hhmm(submitTimes[list.id]) : 'Submitted'}</span>
                      {changedByList.has(list.id) && <ChangedSinceSubmittedPill cue={changedByList.get(list.id)!} />}
                    </div>
                  </Td>
                  <Td align="right" nowrap>
                    {/* The row's keyboard handle, named in full (U6, U09); the row click stays for the mouse. */}
                    <TextAction
                      size="sm"
                      flush
                      label={`Review ${anaesthetist?.name ?? 'the'} List, ${source.primary}, ${shortDay(list.dateISO)}`}
                      onClick={() => onOpen(list.id)}
                    >
                      Review →
                    </TextAction>
                  </Td>
                </ClickableRow>
              )
            })}
          </tbody>
        </TableShell>
      )}

      {/* Where authorised lists went — the billing run raises invoices immediately. */}
      <Card
        data-testid="review-queue-recently-billed"
        title="Recently billed"
        action={
          <TextAction size="sm" flush onClick={onViewInvoices}>
            View invoices →
          </TextAction>
        }
        style={{ background: neutral.sunken, gap: 8 }}
      >
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          Authorising a list hands it to the Billing Engine as a unit; its invoices are raised in the same moment.
        </div>
        {recentlyBilled.length === 0 ? (
          <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing billed yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentlyBilled.map((l) => (
              <div key={l.id} style={{ fontSize: 12.5, color: neutral.ink }}>
                {listShortLabel(l, masters)} · {dayMicroCap(l.dateISO)}
                <span style={{ color: neutral.mist }}>
                  {' '}· billed {hhmm(l.billedAtISO)} · {invoiceCountByList[l.id] ?? 0} invoice{(invoiceCountByList[l.id] ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
      </>
      )}
    </div>
  )
}

/**
 * Admin Review's Events tab (catch-up Phase 38b; D13): every event awaiting the
 * office's review, oldest first. A row opens the review sheet. A credit
 * (catch-up Phase 39) is one row, "Credit AA-2026-0007 in full, 1 new
 * invoice", with its new invoices nested under it; Approve for billing and
 * Decline act on the whole correction (`reviewRowsAwaiting`).
 */
function EventsQueue({ actor }: { actor: Actor }) {
  const state = useAppStore((s) => s)
  const rows = reviewRowsAwaiting(state)
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>{EVENT_LABELS.queueEmpty}</div>
      ) : (
        <TableShell testId="admin-events-queue" label={EVENT_LABELS.eventsTab} density="compact" minWidth={1100}>
          <thead>
            <tr>
              <Th>Kind</Th>
              <Th>Anaesthetist</Th>
              <Th>Patient</Th>
              <Th>Procedure</Th>
              <Th nowrap>Charge date</Th>
              <Th>Description</Th>
              <Th>Billed to</Th>
              <Th align="right" nowrap>Total ex GST</Th>
              <Th nowrap>Raised by</Th>
              <Th align="right" nowrap>Waiting</Th>
              <Th nowrap />
            </tr>
          </thead>
          <tbody data-shot="admin-events-queue">
            {rows.map(({ event: e, replacements }) => {
              const procedure = state.schedule.procedures[e.procedureId]
              const booking = state.schedule.bookings[e.bookingId]
              const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
              // Whose Procedure it is (`procedureOwner`: the locked payee), as the ownership rule reads it.
              const ownerId = procedureOwner(state, e.procedureId)
              const anaesthetist = ownerId !== undefined ? state.masters.anaesthetists[ownerId] : undefined
              const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
              const partyName = eventPartyName(state, e) ?? ''
              const waiting = Math.max(0, daysBetween(e.addedAtISO.slice(0, 10), state.clock.todayISO))
              const credit = creditDetailOf(e)
              const credited = credit !== undefined ? state.billing.invoices[credit.originalInvoiceId] : undefined
              const description =
                credit !== undefined
                  ? CREDIT_LABELS.reviewRow(credited?.invoiceNumber ?? '', replacements.length)
                  : `${eventLines(e)[0]?.description ?? ''}${eventLines(e).length > 1 ? ` ${EVENT_LABELS.moreLines(eventLines(e).length - 1)}` : ''}`
              const amount = credit !== undefined ? (credited?.subtotal ?? 0) : freeFormSubtotal(eventLines(e))
              return (
                <Fragment key={e.id}>
                <ClickableRow onOpen={() => setOpen(e.id)} data-event-id={e.id} data-kind={e.kind}>
                  <Td bold>{EVENT_KIND_LABEL[e.kind]}</Td>
                  <Td>{anaesthetist !== undefined ? drSurname(anaesthetist.name) : ''}</Td>
                  <Td>{patient?.name ?? ''}</Td>
                  <Td>
                    <div>{procedure !== undefined ? procedureLabel(procedure, state.masters.rvgGroups, 1) : ''}</div>
                    {list !== undefined && <div className="mono" style={{ marginTop: 2, fontSize: 11.5, color: neutral.mist }}>{dayMicroCap(list.dateISO)}</div>}
                  </Td>
                  <Td mono nowrap>{dayMicroCap(e.occurredOnISO)}</Td>
                  <Td>
                    <span data-shot={credit !== undefined ? 'review-credit-row' : undefined}>{description}</span>
                    {credit !== undefined && credit.reason !== '' && <div style={{ marginTop: 2, fontSize: 12, color: neutral.slate }}>{credit.reason}</div>}
                    {credit !== undefined && e.addedBy.role !== 'office' && <div style={{ marginTop: 2, fontSize: 12, color: neutral.slate }}>{EVENT_LABELS.raisedBy(drSurname(e.addedBy.who))}</div>}
                  </Td>
                  <Td>{partyName}</Td>
                  <Td mono bold align="right" nowrap>{formatCurrency(amount)}</Td>
                  <Td nowrap>{e.addedBy.role === 'office' ? 'Office' : drSurname(e.addedBy.who)}</Td>
                  <Td mono align="right" nowrap>{plural(waiting, 'day')}</Td>
                  <Td align="right" nowrap>
                    <TextAction size="sm" flush label={`${EVENT_LABELS.review} the ${EVENT_KIND_LABEL[e.kind].toLowerCase()} for ${patient?.name ?? 'this patient'}`} onClick={() => setOpen(e.id)}>
                      {EVENT_LABELS.review}
                    </TextAction>
                  </Td>
                </ClickableRow>
                {replacements.map((r) => (
                  <NestedReplacementRow key={r.id} event={r} partyName={eventPartyName(state, r) ?? ''} onOpen={() => setOpen(e.id)} />
                ))}
                </Fragment>
              )
            })}
          </tbody>
        </TableShell>
      )}
      <EventReviewSheet eventId={open} actor={actor} onClose={() => setOpen(null)} />
    </>
  )
}

/**
 * A credit's new invoice, nested under its credit's row (catch-up Phase 39):
 * reviewed only with it, so the row opens the credit's review sheet and has
 * no Review of its own.
 */
function NestedReplacementRow({ event, partyName, onOpen }: { event: ProcedureEvent; partyName: string; onOpen: () => void }) {
  const lines = eventLines(event)
  return (
    <ClickableRow onOpen={onOpen} quiet data-event-id={event.id} data-replaces={event.replaces?.creditEventId}>
      <Td>
        <span data-shot="review-credit-replacement" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: `2px solid ${neutral.line}` }}>
          {CREDIT_LABELS.newInvoice}
        </span>
      </Td>
      <Td />
      <Td />
      <Td />
      <Td mono nowrap>{dayMicroCap(event.occurredOnISO)}</Td>
      <Td>{lines[0]?.description ?? ''}{lines.length > 1 ? ` ${EVENT_LABELS.moreLines(lines.length - 1)}` : ''}</Td>
      <Td>{partyName}</Td>
      <Td mono align="right" nowrap>{formatCurrency(freeFormSubtotal(lines))}</Td>
      <Td />
      <Td />
      <Td />
    </ClickableRow>
  )
}
