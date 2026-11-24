import { useId } from 'react'
import { RotateCcw } from 'lucide-react'
import { resetFramedDemo } from './framedReset'
import { PopoverPanel, usePopover } from '../shared/ui'
import { accent, neutral, radius, semantic } from '../theme/tokens'

/**
 * Global recovery control for the demo harness. Resetting replaces the domain
 * data and clock with the deterministic seed while preserving shell choices
 * (the current app).
 */
export function DemoResetButton() {
  const { open: confirming, setOpen: setConfirming, toggle, closeToTrigger, rootRef, triggerRef, panelId, triggerProps } = usePopover()
  const titleId = useId()

  function confirmReset() {
    resetFramedDemo()
    setConfirming(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        {...triggerProps}
        type="button"
        aria-label="Reset demo data"
        onClick={toggle}
        style={{
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
        }}
      >
        <RotateCcw size={16} strokeWidth={2} aria-hidden />
        <span>Reset</span>
      </button>

      {confirming ? (
        <PopoverPanel id={panelId} placement="end" role="dialog" labelledBy={titleId} width="min(320px, calc(100vw - 24px))">
          <div id={titleId} style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 700 }}>
            Reset all demo data?
          </div>
          <p style={{ margin: '6px 0 12px', color: neutral.slate, fontSize: 12, lineHeight: 1.45 }}>
            This restores the pristine seed and returns the demo clock to Tuesday 24 November 2026, 8:00.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={confirmReset}
              style={{
                minHeight: 36,
                padding: '0 12px',
                border: `1px solid ${accent.base}`,
                borderRadius: radius.ctl,
                background: accent.base,
                color: neutral.surface,
                font: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Confirm reset
            </button>
            <button
              type="button"
              onClick={closeToTrigger}
              style={{
                minHeight: 36,
                padding: '0 12px',
                border: `1px solid ${neutral.lineStrong}`,
                borderRadius: radius.ctl,
                background: neutral.surface,
                color: neutral.ink,
                font: 'inherit',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
          <p style={{ margin: '10px 0 0', color: semantic.warning.onTint, fontSize: 11.5, lineHeight: 1.4 }}>
            Your current app and display choices are preserved.
          </p>
        </PopoverPanel>
      ) : null}
    </div>
  )
}
