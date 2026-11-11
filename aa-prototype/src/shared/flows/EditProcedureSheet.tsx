import { useEffect, useState } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { editProcedure, useAppStore, type Actor, type ProcedurePatch } from '../../store'
import { Button, FieldLabel, TextField } from '../ui'
import { useSurface } from '../surface'
import { PROCEDURE_TEXT_SOURCE_LABELS } from '../format'
import { CONTRACT_CHANGE_CAPTION, ProcedureContractRow } from '../booking/ProcedureContractRow'

interface EditProcedureSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

/**
 * Edit a Procedure's reference (`editProcedure`); its Contract shows here
 * (changed on the step rail, catch-up Phase 20). The procedure text is shown
 * read-only at the top: it is kept exactly as received and nobody edits it
 * (US-02.5.7, catch-up Phase 20a); edits change the RVG code (its own card)
 * and the Contract, never the text.
 */
export function EditProcedureSheet({ open, procedure, actor, onClose }: EditProcedureSheetProps) {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit procedure</div>
        <div data-shot="edit-procedure-text" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Procedure text</FieldLabel>
          <div
            className="mono"
            style={{ fontSize: 13.5, lineHeight: 1.45, color: live.procedureText !== null ? neutral.ink : neutral.mist, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
          >
            {live.procedureText !== null ? live.procedureText.text : 'No description received'}
          </div>
          {live.procedureText !== null && (
            <div style={{ fontSize: 12, color: neutral.mist }}>
              {PROCEDURE_TEXT_SOURCE_LABELS[live.procedureText.source]} · kept as received
            </div>
          )}
        </div>
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
        <Button variant="primary" block onClick={save}>
          Save
        </Button>
      </div>
    </Overlay>
  )
}
