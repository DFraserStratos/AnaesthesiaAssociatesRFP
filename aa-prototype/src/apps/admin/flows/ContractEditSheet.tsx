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
 *
 * Catch-up Phase 19a (US-04.2.18, US-04.2.15): "Invoice and codes" holds the
 * holder reference code, the invoice description and the default RVG code
 * (19's type-ahead; stores the group's hidden id, shows its code). A fixed
 * price shows its price ranges (`ContractPriceRanges`), changed straight
 * away through the store's audited range actions; a new fixed-price Contract
 * takes its first range with it.
 */

import { useMemo, useState } from 'react'
import type { Contract, ContractPricing, PricingKind } from '../../../domain/types'
import { CHOOSABLE_PRICING_KINDS, CONTRACT_REFUSAL_MESSAGES, SYSTEM_CONTRACT_EDITABLE_FIELDS, billsPayerOnly, isRvgKind, takesLinks } from '../../../domain/billing/contracts'
import { destinationHint, destinationOf, isOpenPriceFallback } from '../../../domain/billing/fallbacks'
import { fundingTagsInOrder } from '../../../domain/billing/fundingTags'
import { contractSpecialtyLabel, specialtiesInOrder } from '../../../domain/specialties'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import { CodePickerSheet } from '../../../shared/capture/CodePickerSheet'
import { rvgGroupLabel } from '../../../domain/billing/rvgGroups'
import { ContractPriceRanges } from './ContractPriceRanges'
import { parsePriceText } from '../../../domain/billing/priceRanges'
import {
  createContract,
  disableContract,
  editContract,
  enableContract,
  useAppStore,
  type Actor,
} from '../../../store'
import { Button, FieldLabel, FormError, Segmented, TextField } from '../../../shared'
import { FieldHint, SelectField } from '../../../shared/ui'
import {
  BILLS_LABEL,
  PARTY_KIND_LABEL,
  PRICING_KIND_LABEL,
  STATUS_LABEL,
} from '../../../shared/contracts'
import { compareBySurname } from '../../../domain/surgeons'
import { useDemoTriggerContextWhile } from '../../../shared/demoTriggers'
import { neutral, radius } from '../../../theme/tokens'
import { MasterPanel, PanelGrid, PanelSection } from '../components/MasterPanel'
import { TextAction } from '../screens/masters/chrome'
import { Pill } from '../components/MasterPills'

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
  // The Contract open in its detail, for the demo triggers that act on it (catch-up Phase 24).
  useDemoTriggerContextWhile('adminContracts.openContractId', contract?.id ?? '', open && editing)

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
  const [invoiceDescription, setInvoiceDescription] = useState(contract?.invoiceDescription ?? '')
  const [defaultRvgGroupId, setDefaultRvgGroupId] = useState<string | null>(contract?.defaultRvgGroupId ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  // A new fixed-price Contract's first range (catch-up Phase 19a).
  const [firstStart, setFirstStart] = useState('')
  const [firstPrice, setFirstPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  // The live Contract, so the ranges table shows each range change at once.
  const live = useAppStore((s) => (contract !== undefined ? s.masters.contracts[contract.id] : undefined)) ?? contract
  const defaultGroup = defaultRvgGroupId !== null ? masters.rvgGroups[defaultRvgGroupId] : undefined

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

  function pricing(): ContractPricing {
    switch (kind) {
      case 'rvgContractRate':
        return { kind, unitRate: Number(rate) }
      case 'rvgDiscount':
        return { kind, discountPct: Number(discount) }
      case 'fixed':
        // Ranges change only through the range actions once saved; a new one takes its first range.
        if (live?.pricing.kind === 'fixed') return { kind: 'fixed', ranges: live.pricing.ranges }
        return {
          kind: 'fixed',
          ranges: firstStart === '' && firstPrice.trim() === '' ? [] : [{ startISO: firstStart, price: parsePriceText(firstPrice) }],
        }
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
      invoiceDescription,
      defaultRvgGroupId,
    }
    const outcome = editing
      ? editContract(
          useAppStore,
          actor,
          contract.id,
          system
            ? systemPatch({ name, aaCode, invoiceDescription })
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
                <Button variant="secondary" shot="contract-disable" onClick={toggleStatus}>
                  Disable
                </Button>
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
            ? 'Made by the system: one Fixed price Contract for each place an invoice can go, where a person types the amount on the Procedure. It is always available and never disabled. Only its name, AA code and invoice description can change.'
            : "No contract · RVG is built in and always available. It is held by Anaesthesia Associates, bills the payer and prices at the anaesthetist's rate. Only its name, AA code and invoice description can change."}
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
          <TextField label="Name" value={name} onChange={setName} />
        </PanelGrid>
      </PanelSection>

      <PanelSection title="Invoice and codes" shot="contract-codes">
        <PanelGrid>
          {system && !SYSTEM_EDITABLE.has('holderReference') ? (
            <ReadOnlyField label="Holder reference code" mono hint="Not set on a system Contract.">{holderReference !== '' ? holderReference : 'None'}</ReadOnlyField>
          ) : (
            <TextField label="Holder reference code" value={holderReference} onChange={setHolderReference} mono hint="The holder's own code for the item. Need not be unique." />
          )}
          {system ? (
            <ReadOnlyField label="Default RVG code" hint="Not set on a system Contract.">None</ReadOnlyField>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <FieldLabel>Default RVG code</FieldLabel>
              <div
                data-shot="contract-default-rvg"
                style={{ minHeight: 48, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg }}
              >
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: defaultGroup !== undefined ? neutral.ink : neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={defaultGroup !== undefined ? rvgGroupLabel(defaultGroup) : undefined}>
                  {defaultGroup !== undefined ? (
                    <>
                      <span className="mono" style={{ fontWeight: 600 }}>{defaultGroup.code}</span>
                      <span style={{ color: neutral.slate }}> · {defaultGroup.description}</span>
                    </>
                  ) : (
                    'None'
                  )}
                </span>
                <TextAction onClick={() => setPickerOpen(true)} label="Choose the default RVG code">{defaultGroup !== undefined ? 'Change' : 'Choose'}</TextAction>
                {defaultGroup !== undefined && <TextAction onClick={() => setDefaultRvgGroupId(null)} label="Clear the default RVG code">Clear</TextAction>}
              </div>
              <FieldHint>Fills a Procedure's RVG code when it has none.</FieldHint>
            </div>
          )}
        </PanelGrid>
        <TextField label="Invoice description" value={invoiceDescription} onChange={setInvoiceDescription} hint="The words the patient reads on the invoice, where filled in." />
      </PanelSection>

      <PanelSection title="Holder and who it bills" shot="contract-links">
        {editing ? (
          <ReadOnlyField label="Holder" hint="Fixed once the Contract is saved.">{holder?.name ?? holderId}</ReadOnlyField>
        ) : (
          <SelectField label="Holder" value={holderId} onChange={setHolderId}>
            <option value="">Choose the Party that holds it</option>
            {partyGroups.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </SelectField>
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
            <FieldHint>{PREPAID_BILLS_PAYER_HELPER}</FieldHint>
          ) : holderForcesPayer && !system ? (
            <FieldHint>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</FieldHint>
          ) : null}
        </div>
        {showLinks && !system && (
          <PanelGrid>
            <ChipMultiSelect label="Linked surgeons" options={surgeons} value={surgeonIds} onChange={setSurgeonIds} addLabel="Add a surgeon" />
            <SelectField label="Linked anaesthetist" value={anaesthetistId} onChange={setAnaesthetistId}>
              <option value="">None</option>
              {anaesthetists.map((a) => (
                <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
              ))}
            </SelectField>
          </PanelGrid>
        )}
        {holder?.kind === 'hospital' && <FieldHint>{CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital}</FieldHint>}
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
              <SelectField label="Funding tag" value={fundingTagId} onChange={setFundingTagId}>
                <option value="">None</option>
                {fundingTagsInOrder(masters.fundingTags).map((t) => (
                  <option key={t.id} value={t.id}>{t.code}</option>
                ))}
              </SelectField>
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
            {editing && <FieldHint>{fixedAfterSave}</FieldHint>}
          </div>
          <SelectField label="Pricing kind" value={kind} onChange={(v) => setKind(v as PricingKind)} disabled={editing} {...(editing ? { hint: fixedAfterSave } : {})}>
            {(editing && kind === 'open' ? [...CHOOSABLE_PRICING_KINDS, 'open' as const] : CHOOSABLE_PRICING_KINDS).map((k) => (
              <option key={k} value={k}>{PRICING_KIND_LABEL[k]}</option>
            ))}
          </SelectField>
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
        {kind === 'fixed' && !editing && (
          <PanelGrid>
            <TextField label="First price from" type="date" value={firstStart} onChange={setFirstStart} mono hint="May be in the past." />
            <TextField label="Price (ex GST)" value={firstPrice} onChange={setFirstPrice} mono placeholder="0.00" />
          </PanelGrid>
        )}
        {editing && live !== undefined && live.pricing.kind === 'fixed' && <ContractPriceRanges contract={live} actor={actor} onError={setError} />}

      </PanelSection>

      <FormError message={error} />
      <CodePickerSheet
        open={pickerOpen}
        {...(defaultRvgGroupId !== null ? { currentId: defaultRvgGroupId } : {})}
        rvgGroups={masters.rvgGroups}
        onPick={(id) => {
          setDefaultRvgGroupId(id)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
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

function ReadOnlyField({ label, children, hint, mono }: { label: string; children: React.ReactNode; hint?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <div className={mono === true ? 'mono' : undefined} style={{ minHeight: 48, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: radius.ctl, background: neutral.sunken, color: neutral.slate, fontSize: 15 }}>
        {children}
      </div>
      {hint !== undefined && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}
