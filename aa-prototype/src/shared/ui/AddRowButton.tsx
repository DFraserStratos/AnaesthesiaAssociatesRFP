import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'

/**
 * The dashed full-width "Add a booking" under a List's rows (UI unification U6, U35; J N6): a
 * `1.5px dashed lineStrong` outline, teal words and a plus. `size` desktop is the web List detail's
 * (radius 10, 14px, `13px 16px`); touch the phone's (radius 14, 15px, `14px 16px`). Always
 * `type="button"`.
 */
export function AddRowButton({ onClick, children, size = 'desktop' }: { onClick: () => void; children: ReactNode; size?: 'desktop' | 'touch' }) {
  const touch = size === 'touch'
  return (
    <button
      type="button"
      className="aa-ctl"
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: touch ? '14px 16px' : '13px 16px',
        background: neutral.surface,
        border: `1.5px dashed ${neutral.lineStrong}`,
        borderRadius: touch ? radius.card : radius.ctl,
        fontFamily: 'inherit',
        color: accent.base,
        fontSize: touch ? 15 : 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Plus size={touch ? 18 : 17} strokeWidth={2.4} aria-hidden />
      {children}
    </button>
  )
}
