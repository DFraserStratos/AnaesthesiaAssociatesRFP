import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { useDisplayStatus } from '@proto/shared'

/** The catalogue's quiet "what the last click did" line (basicExamples Echo), in theme utilities. */
export function Echo({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
      {children}
    </div>
  )
}

/** Lets a desktop-width component keep its own width inside the stage (the stage scrolls sideways), as `Wide` does. */
export function Wide({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  return (
    <div className="tw:overflow-x-auto">
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

export type BadgeStatus = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: BadgeStatus }
}

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

/** A status key's label and Badge variant, read from the status master (List kinds keep their own variant). */
export function useStatusBadge(statusKey: string): { label: string; variant: BadgeStatus | 'default' } {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return { label: 'Unknown status', variant: 'default' }
  return { label: resolved.label, variant: LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : resolved.status!.colour }
}

/** The StatusChip as a Badge (the pilot's mapping). */
export function StatusBadge({ statusKey, className }: { statusKey: string; className?: string }) {
  const { label, variant } = useStatusBadge(statusKey)
  return (
    <Badge variant={variant} data-status-key={statusKey} className={className}>
      {label}
    </Badge>
  )
}
