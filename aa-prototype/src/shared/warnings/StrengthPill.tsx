import type { WarningStrength } from '../../domain/warnings'
import { Pill, type PillSize } from '../ui/Pill'
import { STRENGTH_LABELS, warningPillTone } from './tone'

/**
 * A warning's strength, "Mild" or "Strong", as an outline pill in the warning's
 * own tone (mild amber, strong red); neutral once `cleared`. Nothing for no
 * warning. The one strength pill: the warnings panel, the preview row and the
 * Admin patient screens all draw it (catch-up Phase 40).
 */
export function StrengthPill({
  strength,
  cleared = false,
  size,
  shot,
}: {
  strength: WarningStrength | 'none' | undefined
  cleared?: boolean
  size?: PillSize
  shot?: string
}) {
  if (strength === undefined || strength === 'none') return null
  return (
    <Pill tone={warningPillTone(cleared ? undefined : strength)} variant="outline" {...(size !== undefined ? { size } : {})} {...(shot !== undefined ? { shot } : {})} data-strength={strength}>
      {STRENGTH_LABELS[strength]}
    </Pill>
  )
}
