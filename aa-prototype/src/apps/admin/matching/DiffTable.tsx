/**
 * Matching's differences (catch-up Phase 33; US-02.1.3; AR-21
 * `review-differences`): Field, "On the Booking now", "From the hospital", on
 * the shared table kit (a `nested`, `dense` `TableShell`). Every row is a
 * changed field, so every row takes the warning tone; a field the office may
 * apply carries its tick, named by the field ("Note").
 */

import type { IncomingFieldKey } from '../../../domain/types'
import type { FieldDiff } from '../../../domain/intake'
import { neutral } from '../../../theme/tokens'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import { Checkbox } from '../../../shared/ui'

const MONO_KEYS: ReadonlySet<IncomingFieldKey> = new Set<IncomingFieldKey>(['procedureText', 'time', 'dob', 'nhi'])
const NOTE = { fontWeight: 400, fontSize: 11.5, marginTop: 2 } as const

export function DiffTable({
  diffs,
  tickable,
  unticked,
  onToggle,
}: {
  diffs: readonly FieldDiff[]
  tickable: (d: FieldDiff) => boolean
  unticked: ReadonlySet<IncomingFieldKey>
  onToggle: (key: IncomingFieldKey) => void
}) {
  return (
    <TableShell label="Differences" nested density="dense">
      <thead>
        <tr>
          <Th width={104}>Field</Th>
          <Th>On the Booking now</Th>
          <Th>From the hospital</Th>
        </tr>
      </thead>
      <tbody>
        {diffs.map((d) => {
          const canTick = tickable(d)
          const on = canTick && !unticked.has(d.key)
          const mono = MONO_KEYS.has(d.key)
          return (
            <ClickableRow key={d.key} tone="warning" align="top" data-diff={d.key}>
              <Td bold>
                {canTick ? (
                  <Checkbox checked={on} onChange={() => onToggle(d.key)} data-diff-tick={d.key}>
                    {d.label}
                  </Checkbox>
                ) : (
                  d.label
                )}
                {d.effect === 'flagged' && <div style={NOTE}>Not applied from a row</div>}
              </Td>
              <Td mono={mono} style={{ overflowWrap: 'anywhere', ...(d.current === null ? { color: neutral.mist } : {}) }}>
                {d.current === null ? 'Not supplied' : d.key === 'procedureText' ? `“${d.current}”` : d.current}
              </Td>
              <Td mono={mono} style={{ overflowWrap: 'anywhere' }}>
                {d.key === 'procedureText' ? `“${d.incoming}”` : d.incoming}
                {d.effect === 'replaces' && <div style={NOTE}>Replaces the current text</div>}
                {d.effect === 'appends' && <div style={NOTE}>Added below the Booking's notes</div>}
              </Td>
            </ClickableRow>
          )
        })}
      </tbody>
    </TableShell>
  )
}
