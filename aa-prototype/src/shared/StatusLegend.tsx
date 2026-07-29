import { STATUS_ORDER, statusColours, type StatusKey } from '../theme/statusColours'
import { StatusChip } from './StatusChip'
import { StatusBlock } from './StatusBlock'

interface StatusLegendProps {
  /**
   * `full` (default): each status shows its chip beside a sample block, so the
   * hatched Unavailable and dashed Free treatments are visible.
   * `chips`: a compact row of just the six chips (for toolbars / day grids).
   */
  variant?: 'full' | 'chips'
  /** Makes the compact legend an interactive status filter. */
  activeStatuses?: ReadonlySet<StatusKey>
  onToggleStatus?: (status: StatusKey) => void
}

/** Design-Language sample text per status (matches the §02 blocks). */
const SAMPLE: Record<StatusKey, { title: string; detail: string }> = {
  private: { title: "St George's", detail: 'Mr Hale · Ortho' },
  public: { title: 'Chch Public', detail: 'Acute list' },
  preop: { title: 'Pre-op clinic', detail: '6 appts' },
  holiday: { title: 'Annual leave', detail: 'Back Mon 27' },
  unavailable: { title: 'Not available', detail: 'All day' },
  free: { title: 'Free to book', detail: 'Tap to assign' },
}

/**
 * The status legend — all six statuses, in a stable order, reading from the
 * single source in `theme/statusColours.ts` (PROGRESS convention 10). Used by
 * the Phase-00 demo home and, later, the day grids.
 */
export function StatusLegend({ variant = 'full', activeStatuses, onToggleStatus }: StatusLegendProps) {
  if (variant === 'chips') {
    return (
      <div
        role={onToggleStatus !== undefined ? 'group' : undefined}
        aria-label={onToggleStatus !== undefined ? 'List status filters' : undefined}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {STATUS_ORDER.map((key) => {
          const active = activeStatuses?.has(key) ?? true
          if (onToggleStatus === undefined) return <StatusChip key={key} status={key} />

          return (
            <button
              key={key}
              type="button"
              className="aa-filter-toggle"
              aria-label={`${statusColours[key].label} status`}
              aria-pressed={active}
              title={`${active ? 'Hide' : 'Show'} ${statusColours[key].label.toLowerCase()} lists`}
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
      {STATUS_ORDER.map((key) => {
        const sample = SAMPLE[key]
        return (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
            title={statusColours[key].longLabel}
          >
            <StatusChip status={key} style={{ flex: 'none' }} />
            <StatusBlock
              status={key}
              title={sample.title}
              detail={sample.detail}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
        )
      })}
    </div>
  )
}
