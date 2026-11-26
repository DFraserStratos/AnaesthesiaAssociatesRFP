/**
 * The bench for Lists that match exactly (build plan Phases 68 and 71; D117, D118, US-02.1.6): every List of the
 * arrival that matches what AA holds with no difference (hospital, day, session, surgeon, Bookings), a one-line note
 * that nothing on the schedule changes, and Confirm unchanged (N), which decides all N Lists as one change set
 * (`confirmUnchangedLists`, re-checked at the click). Never automatic: the Lists wait here until a person confirms.
 *
 * Hooks: `data-shot="intake-bench-matchesExactly"` on the bench, `intake-unchanged-lists` on the table (each row
 * `data-arrival-key`), `intake-confirm-unchanged` on the button.
 */

import { useState } from 'react'
import type { BenchProps } from './benchProps'
import { useAppStore } from '../../../../../store'
import { confirmUnchangedLists, useUnchangedListsOf } from '../../../../../store/intakeBulk'
import { plural, shortDay } from '../../../../../shared/format'
import { Button, EmptyState, FormError } from '../../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../../shared/table'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'

const CONFIRM_UNCHANGED_NOTE = 'Nothing on the schedule changes. Each List is marked as checked.'

export function MatchesExactlyBench({ arrival, actor, onDone }: BenchProps) {
  const lists = useUnchangedListsOf(arrival.batchId)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const [error, setError] = useState<string | null>(null)

  const shown = arrival.decided ? [] : lists

  function confirm() {
    const out = confirmUnchangedLists(
      useAppStore,
      actor,
      arrival.batchId,
      shown.map((l) => l.key),
    )
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onDone()
  }

  return (
    <div data-shot="intake-bench-matchesExactly" data-arrival-key={arrival.key} style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
      {shown.length === 0 ? (
        <EmptyState variant="card" title="Nothing left to confirm">
          Every List in this arrival that matched exactly has been confirmed.
        </EmptyState>
      ) : (
        <>
          <TableShell label="Lists that match exactly" density="compact" shot="intake-unchanged-lists">
            <thead>
              <tr>
                <Th>Hospital</Th>
                <Th width={110}>Day</Th>
                <Th width={80}>Session</Th>
                <Th>Surgeon</Th>
                <Th width={110}>Bookings</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.key} data-arrival-key={l.key}>
                  <Td>{hospitals[l.hospitalId]?.name ?? l.hospitalId}</Td>
                  <Td nowrap>{l.dateISO !== undefined ? shortDay(l.dateISO) : '·'}</Td>
                  <Td mono nowrap>
                    {l.session ?? '·'}
                  </Td>
                  <Td>{l.surgeonName ?? 'No surgeon sent'}</Td>
                  <Td nowrap>{plural(l.counts.rows, 'Booking')}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <p style={{ margin: 0, fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>{CONFIRM_UNCHANGED_NOTE}</p>
          <FormError message={error} />
          <div>
            <Button variant="primary" size="desktop" onClick={confirm} shot="intake-confirm-unchanged">
              {`Confirm unchanged (${shown.length})`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
