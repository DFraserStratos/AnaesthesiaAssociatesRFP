import { neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { BookingTotalProps } from '../surface'
import { useTickingValue } from './useTickingValue'
import { NEEDS_PRICE_LABEL } from '../../domain/billing/priceRanges'
import { formatCurrency } from '../format'

/**
 * The desktop Booking-total panel: everything about what the Booking comes to.
 * `WebBookingLayout` pins it above a separate, matching-width completion control,
 * mirroring the phone dock's visual separation.
 *
 * It is the only money summary on the desktop, so it carries the applied rate,
 * line breakdown and override note. A per-procedure panel here would duplicate
 * the common one-procedure total. Office Bookings only: the anaesthetist Booking
 * shows no calculation.
 *
 * The rail has room to stack a row per line, so it uses `lines` whichever kind
 * they are; the label carries the meaning either way.
 *
 * Values tick with a green flash, so one modifier tap reads as one movement.
 * Figures come from the Phase 01 calculator via
 * `bookingFee` / `procedureFee` — this only formats.
 */
export function BookingTotalPanel({ units, fee, needsPrice = false, lines, rateLabel, overrideNote, action }: BookingTotalProps) {
  const u = useTickingValue(units)
  const f = useTickingValue(fee)

  return (
    <div
      data-testid="booking-calculation"
      style={{
        background: neutral.ink,
        borderRadius: radius.card,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {lines.length > 0 && (
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
              {line.needsPrice === true ? (
                <span style={{ flex: 'none' }}>{NEEDS_PRICE_LABEL}</span>
              ) : (
                <span className="mono" style={{ flex: 'none' }}>{formatCurrency(line.amount)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 4,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>
            BOOKING TOTAL
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: neutral.surface }}>
              {Math.round(u.display)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>units</span>
          </span>
        </span>

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
              borderRadius: radius.sm,
              padding: '2px 8px',
              marginRight: -8,
              transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`,
              background: f.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)',
            }}
          >
            {needsPrice ? (
              <span data-testid="booking-needs-price" style={{ fontSize: 20, fontWeight: 700, color: neutral.surface }}>
                {NEEDS_PRICE_LABEL}
              </span>
            ) : (
              <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: neutral.surface }}>
                {formatCurrency(f.display)}
              </span>
            )}
          </span>
        </span>
      </div>

      {overrideNote !== null && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: -4 }}>
          {overrideNote}
        </div>
      )}

      {action !== undefined && action !== null && action}
    </div>
  )
}
