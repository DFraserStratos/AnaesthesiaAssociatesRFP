import { useEffect, useRef, useState } from 'react'
import NumberFlow from '@number-flow/react'
import { useReducedMotion } from 'motion/react'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useAppStore } from '@proto/store'
import { useTickingValue } from '@proto/shared/capture/useTickingValue'
import { formatCurrency } from '@proto/shared/format'
import { NEEDS_PRICE_LABEL } from '@proto/domain/billing/priceRanges'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Segmented } from './shared'

/** The value-tick timings: a 320 ms ease-out roll; the green flash decays over 240 ms. */
const ROLL_MS = 320
const TINT_DECAY_MS = 240
const EASE_OUT_CUBIC = 'cubic-bezier(0.215, 0.61, 0.355, 1)'

type Engine = 'tween' | 'numberflow'

interface Line {
  label: string
  amount: number
  note?: string
}

/** The flash alone (NumberFlow rolls the digits itself): raised on a change, dropped after the roll; none under reduced motion. */
function useFlash(value: number): boolean {
  const reduced = useReducedMotion() === true
  const [flashing, setFlashing] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (reduced) return
    setFlashing(true)
    const t = window.setTimeout(() => setFlashing(false), ROLL_MS + TINT_DECAY_MS / 4)
    return () => window.clearTimeout(t)
  }, [value, reduced])
  return flashing
}

function Figures({ engine, units, fee, needsPrice, rateLabel }: { engine: Engine; units: number; fee: number; needsPrice: boolean; rateLabel: string }) {
  const u = useTickingValue(units) as { display: number; flashing: boolean }
  const fTween = useTickingValue(fee) as { display: number; flashing: boolean }
  const flash = useFlash(fee)
  const flashing = engine === 'tween' ? fTween.flashing : flash
  const timing = { duration: ROLL_MS, easing: EASE_OUT_CUBIC }
  return (
    <div className="tw:flex tw:items-end tw:justify-between tw:gap-3">
      <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
        <span className="tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-white/55">BOOKING TOTAL</span>
        <span className="tw:flex tw:items-baseline tw:gap-1.5">
          <span className="tw:font-mono tw:text-[28px] tw:leading-[34px] tw:font-bold tw:text-white tw:tabular-nums">
            {engine === 'tween' ? Math.round(u.display) : <NumberFlow value={units} spinTiming={timing} transformTiming={timing} />}
          </span>
          <span className="tw:text-xs tw:font-semibold tw:text-white/55">units</span>
        </span>
      </span>
      <span className="tw:flex tw:min-w-0 tw:flex-col tw:items-end tw:gap-1">
        <span className="tw:truncate tw:text-[11px] tw:font-semibold tw:tracking-[0.06em] tw:text-white/55">{rateLabel}</span>
        <span
          className={cn('tw:-mr-2 tw:rounded-[8px] tw:px-2 tw:py-0.5 tw:transition-[background-color] tw:ease-out', flashing ? 'tw:bg-[rgb(31_164_99/0.45)]' : 'tw:bg-[rgb(31_164_99/0)]')}
          style={{ transitionDuration: `${TINT_DECAY_MS}ms` }}
        >
          {needsPrice ? (
            <span className="tw:text-xl tw:font-bold tw:text-white">{NEEDS_PRICE_LABEL}</span>
          ) : (
            <span className="tw:font-mono tw:text-[28px] tw:leading-[34px] tw:font-bold tw:text-white tw:tabular-nums">
              {engine === 'tween' ? `$${fTween.display.toFixed(2)}` : <NumberFlow value={fee} prefix="$" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }} spinTiming={timing} transformTiming={timing} />}
            </span>
          )}
        </span>
      </span>
    </div>
  )
}

/**
 * The ink Booking total panel on tokens, its two figures either on the prototype's useTickingValue tween
 * or on NumberFlow (digits roll in place). Both keep the green flash on the fee and jump with no flash
 * under reduced motion. Nothing static animates.
 */
export function BookingTotalReplacement({ engine = 'tween' }: { engine?: Engine }) {
  const f = useWebFixtures() as { anaesthetistId: string }
  const rate = useAppStore((s: any) => s.masters.anaesthetists[f.anaesthetistId]?.unitValue ?? 26.5) as number
  const [units, setUnits] = useState(12)
  const [needsPrice, setNeedsPrice] = useState<'no' | 'yes'>('no')
  const base = Math.min(units, 6)
  const lines: Line[] = [
    { label: 'Procedure 1', amount: base * rate },
    { label: 'Procedure 2', amount: (units - base) * rate, note: 'time units only' },
  ]
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setUnits((u) => Math.max(0, u - 1))}>
          One unit less
        </Button>
        <Button variant="outline" size="sm" onClick={() => setUnits((u) => u + 1)}>
          One unit more
        </Button>
        <span className="tw:ml-2 tw:text-xs tw:font-semibold tw:text-mist">Needs a price</span>
        <Segmented label="Needs a price" size="sm" value={needsPrice} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} onChange={setNeedsPrice} />
      </div>
      <div data-testid="booking-calculation" className="tw:flex tw:flex-col tw:gap-3 tw:rounded-card tw:bg-ink tw:p-4">
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          {lines.map((line) => (
            <div key={line.label} className="tw:flex tw:items-baseline tw:justify-between tw:gap-3 tw:border-b tw:border-white/14 tw:pb-1.5 tw:text-xs tw:text-white/70">
              <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-px">
                <span className="tw:truncate">{line.label}</span>
                {line.note !== undefined && <span className="tw:text-[11px] tw:text-white/45">{line.note}</span>}
              </span>
              <span className="tw:flex-none tw:font-mono tw:tabular-nums">${line.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <Figures engine={engine} units={units} fee={units * rate} needsPrice={needsPrice === 'yes'} rateLabel={`FEE @ ${formatCurrency(rate)}/UNIT`} />
      </div>
    </div>
  )
}
