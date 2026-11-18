import type { Actor } from '../../../store'
import { BottomSheet } from '../../../shared/surface'
import { OverlayHeader } from '../../../shared/surface/OverlayHeader'
import { SheetActions } from '../../../shared/surface/SheetActions'
import { Button, FormError, TextField } from '../../../shared/ui'
import { RATE_EXPLAINER, RATE_LABEL, RATE_NOTE, useRateEditor } from '../../../shared/profile'

interface EditRateSheetProps {
  open: boolean
  actor: Actor
  anaesthetistId: string
  current: number
  onClose: () => void
}

/**
 * The anaesthetist sets their own rate per unit (catch-up Phase 26;
 * US-12.1.1): a bottom sheet with a mono dollar field on the decimal keypad,
 * the rate note and the sticky teal Save. A refusal renders verbatim.
 */
export function EditRateSheet({ open, actor, anaesthetistId, current, onClose }: EditRateSheetProps) {
  // The parent remounts the sheet (a new `key`) each time it opens, so the field starts at the current rate.
  const rate = useRateEditor(actor, anaesthetistId, current)

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div data-shot="mobile-rate-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Rate per unit" description={RATE_EXPLAINER} />
        <TextField
          label={RATE_LABEL}
          value={rate.text}
          onChange={rate.change}
          mono
          inputMode="decimal"
          invalid={rate.error !== null}
          hint={RATE_NOTE}
          autoFocus
        />
        <FormError message={rate.error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={() => { if (rate.save()) onClose() }} shot="mobile-rate-save">
              Save rate
            </Button>
          }
        />
      </div>
    </BottomSheet>
  )
}
