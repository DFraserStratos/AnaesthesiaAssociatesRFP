import { neutral, radius } from '../../theme/tokens'
import { motion } from '../../theme/motion'
import type { CardTotalLine, CardTotalProps } from '../surface'
import { useTickingValue } from './useTickingValue'

/**
 * How many procedures the strip names individually. Three chips fit the phone's
 * 322px dock interior with room for five-figure fees; past that they would
 * either overflow or need a horizontal scroller inside a footer, so the strip
 * states the count instead and the per-procedure figures stay in the capture
 * column. A silent clip would read as "that is all of them".
 */
const MAX_CHIPS = 3

/**
 * The phone's money dock — the desktop `CardTotalPanel` reduced to the two
 * figures that actually move, pinned above the home indicator so a modifier tap
 * ticks a fee the thumb can see. Previously the phone put a fee panel inline
 * under each capture block, which meant the tap and the number it changed were
 * rarely on screen together (user finding, 2026-07-28).
 *
 * Where the desktop panel stacks a row per procedure, this turns them into a row
 * of chips: the dock is then the same height for one procedure or five, which is
 * what makes pinning affordable at all on 844px. A one-procedure Card shows no
 * chip row, so the common case pays nothing for the rare one.
 *
 * Fee-line detail (a rate-by-time line beside the RVG fee) is deliberately NOT
 * chipped — `linesArePerProcedure` says which kind of line this is, and fee
 * lines have no ordinal to name them by. They are already itemised in the
 * procedure's own `BillingLinesCard`.
 *
 * It shares `CardTotalPanel`'s value-tick and green flash, so one modifier tap
 * reads as one movement on either surface. Figures come from the Phase 01
 * calculator via `cardFee`; this only formats.
 */
export function CardTotalStrip({
  displayMode,
  units,
  fee,
  lines,
  linesArePerProcedure,
  rateLabel,
  overrideNote,
  action,
}: CardTotalProps) {
  const u = useTickingValue(units)
  const f = useTickingValue(fee)
  const showFee = displayMode === 'fee'
  const procedures = showFee && linesArePerProcedure ? lines : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        data-testid="card-calculation"
        data-calculation-mode={displayMode}
        style={{
          background: neutral.ink,
          borderRadius: radius.card,
          padding: '11px 14px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {procedures.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              minWidth: 0,
              overflow: 'hidden',
              marginBottom: 9,
              paddingBottom: 9,
              borderBottom: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            {procedures.length <= MAX_CHIPS ? (
              procedures.map((line, i) => <ProcedureChip key={i} ordinal={i + 1} line={line} />)
            ) : (
              <Chip>{`${procedures.length} procedures`}</Chip>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: showFee ? 'space-between' : 'center',
            gap: 10,
          }}
        >
          {/* line-height 1 throughout: the dock's height is the budget this
              whole change is spending, and the inherited 1.5 would add ~30px. */}
          <span
            style={{
              display: 'flex',
              flexDirection: showFee ? 'row' : 'column',
              alignItems: showFee ? 'baseline' : 'center',
              gap: showFee ? 5 : 4,
              flex: 'none',
              lineHeight: 1,
            }}
          >
            {!showFee ? (
              <span
                style={{
                  fontSize: 10.5,
                  lineHeight: 1,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                CARD UNITS
              </span>
            ) : null}
            <span className="mono" style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, color: neutral.surface }}>
              {Math.round(u.display)}
            </span>
            {showFee ? (
              <span
                style={{ fontSize: 11, lineHeight: 1, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.55)' }}
              >
                UNITS
              </span>
            ) : null}
          </span>

          {showFee ? (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 0 }}>
              {rateLabel !== null && (
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.45)',
                    maxWidth: '100%',
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
                  display: 'block',
                  lineHeight: 1,
                  borderRadius: 8,
                  padding: '2px 8px',
                  marginRight: -8,
                  transition: `background ${motion.valueTick.tintDecay}ms ${motion.valueTick.easing}`,
                  background: f.flashing ? 'rgba(31,164,99,0.45)' : 'rgba(31,164,99,0)',
                }}
              >
                <span className="mono" style={{ fontSize: 24, lineHeight: 1, fontWeight: 700, color: neutral.surface }}>
                  ${f.display.toFixed(2)}
                </span>
              </span>
            </span>
          ) : null}
        </div>

        {showFee && overrideNote !== null && (
          <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: '15px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>
            {overrideNote}
          </div>
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
        borderRadius: 999,
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

/**
 * One procedure's contribution. The ordinal, not the description: a 322px row
 * holding three of these has no room for "Appendicectomy, laparoscopic", and the
 * capture column's own "PROCEDURE 1" headings make the mapping unambiguous. The
 * full description (and the time-units-only qualifier) is the chip's `title`.
 */
function ProcedureChip({ ordinal, line }: { ordinal: number; line: CardTotalLine }) {
  const title = line.note === undefined ? line.label : `${line.label} · ${line.note}`
  return (
    <Chip title={title}>
      <span>P{ordinal}</span>
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>
        ${line.amount.toFixed(2)}
      </span>
    </Chip>
  )
}
