import { neutral, semantic } from '../../theme/tokens'
import type { WarningStrength } from '../../domain/warnings'

/**
 * Warning colours (Design Language §01 semantic tokens): mild is the semantic
 * warning amber, strong the semantic error red, a cleared warning neutral
 * mist. Never a schedule status colour, never crimson.
 */
export function warningTone(strength: WarningStrength | undefined): { solid: string; tint: string; onTint: string } {
  if (strength === 'strong') return semantic.error
  if (strength === 'mild') return semantic.warning
  return { solid: neutral.mist, tint: neutral.sunken, onTint: neutral.slate }
}

export const KIND_LABELS = { beforeProcedure: 'Before procedure', afterProcedure: 'After procedure' } as const
export const STRENGTH_LABELS = { mild: 'Mild', strong: 'Strong' } as const
