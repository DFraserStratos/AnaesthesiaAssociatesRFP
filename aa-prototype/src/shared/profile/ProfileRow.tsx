import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { neutral } from '../../theme/tokens'
import { DefRow } from '../ui/DefRow'
import type { DataAttributes } from '../ui/Field'

/**
 * One row of the anaesthetist's own profile (catch-up Phase 26; US-12.1.4):
 * `DefRow` in its `settings` layout as it stands (label left in slate, mono
 * value right), not a second row component. `locked` puts the lock glyph in
 * `trailing` for a fact the office holds; `trailing` takes an action instead
 * (the rate's "Change"). Imports nothing from `apps/`, so the PWA's purity
 * test holds. Must sit inside a `DefList`.
 */
export function ProfileRow({
  label,
  children,
  locked = false,
  trailing,
  shot,
  ...data
}: {
  label: ReactNode
  children: ReactNode
  locked?: boolean
  trailing?: ReactNode
  shot?: string
} & DataAttributes) {
  const glyph = locked ? <Lock size={14} strokeWidth={2} color={neutral.mist} aria-label="Held by the AA office" role="img" style={{ flex: 'none' }} /> : undefined
  return (
    <DefRow {...data} layout="settings" label={label} shot={shot} trailing={trailing ?? glyph} valueStyle={{ overflowWrap: 'anywhere' }}>
      {children}
    </DefRow>
  )
}
