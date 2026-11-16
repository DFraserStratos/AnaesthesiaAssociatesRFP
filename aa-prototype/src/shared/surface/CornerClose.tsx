/**
 * The one corner close (UI unification U2, question 11): the drawer's slate X,
 * named "Close", running the layer's one `onClose`. The web `Dialog` places it
 * in its top-right corner; the Admin `SidePanel` sits it in its header row.
 * U5's `CloseButton` takes this one over.
 */

import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import { neutral } from '../../theme/tokens'

export function CornerClose({ onClose, style }: { onClose: () => void; style?: Pick<CSSProperties, 'position' | 'top' | 'right' | 'display'> }) {
  return (
    <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4, ...style }}>
      <X size={20} aria-hidden />
    </button>
  )
}
