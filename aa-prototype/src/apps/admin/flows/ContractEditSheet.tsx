/**
 * The Contract editor (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1) in Master data's wide side panel. A Contract is one priced item:
 * its AA code (assigned on save, editable after), name and holder reference
 * code; its holder Party (fixed after save) and whether it bills the holder or
 * the payer; the surgeons and anaesthetist it is offered for; prepaid and the
 * pricing kind (both fixed after save); and the anaesthetist's override on RVG
 * kinds. It is edited in place, disabled rather than deleted. Every rule and
 * refusal sentence is the store's (`contractRefusal`); the panel only shows
 * the settings a rule makes fixed as read-only.
 *
 * Catch-up Phase 18a (US-04.2.16, US-04.2.17): the specialties it is offered
 * for (none means every specialty) and at most one funding tag, with a live
 * line saying where it will be offered (`destinationOf`). A system Contract
 * (No contract · RVG, or a Fixed price fallback the system makes) shows its
 * settings read-only with one reason; only the fields in
 * `SYSTEM_CONTRACT_EDITABLE_FIELDS` stay live, and it offers no Disable.
 */

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Contract, ContractPricing, PricingKind } from '../../../domain/types'
import { CHOOSABLE_PRICING_KINDS, CONTRACT_REFUSAL_MESSAGES, SYSTEM_CONTRACT_EDITABLE_FIELDS, billsPayerOnly, isRvgKind, takesLinks } from '../../../domain/billing/contracts'
import { destinationHint, destinationOf, isOpenPriceFallback } from '../../../domain/billing/fallbacks'
import { fundingTagsInOrder } from '../../../domain/billing/fundingTags'
import { contractSpecialtyLabel, specialtiesInOrder } from '../../../domain/specialties'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import {
  addContractPrice,
  createContract,
  disableContract,
  editContract,
  editContractPrice,
  enableContract,
  useAppStore,
  type Actor,
} from '../../../store'
import { Button, FieldLabel, FormError, Segmented, TextField } from '../../../shared'
import {
  BILLS_LABEL,
  PARTY_KIND_LABEL,
  PRICING_KIND_LABEL,
  STATUS_LABEL,
} from '../../../shared/contracts'
import { compareBySurname } from '../../../domain/surgeons'
import { neutral, radius, semantic } from '../../../theme/tokens'
import { MasterPanel, PanelGrid, PanelSection } from '../components/MasterPanel'
import { Pill } from '../components/MasterPills'
import { selectControlStyle as selectStyle } from './fieldChrome'

interface Props {
  open: boolean
  actor: Actor
  /** Present: edit; absent: create. */
  contract?: Contract
  /** A new Contract's holder, when opened from a filtered list. */
  initialHolderId?: string
  onClose: () => void
}

type YesNo = 'yes' | 'no'

/** D23 (OQ-73, at Confirm): the one place the reading is labelled. */
const PREPAID_BILLS_PAYER_HELPER = "A prepaid Contract always bills the payer, awaiting AA's confirmation."

export function ContractPanel({ open, actor, contract, initialHolderId, onClose }: Props) {
  const masters = useAppStore((s) => s.masters)
  const editing = contract !== undefined
  const system = contract?.systemRole !== undefined

  // The panel mounts afresh for each Contract it opens, so its fields start from it.
  const [aaCode, setAaCode] = useState(contract?.aaCode ?? '')
  const [name, setName] = useState(contract?.name ?? '')
  const [holderReference, setHolderReference] = useState(contract?.holderReference ?? '')
  const [holderId, setHolderId] = useState(contract?.holderId ?? initialHolderId ?? '')
  const [billsTo, setBillsTo] = useState<Contract['billsTo']>(contract?.billsTo ?? 'holder')
  const [surgeonIds, setSurgeonIds] = useState<string[]>(contract?.linkedSurgeonIds ?? [])
  const [anaesthetistId, setAnaesthetistId] = useState(contract?.linkedAnaesthetistId ?? '')
  const [prepaid, setPrepaid] = useState<YesNo>(contract?.prepaid === true ? 'yes' : 'no')
  const [kind, setKind] = useState<PricingKind>(contract?.pricing.kind ?? 'rvgAnaesthetistRate')
  const [rate, setRate] = useState(contract?.pricing.kind === 'rvgContractRate' ? String(contract.pricing.unitRate) : '')
  const [discount, setDiscount] = useState(contract?.pricing.kind === 'rvgDiscount' ? String(contract.pricing.discountPct) : '')
  const [override, setOverride] = useState<YesNo>(contract?.anaesthetistMayOverridePrice === true ? 'yes' : 'no')
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(contract?.specialtyIds ?? [])
  const [fundingTagId, setFundingTagId] = useState(contract?.fundingTagId ?? '')
  const [error, setError] = useState<string | null>(null)

  const holder = masters.parties[holderId]
  // The rules come from the model module; the panel only shows them.
  const holderForcesPayer = billsPayerOnly(holder?.kind, false)
  const forcedPayer = billsPayerOnly(holder?.kind, prepaid === 'yes')
  const shownBillsTo = forcedPayer ? 'payer' : billsTo
  const showLinks = takesLinks(holder?.kind)
  const rvg = isRvgKind(kind)
  // Where it will be offered, worked out live from the settings as they stand.
  const placement = destinationHint(
    destinationOf({ billsTo: shownBillsTo, prepaid: prepaid === 'yes', holderId, ...(fundingTagId !== '' ? { fundingTagId } : {}) }, masters.parties),
    masters.parties,
    masters.fundingTags,
  )

  const partyGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>()
    for (const p of Object.values(masters.parties).sort((a, b) => a.name.localeCompare(b.name))) {
      const label = PARTY_KIND_LABEL[p.kind]
      groups.set(label, [...(groups.get(label) ?? []), { id: p.id, name: p.name }])
    }
    return [...groups.entries()]
  }, [masters.parties])
  const surgeons = useMemo(() => Object.values(masters.surgeons).sort(compareBySurname), [masters.surgeons])
  const anaesthetists = useMemo(
    () => Object.values(masters.anaesthetists).sort((a, b) => a.name.localeCompare(b.name)),
    [masters.anaesthetists],
  )
  const priceRows = useMemo(
    () => (contract !== undefined ? Object.values(masters.contractPrices).filter((p) => p.contractId === contract.id) : []),
    [contract, masters.contractPrices],
  )

  function pricing(): ContractPricing {
    switch (kind) {
      case 'rvgContractRate':
        return { kind, unitRate: Number(rate) }
      case 'rvgDiscount':
        return { kind, discountPct: Number(discount) }
      case 'fixed':
        return { kind: 'fixed' }
      case 'open':
        return { kind: 'open' }
      default:
        return { kind: 'rvgAnaesthetistRate' }
    }
  }

  function save() {
    const settings = {
      name,
      billsTo: shownBillsTo,
      linkedSurgeonIds: showLinks ? surgeonIds : [],
      anaesthetistMayOverridePrice: rvg && override === 'yes',
      holderReference,
      specialtyIds,
    }
    const outcome = editing
      ? editContract(
          useAppStore,
          actor,
          contract.id,
          system
            ? systemPatch({ name, aaCode })
            : {
                ...settings,
                aaCode,
                pricing: pricing(),
                linkedAnaesthetistId: showLinks && anaesthetistId !== '' ? anaesthetistId : undefined,
                fundingTagId: fundingTagId !== '' ? fundingTagId : undefined,
              },
        )
      : createContract(useAppStore, actor, {
          ...settings,
          holderId,
          pricing: pricing(),
          prepaid: prepaid === 'yes',
          ...(showLinks && anaesthetistId !== '' ? { linkedAnaesthetistId: anaesthetistId } : {}),
          ...(fundingTagId !== '' ? { fundingTagId } : {}),
        })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  function toggleStatus() {
    if (contract === undefined) return
    const outcome = contract.status === 'active' ? disableContract(useAppStore, actor, contract.id) : enableContract(useAppStore, actor, contract.id)
    setError(outcome.ok ? null : outcome.message)
  }

  const meta = editing ? (
    <>
      <span className="mono" style={{ fontWeight: 600, color: neutral.ink }}>{contract.aaCode}</span>
      <Pill tone={contract.status === 'active' ? 'success' : 'neutral'}>{STATUS_LABEL[contract.status]}</Pill>
      {system && <Pill>System</Pill>}
      <span>{masters.parties[contract.holderId]?.name ?? contract.holderId}</span>
    </>
  ) : undefined

  const fixedAfterSave = 'Set when the Contract is created.'

  return (
    <MasterPanel
      open={open}
      onClose={onClose}
      title={editing ? contract.name : 'New contract'}
      meta={meta}
      shot="contract-detail"
      footer={
        <>
          {editing && !system && (
            <div style={{ marginRight: 'auto' }}>
              {contract.status === 'active' ? (
                <button
                  type="button"
                  data-shot="contract-disable"
                  onClick={toggleStatus}
                  style={{ minHeight: 48, padding: '0 18px', borderRadius: radius.ctl, border: `1px solid ${semantic.error.solid}55`, background: neutral.surface, color: semantic.error.onTint, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Disable
                </button>
              ) : (
                <Button variant="secondary" onClick={toggleStatus}>Make active</Button>
              )}
            </div>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>{editing ? 'Save contract' : 'Create contract'}</Button>
        </>
      }
    >
      {system && (
        <div data-shot="contract-system-notice" style={{ background: neutral.sunken, color: neutral.slate, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
          {isOpenPriceFallback(contract)
            ? 'Made by the system: one Fixed price Contract for each place an invoice can go, where a person types the amount on the Procedure. It is always available and never disabled. Only its name and AA code can change.'
            : "No contract · RVG is built in and always available. It is held by Anaesthesia Associates, bills the payer and prices at the anaesthetist's rate. Only its name and AA code can change."}
        </div>
      )}
      {editing && contract.status === 'disabled' && (
        <div style={{ background: neutral.sunken, color: neutral.slate, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
          Disabled: hidden from the Contract list unless asked for. Procedures already on it keep it and bill as normal.
        </div>
      )}

      <PanelSection title="Contract">
        <PanelGrid>
          {editing ? (
            <TextField label="AA code" value={aaCode} onChange={(v) => setAaCode(v.toUpperCase())} mono hint="AA's own unique code." />
          ) : (
            <ReadOnlyField label="AA code" mono>Assigned on save</ReadOnlyField>
          )}
          {system && !SYSTEM_EDITABLE.has('holderReference') ? (
            <ReadOnlyField label="Holder reference code" mono hint="Not set on a system Contract.">{holderReference !== '' ? holderReference : 'None'}</ReadOnlyField>
          ) : (
            <TextField label="Holder reference code" value={holderReference} onChange={setHolderReference} mono hint="The holder's own code, if it has one." />
          )}
        </PanelGrid>
        <TextField label="Name" value={name} onChange={setName} />
      </PanelSection>

      <PanelSection title="Holder and who it bills" shot="contract-links">
        {editing ? (
          <ReadOnlyField label="Holder" hint="Fixed once the Contract is saved.">{holder?.name ?? holderId}</ReadOnlyField>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Holder</FieldLabel>
            <select value={holderId} onChange={(e) => setHolderId(e.target.value)} style={selectStyle}>
              <option value="">Choose the Party that holds it</option>
              {partyGroups.map(([group, list]) => (
                <optgroup key={group} label={group}>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Segmented
            label="Bills"
            value={shownBillsTo}
            options={[
              { value: 'holder', label: BILLS_LABEL.holder },
              { value: 'payer', label: `${BILLS_LABEL.payer} on the Booking` },
            ]}
            onChange={setBillsTo}
            disabled={forcedPayer || system}
          />
          {prepaid === 'yes' ? (
            <Helper>{PREPAID_BILLS_PAYER_HELPER}</Helper>
          ) : holderForcesPayer && !system ? (
            <Helper>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</Helper>
          ) : null}
        </div>
        {showLinks && !system && (
          <PanelGrid>
            <SurgeonPicker surgeons={surgeons} value={surgeonIds} onChange={setSurgeonIds} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Linked anaesthetist</FieldLabel>
              <select value={anaesthetistId} onChange={(e) => setAnaesthetistId(e.target.value)} style={selectStyle}>
                <option value="">None</option>
                {anaesthetists.map((a) => (
                  <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
                ))}
              </select>
            </label>
          </PanelGrid>
        )}
        {holder?.kind === 'hospital' && <Helper>{CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital}</Helper>}
      </PanelSection>

      <PanelSection title="Where it is offered">
        <PanelGrid>
          {system ? (
            <ReadOnlyField label="Specialties" hint="Set by the system: offered for every specialty.">
              {contractSpecialtyLabel(masters, specialtyIds)}
            </ReadOnlyField>
          ) : (
            <ChipMultiSelect
              label="Specialties"
              options={specialtiesInOrder(masters.specialties)}
              value={specialtyIds}
              onChange={setSpecialtyIds}
              addLabel="Add a specialty"
              empty="Every specialty"
              hint="None means every specialty."
              shot="contract-specialties"
            />
          )}
          <div data-shot="contract-funding-tag" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {system ? (
              <ReadOnlyField label="Funding tag" hint="Set by the system for the place it serves.">
                {fundingTagId !== '' ? <span className="mono">{masters.fundingTags[fundingTagId]?.code ?? fundingTagId}</span> : 'None'}
              </ReadOnlyField>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel>Funding tag</FieldLabel>
                <select value={fundingTagId} onChange={(e) => setFundingTagId(e.target.value)} style={selectStyle}>
                  <option value="">None</option>
                  {fundingTagsInOrder(masters.fundingTags).map((t) => (
                    <option key={t.id} value={t.id}>{t.code}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </PanelGrid>
        <div data-shot="contract-placement" aria-live="polite" style={{ fontSize: 13, color: neutral.ink, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '8px 12px' }}>
          {placement}
        </div>
      </PanelSection>

      <PanelSection title="Pricing" shot="contract-settings">
        <PanelGrid>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Segmented label="Prepaid" value={prepaid} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={setPrepaid} disabled={editing} />
            {editing && <Helper>{fixedAfterSave}</Helper>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Pricing kind</FieldLabel>
              <select value={kind} onChange={(e) => setKind(e.target.value as PricingKind)} disabled={editing} style={selectStyle}>
                {(editing && kind === 'open' ? [...CHOOSABLE_PRICING_KINDS, 'open' as const] : CHOOSABLE_PRICING_KINDS).map((k) => (
                  <option key={k} value={k}>{PRICING_KIND_LABEL[k]}</option>
                ))}
              </select>
            </label>
            {editing && <Helper>{fixedAfterSave}</Helper>}
          </div>
        </PanelGrid>
        {kind === 'rvgContractRate' && !system && (
          <TextField label="Rate ($ per unit)" value={rate} onChange={setRate} mono />
        )}
        {kind === 'rvgDiscount' && !system && <TextField label="Discount (%)" value={discount} onChange={setDiscount} mono />}
        {rvg && (
          <Segmented
            label="Anaesthetist may override the price"
            value={override}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
            onChange={setOverride}
            disabled={system}
          />
        )}
        {editing && contract.permitsRateTime && <Helper>Allows hourly rate and time billing lines on its Procedures.</Helper>}
        {editing && kind === 'fixed' && (
          <PriceRows contractId={contract.id} rows={priceRows} actor={actor} rvgCodes={masters.rvgCodes} onError={setError} />
        )}
      </PanelSection>

      <FormError message={error} />
    </MasterPanel>
  )
}

/** The fields a system Contract may change, read from the model's one list. */
const SYSTEM_EDITABLE: ReadonlySet<string> = new Set(SYSTEM_CONTRACT_EDITABLE_FIELDS)

/** A system Contract's save: only the fields `SYSTEM_CONTRACT_EDITABLE_FIELDS` names. */
function systemPatch(values: Partial<Record<(typeof SYSTEM_CONTRACT_EDITABLE_FIELDS)[number], string>>): Partial<Contract> {
  const patch: Partial<Contract> = {}
  for (const k of SYSTEM_CONTRACT_EDITABLE_FIELDS) if (values[k] !== undefined) patch[k] = values[k]
  return patch
}

function Helper({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12.5, color: neutral.mist }}>{children}</div>
}

function ReadOnlyField({ label, children, hint, mono }: { label: string; children: React.ReactNode; hint?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <div className={mono === true ? 'mono' : undefined} style={{ minHeight: 48, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: radius.ctl, background: neutral.sunken, color: neutral.slate, fontSize: 15 }}>
        {children}
      </div>
      {hint !== undefined && <Helper>{hint}</Helper>}
    </div>
  )
}

/** Any number of linked surgeons (OQ-105): chips for the chosen, a select to add one. */
function SurgeonPicker({
  surgeons,
  value,
  onChange,
}: {
  surgeons: { id: string; name: string }[]
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const byId = new Map(surgeons.map((s) => [s.id, s.name]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>Linked surgeons</FieldLabel>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value !== '' && !value.includes(e.target.value)) onChange([...value, e.target.value])
        }}
        style={selectStyle}
      >
        <option value="">Add a surgeon</option>
        {surgeons
          .filter((s) => !value.includes(s.id))
          .map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
      </select>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {value.map((id) => (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px 2px 10px', borderRadius: radius.pill, background: neutral.sunken, color: neutral.ink, fontSize: 12.5, fontWeight: 500 }}>
              {byId.get(id) ?? id}
              <button
                type="button"
                aria-label={`Remove ${byId.get(id) ?? id}`}
                onClick={() => onChange(value.filter((v) => v !== id))}
                style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 2, display: 'inline-flex' }}
              >
                <X size={14} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** The fixed kind's interim price rows (until Phase 19a's price ranges). */
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
    <div data-shot="contract-price-rows" style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <FieldLabel>Fixed prices</FieldLabel>
      {rows.length === 0 && <div style={{ fontSize: 12.5, color: neutral.mist }}>No prices yet: a primary procedure on this Contract cannot be billed until it has one.</div>}
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
          <span className="mono" style={{ flex: 1 }}>{r.rvgBaseCode ?? 'Any code'}{r.procedureOrdinal !== undefined ? ` · procedure ${r.procedureOrdinal}` : ''}</span>
          <span className="mono">$</span>
          <input
            aria-label={`Price for ${r.rvgBaseCode ?? 'any code'}${r.procedureOrdinal !== undefined ? `, procedure ${r.procedureOrdinal}` : ''}`}
            defaultValue={String(r.price)}
            onBlur={(e) => {
              const p = Number(e.target.value)
              if (!Number.isFinite(p) || p <= 0) {
                onError('Enter a price greater than zero.')
                e.target.value = String(r.price)
                return
              }
              if (p !== r.price) {
                const outcome = editContractPrice(useAppStore, actor, r.id, { price: p })
                if (!outcome.ok) onError(outcome.message)
              }
            }}
            style={{ ...selectStyle, width: 100, minHeight: 34, padding: '0 8px' }}
            className="mono"
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <select aria-label="RVG code" value={code} onChange={(e) => setCode(e.target.value)} style={{ ...selectStyle, minHeight: 34, flex: 1 }}>
          <option value="">Any code</option>
          {Object.values(rvgCodes).map((c) => (<option key={c.code} value={c.code}>{c.code}</option>))}
        </select>
        <input aria-label="Procedure position" value={ordinal} onChange={(e) => setOrdinal(e.target.value)} placeholder="Position" style={{ ...selectStyle, width: 80, minHeight: 34, padding: '0 8px' }} className="mono" />
        <input aria-label="Price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" style={{ ...selectStyle, width: 90, minHeight: 34, padding: '0 8px' }} className="mono" />
        <Button variant="secondary" onClick={add}>Add price</Button>
      </div>
    </div>
  )
}
