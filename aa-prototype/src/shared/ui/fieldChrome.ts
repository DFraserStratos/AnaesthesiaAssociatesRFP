import type { CSSProperties } from 'react'
import { neutral, radius, semantic } from '../../theme/tokens'

/**
 * The one field chrome (UI unification U4; README questions 4, 5 and 6). Every
 * text field, textarea, select and search box draws its control from here and
 * carries the `aa-field` class, whose `:focus-visible` rule in `global.css`
 * gives the teal border and the Design Language focus ring.
 *
 * - **Fill** (question 4): `well` (`neutral.bg`, a grey well) inside white
 *   sheets, cards and drawers; `surface` (white) on the page or phone canvas.
 * - **Height** (question 5): `field` 48px in sheets and forms; `compact` 36px
 *   for toolbars and in-table inputs.
 *
 * A plain module (no components), so fast refresh stays clean.
 */
export type FieldSize = 'field' | 'compact'
export type FieldFill = 'well' | 'surface'

export const FIELD_HEIGHT: Record<FieldSize, number> = { field: 48, compact: 36 }
export const FIELD_FILL: Record<FieldFill, string> = { well: neutral.bg, surface: neutral.surface }

/** The class every field control carries for the one focus ring. */
export const FIELD_CLASS = 'aa-field'

/** TextField's and TextArea's control at 48px in a grey well (today's look). */
export const controlStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: FIELD_HEIGHT.field,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: FIELD_FILL.well,
  padding: '0 14px',
  fontFamily: 'inherit',
  fontSize: 15,
  color: neutral.ink,
}

/** The native select's control at 48px in a grey well (the admin flows' chrome since Phase 07). */
export const selectControlStyle: CSSProperties = {
  ...controlStyle,
  padding: '0 12px',
}

/**
 * A field control's style for a size, fill and state. `compact` is 36px at
 * 13px with 10px sides (the Conflicts toolbar's select, the in-table price
 * range inputs). `invalid` takes the error border. Never sets a font size with
 * `!important`, so the PWA's 16px input rule still wins on a handset.
 */
export function fieldControlStyle({
  size = 'field',
  fill = 'well',
  invalid = false,
  select = false,
}: { size?: FieldSize; fill?: FieldFill; invalid?: boolean; select?: boolean } = {}): CSSProperties {
  const base = select ? selectControlStyle : controlStyle
  return {
    ...base,
    ...(size === 'compact' ? { minHeight: FIELD_HEIGHT.compact, fontSize: 13, padding: '0 10px' } : {}),
    background: FIELD_FILL[fill],
    ...(invalid ? { border: `1px solid ${semantic.error.solid}` } : {}),
  }
}
