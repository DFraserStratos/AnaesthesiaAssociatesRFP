import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { WarningStrength } from '../../domain/warnings'
import { radius } from '../../theme/tokens'
import { warningTone } from './tone'
import { StrengthPill } from './StrengthPill'

/**
 * One warning that is not raised yet: a preview before a save (catch-up Phase
 * 40, `patientBalancePreview`). It reads as a `WarningsPanel` row in the same
 * tint (mild warning, strong error) with its strength pill, so the office sees
 * the warning the save will raise. No Clear: there is nothing to clear yet.
 * `children` sits under the text (a caption or a link).
 */
export function WarningPreviewRow({
  strength,
  text,
  shot,
  children,
}: {
  strength: WarningStrength
  text: string
  shot?: string
  children?: ReactNode
}) {
  const tone = warningTone(strength)
  return (
    <div
      role="status"
      data-shot={shot}
      data-strength={strength}
      style={{ background: tone.tint, color: tone.onTint, borderRadius: radius.card, padding: '10px 12px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}
    >
      <TriangleAlert size={16} aria-hidden style={{ flex: 'none', marginTop: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span style={{ fontWeight: 600, lineHeight: '18px' }}>{text}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <StrengthPill strength={strength} />
          {children}
        </span>
      </div>
    </div>
  )
}
