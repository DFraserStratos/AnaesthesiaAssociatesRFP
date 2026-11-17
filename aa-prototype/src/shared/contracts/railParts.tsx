import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { accent, neutral, radius, zIndex } from '../../theme/tokens'
import type { Contract } from '../../domain/types'
import { AMOUNT_HINT, AMOUNT_INVALID_HINT, NO_CONTRACT_HEADING } from './railText'
import type { RailOption } from '../../domain/billing/contractRail'
import { FieldHint } from '../ui/Field'
import { FIELD_CLASS, fieldControlStyle } from '../ui/fieldChrome'
import { Pill } from '../ui/Pill'
import { plural } from '../format'
import { useRovingRadio } from '../ui/useRovingRadio'

/**
 * The Contract chooser's parts, built once (UI unification U4, group U24) for
 * the inline Billing card (Admin, web, the phone's Billing sheet) and the
 * creation forms' step rail sheet (`ContractRail`): the answer options, the
 * "No contract" group with the destination's two backstops, the backstop's
 * typed amount and the numbered step markers. The two layouts (inline and
 * sheet) stay; the parts are one. Step markers take the Billing card's look
 * (the contract picker mock's), the fields ContractRail's (README U24).
 */

// ---------------------------------------------------------------------------
// Answer options
// ---------------------------------------------------------------------------

/**
 * One step's answers as a named radio group with one Tab stop: `list` (the
 * sheet's rows, with the count) or `tiles` (the Billing card's, with "None for
 * this List"). Arrow keys move focus only; Space, Enter or a click picks,
 * because a pick saves and moves the rail on. "Suggested" (the Booking's
 * funder, catch-up Phase 21) marks one path, never a filter. `list` shows its
 * label as the heading; `tiles` sit under the step's own question.
 */
export function RailOptionGroup({
  layout,
  label,
  options,
  value,
  onPick,
  stacked = false,
}: {
  layout: 'list' | 'tiles'
  label: string
  options: readonly RailOption[]
  value: string | undefined
  onPick: (value: string) => void
  /** Tiles in one column (the phone's sheet). */
  stacked?: boolean
}) {
  const radio = useRovingRadio({
    values: options.map((o) => o.value),
    value,
    onChange: onPick,
    isDisabled: (v) => options.find((o) => o.value === v)?.selectable !== true,
    selectOnMove: false,
  })
  const tiles = layout === 'tiles'
  const group = (
    <div
      {...radio.groupProps}
      aria-label={label}
      style={
        tiles
          ? { display: 'grid', gridTemplateColumns: stacked ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(170px, 1fr))', gap: stacked ? 8 : 10 }
          : { display: 'flex', flexDirection: 'column', gap: 6 }
      }
    >
      {options.map((o, i) => {
        const on = o.value === value
        const empty = o.count === 0
        const title = (
          <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: tiles ? 700 : 600, color: tiles && on ? accent.base : neutral.ink }}>{o.label}</span>
            {o.suggested === true && (
              <Pill size="sm" shot="rail-suggested">
                Suggested
              </Pill>
            )}
          </span>
        )
        const hint = o.hint !== undefined && <span style={{ fontSize: 12.5, lineHeight: tiles ? '17px' : undefined, color: neutral.slate }}>{o.hint}</span>
        return (
          <button
            key={o.value}
            {...radio.itemProps(i)}
            type="button"
            data-rail-option={o.value}
            disabled={!o.selectable}
            onClick={() => onPick(o.value)}
            style={
              tiles
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: radius.ctl,
                    border: `1px solid ${on ? accent.base : neutral.lineStrong}`,
                    boxShadow: on ? `inset 0 0 0 1px ${accent.base}` : 'none',
                    background: on ? accent.tint : empty ? neutral.bg : neutral.surface,
                    cursor: o.selectable ? 'pointer' : 'default',
                    opacity: o.selectable ? 1 : 0.55,
                    minWidth: 0,
                    fontFamily: 'inherit',
                  }
                : {
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                    border: `1px solid ${on ? accent.base : neutral.line}`,
                    background: on ? accent.tint : neutral.surface,
                    borderRadius: radius.ctl,
                    padding: '12px 14px',
                    fontFamily: 'inherit',
                    cursor: o.selectable ? 'pointer' : 'default',
                    opacity: o.selectable ? 1 : 0.55,
                  }
            }
          >
            {tiles ? (
              <>
                {title}
                {hint}
                <span style={{ marginTop: 'auto', paddingTop: 6, fontSize: 12, color: empty ? neutral.mist : neutral.slate }}>
                  {empty ? 'None for this List' : plural(o.count, 'Contract')}
                </span>
              </>
            ) : (
              <>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {title}
                  {hint}
                </span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.slate }} aria-label={plural(o.count, 'Contract')}>
                  {o.count}
                </span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
  if (tiles) return group
  return (
    <div>
      <div aria-hidden style={{ fontSize: 15, fontWeight: 600, color: neutral.ink, marginBottom: 8 }}>
        {label}
      </div>
      {group}
    </div>
  )
}

// ---------------------------------------------------------------------------
// The "No contract" group and the backstop's amount
// ---------------------------------------------------------------------------

/** The heading over one group of Contracts in a list ("No contract", or a holder's name). */
export function ContractGroupHeading({ children }: { children: ReactNode }) {
  return <div style={{ padding: '8px 14px 4px', fontSize: 11.5, fontWeight: 700, color: neutral.mist }}>{children}</div>
}

/**
 * The "No contract" heading with the destination's two backstops under it
 * (built 20's owner review, 16 November: every Contract list starts here; there
 * is no "Other price" switch). Each list draws its own rows (`renderRow`): the
 * sheet's radio rows, the Billing card's combo options.
 */
export function NoContractGroup({ heading = NO_CONTRACT_HEADING, backstops, renderRow }: { heading?: string; backstops: readonly Contract[]; renderRow: (contract: Contract) => ReactNode }) {
  if (backstops.length === 0) return null
  return (
    <div data-shot="no-contract-group">
      <ContractGroupHeading>{heading}</ContractGroupHeading>
      {backstops.map((c) => renderRow(c))}
    </div>
  )
}

/**
 * The typed amount on No contract · Fixed price (and under Patient › Standard,
 * "RVG code | Fixed price"): TextField's chrome at the rail's 44px, mono, a
 * decimal keypad, `aria-invalid` with the hint line saying why, and the
 * `contract-rail-amount` hook on the input. A grey well in the white card or
 * sheet (question 4). `action` holds an inline button beside it.
 */
export function BackstopAmountField({
  label,
  ariaLabel,
  value,
  onChange,
  onCommit,
  invalid,
  block = false,
  action,
}: {
  /** The visible label (the caller's words and style). */
  label: ReactNode
  /** The input's name ("Fixed price, ex GST"). */
  ariaLabel: string
  value: string
  onChange: (value: string) => void
  /** Leaving the field or Enter (the Billing card saves there). */
  onCommit?: () => void
  invalid: boolean
  /** Full width (the phone's sheet). */
  block?: boolean
  action?: ReactNode
}) {
  const hintId = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          data-shot="contract-rail-amount"
          inputMode="decimal"
          aria-label={ariaLabel}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={hintId}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit?.()
          }}
          className={`${FIELD_CLASS} mono`}
          style={{ ...fieldControlStyle({ invalid }), minHeight: 44, padding: '0 12px', ...(block ? {} : { maxWidth: 220 }) }}
        />
        {action}
      </div>
      <FieldHint id={hintId} tone={invalid ? 'error' : 'mist'}>
        {invalid ? AMOUNT_INVALID_HINT : AMOUNT_HINT}
      </FieldHint>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The step rail
// ---------------------------------------------------------------------------

export interface RailStep {
  n: number
  label: string
  value?: string
  /** The step filled itself in ("Only option"). */
  auto: boolean
  done: boolean
  current: boolean
  /** Jump back to change this answer; absent, the step is not clickable. */
  onJump?: () => void
}

/**
 * The numbered steps as a list (`<nav><ol>`), the current one marked
 * `aria-current="step"`: `vertical` (the desktop column, a connector line
 * between markers) or `compact` (three across, the phone's sheet).
 */
export function StepRail({ steps, orientation, label }: { steps: readonly RailStep[]; orientation: 'vertical' | 'compact'; label: string }) {
  const compact = orientation === 'compact'
  return (
    <nav aria-label={label} style={compact ? undefined : { borderRight: `1px solid ${neutral.line}`, paddingRight: 12 }}>
      <ol
        style={
          compact
            ? { margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, gap: 6 }
            : { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }
        }
      >
        {steps.map((s, i) => (
          <li key={s.n} style={{ minWidth: 0 }}>
            <StepMarker step={s} orientation={orientation} last={i === steps.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** One step: its marker (24px mono circle, a tick once answered), its label and its answer. */
export function StepMarker({ step, orientation, last }: { step: RailStep; orientation: 'vertical' | 'compact'; last: boolean }) {
  const { n, label, value, auto, done, current, onJump } = step
  const circle = (size: number) => (
    <span
      className="mono"
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        background: done ? accent.base : neutral.surface,
        color: done ? neutral.surface : current ? accent.base : neutral.mist,
        border: done ? 'none' : `1.5px solid ${current ? accent.base : neutral.lineStrong}`,
        zIndex: zIndex.raised,
      }}
    >
      {done ? <Check size={13} strokeWidth={3} aria-hidden /> : n}
    </span>
  )
  const showAuto = auto && value !== undefined
  if (orientation === 'compact') {
    return (
      <button
        type="button"
        data-shot={`contract-rail-step-${n}`}
        disabled={onJump === undefined}
        onClick={onJump}
        aria-current={current ? 'step' : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%', height: '100%', boxSizing: 'border-box', textAlign: 'left', border: `1px solid ${current ? accent.base : 'transparent'}`, background: current ? accent.tint : 'transparent', borderRadius: radius.ctl, padding: 8, cursor: onJump !== undefined ? 'pointer' : 'default', fontFamily: 'inherit', minWidth: 0 }}
      >
        {circle(22)}
        <span style={{ fontSize: 11.5, lineHeight: '15px', fontWeight: 600, color: current ? accent.base : neutral.slate }}>{label}</span>
        <span style={{ width: '100%', fontSize: 13, lineHeight: '17px', fontWeight: 600, color: done && value !== undefined ? neutral.ink : neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{done && value !== undefined ? value : 'Not answered'}</span>
        {showAuto && <span data-shot="contract-rail-only-option" style={{ fontSize: 11.5, color: neutral.slate }}>Only option</span>}
      </button>
    )
  }
  return (
    <button
      type="button"
      data-shot={`contract-rail-step-${n}`}
      disabled={onJump === undefined}
      onClick={onJump}
      title={onJump !== undefined ? 'Change this answer' : undefined}
      aria-current={current ? 'step' : undefined}
      style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: current ? accent.tint : 'transparent', borderRadius: radius.ctl, padding: '8px 10px', cursor: onJump !== undefined ? 'pointer' : 'default', position: 'relative', fontFamily: 'inherit' }}
    >
      <span style={{ position: 'relative', flex: 'none', width: 24, display: 'flex', justifyContent: 'center' }}>
        {circle(24)}
        {!last && <span aria-hidden style={{ position: 'absolute', top: 26, bottom: -22, width: 1.5, background: done ? accent.base : neutral.line }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: done ? 12 : 14, lineHeight: done ? '16px' : '24px', fontWeight: 600, color: current ? accent.base : done ? neutral.slate : neutral.mist }}>{label}</span>
        {done && value !== undefined && (
          <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: neutral.ink, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{value}</span>
        )}
        {showAuto && <span data-shot="contract-rail-only-option" style={{ fontSize: 12, color: neutral.slate }}>Only option</span>}
      </span>
    </button>
  )
}
