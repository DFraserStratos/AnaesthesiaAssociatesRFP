/**
 * The bench for a row waiting for an NHI (build plan Phases 68 and 72; D117, D124, D125; US-11.1.5, US-11.1.4,
 * US-02.6.3; the opened arrival's O1): the arrival's one row from `waitingNhiRows`. The document is the List the row
 * sits on (how close it is, the stub standing on it); the decision column holds the patient as received and the chase
 * card; the footer has the chase email (secondary) and Add NHI (primary), the one way to add an NHI by hand
 * (`AddNhiSheet`). Once the NHI is added the row leaves Needs NHI by 68's selectors: resolved, the Booking takes the
 * stub's place; otherwise the sheet says why and links to the row under its own kind. Either way `onDone` lets the
 * page keep the arrival open, so the sheet's outcome stays until the office moves on.
 *
 * Hooks: `intake-bench-needsNhi` (`data-arrival-key`); `waiting-nhi-row` (`data-row-id`, `data-urgent`) around the
 * decision; `waiting-nhi-add`, `waiting-nhi-email`; `waiting-nhi-empty` once the row no longer waits. Each part names
 * its own.
 */

import { useState, type ReactNode } from 'react'
import type { WaitingNhiRow } from '../../../../../store'
import type { Actor } from '../../../../../store/mutate'
import { Button, EmptyState } from '../../../../../shared/ui'
import { space } from '../../../../../theme/tokens'
import { AddNhiSheet } from '../../../intake/AddNhiSheet'
import { BenchLayout } from './BenchLayout'
import type { BenchActions, BenchProps } from './benchProps'
import { NextArrivalButton } from './NextArrivalButton'
import { useChase } from './needsNhi/ChaseCard'
import { PatientAsReceived } from './needsNhi/PatientAsReceived'
import { TheList } from './needsNhi/TheList'
import { useWaitingNhiRow } from './needsNhi/waitingRow'

const STACK = { display: 'flex', flexDirection: 'column', gap: space[4], minWidth: 0 } as const

export function NeedsNhiBench({ arrival, actor, onDone, onNext }: BenchProps) {
  const row = useWaitingNhiRow(arrival.rowIds)
  // The row object, not its id: the sheet keeps showing what Add NHI did after the row leaves Needs NHI.
  const [sheetRow, setSheetRow] = useState<WaitingNhiRow | null>(null)
  // The last row seen, so the List stays on the desk once the NHI is added.
  const [lastRow, setLastRow] = useState<WaitingNhiRow | undefined>(row)
  if (row !== undefined && row !== lastRow) setLastRow(row)

  const sheet =
    sheetRow !== null ? (
      <AddNhiSheet
        row={sheetRow}
        actor={actor}
        onClose={() => setSheetRow(null)}
        onAdded={() => {
          // Called in the click, so the page keeps this arrival while it still has this render's key.
          onDone()
        }}
      />
    ) : null

  const document = lastRow !== undefined ? <TheList row={lastRow} /> : null

  if (row === undefined) {
    const actions: BenchActions | undefined = onNext !== undefined ? { primary: <NextArrivalButton onNext={onNext} /> } : undefined
    return (
      <>
        <BenchLayout
          shot="intake-bench-needsNhi"
          data-arrival-key={arrival.key}
          document={document}
          decision={<EmptyState variant="card" shot="waiting-nhi-empty">This row is no longer waiting for an NHI.</EmptyState>}
          {...(actions !== undefined ? { actions } : {})}
        />
        {sheet}
      </>
    )
  }
  return (
    <>
      <WaitingBench key={row.rowId} row={row} actor={actor} arrivalKey={arrival.key} document={document} onAdd={() => setSheetRow(row)} />
      {sheet}
    </>
  )
}

function WaitingBench({ row, actor, arrivalKey, document, onAdd }: { row: WaitingNhiRow; actor: Actor; arrivalKey: string; document: ReactNode; onAdd: () => void }) {
  const chase = useChase(row, actor)
  return (
    <BenchLayout
      shot="intake-bench-needsNhi"
      data-arrival-key={arrivalKey}
      document={document}
      decision={
        <div data-shot="waiting-nhi-row" data-row-id={row.rowId} data-urgent={row.urgency === 'urgent' ? 'true' : 'false'} style={STACK}>
          <PatientAsReceived row={row} />
          {chase.card}
        </div>
      }
      actions={{
        ...(row.stubId !== undefined ? { note: 'Adding the NHI turns the stub into a Booking on its List.' } : {}),
        secondary: chase.email,
        primary: (
          <Button variant="primary" size="desktop" onClick={onAdd} shot="waiting-nhi-add">
            Add NHI
          </Button>
        ),
      }}
    />
  )
}
