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
import { TextField, visuallyHidden } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { Pill } from '../components/MasterPills'
import { TextAction } from '../screens/masters/chrome'
import { neutral } from '../../../theme/tokens'

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
    <div ref={tableRef} data-shot="contract-price-ranges" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <FieldLabel>Price ranges</FieldLabel>
        <span style={{ fontSize: 12, color: neutral.mist }}>The range in force on the procedure date gives the price.</span>
      </div>
      <TableShell label="Price ranges" density="dense">
          <thead>
            <tr>
              <Th>Start</Th>
              <Th align="right">Price (ex GST)</Th>
              <Th>In force</Th>
              <Th align="right"><span style={visuallyHidden}>Actions</span></Th>
            </tr>
          </thead>
          <tbody>
            {ranges.map((r, i) => {
              const current = inForce?.startISO === r.startISO
              const rowStyle = { verticalAlign: 'middle' as const, ...(current ? { background: neutral.sunken } : {}) }
              if (editing === r.startISO) {
                return (
                  <tr key={r.startISO} data-shot="price-range-row" data-range-start={r.startISO} onKeyDown={(e) => editKeys(e, r.startISO)}>
                    <Td style={rowStyle}>
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
                    </Td>
                    <Td align="right" style={rowStyle}>
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
                    </Td>
                    <Td style={rowStyle} />
                    <Td align="right" nowrap style={rowStyle}>
                      <span style={{ display: 'inline-flex', gap: 10 }}>
                        <TextAction onClick={() => saveEdit(r.startISO)}>Save</TextAction>
                        <TextAction onClick={() => cancelEdit(r.startISO)}>Cancel</TextAction>
                      </span>
                    </Td>
                  </tr>
                )
              }
              return (
                <tr key={r.startISO} data-shot="price-range-row" data-range-start={r.startISO} data-in-force={current ? 'today' : undefined}>
                  <Td mono style={rowStyle}>{formatRangeDate(r.startISO)}</Td>
                  <Td mono bold align="right" style={{ ...rowStyle, fontVariantNumeric: 'tabular-nums' }}>
                    {formatRangePrice(r.price)}
                  </Td>
                  <Td style={rowStyle}>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <span style={{ color: neutral.slate, whiteSpace: 'nowrap' }}>{rangeSpanText(ranges, i)}</span>
                      {current && <Pill size="sm">In force today</Pill>}
                    </span>
                  </Td>
                  <Td align="right" nowrap style={rowStyle}>
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
                  </Td>
                </tr>
              )
            })}
            {inForce === null && ranges[0] !== undefined && (
              <tr>
                <Td colSpan={4} style={{ color: neutral.slate }}>
                  Not in force today: the first range starts {formatRangeDate(ranges[0].startISO)}.
                </Td>
              </tr>
            )}
            <tr data-shot="price-range-add">
              <Td style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
                <TextField type="date" label="New range start" hideLabel size="compact" mono width={DATE_WIDTH} value={newStart} onChange={setNewStart} />
              </Td>
              <Td align="right" style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
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
              </Td>
              <Td colSpan={2} align="right" style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
                <Button variant="primary" size="compact" onClick={add}>
                  Add price range
                </Button>
              </Td>
            </tr>
          </tbody>
      </TableShell>
      <span style={{ fontSize: 12, color: neutral.mist }}>
        A start may be in the past: every Procedure on this Contract that nothing holds re-prices at once. Invoices already raised stay as they are.
      </span>
    </div>
  )
}
