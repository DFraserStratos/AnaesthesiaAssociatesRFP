import { neutral } from '../../theme/tokens'
import { SuccessOverlay } from '../ui/SuccessOverlay'

interface CompletionOverlayProps {
  /** CARD totals (all procedures summed), not a single procedure's. */
  units: number
  fee: number
  mode: 'off' | 'units' | 'fee'
  /** Runs the owner's dismissal on a tap. See `SuccessOverlay`. */
  onDismiss?: () => void
}

/**
 * The completion moment (mockup screen 3): white blur flood, the success
 * circle pops (`aa-circle-pop`) and the tick draws (dasharray 34). Its
 * calculation line follows the global anaesthetist display: none, units, or
 * units plus fee. The screen owns the ~1050 ms auto-dismiss.
 *
 * `onDismiss` is the standalone-PWA safety valve: the same handler that timer
 * runs, reachable by tapping the flood, for the case where the timer is lost to
 * an unmount race and there is no reload to fall back on.
 */
export function CompletionOverlay({ units, fee, mode, onDismiss }: CompletionOverlayProps) {
  const calculation =
    mode === 'off'
      ? null
      : mode === 'units'
        ? `${units} ${units === 1 ? 'unit' : 'units'}`
        : `${units} ${units === 1 ? 'unit' : 'units'} · $${fee.toFixed(2)}`

  return (
    <SuccessOverlay title="Card complete" testId="completion-overlay" onDismiss={onDismiss}>
      {calculation !== null ? (
        <div className="mono" style={{ fontSize: 14, color: neutral.slate }}>
          {calculation}
        </div>
      ) : null}
    </SuccessOverlay>
  )
}
