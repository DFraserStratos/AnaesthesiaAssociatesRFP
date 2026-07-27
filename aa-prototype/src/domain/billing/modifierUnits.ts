/**
 * Modifier units (M) — sums the selected modifier codes' units, refusing any
 * the base code absorbs (e.g. a base that includes positioning absorbs P1) and
 * any that collides with an already-counted code in the same BAND (one code
 * per band; see `modifierBandOf`). Refusals are returned with a reason so the
 * UI can show WHY a chip is zeroed (messages render verbatim).
 *
 * The band check is a BACKSTOP: the picker swaps siblings on tap, so a user
 * cannot reach a collision. It exists so data that bypassed the picker
 * (persisted pre-fix state, a future integration, the seed) can never
 * double-count. First code in the array wins, which is deterministic and
 * preserves the precedence `fee.ts` already has (it appends the procedure's
 * ASA class only when the selection does not already carry it).
 */

import type { RvgCode } from '../types'
import { getModifierCode, modifierBandLabel, modifierBandOf } from './modifierCodes'

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
  /**
   * band key -> the code that claimed it. The FIRST code seen for a band wins
   * it, whether or not the base then absorbs it, so the rule states in one
   * sentence and an absorbed code can never hand its band to a sibling.
   */
  const bandTaken = new Map<string, string>()

  for (const code of selectedCodes) {
    const modifier = getModifierCode(code)
    if (modifier === undefined) {
      refused.push({ code, reason: `Unknown modifier code ${code}.` })
      continue
    }
    const band = modifierBandOf(code)
    const taken = band !== undefined ? bandTaken.get(band) : undefined
    if (band !== undefined && taken !== undefined) {
      refused.push({
        code,
        reason: `${code} is not added: ${taken} already covers the ${modifierBandLabel(band)} · only one applies per procedure.`,
      })
      continue
    }
    if (band !== undefined) bandTaken.set(band, code)
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
