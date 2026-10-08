import { useEffect, useState } from 'react'
import { neutral, semantic, type as typeScale } from '../../theme/tokens'
import { type Actor } from '../../store'
import type { BookingSource } from '../../domain/types'
import { Button, TickBadge } from '../ui'
import { DemoBadge } from '../DemoBadge'
import { useSurface } from '../surface'
import { ManualBookingForm, type ExtractionFields } from './ManualBookingForm'
import { PhotoCaptureFlow } from './PhotoCaptureFlow'

/** The prong the sheet opens on. Only the Future-scope demo opens on `photo`. */
export type AddBookingMode = 'manual' | 'photo'

interface AddBookingFlowProps {
  open: boolean
  listId: string
  actor: Actor
  manualEmptyLookupPrefill?: ExtractionFields & { nhi: string }
  /** Defaults to `manual`. `photo` is the "Photo capture (Future scope)" demo action's way in. */
  initialMode?: AddBookingMode
  /** Changing it while open restarts the sheet (a second Future-scope request). */
  resetKey?: number
  onClose: () => void
  onCreated: (bookingId: string) => void
}

type Mode = AddBookingMode | 'done'

/** The display-only Booking source (DM-39): the office's phone advice is an
 *  office entry; an anaesthetist adds ad hoc. The Future-scope photo demo is an
 *  ad hoc Booking with a photo attachment, so it stamps the same. */
function sourceFor(actor: Actor): BookingSource {
  return actor.role === 'office' ? 'admin' : 'anaesthetistAdHoc'
}

/**
 * Add a booking: the manual form, then a shared success state.
 *
 * Manual entry is the one way in (US-02.4.1), so the sheet opens straight on
 * the form under its own title, with no chooser and no back control; the
 * sheet's close is the exit. Photo capture is Future Work (US-02.4.4, catch-up
 * Phase 15b): `PhotoCaptureFlow` is reachable only through the badged "Photo
 * capture (Future scope)" demo action on the mobile List, which opens this
 * sheet with `initialMode="photo"`. That prong keeps the flow's own heading,
 * so the sheet never stacks two titles.
 */
export function AddBookingFlow({ open, listId, actor, manualEmptyLookupPrefill, initialMode = 'manual', resetKey, onClose, onCreated }: AddBookingFlowProps) {
  const { Overlay } = useSurface()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [result, setResult] = useState<{ bookingId: string; reused: boolean } | null>(null)

  // Reset to the starting prong each time the sheet opens (or is re-requested).
  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setResult(null)
    }
  }, [open, initialMode, resetKey])

  function handleSaved(r: { bookingId: string; reused: boolean }) {
    setResult(r)
    setMode('done')
  }

  return (
    <Overlay open={open} onClose={onClose}>
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            style={{
              margin: 0,
              fontSize: typeScale.title.size,
              lineHeight: `${typeScale.title.line}px`,
              fontWeight: typeScale.title.weight,
              letterSpacing: typeScale.title.tracking,
              color: neutral.ink,
            }}
          >
            Add a booking
          </h2>
          <ManualBookingForm
            listId={listId}
            actor={actor}
            emptyLookupPrefill={manualEmptyLookupPrefill}
            source={sourceFor(actor)}
            onSaved={handleSaved}
          />
        </div>
      )}
      {mode === 'photo' && (
        // Keyed, so a repeat request restarts the flow at the card picker.
        <div key={resetKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DemoBadge tone="future" style={{ alignSelf: 'flex-start' }} />
          <PhotoCaptureFlow listId={listId} actor={actor} source={sourceFor(actor)} onSaved={handleSaved} />
        </div>
      )}

      {mode === 'done' && result !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
          <TickBadge size={72} animate />
          <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>Booking added</div>
          <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center' }}>
            {result.reused
              ? 'Linked to an existing patient record by NHI. No duplicate was created.'
              : 'A new patient record was created for this booking.'}
          </div>
          <Button
            variant="primary"
            block
            onClick={() => {
              onCreated(result.bookingId)
              onClose()
            }}
            style={{ marginTop: 4 }}
          >
            Done
          </Button>
        </div>
      )}
    </Overlay>
  )
}
