import type { ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

/** What `useRovingRadio().itemProps(i)` returns: the card's place in the group's keyboard model. */
export interface RadioItemProps {
  ref: (el: HTMLElement | null) => void
  role: 'radio'
  'aria-checked': boolean
  tabIndex: number
}

export interface RadioCardProps extends DataAttributes {
  /** `itemProps(i)` from the group's `useRovingRadio`; the group itself carries `groupProps`. */
  radio: RadioItemProps
  checked: boolean
  onSelect: () => void
  /** The bold first line. */
  title: ReactNode
  /** Beside the title: a "Suggested" pill, a row count. */
  titleExtra?: ReactNode
  /** The slate lines under the title. */
  description?: ReactNode
  /** Why the option cannot be chosen: printed in place of the description, and the card is skipped. */
  disabledReason?: ReactNode
  /** The checked card's own controls (a picker, a reason), shown under it only while checked. */
  children?: ReactNode
  /** `data-shot` on the radio. */
  shot?: string
}

/**
 * One option of a radio group drawn as a card (catch-up Phase 33's review): the radio dot, a title,
 * slate lines, and, while checked, the option's own controls underneath. Checked is the teal accent:
 * an `accent.base` border doubled by a 1px inset ring (the Contract rail tiles' selected edge) on the
 * white surface, so fields inside keep the well fill. A disabled card sits on `neutral.bg` with its
 * reason in mist. The group's keyboard model is `useRovingRadio`: pass `itemProps(i)` as `radio`;
 * Space, Enter or a click selects. `data-*` and `shot` land on the radio element.
 */
export function RadioCard({ radio, checked, onSelect, title, titleExtra, description, disabledReason, children, shot, ...rest }: RadioCardProps) {
  const disabled = disabledReason !== undefined && disabledReason !== null && disabledReason !== false
  const showDetail = checked && children !== undefined && children !== null && children !== false
  return (
    <div
      style={{
        borderRadius: radius.card,
        border: `1px solid ${checked ? accent.base : neutral.line}`,
        boxShadow: checked ? `inset 0 0 0 1px ${accent.base}` : undefined,
        background: disabled ? neutral.bg : neutral.surface,
      }}
    >
      <div
        {...radio}
        {...dataAttributesOf(rest)}
        data-shot={shot}
        aria-disabled={disabled || undefined}
        className="aa-ctl"
        onClick={() => !disabled && onSelect()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
            e.preventDefault()
            onSelect()
          }
        }}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', cursor: disabled ? 'default' : 'pointer', borderRadius: radius.card }}
      >
        <span
          aria-hidden
          style={{
            marginTop: 2,
            width: 16,
            height: 16,
            flex: 'none',
            borderRadius: radius.pill,
            border: `2px solid ${checked ? accent.base : neutral.lineStrong}`,
            background: neutral.surface,
            boxShadow: checked ? `inset 0 0 0 3px ${neutral.surface}, inset 0 0 0 8px ${accent.base}` : undefined,
          }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: disabled ? neutral.mist : neutral.ink }}>{title}</span>
            {titleExtra}
          </span>
          {(disabled || (description !== undefined && description !== null)) && (
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12.5, lineHeight: '18px', color: disabled ? neutral.mist : neutral.slate }}>
              {disabled ? disabledReason : description}
            </span>
          )}
        </span>
      </div>
      {showDetail && <div style={{ padding: '0 14px 14px 42px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
    </div>
  )
}
