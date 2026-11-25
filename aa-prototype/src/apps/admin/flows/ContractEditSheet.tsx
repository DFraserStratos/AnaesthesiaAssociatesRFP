/**
 * The Contract editor (catch-up Phase 18; US-04.1.1, US-04.1.2, US-04.1.4,
 * US-04.2.1) in Master data's wide side panel. A Contract is one priced item:
 * its AA code (assigned on save, editable after), name and holder reference
 * code; its holder Party (fixed after save) and whether it bills the holder or
 * the payer; the surgeons and anaesthetist it is offered for; prepaid and the
 * pricing kind (both fixed after save); and the anaesthetist's override on RVG
 * kinds. Every rule and refusal sentence is the store's (`contractRefusal`).
 *
 * Catch-up Phase 18a (US-04.2.16, US-04.2.17): the specialties it is offered
 * for (none means every specialty) and at most one funding tag, with a live
 * line saying where it will be offered (`destinationOf`).
 *
 * Catch-up Phase 19a (US-04.2.18, US-04.2.15): "Invoice and codes" holds the
 * holder reference code, the invoice description and the default RVG code
 * (19's type-ahead; stores the group's hidden id, shows its code). A new
 * fixed-price Contract takes its first range with it.
 *
 * Catch-up Phase 25a (US-04.1.2, D79, D81): a new Contract can name the
 * Contract it replaces and the date it takes over from; the panel then warns
 * with the Procedures dated on or after that date still on the old one, before
 * and after the save. Nothing moves and nothing is stored: "Replaces" is
 * warning-only (a build choice).
 *
 * Build plan Phase 45 (D92): create only. A Contract is read and changed on
 * its own page (`screens/contracts/ContractPage.tsx`), one card at a time; the
 * panel opens from `/admin/contracts/new` until Phase 46 replaces it.
 */

import { useMemo, useState } from 'react'
import type { Contract, ContractPricing, PricingKind } from '../../../domain/types'
import { CHOOSABLE_PRICING_KINDS, CONTRACT_REFUSAL_MESSAGES, billsPayerOnly, isRvgKind, takesLinks } from '../../../domain/billing/contracts'
import { destinationHint, destinationOf } from '../../../domain/billing/fallbacks'
import { fundingTagsInOrder } from '../../../domain/billing/fundingTags'
import { specialtiesInOrder } from '../../../domain/specialties'
import { ChipMultiSelect } from '../components/ChipMultiSelect'
import { parsePriceText } from '../../../domain/billing/priceRanges'
import { activeSurgeons, createContract, stillOnContract, useAppStore, type Actor } from '../../../store'
import { Button, FormError, Segmented, TextField } from '../../../shared'
import { DefRow, FieldHint, Notice, ResultLine, SelectField } from '../../../shared/ui'
import { shortDay } from '../../../domain/dateText'
import { BILLS_LABEL, PARTY_KIND_LABEL, PRICING_KIND_LABEL } from '../../../shared/contracts'
import { compareBySurname } from '../../../domain/surgeons'
import { neutral, radius } from '../../../theme/tokens'
import { MasterPanel, PanelGrid, PanelSection } from '../components/MasterPanel'
import { StillOnNotice } from '../screens/contracts/StillOnNotice'
import { DefaultRvgCodeField } from '../screens/contracts/DefaultRvgCodeField'

interface Props {
  open: boolean
  actor: Actor
  /** A new Contract's holder, when opened from a filtered list. */
  initialHolderId?: string
  onClose: () => void
}

type YesNo = 'yes' | 'no'

/** D23 (OQ-73, at Confirm): the one place the reading is labelled. */
const PREPAID_BILLS_PAYER_HELPER = "A prepaid Contract always bills the payer, awaiting AA's confirmation."

export function ContractPanel({ open, actor, initialHolderId, onClose }: Props) {
  const masters = useAppStore((s) => s.masters)

  const [name, setName] = useState('')
  const [holderReference, setHolderReference] = useState('')
  const [holderId, setHolderId] = useState(initialHolderId ?? '')
  const [billsTo, setBillsTo] = useState<Contract['billsTo']>('holder')
  const [surgeonIds, setSurgeonIds] = useState<string[]>([])
  const [anaesthetistId, setAnaesthetistId] = useState('')
  const [prepaid, setPrepaid] = useState<YesNo>('no')
  const [kind, setKind] = useState<PricingKind>('rvgAnaesthetistRate')
  const [rate, setRate] = useState('')
  const [discount, setDiscount] = useState('')
  const [override, setOverride] = useState<YesNo>('no')
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([])
  const [fundingTagId, setFundingTagId] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [defaultRvgGroupId, setDefaultRvgGroupId] = useState<string | null>(null)
  // A new fixed-price Contract's first range (catch-up Phase 19a).
  const [firstStart, setFirstStart] = useState('')
  const [firstPrice, setFirstPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  // A dated change (catch-up Phase 25a): the Contract a new one replaces and the day it takes over. Warning-only.
  const [replacesId, setReplacesId] = useState('')
  const [replacesFrom, setReplacesFrom] = useState('')
  // The new Contract's name once created with "Replaces" set: the panel stays open on the warning.
  const [created, setCreated] = useState<string | null>(null)
  const schedule = useAppStore((s) => s.schedule)
  const replaced = replacesId !== '' ? masters.contracts[replacesId] : undefined
  const stillOnReplaced = useMemo(
    () => (replaced !== undefined && replacesFrom !== '' ? stillOnContract({ schedule, masters }, replaced.id, replacesFrom) : []),
    [replaced, replacesFrom, schedule, masters],
  )
  // The Active Contracts a new one may replace: the chosen holder's first, then the rest (system Contracts never).
  const replaceable = useMemo(() => {
    const active = Object.values(masters.contracts)
      .filter((c) => c.status === 'active' && c.systemRole === undefined)
      .sort((a, b) => a.name.localeCompare(b.name))
    return { holder: active.filter((c) => c.holderId === holderId), other: active.filter((c) => c.holderId !== holderId) }
  }, [masters.contracts, holderId])

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
  // Active surgeons only (catch-up Phase 42).
  const surgeons = useMemo(() => [...activeSurgeons({ masters: { surgeons: masters.surgeons } })].sort(compareBySurname), [masters.surgeons])
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
    const outcome = createContract(useAppStore, actor, {
      name,
      billsTo: shownBillsTo,
      linkedSurgeonIds: showLinks ? surgeonIds : [],
      anaesthetistMayOverridePrice: rvg && override === 'yes',
      holderReference,
      specialtyIds,
      invoiceDescription,
      defaultRvgGroupId,
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
    // A dated change that leaves Procedures on the old Contract stays open on its warning (catch-up Phase 25a).
    if (stillOnReplaced.length > 0) {
      setError(null)
      setCreated(name.trim())
      return
    }
    onClose()
  }

  return (
    <MasterPanel
      open={open}
      onClose={onClose}
      title={created ?? 'New contract'}
      shot="contract-detail"
      footer={
        created !== null ? (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>Create contract</Button>
          </>
        )
      }
    >
      {created !== null && replaced !== undefined ? (
        <>
          <ResultLine line={`Created ${created}.`} shot="contract-created" />
          <StillOnNotice rows={stillOnReplaced} fromISO={replacesFrom} contractName={replaced.name} live />
        </>
      ) : (
      <>
      <PanelSection title="Contract">
        <PanelGrid>
          <DefRow layout="stacked" label="AA code" mono>Assigned on save</DefRow>
          <TextField label="Name" value={name} onChange={setName} />
        </PanelGrid>
      </PanelSection>

      <PanelSection title="Invoice and codes" shot="contract-codes">
        <PanelGrid>
          <TextField label="Holder reference code" value={holderReference} onChange={setHolderReference} mono hint="The holder's own code for the item. Need not be unique." />
          <DefaultRvgCodeField value={defaultRvgGroupId} onChange={setDefaultRvgGroupId} />
        </PanelGrid>
        <TextField label="Invoice description" value={invoiceDescription} onChange={setInvoiceDescription} hint="The words the patient reads on the invoice, where filled in." />
      </PanelSection>

      <PanelSection title="Holder and who it bills" shot="contract-links">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Segmented
            label="Bills"
            value={shownBillsTo}
            options={[
              { value: 'holder', label: BILLS_LABEL.holder },
              { value: 'payer', label: `${BILLS_LABEL.payer} on the Procedure` },
            ]}
            onChange={setBillsTo}
            disabled={forcedPayer}
          />
          {prepaid === 'yes' ? (
            <FieldHint>{PREPAID_BILLS_PAYER_HELPER}</FieldHint>
          ) : holderForcesPayer ? (
            <FieldHint>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</FieldHint>
          ) : null}
        </div>
        {showLinks && (
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
          <div data-shot="contract-funding-tag" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SelectField label="Funding tag" value={fundingTagId} onChange={setFundingTagId}>
              <option value="">None</option>
              {fundingTagsInOrder(masters.fundingTags).map((t) => (
                <option key={t.id} value={t.id}>{t.code}</option>
              ))}
            </SelectField>
          </div>
        </PanelGrid>
        <div data-shot="contract-placement" aria-live="polite" style={{ fontSize: 13, color: neutral.ink, background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '8px 12px' }}>
          {placement}
        </div>
      </PanelSection>

      <PanelSection title="Pricing" shot="contract-settings">
        <PanelGrid>
          <Segmented label="Prepaid" value={prepaid} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={setPrepaid} />
          <SelectField label="Pricing kind" value={kind} onChange={(v) => setKind(v as PricingKind)}>
            {CHOOSABLE_PRICING_KINDS.map((k) => (
              <option key={k} value={k}>{PRICING_KIND_LABEL[k]}</option>
            ))}
          </SelectField>
        </PanelGrid>
        {kind === 'rvgContractRate' && <TextField label="Rate ($ per unit)" value={rate} onChange={setRate} mono />}
        {kind === 'rvgDiscount' && <TextField label="Discount (%)" value={discount} onChange={setDiscount} mono />}
        {rvg && (
          <Segmented
            label="Anaesthetist may override the price"
            value={override}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
            onChange={setOverride}
          />
        )}
        {kind === 'fixed' && (
          <PanelGrid>
            <TextField label="First price from" type="date" value={firstStart} onChange={setFirstStart} mono hint="May be in the past." />
            <TextField label="Price (ex GST)" value={firstPrice} onChange={setFirstPrice} mono placeholder="0.00" />
          </PanelGrid>
        )}
      </PanelSection>

      <PanelSection title="Replaces" shot="contract-replaces">
        <PanelGrid>
          <SelectField label="Replaces" value={replacesId} onChange={setReplacesId} hint="Optional. The Contract this one takes over from.">
            <option value="">Nothing</option>
            {replaceable.holder.length > 0 && (
              <optgroup label={holder?.name ?? 'This holder'}>
                {replaceable.holder.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            )}
            <optgroup label={replaceable.holder.length > 0 ? 'Other holders' : 'Contracts'}>
              {replaceable.other.map((c) => (
                <option key={c.id} value={c.id}>{`${c.name} · ${masters.parties[c.holderId]?.name ?? c.holderId}`}</option>
              ))}
            </optgroup>
          </SelectField>
          <TextField label="From" type="date" value={replacesFrom} onChange={setReplacesFrom} mono hint="The first procedure date it covers." />
        </PanelGrid>
        {replaced !== undefined && replacesFrom !== '' && (
          stillOnReplaced.length > 0 ? (
            <StillOnNotice rows={stillOnReplaced} fromISO={replacesFrom} contractName={replaced.name} live />
          ) : (
            <Notice tone="neutral" shot="contract-still-on-none">
              {`No Procedure dated on or after ${shortDay(replacesFrom)} is still on ${replaced.name}.`}
            </Notice>
          )
        )}
        <FieldHint>Nothing moves by itself, and the old Contract stays as it is: disable it when it is no longer needed.</FieldHint>
      </PanelSection>

      <FormError message={error} />
      </>
      )}
    </MasterPanel>
  )
}
