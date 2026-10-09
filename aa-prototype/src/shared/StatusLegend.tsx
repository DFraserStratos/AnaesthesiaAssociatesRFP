import { useMemo } from 'react'
import { LIST_KINDS, type DisplayKey } from '../domain/types'
import { SEED_STATUS } from '../domain/slotStatus'
import { StatusChip } from './StatusChip'
import { StatusBlock } from './StatusBlock'
import { useSlotStatusRecords, useSlotStatuses, resolveDisplayStatus } from './status/useSlotStatuses'

interface StatusLegendProps {
  /**
   * `full` (default): each status shows its chip beside a sample block, so the
   * hatched and dashed treatments are visible.
   * `chips`: a compact row of chips (for toolbars / day grids).
   */
  variant?: 'full' | 'chips'
  /** Only the List types, or only the availability statuses (default: both). */
  only?: 'lists' | 'statuses'
  /** Makes the compact legend an interactive status filter. */
  activeStatuses?: ReadonlySet<DisplayKey>
  onToggleStatus?: (status: DisplayKey) => void
}

/** Design-Language sample text for the six seeded keys (the §02 blocks); any other status uses its own words. */
const SAMPLE: Record<string, { title: string; detail: string }> = {
  private: { title: "St George's", detail: 'Mr Hale · Ortho' },
  public: { title: 'Chch Public', detail: 'Acute list' },
  preop: { title: 'Pre-op clinic', detail: '6 appts' },
  [SEED_STATUS.holiday]: { title: 'Annual leave', detail: 'Back Mon 27' },
  [SEED_STATUS.unavailable]: { title: 'Not available', detail: 'All day' },
  [SEED_STATUS.free]: { title: 'Free to book', detail: 'Tap to assign' },
}

/**
 * The legend's keys: the three List types, then the active availability
 * statuses in their order, with the default (Free) closing the legend as the
 * Design Language legend does.
 */
export function useLegendKeys(only?: 'lists' | 'statuses'): DisplayKey[] {
  const statuses = useSlotStatuses()
  return useMemo(() => {
    const ordered = [...statuses.filter((s) => s.isDefault !== true), ...statuses.filter((s) => s.isDefault === true)]
    return [...(only === 'statuses' ? [] : LIST_KINDS), ...(only === 'lists' ? [] : ordered.map((s) => s.key))]
  }, [only, statuses])
}

/**
 * The status legend: the List types, then the availability statuses from the
 * status master (catch-up Phase 29; convention 10 amended). A renamed,
 * recoloured or added status appears here at once; a retired one leaves it.
 * It never holds a List's state.
 */
export function StatusLegend({ variant = 'full', only, activeStatuses, onToggleStatus }: StatusLegendProps) {
  const keys = useLegendKeys(only)
  const records = useSlotStatusRecords()

  if (variant === 'chips') {
    return (
      <div
        role={onToggleStatus !== undefined ? 'group' : undefined}
        aria-label={onToggleStatus !== undefined ? 'Status filters' : undefined}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {keys.map((key) => {
          const active = activeStatuses?.has(key) ?? true
          if (onToggleStatus === undefined) return <StatusChip key={key} status={key} />
          const label = resolveDisplayStatus(key, records).label
          return (
            <button
              key={key}
              type="button"
              className="aa-filter-toggle"
              aria-label={`${label} status`}
              aria-pressed={active}
              title={`${active ? 'Hide' : 'Show'} ${label.toLowerCase()} sessions`}
              onClick={() => onToggleStatus(key)}
              style={{
                border: 0,
                borderRadius: 999,
                padding: 0,
                background: 'transparent',
                cursor: 'pointer',
                opacity: active ? 1 : 0.42,
                filter: active ? 'none' : 'grayscale(0.7)',
              }}
            >
              <StatusChip status={key} />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {keys.map((key) => {
        const resolved = resolveDisplayStatus(key, records)
        const sample = SAMPLE[key] ?? { title: resolved.longLabel, detail: resolved.description ?? '' }
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }} title={resolved.longLabel}>
            <StatusChip status={key} style={{ flex: 'none' }} />
            <StatusBlock status={key} title={sample.title} detail={sample.detail} style={{ flex: 1, minWidth: 0 }} />
          </div>
        )
      })}
    </div>
  )
}
