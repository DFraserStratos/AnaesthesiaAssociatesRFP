/**
 * Modifier units (M) — sums the selected modifier codes' units, refusing any
 * the base code absorbs (e.g. a base that includes positioning absorbs P1).
 * Refusals are returned with a reason so the UI can show WHY a chip is zeroed
 * (messages render verbatim).
 */

import type { RvgCode } from '../types'
import { getModifierCode } from './modifierCodes'

export interface RefusedModifier {
  code: string
  reason: string
}

export interface ModifierUnitsResult {
  units: number
  refused: RefusedModifier[]
}

export function modifierUnits(
  selectedCodes: readonly string[],
  baseCode?: RvgCode,
): ModifierUnitsResult {
  let units = 0
  const refused: RefusedModifier[] = []

  for (const code of selectedCodes) {
    const modifier = getModifierCode(code)
    if (modifier === undefined) {
      refused.push({ code, reason: `Unknown modifier code ${code}.` })
      continue
    }
    if (baseCode !== undefined && baseCode.absorbsModifierCodes.includes(code)) {
      refused.push({
        code,
        reason: `Base code ${baseCode.code} already includes ${code}; its units are not added.`,
      })
      continue
    }
    units += modifier.units
  }

  return { units, refused }
}
