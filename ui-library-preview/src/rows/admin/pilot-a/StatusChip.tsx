import { Badge } from '@/components/ui/badge'
import { useDisplayStatus, useLegendKeys } from '@proto/shared'

type BadgeStatus = 'private' | 'public' | 'preop' | 'holiday' | 'unavailable' | 'free'

interface ResolvedStatus {
  label: string
  known: boolean
  status?: { colour: BadgeStatus }
}

/** The block treatments, optionally carried onto the chip (the kit keeps chips flat). */
const TREATMENT: Partial<Record<BadgeStatus, string>> = { unavailable: 'aa-status-hatched', free: 'aa-status-dashed' }

const LIST_KINDS: readonly string[] = ['private', 'public', 'preop']

/** One chip: a List kind keeps its own variant; an availability status takes its master colour token. */
function StatusBadge({ statusKey, treatments }: { statusKey: string; treatments: boolean }) {
  const resolved = useDisplayStatus(statusKey) as ResolvedStatus
  if (!resolved.known) return <Badge>Unknown status</Badge>
  const variant: BadgeStatus = LIST_KINDS.includes(statusKey) ? (statusKey as BadgeStatus) : resolved.status!.colour
  return (
    <Badge variant={variant} data-status-key={statusKey} className={treatments ? TREATMENT[variant] : undefined}>
      {resolved.label}
    </Badge>
  )
}

/** The same legend keys as the current example (List kinds, then the status master, Free last), read-only. */
export function StatusChipReplacement({ treatments = false }: { treatments?: boolean }) {
  const keys = useLegendKeys() as string[]
  return (
    <div className="tw:flex tw:flex-wrap tw:gap-2">
      {keys.map((k) => (
        <StatusBadge key={k} statusKey={k} treatments={treatments} />
      ))}
    </div>
  )
}
