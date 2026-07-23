import { useEffect, useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { Contract, ContractHolderType, ContractType2Detail } from '../../../domain/types'
import {
  addContractPrice,
  createContract,
  deleteContract,
  editContract,
  editContractPrice,
  useAppStore,
  type Actor,
} from '../../../store'
import { Button, FieldLabel, Segmented, TextField } from '../../../shared'
import { useSurface } from '../../../shared'
import { selectControlStyle as selectStyle } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Present = edit; absent = create. */
  contract?: Contract
  onClose: () => void
}

const HOLDER_TYPES: { value: ContractHolderType; label: string }[] = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'insurer', label: 'Insurer' },
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'billableParty', label: 'Billable party' },
]

export function ContractEditSheet({ open, actor, contract, onClose }: Props) {
  const { Overlay } = useSurface()
  const masters = useAppStore((s) => s.masters)
  const contractPricesRecord = useAppStore((s) => s.masters.contractPrices)

  const editing = contract !== undefined
  const protectedDefault = contract?.isDefault === true && contract.type === 1

  const [name, setName] = useState('')
  const [type, setType] = useState<'1' | '2' | '3'>('1')
  const [holderType, setHolderType] = useState<ContractHolderType>('hospital')
  const [holderId, setHolderId] = useState('')
  const [scopeKind, setScopeKind] = useState<'organisation' | 'individualAnaesthetist'>('organisation')
  const [scopeAnaesthetistId, setScopeAnaesthetistId] = useState('')
  const [permits, setPermits] = useState<'yes' | 'no'>('no')
  const [effectiveFromISO, setEffectiveFromISO] = useState('')
  const [effectiveToISO, setEffectiveToISO] = useState('')
  const [type2Basis, setType2Basis] = useState<'agreedUnitRate' | 'percentDiscount'>('agreedUnitRate')
  const [type2Value, setType2Value] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(contract?.name ?? '')
    setType(String(contract?.type ?? 1) as '1' | '2' | '3')
    setHolderType(contract?.holderType ?? 'hospital')
    setHolderId(contract?.holderId ?? '')
    setScopeKind(contract?.scope.kind ?? 'organisation')
    setScopeAnaesthetistId(contract?.scope.kind === 'individualAnaesthetist' ? contract.scope.anaesthetistId : '')
    setPermits(contract?.permitsIndividualArrangement ? 'yes' : 'no')
    setEffectiveFromISO(contract?.effectiveFromISO ?? '')
    setEffectiveToISO(contract?.effectiveToISO ?? '')
    setType2Basis(contract?.type2Detail?.basis ?? 'agreedUnitRate')
    setType2Value(
      contract?.type2Detail === undefined
        ? ''
        : String(contract.type2Detail.basis === 'agreedUnitRate' ? contract.type2Detail.unitRate : contract.type2Detail.percent),
    )
    setError(null)
  }, [open, contract])

  const holderOptions = useMemo(() => {
    switch (holderType) {
      case 'hospital': return Object.values(masters.hospitals).map((h) => ({ id: h.id, name: h.name }))
      case 'insurer': return Object.values(masters.insurers).map((i) => ({ id: i.id, name: i.name }))
      case 'surgeon': return Object.values(masters.surgeons).map((s) => ({ id: s.id, name: s.name }))
      case 'organisation': return Object.values(masters.organisations).map((o) => ({ id: o.id, name: o.name }))
      case 'billableParty': return Object.values(masters.billableParties).map((b) => ({ id: b.hiddenInternalId, name: b.name }))
    }
  }, [holderType, masters])

  const priceRows = useMemo(
    () => (contract !== undefined ? Object.values(contractPricesRecord).filter((p) => p.contractId === contract.id) : []),
    [contract, contractPricesRecord],
  )

  function save() {
    const numType = Number(type) as 1 | 2 | 3
    let type2Detail: ContractType2Detail | undefined
    if (numType === 2) {
      const v = Number(type2Value)
      if (!Number.isFinite(v) || v <= 0) {
        setError('Enter the agreed rate or discount for the Type 2 contract.')
        return
      }
      type2Detail = type2Basis === 'agreedUnitRate' ? { basis: 'agreedUnitRate', unitRate: v } : { basis: 'percentDiscount', percent: v }
    }
    const scope = scopeKind === 'individualAnaesthetist' && scopeAnaesthetistId !== ''
      ? { kind: 'individualAnaesthetist' as const, anaesthetistId: scopeAnaesthetistId }
      : { kind: 'organisation' as const }

    if (editing) {
      const patch = {
        name,
        type: numType,
        holderType,
        holderId,
        scope,
        permitsIndividualArrangement: permits === 'yes',
        effectiveFromISO,
        effectiveToISO: effectiveToISO === '' ? undefined : effectiveToISO,
        ...(numType === 2 ? { type2Detail } : {}),
      }
      const outcome = editContract(useAppStore, actor, contract!.id, patch)
      if (!outcome.ok) { setError(outcome.message); return }
      onClose()
    } else {
      const outcome = createContract(useAppStore, actor, {
        name,
        type: numType,
        holderType,
        holderId,
        scope,
        permitsIndividualArrangement: permits === 'yes',
        effectiveFromISO,
        ...(effectiveToISO !== '' ? { effectiveToISO } : {}),
        ...(numType === 2 && type2Detail !== undefined ? { type2Detail } : {}),
      })
      if (!outcome.ok) { setError(outcome.message); return }
      onClose()
    }
  }

  function remove() {
    if (contract === undefined) return
    const outcome = deleteContract(useAppStore, actor, contract.id)
    if (!outcome.ok) { setError(outcome.message); return }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit contract' : 'New contract'}</div>

        {protectedDefault && (
          <div style={{ background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 12.5 }}>
            Protected default Type 1. It must always exist as the fallback, so it cannot be deleted or end-dated. Its name can still be edited.
          </div>
        )}

        <TextField label="Name" value={name} onChange={setName} />
        <Segmented label="Type" value={type} options={[{ value: '1', label: 'Type 1 units' }, { value: '2', label: 'Type 2 rate' }, { value: '3', label: 'Type 3 fixed' }]} onChange={setType} disabled={protectedDefault} />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Holder type</FieldLabel>
          <select value={holderType} onChange={(e) => { setHolderType(e.target.value as ContractHolderType); setHolderId('') }} style={selectStyle} disabled={protectedDefault}>
            {HOLDER_TYPES.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Holder</FieldLabel>
          <select value={holderId} onChange={(e) => setHolderId(e.target.value)} style={selectStyle} disabled={protectedDefault}>
            <option value="">Select a holder</option>
            {holderOptions.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
        </label>

        <Segmented label="Scope" value={scopeKind} options={[{ value: 'organisation', label: 'Organisational' }, { value: 'individualAnaesthetist', label: 'Individual' }]} onChange={setScopeKind} />
        {scopeKind === 'individualAnaesthetist' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Anaesthetist</FieldLabel>
            <select value={scopeAnaesthetistId} onChange={(e) => setScopeAnaesthetistId(e.target.value)} style={selectStyle}>
              <option value="">Select an anaesthetist</option>
              {Object.values(masters.anaesthetists).map((a) => (<option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>))}
            </select>
          </label>
        )}

        {type === '2' && (
          <>
            <Segmented label="Type 2 basis" value={type2Basis} options={[{ value: 'agreedUnitRate', label: 'Agreed $/unit' }, { value: 'percentDiscount', label: '% discount' }]} onChange={setType2Basis} />
            <TextField label={type2Basis === 'agreedUnitRate' ? 'Agreed unit rate ($)' : 'Discount (%)'} value={type2Value} onChange={setType2Value} mono />
          </>
        )}

        <Segmented label="Permits individual arrangement (Method 3)" value={permits} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={setPermits} />
        <TextField label="Effective from" value={effectiveFromISO} onChange={setEffectiveFromISO} type="date" />
        {!protectedDefault && <TextField label="Effective to (optional)" value={effectiveToISO} onChange={setEffectiveToISO} type="date" />}

        {editing && type === '3' && (
          <PriceRows contractId={contract!.id} rows={priceRows} actor={actor} rvgCodes={masters.rvgCodes} onError={setError} />
        )}

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}

        <Button variant="primary" block onClick={save}>{editing ? 'Save contract' : 'Create contract'}</Button>
        {editing && (
          <button
            type="button"
            onClick={protectedDefault ? undefined : remove}
            disabled={protectedDefault}
            style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${semantic.error.solid}55`, background: neutral.surface, color: protectedDefault ? neutral.mist : semantic.error.onTint, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: protectedDefault ? 'default' : 'pointer' }}
          >
            {protectedDefault ? 'Delete (protected default)' : 'Delete contract'}
          </button>
        )}
      </div>
    </Overlay>
  )
}

function PriceRows({
  contractId,
  rows,
  actor,
  rvgCodes,
  onError,
}: {
  contractId: string
  rows: { id: string; rvgBaseCode?: string; procedureOrdinal?: number; price: number }[]
  actor: Actor
  rvgCodes: Record<string, { code: string; description: string }>
  onError: (message: string) => void
}) {
  const [code, setCode] = useState('')
  const [ordinal, setOrdinal] = useState('')
  const [price, setPrice] = useState('')

  function add() {
    const p = Number(price)
    if (!Number.isFinite(p) || p <= 0) {
      onError('Enter a price greater than zero for the new row.')
      return
    }
    const outcome = addContractPrice(useAppStore, actor, {
      contractId,
      ...(code !== '' ? { rvgBaseCode: code } : {}),
      ...(ordinal !== '' ? { procedureOrdinal: Number(ordinal) } : {}),
      price: p,
    })
    if (!outcome.ok) { onError(outcome.message); return }
    setCode('')
    setOrdinal('')
    setPrice('')
  }

  return (
    <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <FieldLabel>Fixed price rows</FieldLabel>
      {rows.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>No price rows yet.</div>}
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          <span className="mono" style={{ flex: 1 }}>{r.rvgBaseCode ?? 'any'}{r.procedureOrdinal !== undefined ? ` · ordinal ${r.procedureOrdinal}` : ''}</span>
          <span className="mono">$</span>
          <input
            defaultValue={String(r.price)}
            onBlur={(e) => {
              const p = Number(e.target.value)
              if (Number.isFinite(p) && p > 0 && p !== r.price) {
                const outcome = editContractPrice(useAppStore, actor, r.id, { price: p })
                if (!outcome.ok) onError(outcome.message)
              }
            }}
            style={{ ...selectStyle, width: 90, minHeight: 34, padding: '0 8px' }}
            className="mono"
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <select value={code} onChange={(e) => setCode(e.target.value)} style={{ ...selectStyle, minHeight: 34, flex: 1 }}>
          <option value="">Any code</option>
          {Object.values(rvgCodes).map((c) => (<option key={c.code} value={c.code}>{c.code}</option>))}
        </select>
        <input value={ordinal} onChange={(e) => setOrdinal(e.target.value)} placeholder="ord" style={{ ...selectStyle, width: 56, minHeight: 34, padding: '0 8px' }} className="mono" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="price" style={{ ...selectStyle, width: 80, minHeight: 34, padding: '0 8px' }} className="mono" />
        <Button variant="secondary" onClick={add}>Add row</Button>
      </div>
    </div>
  )
}
