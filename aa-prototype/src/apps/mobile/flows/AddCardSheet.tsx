import { useEffect, useState } from 'react'
import { Camera, PencilLine } from 'lucide-react'
import { accent, neutral, radius } from '../../../theme/tokens'
import { type Actor } from '../../../store'
import { BottomSheet, MobileButton, TickBadge } from '../components'
import { ManualCardForm } from './ManualCardForm'
import { PhotoCaptureFlow } from './PhotoCaptureFlow'

interface AddCardSheetProps {
  open: boolean
  listId: string
  actor: Actor
  onClose: () => void
  onCreated: (cardId: string) => void
}

type Mode = 'choose' | 'manual' | 'photo' | 'done'

export function AddCardSheet({ open, listId, actor, onClose, onCreated }: AddCardSheetProps) {
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

  return (
    <BottomSheet open={open} onClose={onClose}>
      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Add a card</div>
          <ChooseButton icon={<PencilLine size={20} strokeWidth={2} aria-hidden />} title="Enter manually" detail="Type the patient and operation" onClick={() => setMode('manual')} />
          <ChooseButton icon={<Camera size={20} strokeWidth={2} aria-hidden />} title="Photo of paper list" detail="Scan a paper theatre card (demo)" onClick={() => setMode('photo')} />
        </div>
      )}

      {mode === 'manual' && <ManualCardForm listId={listId} actor={actor} onSaved={handleSaved} />}
      {mode === 'photo' && <PhotoCaptureFlow listId={listId} actor={actor} onSaved={handleSaved} />}

      {mode === 'done' && result !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 8px' }}>
          <TickBadge size={72} animate />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#157A49' }}>Card added</div>
          <div style={{ fontSize: 13, color: neutral.slate, textAlign: 'center' }}>
            {result.reused
              ? 'Linked to an existing patient record by NHI. No duplicate was created.'
              : 'A new patient record was created for this card.'}
          </div>
          <MobileButton
            variant="primary"
            block
            onClick={() => {
              onCreated(result.cardId)
              onClose()
            }}
            style={{ marginTop: 4 }}
          >
            Done
          </MobileButton>
        </div>
      )}
    </BottomSheet>
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
