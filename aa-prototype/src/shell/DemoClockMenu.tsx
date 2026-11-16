import { useId } from 'react'
import { CalendarClock } from 'lucide-react'
import { useAppStore, useClockTimeLabel, useToday } from '../store'
import { demoClockShortcuts } from '../shared/demoClockShortcuts'
import { PopoverPanel, usePopover } from '../shared/ui'
import { neutral, radius } from '../theme/tokens'
import { longDay } from '../shared/format'

const triggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 10px',
  borderRadius: radius.ctl,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.08)',
  color: neutral.surface,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const shortcutStyle: React.CSSProperties = {
  minHeight: 38,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  padding: '8px 10px',
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.lineStrong}`,
  background: neutral.surface,
  color: neutral.ink,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
}

/**
 * Global presenter clock. It intentionally leaves the current route and
 * transient screen state alone: store subscribers update live around it.
 */
export function DemoClockMenu() {
  const { open, toggle, rootRef, panelId, triggerProps } = usePopover()
  const titleId = useId()
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const dateLabel = longDay(todayISO)
  const shortcuts = demoClockShortcuts(useAppStore, todayISO)

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        {...triggerProps}
        type="button"
        aria-label={`Demo clock, ${dateLabel} at ${timeLabel}`}
        onClick={toggle}
        style={triggerStyle}
      >
        <CalendarClock size={16} strokeWidth={2} aria-hidden />
        <span className="mono">{timeLabel}</span>
      </button>

      {open ? (
        <PopoverPanel id={panelId} placement="end" role="dialog" labelledBy={titleId} width="min(344px, calc(100vw - 24px))">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              aria-hidden
              style={{
                width: 34,
                height: 34,
                flex: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.ctl,
                background: neutral.sunken,
                color: neutral.slate,
              }}
            >
              <CalendarClock size={18} strokeWidth={2} />
            </span>
            <div
              id={titleId}
              aria-live="polite"
              style={{ minWidth: 0, fontSize: 14, lineHeight: 1.3, fontWeight: 600 }}
            >
              {dateLabel} · <span className="mono">{timeLabel}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={shortcut.run}
                  disabled={shortcut.disabled}
                  style={{
                    ...shortcutStyle,
                    ...(shortcut.id === 'procedure-day' ? { gridColumn: '1 / -1' } : {}),
                    ...(shortcut.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                  }}
                  onMouseEnter={(event) => {
                    if (!shortcut.disabled) event.currentTarget.style.background = neutral.sunken
                  }}
                  onMouseLeave={(event) => {
                    if (!shortcut.disabled) event.currentTarget.style.background = neutral.surface
                  }}
                >
                  <Icon size={15} strokeWidth={2.5} aria-hidden style={{ flex: 'none' }} />
                  <span>{shortcut.label}</span>
                </button>
              )
            })}
          </div>

          <p style={{ margin: '10px 0 0', color: neutral.mist, fontSize: 11.5, lineHeight: 1.4 }}>
            Updates apply immediately and keep this screen open.
          </p>
        </PopoverPanel>
      ) : null}
    </div>
  )
}
