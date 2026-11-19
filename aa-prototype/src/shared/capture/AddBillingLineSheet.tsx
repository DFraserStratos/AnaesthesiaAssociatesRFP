import { useBookingApi } from '../booking/draft'
import { useEffect, useState } from 'react'
import { neutral } from '../../theme/tokens'
import type { Procedure } from '../../domain/types'
import { parseAmount } from '../../domain/billing/money'
import { addBillingLine, type Actor } from '../../store'
import { Button, FormError, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { Caption } from './ui'

interface AddBillingLineSheetProps {
  open: boolean
  procedure: Procedure
  actor: Actor
  onClose: () => void
}

/**
 * The "add billing line" capture sheet (5th review #1): an ancillary fixed
 * amount beside the procedure, until 39b replaces billing lines with billing
 * events. The rate x time basis and its Contract gate are gone (catch-up
 * Phase 24, RV-03).
 */
export function AddBillingLineSheet({ open, procedure, actor, onClose }: AddBillingLineSheetProps) {
  const bookingApi = useBookingApi()
  const { Overlay } = useSurface()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDescription('')
      setAmount('')
      setError(null)
    }
  }, [open])

  const parsedAmount = parseAmount(amount)
  const valid = description.trim() !== '' && parsedAmount !== undefined && parsedAmount > 0

  function add() {
    setError(null)
    const outcome = addBillingLine(bookingApi, actor, procedure.id, { chargeBasis: 'fixed', description: description.trim(), amount: parsedAmount ?? 0 })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Add billing line" description="An ancillary fixed amount beside the procedure, for example an ACC pre-op flat fee." />
        <TextField label="Description" value={description} onChange={setDescription} placeholder="What this line charges" />
        <TextField label="Amount $" value={amount} onChange={setAmount} mono inputMode="decimal" placeholder="85.50" />
        <Caption color={neutral.slate}>
          ACC pre-operative assessment uses its own flat-fee code set (CS250, CS260, CS70), separate from the BTM structure. Name
          the code in the description; the rates are a confirmation item with AA billing.
        </Caption>
        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={add} disabled={!valid}>
              Add line
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
