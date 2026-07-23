import { neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { FeeResult } from '../../domain/billing'
import { useTickingValue } from './useTickingValue'

interface FeeSummaryPanelProps {
  fee: FeeResult
  isAdditional: boolean
}

/**
 * The dark ink summary panel (mockup screen 3): TOTAL UNITS and the live fee,
 * both rolling through the value-tick pattern with the green flash on change.
 * The label carries the applied rate; a Type 3 match (unitRate null) reads
 * FIXED CONTRACT PRICE. All figures come from the calculator's FeeResult —
 * this component only formats.
 */
export function FeeSummaryPanel({ fee, isAdditional }: FeeSummaryPanelProps) {
  const units = useTickingValue(fee.billableUnits)
  const total = useTickingValue(fee.total)

  const feeLabel =
    fee.unitRate === null ? 'FIXED CONTRACT PRICE' : `FEE @ $${fee.unitRate.toFixed(2)}/UNIT`

  return (
    <div
      style={{
        background: neutral.ink,
        borderRadius: radius.card,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {fee.lines.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {fee.lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                paddingBottom: 6,
                borderBottom: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line.description}
              </span>
              <span className="mono" style={{ flex: 'none' }}>${line.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
            TOTAL UNITS
          </span>
          <span className="mono" style={{ fontSize: 30, fontWeight: 700, color: neutral.surface }}>
            {Math.round(units.display)}
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
            {feeLabel}
          </span>
          <span
            style={{
              borderRadius: 8,
              padding: '2px 8px',
              marginRight: -8,
              transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`,
              background: total.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)',
            }}
          >
            <span className="mono" style={{ fontSize: 30, fontWeight: 700, color: neutral.surface }}>
              ${total.display.toFixed(2)}
            </span>
          </span>
        </span>
      </div>

      {fee.override !== null && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
          Override applied · was ${fee.override.before.toFixed(2)}
        </div>
      )}
      {isAdditional && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>Time units only</div>
      )}
    </div>
  )
}
