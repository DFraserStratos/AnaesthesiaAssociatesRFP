/**
 * "Upload PDF list" (catch-up Phase 34; US-02.2.1, US-02.2.4). The office
 * picks one of the sample PDF lists (the reading is simulated, so the picker
 * is badged "Sample files") and enters the address it arrived from, prefilled
 * from the sample and editable, required. A desktop dialog through the
 * surface's `Overlay`, titled by `OverlayHeader`, its footer `SheetActions`,
 * as 33's Import hospital file.
 */

import { useEffect, useState } from 'react'
import { neutral } from '../../../theme/tokens'
import { PDF_LIST_SAMPLES } from '../../../domain/intake'
import { useAppStore } from '../../../store'
import { DemoBadge } from '../../../shared/DemoBadge'
import { OverlayHeader, SheetActions, useSurface } from '../../../shared/surface'
import { Button, FormError, RadioCard, TextField, useRovingRadio } from '../../../shared/ui'
import { plural } from '../../../shared/format'

export function PdfUploadDialog({
  open,
  onClose,
  onUpload,
}: {
  open: boolean
  onClose: () => void
  /** Returns the refusal message, or null once uploaded. */
  onUpload: (sampleId: string, senderEmail: string) => string | null
}) {
  const { Overlay } = useSurface()
  const pdfLists = useAppStore((s) => s.intake.pdfLists)
  const received = new Set(Object.values(pdfLists).map((l) => l.sampleId))
  const available = PDF_LIST_SAMPLES.filter((s) => !received.has(s.id))
  const first = available[0]
  const [picked, setPicked] = useState<string | undefined>(first?.id)
  const [sender, setSender] = useState(first?.defaultSender ?? '')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      setPicked(first?.id)
      setSender(first?.defaultSender ?? '')
      setError(null)
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const ids = available.map((s) => s.id)
  const pick = (id: string) => {
    setPicked(id)
    setSender(available.find((s) => s.id === id)?.defaultSender ?? '')
    setError(null)
  }
  const { groupProps, itemProps } = useRovingRadio({ values: ids, value: picked ?? '', onChange: pick })

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="pdf-upload" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <OverlayHeader
          title="Upload PDF list"
          trailing={<DemoBadge label="Sample files" />}
          description="Choose the PDF list the rooms emailed and enter the address it came from. Its rows are read for you to check and correct before you send them to Matching."
        />
        {available.length === 0 ? (
          <div style={{ fontSize: 13, color: neutral.slate }}>Every sample PDF list is already in the inbox. Reset the demo to upload one again.</div>
        ) : (
          <div {...groupProps} aria-label="Sample PDF lists" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {available.map((s, i) => (
              <RadioCard
                key={s.id}
                radio={itemProps(i)}
                checked={s.id === picked}
                onSelect={() => pick(s.id)}
                title={`${s.surgeonName} · ${s.hospitalName}`}
                titleExtra={<span className="mono" style={{ fontSize: 12, color: neutral.slate }}>{plural(s.rows.length, 'row')}</span>}
                description={
                  <>
                    <span style={{ fontSize: 13, color: neutral.ink }}>{s.subject}</span>
                    {s.note !== undefined && <span>{s.note}</span>}
                  </>
                }
                data-sample-id={s.id}
              />
            ))}
          </div>
        )}
        {available.length > 0 && (
          <TextField
            label="Sent from"
            type="email"
            value={sender}
            onChange={(v) => {
              setSender(v)
              setError(null)
            }}
            placeholder="name@practice.example"
            hint="The address the PDF arrived from. Replies about this List go back to it."
            invalid={error !== null}
            shot="pdf-upload-sender"
          />
        )}
        {error !== null && <FormError message={error} />}
        <SheetActions
          secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
          primary={
            <Button
              variant="primary"
              size="desktop"
              block
              disabled={picked === undefined || available.length === 0}
              onClick={() => {
                if (picked === undefined) return
                const refusal = onUpload(picked, sender)
                if (refusal !== null) setError(refusal)
              }}
              shot="pdf-upload-confirm"
            >
              Upload
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
