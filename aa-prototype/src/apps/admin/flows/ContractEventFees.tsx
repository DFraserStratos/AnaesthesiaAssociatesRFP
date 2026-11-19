/**
 * A Contract's event fees in the Contract editor (catch-up Phase 39b;
 * US-03.7.2, OQ-12): the fixed fee the Contract charges for a type of pre-op
 * or post-op event, in place of the time recorded. Office only. The price
 * ranges' table anatomy beside it (`ContractPriceRanges`): Event type, Holder
 * code and description, Fixed price, and the row's actions; added, edited in
 * place and removed straight away through the store's audited actions, every
 * rule and sentence the store's. A fee never changes a Procedure's price or
 * the picker; an approved event keeps its frozen price.
 */

import { useState } from 'react'
import type { Contract, ContractEventFee } from '../../../domain/types'
import { eventFeesForContract } from '../../../domain/billing/contractEventFees'
import { EVENT_TYPES, type PrePostOpEventType } from '../../../domain/billing/prePostOpEvent'
import { parseAmount } from '../../../domain/billing/money'
import { addContractEventFee, editContractEventFee, removeContractEventFee, useAppStore, type Actor } from '../../../store'
import { Button, FieldLabel } from '../../../shared'
import { SelectField, TextAction, TextField, visuallyHidden } from '../../../shared/ui'
import { TableShell, Td, Th } from '../../../shared/table'
import { EVENT_TYPE_LABEL, PRE_POST_OP_COPY as COPY } from '../../../shared/procedureEventCopy'
import { formatCurrency } from '../../../shared/format'
import { neutral } from '../../../theme/tokens'

const TYPES = Object.keys(EVENT_TYPES) as PrePostOpEventType[]

interface Draft {
  eventType: PrePostOpEventType
  holderCode: string
  holderDescription: string
  price: string
}

const EMPTY: Draft = { eventType: 'postOpWardReview', holderCode: '', holderDescription: '', price: '' }

function inputOf(d: Draft) {
  return { eventType: d.eventType, holderCode: d.holderCode, holderDescription: d.holderDescription, fixedPrice: parseAmount(d.price) ?? Number.NaN }
}

export function ContractEventFees({ contract, actor, onError }: { contract: Contract; actor: Actor; onError: (message: string | null) => void }) {
  const all = useAppStore((s) => s.masters.contractEventFees)
  const fees = eventFeesForContract(all, contract.id)
  const [editing, setEditing] = useState<{ id: string; draft: Draft } | null>(null)
  const [adding, setAdding] = useState<Draft>({ ...EMPTY })

  function startEdit(f: ContractEventFee) {
    setEditing({ id: f.id, draft: { eventType: f.eventType, holderCode: f.holderCode ?? '', holderDescription: f.holderDescription ?? '', price: f.fixedPrice.toFixed(2) } })
    onError(null)
  }

  function saveEdit() {
    if (editing === null) return
    const out = editContractEventFee(useAppStore, actor, editing.id, inputOf(editing.draft))
    onError(out.ok ? null : out.message)
    if (out.ok) setEditing(null)
  }

  function remove(id: string) {
    const out = removeContractEventFee(useAppStore, actor, id)
    onError(out.ok ? null : out.message)
  }

  function add() {
    const out = addContractEventFee(useAppStore, actor, contract.id, inputOf(adding))
    onError(out.ok ? null : out.message)
    if (out.ok) setAdding({ ...EMPTY })
  }

  const typeSelect = (value: PrePostOpEventType, onChange: (t: PrePostOpEventType) => void, label: string) => (
    <SelectField label={label} hideLabel size="compact" value={value} onChange={(v) => onChange(v as PrePostOpEventType)}>
      {TYPES.map((t) => (
        <option key={t} value={t}>
          {EVENT_TYPE_LABEL[t]}
        </option>
      ))}
    </SelectField>
  )

  return (
    <div data-shot="contract-event-fees" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <FieldLabel>{COPY.eventFeesTitle}</FieldLabel>
      </div>
      <span style={{ fontSize: 12, color: neutral.mist }}>{COPY.eventFeesCaption}</span>
      <TableShell label={COPY.eventFeesTitle} density="dense">
        <thead>
          <tr>
            <Th>Event type</Th>
            <Th>{COPY.holderCodeLabel}</Th>
            <Th align="right">Fixed price (ex GST)</Th>
            <Th align="right"><span style={visuallyHidden}>Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {fees.length === 0 && (
            <tr>
              <Td colSpan={4} style={{ color: neutral.slate }}>{COPY.eventFeesEmpty}</Td>
            </tr>
          )}
          {fees.map((f) =>
            editing?.id === f.id ? (
              <tr key={f.id} data-shot="contract-event-fee-row" data-fee-id={f.id}>
                <Td style={{ verticalAlign: 'middle' }}>{typeSelect(editing.draft.eventType, (eventType) => setEditing({ ...editing, draft: { ...editing.draft, eventType } }), 'Event type')}</Td>
                <Td style={{ verticalAlign: 'middle' }}>
                  <TextField label={COPY.holderCodeLabel} hideLabel size="compact" mono value={editing.draft.holderCode} onChange={(holderCode) => setEditing({ ...editing, draft: { ...editing.draft, holderCode } })} />
                </Td>
                <Td align="right" style={{ verticalAlign: 'middle' }}>
                  <TextField label={COPY.fixedPriceLabel} hideLabel size="compact" mono align="right" inputMode="decimal" width={96} value={editing.draft.price} onChange={(price) => setEditing({ ...editing, draft: { ...editing.draft, price } })} />
                </Td>
                <Td align="right" nowrap style={{ verticalAlign: 'middle' }}>
                  <span style={{ display: 'inline-flex', gap: 10 }}>
                    <TextAction size="sm" flush onClick={saveEdit}>Save</TextAction>
                    <TextAction size="sm" flush onClick={() => setEditing(null)}>Cancel</TextAction>
                  </span>
                </Td>
              </tr>
            ) : (
              <tr key={f.id} data-shot="contract-event-fee-row" data-fee-id={f.id}>
                <Td>{EVENT_TYPE_LABEL[f.eventType]}</Td>
                <Td>
                  {f.holderCode !== undefined && <span className="mono">{f.holderCode}</span>}
                  {f.holderDescription !== undefined && <div style={{ fontSize: 12, color: neutral.slate }}>{f.holderDescription}</div>}
                </Td>
                <Td mono bold align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(f.fixedPrice)}</Td>
                <Td align="right" nowrap>
                  <span style={{ display: 'inline-flex', gap: 10 }}>
                    <TextAction size="sm" flush onClick={() => startEdit(f)} label={`Edit the ${EVENT_TYPE_LABEL[f.eventType]} fee`}>Edit</TextAction>
                    <TextAction size="sm" flush onClick={() => remove(f.id)} label={`Remove the ${EVENT_TYPE_LABEL[f.eventType]} fee`}>Remove</TextAction>
                  </span>
                </Td>
              </tr>
            ),
          )}
          <tr data-shot="contract-event-fee-add">
            <Td style={{ verticalAlign: 'middle', borderBottom: 'none' }}>{typeSelect(adding.eventType, (eventType) => setAdding({ ...adding, eventType }), 'New fee event type')}</Td>
            <Td style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
              <TextField label="New fee holder code" hideLabel size="compact" mono placeholder={COPY.holderCodeLabel} value={adding.holderCode} onChange={(holderCode) => setAdding({ ...adding, holderCode })} />
            </Td>
            <Td align="right" style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
              <TextField label="New fee fixed price (ex GST)" hideLabel size="compact" mono align="right" inputMode="decimal" width={96} placeholder="0.00" value={adding.price} onChange={(price) => setAdding({ ...adding, price })} />
            </Td>
            <Td align="right" style={{ verticalAlign: 'middle', borderBottom: 'none' }}>
              <Button variant="primary" size="compact" onClick={add} shot="contract-event-fee-add-button">
                {COPY.addEventFee}
              </Button>
            </Td>
          </tr>
        </tbody>
      </TableShell>
    </div>
  )
}
