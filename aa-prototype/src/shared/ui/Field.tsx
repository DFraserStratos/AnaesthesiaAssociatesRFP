import { useId, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
import { controlStyle, FIELD_CLASS, FIELD_FILL, fieldControlStyle, type FieldFill, type FieldSize } from './fieldChrome'
import { SlidingSegmentedControl, type SlidingSegmentLayout, type SlidingSegmentSize } from './SlidingSegmentedControl'

import { Eyebrow } from './Eyebrow'

/** The 11/600 caps label above a field: the shared `Eyebrow` (UI unification U6), mist, as a `div`. */
export const FieldLabel = Eyebrow

/** `data-*` attributes a field passes through to its control (UI unification U1 "hooks travel"). */
export type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }

/** The `data-*` props of a component's props, to spread on its control. */
export function dataAttributesOf(props: object): DataAttributes {
  const out: DataAttributes = {}
  for (const [k, v] of Object.entries(props)) if (k.startsWith('data-')) out[k as `data-${string}`] = v as string
  return out
}

/** The one quiet line under a field (12px mist), tied to it by `id` and `aria-describedby` (U4). */
export function FieldHint({ id, children, tone = 'mist', style }: { id?: string; children: ReactNode; tone?: 'mist' | 'slate' | 'error'; style?: CSSProperties }) {
  return (
    <div id={id} style={{ fontSize: 12, color: tone === 'error' ? semantic.error.onTint : tone === 'slate' ? neutral.slate : neutral.mist, ...style }}>
      {children}
    </div>
  )
}

interface TextFieldProps extends DataAttributes {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date' | 'email' | 'tel' | 'number' | 'time'
  mono?: boolean
  /** One mist line under the field, tied to it with aria-describedby (error-coloured while `invalid`). */
  hint?: ReactNode
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  align?: 'left' | 'right'
  /** Sets `aria-invalid` and the error border. */
  invalid?: boolean
  /** A `<datalist>` id. */
  list?: string
  min?: string | number
  max?: string | number
  step?: string | number
  /** `field` 48px (default); `compact` 36px for toolbars and tables (question 5). */
  size?: FieldSize
  /** `well` grey (default, today's look) inside white containers; `surface` white on the page (question 4). */
  fill?: FieldFill
  /** No visible label: the label becomes the control's literal `aria-label`. */
  hideLabel?: boolean
  width?: number | string
  /** `data-shot` on the input itself. */
  shot?: string
  disabled?: boolean
  autoFocus?: boolean
  maxLength?: number
  autoComplete?: string
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * A labelled single-line input: text, date, time, number, email or phone (U4
 * extends it with sizes, fill, bounds and `invalid`). Every default keeps the
 * look it had: 48px, grey well, 15px.
 */
export function TextField(props: TextFieldProps) {
  const {
    label, value, onChange, placeholder, type = 'text', mono, hint, inputMode, align, invalid = false, list, min, max, step,
    size = 'field', fill = 'well', hideLabel = false, width, shot, disabled, autoFocus, maxLength, autoComplete, onBlur, onKeyDown,
  } = props
  const hintId = useId()
  const input = (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      aria-label={hideLabel ? label : undefined}
      aria-describedby={hint !== undefined ? hintId : undefined}
      aria-invalid={invalid ? true : undefined}
      inputMode={inputMode}
      list={list}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      autoFocus={autoFocus}
      maxLength={maxLength}
      autoComplete={autoComplete}
      data-shot={shot}
      {...dataAttributesOf(props)}
      className={mono === true ? `${FIELD_CLASS} mono` : FIELD_CLASS}
      style={{ ...fieldControlStyle({ size, fill, invalid }), ...(align === 'right' ? { textAlign: 'right' } : {}) }}
    />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...(width !== undefined ? { width } : {}) }}>
      {hideLabel ? (
        input
      ) : (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{label}</FieldLabel>
          {input}
        </label>
      )}
      {hint !== undefined && <FieldHint id={hintId} tone={invalid ? 'error' : 'mist'}>{hint}</FieldHint>}
    </div>
  )
}

interface SelectFieldProps extends DataAttributes {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  hint?: ReactNode
  disabled?: boolean
  /** `field` 48px (default) in sheets; `compact` 36px for toolbars (question 5). */
  size?: FieldSize
  /** `well` grey (default) inside white containers; `surface` white on the page (question 4). */
  fill?: FieldFill
  /** No visible label: the label text becomes the select's literal `aria-label`. */
  hideLabel?: boolean
  width?: number | string
  /** `data-shot` on the `<select>` itself (recipes `selectOption` it). */
  shot?: string
  /** `data-shot` on the wrapper (a toolbar filter's whole field). */
  labelShot?: string
  id?: string
}

/**
 * A labelled native select (UI unification U4, group U07). It stays a native
 * `<select>`: the capture recipes `selectOption` it, and the SurgeonPicker
 * ruling (catch-up 17) keeps native selects. TextField's chrome, `aa-field`'s
 * focus ring, `shot` on the select, `data-*` passed through to it.
 */
export function SelectField(props: SelectFieldProps) {
  const { label, value, onChange, children, hint, disabled, size = 'field', fill = 'well', hideLabel = false, width, shot, labelShot, id } = props
  const hintId = useId()
  const select = (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={hideLabel ? label : undefined}
      aria-describedby={hint !== undefined ? hintId : undefined}
      data-shot={shot}
      {...dataAttributesOf(props)}
      className={FIELD_CLASS}
      style={{ ...fieldControlStyle({ size, fill, select: true }), ...(hideLabel && width !== undefined ? { width } : {}), ...(size === 'compact' && width === undefined ? { width: 'auto' } : {}) }}
    >
      {children}
    </select>
  )
  if (hideLabel && hint === undefined) {
    return labelShot !== undefined ? <span data-shot={labelShot} style={{ display: 'contents' }}>{select}</span> : select
  }
  return (
    <div data-shot={labelShot} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...(width !== undefined ? { width } : {}) }}>
      {hideLabel ? (
        select
      ) : (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{label}</FieldLabel>
          {select}
        </label>
      )}
      {hint !== undefined && <FieldHint id={hintId}>{hint}</FieldHint>}
    </div>
  )
}

/**
 * A refused save, in plain words: the error-tint box the sheets share (`box`),
 * or a one-line refusal beside a compact row control (`inline`: 12px error
 * on-tint text, UI unification U3, C question 6). Both are `role="alert"`, and
 * the node mounts with its text, so a screen reader announces it. Nothing
 * when there is no message. `style` is placement only (margins, alignment).
 */
export function FormError({
  message,
  variant = 'box',
  shot,
  style,
}: {
  message: string | null | undefined
  variant?: 'box' | 'inline'
  shot?: string
  style?: CSSProperties
}) {
  if (message === null || message === undefined || message === '') return null
  if (variant === 'inline') {
    // A span, so it can sit inside a row's text column; block, so it takes its own line.
    return (
      <span role="alert" data-shot={shot} style={{ display: 'block', color: semantic.error.onTint, fontSize: 12, ...style }}>
        {message}
      </span>
    )
  }
  return (
    <div role="alert" data-shot={shot} style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13, ...style }}>
      {message}
    </div>
  )
}

interface TextAreaProps extends DataAttributes {
  label?: string
  /** The name when there is no visible label. */
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onBlur?: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  /** A counter under the field ("12/140"); caps the text unless `cap` is false (then over the limit reads in error). */
  maxLength?: number
  cap?: boolean
  /** Count the trimmed text (a note that ignores stray spaces). */
  countTrimmed?: boolean
  rows?: number
  /** `compact`: the admin rail's 60px, 12.5px note. */
  size?: 'field' | 'compact'
  fill?: FieldFill
  hint?: ReactNode
  autoFocus?: boolean
  shot?: string
  /** `vertical` lets the person drag it taller (the modifier reason). */
  resize?: 'none' | 'vertical'
}

/** A labelled multi-line input (U4: a name without a label, a built-in counter, compact density). */
export function TextArea(props: TextAreaProps) {
  const {
    label, ariaLabel, value, onChange, placeholder, onBlur, onKeyDown, maxLength, cap = true, countTrimmed = false, rows,
    size = 'field', fill = 'well', hint, autoFocus, shot, resize = 'none',
  } = props
  const hintId = useId()
  const counterId = useId()
  const count = countTrimmed ? value.trim().length : value.length
  const over = maxLength !== undefined && count > maxLength
  const compact = size === 'compact'
  const area = (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      rows={rows}
      autoFocus={autoFocus}
      maxLength={cap ? maxLength : undefined}
      aria-label={label === undefined ? ariaLabel : undefined}
      aria-describedby={[hint !== undefined ? hintId : '', maxLength !== undefined ? counterId : ''].filter((x) => x !== '').join(' ') || undefined}
      aria-invalid={over ? true : undefined}
      data-shot={shot}
      {...dataAttributesOf(props)}
      className={FIELD_CLASS}
      style={{
        ...controlStyle,
        background: FIELD_FILL[fill],
        ...(over ? { border: `1px solid ${semantic.error.solid}` } : {}),
        // With `rows`, the rows set the height (the modifier reason's two lines); else the field's minimum.
        minHeight: rows !== undefined ? undefined : compact ? 60 : 72,
        padding: compact ? 10 : 12,
        fontSize: compact ? 12.5 : 15,
        resize,
        lineHeight: compact ? undefined : '20px',
      }}
    />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label !== undefined ? (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>{label}</FieldLabel>
          {area}
        </label>
      ) : (
        area
      )}
      {hint !== undefined && <FieldHint id={hintId}>{hint}</FieldHint>}
      {maxLength !== undefined && (
        <span id={counterId} className="mono" style={{ alignSelf: 'flex-end', fontSize: 11.5, color: over ? semantic.error.onTint : neutral.mist, fontVariantNumeric: 'tabular-nums' }}>
          {count}/{maxLength}
        </span>
      )}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  label?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  /** Read-only rendering: selection stays visible, taps do nothing. */
  disabled?: boolean
  /** The control's layout and size (U5): `row` and `md` by default. */
  layout?: SlidingSegmentLayout
  size?: SlidingSegmentSize
}

/** A segmented control (convention 16: prefer over a dropdown). Teal selection. */
export function Segmented<T extends string>({ label, value, options, onChange, disabled, layout, size }: SegmentedProps<T>) {
  const isDisabled = disabled === true
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label !== undefined && <FieldLabel>{label}</FieldLabel>}
      <SlidingSegmentedControl
        value={value}
        options={options}
        onSelect={onChange}
        disabled={isDisabled}
        ariaLabel={label}
        {...(layout !== undefined ? { layout } : {})}
        {...(size !== undefined ? { size } : {})}
      />
    </div>
  )
}
