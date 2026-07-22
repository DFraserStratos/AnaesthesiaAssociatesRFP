import { neutral, semantic } from '../../../theme/tokens'
import { motion } from '../../../theme/motion'

interface CompletionOverlayProps {
  /** CARD totals (all procedures summed), not a single procedure's. */
  units: number
  fee: number
}

/**
 * The completion moment (mockup screen 3): white blur flood, the success
 * circle pops (`aa-circle-pop`), the tick draws (dasharray 34), the CARD's
 * units and fee confirm in mono. The screen owns the ~1050 ms auto-dismiss.
 */
export function CompletionOverlay({ units, fee }: CompletionOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        animation: 'aa-fade-in 200ms ease-out',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 99,
          background: semantic.success.tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `aa-circle-pop 420ms ${motion.completeTick.easing}`,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 38 38" aria-hidden>
          <path
            d="M8 20 L16 28 L30 11"
            fill="none"
            stroke={semantic.success.solid}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="34"
            strokeDashoffset="34"
            style={{
              animation: `aa-tick-draw ${motion.completeTick.drawDuration}ms ${motion.completeTick.easing} ${motion.completeTick.drawDelay}ms forwards`,
            }}
          />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: semantic.success.onTint }}>Card complete</div>
      <div className="mono" style={{ fontSize: 14, color: neutral.slate }}>
        {units} {units === 1 ? 'unit' : 'units'} · ${fee.toFixed(2)}
      </div>
    </div>
  )
}
