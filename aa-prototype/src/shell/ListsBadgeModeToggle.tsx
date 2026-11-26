import { neutral, radius } from '../theme/tokens'
import type { ListsBadgeMode } from '../apps/admin/screens/lists/listsCounts'
import { useListsBadgeMode } from './listsBadgeMode'

const OPTIONS: readonly { value: ListsBadgeMode; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'Count every List that needs something' },
  { value: 'urgent', label: 'Urgent', title: 'Count only Lists in the next 7 days, and anything earlier' },
]

/**
 * The harness bar's demo-only switch for the Lists badge (OQ-151): "Lists badge: All · Urgent", shown
 * only on the Lists section. Two buttons with `aria-pressed` in a labelled group, drawn for the ink bar
 * like the Reset button beside it.
 */
export function ListsBadgeModeToggle() {
  const mode = useListsBadgeMode((s) => s.mode)
  const setMode = useListsBadgeMode((s) => s.setMode)
  return (
    <div role="group" aria-label="Lists badge" data-shot="harness-lists-badge-mode" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>Lists badge</span>
      <span style={{ display: 'flex', padding: 2, gap: 2, borderRadius: radius.ctl, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)' }}>
        {OPTIONS.map((o) => {
          const on = mode === o.value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              title={o.title}
              data-lists-badge-mode={o.value}
              onClick={() => setMode(o.value)}
              style={{
                height: 26,
                padding: '0 10px',
                border: 'none',
                borderRadius: radius.ctl - 2,
                background: on ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: on ? neutral.surface : 'rgba(255,255,255,0.7)',
                font: 'inherit',
                fontSize: 12,
                fontWeight: on ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </span>
    </div>
  )
}
