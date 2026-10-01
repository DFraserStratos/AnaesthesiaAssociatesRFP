import { Paperclip } from 'lucide-react'
import { accent } from '../../theme/tokens'
import { useSurface } from '../surface'

/** The teal "Add attachment" text action (teal is the only action colour). */
export function AddAttachmentButton({ onClick }: { onClick: () => void }) {
  // 44px touch target on the phone; the desktop row keeps its compact height.
  const minHeight = useSurface().variant === 'mobile' ? 44 : 32
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, minHeight, display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <Paperclip size={15} aria-hidden /> Add attachment
    </button>
  )
}
