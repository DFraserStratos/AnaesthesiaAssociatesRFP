import { neutral } from '../../theme/tokens'
import { SuccessOverlay } from '../ui/SuccessOverlay'

interface CompletionOverlayProps {
  /** CARD totals (all procedures summed), not a single procedure's. */
  units: number
  fee: number
  mode: 'off' | 'units' | 'fee'
}

/**
 * The completion moment (mockup screen 3): white blur flood, the success
 * circle pops (`aa-circle-pop`) and the tick draws (dasharray 34). Its
 * calculation line follows the global anaesthetist display: none, units, or
 * units plus fee. The screen owns the ~1050 ms auto-dismiss.
 */
export function CompletionOverlay({ units, fee, mode }: CompletionOverlayProps) {
  const calculation =
    mode === 'off'
      ? null
      : mode === 'units'
        ? `${units} ${units === 1 ? 'unit' : 'units'}`
        : `${units} ${units === 1 ? 'unit' : 'units'} · $${fee.toFixed(2)}`

  return (
    <SuccessOverlay title="Card complete" testId="completion-overlay">
      {calculation !== null ? (
        <div className="mono" style={{ fontSize: 14, color: neutral.slate }}>
          {calculation}
        </div>
      ) : null}
    </SuccessOverlay>
  )
}
