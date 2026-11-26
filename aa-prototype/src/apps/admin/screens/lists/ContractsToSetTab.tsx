/**
 * Lists › Contracts to set (US-04.3.12; US-13.1.3): every List, any date, whose Procedures still need
 * a Contract, one row each with how many are set; Lists whose day has passed lead, as they hold up
 * submission. Set Contracts opens the first Procedure's Booking; Open List opens the List on its day.
 * First version: a plain table over `listsNeedingContracts`, the Day rail's Contracts tab as a page.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../../store'
import { neutral } from '../../../../theme/tokens'
import { drSurname, locationName, shortDay } from '../../../../shared/format'
import { sessionText } from '../../../../domain/outOfHours'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { EmptyState, Pill, TextAction } from '../../../../shared/ui'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { useAdminOutlet } from '../../outlet'
import { listsNeedingContracts } from './listsCounts'
import { ListsPage } from './ListsSection'

export function ContractsToSetTab() {
  const { onOpenList } = useAdminOutlet()
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const rows = useMemo(() => listsNeedingContracts({ schedule, masters, clock }), [schedule, masters, clock])
  const procedures = rows.reduce((n, r) => n + r.toSet.length, 0)

  return (
    <ListsPage tab="contracts-to-set" testId="contracts-to-set-tab">
      <PageToolbar
        shot="contracts-to-set-toolbar"
        end={
          <span data-shot="contracts-to-set-count" style={{ color: neutral.ink, fontWeight: 600 }}>
            {rows.length} {rows.length === 1 ? 'List' : 'Lists'}, {procedures} {procedures === 1 ? 'Procedure' : 'Procedures'}
          </span>
        }
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState variant="card" shot="contracts-to-set-empty">
            Every List has its Contracts.
          </EmptyState>
        ) : (
          <TableShell fit shot="contracts-to-set-table" label="Contracts to set" density="compact" minWidth={880}>
            <thead>
              <tr>
                <Th nowrap>List date</Th>
                <Th nowrap>Anaesthetist · List</Th>
                <Th nowrap>Contracts set</Th>
                <Th nowrap align="right">To set</Th>
                <Th nowrap />
                <Th nowrap />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const anae = masters.anaesthetists[r.anaesthetistId]
                const who = anae !== undefined ? drSurname(anae.name) : r.anaesthetistId
                const hospital = locationName(r.hospitalId, masters.hospitals)
                const first = r.toSet[0]!
                const name = `${who}, ${shortDay(r.dateISO)} ${sessionText(r.session)}, ${hospital}`
                const setContracts = () => navigate(`/admin/day/${r.dateISO}/bookings/${first.bookingId}`)
                return (
                  <ClickableRow key={r.listId} onOpen={setContracts} data-list-id={r.listId} data-past={r.past ? 'true' : 'false'}>
                    <Td nowrap bold>
                      <RowOpenButton label={`Set the Contracts on ${name}`} onOpen={setContracts}>
                        {shortDay(r.dateISO)} {sessionText(r.session)}
                      </RowOpenButton>
                    </Td>
                    <Td>
                      <span style={{ fontWeight: 600 }}>{who}</span>
                      <span style={{ color: neutral.slate }}> · {hospital}</span>
                    </Td>
                    <Td nowrap>
                      <Pill tone={r.past ? 'error' : 'neutral'} variant="outline" size="sm" mono>{`${r.set} of ${r.total} set`}</Pill>
                    </Td>
                    <Td mono bold align="right">{r.toSet.length}</Td>
                    <Td nowrap>{r.past && <Pill tone="error" size="sm">Day passed, holds up submission</Pill>}</Td>
                    <Td nowrap align="right">
                      <span style={{ display: 'inline-flex', gap: 12 }}>
                        <TextAction size="sm" flush label={`Set Contracts, ${name}`} onClick={setContracts}>Set Contracts</TextAction>
                        <TextAction size="sm" flush label={`Open List, ${name}`} onClick={() => onOpenList(r.listId)}>Open List</TextAction>
                      </span>
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
