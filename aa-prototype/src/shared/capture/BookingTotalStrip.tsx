import { neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { BookingTotalLine, BookingTotalProps } from '../surface/context'
import { useTickingValue } from './useTickingValue'
import { formatMoney } from '../format'
import { NEEDS_PRICE_LABEL } from '../../domain/billing/priceRanges'

/**
 * How many procedures the strip names individually. Three chips fit the phone's
 * 322px dock interior with room for five-figure fees; past that the strip
 * states the count, and the per-procedure figures stay in the capture column.
 */
const MAX_CHIPS = 3

/**
 * The phone's money dock (restored in catch-up Phase 24 from `d1562b4c`'s
 * `CardTotalStrip`; US-03.3.10, RV-29): the desktop `BookingTotalPanel`
 * reduced to the two figures that move, pinned above the Mark complete bar
 * so a modifier tap ticks a price the thumb can see. Fee only: the old Off /
 * Units / Fee setting is not restored.
 *
 * A multi-procedure Booking's rows become chips (P1, P2 ...), so the dock is
 * the same height for one procedure or five. It shares `BookingTotalPanel`'s
 * value tick and green flash, so one modifier tap reads as one movement on
 * either surface. Figures come from the one Booking assembler (`bookingFee`);
 * this only formats. Visible, never in the way: no sheet, toast or confirm.
 */
export function BookingTotalStrip({ units, fee, needsPrice = false, lines, rateLabel, overrideNote, multiProcedure = false, action }: BookingTotalProps) {
  const u = useTickingValue(units)
  const f = useTickingValue(fee)
  const procedures = multiProcedure ? lines : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        data-testid="booking-calculation"
        data-shot="booking-total-strip"
        role="group"
        aria-label="Booking total"
        style={{ background: neutral.ink, borderRadius: radius.card, padding: '11px 14px', display: 'flex', flexDirection: 'column' }}
      >
        {procedures.length > 0 && (
          <div style={{ display: 'flex', gap: 6, minWidth: 0, overflow: 'hidden', marginBottom: 9, paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.14)' }}>
            {procedures.length <= MAX_CHIPS ? (
              procedures.map((line, i) => <ProcedureChip key={i} ordinal={i + 1} line={line} />)
            ) : (
              <Chip>{`${procedures.length} procedures`}</Chip>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* line-height 1 throughout: the dock's height is the budget, and the inherited 1.5 would add ~30px. */}
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, flex: 'none', lineHeight: 1 }}>
            <span className="mono" style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, color: neutral.surface }}>
              {Math.round(u.display)}
            </span>
            <span style={{ fontSize: 11, lineHeight: 1, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}>UNITS</span>
          </span>

          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 0 }}>
            {rateLabel !== null && (
              <span style={{ fontSize: 11, lineHeight: 1, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rateLabel}
              </span>
            )}
            <span
              style={{
                display: 'block',
                lineHeight: 1,
                borderRadius: radius.sm,
                padding: '2px 8px',
                marginRight: -8,
                transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`,
                background: f.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)',
              }}
            >
              <span className="mono" style={{ fontSize: needsPrice ? 15 : 24, lineHeight: 1, fontWeight: 700, color: neutral.surface }}>
                {needsPrice ? NEEDS_PRICE_LABEL : formatMoney(f.display)}
              </span>
            </span>
          </span>
        </div>

        {overrideNote !== null && (
          <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: '15px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>{overrideNote}</div>
        )}
      </div>

      {action !== undefined && action !== null && action}
    </div>
  )
}

/** The chip shell. Quiet on ink, so it never competes with the total beside it. */
function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        flex: 'none',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: radius.pill,
        padding: '4px 10px',
        fontSize: 11,
        lineHeight: 1,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

/** One procedure's contribution, by its place (the primary is P1); its text is the chip's title. */
function ProcedureChip({ ordinal, line }: { ordinal: number; line: BookingTotalLine }) {
  const title = line.note === undefined ? line.label : `${line.label} · ${line.note}`
  return (
    <Chip title={title}>
      <span>P{ordinal}</span>
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>
        {line.needsPrice === true ? NEEDS_PRICE_LABEL : formatMoney(line.amount)}
      </span>
    </Chip>
  )
}
