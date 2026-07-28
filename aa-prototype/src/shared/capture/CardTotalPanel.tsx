import { neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { CardTotalProps } from '../surface'
import { useTickingValue } from './useTickingValue'

/**
 * The desktop Card-total panel: everything about what the Card comes to.
 * `WebCardLayout` pins it above a separate, matching-width completion control,
 * mirroring the phone dock's visual separation.
 *
 * In Fee mode this is the only money summary on the desktop, so it carries the
 * applied rate, line breakdown and override note. Units mode reduces the same
 * ink object to one compact ticking count. A per-procedure panel here would
 * duplicate the common one-procedure total. `CardTotalStrip` is the phone's
 * compact shape of the same display.
 *
 * The rail has room to stack a row per line, so it uses `lines` whichever kind
 * they are and ignores `linesArePerProcedure` — the label carries the meaning
 * either way. Only the phone, which chips them, has to know the difference.
 *
 * It shares the strip's value-tick and green flash, so one modifier tap reads as
 * one movement on either surface. Figures come from the Phase 01 calculator via
 * `cardFee` / `procedureFee` — this only formats.
 */
export function CardTotalPanel({ displayMode, units, fee, lines, rateLabel, overrideNote, action }: CardTotalProps) {
  const u = useTickingValue(units)
  const f = useTickingValue(fee)
  const showFee = displayMode === 'fee'

  return (
    <div
      data-testid="card-calculation"
      data-calculation-mode={displayMode}
      style={{
        background: neutral.ink,
        borderRadius: radius.card,
        padding: showFee ? 16 : '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: showFee ? 12 : 0,
      }}
    >
      {showFee && lines.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                paddingBottom: 6,
                borderBottom: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.label}</span>
                {line.note !== undefined && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{line.note}</span>
                )}
              </span>
              <span className="mono" style={{ flex: 'none' }}>${line.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: showFee ? 'flex-end' : 'center', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            flexDirection: showFee ? 'column' : 'row',
            alignItems: showFee ? 'stretch' : 'baseline',
            gap: showFee ? 4 : 12,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
            {showFee ? 'CARD TOTAL' : 'CARD UNITS'}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: neutral.surface }}>
              {Math.round(u.display)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>units</span>
          </span>
        </span>

        {showFee ? (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 0 }}>
            {rateLabel !== null && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.55)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rateLabel}
              </span>
            )}
            <span
              style={{
                borderRadius: 8,
                padding: '2px 8px',
                marginRight: -8,
                transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`,
                background: f.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)',
              }}
            >
              <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: neutral.surface }}>
                ${f.display.toFixed(2)}
              </span>
            </span>
          </span>
        ) : null}
      </div>

      {showFee && overrideNote !== null && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: -4 }}>
          {overrideNote}
        </div>
      )}

      {action !== undefined && action !== null && action}
    </div>
  )
}
