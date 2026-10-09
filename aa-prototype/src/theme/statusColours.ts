/**
 * The six status colour tokens (Design Language §02), transcribed 1:1, and the
 * way a status or a List kind resolves to them.
 *
 * Catch-up Phase 29 (US-01.2.2, OQ-64; convention 10 amended): the PALETTE is
 * still fixed here, the six Design Language tokens with their exact hexes, but
 * the list of availability statuses is user-maintained master data
 * (`masters.slotStatuses`). A status record names a token and a treatment; a
 * List kind maps to its own token (`LIST_KIND_VISUAL`). Colour is NEVER the
 * only signal: every chip and block carries its label (conventions 10 and 17).
 * The hatched (Unavailable) and dashed (Free) treatments generalise with
 * tokens only: no new hex.
 */

import { neutral } from './tokens'
import type { ListKind, StatusColourToken, StatusTreatment } from '../domain/types'

export type { StatusColourToken, StatusTreatment } from '../domain/types'

export interface PaletteEntry {
  /** Solid colour: the dot, the left bar, the solid header. */
  solid: string
  /** Tint: chip and block background. */
  tint: string
  /** On-tint: text and foreground on the tint. */
  onTint: string
}

/** The design's six status tokens (Design Language §02), keyed by token name. */
export const STATUS_PALETTE: Record<StatusColourToken, PaletteEntry> = {
  private: { solid: '#2E66E5', tint: '#E8EEFC', onTint: '#1F44A3' },
  public: { solid: '#6E56CF', tint: '#EEEBFA', onTint: '#4C3D96' },
  preop: { solid: '#C26A0E', tint: '#FBEFDF', onTint: '#8A4B09' },
  holiday: { solid: '#D25C74', tint: '#FAE9ED', onTint: '#A03A52' },
  unavailable: { solid: '#64716C', tint: '#ECEFEE', onTint: '#4A5551' },
  free: { solid: '#1FA463', tint: '#E3F6EC', onTint: '#157A49' },
}

/**
 * The stripe of a hatched SOLID header (Design Language §02 draws it for the
 * grey token only). Other tokens stripe with their own on-tint, an existing
 * value, so no new hex appears.
 */
const HATCH_SOLID_STRIPE: Partial<Record<StatusColourToken, string>> = { unavailable: '#596560' }

/**
 * The edge of a closed-status row's tinted body (the mobile Forward Lists'
 * holiday row has always had its own pink edge; other tokens use the neutral
 * line). One home for the special case, so screens never compare tokens.
 */
const CLOSED_ROW_EDGE: Partial<Record<StatusColourToken, string>> = { holiday: '#F2D5DC' }

export interface StatusVisual extends PaletteEntry {
  /** The edge of a tinted closed-status row. */
  rowEdge: string
  treatment: StatusTreatment
  /** Block background: the tint, or the hatch over the tint. */
  blockBackground: string
  /** Solid header background: the solid, or the hatch over the solid. */
  solidBackground: string
  /** Block border: the dashed outline for a dashed status, else none. */
  border?: string
  /** Left bar colour (absent for a dashed block, which shows its outline instead). */
  leftBar?: string
}

/**
 * Everything a chip, block or cell needs from a token and a treatment. For the
 * seeded statuses and every List this yields exactly today's strings: hatched
 * is the tint striped with `neutral.line`, dashed a 1.5px dashed border in the
 * token's solid.
 */
export function resolveStatusVisual(input: { colour: StatusColourToken; treatment: StatusTreatment }): StatusVisual {
  const p = { ...STATUS_PALETTE[input.colour], rowEdge: CLOSED_ROW_EDGE[input.colour] ?? neutral.line }
  if (input.treatment === 'hatched') {
    const stripe = HATCH_SOLID_STRIPE[input.colour] ?? p.onTint
    return {
      ...p,
      treatment: 'hatched',
      blockBackground: `repeating-linear-gradient(135deg, ${p.tint} 0 5px, ${neutral.line} 5px 10px)`,
      solidBackground: `repeating-linear-gradient(135deg, ${p.solid} 0 7px, ${stripe} 7px 14px)`,
      leftBar: p.solid,
    }
  }
  if (input.treatment === 'dashed') {
    return { ...p, treatment: 'dashed', blockBackground: p.tint, solidBackground: p.solid, border: `1.5px dashed ${p.solid}` }
  }
  return { ...p, treatment: 'solid', blockBackground: p.tint, solidBackground: p.solid, leftBar: p.solid }
}

/** Each List kind's fixed token: a List renders exactly as before. */
export const LIST_KIND_VISUAL: Record<ListKind, { colour: StatusColourToken; treatment: 'solid' }> = {
  private: { colour: 'private', treatment: 'solid' },
  public: { colour: 'public', treatment: 'solid' },
  preop: { colour: 'preop', treatment: 'solid' },
}
