import { useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Col, Said } from './shared'

/**
 * The phone's press response (theme/global.css `[data-aa-mobile-product] button:active`):
 * sink 1px, scale to 0.985, a touch darker, on a 90ms card-ease transform. As Tailwind
 * `active:` utilities it travels with the component instead of one global selector.
 */
export const PRESS =
  'tw:origin-center tw:transition-[transform,filter,background-color,border-color,color,opacity] tw:duration-[90ms,90ms,150ms,150ms,150ms,150ms] tw:ease-card tw:active:translate-y-px tw:active:scale-[0.985] tw:active:brightness-[0.97] tw:motion-reduce:active:transform-none'

/** The same press as one rule on a container, for every enabled button inside it (today's global rule). */
export const PRESS_DESCENDANTS =
  'tw:[&_button:not(:disabled)]:origin-center tw:[&_button:not(:disabled)]:transition-[transform,filter,background-color,border-color,color,opacity] tw:[&_button:not(:disabled)]:duration-[90ms,90ms,150ms,150ms,150ms,150ms] tw:[&_button:not(:disabled)]:ease-card tw:[&_button:not(:disabled):active]:translate-y-px tw:[&_button:not(:disabled):active]:scale-[0.985] tw:[&_button:not(:disabled):active]:brightness-[0.97] tw:motion-reduce:[&_button:not(:disabled):active]:transform-none'

// ---------------------------------------------------------------------------
// Button (MobileButton)
// ---------------------------------------------------------------------------

/**
 * The shared button set on the branded shadcn Button: primary = default at size cta (54px,
 * r-card, 17/700), secondary = outline at lg (48px), pill = the tinted pill at the prototype's
 * 44px. Same five buttons and lines as the current example.
 */
export function MobileButtonReplacement() {
  const [line, setLine] = useState<string | null>(null)
  return (
    <Col>
      <Button size="cta" className={cn('tw:w-full', PRESS)} onClick={() => setLine('Primary tapped')}>
        Mark complete
      </Button>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <Button variant="outline" size="lg" className={PRESS} onClick={() => setLine('Secondary tapped')}>
          Secondary
        </Button>
        <Button variant="pill" className={cn('tw:h-11', PRESS)} onClick={() => setLine('Pill tapped')}>
          Pill
        </Button>
        <Button variant="pill" className="tw:h-11" disabled>
          Disabled
        </Button>
      </div>
      <Button size="cta" className="tw:w-full tw:disabled:bg-line tw:disabled:text-mist" disabled>
        Primary, disabled
      </Button>
      <Said line={line} />
    </Col>
  )
}

// ---------------------------------------------------------------------------
// Mobile press feedback (:active)
// ---------------------------------------------------------------------------

/**
 * The press response, two ways: one rule on the phone container that reaches every enabled
 * button (as today), or opt-in `active:` utilities on each control that wants it.
 */
export function PressFeedbackReplacement({ scope }: { scope: 'container' | 'per-control' }) {
  const [n, setN] = useState(0)
  const own = scope === 'per-control' ? PRESS : undefined
  return (
    <div className={scope === 'container' ? PRESS_DESCENDANTS : undefined}>
      <Col>
        <div className="tw:text-[13px] tw:leading-5 tw:text-slate">
          {scope === 'container'
            ? 'Press and hold: every enabled button in the phone UI sinks 1px and scales to 0.985.'
            : 'Press and hold: each control that opts in sinks 1px and scales to 0.985.'}
        </div>
        <Button size="cta" className={cn('tw:w-full', own)} onClick={() => setN((x) => x + 1)}>
          Hold me
        </Button>
        <button
          type="button"
          onClick={() => setN((x) => x + 1)}
          className={cn(
            'tw:cursor-pointer tw:rounded-card tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3.5 tw:text-left tw:text-[15px] tw:text-ink tw:outline-none tw:focus-visible:shadow-focus',
            own,
          )}
        >
          A card button
        </button>
        <span className="tw:text-[12.5px] tw:text-mist">Pressed {n} times</span>
      </Col>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepperButton
// ---------------------------------------------------------------------------

/** The 44px round-square stepper: outline Button at 44px, r12, slate glyph, with an accessible name. */
function Stepper({ dir, glyph, label, onClick, disabled }: { dir: 'down' | 'up'; glyph: 'text' | 'icon'; label: string; onClick: () => void; disabled?: boolean }) {
  const content: ReactNode =
    glyph === 'icon' ? (dir === 'down' ? <Minus className="tw:size-5" strokeWidth={2.2} aria-hidden /> : <Plus className="tw:size-5" strokeWidth={2.2} aria-hidden />) : dir === 'down' ? '−' : '+'
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('tw:size-11 tw:rounded-[12px]! tw:text-xl tw:text-slate tw:disabled:text-line-strong', PRESS)}
    >
      {content}
    </Button>
  )
}

export function StepperButtonReplacement({ glyph }: { glyph: 'text' | 'icon' }) {
  const [units, setUnits] = useState(5)
  return (
    <div role="group" aria-labelledby="m-sheets-stepper-label" className="tw:flex tw:items-center tw:gap-2">
      <span id="m-sheets-stepper-label" className="tw:flex-1 tw:text-[15px] tw:font-semibold">
        Base units
      </span>
      <Stepper dir="down" glyph={glyph} label="Fewer base units" onClick={() => setUnits((u) => Math.max(0, u - 1))} disabled={units === 0} />
      <span aria-live="polite" className="tw:w-9 tw:text-center tw:font-mono tw:text-xl tw:font-bold tw:tabular-nums">
        {units}
      </span>
      <Stepper dir="up" glyph={glyph} label="More base units" onClick={() => setUnits((u) => u + 1)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// NudgeButton
// ---------------------------------------------------------------------------

function Nudge({ label, name, onClick, disabled }: { label: string; name: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="outline"
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
      className={cn('tw:h-9 tw:w-11 tw:px-0 tw:text-[15px] tw:text-slate tw:disabled:text-line-strong', PRESS)}
    >
      {label}
    </Button>
  )
}

export function NudgeButtonReplacement() {
  const [mins, setMins] = useState(8 * 60 + 30)
  const label = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
  return (
    <div role="group" aria-label="Start time" className="tw:flex tw:items-center tw:gap-2">
      <Nudge label="−5" name="5 minutes earlier" onClick={() => setMins((m) => Math.max(0, m - 5))} disabled={mins === 0} />
      <span aria-live="polite" className="tw:min-w-[90px] tw:text-center tw:font-mono tw:text-[28px] tw:leading-9 tw:font-bold tw:tabular-nums">
        {label}
      </span>
      <Nudge label="+5" name="5 minutes later" onClick={() => setMins((m) => Math.min(23 * 60 + 55, m + 5))} disabled={mins === 23 * 60 + 55} />
    </div>
  )
}
