import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../../theme/tokens'
import type { BillingRoute, PatientPaymentCategory, Procedure } from '../../../domain/types'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../../store'
import { BottomSheet, FieldLabel, MobileButton, Segmented, TextField } from '../components'

interface EditProcedureSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

const ROUTE_OPTIONS: { value: BillingRoute; label: string }[] = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'billableParty', label: 'Billable party' },
  { value: 'insurer', label: 'Insurer' },
]

const CATEGORY_OPTIONS: { value: PatientPaymentCategory; label: string }[] = [
  { value: 'selfFundedPostProcedure', label: 'Self-funded' },
  { value: 'selfFundedPrepayment', label: 'Pre-payment' },
  { value: 'insuredReimbursement', label: 'Reimbursement' },
]

/** Edit the primary procedure's operation + billing route via `editProcedure`. */
export function EditProcedureSheet({ open, procedure, actor, onClose }: EditProcedureSheetProps) {
  const insurers = useAppStore((s) => s.masters.insurers)
  const [description, setDescription] = useState(procedure.description)
  const [route, setRoute] = useState<BillingRoute>(procedure.billingRoute ?? 'hospital')
  const [insurerId, setInsurerId] = useState(procedure.insurerId ?? '')
  const [category, setCategory] = useState<PatientPaymentCategory>(procedure.patientPaymentCategory ?? 'selfFundedPostProcedure')
  const [billingReference, setBillingReference] = useState(procedure.billingReference ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDescription(procedure.description)
      setRoute(procedure.billingRoute ?? 'hospital')
      setInsurerId(procedure.insurerId ?? '')
      setCategory(procedure.patientPaymentCategory ?? 'selfFundedPostProcedure')
      setBillingReference(procedure.billingReference ?? '')
      setError(null)
    }
  }, [open, procedure])

  function save() {
    setError(null)
    const patch: ProcedurePatch = { description: description.trim(), billingRoute: route }
    patch.insurerId = route === 'insurer' && insurerId !== '' ? insurerId : undefined
    patch.patientPaymentCategory = route === 'billableParty' ? category : undefined
    patch.billingReference = route === 'hospital' && billingReference.trim() !== '' ? billingReference.trim() : undefined
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit operation</div>
        <TextField label="Operation" value={description} onChange={setDescription} />
        <Segmented label="Billing route" value={route} options={ROUTE_OPTIONS} onChange={setRoute} />

        {route === 'insurer' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Insurer</FieldLabel>
            <select
              value={insurerId}
              onChange={(e) => setInsurerId(e.target.value)}
              style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 15 }}
            >
              <option value="">Select an insurer</option>
              {Object.values(insurers).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.acceptsDirectClaims ? ' (direct claims)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {route === 'billableParty' && (
          <Segmented label="Payment category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
        )}

        {route === 'hospital' && (
          <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract / approval ref" />
        )}

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <MobileButton variant="primary" block onClick={save} disabled={description.trim() === ''}>
          Save operation
        </MobileButton>
      </div>
    </BottomSheet>
  )
}
