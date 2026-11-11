import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { createBillableParty, editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { Button, FieldLabel, TextField } from '../ui'
import { useSurface } from '../surface'
import { ProcedureContractRow } from '../booking/ProcedureContractRow'

interface EditBillingSetupSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

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
 * "Contract and payer" (catch-up Phase 20; 3rd review #1 re-based): the
 * Procedure's one Contract, chosen or changed on the step rail, the payer
 * override (a guardian or named payer, read when the Contract bills the payer;
 * INTERIM until Phase 21's payer on the Booking), with a "New guardian" path,
 * and the holder's reference. No route, payment category or insurer: the
 * Contract decides where the invoice goes.
 */
export function EditBillingSetupSheet({ open, procedure, actor, onClose }: EditBillingSetupSheetProps) {
  const { Overlay } = useSurface()
  const billableParties = useAppStore((s) => s.masters.billableParties)
  const live = useAppStore((s) => s.schedule.procedures[procedure.id]) ?? procedure

  const [billingReference, setBillingReference] = useState(procedure.billingReference ?? '')
  const [guardianKey, setGuardianKey] = useState(procedure.billablePartyId ?? 'none')
  const [gName, setGName] = useState('')
  const [gRelationship, setGRelationship] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setBillingReference(procedure.billingReference ?? '')
      setGuardianKey(procedure.billablePartyId ?? 'none')
      setGName('')
      setGRelationship('')
      setGPhone('')
      setError(null)
    }
  }, [open, procedure])

  const creatingGuardian = guardianKey === 'new'
  const guardianReady = !creatingGuardian || (gName.trim() !== '' && gRelationship.trim() !== '')

  function save() {
    setError(null)
    let billablePartyId: string | undefined
    if (guardianKey === 'new') {
      const created = createBillableParty(useAppStore, actor, { name: gName, relationshipToPatient: gRelationship, phone: gPhone })
      if (!created.ok) {
        setError(created.message)
        return
      }
      billablePartyId = created.value.billablePartyId
    } else if (guardianKey !== 'none') {
      billablePartyId = guardianKey
    }
    const patch: ProcedurePatch = {
      billablePartyId,
      billingReference: billingReference.trim() !== '' ? billingReference.trim() : undefined,
    }
    const outcome = editProcedure(useAppStore, actor, procedure.id, patch)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="contract-and-payer" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Contract and payer</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Contract</FieldLabel>
          <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', background: neutral.bg }}>
            <ProcedureContractRow procedure={live} actor={actor} canEdit={false} shot="contract-and-payer-contract" />
          </div>
        </div>

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
          <span style={{ fontSize: 13, color: neutral.slate }}>Used when the Contract bills the payer. A Contract that bills its holder bills the holder.</span>
        </label>
        {creatingGuardian && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12 }}>
            <TextField label="Guardian name" value={gName} onChange={setGName} placeholder="e.g. Jane Prentice" />
            <TextField label="Relationship to patient" value={gRelationship} onChange={setGRelationship} placeholder="e.g. Mother" />
            <TextField label="Contact (optional)" value={gPhone} onChange={setGPhone} type="tel" placeholder="021 555 0101" />
          </div>
        )}

        <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract or approval reference" />

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
        )}
        <Button variant="primary" block onClick={save} disabled={!guardianReady}>
          Save payer and reference
        </Button>
      </div>
    </Overlay>
  )
}
