/**
 * The List-level difference table of the update bench (build plan Phase 69; US-02.1.2, US-02.2.3): one row per
 * Booking with a tick (a tick per Booking, never per field), the current value struck beside the new, added
 * values marked, a removal struck through to confirm, and a stub whose NHI arrives read as "NHI arrives, stub
 * becomes a Booking". Layout from `docs/explorations/intake-ideas.html` #idea1 mock A (the columns Time, Patient,
 * NHI, Procedure, Insurer and approval, Change; the edge stripe per kind) and #reco (the struck removal).
 *
 * Presentational: it derives nothing from the store. The bench passes the rows (68's `ListChangeRow`), what is
 * ticked, each row's blocker, stubs, warnings and extras, and reads the ticks back through `onToggle`.
 *
 * Hooks: `shot` (default `intake-update-diff`) on the table's scroller; on each row `data-row-id`,
 * `data-booking-id` (when the row touches one), `data-change` (the `RowChange`) and `data-ticked`.
 */

import type { CSSProperties, ReactNode } from 'react'
import type { ListChangeRow } from '../../../../../../domain/intake/listChanges'
import type { RowChange } from '../../../../../../domain/intake/arrivals'
import type { FieldDiff } from '../../../../../../domain/intake/matching'
import { formatDob, plural } from '../../../../../../shared/format'
import { Checkbox, OptionChip, Pill, visuallyHidden, type PillTone, type PillVariant } from '../../../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../../../shared/table'
import { neutral, radius, semantic, space, type as typeScale } from '../../../../../../theme/tokens'

export interface DiffRowExtras {
  /** As the record holds it ("F", "M"). */
  sex?: string
  /** Already formatted: "nib · Approval 1234567". */
  insurer?: string
}

export interface StubOption {
  stubId: string
  /** "Mere Tipene · 14 Mar 1961". */
  label: string
}

export interface ListDiffTableProps {
  rows: readonly ListChangeRow[]
  /** Rows ticked to apply. */
  ticked: ReadonlySet<string>
  onToggle: (rowId: string, next: boolean) => void
  /** rowId → why the row cannot apply: its tick is disabled and unticked, the reason shown on the row. */
  blockers?: Readonly<Record<string, string>>
  /** rowId → the waiting stubs this row's NHI resolves; with 2+ a choice, the row unticked until chosen. */
  stubs?: Readonly<Record<string, readonly StubOption[]>>
  stubChoice?: Readonly<Record<string, string>>
  onStubChoice?: (rowId: string, stubId: string) => void
  /** rowId → the matcher's warnings for the row, each a Pill with its text. */
  warnings?: Readonly<Record<string, readonly string[]>>
  extras?: Readonly<Record<string, DiffRowExtras>>
  /** A decided arrival: no ticks; each row shows its decision (Applied, Left out, Rejected). */
  readOnly?: boolean
  /** Something quiet under the Change pill of a row (the bench's "View as received"); null for none. */
  rowAction?: (row: ListChangeRow) => ReactNode
  /** The card's foot row (the change count with Reject and Apply). */
  footer?: ReactNode
  /** The table's name for the keyboard when it scrolls. */
  label?: string
  shot?: string
}

type Look = { label: string; tone: PillTone; variant: PillVariant; stripe?: string }

/** The Change pill and the row's edge stripe (mock A's `.kind` and `tr.row*`). */
function lookOf(row: ListChangeRow, stub: boolean): Look {
  if (stub) return { label: 'Stub to Booking', tone: 'success', variant: 'tint', stripe: semantic.success.solid }
  const looks: Record<RowChange, Look> = {
    added: { label: 'Added', tone: 'success', variant: 'tint', stripe: semantic.success.solid },
    changed: {
      label: row.diffs.length === 0 ? 'Changed' : row.diffs.length === 1 && row.diffs[0]?.key === 'time' ? 'Time' : plural(row.diffs.length, 'field'),
      tone: 'warning',
      variant: 'tint',
      stripe: semantic.warning.solid,
    },
    removed: { label: 'Removal', tone: 'error', variant: 'tint', stripe: semantic.error.solid },
    cancelled: { label: 'Cancelled', tone: 'error', variant: 'tint', stripe: semantic.error.solid },
    unchanged: { label: 'Same', tone: 'neutral', variant: 'tint' },
    waiting: { label: 'Waits for NHI', tone: 'warning', variant: 'outline' },
  }
  return looks[row.change]
}

const DECISION_LABELS: Record<Exclude<ListChangeRow['status'], 'open'>, string> = {
  applied: 'Applied',
  leftOut: 'Left out',
  rejected: 'Rejected',
}

const SUB_LINE: CSSProperties = {
  display: 'block',
  fontSize: typeScale.captionSm.size,
  lineHeight: `${typeScale.captionSm.line}px`,
  color: neutral.mist,
  fontWeight: 400,
}

/** The value it replaces: struck, small and quiet, on its own line above the new one (mock A's `s`). */
const WAS: CSSProperties = SUB_LINE

/** The new value, marked in the change's tint (mock A's `.new` and `.add`). */
function markStyle(tone: 'warning' | 'success'): CSSProperties {
  return {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: radius.xs,
    background: semantic[tone].tint,
    color: semantic[tone].onTint,
    fontWeight: 600,
  }
}

const QUIET: CSSProperties = { color: neutral.mist }

/** A column's value: the current struck above the new when the matcher found a difference, else the value. */
function Value({ diff, value, empty, tone = 'warning' }: { diff?: FieldDiff; value?: string; empty: string; tone?: 'warning' | 'success' }) {
  if (diff !== undefined) {
    return (
      <>
        {diff.current !== null && diff.current !== '' && (
          <s data-diff-was={diff.key} style={WAS}>
            {diff.current}
          </s>
        )}
        <span data-diff-new={diff.key} style={markStyle(diff.current === null || diff.current === '' ? 'success' : tone)}>
          {diff.incoming}
        </span>
      </>
    )
  }
  if (value === undefined || value === '') return <span style={QUIET}>{empty}</span>
  return <>{value}</>
}

export function ListDiffTable({
  rows,
  ticked,
  onToggle,
  blockers = {},
  stubs = {},
  stubChoice = {},
  onStubChoice,
  warnings = {},
  extras = {},
  readOnly = false,
  rowAction,
  footer,
  label = 'Changes to this List',
  shot = 'intake-update-diff',
}: ListDiffTableProps) {
  return (
    <TableShell label={label} density="dense" shot={shot} footer={footer}>
      <thead>
        <tr>
          {!readOnly && (
            <Th width={36}>
              <span style={visuallyHidden}>Apply</span>
            </Th>
          )}
          <Th width={72}>Time</Th>
          <Th>Patient</Th>
          <Th width={110}>NHI</Th>
          <Th>Procedure</Th>
          <Th>Insurer · approval</Th>
          <Th width={200}>Change</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const diffOf = (key: FieldDiff['key']) => row.diffs.find((d) => d.key === key)
          const options = stubs[row.rowId] ?? []
          const stub = options.length > 0
          const needsChoice = options.length > 1 && stubChoice[row.rowId] === undefined
          const blocker = blockers[row.rowId]
          const disabled = blocker !== undefined || needsChoice
          const checked = !disabled && ticked.has(row.rowId)
          const removal = row.change === 'removed'
          const same = row.change === 'unchanged'
          const look = lookOf(row, stub)
          const extra = extras[row.rowId] ?? {}
          const rowWarnings = warnings[row.rowId] ?? []
          const action = rowAction?.(row)
          const ink: CSSProperties | undefined = same ? QUIET : undefined
          const stripe: CSSProperties = look.stripe !== undefined ? { boxShadow: `inset 3px 0 0 ${look.stripe}` } : {}
          const nameDiff = diffOf('patientName')
          const dobDiff = diffOf('dob')
          const noteDiff = diffOf('note')
          const procedureDiff = diffOf('procedureText')
          const sub = [extra.sex, row.dobISO !== undefined && dobDiff === undefined ? formatDob(row.dobISO) : undefined].filter(
            (s): s is string => s !== undefined && s !== '',
          )
          return (
            <tr
              key={row.rowId}
              data-row-id={row.rowId}
              {...(row.bookingId !== undefined ? { 'data-booking-id': row.bookingId } : {})}
              data-change={row.change}
              data-ticked={readOnly ? undefined : String(checked)}
            >
              {!readOnly && (
                <Td style={stripe}>
                  <Checkbox checked={checked} disabled={disabled} onChange={(next) => onToggle(row.rowId, next)} data-row-tick={row.rowId}>
                    <span style={visuallyHidden}>{removal ? `Confirm removal of ${row.patientName}` : `Apply the change to ${row.patientName}`}</span>
                  </Checkbox>
                </Td>
              )}
              <Td mono nowrap struck={removal} style={{ ...(readOnly ? stripe : {}), ...(row.scheduledTime === undefined ? QUIET : ink) }}>
                <Value diff={diffOf('time')} value={row.scheduledTime} empty="·" />
              </Td>
              <Td struck={removal} style={ink}>
                {nameDiff !== undefined ? (
                  <Value diff={nameDiff} empty="" />
                ) : (
                  <span style={{ fontWeight: 600, color: same || removal ? neutral.slate : undefined }}>{row.patientName}</span>
                )}
                {sub.length > 0 && <span style={SUB_LINE}>{sub.join(' · ')}</span>}
                {dobDiff !== undefined && (
                  <span style={SUB_LINE}>
                    <Value diff={dobDiff} empty="" />
                  </span>
                )}
              </Td>
              <Td mono nowrap style={row.nhi === undefined && !stub ? QUIET : ink}>
                {stub && diffOf('nhi') === undefined ? (
                  <>
                    <s style={WAS}>No NHI · stub</s>
                    <span style={markStyle('success')}>{row.nhi ?? 'No NHI'}</span>
                  </>
                ) : (
                  <Value diff={diffOf('nhi')} value={row.nhi} empty="No NHI" />
                )}
              </Td>
              <Td struck={removal} style={ink}>
                <Value diff={procedureDiff} value={row.procedureText} empty="None sent" />
                {procedureDiff?.effect === 'replaces' && procedureDiff.current !== null && procedureDiff.current !== '' && (
                  <span style={SUB_LINE}>The new wording replaces the current one</span>
                )}
              </Td>
              <Td style={ink}>
                <Value diff={diffOf('insurer')} value={extra.insurer} empty="None sent" />
              </Td>
              <Td>
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: space[1] }}>
                  <Pill size="sm" tone={look.tone} variant={look.variant} data-change-pill={row.change}>
                    {look.label}
                  </Pill>
                  {readOnly && row.status !== 'open' && (
                    <Pill size="sm" tone="neutral" variant="outline" data-row-decision={row.status}>
                      {DECISION_LABELS[row.status]}
                    </Pill>
                  )}
                  {rowWarnings.map((w) => (
                    <Pill key={w} size="sm" tone="warning" variant="outline" data-row-warning="">
                      {w}
                    </Pill>
                  ))}
                </span>
                {stub && <span style={SUB_LINE}>NHI arrives, stub becomes a Booking</span>}
                {stub && options.length === 1 && options[0] !== undefined && <span style={SUB_LINE}>{options[0].label}</span>}
                {options.length > 1 && (
                  <span
                    role="radiogroup"
                    aria-label={`Which stub becomes ${row.patientName}'s Booking`}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: space[1], marginTop: space[1] }}
                  >
                    {options.map((o) => (
                      <OptionChip
                        key={o.stubId}
                        role="radio"
                        pressed={stubChoice[row.rowId] === o.stubId}
                        onClick={() => onStubChoice?.(row.rowId, o.stubId)}
                        data-stub-option={o.stubId}
                      >
                        {o.label}
                      </OptionChip>
                    ))}
                  </span>
                )}
                {needsChoice && blocker === undefined && <span style={SUB_LINE}>Choose the stub to tick this row</span>}
                {noteDiff !== undefined && <span style={SUB_LINE}>Adds a note: {noteDiff.incoming}</span>}
                {blocker !== undefined && (
                  <span data-row-blocker="" style={{ ...SUB_LINE, color: semantic.error.onTint, fontWeight: 500 }}>
                    {blocker}
                  </span>
                )}
                {action !== undefined && action !== null && action !== false && <span style={{ display: 'block', marginTop: space[1] }}>{action}</span>}
              </Td>
            </tr>
          )
        })}
      </tbody>
    </TableShell>
  )
}
