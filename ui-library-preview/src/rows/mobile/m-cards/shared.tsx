import type { ReactNode } from 'react'
import { useMobilePersona as useProtoPersona, useSeedPicks as useProtoSeedPicks } from '@proto/apps/demo/catalogue/mobile/persona'

/**
 * Helpers shared by this slice's rows: the catalogue's "what a tap did" line
 * (mobile Said), the Missing line, the persona and seeded picks read exactly as
 * the prototype catalogue reads them, and the 10px column / 8px row the
 * examples lay out with.
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

/** A muted explanatory line (the examples' 12.5 or 13px mist text). */
export function Hint({ children }: { children: ReactNode }) {
  return <div className="tw:text-[12.5px] tw:leading-[18px] tw:text-mist">{children}</div>
}

/** The examples' column: 10px gap. */
export function Col({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`tw:flex tw:flex-col tw:gap-2.5 ${className ?? ''}`}>{children}</div>
}

/** The examples' wrapping row: 8px gap, centred. */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`tw:flex tw:flex-wrap tw:items-center tw:gap-2 ${className ?? ''}`}>{children}</div>
}

export interface Actor {
  who: string
  role: 'anaesthetist'
  source: 'anaesthetist'
  anaesthetistId: string
}

export interface MobilePersona {
  actor: Actor
  anaesthetistId: string
  personaName: string
  initials: string
}

/** The Mobile persona, from the prototype catalogue's own hook (APP_CONFIG.mobile.persona). */
export function useMobilePersona(): MobilePersona {
  return useProtoPersona() as MobilePersona
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

export type BadgeStatus = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'
