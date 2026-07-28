import { useEffect, useId, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { resetDemo, useAppStore } from '../store'
import { accent, elevation, neutral, radius, semantic } from '../theme/tokens'

/**
 * Global recovery control for the demo harness. Resetting replaces the domain
 * data and clock with the deterministic seed while preserving shell choices,
 * including the current app and Card calculation display.
 */
export function DemoResetButton() {
  const [confirming, setConfirming] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const titleId = useId()

  useEffect(() => {
    if (!confirming) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setConfirming(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setConfirming(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirming])

  function confirmReset() {
    resetDemo(useAppStore)
    setConfirming(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Reset demo data"
        aria-expanded={confirming}
        aria-controls={panelId}
        onClick={() => setConfirming((value) => !value)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 34,
          padding: '0 10px',
          borderRadius: radius.ctl,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.08)',
          color: '#FFFFFF',
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
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 120,
            width: 'min(320px, calc(100vw - 24px))',
            padding: 14,
            background: neutral.surface,
            color: neutral.ink,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.card,
            boxShadow: elevation.e3,
          }}
        >
          <div id={titleId} style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 700 }}>
            Reset all demo data?
          </div>
          <p style={{ margin: '6px 0 12px', color: neutral.slate, fontSize: 12, lineHeight: 1.45 }}>
            This restores the pristine seed and returns the demo clock to Tuesday 21 July 2026, 8:00.
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
              onClick={() => {
                setConfirming(false)
                triggerRef.current?.focus()
              }}
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
        </div>
      ) : null}
    </div>
  )
}
