import { useId, type CSSProperties, type ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { FIELD_CLASS } from './fieldChrome'
import { dataAttributesOf, FieldHint, type DataAttributes } from './Field'

export interface CheckboxProps extends DataAttributes {
  checked: boolean
  onChange: (checked: boolean) => void
  /** The label: the whole row toggles the box. In `card`, the title. */
  children: ReactNode
  /** A quiet line tied to the box (`aria-describedby`); in `card`, the card's second line. */
  hint?: ReactNode
  /** `md` 16px (default); `lg` the 20px tick (mobile, convention 16). `card` is always 20px. */
  size?: 'md' | 'lg'
  /**
   * `card`: the tick card of the sheets (Tell the office, Different payer): a
   * bordered card, teal tint once ticked, a 15/600 title and a 12.5 slate line.
   */
  variant?: 'plain' | 'card'
  disabled?: boolean
  /** `data-shot` on the input. */
  shot?: string
  /** `data-shot` on the label (the whole row or card), where recipes have long found it. */
  labelShot?: string
  /** Placement and the label's text style only (gap, font size). */
  style?: CSSProperties
}

/**
 * The one checkbox (UI unification U4, group U15; bug 8): a native box in the
 * action teal (`accent-color`), never the browser blue, with `aa-field`'s ring
 * on keyboard focus. The label wraps it, so a click anywhere on the words
 * toggles it and Space works natively.
 */
export function Checkbox(props: CheckboxProps) {
  const { checked, onChange, children, hint, size = 'md', variant = 'plain', disabled, shot, labelShot, style } = props
  const hintId = useId()
  const card = variant === 'card'
  const box = card || size === 'lg' ? 20 : 16
  const stacked = card || hint !== undefined
  return (
    <label
      data-shot={labelShot}
      style={{
        display: 'flex',
        alignItems: stacked ? 'flex-start' : 'center',
        gap: card ? 12 : 8,
        cursor: disabled === true ? 'default' : 'pointer',
        ...(card
          ? { padding: '12px 14px', borderRadius: radius.card, border: `1px solid ${checked ? accent.base : neutral.line}`, background: checked ? accent.tint : neutral.surface }
          : {}),
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint !== undefined ? hintId : undefined}
        data-shot={shot}
        {...dataAttributesOf(props)}
        className={FIELD_CLASS}
        style={{ accentColor: accent.base, width: box, height: box, margin: 0, flex: 'none', cursor: 'inherit', ...(card ? { marginTop: 1 } : hint !== undefined ? { marginTop: 2 } : {}) }}
      />
      {stacked ? (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {card ? <span style={{ fontSize: 15, fontWeight: 600, color: neutral.ink }}>{children}</span> : <span>{children}</span>}
          {hint !== undefined &&
            (card ? (
              <span id={hintId} style={{ fontSize: 12.5, lineHeight: '17px', color: neutral.slate }}>
                {hint}
              </span>
            ) : (
              <FieldHint id={hintId}>{hint}</FieldHint>
            ))}
        </span>
      ) : (
        children
      )}
    </label>
  )
}
