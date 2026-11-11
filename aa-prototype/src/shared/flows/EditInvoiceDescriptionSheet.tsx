import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { setInvoiceDescription, useAppStore, type Actor } from '../../store'
import { Button, FieldLabel, FormError, TextArea } from '../ui'
import { useSurface } from '../surface'
import { PROCEDURE_TEXT_SOURCE_LABELS } from '../format'

interface EditInvoiceDescriptionSheetProps {
  open: boolean
  procedureId: string
  actor: Actor
  onClose: () => void
}

/**
 * The office's edit of a Procedure's invoice description (catch-up Phase 20a;
 * US-08.4.6 "Admin edit"; D73): free text, prefilled with the current wording,
 * the procedure text shown read-only above it. The edit always wins over a
 * later description or a Contract change; a newer one shows as a cue instead.
 * A dialog on Admin (the office's surface). Phase 35's amend flow reuses it.
 */
export function EditInvoiceDescriptionSheet({ open, procedureId, actor, onClose }: EditInvoiceDescriptionSheetProps) {
  const { Overlay } = useSurface()
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  const [text, setText] = useState(procedure?.invoiceDescription?.text ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setText(procedure?.invoiceDescription?.text ?? procedure?.procedureText?.text ?? '')
      setError(null)
    }
    // Only when the dialog opens: typing must not be reset by a store change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (procedure === undefined) return null

  function save() {
    const outcome = setInvoiceDescription(useAppStore, actor, procedureId, text)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  const received = procedure.procedureText
  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="edit-invoice-description" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Edit invoice description</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Procedure text</FieldLabel>
          <div
            className="mono"
            style={{ fontSize: 13.5, lineHeight: '20px', color: received !== null ? neutral.ink : neutral.mist, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
          >
            {received !== null ? received.text : 'No description received'}
          </div>
          {received !== null && <div style={{ fontSize: 12, color: neutral.mist }}>{PROCEDURE_TEXT_SOURCE_LABELS[received.source]} · not changed by this edit</div>}
        </div>
        <TextArea label="What the invoice says" value={text} onChange={setText} />
        <div style={{ fontSize: 12.5, color: neutral.mist, marginTop: -8 }}>Your wording stays if a newer description arrives.</div>
        <FormError message={error} />
        <Button variant="primary" block onClick={save}>
          Save invoice description
        </Button>
      </div>
    </Overlay>
  )
}
