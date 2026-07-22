/**
 * The six status colours (Design Language §02), transcribed 1:1.
 *
 * Identical across all three apps. Colour is NEVER the only signal — every
 * block carries its label (PROGRESS conventions 10 & 17). Two blocks get a
 * non-solid treatment: Unavailable is hatched, Free is dashed.
 *
 * This is the single source of the status legend (PROGRESS convention 10):
 * every app reads from here.
 */

export type StatusKey =
  | 'private'
  | 'public'
  | 'preop'
  | 'holiday'
  | 'unavailable'
  | 'free'

export type StatusTreatment = 'solid' | 'hatched' | 'dashed'

export interface StatusColour {
  key: StatusKey
  /** Short label used on chips (matches the Design Language chip anatomy). */
  label: string
  /** Full status name (used in headers / long-form contexts). */
  longLabel: string
  /** Solid colour — the dot, the left bar, the solid header. */
  solid: string
  /** Tint — chip and block background. */
  tint: string
  /** On-tint — text/foreground colour when sitting on the tint. */
  onTint: string
  /** Block fill treatment (Design Language §02). */
  treatment: StatusTreatment
}

/** Stable display order used by the legend and day grids. */
export const STATUS_ORDER: readonly StatusKey[] = [
  'private',
  'public',
  'preop',
  'holiday',
  'unavailable',
  'free',
] as const

export const statusColours: Record<StatusKey, StatusColour> = {
  private: {
    key: 'private',
    label: 'Private',
    longLabel: 'Private',
    solid: '#2E66E5',
    tint: '#E8EEFC',
    onTint: '#1F44A3',
    treatment: 'solid',
  },
  public: {
    key: 'public',
    label: 'Public',
    longLabel: 'Public',
    solid: '#6E56CF',
    tint: '#EEEBFA',
    onTint: '#4C3D96',
    treatment: 'solid',
  },
  preop: {
    key: 'preop',
    label: 'Pre-op',
    longLabel: 'Pre-op Assessment',
    solid: '#C26A0E',
    tint: '#FBEFDF',
    onTint: '#8A4B09',
    treatment: 'solid',
  },
  holiday: {
    key: 'holiday',
    label: 'Holiday',
    longLabel: 'Holiday',
    solid: '#D25C74',
    tint: '#FAE9ED',
    onTint: '#A03A52',
    treatment: 'solid',
  },
  unavailable: {
    key: 'unavailable',
    label: 'Unavailable',
    longLabel: 'Unavailable',
    solid: '#64716C',
    tint: '#ECEFEE',
    onTint: '#4A5551',
    treatment: 'hatched',
  },
  free: {
    key: 'free',
    label: 'Free',
    longLabel: 'Free',
    solid: '#1FA463',
    tint: '#E3F6EC',
    onTint: '#157A49',
    treatment: 'dashed',
  },
}

/**
 * Fill treatments (Design Language §02). Solid statuses use their `tint` as a
 * plain background; these two are drawn specially and must stay distinct from
 * the neutrals.
 */

/** Unavailable block background — hatched over the tint. */
export const unavailableHatchTint =
  'repeating-linear-gradient(135deg, #ECEFEE 0 5px, #E2E7E5 5px 10px)'

/** Unavailable solid header — hatched over the solid. */
export const unavailableHatchSolid =
  'repeating-linear-gradient(135deg, #64716C 0 7px, #596560 7px 14px)'

/** Free blocks use a dashed border rather than a coloured fill. */
export const freeDashedBorder = '1.5px dashed #1FA463'

/** Resolve a status by key. */
export function getStatus(key: StatusKey): StatusColour {
  return statusColours[key]
}
