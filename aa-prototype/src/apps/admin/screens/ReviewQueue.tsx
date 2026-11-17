import { useMemo } from 'react'
import { neutral } from '../../../theme/tokens'
import { billedLists, changedSinceSubmitted, invoiceCountsByList, useAppStore } from '../../../store'
import { ChangedSinceSubmittedPill } from '../components/ChangedSinceSubmitted'
import { dayMicroCap, hhmm, shortDay } from '../../../shared/format'
import type { AssignedList } from '../../../domain/types'
import { listShortLabel, listSourceLabels } from '../util'
import { Card, PageHeader, TextAction } from '../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'

interface ReviewQueueProps {
  onOpen: (listId: string) => void
  onViewInvoices: () => void
}

/**
 * The authorisation review queue (Phase 07): every SUBMITTED list awaiting
 * sanity-check + authorisation, ordered by date then anaesthetist. Selecting one
 * opens the `ReviewScreen`. At the foot, a "Recently billed" panel shows where
 * authorised lists went — the Phase 08 billing run raises invoices in the same
 * moment a list is authorised, so authorising is never a dead end. (An
 * AUTHORISED-but-unbilled list is a transient state that Phase 09's monitor
 * surfaces if a run ever leaves one behind.)
 */
export function ReviewQueue({ onOpen, onViewInvoices }: ReviewQueueProps) {
  const schedule = useAppStore((s) => s.schedule)
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
    </div>
  )
}
