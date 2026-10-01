import { DemoBadge } from '../DemoBadge'
import type { DemoTrigger } from './types'

/** A demo trigger's own badge, the same on the bar, the PWA sheet and the Control Panel index. */
export function DemoTriggerBadge({ badge }: { badge: DemoTrigger['badge'] }) {
  if (badge === 'future-scope') return <DemoBadge tone="future" style={{ padding: '2px 8px', fontSize: 10 }} />
  if (badge === 'office-stand-in') return <DemoBadge label="Office stand-in" style={{ padding: '2px 8px', fontSize: 10 }} />
  return null
}
