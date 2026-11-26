/**
 * The bench for a row waiting for an NHI (build plan Phases 68 and 72; D117, D124, D125; US-11.1.5, US-11.1.4,
 * US-02.6.3): the arrival's one row from `waitingNhiRows`, top to bottom the patient as received, the List (how close,
 * the stub standing on it), the chase card and Add NHI, the one way to add an NHI by hand (`AddNhiSheet`). Once the
 * NHI is added the row leaves Needs NHI by 68's selectors: resolved, the Booking takes the stub's place; otherwise the
 * sheet says why and links to the row under its own kind. Either way `onDone` keeps the item picked, so the bench and
 * the sheet's outcome stay until the office moves on.
 *
 * Hooks: `intake-bench-needsNhi` (`data-arrival-key`); `waiting-nhi-row` (`data-row-id`, `data-urgent`) around the
 * parts; `waiting-nhi-add`; `waiting-nhi-empty` once the row no longer waits. Each part names its own.
 */

import { useState } from 'react'
import type { WaitingNhiRow } from '../../../../../store'
import { Button, EmptyState } from '../../../../../shared/ui'
import { space } from '../../../../../theme/tokens'
import { AddNhiSheet } from '../../../intake/AddNhiSheet'
import type { BenchProps } from './benchProps'
import { ChaseCard } from './needsNhi/ChaseCard'
import { PatientAsReceived } from './needsNhi/PatientAsReceived'
import { TheList } from './needsNhi/TheList'
import { useWaitingNhiRow } from './needsNhi/waitingRow'

const STACK = { display: 'flex', flexDirection: 'column', gap: space[4], minWidth: 0 } as const

export function NeedsNhiBench({ arrival, actor, onDone }: BenchProps) {
  const row = useWaitingNhiRow(arrival.rowIds)
  // The row object, not its id: the sheet keeps showing what Add NHI did after the row leaves Needs NHI.
  const [sheetRow, setSheetRow] = useState<WaitingNhiRow | null>(null)

  return (
    <div data-shot="intake-bench-needsNhi" data-arrival-key={arrival.key} style={STACK}>
      {row !== undefined ? (
        <div data-shot="waiting-nhi-row" data-row-id={row.rowId} data-urgent={row.urgency === 'urgent' ? 'true' : 'false'} style={STACK}>
          <PatientAsReceived row={row} />
          <TheList row={row} />
          <ChaseCard key={row.rowId} row={row} actor={actor} />
          <div>
            <Button variant="primary" size="desktop" onClick={() => setSheetRow(row)} shot="waiting-nhi-add">
              Add NHI
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState variant="card" shot="waiting-nhi-empty">This row is no longer waiting for an NHI.</EmptyState>
      )}
      {sheetRow !== null && (
        <AddNhiSheet
          row={sheetRow}
          actor={actor}
          onClose={() => setSheetRow(null)}
          onAdded={() => {
            // Called in the click, so the item is kept picked while it still has this render's key.
            onDone()
          }}
        />
      )}
    </div>
  )
}
