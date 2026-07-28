import { Calculator } from 'lucide-react'
import { useAppStore, type CardCalculationMode } from '../store'
import { neutral, radius } from '../theme/tokens'

const MODES: readonly { value: CardCalculationMode; label: string; description: string }[] = [
  { value: 'off', label: 'Off', description: 'Hide the Card calculation' },
  { value: 'units', label: 'Units', description: 'Show Card units only' },
  { value: 'fee', label: 'Fee', description: 'Show Card units and fee' },
]

/**
 * Global presenter preference for the anaesthetist Card calculation. The
 * control stays visible across apps so the next mobile or web Card opens in the
 * chosen mode; office Card details deliberately keep their full billing view.
 */
export function CardCalculationControl() {
  const mode = useAppStore((state) => state.shell.cardCalculationMode)
  const setMode = useAppStore((state) => state.setCardCalculationMode)

  return (
    <div
      role="group"
      aria-label="Anaesthetist Card calculation"
      style={{
        height: 34,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: 3,
        borderRadius: radius.ctl,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 24,
          height: 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.72)',
        }}
      >
        <Calculator size={15} strokeWidth={2} />
      </span>
      {MODES.map((option) => {
        const active = option.value === mode
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.description}
            aria-pressed={active}
            title={option.description}
            onClick={() => setMode(option.value)}
            style={{
              height: 26,
              minWidth: option.value === 'units' ? 46 : 36,
              padding: '0 8px',
              border: 'none',
              borderRadius: 7,
              background: active ? neutral.surface : 'transparent',
              color: active ? neutral.ink : 'rgba(255,255,255,0.72)',
              font: 'inherit',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
