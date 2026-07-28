/** Shared primitives for the BTM capture cards (mockup screen 3 anatomy). */

import type { ReactNode } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'
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
}: {
  label: string
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
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>
        {label}
      </div>
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
}: {
  glyph: '−' | '+'
  onClick: () => void
  disabled?: boolean
}) {
  const isDisabled = disabled === true
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
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

/** The mockup's small −5 / +5 time nudge button. */
export function NudgeButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  const isDisabled = disabled === true
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={{
        width: 44,
        height: 36,
        borderRadius: 10,
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
            borderRadius: 8,
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
