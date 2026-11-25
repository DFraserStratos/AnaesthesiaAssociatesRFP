/**
 * A fixed price's ranges on its Contract's page (build plan Phase 45;
 * US-04.2.15 "Table" and "To worked out"; catch-up Phase 19a's rules), as
 * docs/explorations/contracts-section.html #record draws them: newest first,
 * with From, To (worked out: the day before the next range starts, "Onwards"
 * on the last), Price ex GST, the Change on the range before ("First" on the
 * oldest), and how many Procedures the range priced (`proceduresPerRange`).
 * The current range and any future ones always show; ended ranges fold away
 * after three. A range is added, or corrected, as a row of the table (#updating),
 * straight away through the store's audited range actions; every rule and
 * sentence is the store's, and a refusal shows on the row.
 *
 * Under the table, the warning lists the authorised Procedures the ranges
 * left at their locked price (catch-up Phase 25a, `keptPriceOnContract`); the
 * Procedures a range re-prices are never listed.
 */

import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'
import type { Contract, PriceRange } from '../../../../domain/types'
import {
  formatRangeDate,
  formatRangePrice,
  parsePriceText,
  priceInputText,
  rangeChangeText,
  rangeEnd,
  rangeInForce,
  rangesOf,
} from '../../../../domain/billing/priceRanges'
import { keptPriceOnContract, keptPriceTitle } from '../../../../domain/billing/contractChanges'
import { shortDay } from '../../../../domain/dateText'
import { addPriceRange, deletePriceRange, editPriceRange, pricedPerRange, useAppStore, useToday, type Actor } from '../../../../store'
import { AddRowButton, Button, Card, CountBadge, FieldHint, FormError, Pill, TextAction, TextField, visuallyHidden } from '../../../../shared/ui'
import { TableShell, Td, Th } from '../../../../shared/table'
import { neutral } from '../../../../theme/tokens'
import { ContractChangeNotice } from '../../flows/ContractChangeNotice'

/** Ended ranges shown before the fold. */
export const ENDED_SHOWN = 3

const DATE_WIDTH = 140
const PRICE_WIDTH = 110

/** The ranges in table order (newest first), each with its index in start order, its end and its state today. */
export function rangeRows(ranges: readonly PriceRange[], todayISO: string): { range: PriceRange; index: number; endISO: string | null; state: 'inForce' | 'future' | 'ended' }[] {
  const sorted = [...ranges].sort((a, b) => a.startISO.localeCompare(b.startISO))
  return sorted
    .map((range, index) => {
      const endISO = rangeEnd(sorted, index)
      const state: 'inForce' | 'future' | 'ended' = range.startISO > todayISO ? 'future' : endISO !== null && endISO < todayISO ? 'ended' : 'inForce'
      return { range, index, endISO, state }
    })
    .reverse()
}

/** The rows shown before "Show earlier": every current and future range, then the first `ENDED_SHOWN` ended ones. */
export function foldRows<T extends { state: 'inForce' | 'future' | 'ended' }>(rows: readonly T[], expanded: boolean): { shown: T[]; folded: T[] } {
  if (expanded) return { shown: [...rows], folded: [] }
  const live = rows.filter((r) => r.state !== 'ended')
  const ended = rows.filter((r) => r.state === 'ended')
  return { shown: [...live, ...ended.slice(0, ENDED_SHOWN)], folded: ended.slice(ENDED_SHOWN) }
}

type Draft = { startISO: string; price: string }

/** `startAdding` opens the add-range row on mount (Replace from a date's "add a price range instead", build plan Phase 49). */
export function PriceRangesTable({ contract, actor, startAdding = false }: { contract: Contract; actor: Actor; startAdding?: boolean }) {
  const today = useToday()
  const ranges = rangesOf(contract)
  const locks = useAppStore((s) => s.billing.locks)
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const kept = useMemo(() => keptPriceOnContract(locks, contract.id, rangesOf(contract)), [locks, contract])
  const priced = useMemo(() => pricedPerRange({ schedule, billing }, contract.id, contract), [contract, schedule, billing])
  const inForce = rangeInForce(contract, today)
  const rows = rangeRows(ranges, today)
  const [expanded, setExpanded] = useState(false)
  const { shown, folded } = foldRows(rows, expanded)
  const endedCount = rows.filter((r) => r.state === 'ended').length
  const sorted = [...ranges].sort((a, b) => a.startISO.localeCompare(b.startISO))
  // One row in edit at a time: the new range (`adding`), or a range being corrected (its start).
  const [adding, setAdding] = useState<Draft | null>(() => (startAdding ? { startISO: '', price: '' } : null))
  const [correcting, setCorrecting] = useState<{ startISO: string; draft: Draft } | null>(null)
  const [error, setError] = useState<{ row: string; message: string } | null>(null)
  const last = ranges.length <= 1
  const editing = adding !== null || correcting !== null

  function startAdd() {
    setCorrecting(null)
    setAdding({ startISO: '', price: '' })
    setError(null)
  }

  function add() {
    if (adding === null) return
    // The store refuses a blank start or price in its own words.
    const outcome = addPriceRange(useAppStore, actor, contract.id, { startISO: adding.startISO, price: parsePriceText(adding.price) })
    if (!outcome.ok) {
      setError({ row: 'new', message: outcome.message })
      return
    }
    setAdding(null)
    setError(null)
  }

  function startCorrect(r: PriceRange) {
    setAdding(null)
    setCorrecting({ startISO: r.startISO, draft: { startISO: r.startISO, price: priceInputText(r.price) } })
    setError(null)
  }

  function saveCorrect() {
    if (correcting === null) return
    const outcome = editPriceRange(useAppStore, actor, contract.id, correcting.startISO, { startISO: correcting.draft.startISO, price: parsePriceText(correcting.draft.price) })
    if (!outcome.ok) {
      setError({ row: correcting.startISO, message: outcome.message })
      return
    }
    setCorrecting(null)
    setError(null)
  }

  function remove(startISO: string) {
    const outcome = deletePriceRange(useAppStore, actor, contract.id, startISO)
    if (!outcome.ok) {
      setError({ row: startISO, message: outcome.message })
      return
    }
    setCorrecting(null)
    setError(null)
  }

  function cancel() {
    setAdding(null)
    setCorrecting(null)
    setError(null)
  }

  function keys(e: KeyboardEvent, onEnter: () => void) {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  }

  const draftFields = (draft: Draft, set: (d: Draft) => void, label: string) => (
    <>
      <Td style={{ verticalAlign: 'middle' }}>
        <TextField type="date" label={`Start of ${label}`} hideLabel size="compact" mono width={DATE_WIDTH} value={draft.startISO} onChange={(startISO) => set({ ...draft, startISO })} autoFocus />
      </Td>
      <Td style={{ verticalAlign: 'middle', color: neutral.mist }}>{draft.startISO !== '' ? 'Worked out' : ''}</Td>
      <Td align="right" style={{ verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TextField label={`Price (ex GST) of ${label}`} hideLabel size="compact" mono inputMode="decimal" align="right" width={PRICE_WIDTH} placeholder="0.00" value={draft.price} onChange={(price) => set({ ...draft, price })} />
        </div>
      </Td>
    </>
  )

  const errorRow = (row: string) =>
    error !== null && error.row === row ? (
      <tr>
        <Td colSpan={6} style={{ borderBottom: 'none', paddingTop: 0 }}>
          <FormError variant="inline" message={error.message} shot="price-range-error" />
        </Td>
      </tr>
    ) : null

  return (
    <Card
      title={<>Price ranges <CountBadge count={ranges.length} hideAtZero={false} mono srNoun="ranges" /></>}
      shot="contract-price-ranges"
      editing={editing}
      aside={<span style={{ fontSize: 12, color: neutral.mist, fontWeight: 400 }}>The range in force on the procedure date gives the price.</span>}
      {...(adding !== null
        ? {
            footer: (
              <>
                <Button variant="secondary" size="compact" onClick={cancel}>Cancel</Button>
                <Button variant="primary" size="compact" onClick={add} shot="price-range-add-save">Add price range</Button>
              </>
            ),
          }
        : {})}
    >
      <TableShell label="Price ranges" density="dense">
        <thead>
          <tr>
            <Th>From</Th>
            <Th>To</Th>
            <Th align="right">Price ex GST</Th>
            <Th align="right">Change</Th>
            <Th align="right">Procedures</Th>
            <Th align="right"><span style={visuallyHidden}>State and actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {adding !== null && (
            <>
              <tr data-shot="price-range-add" data-adding="" onKeyDown={(e) => keys(e, add)} style={{ background: neutral.bg }}>
                {draftFields(adding, setAdding, 'the new range')}
                <Td align="right" mono style={{ verticalAlign: 'middle', color: neutral.mist }}>
                  {sorted.length > 0 && adding.startISO !== '' && Number.isFinite(parsePriceText(adding.price))
                    ? rangeChangeText([...sorted].filter((r) => r.startISO < adding.startISO).pop(), { startISO: adding.startISO, price: parsePriceText(adding.price) })
                    : ''}
                </Td>
                <Td colSpan={2} align="right" style={{ verticalAlign: 'middle' }}>
                  <FieldHint>May be in the past.</FieldHint>
                </Td>
              </tr>
              {errorRow('new')}
            </>
          )}
          {shown.map(({ range: r, index, endISO, state }) => {
            const prev = sorted[index - 1]
            const rowStyle = { verticalAlign: 'middle' as const, ...(state === 'inForce' ? { background: neutral.sunken } : {}), ...(state === 'ended' ? { color: neutral.slate } : {}) }
            if (correcting?.startISO === r.startISO) {
              return (
                <Fragment key={r.startISO}>
                <tr data-shot="price-range-row" data-range-start={r.startISO} data-correcting="" onKeyDown={(e) => keys(e, saveCorrect)}>
                  {draftFields(correcting.draft, (draft) => setCorrecting({ startISO: r.startISO, draft }), `the range from ${formatRangeDate(r.startISO)}`)}
                  <Td />
                  <Td />
                  <Td align="right" nowrap style={{ verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', gap: 10 }}>
                      <TextAction size="sm" flush onClick={saveCorrect}>Save</TextAction>
                      <TextAction size="sm" flush onClick={cancel}>Cancel</TextAction>
                      <span title={last ? 'A Contract keeps at least one price range.' : undefined}>
                        <TextAction size="sm" flush onClick={() => remove(r.startISO)} disabled={last} label={last ? 'Remove (a Contract keeps at least one price range)' : `Remove the range from ${formatRangeDate(r.startISO)}`}>
                          Remove
                        </TextAction>
                      </span>
                    </span>
                  </Td>
                </tr>
                {errorRow(r.startISO)}
                </Fragment>
              )
            }
            return (
              <Fragment key={r.startISO}>
              <tr data-shot="price-range-row" data-range-start={r.startISO} data-in-force={state === 'inForce' && inForce?.startISO === r.startISO ? 'today' : undefined} data-range-state={state}>
                <Td mono nowrap style={rowStyle}>{formatRangeDate(r.startISO)}</Td>
                <Td mono nowrap style={{ ...rowStyle, ...(endISO === null ? { color: neutral.mist } : {}) }}>{endISO === null ? 'Onwards' : formatRangeDate(endISO)}</Td>
                <Td mono bold={state !== 'ended'} align="right" style={{ ...rowStyle, fontVariantNumeric: 'tabular-nums' }}>{formatRangePrice(r.price)}</Td>
                <Td mono align="right" style={{ ...rowStyle, ...(prev === undefined ? { color: neutral.mist } : {}) }} data-range-change="">{rangeChangeText(prev, r)}</Td>
                <Td mono align="right" style={rowStyle} data-range-priced="">{priced[r.startISO] ?? 0}</Td>
                <Td align="right" nowrap style={rowStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    {state === 'inForce' && <Pill size="sm" tone="success">In force</Pill>}
                    {state === 'future' && <Pill size="sm">Future</Pill>}
                    <TextAction size="sm" flush onClick={() => startCorrect(r)} label={`Correct the range from ${formatRangeDate(r.startISO)}`} data-action="correct">Correct</TextAction>
                  </span>
                </Td>
              </tr>
              {errorRow(r.startISO)}
              </Fragment>
            )
          })}
          {inForce === null && sorted[0] !== undefined && (
            <tr>
              <Td colSpan={6} style={{ color: neutral.slate }}>
                Not in force today: the first range starts {formatRangeDate(sorted[0].startISO)}.
              </Td>
            </tr>
          )}
        </tbody>
      </TableShell>
      {endedCount > ENDED_SHOWN && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {expanded ? (
            <TextAction
              size="sm"
              flush
              onClick={() => {
                // A range being corrected below the fold would vanish with its Save: close it first.
                if (correcting !== null && folded.length === 0 && foldRows(rows, false).folded.some((r) => r.range.startISO === correcting.startISO)) cancel()
                setExpanded(false)
              }}
              shot="price-range-fold"
            >
              Show fewer ranges
            </TextAction>
          ) : (
            <TextAction size="sm" flush onClick={() => setExpanded(true)} shot="price-range-fold">
              {`Show ${folded.length} earlier ${folded.length === 1 ? 'range' : 'ranges'}, back to ${formatRangeDate(folded[folded.length - 1]!.range.startISO)}`}
            </TextAction>
          )}
        </div>
      )}
      {adding === null && (
        <div data-shot="price-range-add-open">
          <AddRowButton onClick={startAdd}>Add a price range</AddRowButton>
        </div>
      )}
      <FieldHint>
        Newest first. A range runs to the day before the next one starts. A start may be in the past: every Procedure on this Contract that nothing holds re-prices at once, and invoices already raised stay as they are.
      </FieldHint>
      {kept.length > 0 && (
        <ContractChangeNotice
          title={keptPriceTitle(kept.length)}
          columns={[{ label: 'Date', mono: true }, { label: 'Locked', align: 'right', mono: true }, { label: 'Range', align: 'right', mono: true }]}
          rows={kept.map((r) => ({
            key: r.procedureId,
            bookingId: r.bookingId,
            dateISO: r.dateISO,
            patientName: r.patientName,
            cells: [shortDay(r.dateISO), formatRangePrice(r.lockedPrice), formatRangePrice(r.rangePrice)],
          }))}
          shot="price-range-kept"
          rowShot="price-range-kept-row"
        >
          Their Lists were authorised, so they keep the price they were locked at. Their invoices stay as raised.
        </ContractChangeNotice>
      )}
    </Card>
  )
}
