/**
 * The insurer or funder sheet (catch-up Phase 21; US-11.4.3, D28): a bottom
 * sheet on the phone, a dialog on web and Admin. The office records the
 * Booking's insurer or funder (a Party) and the approval number; the
 * anaesthetist may change both on the day. Chips, not a dropdown: "None"
 * (who pays is each Procedure's Paid by, catch-up Phase 22a), then the insurers and the funders. No money, no Contract and
 * no holder setting: the funder never decides who is billed.
 */

import { useBookingApi, useBookingStore, usePrimaryEditLabel } from '../booking/draft'
import { useEffect, useMemo, useState } from 'react'
import { insurerAndFunderParties } from '../../domain/billing/insurance'
import { setBookingInsurance, type Actor } from '../../store'
import { Button, FieldLabel, FormError, OptionChip, TextField } from '../ui'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'

interface FunderSheetProps {
  open: boolean
  bookingId: string
  actor: Actor
  onClose: () => void
}

const NONE = ''

export function FunderSheet({ open, bookingId, actor, onClose }: FunderSheetProps) {
  const bookingApi = useBookingApi()
  // "Apply" in the Admin draft (catch-up Phase 35): the draft's Save changes saves.
  const primaryLabel = usePrimaryEditLabel('Save')
  const { Overlay, variant } = useSurface()
  const chipSize = variant === 'mobile' ? 'lg' : 'md'
  const booking = useBookingStore((s) => s.schedule.bookings[bookingId])
  const partiesRecord = useBookingStore((s) => s.masters.parties)
  const parties = useMemo(() => insurerAndFunderParties(partiesRecord), [partiesRecord])
  const [funder, setFunder] = useState(NONE)
  const [number, setNumber] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || booking === undefined) return
    setFunder(booking.funderPartyId ?? NONE)
    setNumber(booking.insuranceApprovalNumber ?? '')
    setError(null)
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (booking === undefined) return null
  const chosen = funder !== NONE ? partiesRecord[funder] : undefined
  const insurers = parties.filter((p) => p.kind === 'insurer')
  const funders = parties.filter((p) => p.kind === 'funder')

  function save() {
    setError(null)
    const outcome = setBookingInsurance(bookingApi, actor, bookingId, {
      ...(funder !== NONE ? { funderPartyId: funder } : {}),
      ...(funder !== NONE ? { insuranceApprovalNumber: number } : {}),
    })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="funder-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <OverlayHeader
            title="Insurer or funder"
            description={<>Who funds this Booking, and the insurer&apos;s approval number. It never changes who is invoiced.</>}
          />
        </div>

        <div role="radiogroup" aria-label="Insurer or funder" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <OptionChip role="radio" size={chipSize} pressed={funder === NONE} onClick={() => setFunder(NONE)} shot="funder-none">None</OptionChip>
          </div>
          {insurers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FieldLabel>Insurers</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {insurers.map((p) => (
                  <OptionChip key={p.id} role="radio" size={chipSize} pressed={funder === p.id} onClick={() => setFunder(p.id)}>{p.name}</OptionChip>
                ))}
              </div>
            </div>
          )}
          {funders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FieldLabel>Funders</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {funders.map((p) => (
                  <OptionChip key={p.id} role="radio" size={chipSize} pressed={funder === p.id} onClick={() => setFunder(p.id)}>{p.name}</OptionChip>
                ))}
              </div>
            </div>
          )}
        </div>

        {chosen !== undefined && (
          <TextField
            label="Approval number"
            value={number}
            onChange={setNumber}
            mono
            {...(chosen.kind === 'insurer' ? { hint: 'Without approval on the day, the patient is billed.' } : {})}
          />
        )}

        <FormError message={error} />
        <SheetActions
          primary={
            <Button variant="primary" block onClick={save}>
              {primaryLabel}
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
