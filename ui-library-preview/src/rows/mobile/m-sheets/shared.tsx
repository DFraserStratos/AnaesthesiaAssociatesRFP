import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { useDisplayStatus } from '@proto/shared'
import { useMobilePersona as useProtoPersona, useSeedPicks as useProtoSeedPicks } from '@proto/apps/demo/catalogue/mobile/persona'

/**
 * Small helpers shared by this slice's rows: the catalogue's "what a tap did"
 * line (mobile Said), the Missing line, the persona (read the same way as the
 * prototype catalogue's useMobilePersona) and a status Badge resolved from the
 * status master.
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

export interface Actor {
  who: string
  role: 'anaesthetist'
  source: 'anaesthetist'
  anaesthetistId: string
}

/** The Mobile persona, from the prototype catalogue's own hook (APP_CONFIG.mobile.persona). */
export function useMobilePersona(): { actor: Actor; anaesthetistId: string } {
  return useProtoPersona() as { actor: Actor; anaesthetistId: string }
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
const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: BadgeStatus }
}

/** One status chip as a Badge: a List kind keeps its variant; a status takes its master colour token. */
export function StatusBadge({ statusKey, label }: { statusKey: string; label?: string }) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return <Badge>Unknown status</Badge>
  const variant: BadgeStatus = LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : resolved.status!.colour
  return (
    <Badge variant={variant} data-status-key={statusKey}>
      {label ?? resolved.label}
    </Badge>
  )
}

/** A plain column with the prototype example's 10px gap. */
export function Col({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`tw:flex tw:flex-col tw:gap-2.5 ${className ?? ''}`}>{children}</div>
}
