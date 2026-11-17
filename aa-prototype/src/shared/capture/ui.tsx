/** Shared primitives for the BTM capture cards (mockup screen 3 anatomy). */
import { Pill } from '../ui/Pill'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { BillingValidationFailure } from '../../domain/billing'

/**
 * A white capture card with the micro-caps section label.
 *
 * `footer` is the card's foot: its caption, its trailing action, its failure
 * notes. It renders exactly where it would have anyway, except when the card is
 * stretched to match its `Pair` partner on a desktop, where it sinks to the
 * bottom edge and the slack opens above it. Without that, the shorter of two
 * matched cards ends in a pane of empty white, which reads as a fault. On the
 * phone nothing stretches, so the slot has no effect at all.
 */
export function CaptureSection({
  label,
  children,
  footer,
  gap = 12,
  validationTarget,
  shot,
  required,
}: {
  label: string
  /**
   * A "Required" caption beside the label (catch-up Phase 21a: the RVG detail
   * on an RVG kind): neutral until Mark complete's validation latch is on
   * ('latched'), then the warning tint while the section is still missing.
   */
  required?: 'idle' | 'latched'
  /**
   * The `data-shot` hook, without its `capture-` prefix, when it must not follow
   * the label (catch-up Phase 19: the "RVG code" card keeps `capture-procedure-code`,
   * which the catalogue recipes click). Defaults to the label, slugged.
   */
  shot?: string
  children: ReactNode
  footer?: ReactNode
  gap?: number
  validationTarget?: {
    procedureId: string
    fields: readonly string[]
  }
}) {
  return (
    <div
      tabIndex={validationTarget === undefined ? undefined : -1}
      data-shot={`capture-${shot ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      data-validation-procedure-id={validationTarget?.procedureId}
      data-validation-fields={validationTarget?.fields.join(' ')}
      style={{
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {required === undefined ? (
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>
          {label}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>
            {label}
          </div>
          <RequiredCaption latched={required === 'latched'} />
        </div>
      )}
      {children}
      {/* Pass null, not an always-truthy fragment of conditionals: an empty
          wrapper still costs one `gap` of trailing space in the column. */}
      {footer !== undefined && footer !== null && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap }}>{footer}</div>
      )}
    </div>
  )
}

/** The mockup's 44px round-square − / + stepper button. */
export function StepperButton({
  glyph,
  onClick,
  disabled,
  label,
}: {
  glyph: '−' | '+'
  onClick: () => void
  disabled?: boolean
  /** The accessible name ("Fewer units"); the glyph alone names nothing. */
  label?: string
}) {
  const isDisabled = disabled === true
  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.md,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        fontSize: 20,
        fontWeight: 600,
        fontFamily: 'inherit',
        color: isDisabled ? neutral.lineStrong : neutral.slate,
        cursor: isDisabled ? 'default' : 'pointer',
        flex: 'none',
      }}
    >
      {glyph}
    </button>
  )
}

/**
 * The one whole-number stepper (UI unification U4, group U34): the mockup's
 * 44px − and + (`StepperButton`) around the value. The buttons are named
 * "Fewer {label}" and "More {label}" and disable at the bounds; the value is
 * announced politely as it changes. `typeable` turns the value into a button
 * that types a number in place (Enter saves, Escape cancels and stops there,
 * so a sheet behind stays open; a blur saves), as the RVG range row has since
 * Phase 19.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  label,
  typeable,
}: {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** The plural noun the buttons name ("units", "base units"). */
  label: string
  /** The typed edit: the value's name ("Base units") and which typed numbers are taken. */
  typeable?: { name: string; accept?: (n: number) => boolean }
}) {
  const atMin = value <= min
  const atMax = max !== undefined && value >= max
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
      <StepperButton glyph="−" label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={atMin} />
      {typeable !== undefined ? (
        <TypedValue value={value} min={min} max={max} name={typeable.name} accept={typeable.accept} onChange={onChange} />
      ) : (
        <span className="mono" aria-live="polite" style={{ width: 32, textAlign: 'center', fontSize: 18, fontWeight: 700 }}>
          {value}
        </span>
      )}
      <StepperButton glyph="+" label={`More ${label}`} onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)} disabled={atMax} />
    </div>
  )
}

function TypedValue({
  value,
  min,
  max,
  name,
  accept,
  onChange,
}: {
  value: number
  min: number
  max: number | undefined
  name: string
  accept: ((n: number) => boolean) | undefined
  onChange: (next: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLButtonElement>(null)
  // Enter and Escape both unmount the input, which can fire its blur: the
  // first of commit or cancel wins, so a draft is never saved twice or saved
  // after Escape.
  const settled = useRef(false)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (editing) {
      settled.current = false
      inputRef.current?.select()
    } else if (returnFocus.current) {
      returnFocus.current = false
      valueRef.current?.focus()
    }
  }, [editing])

  const takes = accept ?? ((n: number) => Number.isInteger(n) && n >= min && (max === undefined || n <= max))

  function finish(save: boolean, refocus: boolean) {
    if (settled.current) return
    settled.current = true
    returnFocus.current = refocus
    setEditing(false)
    const next = Number(draft.trim())
    if (save && draft.trim() !== '' && takes(next) && next !== value) onChange(next)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={name}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={() => finish(true, false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Focus returns to the value button while Enter is still down: without this the same press reopens the edit.
            e.preventDefault()
            finish(true, true)
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            finish(false, true)
          }
        }}
        className="aa-field mono"
        style={{ width: 48, height: 40, textAlign: 'center', fontSize: 20, fontWeight: 700, border: `1px solid ${accent.base}`, borderRadius: radius.ctl, fontFamily: 'inherit', color: neutral.ink, background: neutral.surface }}
      />
    )
  }
  return (
    <button
      ref={valueRef}
      type="button"
      aria-label={`${name} ${value}. Type a value`}
      aria-live="polite"
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      className="mono"
      style={{ width: 48, height: 40, border: `1px dashed ${neutral.lineStrong}`, borderRadius: radius.ctl, background: 'transparent', fontSize: 20, fontWeight: 700, color: neutral.ink, cursor: 'text', fontFamily: 'inherit' }}
    >
      {value}
    </button>
  )
}

/** The mockup's small −5 / +5 time nudge button. */
export function NudgeButton({
  label,
  ariaLabel,
  onClick,
  disabled,
}: {
  label: string
  /** The accessible name ("5 minutes earlier"); the glyph alone names little. */
  ariaLabel?: string
  onClick: () => void
  disabled?: boolean
}) {
  const isDisabled = disabled === true
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: 44,
        height: 36,
        borderRadius: radius.ctl,
        border: `1px solid ${neutral.line}`,
        background: neutral.surface,
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        color: isDisabled ? neutral.lineStrong : neutral.slate,
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/** Validation failures rendered verbatim (semantic error caption). */
export function FailureNotes({ failures }: { failures: readonly BillingValidationFailure[] }) {
  if (failures.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {failures.map((f, i) => (
        <div
          key={`${f.field}-${i}`}
          style={{
            background: semantic.error.tint,
            color: semantic.error.onTint,
            borderRadius: radius.sm,
            padding: '6px 10px',
            fontSize: 12,
            lineHeight: '17px',
          }}
        >
          {f.message}
        </div>
      ))}
    </div>
  )
}

/** A quiet single-line caption. */
export function Caption({ children, color = neutral.mist }: { children: ReactNode; color?: string }) {
  return <div style={{ fontSize: 12, lineHeight: '16px', color }}>{children}</div>
}

/**
 * The "Required" caption on a required capture field (catch-up Phase 21a):
 * quiet mist text until the validation latch is on, then the shared warning
 * pill. One component, so the section headings and the modifiers step agree.
 */
export function RequiredCaption({ latched }: { latched: boolean }) {
  if (latched) return <Pill tone="warning" shot="capture-required">Required</Pill>
  return (
    <span data-shot="capture-required" style={{ fontSize: 11.5, fontWeight: 600, lineHeight: '18px', color: neutral.mist }}>
      Required
    </span>
  )
}
