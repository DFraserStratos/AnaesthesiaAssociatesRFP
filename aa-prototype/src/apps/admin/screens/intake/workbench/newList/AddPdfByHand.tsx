/**
 * Add a PDF by hand (build plan Phase 68 creates the stub; Phase 70 fills it; US-02.2.1, US-02.2.4, D125): the
 * fallback for a rooms' PDF that did not come through the mailbox. The office picks one of the sample files (the
 * reading is simulated, so the picker is badged "Sample files") and types the address it came from (required, an
 * email address, prefilled from the sample and editable). `addPdfByHand` reads it and lands it in the feed as a
 * mailbox PDF does; the dialog closes and Arrivals opens on the new arrival. A desktop dialog through the surface's
 * `Overlay`, titled by `OverlayHeader`, its footer `SheetActions` (the markup of the old upload dialog).
 * `IntakeSection` enables its "Add a PDF by hand" while `ADD_PDF_BY_HAND_READY` is true.
 *
 * Hooks: `data-shot="intake-add-pdf-dialog"`; each sample's `data-sample-id`; `intake-add-pdf-sender`,
 * `intake-add-pdf-confirm`.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Actor } from '../../../../../../store/mutate'
import { addPdfByHand, byHandSamples, useAppStore } from '../../../../../../store'
import { DemoBadge } from '../../../../../../shared/DemoBadge'
import { OverlayHeader, SheetActions, useSurface } from '../../../../../../shared/surface'
import { Button, FormError, RadioCard, TextField, useRovingRadio } from '../../../../../../shared/ui'
import { neutral, space, type as typeScale } from '../../../../../../theme/tokens'
import { arrivalsPath } from '../../intakePaths'

export const ADD_PDF_BY_HAND_READY = true

/** Mounted only while open, so it starts fresh each time and the section renders without a surface while closed. */
export function AddPdfByHand({ open, onClose, actor }: { open: boolean; onClose: () => void; actor: Actor }) {
  return open ? <AddPdfByHandDialog onClose={onClose} actor={actor} /> : null
}

function AddPdfByHandDialog({ onClose, actor }: { onClose: () => void; actor: Actor }) {
  const open = true
  const { Overlay } = useSurface()
  const navigate = useNavigate()
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const available = useMemo(() => byHandSamples({ intake, masters }), [intake, masters])
  const first = available[0]
  const [picked, setPicked] = useState<string | undefined>(first?.id)
  const [sender, setSender] = useState(first?.defaultSender ?? '')
  const [error, setError] = useState<string | null>(null)

  const ids = available.map((s) => s.id)
  const pick = (id: string) => {
    setPicked(id)
    setSender(available.find((s) => s.id === id)?.defaultSender ?? '')
    setError(null)
  }
  const { groupProps, itemProps } = useRovingRadio({ values: ids, value: picked ?? '', onChange: pick })

  const add = () => {
    if (picked === undefined) return
    const out = addPdfByHand(useAppStore, actor, picked, sender)
    if (!out.ok) {
      setError(out.message)
      return
    }
    onClose()
    navigate(arrivalsPath({ item: out.value.arrivalKey }))
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="intake-add-pdf-dialog" style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
        <OverlayHeader
          title="Add a PDF by hand"
          trailing={<DemoBadge label="Sample files" />}
          description="For a List the rooms sent some other way. Choose the PDF and enter the address it came from. It is read and lands in Arrivals like one from the mailbox."
        />
        {available.length === 0 ? (
          <div style={{ fontSize: typeScale.label.size, color: neutral.slate }}>Every sample PDF is already in Intake. Reset the demo to add one again.</div>
        ) : (
          <div {...groupProps} aria-label="Sample PDFs" style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
            {available.map((s, i) => (
              <RadioCard
                key={s.id}
                radio={itemProps(i)}
                checked={s.id === picked}
                onSelect={() => pick(s.id)}
                title={s.label}
                titleExtra={<span className="mono" style={{ fontSize: typeScale.caption.size, color: neutral.slate }}>{s.fileName}</span>}
                description={<span>{s.detail}</span>}
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
            hint="The address the PDF came from. Replies about this List go back to it."
            invalid={error !== null}
            shot="intake-add-pdf-sender"
          />
        )}
        <FormError message={error} />
        <SheetActions
          secondary={
            <Button variant="secondary" size="desktop" onClick={onClose}>
              Cancel
            </Button>
          }
          primary={
            <Button variant="primary" size="desktop" block disabled={picked === undefined || available.length === 0} onClick={add} shot="intake-add-pdf-confirm">
              Add PDF
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
