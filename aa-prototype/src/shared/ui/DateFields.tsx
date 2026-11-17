import { useId, type ReactNode } from 'react'
import { neutral, radius } from '../../theme/tokens'
import { FieldHint, FieldLabel } from './Field'
import { FIELD_CLASS, fieldControlStyle, type FieldFill, type FieldSize } from './fieldChrome'

/**
 * Date and time parts (UI unification U4, group U27). All stay native inputs:
 * five Playwright specs read `input[type="date"]` by position, so each part
 * renders exactly one input per date where it stands.
 */

/** The per-app toolbar heights: 36 on Admin Day (its mockup), 38 on the web (Web Availability). */
export type ToolbarHeight = 36 | 38

function toolbarInputStyle(height: ToolbarHeight) {
  return {
    height,
    boxSizing: 'border-box' as const,
    borderRadius: radius.ctl,
    border: `1px solid ${neutral.line}`,
    background: neutral.surface,
    padding: height === 36 ? '0 10px' : '0 12px',
    fontFamily: 'inherit',
    fontSize: height === 36 ? 13 : 14,
    color: neutral.ink,
  }
}

const inlineLabelStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: neutral.slate } as const

/**
 * Only a full date inside the bounds: native date inputs emit partial years
 * while a year is typed (0002-03-13), so those are dropped (catch-up 38a's
 * guard, now one place). With no `min`, a year before 1900 is taken as partial.
 */
export function acceptedJumpDate(value: string, min?: string, max?: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  if (value < (min ?? '1900-01-01')) return null
  if (max !== undefined && value > max) return null
  return value
}

export interface DateJumpInputProps {
  label: string
  /** The label beside the input (web Lists "Go to date"); hidden it still names the input (Admin Day). */
  labelVisible?: boolean
  value: string
  min?: string
  max?: string
  /** A full in-bounds date, or null when the field is cleared. */
  onPick: (dateISO: string | null) => void
  height: ToolbarHeight
  width?: number
  testId?: string
  /**
   * Take a full date after `max` too (Admin Day: a day past the horizon lands
   * on "Beyond the schedule horizon", as its › and +4w buttons do). `max`
   * still bounds the browser's own picker.
   */
  beyondMax?: boolean
}

/** A toolbar control that sends a screen to a chosen day (Admin Day, web Lists). Mobile keeps its "Go to a date" sheet. */
export function DateJumpInput({ label, labelVisible = false, value, min, max, onPick, height, width, testId, beyondMax = false }: DateJumpInputProps) {
  const input = (
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      aria-label={labelVisible ? undefined : label}
      data-testid={testId}
      onChange={(e) => {
        const v = e.target.value
        if (v === '') onPick(null)
        else {
          const ok = acceptedJumpDate(v, min, beyondMax ? undefined : max)
          if (ok !== null) onPick(ok)
        }
      }}
      className={FIELD_CLASS}
      style={{ ...toolbarInputStyle(height), ...(width !== undefined ? { width } : {}) }}
    />
  )
  if (!labelVisible) return input
  return (
    <label style={inlineLabelStyle}>
      {label}
      {input}
    </label>
  )
}

export interface FilterDateInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  hideLabel?: boolean
  /** `above` (the Admin filter bars, a small label over the field) or `inline` (the web Lists row's "To"). */
  labelPlacement?: 'above' | 'inline'
  shot?: string
  /** 36 (default, Admin) or 38 (the web Lists row). */
  height?: ToolbarHeight
}

/** The filter-bar date: compact and white on the page (question 5). Phase 37's From and To build on it. */
export function FilterDateInput({ label, value, onChange, min, max, hideLabel = false, labelPlacement = 'above', shot, height = 36 }: FilterDateInputProps) {
  const input = (
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      aria-label={hideLabel ? label : undefined}
      data-shot={shot}
      onChange={(e) => onChange(e.target.value)}
      className={FIELD_CLASS}
      style={toolbarInputStyle(height)}
    />
  )
  if (hideLabel) return input
  if (labelPlacement === 'inline') {
    return (
      <label style={inlineLabelStyle}>
        {label}
        {input}
      </label>
    )
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      {input}
    </label>
  )
}

export interface TimeRange {
  start: string
  end: string
}

export interface TimeRangeFieldsProps {
  value: TimeRange
  onChange: (next: TimeRange) => void
  startLabel?: string
  endLabel?: string
  /** Adds " (optional)" to both labels. */
  optional?: boolean
  /** One line under the pair, read with both times. */
  hint?: ReactNode
  size?: FieldSize
  fill?: FieldFill
  shot?: string
}

/**
 * A start and an end time side by side (generalised from Phase 28's
 * SessionTimesFields in U4, so 39b's fields reach the anaesthetist apps). Each
 * time is a labelled native `type="time"` at the field height.
 */
export function TimeRangeFields({ value, onChange, startLabel = 'Start', endLabel = 'End', optional = false, hint, size = 'field', fill = 'well', shot }: TimeRangeFieldsProps) {
  const hintId = useId()
  const suffix = optional ? ' (optional)' : ''
  const style = fieldControlStyle({ size, fill })
  const describedBy = hint !== undefined ? hintId : undefined
  return (
    <div data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{`${startLabel}${suffix}`}</FieldLabel>
          <input type="time" value={value.start} aria-describedby={describedBy} onChange={(e) => onChange({ ...value, start: e.target.value })} className={FIELD_CLASS} style={style} />
        </label>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{`${endLabel}${suffix}`}</FieldLabel>
          <input type="time" value={value.end} aria-describedby={describedBy} onChange={(e) => onChange({ ...value, end: e.target.value })} className={FIELD_CLASS} style={style} />
        </label>
      </div>
      {hint !== undefined && (
        <FieldHint id={hintId} tone="slate" style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {hint}
        </FieldHint>
      )}
    </div>
  )
}
