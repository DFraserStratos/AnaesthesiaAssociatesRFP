/**
 * Waiting for NHI (catch-up Phase 40, item 12; US-11.1.5): one row per intake
 * row the office must add an NHI to, from `waitingNhiRows`. Each row shows the
 * patient as received, its List (or the date and hospital when none exists),
 * 33a's stub chip, the ONE address to chase (D74; the others offered to switch
 * to), the days to go with an Urgent pill, and when the office last asked.
 * Email for the NHI is a real `mailto:` link (audited on click through
 * `requestNhiFromOffice`); Add NHI opens the sheet. Nothing here makes a
 * Booking or a patient: the rows are not Bookings yet.
 */

import { useMemo, useState } from 'react'
import { nhiRequestEmailFor, requestNhiFromOffice, useAppStore, type Actor, type WaitingNhiRow } from '../../../../store'
import { Button, EmptyState, FormError, Pill, SelectField, TextAction } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { formatDob, plural, shortDay, stampText } from '../../../../shared/format'
import { sessionText } from '../../../../domain/outOfHours'
import { neutral } from '../../../../theme/tokens'
import { StubMarker } from '../../../../shared/stubs'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { AddNhiSheet } from './AddNhiSheet'

export const WAITING_NHI_CAPTION =
  'These rows are not Bookings yet. Each stands as a stub on its List; nothing is created until the office adds the NHI.'

export function WaitingNhiView({
  rows,
  actor,
  onOpenList,
  onOpenMatching,
}: {
  rows: readonly WaitingNhiRow[]
  actor: Actor
  onOpenList: (listId: string) => void
  onOpenMatching: (rowId: string) => void
}) {
  // The row object, not its id: the sheet keeps showing its confirmation after the row leaves the list.
  const [sheetRow, setSheetRow] = useState<WaitingNhiRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <PageToolbar end={<span className="mono">{plural(rows.length, 'row')}</span>}>
        <span style={{ fontSize: 13, color: neutral.slate }}>{WAITING_NHI_CAPTION}</span>
      </PageToolbar>
      <PageBody>
      <FormError message={error} />
      {rows.length === 0 ? (
        <EmptyState variant="card" shot="waiting-nhi-empty">No intake rows are waiting for an NHI.</EmptyState>
      ) : (
        // List takes the spare width; the actions stack in their own column, so the table fits 1008 at 1280.
        <TableShell fit label="Waiting for NHI" density="compact" minWidth={960} shot="waiting-nhi-table" tableStyle={{ tableLayout: 'fixed' }}>
          <colgroup>
            {[140, undefined, 124, 228, 80, 96, 166].map((w, i) => (
              <col key={i} style={w !== undefined ? { width: w } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <Th>Patient as received</Th>
              <Th>List</Th>
              <Th>Stub</Th>
              <Th>Address to chase</Th>
              <Th>Days to go</Th>
              <Th>Requested</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <WaitingNhiRowView
                key={row.rowId}
                row={row}
                actor={actor}
                onAddNhi={() => setSheetRow(row)}
                onOpenList={onOpenList}
                onOpenMatching={onOpenMatching}
                onError={setError}
              />
            ))}
          </tbody>
        </TableShell>
      )}
      </PageBody>
      <AddNhiSheet row={sheetRow} actor={actor} onClose={() => setSheetRow(null)} onOpenList={onOpenList} onOpenMatching={onOpenMatching} />
    </>
  )
}

/** One waiting row (exported for its component test). */
export function WaitingNhiRowView({
  row,
  actor,
  onAddNhi,
  onOpenList,
  onOpenMatching,
  onError,
}: {
  row: WaitingNhiRow
  actor: Actor
  onAddNhi: () => void
  onOpenList: (listId: string) => void
  onOpenMatching: (rowId: string) => void
  onError: (message: string | null) => void
}) {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const [to, setTo] = useState(row.chase.to)
  const email = useMemo(() => (to !== '' ? nhiRequestEmailFor({ intake, masters, schedule }, row.rowId, to) : undefined), [intake, masters, schedule, row.rowId, to])
  const contact = to !== '' ? row.chase.contacts.find((c) => c.email === to) : undefined
  const urgent = row.urgency === 'urgent'
  const choices = [row.chase.to, ...row.chase.alternatives.map((a) => a.email)].filter((a) => a !== '')

  return (
    <tr data-shot="waiting-nhi-row" data-row-id={row.rowId} data-urgent={urgent ? 'true' : 'false'} style={{ verticalAlign: 'top' }}>
      <Td>
        <div style={{ fontWeight: 600 }}>{row.patientName}</div>
        <div className={row.dobISO !== undefined && row.dobISO !== '' ? 'mono' : undefined} style={{ fontSize: 12, color: neutral.slate }}>{row.dobISO !== undefined && row.dobISO !== '' ? formatDob(row.dobISO) : 'No date of birth'}</div>
      </Td>
      <Td>
        <div style={{ fontWeight: 600 }}>
          <span className="mono">{shortDay(row.dateISO)}</span> {row.listId !== undefined ? sessionText(row.session) : ''}
          {row.scheduledTime !== undefined && row.listId !== undefined && <span className="mono" style={{ fontWeight: 400, color: neutral.slate }}> {row.scheduledTime}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: neutral.slate }}>
          {row.hospital}
          {row.listId !== undefined && row.surgeon !== undefined ? `, ${row.surgeon}` : ''}
        </div>
        {row.wording !== undefined && <div style={{ fontSize: 12, color: neutral.mist }}>{row.wording}</div>}
      </Td>
      <Td>
        {row.stubId !== undefined && row.listId !== undefined ? (
          // 33a's stub marker (the warning triangle) and a teal action to its List: no private pill.
          <span data-shot="waiting-nhi-stub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <StubMarker count={1} shot="waiting-nhi-stub-marker" />
            <TextAction size="sm" flush onClick={() => onOpenList(row.listId!)} label={`Open the List holding the stub for ${row.patientName}`} style={{ whiteSpace: 'normal', textAlign: 'left' }}>
              Stub on {row.surgeon !== undefined ? `${row.surgeon}'s` : 'its'} List
            </TextAction>
          </span>
        ) : (
          <span style={{ color: neutral.mist, fontSize: 12.5 }}>None</span>
        )}
      </Td>
      <Td>
        {to === '' ? (
          <span style={{ color: neutral.mist, fontSize: 12.5 }}>No office address held</span>
        ) : (
          <div data-shot="waiting-nhi-chase" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            {contact?.name !== undefined && <span style={{ fontWeight: 600 }}>{contact.name}</span>}
            <span style={{ fontSize: 12.5, overflowWrap: 'anywhere' }}>{to}</span>
            {contact?.phone !== undefined && <span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{contact.phone}</span>}
            {choices.length > 1 && (
              <SelectField label={`Send the NHI request for ${row.patientName} to`} hideLabel size="compact" fill="surface" value={to} onChange={setTo}>
                {choices.map((c) => (
                  <option key={c} value={c}>{c === row.chase.to ? `${c} (first)` : c}</option>
                ))}
              </SelectField>
            )}
          </div>
        )}
      </Td>
      <Td>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <span className="mono">{row.daysToGo < 0 ? 'Passed' : row.daysToGo === 0 ? 'Today' : plural(row.daysToGo, 'day')}</span>
          {urgent && <Pill tone="error" size="sm" shot="waiting-nhi-urgent">Urgent</Pill>}
        </div>
      </Td>
      <Td>
        <span className={row.requestedAtISO !== undefined ? 'mono' : undefined} style={{ fontSize: 12.5, color: row.requestedAtISO !== undefined ? neutral.ink : neutral.mist }}>
          {row.requestedAtISO !== undefined ? stampText(row.requestedAtISO) : 'Not yet'}
        </span>
      </Td>
      <Td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {email !== undefined && (
            <Button
              variant="outline"
              size="compact"
              href={email.href}
              shot="waiting-nhi-email"
              onClick={() => {
                const res = requestNhiFromOffice(useAppStore, actor, row.rowId, to)
                onError(res.ok ? null : res.message)
              }}
            >
              Email for the NHI
            </Button>
          )}
          <Button variant="primary" size="compact" onClick={onAddNhi} shot="waiting-nhi-add">Add NHI</Button>
          <TextAction size="sm" flush onClick={() => onOpenMatching(row.rowId)} label={`Open ${row.patientName}'s row on matching`}>Open on matching</TextAction>
        </div>
      </Td>
    </tr>
  )
}
