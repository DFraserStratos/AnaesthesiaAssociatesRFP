import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PAIRING_LABELS, tierLabel } from '@proto/domain/pairingPreferences'

type PriorityTier = 1 | 2 | 3 | 4
const kindLabels = PAIRING_LABELS.kind as Record<'PREFERRED' | 'NOT_PREFERRED', string>

/** The prototype's small size (11/16, 0 7px), as a class on the default Badge anatomy. */
const SMALL = 'tw:px-[7px] tw:py-0 tw:text-[11px] tw:leading-4'
/** The pairing pills' size (11/16, 1px 8px). */
const PAIRING = 'tw:text-[11px] tw:leading-4'

/** shared/ui/Pill: neutral = Badge default, success = Badge success; `small` is a size class. */
export function Pill({ tone = 'neutral', size = 'default', children }: { tone?: 'neutral' | 'success'; size?: 'default' | 'small'; children: string }) {
  return (
    <Badge variant={tone === 'success' ? 'success' : 'default'} className={size === 'small' ? SMALL : undefined}>
      {children}
    </Badge>
  )
}

export function PillReplacement() {
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
      <Pill>Neutral</Pill>
      <Pill tone="success">Success</Pill>
      <Pill size="small">Small</Pill>
      <Pill tone="success" size="small">
        Small success
      </Pill>
    </div>
  )
}

/** MasterPills is a re-export of Pill: the replacement imports the Badge directly. */
export function MasterPillsReplacement() {
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
      <Badge>Insurer</Badge>
      <Badge>Hospital</Badge>
      <Badge variant="success">Active</Badge>
      <Badge>ACC</Badge>
      <Badge>Head</Badge>
    </div>
  )
}

export type PreferredLook = 'teal-tint' | 'success'

function counted(count: number | undefined, label: string) {
  return count === undefined ? label : `${count} ${label}`
}

export function PairingPillsReplacement({ preferredLook = 'teal-tint' }: { preferredLook?: PreferredLook }) {
  const preferred = (count?: number) => (
    <Badge
      variant={preferredLook === 'success' ? 'success' : 'default'}
      className={cn(PAIRING, preferredLook === 'teal-tint' && 'tw:bg-teal-tint tw:text-teal-pressed')}
    >
      {counted(count, kindLabels.PREFERRED)}
    </Badge>
  )
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
      {([1, 2, 3, 4] as PriorityTier[]).map((t) => (
        <Badge key={t} data-tier={t} className={PAIRING}>
          {tierLabel(t) as string}
        </Badge>
      ))}
      {preferred()}
      {preferred(2)}
      <Badge variant="outline" className={cn(PAIRING, 'tw:border-warning tw:text-warning-on-tint')}>
        {kindLabels.NOT_PREFERRED}
      </Badge>
    </div>
  )
}
