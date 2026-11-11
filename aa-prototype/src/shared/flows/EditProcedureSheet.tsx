import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { Button, FieldLabel, TextField } from '../ui'
import { useSurface } from '../surface'
import { CONTRACT_CHANGE_CAPTION, ProcedureContractRow } from '../booking/ProcedureContractRow'

interface EditProcedureSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

/**
 * Edit a Procedure's operation and reference (`editProcedure`); its Contract
 * shows here with "Change", which opens the step rail (catch-up Phase 20):
 * no route, insurer or payment category.
 */
export function EditProcedureSheet({ open, procedure, actor, onClose }: EditProcedureSheetProps) {
  const { Overlay } = useSurface()
  const live = useAppStore((s) => s.schedule.procedures[procedure.id]) ?? procedure
  const [description, setDescription] = useState(procedure.description)
  const [billingReference, setBillingReference] = useState(procedure.billingReference ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDescription(procedure.description)
      setBillingReference(procedure.billingReference ?? '')
      setError(null)
    }
  }, [open, procedure])

  function save() {
    setError(null)
    const patch: ProcedurePatch = {
      description: description.trim(),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit operation</div>
        <TextField label="Operation" value={description} onChange={setDescription} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Contract</FieldLabel>
          <div style={{ border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px', background: neutral.bg }}>
            <ProcedureContractRow
              procedure={live}
              actor={actor}
              canEdit={false}
              shot="edit-procedure-contract"
              {...(actor.role === 'anaesthetist' ? { caption: CONTRACT_CHANGE_CAPTION } : {})}
            />
          </div>
        </div>
        <TextField label="Billing reference" value={billingReference} onChange={setBillingReference} placeholder="Hospital contract or approval reference" />
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button variant="primary" block onClick={save} disabled={description.trim() === ''}>
          Save operation
        </Button>
      </div>
    </Overlay>
  )
}
