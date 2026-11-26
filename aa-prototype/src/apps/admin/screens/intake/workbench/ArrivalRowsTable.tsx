/**
 * An arrival's rows, read only (build plan Phase 68): the stub benches' one table. Time, patient (with date of
 * birth), NHI, the procedure as sent, and what the row would do, with its decision once decided. A changed row
 * names the fields that differ. Later phases may replace it bench by bench.
 *
 * Hooks: `shot` on the table's scroller, `data-row-id`, `data-row-change` and `data-row-status` on each row.
 */

import type { ListChangeRow } from '../../../../../domain/intake/listChanges'
import type { RowChange } from '../../../../../domain/intake/arrivals'
import { useArrivalRows } from '../../../../../store/intakeSelectors'
import { formatDob, plural } from '../../../../../shared/format'
import { EmptyState, Pill, type PillTone, type PillVariant } from '../../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../../shared/table'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'

/** What a row would do, in words, with the kind pill's look from the Intake mockup (`#idea1`). */
const ROW_CHANGE_LOOK: Record<RowChange, { label: string; tone: PillTone; variant: PillVariant }> = {
  added: { label: 'Added', tone: 'success', variant: 'tint' },
  changed: { label: 'Changed', tone: 'warning', variant: 'tint' },
  cancelled: { label: 'Cancelled', tone: 'error', variant: 'tint' },
  unchanged: { label: 'Unchanged', tone: 'neutral', variant: 'tint' },
  removed: { label: 'Removed', tone: 'error', variant: 'outline' },
  waiting: { label: 'Waiting for an NHI', tone: 'warning', variant: 'outline' },
}

/** A decided row's state in words. */
const ROW_STATUS_LABELS: Record<Exclude<ListChangeRow['status'], 'open'>, string> = {
  applied: 'Applied',
  rejected: 'Rejected',
  leftOut: 'Left out',
}

const SUB_LINE = {
  display: 'block',
  fontSize: typeScale.captionSm.size,
  lineHeight: `${typeScale.captionSm.line}px`,
  color: neutral.mist,
  fontWeight: 400,
} as const

const QUIET = { color: neutral.mist } as const

export function ArrivalRowsTable({ arrivalKey, shot }: { arrivalKey: string; shot?: string }) {
  const rows = useArrivalRows(arrivalKey)
  if (rows.length === 0) {
    return <EmptyState variant="card">This arrival holds no patients.</EmptyState>
  }
  const decided = rows.filter((r) => r.status !== 'open').length
  return (
    <TableShell
      label="Patients in this arrival"
      density="compact"
      shot={shot}
      footer={
        <span style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
          {plural(rows.length, 'patient')}
          {decided > 0 ? ` · ${decided} decided` : ''}
        </span>
      }
    >
      <thead>
        <tr>
          <Th width={72}>Time</Th>
          <Th>Patient</Th>
          <Th width={110}>NHI</Th>
          <Th>Procedure</Th>
          <Th width={180}>What changes</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const look = ROW_CHANGE_LOOK[row.change]
          // A decided row steps back to slate, so the open ones lead.
          const ink = row.status === 'open' ? undefined : { color: neutral.slate }
          return (
            <tr key={row.rowId} data-row-id={row.rowId} data-row-change={row.change} data-row-status={row.status}>
              <Td mono nowrap style={row.scheduledTime === undefined ? QUIET : ink}>
                {row.scheduledTime ?? '·'}
              </Td>
              <Td style={ink}>
                <span style={{ fontWeight: 600 }}>{row.patientName}</span>
                {row.dobISO !== undefined && <span style={SUB_LINE}>{formatDob(row.dobISO)}</span>}
              </Td>
              <Td mono nowrap style={row.nhi === undefined ? QUIET : ink}>
                {row.nhi ?? 'No NHI'}
              </Td>
              <Td style={row.procedureText === undefined ? QUIET : ink}>{row.procedureText ?? 'None sent'}</Td>
              <Td>
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: space[1] }}>
                  <Pill size="sm" tone={look.tone} variant={look.variant}>
                    {look.label}
                  </Pill>
                  {row.status !== 'open' && (
                    <Pill size="sm" tone="neutral" variant="outline" data-row-decision={row.status}>
                      {ROW_STATUS_LABELS[row.status]}
                    </Pill>
                  )}
                </span>
                {row.change === 'changed' && row.diffs.length > 0 && <span style={SUB_LINE}>{row.diffs.map((d) => d.label).join(', ')}</span>}
              </Td>
            </tr>
          )
        })}
      </tbody>
    </TableShell>
  )
}
