import { useEffect, useState } from 'react'
import { neutral, radius } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { Button, FieldLabel, FormError, TextField } from '../ui'
import { useSurface } from '../surface'
import { ProcedureContractRow } from '../booking/ProcedureContractRow'

interface EditBillingSetupSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

/**
 * "Contract and reference" (catch-up Phase 20; 3rd review #1 re-based): the
 * Procedure's one Contract (read-only here; chosen on the step rail) and the
 * holder's billing reference. The payer lives on the Booking since catch-up
 * Phase 21 (the Payer section, `setBookingPayer`): no guardian select and no
 * "New guardian" here. The Contract decides where the invoice goes.
 */
export function EditBillingSetupSheet({ open, procedure, actor, onClose }: EditBillingSetupSheetProps) {
  const { Overlay } = useSurface()
  const live = useAppStore((s) => s.schedule.procedures[procedure.id]) ?? procedure

  const [billingReference, setBillingReference] = useState(procedure.billingReference ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setBillingReference(procedure.billingReference ?? '')
      setError(null)
    }
  }, [open, procedure])

  function save() {
    setError(null)
    const patch: ProcedurePatch = {
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
      <div data-shot="contract-and-reference" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Contract and reference</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Contract</FieldLabel>
          <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', background: neutral.bg }}>
            <ProcedureContractRow procedure={live} actor={actor} canEdit={false} shot="contract-and-reference-contract" />
          </div>
        </div>

        <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract reference" />

        <FormError message={error} />
        <Button variant="primary" block onClick={save}>
          Save reference
        </Button>
      </div>
    </Overlay>
  )
}
