import type { CSSProperties, ReactNode } from 'react'
import { useMobilePersona as useProtoPersona, useSeedPicks as useProtoSeedPicks } from '@proto/apps/demo/catalogue/mobile/persona'

/**
 * Helpers shared by this slice's rows: the catalogue's "what a tap did" line,
 * the full-stage Bleed, the persona and seed picks (read exactly as the
 * prototype catalogue reads them), the motion timings from theme/motion.ts,
 * and the status token mapping (resolveDisplayStatus result to a theme token).
 */

/** The dashed line a stubbed handler writes, so a tap visibly does something (mobile `Said`). */
export function Said({ line }: { line: string | null }) {
  if (line === null) return null
  return (
    <div
      role="status"
      className="tw:mt-2.5 tw:rounded-ctl tw:border tw:border-dashed tw:border-line-strong tw:bg-surface tw:px-2.5 tw:py-1.5 tw:text-[12.5px] tw:leading-[18px] tw:text-slate"
    >
      {line}
    </div>
  )
}

export function Missing({ what }: { what: string }) {
  return <div className="tw:text-[13px] tw:text-mist">No seeded {what} for this persona.</div>
}

/**
 * Fills the whole phone stage (escaping its padding), as a phone screen does. It zeroes the
 * bottom inset as the prototype's catalogue stage does, so docks and tab bars sit at the same
 * height as the current example (they read `--aa-inset-bottom`, which the replacement stage lacks).
 */
export function Bleed({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`tw:absolute tw:inset-0 tw:flex tw:flex-col ${className ?? ''}`} style={{ '--aa-inset-bottom': '0px', ...style } as CSSProperties}>
      {children}
    </div>
  )
}

export interface Actor {
  who: string
  role: 'anaesthetist'
  source: 'anaesthetist'
  anaesthetistId: string
}

export interface Persona {
  actor: Actor
  anaesthetistId: string
  personaName: string
  initials: string
}

/** The Mobile persona, from the prototype catalogue's own hook (APP_CONFIG.mobile.persona). */
export function useMobilePersona(): Persona {
  return useProtoPersona() as Persona
}

export interface SeedPicks {
  ownListIds: string[]
  listId: string | null
  bookingId: string | null
  procedureId: string | null
}

/** The seeded picks, taken once, exactly as the current example takes them. */
export function useSeedPicks(anaesthetistId: string): SeedPicks {
  return useProtoSeedPicks(anaesthetistId) as SeedPicks
}

// ---------------------------------------------------------------------------
// Motion timings (aa-prototype theme/motion.ts), in seconds for Motion
// ---------------------------------------------------------------------------

export const EASE_TICK = [0.65, 0, 0.35, 1] as const
export const EASE_CARD = [0.2, 0.8, 0.2, 1] as const
export const T = {
  drawDuration: 0.36,
  drawDelay: 0.06,
  pulse: 0.42,
  cardIn: 0.26,
  cardReturn: 0.24,
  reduced: 0.08,
  valueStep: 0.16,
  tintDecay: 0.24,
} as const

// ---------------------------------------------------------------------------
// Status tokens: a resolved display status to the theme's six tokens
// ---------------------------------------------------------------------------

export type StatusToken = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
export type StatusTreatment = 'solid' | 'hatched' | 'dashed'

/** The fields of the prototype's `resolveDisplayStatus()` result this slice reads. */
export interface ResolvedStatus {
  key: string
  label: string
  longLabel: string
  known: boolean
  status?: { colour: StatusToken; treatment: StatusTreatment }
}

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

export function tokenOf(resolved: ResolvedStatus): { token: StatusToken; treatment: StatusTreatment } {
  if (LIST_KINDS.includes(resolved.key)) return { token: resolved.key as StatusToken, treatment: 'solid' }
  if (resolved.status !== undefined) return { token: resolved.status.colour, treatment: resolved.status.treatment }
  return { token: 'unavailable', treatment: 'solid' }
}

/** Static class names per token so Tailwind sees every utility. */
export const TINT_BG: Record<StatusToken, string> = {
  private: 'tw:bg-status-private-tint',
  public: 'tw:bg-status-public-tint',
  preop: 'tw:bg-status-preop-tint',
  holiday: 'tw:bg-status-holiday-tint',
  unavailable: 'tw:bg-status-unavailable-tint',
  free: 'tw:bg-status-free-tint',
}

export const SOLID_BG: Record<StatusToken, string> = {
  private: 'tw:bg-status-private',
  public: 'tw:bg-status-public',
  preop: 'tw:bg-status-preop',
  holiday: 'tw:bg-status-holiday',
  unavailable: 'tw:bg-status-unavailable',
  free: 'tw:bg-status-free',
}

export const ON_TINT: Record<StatusToken, string> = {
  private: 'tw:text-status-private-on-tint',
  public: 'tw:text-status-public-on-tint',
  preop: 'tw:text-status-preop-on-tint',
  holiday: 'tw:text-status-holiday-on-tint',
  unavailable: 'tw:text-status-unavailable-on-tint',
  free: 'tw:text-status-free-on-tint',
}

/** The tint background of a token, with the hatch over it for a hatched status. */
export function tintStyle(token: StatusToken, treatment: StatusTreatment): CSSProperties {
  if (treatment === 'hatched') return { background: `repeating-linear-gradient(135deg, var(--status-${token}-tint) 0 5px, var(--aa-line) 5px 10px)` }
  return { background: `var(--status-${token}-tint)` }
}

/**
 * The block fill (the prototype's `blockFill()`), from theme variables only: solid and hatched
 * take the tint body (hatched over it) with a 3px left bar in the solid; dashed a 1.5px dashed
 * outline on the tint, no bar.
 */
export function blockFillStyle(token: StatusToken, treatment: StatusTreatment): CSSProperties {
  const solid = `var(--status-${token})`
  if (treatment === 'dashed') return { ...tintStyle(token, treatment), border: `1.5px dashed ${solid}` }
  return { ...tintStyle(token, treatment), borderLeft: `3px solid ${solid}` }
}
