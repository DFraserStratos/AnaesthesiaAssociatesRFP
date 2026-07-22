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
export function StatusLegend({ variant = 'full' }: StatusLegendProps) {
  if (variant === 'chips') {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUS_ORDER.map((key) => (
          <StatusChip key={key} status={key} />
        ))}
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
