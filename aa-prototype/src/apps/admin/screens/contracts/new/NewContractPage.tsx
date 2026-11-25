/**
 * New contract (build plan Phase 46; US-04.1.2 New contract order and Similar
 * name; D92): `/admin/contracts/new`, `?holder=<PartyId>` filling the holder.
 * A page on the Admin frame (fluid, with the rail), filled in the order the
 * rules depend on each other (docs/explorations/contracts-section.html #new):
 * 1 the holder and who it bills, 2 pricing, 3 where it is offered, 4 the name,
 * codes and invoice wording. The form and its rules are `useContractDraft`;
 * every rule and refusal sentence is the billing module's or the store's.
 * The rail shows, live, where it will show on the step rail, what the holder
 * already has (a hint, never a block) and the AA code it will take. Create
 * runs the store's guard and lands on the new Contract's page, by its id.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTRACT_REFUSAL_MESSAGES, nextAaCode, type PricingKind } from '../../../../../domain/billing/contracts'
import { fundingTagsInOrder } from '../../../../../domain/billing/fundingTags'
import { compareBySurname } from '../../../../../domain/surgeons'
import { specialtiesInOrder } from '../../../../../domain/specialties'
import { PRICING_KIND_LABEL } from '../../../../../shared/contracts'
import { Button, Card, FieldHint, FormError, RadioCard, Segmented, SelectField, TextField, useRovingRadio } from '../../../../../shared/ui'
import { activeSurgeons, createContract, useAppStore, type Actor } from '../../../../../store'
import { neutral } from '../../../../../theme/tokens'
import { AdminPage, PageBody } from '../../../components/AdminPage'
import { ChipMultiSelect } from '../../../components/ChipMultiSelect'
import { PanelGrid } from '../../../components/MasterPanel'
import { contractPath, contractsPath } from '../../../contractsPaths'
import { useContractDraft, type ContractDraft } from '../../../flows/contractDraft'
import { DefaultRvgCodeField } from '../DefaultRvgCodeField'
import { AlreadyHeld } from './AlreadyHeld'
import { WhereItWillShow } from './WhereItWillShow'

/** D23 (OQ-73, at Confirm): the one place the reading is labelled; the Contract page's "Who it bills" card shows it too. */
export const PREPAID_BILLS_PAYER_HELPER = "A prepaid Contract always bills the payer, awaiting AA's confirmation."

/** One line under each pricing kind (#new). */
const KIND_DESCRIPTION: Record<PricingKind, string> = {
  rvgAnaesthetistRate: 'Units at their own rate',
  rvgContractRate: 'Units at a rate set here',
  rvgDiscount: 'A percentage off',
  fixed: 'From dated price ranges',
  open: '',
}

type YesNo = 'yes' | 'no'
const YES_NO: { value: YesNo; label: string }[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
]

export function NewContractPage({ actor, initialHolderId }: { actor: Actor; initialHolderId?: string }) {
  const navigate = useNavigate()
  const masters = useAppStore((s) => s.masters)
  const { draft, set, rules, input, holderGroups } = useContractDraft(initialHolderId !== undefined ? { holderId: initialHolderId } : {})
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const holder = rules.holder
  const backTo = contractsPath(initialHolderId !== undefined ? { holder: initialHolderId } : {})

  useEffect(() => {
    if (error !== null) errorRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  function create() {
    const outcome = createContract(useAppStore, actor, input)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    navigate(contractPath(outcome.value.contract.id), { replace: true })
  }

  return (
    <AdminPage
      mode="fluid"
      shot="contract-new-page"
      back={{ label: 'Contracts', to: backTo, shot: 'contract-new-back' }}
      title="New contract"
      sub={holder !== undefined ? `For ${holder.name}` : 'Start with the holder'}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="desktop" onClick={() => navigate(backTo)} shot="contract-new-cancel">Cancel</Button>
          <Button variant="primary" size="desktop" onClick={create} shot="contract-create">Create contract</Button>
        </div>
      }
    >
      <PageBody
        railLabel="About the new Contract"
        rail={
          <>
            <WhereItWillShow draft={draft} rules={rules} />
            <AlreadyHeld holder={holder} name={draft.name} />
            <Card title="On save" shot="new-contract-on-save">
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: '18px', color: neutral.slate }}>
                {holder !== undefined ? (
                  <>
                    AA code{' '}
                    <span className="mono" data-shot="new-contract-aa-code" style={{ color: neutral.ink }}>
                      {nextAaCode(holder.codePrefix, Object.values(masters.contracts).map((c) => c.aaCode))}
                    </span>{' '}
                    is assigned. You land on its page.
                  </>
                ) : (
                  "An AA code is assigned from the holder's prefix. You land on its page."
                )}
              </p>
            </Card>
          </>
        }
      >
        <div ref={errorRef}>
          <FormError message={error} shot="contract-new-error" />
        </div>
        <HolderStep draft={draft} set={set} rules={rules} holderGroups={holderGroups} />
        <PricingStep draft={draft} set={set} rules={rules} />
        <WhereStep draft={draft} set={set} rules={rules} />
        <NameStep draft={draft} set={set} />
      </PageBody>
    </AdminPage>
  )
}

type Draft = ReturnType<typeof useContractDraft>
type StepProps = Pick<Draft, 'draft' | 'set' | 'rules'>

/** Step 1: the holder decides who it may bill and whether it takes links. */
function HolderStep({ draft, set, rules, holderGroups }: StepProps & Pick<Draft, 'holderGroups'>) {
  return (
    <Card step={1} title="Holder and who it bills" shot="contract-links">
      <PanelGrid>
        <SelectField label="Holder" value={draft.holderId} onChange={(holderId) => set({ holderId })} hint="Fixed once created.">
          <option value="">Choose the Party that holds it</option>
          {holderGroups.map(([group, list]) => (
            <optgroup key={group} label={group}>
              {list.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-shot="contract-bills">
          <Segmented
            label="Bills"
            value={rules.billsTo}
            options={[
              { value: 'holder', label: 'Its holder' },
              { value: 'payer', label: 'The payer' },
            ]}
            onChange={(billsTo) => set({ billsTo })}
            disabled={rules.forcedPayer}
          />
          {draft.prepaid ? (
            <FieldHint>{PREPAID_BILLS_PAYER_HELPER}</FieldHint>
          ) : rules.holderForcesPayer ? (
            <FieldHint>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</FieldHint>
          ) : rules.holder !== undefined ? (
            <FieldHint>Its holder, or the payer on the Procedure.</FieldHint>
          ) : null}
        </div>
      </PanelGrid>
    </Card>
  )
}

/** Step 2: the kind, its price, prepaid and the override (which exists only on RVG kinds). */
function PricingStep({ draft, set, rules }: StepProps) {
  const values = rules.kinds.map((k) => k.kind)
  const { groupProps, itemProps } = useRovingRadio<PricingKind>({
    values,
    value: draft.kind,
    onChange: (kind) => set({ kind }),
    isDisabled: (kind) => rules.kinds.find((k) => k.kind === kind)?.disabledReason !== undefined,
  })
  return (
    <Card step={2} title="Pricing" shot="contract-settings">
      <div {...groupProps} aria-label="Pricing kind" data-shot="contract-pricing-kinds" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        {rules.kinds.map((k, i) => (
          <RadioCard
            key={k.kind}
            radio={itemProps(i)}
            checked={draft.kind === k.kind}
            onSelect={() => set({ kind: k.kind })}
            title={PRICING_KIND_LABEL[k.kind]}
            description={KIND_DESCRIPTION[k.kind]}
            {...(k.disabledReason !== undefined ? { disabledReason: k.disabledReason } : {})}
            data-pricing-kind={k.kind}
          />
        ))}
      </div>
      <PanelGrid>
        {draft.kind === 'rvgContractRate' && <TextField label="Rate ($ per unit)" value={draft.rate} onChange={(rate) => set({ rate })} mono inputMode="decimal" />}
        {draft.kind === 'rvgDiscount' && <TextField label="Discount (%)" value={draft.discount} onChange={(discount) => set({ discount })} mono inputMode="decimal" />}
        {draft.kind === 'fixed' && (
          <>
            <TextField label="First price from" type="date" value={draft.firstStart} onChange={(firstStart) => set({ firstStart })} mono hint="May be in the past." />
            <TextField label="Price (ex GST)" value={draft.firstPrice} onChange={(firstPrice) => set({ firstPrice })} mono placeholder="0.00" inputMode="decimal" />
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Segmented label="Prepaid" value={draft.prepaid ? 'yes' : 'no'} options={YES_NO} onChange={(v) => set({ prepaid: v === 'yes' })} />
          <FieldHint>{draft.prepaid ? CONTRACT_REFUSAL_MESSAGES.prepaidNotRvg : 'Kind and prepaid are fixed once created.'}</FieldHint>
        </div>
        {rules.rvg ? (
          <Segmented label="Anaesthetist may change the price" value={draft.override ? 'yes' : 'no'} options={YES_NO} onChange={(v) => set({ override: v === 'yes' })} />
        ) : (
          // Read-only, drawn as the field it would be (#new): the override exists only on RVG kinds.
          <TextField label="Anaesthetist may change the price" value="Not on a fixed price" onChange={() => {}} disabled shot="contract-override-fixed" />
        )}
      </PanelGrid>
    </Card>
  )
}

/** Step 3: the linked surgeons or anaesthetist (never on a hospital's), the specialties and the funding tag. */
function WhereStep({ draft, set, rules }: StepProps) {
  const masters = useAppStore((s) => s.masters)
  // Active surgeons only (catch-up Phase 42).
  const surgeons = [...activeSurgeons({ masters: { surgeons: masters.surgeons } })].sort(compareBySurname)
  const anaesthetists = Object.values(masters.anaesthetists).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <Card step={3} title="Where it is offered" shot="contract-where-offered">
      {rules.showLinks ? (
        <PanelGrid>
          <ChipMultiSelect label="Linked surgeons" options={surgeons} value={draft.surgeonIds} onChange={(surgeonIds) => set({ surgeonIds })} addLabel="Add a surgeon" />
          <SelectField label="Linked anaesthetist" value={draft.anaesthetistId} onChange={(anaesthetistId) => set({ anaesthetistId })}>
            <option value="">None</option>
            {anaesthetists.map((a) => (
              <option key={a.registrationNumber} value={a.registrationNumber}>{a.name}</option>
            ))}
          </SelectField>
        </PanelGrid>
      ) : rules.holder?.kind === 'hospital' ? (
        <FieldHint>{CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital}</FieldHint>
      ) : null}
      <PanelGrid>
        <ChipMultiSelect
          label="Specialties"
          options={specialtiesInOrder(masters.specialties)}
          value={draft.specialtyIds}
          onChange={(specialtyIds) => set({ specialtyIds })}
          addLabel="Add a specialty"
          empty="Every specialty"
          hint="None means every specialty."
          shot="contract-specialties"
        />
        <div data-shot="contract-funding-tag">
          <SelectField label="Funding tag" value={draft.fundingTagId} onChange={(fundingTagId) => set({ fundingTagId })}>
            <option value="">None</option>
            {fundingTagsInOrder(masters.fundingTags).map((t) => (
              <option key={t.id} value={t.id}>{t.code}</option>
            ))}
          </SelectField>
        </div>
      </PanelGrid>
    </Card>
  )
}

/** Step 4: the name and the wording; the AA code is assigned on save. */
function NameStep({ draft, set }: { draft: ContractDraft; set: Draft['set'] }) {
  return (
    <Card step={4} title="Name, codes and invoice wording" shot="contract-codes">
      <PanelGrid>
        <TextField label="Name" value={draft.name} onChange={(name) => set({ name })} hint="What the step rail shows." shot="contract-name" />
        <TextField label="Holder reference" value={draft.holderReference} onChange={(holderReference) => set({ holderReference })} mono placeholder="Optional" hint="The holder's own code for the item. Need not be unique." />
        <TextField label="Invoice description" value={draft.invoiceDescription} onChange={(invoiceDescription) => set({ invoiceDescription })} hint="The words the patient reads on the invoice, where filled in." />
        <DefaultRvgCodeField value={draft.defaultRvgGroupId} onChange={(defaultRvgGroupId) => set({ defaultRvgGroupId })} />
      </PanelGrid>
    </Card>
  )
}
