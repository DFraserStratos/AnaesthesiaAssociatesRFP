import { useMemo, useState } from 'react'
import { sessionText } from '../../../domain/outOfHours'
import { locationName, plainDate } from '../../../shared/format'
import { TableShell, Td, Th } from '../../../shared/table'
import { Card, EmptyState, TextAction } from '../../../shared/ui'
import { useAppStore, useToday } from '../../../store'
import { PROFILE_WIDE_CARD } from './ProfileChrome'

/** How many past Lists show before See all. */
const FEW = 5

/**
 * The anaesthetist's past work, readable whatever their status (build plan
 * Phase 52; US-12.1.6 "History readable"): their latest past Lists (date,
 * hospital, surgeon), See all expanding in place, and their ledger page for
 * invoices and payments. Shown for every anaesthetist; 54 places it on the
 * anaesthetist's page as it is.
 *
 * Hooks: `anaesthetist-history` (rows `anaesthetist-history-row`, `data-list-id`),
 * `anaesthetist-history-all`, `anaesthetist-ledger-link`.
 */
export function AnaesthetistHistoryCard({ anaesthetistId }: { anaesthetistId: string }) {
  const todayISO = useToday()
  const lists = useAppStore((s) => s.schedule.lists)
  const masters = useAppStore((s) => s.masters)
  const [all, setAll] = useState(false)
  const past = useMemo(
    () =>
      Object.values(lists)
        .filter((l) => l.anaesthetistId === anaesthetistId && l.dateISO < todayISO)
        .sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.session.localeCompare(a.session)),
    [lists, anaesthetistId, todayISO],
  )
  const shown = all ? past : past.slice(0, FEW)

  return (
    <Card
      style={PROFILE_WIDE_CARD}
      title="Past Lists"
      shot="anaesthetist-history"
      action={
        <TextAction size="sm" flush to={`/admin/ledger/anaesthetists/${anaesthetistId}`} shot="anaesthetist-ledger-link">
          Invoices and payments
        </TextAction>
      }
    >
      {past.length === 0 ? (
        <EmptyState>No past Lists.</EmptyState>
      ) : (
        <>
          <TableShell label="Past Lists" density="dense">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Hospital</Th>
                <Th>Surgeon</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id} data-shot="anaesthetist-history-row" data-list-id={l.id}>
                  <Td mono nowrap>{plainDate(l.dateISO)}</Td>
                  <Td>{`${locationName(l.hospitalId, masters.hospitals)} ${sessionText(l.session)}`}</Td>
                  <Td>{masters.surgeons[l.surgeonId]?.name ?? l.surgeonId}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {past.length > FEW && (
            <div>
              <TextAction size="sm" flush onClick={() => setAll(!all)} shot="anaesthetist-history-all">
                {all ? 'Show fewer' : `See all ${past.length} past Lists`}
              </TextAction>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
