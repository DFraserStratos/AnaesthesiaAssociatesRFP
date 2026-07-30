import { useEffect, useState } from 'react'
import { Camera, ChevronLeft, PencilLine } from 'lucide-react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import { type Actor } from '../../store'
import { Button, TickBadge } from '../ui'
import { useSurface } from '../surface'
import { ManualCardForm, type ExtractionFields } from './ManualCardForm'
import { PhotoCaptureFlow } from './PhotoCaptureFlow'

interface AddCardFlowProps {
  open: boolean
  listId: string
  actor: Actor
  manualEmptyLookupPrefill?: ExtractionFields & { nhi: string }
  onClose: () => void
  onCreated: (cardId: string) => void
}

type Mode = 'choose' | 'manual' | 'photo' | 'done'

/**
 * Add a card: the chooser forks to the manual form or the simulated photo
 * capture, then a shared success state.
 *
 * The fork carries its own back affordance. Picking the wrong prong is easy on
 * a phone, and until it existed the only way out of the six-field manual form
 * was to close the whole sheet and start again — a dead end in the installable
 * PWA, where there is no browser back button, no URL bar and no reload. The
 * chevron follows the mobile screens' back treatment (borderless, `accent.base`,
 * 44px target) and sits below the `BottomSheet` drag handle, which is a centred
 * block of its own; on web the surface seam swaps in `Dialog`, which has no
 * handle, and the same row reads as the dialog's top-left back link.
 */
export function AddCardFlow({ open, listId, actor, manualEmptyLookupPrefill, onClose, onCreated }: AddCardFlowProps) {
  const { Overlay } = useSurface()
  const [mode, setMode] = useState<Mode>('choose')
  const [result, setResult] = useState<{ cardId: string; reused: boolean } | null>(null)

  // Reset to the chooser each time the sheet opens.
  useEffect(() => {
    if (open) {
      setMode('choose')
      setResult(null)
    }
  }, [open])

  function handleSaved(r: { cardId: string; reused: boolean }) {
    setResult(r)
    setMode('done')
  }

  /**
   * Back to the fork. Only the two capture prongs offer it: `done` is past the
   * point of no return (the card exists, and its own Done button is the exit),
   * and `choose` is the destination.
   */
  const canGoBack = mode === 'manual' || mode === 'photo'

  function goBack() {
    // The prong components unmount, which discards their draft state; `result`
    // is the only transient this component owns.
    setResult(null)
    setMode('choose')
  }

  return (
    <Overlay open={open} onClose={onClose}>
      {canGoBack && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Back to Add a card"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            minHeight: 44,
            border: 'none',
            background: 'none',
            padding: 0,
            color: accent.base,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          Add a card
        </button>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Add a card</div>
          <ChooseButton icon={<PencilLine size={20} strokeWidth={2} aria-hidden />} title="Enter manually" detail="Type the patient and operation" onClick={() => setMode('manual')} />
          <ChooseButton icon={<Camera size={20} strokeWidth={2} aria-hidden />} title="Photo of paper list" detail="Scan a paper theatre card (demo)" onClick={() => setMode('photo')} />
        </div>
      )}

      {mode === 'manual' && (
        <ManualCardForm
          listId={listId}
          actor={actor}
          emptyLookupPrefill={manualEmptyLookupPrefill}
          onSaved={handleSaved}
        />
      )}
      {mode === 'photo' && <PhotoCaptureFlow listId={listId} actor={actor} onSaved={handleSaved} />}

      {mode === 'done' && result !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
          <TickBadge size={72} animate />
          <div style={{ fontSize: 18, fontWeight: 700, color: semantic.success.onTint }}>Card added</div>
          <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center' }}>
            {result.reused
              ? 'Linked to an existing patient record by NHI. No duplicate was created.'
              : 'A new patient record was created for this card.'}
          </div>
          <Button
            variant="primary"
            block
            onClick={() => {
              onCreated(result.cardId)
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

function ChooseButton({ icon, title, detail, onClick }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: radius.card,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <span style={{ width: 44, height: 44, borderRadius: 12, background: accent.tint, color: accent.pressed, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: neutral.slate }}>{detail}</span>
      </span>
    </button>
  )
}
