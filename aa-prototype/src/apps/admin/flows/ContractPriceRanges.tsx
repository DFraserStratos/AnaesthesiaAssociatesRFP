/**
 * A fixed-price Contract's price ranges in the Contract editor (catch-up
 * Phase 19a; US-04.2.15, US-04.2.14; AR-58 5.6). The Admin Review table
 * anatomy: Start, Price (ex GST), In force, and the row's actions. The range in
 * force today sits on a sunken row with a neutral "In force today" pill. A
 * range is added (any start, past allowed), corrected in place or deleted
 * (never the last) straight away through the store's audited actions; every
 * rule and sentence is the store's (`validatePriceRanges`, "never the last").
 * The panel works out nothing: the spans and the range in force come from
 * `priceRanges.ts`.
 */

import { useRef, useState, type KeyboardEvent } from 'react'
import type { Contract, PriceRange } from '../../../domain/types'
import { formatRangeDate, formatRangePrice, parsePriceText, rangeInForce, rangeSpanText, rangesOf } from '../../../domain/billing/priceRanges'
import { addPriceRange, deletePriceRange, editPriceRange, useAppStore, useToday, type Actor } from '../../../store'
import { Button, FieldLabel } from '../../../shared'
import { TextField } from '../../../shared/ui'
import { Pill } from '../components/MasterPills'
import { cellStyle, headCellStyle } from '../screens/masters/tableStyles'
import { TextAction } from '../screens/masters/chrome'
import { neutral, radius } from '../../../theme/tokens'

/** The native date control is kept narrow so the table fits the 600px panel. */
const DATE_WIDTH = 132
const PRICE_WIDTH = 96

export function ContractPriceRanges({ contract, actor, onError }: { contract: Contract; actor: Actor; onError: (message: string | null) => void }) {
  const today = useToday()
  const ranges = rangesOf(contract)
  const inForce = rangeInForce(contract, today)
  const [editing, setEditing] = useState<string | null>(null)
  const [draftStart, setDraftStart] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newPrice, setNewPrice] = useState('')
  // Focus returns to a control that stays mounted after a row changes.
  const tableRef = useRef<HTMLDivElement>(null)
  const focusLater = (selector: string) =>
    window.requestAnimationFrame(() => tableRef.current?.querySelector<HTMLElement>(selector)?.focus())

  function startEdit(r: PriceRange) {
    setEditing(r.startISO)
    setDraftStart(r.startISO)
    setDraftPrice(r.price.toFixed(2))
    onError(null)
  }

  function saveEdit(startISO: string) {
    const outcome = editPriceRange(useAppStore, actor, contract.id, startISO, { startISO: draftStart, price: parsePriceText(draftPrice) })
    if (!outcome.ok) {
      onError(outcome.message)
      return
    }
    onError(null)
    setEditing(null)
    focusLater(`[data-range-start="${draftStart}"] [data-action=edit]`)
  }

  function cancelEdit(startISO: string) {
    setEditing(null)
    onError(null)
    focusLater(`[data-range-start="${startISO}"] [data-action=edit]`)
  }

  function editKeys(e: KeyboardEvent, startISO: string) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(startISO)
    } else if (e.key === 'Escape') {
      // Close the edit, not the panel around it.
      e.preventDefault()
      e.stopPropagation()
      cancelEdit(startISO)
    }
  }

  function remove(startISO: string) {
    const outcome = deletePriceRange(useAppStore, actor, contract.id, startISO)
    onError(outcome.ok ? null : outcome.message)
    if (outcome.ok) focusLater('[data-shot=price-range-add] input')
  }

  function add() {
    // The store refuses a blank start or price in its own words.
    const outcome = addPriceRange(useAppStore, actor, contract.id, { startISO: newStart, price: parsePriceText(newPrice) })
    if (!outcome.ok) {
      onError(outcome.message)
      return
    }
    onError(null)
    setNewStart('')
    setNewPrice('')
  }

  const last = ranges.length <= 1

  return (
    <div data-shot="contract-price-ranges" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <FieldLabel>Price ranges</FieldLabel>
        <span style={{ fontSize: 12, color: neutral.mist }}>The range in force on the procedure date gives the price.</span>
      </div>
      <div ref={tableRef} style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, overflowX: 'auto', background: neutral.surface }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={headCellStyle}>Start</th>
              <th style={{ ...headCellStyle, textAlign: 'right' }}>Price (ex GST)</th>
              <th style={headCellStyle}>In force</th>
              <th style={{ ...headCellStyle, textAlign: 'right' }} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {ranges.map((r, i) => {
              const current = inForce?.startISO === r.startISO
              const rowStyle = { ...cellStyle, verticalAlign: 'middle' as const, background: current ? neutral.sunken : undefined }
              if (editing === r.startISO) {
                return (
                  <tr key={r.startISO} data-shot="price-range-row" data-range-start={r.startISO} onKeyDown={(e) => editKeys(e, r.startISO)}>
                    <td style={rowStyle}>
                      <TextField
                        type="date"
                        label={`Start of the range from ${formatRangeDate(r.startISO)}`}
                        hideLabel
                        size="compact"
                        mono
                        width={DATE_WIDTH}
                        value={draftStart}
                        onChange={setDraftStart}
                        autoFocus
                      />
                    </td>
                    <td style={{ ...rowStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <TextField
                          label={`Price (ex GST) of the range from ${formatRangeDate(r.startISO)}`}
                          hideLabel
                          size="compact"
                          mono
                          inputMode="decimal"
                          align="right"
                          width={PRICE_WIDTH}
                          value={draftPrice}
                          onChange={setDraftPrice}
                        />
                      </div>
                    </td>
                    <td style={rowStyle} />
                    <td style={{ ...rowStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', gap: 10 }}>
                        <TextAction onClick={() => saveEdit(r.startISO)}>Save</TextAction>
                        <TextAction onClick={() => cancelEdit(r.startISO)}>Cancel</TextAction>
                      </span>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={r.startISO} data-shot="price-range-row" data-range-start={r.startISO} data-in-force={current ? 'today' : undefined}>
                  <td style={rowStyle} className="mono">{formatRangeDate(r.startISO)}</td>
                  <td style={{ ...rowStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }} className="mono">
                    {formatRangePrice(r.price)}
                  </td>
                  <td style={rowStyle}>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ color: neutral.slate, whiteSpace: 'nowrap' }}>{rangeSpanText(ranges, i)}</span>
                      {current && <Pill size="sm">In force today</Pill>}
                    </span>
                  </td>
                  <td style={{ ...rowStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', gap: 10 }}>
                      <span data-action="edit" style={{ display: 'contents' }}>
                        <TextAction onClick={() => startEdit(r)} label={`Edit the range from ${formatRangeDate(r.startISO)}`}>Edit</TextAction>
                      </span>
                      <span title={last ? 'A Contract keeps at least one price range.' : undefined}>
                        <TextAction
                          onClick={() => remove(r.startISO)}
                          label={last ? 'Delete (a Contract keeps at least one price range)' : `Delete the range from ${formatRangeDate(r.startISO)}`}
                          disabled={last}
                        >
                          Delete
                        </TextAction>
                      </span>
                    </span>
                  </td>
                </tr>
              )
            })}
            {inForce === null && ranges[0] !== undefined && (
              <tr>
                <td colSpan={4} style={{ ...cellStyle, color: neutral.slate }}>
                  Not in force today: the first range starts {formatRangeDate(ranges[0].startISO)}.
                </td>
              </tr>
            )}
            <tr data-shot="price-range-add">
              <td style={{ ...cellStyle, verticalAlign: 'middle', borderBottom: 'none' }}>
                <TextField type="date" label="New range start" hideLabel size="compact" mono width={DATE_WIDTH} value={newStart} onChange={setNewStart} />
              </td>
              <td style={{ ...cellStyle, verticalAlign: 'middle', textAlign: 'right', borderBottom: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <TextField
                    label="New range price (ex GST)"
                    hideLabel
                    size="compact"
                    mono
                    inputMode="decimal"
                    align="right"
                    width={PRICE_WIDTH}
                    placeholder="0.00"
                    value={newPrice}
                    onChange={setNewPrice}
                  />
                </div>
              </td>
              <td colSpan={2} style={{ ...cellStyle, verticalAlign: 'middle', textAlign: 'right', borderBottom: 'none' }}>
                <Button variant="primary" onClick={add} style={{ minHeight: 36, padding: '0 14px', fontSize: 13, borderRadius: radius.ctl }}>
                  Add price range
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <span style={{ fontSize: 12, color: neutral.mist }}>
        A start may be in the past: every Procedure on this Contract that nothing holds re-prices at once. Invoices already raised stay as they are.
      </span>
    </div>
  )
}
