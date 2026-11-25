/**
 * A Contract page's Overview (build plan Phase 45; US-04.1.7, US-04.1.3): its
 * price on top, full width, then the cards in the order the office checks a
 * Contract (docs/explorations/contracts-section.html #record), stacked in
 * the main column beside the rail: where it is offered, who it bills, invoice
 * and codes, and what was fixed when it was created. Each card is edited and saved on its own (`Card editing` and its
 * footer): Save sends `editContract` only that card's fields, one audited
 * `contract.update` in one change set, and a refusal shows on the card with
 * the rule's own words while nothing changes. Several cards may be in edit at
 * once, each saving alone. The settings fixed at creation and the holder
 * Party's billing details are read-only here.
 *
 * A system Contract edits only `SYSTEM_CONTRACT_EDITABLE_FIELDS` (its name, AA
 * code and invoice description), on the invoice-and-codes card; its other
 * cards have no Edit.
 */

import { useMemo, useState, type ReactNode } from 'react'
import type { Contract } from '../../../../domain/types'
import { CONTRACT_REFUSAL_MESSAGES, SYSTEM_CONTRACT_EDITABLE_FIELDS, billsPayerOnly, isRvgKind, takesLinks } from '../../../../domain/billing/contracts'
import { destinationHint, destinationOf } from '../../../../domain/billing/fallbacks'
import { fundingTagsInOrder } from '../../../../domain/billing/fundingTags'
import { compareBySurname } from '../../../../domain/surgeons'
import { isRetired, retiredLabel } from '../../../../domain/masterLifecycle'
import { contractSpecialtyLabel, specialtiesInOrder } from '../../../../domain/specialties'
import { BILLS_LABEL, DELIVERY_LABEL, PRICING_KIND_LABEL, pricingLabel } from '../../../../shared/contracts'
import { Button, Card, DefList, DefRow, FieldHint, FormError, Notice, Segmented, SelectField, TextAction, TextField } from '../../../../shared/ui'
import { activeSurgeons, editContract, useAppStore, type Actor, type ContractEditPatch } from '../../../../store'
import { neutral } from '../../../../theme/tokens'
import { ChipMultiSelect } from '../../components/ChipMultiSelect'
import { PROFILE_CARD } from '../../components/ProfileChrome'
import { partyPath } from '../../contractsPaths'
import { PriceRangesTable } from './PriceRangesTable'
import { DefaultRvgCodeField } from './DefaultRvgCodeField'
// D23's caption has one home, New contract's step 1 (Phase 46); "Who it bills" shows the same string.
import { PREPAID_BILLS_PAYER_HELPER } from './new/NewContractPage'

/** The fields a system Contract may change, read from the model's one list. */
const SYSTEM_EDITABLE: ReadonlySet<string> = new Set(SYSTEM_CONTRACT_EDITABLE_FIELDS)

/** A system Contract's save: only the fields `SYSTEM_CONTRACT_EDITABLE_FIELDS` names. */
export function systemPatch(values: Partial<Record<(typeof SYSTEM_CONTRACT_EDITABLE_FIELDS)[number], string>>): ContractEditPatch {
  const patch: ContractEditPatch = {}
  for (const k of SYSTEM_CONTRACT_EDITABLE_FIELDS) if (values[k] !== undefined) patch[k] = values[k]
  return patch
}

type YesNo = 'yes' | 'no'

/** A card's label and value rows: the label in a 150px slate column beside its value (contracts-section.html #record `.kv`). */
const KV = { layout: 'inline', labelWidth: 150, labelTone: 'slate' } as const

/**
 * One card's edit: its draft (null while it reads), Edit, Cancel and Save. Save sends only the patch
 * the card builds; a refusal stays on the card and the draft stays open.
 */
function useCardEdit<D>(actor: Actor, contractId: string, from: () => D) {
  const [draft, setDraft] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)
  return {
    draft,
    setDraft: (next: D) => setDraft(next),
    error,
    start: () => {
      setDraft(from())
      setError(null)
    },
    cancel: () => {
      setDraft(null)
      setError(null)
    },
    save: (patch: ContractEditPatch) => {
      const outcome = editContract(useAppStore, actor, contractId, patch)
      if (!outcome.ok) {
        setError(outcome.message)
        return
      }
      setDraft(null)
      setError(null)
    },
  }
}

/** A card of the Overview: Edit in its heading where `editable`, its form and footer while in edit, its refusal under it. */
function EditableCard({
  title,
  shot,
  editable,
  editing,
  onEdit,
  onCancel,
  onSave,
  error,
  children,
}: {
  title: ReactNode
  shot: string
  editable: boolean
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  error: string | null
  children: ReactNode
}) {
  return (
    <Card
      style={PROFILE_CARD}
      title={title}
      shot={shot}
      editing={editing}
      {...(editable && !editing ? { action: <TextAction size="sm" flush onClick={onEdit} shot={`${shot}-edit`} label={`Edit ${typeof title === 'string' ? title.toLowerCase() : 'this card'}`}>Edit</TextAction> } : {})}
      {...(editing
        ? {
            footer: (
              <>
                <Button variant="secondary" size="compact" onClick={onCancel} shot={`${shot}-cancel`}>Cancel</Button>
                <Button variant="primary" size="compact" onClick={onSave} shot={`${shot}-save`}>Save</Button>
              </>
            ),
          }
        : {})}
    >
      {children}
      <FormError message={error} shot={`${shot}-error`} />
    </Card>
  )
}

export function ContractOverview({ contract, actor }: { contract: Contract; actor: Actor }) {
  return (
    <>
      <PriceCard contract={contract} actor={actor} />
      <WhereCard contract={contract} actor={actor} />
      <WhoBillsCard contract={contract} actor={actor} />
      <CodesCard contract={contract} actor={actor} />
      <FixedCard contract={contract} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Price: the ranges table of a fixed price, or the rate or discount of an RVG Contract (undated)
// ---------------------------------------------------------------------------

function PriceCard({ contract, actor }: { contract: Contract; actor: Actor }) {
  const p = contract.pricing
  const system = contract.systemRole !== undefined
  const edit = useCardEdit(actor, contract.id, () => ({
    rate: p.kind === 'rvgContractRate' ? String(p.unitRate) : '',
    discount: p.kind === 'rvgDiscount' ? String(p.discountPct) : '',
    override: (contract.anaesthetistMayOverridePrice ? 'yes' : 'no') as YesNo,
  }))
  if (p.kind === 'fixed') return <PriceRangesTable contract={contract} actor={actor} />
  const rvg = isRvgKind(p.kind)
  const d = edit.draft

  function save() {
    if (d === null) return
    const pricing = p.kind === 'rvgContractRate' ? { kind: p.kind, unitRate: Number(d.rate) } : p.kind === 'rvgDiscount' ? { kind: p.kind, discountPct: Number(d.discount) } : p
    edit.save({ pricing, anaesthetistMayOverridePrice: d.override === 'yes' })
  }

  return (
    <EditableCard title="Price" shot="contract-price" editable={rvg && !system} editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={save} error={edit.error}>
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Pricing">{pricingLabel(p)}</DefRow>
          {rvg ? (
            <DefRow {...KV} label="Anaesthetist may change the price">{contract.anaesthetistMayOverridePrice ? 'Yes' : 'No'}</DefRow>
          ) : (
            <DefRow {...KV} label="Amount">A person types the amount on the Procedure.</DefRow>
          )}
        </DefList>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {p.kind === 'rvgContractRate' && <TextField label="Rate ($ per unit)" value={d.rate} onChange={(rate) => edit.setDraft({ ...d, rate })} mono hint="Undated: it applies from now." />}
          {p.kind === 'rvgDiscount' && <TextField label="Discount (%)" value={d.discount} onChange={(discount) => edit.setDraft({ ...d, discount })} mono hint="Undated: it applies from now." />}
          {p.kind === 'rvgAnaesthetistRate' && <DefRow {...KV} label="Pricing">{pricingLabel(p)}</DefRow>}
          <Segmented
            label="Anaesthetist may change the price"
            value={d.override}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
            onChange={(override) => edit.setDraft({ ...d, override })}
          />
        </div>
      )}
    </EditableCard>
  )
}

// ---------------------------------------------------------------------------
// Where it is offered
// ---------------------------------------------------------------------------

function WhereCard({ contract, actor }: { contract: Contract; actor: Actor }) {
  const masters = useAppStore((s) => s.masters)
  const system = contract.systemRole !== undefined
  const holder = masters.parties[contract.holderId]
  const showLinks = takesLinks(holder?.kind)
  const edit = useCardEdit(actor, contract.id, () => ({
    surgeonIds: contract.linkedSurgeonIds,
    anaesthetistId: contract.linkedAnaesthetistId ?? '',
    specialtyIds: contract.specialtyIds,
    fundingTagId: contract.fundingTagId ?? '',
  }))
  const d = edit.draft
  // Where it will be offered, as the settings stand (the draft's tag while editing).
  const placement = destinationHint(
    destinationOf({ ...contract, ...(d !== null ? { fundingTagId: d.fundingTagId !== '' ? d.fundingTagId : undefined } : {}) }, masters.parties),
    masters.parties,
    masters.fundingTags,
  )
  // Active surgeons only, plus any retired surgeon the Contract already links, labelled (catch-up Phase 42).
  const linked = contract.linkedSurgeonIds
  const surgeons = useMemo(() => {
    const keptRetired = linked.flatMap((id) => {
      const s = masters.surgeons[id]
      return s !== undefined && isRetired(s) ? [s] : []
    })
    return [...activeSurgeons({ masters: { surgeons: masters.surgeons } }), ...keptRetired].sort(compareBySurname).map((s) => ({ ...s, name: retiredLabel(s.name, s) }))
  }, [masters.surgeons, linked])
  const anaesthetists = useMemo(() => Object.values(masters.anaesthetists).sort((a, b) => a.name.localeCompare(b.name)), [masters.anaesthetists])
  const tag = contract.fundingTagId !== undefined ? masters.fundingTags[contract.fundingTagId] : undefined
  const funder = tag?.funderPartyId !== undefined ? masters.parties[tag.funderPartyId] : undefined

  function save() {
    if (d === null) return
    edit.save({
      linkedSurgeonIds: showLinks ? d.surgeonIds : [],
      linkedAnaesthetistId: showLinks && d.anaesthetistId !== '' ? d.anaesthetistId : undefined,
      specialtyIds: d.specialtyIds,
      fundingTagId: d.fundingTagId !== '' ? d.fundingTagId : undefined,
    })
  }

  const placementLine = (
    <div data-shot="contract-placement" aria-live="polite" style={{ fontSize: 13, color: neutral.ink }}>
      {placement}
    </div>
  )

  return (
    <EditableCard title="Where it is offered" shot="contract-where" editable={!system} editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={save} error={edit.error}>
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="On the step rail">{placementLine}</DefRow>
          {showLinks ? (
            <>
              <DefRow {...KV} label="Linked surgeons">
                {contract.linkedSurgeonIds.length > 0 ? contract.linkedSurgeonIds.map((id) => masters.surgeons[id]?.name ?? id).join(', ') : 'None'}
              </DefRow>
              <DefRow {...KV} label="Linked anaesthetist">
                {contract.linkedAnaesthetistId !== undefined ? (masters.anaesthetists[contract.linkedAnaesthetistId]?.name ?? contract.linkedAnaesthetistId) : 'None'}
              </DefRow>
            </>
          ) : (
            <DefRow {...KV} label="Lists">{holder?.kind === 'hospital' ? CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital : 'Every List'}</DefRow>
          )}
          <DefRow {...KV} label="Specialties" shot="contract-specialties">{contractSpecialtyLabel(masters, contract.specialtyIds)}</DefRow>
          <DefRow {...KV} label="Funding tag" shot="contract-funding-tag">
            {tag !== undefined ? (
              <>
                <span className="mono">{tag.code}</span>
                {funder !== undefined ? ` · ${funder.name}` : ''}
              </>
            ) : (
              'None'
            )}
          </DefRow>
        </DefList>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {showLinks && (
            <>
              <ChipMultiSelect label="Linked surgeons" options={surgeons} value={d.surgeonIds} onChange={(surgeonIds) => edit.setDraft({ ...d, surgeonIds })} addLabel="Add a surgeon" />
              <SelectField label="Linked anaesthetist" value={d.anaesthetistId} onChange={(anaesthetistId) => edit.setDraft({ ...d, anaesthetistId })} hint="At most one, for an anaesthetist's own price list.">
                <option value="">None</option>
                {anaesthetists.map((a) => (
                  <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
                ))}
              </SelectField>
            </>
          )}
          <ChipMultiSelect
            label="Specialties"
            options={specialtiesInOrder(masters.specialties)}
            value={d.specialtyIds}
            onChange={(specialtyIds) => edit.setDraft({ ...d, specialtyIds })}
            addLabel="Add a specialty"
            empty="Every specialty"
            hint="None means every specialty."
            shot="contract-specialties"
          />
          <SelectField label="Funding tag" value={d.fundingTagId} onChange={(fundingTagId) => edit.setDraft({ ...d, fundingTagId })}>
            <option value="">None</option>
            {fundingTagsInOrder(masters.fundingTags).map((t) => (
              <option key={t.id} value={t.id}>{t.code}</option>
            ))}
          </SelectField>
          {placementLine}
        </div>
      )}
    </EditableCard>
  )
}

// ---------------------------------------------------------------------------
// Who it bills, with the holder Party's billing details read-only
// ---------------------------------------------------------------------------

function WhoBillsCard({ contract, actor }: { contract: Contract; actor: Actor }) {
  const parties = useAppStore((s) => s.masters.parties)
  const contracts = useAppStore((s) => s.masters.contracts)
  const system = contract.systemRole !== undefined
  const holder = parties[contract.holderId]
  const holderForcesPayer = billsPayerOnly(holder?.kind, false)
  const forcedPayer = billsPayerOnly(holder?.kind, contract.prepaid)
  const edit = useCardEdit(actor, contract.id, () => ({ billsTo: contract.billsTo }))
  const d = edit.draft
  const heldCount = useMemo(() => Object.values(contracts).filter((c) => c.holderId === contract.holderId && c.systemRole === undefined).length, [contracts, contract.holderId])
  const delivery =
    holder?.deliveryMethod === 'email'
      ? `${DELIVERY_LABEL.email} · ${holder.email ?? 'no address'}`
      : holder?.deliveryMethod === 'post'
        ? `${DELIVERY_LABEL.post} · ${holder.postalAddress ?? 'no address'}`
        : 'Not set'

  return (
    <EditableCard
      title="Who it bills"
      shot="contract-bills"
      editable={!system && !forcedPayer}
      editing={d !== null}
      onEdit={edit.start}
      onCancel={edit.cancel}
      onSave={() => d !== null && edit.save({ billsTo: d.billsTo })}
      error={edit.error}
    >
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Bills" shot="contract-bills-to">{contract.billsTo === 'holder' ? 'Its holder' : 'The payer on the Procedure'}</DefRow>
          {contract.billsTo === 'holder' && holder !== undefined && (
            <DefRow {...KV} label="Invoices go to" shot="contract-party-billing" data-party={holder.id}>
              <div>{holder.billingName ?? 'No billing name set'}</div>
              <div style={{ fontSize: 13, color: neutral.slate }}>{delivery}</div>
            </DefRow>
          )}
        </DefList>
      ) : (
        <Segmented
          label="Bills"
          value={d.billsTo}
          options={[
            { value: 'holder', label: BILLS_LABEL.holder },
            { value: 'payer', label: `${BILLS_LABEL.payer} on the Procedure` },
          ]}
          onChange={(billsTo) => edit.setDraft({ billsTo })}
        />
      )}
      {contract.prepaid ? (
        <FieldHint>{PREPAID_BILLS_PAYER_HELPER}</FieldHint>
      ) : holderForcesPayer && !system ? (
        <FieldHint>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</FieldHint>
      ) : null}
      {holder !== undefined && !system && (d !== null ? d.billsTo : contract.billsTo) === 'holder' && (
        <Notice tone="neutral" shot="contract-party-notice" action={<TextAction size="sm" flush to={partyPath(holder.id)} shot="contract-open-party">Open the Party</TextAction>}>
          {`The billing name and delivery come from the Party, ${holder.name}, and are changed there for all ${heldCount} of its Contracts.`}
        </Notice>
      )}
    </EditableCard>
  )
}

// ---------------------------------------------------------------------------
// Invoice and codes
// ---------------------------------------------------------------------------

function CodesCard({ contract, actor }: { contract: Contract; actor: Actor }) {
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const system = contract.systemRole !== undefined
  const edit = useCardEdit(actor, contract.id, () => ({
    name: contract.name,
    aaCode: contract.aaCode,
    holderReference: contract.holderReference ?? '',
    invoiceDescription: contract.invoiceDescription ?? '',
    defaultRvgGroupId: contract.defaultRvgGroupId ?? null,
  }))
  const d = edit.draft
  const savedGroup = contract.defaultRvgGroupId != null ? rvgGroups[contract.defaultRvgGroupId] : undefined

  function save() {
    if (d === null) return
    edit.save(
      system
        ? systemPatch({ name: d.name, aaCode: d.aaCode, invoiceDescription: d.invoiceDescription })
        : { name: d.name, aaCode: d.aaCode, holderReference: d.holderReference, invoiceDescription: d.invoiceDescription, defaultRvgGroupId: d.defaultRvgGroupId },
    )
  }

  const readOnlyOnSystem = (field: string) => system && !SYSTEM_EDITABLE.has(field)

  return (
    <EditableCard title="Invoice and codes" shot="contract-codes" editable editing={d !== null} onEdit={edit.start} onCancel={edit.cancel} onSave={save} error={edit.error}>
      {d === null ? (
        <DefList gap={10}>
          <DefRow {...KV} label="Name">{contract.name}</DefRow>
          <DefRow {...KV} label="AA code" mono>{contract.aaCode}</DefRow>
          <DefRow {...KV} label="Holder reference" mono={contract.holderReference !== undefined}>{contract.holderReference ?? 'None'}</DefRow>
          <DefRow {...KV} label="Invoice description">{contract.invoiceDescription ?? 'None'}</DefRow>
          <DefRow {...KV} label="Default RVG code" shot="contract-default-rvg">
            {savedGroup !== undefined ? <RvgGroupText code={savedGroup.code} description={savedGroup.description} /> : 'None'}
          </DefRow>
        </DefList>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TextField label="Name" value={d.name} onChange={(name) => edit.setDraft({ ...d, name })} />
          <TextField label="AA code" value={d.aaCode} onChange={(v) => edit.setDraft({ ...d, aaCode: v.toUpperCase() })} mono hint="AA's own unique code." />
          {readOnlyOnSystem('holderReference') ? (
            <DefRow {...KV} label="Holder reference" note="Not set on a system Contract.">None</DefRow>
          ) : (
            <TextField label="Holder reference" value={d.holderReference} onChange={(holderReference) => edit.setDraft({ ...d, holderReference })} mono hint="The holder's own code for the item. Need not be unique." />
          )}
          <TextField label="Invoice description" value={d.invoiceDescription} onChange={(invoiceDescription) => edit.setDraft({ ...d, invoiceDescription })} hint="The words the patient reads on the invoice, where filled in." />
          {readOnlyOnSystem('defaultRvgGroupId') ? (
            <DefRow {...KV} label="Default RVG code" note="Not set on a system Contract.">None</DefRow>
          ) : (
            <DefaultRvgCodeField value={d.defaultRvgGroupId} onChange={(defaultRvgGroupId) => edit.setDraft({ ...d, defaultRvgGroupId })} />
          )}
        </div>
      )}
    </EditableCard>
  )
}

function RvgGroupText({ code, description }: { code: string; description: string }) {
  return (
    <>
      <span className="mono" style={{ fontWeight: 600 }}>{code}</span>
      <span style={{ color: neutral.slate }}> · {description}</span>
    </>
  )
}

// ---------------------------------------------------------------------------
// Fixed when it was created (read-only; Phase 49 adds the Replace pointer)
// ---------------------------------------------------------------------------

function FixedCard({ contract }: { contract: Contract }) {
  const holder = useAppStore((s) => s.masters.parties[contract.holderId])
  return (
    <Card style={PROFILE_CARD} title="Fixed when it was created" shot="contract-fixed">
      <DefList gap={10}>
        <DefRow {...KV} label="Holder">{holder?.name ?? contract.holderId}</DefRow>
        <DefRow {...KV} label="Pricing kind">{PRICING_KIND_LABEL[contract.pricing.kind]}</DefRow>
        <DefRow {...KV} label="Prepaid">{contract.prepaid ? 'Yes' : 'No'}</DefRow>
      </DefList>
      <FieldHint>Set when the Contract was created.</FieldHint>
    </Card>
  )
}
