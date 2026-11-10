import { useEffect, useMemo, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { BillingRoute, PatientPaymentCategory, Procedure } from '../../domain/types'
import { ContractSelect } from '../contracts/ContractSelect'
import { insurerPartyOptions } from '../../domain/billing/parties'
import {
  createBillableParty,
  editProcedure,
  useAppStore,
  type Actor,
  type ProcedurePatch,
} from '../../store'
import { Button, FieldLabel, Segmented, TextField } from '../ui'
import { useSurface } from '../surface'

interface EditBillingSetupSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

const ROUTE_OPTIONS: { value: BillingRoute; label: string }[] = [
  { value: 'hospital', label: "Contract's Party" },
  { value: 'billableParty', label: 'Billable party' },
  { value: 'insurer', label: 'Insurer' },
]

const CATEGORY_OPTIONS: { value: PatientPaymentCategory; label: string }[] = [
  { value: 'selfFundedPostProcedure', label: 'Self-funded' },
  { value: 'selfFundedPrepayment', label: 'Pre-payment' },
  { value: 'insuredReimbursement', label: 'Reimbursement' },
]

const selectStyle = {
  minHeight: 48,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 15,
} as const

/**
 * The office's full billing-setup editor for a Procedure (3rd review #1): the
 * RFP billing route (contract-holder / billable-party / insurer), the insurer,
 * the patient payment category, the Contract (`ContractSelect`), the hospital's
 * `billingReference`, and the billable-party (guardian) payer — including a
 * "New guardian" path that creates a BillableParty then points the procedure at
 * it. Mobile shows this context read-only; the office holds the full editor.
 */
export function EditBillingSetupSheet({ open, procedure, actor, onClose }: EditBillingSetupSheetProps) {
  const { Overlay } = useSurface()
  const parties = useAppStore((s) => s.masters.parties)
  const insurerOptions = useMemo(() => insurerPartyOptions(parties), [parties])
  const billableParties = useAppStore((s) => s.masters.billableParties)

  const [route, setRoute] = useState<BillingRoute>(procedure.billingRoute ?? 'hospital')
  const [insurerId, setInsurerId] = useState(procedure.insurerId ?? '')
  const [category, setCategory] = useState<PatientPaymentCategory>(procedure.patientPaymentCategory ?? 'selfFundedPostProcedure')
  const [contractId, setContractId] = useState(procedure.governingContractId ?? '')
  const [billingReference, setBillingReference] = useState(procedure.billingReference ?? '')
  const [guardianKey, setGuardianKey] = useState(procedure.billablePartyId ?? 'none')
  const [gName, setGName] = useState('')
  const [gRelationship, setGRelationship] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRoute(procedure.billingRoute ?? 'hospital')
      setInsurerId(procedure.insurerId ?? '')
      setCategory(procedure.patientPaymentCategory ?? 'selfFundedPostProcedure')
      setContractId(procedure.governingContractId ?? '')
      setBillingReference(procedure.billingReference ?? '')
      setGuardianKey(procedure.billablePartyId ?? 'none')
      setGName('')
      setGRelationship('')
      setGPhone('')
      setError(null)
    }
  }, [open, procedure])

  const creatingGuardian = route === 'billableParty' && guardianKey === 'new'
  const guardianReady = !creatingGuardian || (gName.trim() !== '' && gRelationship.trim() !== '')

  function save() {
    setError(null)

    // Resolve the payer first: a new guardian is created, then referenced.
    let billablePartyId: string | undefined
    if (route === 'billableParty') {
      if (guardianKey === 'new') {
        const created = createBillableParty(useAppStore, actor, {
          name: gName,
          relationshipToPatient: gRelationship,
          phone: gPhone,
        })
        if (!created.ok) {
          setError(created.message)
          return
        }
        billablePartyId = created.value.billablePartyId
      } else if (guardianKey !== 'none') {
        billablePartyId = guardianKey
      }
    }

    const patch: ProcedurePatch = { billingRoute: route }
    patch.insurerId = (route === 'insurer' || route === 'hospital') && insurerId !== '' ? insurerId : undefined
    patch.patientPaymentCategory = route === 'billableParty' ? category : undefined
    patch.billablePartyId = billablePartyId
    patch.governingContractId = contractId !== '' ? contractId : undefined
    patch.billingReference = billingReference.trim() !== '' ? billingReference.trim() : undefined

    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Billing setup</div>
        <Segmented label="Billing route" value={route} options={ROUTE_OPTIONS} onChange={setRoute} />

        {(route === 'insurer' || route === 'hospital') && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>{route === 'insurer' ? 'Insurer' : 'Insurer (optional)'}</FieldLabel>
            <select value={insurerId} onChange={(e) => setInsurerId(e.target.value)} style={selectStyle}>
              <option value="">Select an insurer</option>
              {insurerOptions.map(({ insurerId: id, party }) => (
                <option key={id} value={id}>
                  {party.name}
                </option>
              ))}
            </select>
            {route === 'hospital' && (
              <span style={{ fontSize: 13, color: neutral.slate }}>
                Informational only: records the patient's insurer for office reference. The Contract's Party is still invoiced.
              </span>
            )}
          </label>
        )}

        {route === 'billableParty' && (
          <>
            <Segmented label="Payment category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Payer</FieldLabel>
              <select value={guardianKey} onChange={(e) => setGuardianKey(e.target.value)} style={selectStyle}>
                <option value="none">Patient (default)</option>
                {Object.values(billableParties).map((b) => (
                  <option key={b.hiddenInternalId} value={b.hiddenInternalId}>
                    {b.name} ({b.relationshipToPatient})
                  </option>
                ))}
                <option value="new">New guardian…</option>
              </select>
            </label>
            {creatingGuardian && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12 }}>
                <TextField label="Guardian name" value={gName} onChange={setGName} placeholder="e.g. Jane Prentice" />
                <TextField label="Relationship to patient" value={gRelationship} onChange={setGRelationship} placeholder="e.g. Mother" />
                <TextField label="Contact (optional)" value={gPhone} onChange={setGPhone} type="tel" placeholder="021 555 0101" />
              </div>
            )}
          </>
        )}

        <ContractSelect value={contractId} onChange={setContractId} selectStyle={selectStyle} emptyLabel="Not chosen yet" />

        <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract / approval ref" />

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={save} disabled={!guardianReady}>
          Save billing setup
        </Button>
      </div>
    </Overlay>
  )
}
