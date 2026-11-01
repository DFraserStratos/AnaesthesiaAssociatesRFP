import type { HolderKind } from '../data/types'
import { neutral } from './tokens'

/**
 * Quiet colour per kind of contract holder, borrowed from the design language's
 * status hues (Design Language §01) at their tint strength: a tinted group
 * header with a coloured edge, and a small dot on rows and filled fields.
 * Default stays neutral; teal is never used here, it is the action colour.
 */
export const KIND: Record<HolderKind, { label: string; solid: string; tint: string; onTint: string }> = {
  aa: { label: 'Default', solid: neutral.slate, tint: neutral.sunken, onTint: neutral.ink },
  hospital: { label: 'Hospital', solid: '#2E66E5', tint: '#EEF2FD', onTint: '#1F44A3' },
  insurer: { label: 'Insurer', solid: '#D25C74', tint: '#FBEEF1', onTint: '#A03A52' },
  surgeon: { label: 'Surgeon', solid: '#C26A0E', tint: '#FCF3E7', onTint: '#8A4B09' },
  anaesthetist: { label: 'Anaesthetist', solid: '#1FA463', tint: '#E9F7EF', onTint: '#157A49' },
}
