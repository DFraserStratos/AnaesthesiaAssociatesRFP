/**
 * The bench for an update to a List AA holds (build plan Phase 69; US-02.1.2, US-02.1.3, US-02.2.3; DM-12, DM-13,
 * DM-17; D118; `docs/explorations/intake-ideas.html` `#idea1` mock A, `#reco`), for a hospital's update or a re-sent
 * rooms' PDF alike: the List line, the match basis with the List's versions, then the List-level difference table
 * with a tick per Booking beside where it lands and any stub an arriving NHI resolves; Reject and Apply below the
 * table. Apply decides the whole List as one change set (`applyArrivingList`); an unticked change is left out and
 * changes nothing. Nothing changes until Apply. A decided arrival shows its decision, read only.
 *
 * Hooks: `intake-bench-update`; `intake-update-list-line`; `intake-update-diff` (the table); `intake-update-footer`,
 * `intake-update-count`, `matching-apply` (Apply), `intake-update-reject`, `intake-update-reject-form`;
 * `intake-update-stub`; `intake-update-locked`; `intake-update-decided`; `intake-update-raw` per row.
 */

import { useState } from 'react'
import type { ListChangeRow } from '../../../../../domain/intake/listChanges'
import { applyArrivingList, rejectArrivingList, type RowChoice } from '../../../../../store/intakeApply'
import { useArrivalRows } from '../../../../../store/intakeSelectors'
import { useAppStore } from '../../../../../store/appStore'
import { drSurname, plural, stampText } from '../../../../../shared/format'
import { Button, Card, FormError, Notice, OptionChip, TextAction, TextField } from '../../../../../shared/ui'
import { neutral, space, type as typeScale } from '../../../../../theme/tokens'
import { RawRowSheet } from '../../../matching/RawRowSheet'
import type { BenchProps } from './benchProps'
import { ListDiffTable } from './update/ListDiffTable'
import { MatchBasisStrip } from './update/MatchBasisStrip'
import { SlotCard } from './update/SlotCard'
import { VersionTrack } from './update/VersionTrack'
import { applyLabel, changeCountText, listStateLine, QUICK_REJECT_REASONS } from './update/updateText'
import { useUpdateBench, type UpdateBenchReads } from './update/useUpdateBench'

const SMALL = { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px` } as const

/** How many changes a ticked row brings: each field it sets for a changed row, one for any other change, none if the same. */
function changesOf(row: ListChangeRow, hasStub: boolean): number {
  if (hasStub) return 1
  switch (row.change) {
    case 'changed':
      return Math.max(1, row.diffs.filter((d) => d.effect !== 'flagged').length)
    case 'added':
    case 'removed':
    case 'cancelled':
      return 1
    default:
      return 0
  }
}

/** The rows ticked by default: every open row that can apply, a stub row with two waiting patients left until one is chosen. */
function defaultTicks(rows: readonly ListChangeRow[], reads: UpdateBenchReads): Set<string> {
  return new Set(rows.filter((r) => r.status === 'open' && reads.blockers[r.rowId] === undefined && (reads.stubs[r.rowId]?.length ?? 0) < 2).map((r) => r.rowId))
}

export function UpdateBench(props: BenchProps) {
  // A fresh bench per arrival, so the ticks, the stub choices and the reject form never carry over.
  return <UpdateBenchFor key={props.arrival.key} {...props} />
}

function UpdateBenchFor({ arrival, actor, onDone }: BenchProps) {
  const rows = useArrivalRows(arrival.key)
  const reads = useUpdateBench(arrival)
  const [ticked, setTicked] = useState<Set<string>>(() => defaultTicks(rows, reads))
  const [stubChoice, setStubChoice] = useState<Record<string, string>>({})
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rawRow, setRawRow] = useState<ListChangeRow | null>(null)

  const list = reads.heldList
  const locked = list?.state === 'AUTHORISED'
  const openRows = rows.filter((r) => r.status === 'open')
  const decided = openRows.length === 0
  const stubRowIds = Object.keys(reads.stubs).filter((id) => (reads.stubs[id]?.length ?? 0) > 0)

  const tickedRows = openRows.filter((r) => ticked.has(r.rowId))
  const changes = tickedRows.reduce((n, r) => n + changesOf(r, reads.stubs[r.rowId] !== undefined), 0)
  const bookings = tickedRows.filter((r) => changesOf(r, reads.stubs[r.rowId] !== undefined) > 0).length

  function toggle(rowId: string, next: boolean) {
    setTicked((cur) => {
      const out = new Set(cur)
      if (next) out.add(rowId)
      else out.delete(rowId)
      return out
    })
  }

  function chooseStub(rowId: string, stubId: string) {
    setStubChoice((cur) => ({ ...cur, [rowId]: stubId }))
    toggle(rowId, true)
  }

  function apply() {
    const choices: Record<string, RowChoice> = {}
    for (const r of openRows) {
      if (r.change === 'waiting') continue
      const stubId = stubChoice[r.rowId]
      choices[r.rowId] = ticked.has(r.rowId) ? { kind: 'apply', ...(stubId !== undefined ? { stubId } : {}) } : { kind: 'leaveOut' }
    }
    const out = applyArrivingList(useAppStore, actor, arrival.key, choices)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onDone()
  }

  function reject() {
    const out = rejectArrivingList(useAppStore, actor, arrival.key, reason)
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    onDone()
  }

  const owner = reads.anaesthetistName !== undefined ? `${drSurname(reads.anaesthetistName)}'s List` : 'The List'
  const tally = {
    applied: rows.filter((r) => r.status === 'applied').length,
    leftOut: rows.filter((r) => r.status === 'leftOut').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }

  const footer =
    decided || locked ? null : (
      <div data-shot="intake-update-footer" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space[3], width: '100%' }}>
        <span data-shot="intake-update-count" style={{ ...SMALL, color: neutral.slate, flex: '1 1 200px' }}>
          {changeCountText(changes, bookings)}
          {reads.anaesthetistName !== undefined ? `. ${drSurname(reads.anaesthetistName)} sees the update in the app.` : '.'}
        </span>
        {rejecting ? (
          <>
            <Button variant="secondary" size="compact" onClick={() => setRejecting(false)}>
              Keep it
            </Button>
            <Button variant="primary" size="compact" onClick={reject} disabled={reason.trim() === ''} shot="intake-update-reject">
              Reject List
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="compact" onClick={() => setRejecting(true)} shot="intake-update-reject">
              Reject
            </Button>
            <Button variant="primary" size="compact" onClick={apply} disabled={tickedRows.length === 0} shot="matching-apply">
              {applyLabel(changes)}
            </Button>
          </>
        )}
      </div>
    )

  return (
    <div data-shot="intake-bench-update" data-arrival-key={arrival.key} style={{ display: 'flex', flexDirection: 'column', gap: space[4], minWidth: 0 }}>
      {list !== undefined && (
        <p data-shot="intake-update-list-line" style={{ margin: 0, ...SMALL, color: neutral.slate }}>
          {owner} · {listStateLine(list.state)}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: space[2], minWidth: 0 }}>
        <MatchBasisStrip arrival={arrival} />
        {list !== undefined && <VersionTrack arrival={arrival} listId={list.id} />}
      </div>

      {locked && !decided && (
        <Notice tone="warning" shot="intake-update-locked">
          This List is authorised and locked.
        </Notice>
      )}

      {decided && (
        <Notice tone="neutral" shot="intake-update-decided">
          {[
            tally.applied > 0 ? `${plural(tally.applied, 'row')} applied` : null,
            tally.leftOut > 0 ? `${tally.leftOut} left out` : null,
            tally.rejected > 0 ? `${tally.rejected} rejected` : null,
          ]
            .filter((s): s is string => s !== null)
            .join(' · ')}
          {reads.decidedBy !== undefined ? ` · ${reads.decidedBy.who}, ${stampText(reads.decidedBy.atISO)}` : ''}
        </Notice>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)', gap: space[4], alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space[3], minWidth: 0 }}>
          <ListDiffTable
            rows={rows}
            ticked={ticked}
            onToggle={toggle}
            blockers={reads.blockers}
            stubs={reads.stubs}
            stubChoice={stubChoice}
            onStubChoice={chooseStub}
            warnings={reads.warnings}
            extras={reads.extras}
            readOnly={decided || locked}
            rowAction={(row) =>
              reads.rawEligible.has(row.rowId) ? (
                <TextAction size="sm" onClick={() => setRawRow(row)} shot="intake-update-raw" data-row-id={row.rowId}>
                  View as received
                </TextAction>
              ) : null
            }
            {...(footer !== null ? { footer } : {})}
          />

          {!decided && !locked && rejecting && (
            <div data-shot="intake-update-reject-form" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
              <TextField label="Why reject this List" value={reason} onChange={setReason} size="compact" placeholder="Nothing on the schedule changes" autoFocus />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space[2] }}>
                {QUICK_REJECT_REASONS.map((r) => (
                  <OptionChip key={r} pressed={reason === r} onClick={() => setReason(r)}>
                    {r}
                  </OptionChip>
                ))}
              </div>
            </div>
          )}

          <FormError message={error} />
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: space[3], minWidth: 0 }}>
          {list !== undefined && <SlotCard listId={list.id} />}
          {!decided &&
            stubRowIds.map((rowId) => {
              const options = reads.stubs[rowId] ?? []
              const chosen = options.length === 1 ? options[0] : options.find((o) => o.stubId === stubChoice[rowId])
              const nhi = options[0]?.nhi
              return (
                <Card key={rowId} title={chosen !== undefined ? `${chosen.patientName}'s stub` : 'A waiting patient'} titleLevel={3} shot="intake-update-stub" data-row-id={rowId}>
                  <Notice tone="success" icon={false}>
                    {arrival.source.label} sent NHI {nhi}. Name and date of birth agree with the patient waiting for it.
                  </Notice>
                  <p style={{ margin: `${space[2]}px 0 0`, ...SMALL, color: neutral.slate }}>
                    {options.length > 1 && chosen === undefined ? 'Two waiting patients fit: choose one in the table.' : 'On apply: stub becomes a Booking.'}
                  </p>
                </Card>
              )
            })}
        </aside>
      </div>

      {rawRow !== null && <RawRowSheet rowId={rawRow.rowId} patientName={rawRow.patientName} actor={actor} onClose={() => setRawRow(null)} />}
    </div>
  )
}
