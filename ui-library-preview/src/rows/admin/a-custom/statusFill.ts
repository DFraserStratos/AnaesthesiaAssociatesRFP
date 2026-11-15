import type { CSSProperties } from 'react'

/** The six Design Language tokens a status or List kind resolves to. */
export type StatusToken = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
export type StatusTreatment = 'solid' | 'hatched' | 'dashed'

/** The fields of the prototype's `resolveDisplayStatus()` result this slice reads. */
export interface ResolvedStatus {
  key: string
  label: string
  longLabel: string
  known: boolean
  /** A master status record (absent for a List kind). */
  status?: { colour: StatusToken; treatment: StatusTreatment }
}

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

/** The token and treatment behind a resolved key: a List kind is its own solid token. */
export function tokenOf(resolved: ResolvedStatus): { token: StatusToken; treatment: StatusTreatment } {
  if (LIST_KINDS.includes(resolved.key)) return { token: resolved.key as StatusToken, treatment: 'solid' }
  if (resolved.status !== undefined) return { token: resolved.status.colour, treatment: resolved.status.treatment }
  return { token: 'unavailable', treatment: 'solid' }
}

/** Static class names per token so Tailwind sees every utility (no string-built classes). */
export const TINT_BG: Record<StatusToken, string> = {
  private: 'tw:bg-status-private-tint',
  public: 'tw:bg-status-public-tint',
  preop: 'tw:bg-status-preop-tint',
  holiday: 'tw:bg-status-holiday-tint',
  unavailable: 'tw:bg-status-unavailable-tint',
  free: 'tw:bg-status-free-tint',
}

export const ON_TINT: Record<StatusToken, string> = {
  private: 'tw:text-status-private-on-tint',
  public: 'tw:text-status-public-on-tint',
  preop: 'tw:text-status-preop-on-tint',
  holiday: 'tw:text-status-holiday-on-tint',
  unavailable: 'tw:text-status-unavailable-on-tint',
  free: 'tw:text-status-free-on-tint',
}

/**
 * The block fill (Design Language §02, `blockFill()` in the prototype) from the
 * theme's CSS variables only: solid = tint body with the token's 3px left bar;
 * hatched = the hatch over the tint with the bar; dashed = a 1.5px dashed
 * outline in the token's solid, no bar. Any token can take any treatment, so
 * the hatch is built per token from its own tint and the line neutral, as
 * `resolveStatusVisual()` does; no hex appears here.
 */
export function blockFillStyle(token: StatusToken, treatment: StatusTreatment, bar: 'border' | 'inset' = 'border'): CSSProperties {
  const solid = `var(--status-${token})`
  if (treatment === 'dashed') return { border: `1.5px dashed ${solid}` }
  const leftBar: CSSProperties = bar === 'border' ? { borderLeft: `3px solid ${solid}` } : { boxShadow: `inset 3px 0 0 ${solid}` }
  if (treatment === 'hatched') {
    return { background: `repeating-linear-gradient(135deg, var(--status-${token}-tint) 0 5px, var(--aa-line) 5px 10px)`, ...leftBar }
  }
  return leftBar
}
