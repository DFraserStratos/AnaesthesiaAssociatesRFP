import type { CSSProperties, ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'

export type FilterPillsSize = 'md' | 'lg'

interface FilterPillOption<T extends string> {
  value: T
  label: ReactNode
}

interface FilterPillsProps<T extends string> {
  value: T
  options: readonly FilterPillOption<T>[]
  onSelect: (value: T) => void
  /** Names the group for assistive tech. */
  ariaLabel: string
  /** `md` 36px (Web Availability), `lg` 38px (the phone's Lists), each as its mockup draws it. */
  size?: FilterPillsSize
  style?: CSSProperties
}

/**
 * Choose one list filter from a row of solid pills (U32; UI unification U5). A labelled group of
 * buttons with `aria-pressed` (question 3): the solid teal pill the mockups draw, beside the
 * teal-tint option chips, which are another job. The phone's active pill has no border (Mobile
 * App line 37); the web one keeps a teal 1px border (Web Availability line 55).
 */
export function FilterPills<T extends string>({ value, options, onSelect, ariaLabel, size = 'md', style }: FilterPillsProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 8, alignItems: 'center', ...style }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            className="aa-ctl"
            aria-pressed={active}
            onClick={() => onSelect(o.value)}
            style={{
              height: size === 'lg' ? 38 : 36,
              padding: '0 16px',
              borderRadius: radius.pill,
              border: active ? (size === 'lg' ? 'none' : `1px solid ${accent.base}`) : `1px solid ${neutral.line}`,
              background: active ? accent.base : neutral.surface,
              color: active ? neutral.surface : neutral.slate,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              flex: 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
