/**
 * Lists › To authorise (US-07.2.4; US-13.1.3): every submitted List waiting for the office to check
 * and authorise it for billing, by List date then anaesthetist. A row opens the List's review page
 * (`reviewPath`). The rail shows where authorised Lists went: the billing run raises a List's invoices
 * in the moment it is authorised. First version: the old Review queue's Lists tab moved under the Lists
 * section; procedure events awaiting approval now live in Finances › Payments.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { neutral } from '../../../../theme/tokens'
import { billedLists, changedSinceSubmitted, invoiceCountsByList, useAppStore } from '../../../../store'
import { useScreenTiming } from '../../../../shared/scale/useScreenTiming'
import { dayMicroCap, hhmm, shortDay } from '../../../../shared/format'
import type { List } from '../../../../domain/types'
import { Card, EmptyState, TextAction } from '../../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { ChangedSinceSubmittedPill } from '../../components/ChangedSinceSubmitted'
import { PageBody } from '../../components/AdminPage'
import { listShortLabel, listSourceLabels } from '../../util'
import { financePath } from '../finances/financePaths'
import { listsToAuthorise } from './listsCounts'
import { reviewPath } from './listsPaths'
import { ListsPage } from './ListsSection'

export function ToAuthoriseTab() {
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const audit = useAppStore((s) => s.audit)
  const onOpen = (listId: string) => navigate(reviewPath(listId))

  const bookingCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of Object.values(schedule.bookings)) {
      if (c.cancellation === undefined) counts[c.listId] = (counts[c.listId] ?? 0) + 1
    }
    return counts
  }, [schedule.bookings])

  const submitTimes = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of audit) if (a.action === 'list.submit') map[a.entityId] = a.atISO
    return map
  }, [audit])

  const submitted = useMemo(() => listsToAuthorise({ schedule }), [schedule])

  // The anaesthetist's changes since submit, per List (catch-up Phase 38a).
  const changedByList = useMemo(() => {
    const map = new Map<string, NonNullable<ReturnType<typeof changedSinceSubmitted>>>()
    for (const l of submitted) {
      const cue = changedSinceSubmitted({ schedule, audit, masters }, l.id)
      if (cue !== null) map.set(l.id, cue)
    }
    return map
  }, [submitted, schedule, audit, masters])

  const recentlyBilled = useMemo(() => billedLists({ schedule }).slice(0, 6), [schedule])
  // Timed at both scales, indexed, not paged: its backlog is a few hundred Lists at most (catch-up Phase 43).
  useScreenTiming('review', [submitted])
  const invoiceCountByList = useMemo(() => invoiceCountsByList({ schedule, billing }), [schedule, billing])

  return (
    <ListsPage tab="to-authorise" testId="review-queue-screen">
      <PageBody railLabel="Recently billed" rail={<RecentlyBilledCard lists={recentlyBilled} invoiceCountByList={invoiceCountByList} onViewInvoices={() => navigate(financePath('invoices'))} />}>
        {submitted.length === 0 ? (
          <EmptyState variant="card">Nothing waiting to be authorised.</EmptyState>
        ) : (
          <TableShell fit testId="review-queue-table-shell" label="To authorise" density="compact" minWidth={540}>
            <thead>
              <tr>
                <Th nowrap>Anaesthetist · List</Th>
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
                  <ClickableRow key={list.id} onOpen={() => onOpen(list.id)} data-list-id={list.id}>
                    <Td>
                      <div style={{ fontWeight: 600 }}>{anaesthetist?.name ?? 'Anaesthetist unavailable'}</div>
                      <div style={{ marginTop: 2, fontSize: 12.5, color: neutral.slate }}>
                        {source.primary}
                        {source.secondary !== undefined && <span style={{ color: neutral.mist }}> · {source.secondary}</span>}
                      </div>
                      {changedByList.has(list.id) && (
                        <div style={{ marginTop: 6 }}>
                          <ChangedSinceSubmittedPill cue={changedByList.get(list.id)!} />
                        </div>
                      )}
                    </Td>
                    <Td mono nowrap>{dayMicroCap(list.dateISO)}</Td>
                    <Td mono bold align="right" nowrap>
                      {bookingCount[list.id] ?? 0}
                    </Td>
                    <Td mono nowrap>{submitTimes[list.id] !== undefined ? hhmm(submitTimes[list.id]) : 'Submitted'}</Td>
                    <Td align="right" nowrap>
                      {/* The row's keyboard handle, named in full; the row click stays for the mouse. */}
                      <TextAction size="sm" flush label={`Review ${anaesthetist?.name ?? 'the'} List, ${source.primary}, ${shortDay(list.dateISO)}`} onClick={() => onOpen(list.id)}>
                        Review →
                      </TextAction>
                    </Td>
                  </ClickableRow>
                )
              })}
            </tbody>
          </TableShell>
        )}
      </PageBody>
    </ListsPage>
  )
}

/**
 * The rail card: where authorised Lists went. The billing run raises a List's invoices in the moment
 * it is authorised, so authorising is never a dead end.
 */
function RecentlyBilledCard({ lists, invoiceCountByList, onViewInvoices }: { lists: List[]; invoiceCountByList: Record<string, number>; onViewInvoices: () => void }) {
  const masters = useAppStore((s) => s.masters)
  return (
    <Card
      data-testid="review-queue-recently-billed"
      title="Recently billed"
      action={
        <TextAction size="sm" flush onClick={onViewInvoices}>
          View invoices →
        </TextAction>
      }
      style={{ gap: 10 }}
    >
      <div style={{ fontSize: 12.5, color: neutral.slate }}>
        Authorising a list hands it to the Billing Engine as a unit; its invoices are raised in the same moment.
      </div>
      {lists.length === 0 ? (
        <div style={{ fontSize: 12.5, color: neutral.mist }}>Nothing billed yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lists.map((l) => {
            const n = invoiceCountByList[l.id] ?? 0
            return (
              <div key={l.id} style={{ fontSize: 12.5 }}>
                <div style={{ color: neutral.ink, fontWeight: 600 }}>{listShortLabel(l, masters)}</div>
                <div style={{ marginTop: 2, color: neutral.mist }}>
                  <span className="mono">{dayMicroCap(l.dateISO)}</span> · billed <span className="mono">{l.billedAtISO !== undefined ? hhmm(l.billedAtISO) : ''}</span> · {n} invoice{n === 1 ? '' : 's'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
