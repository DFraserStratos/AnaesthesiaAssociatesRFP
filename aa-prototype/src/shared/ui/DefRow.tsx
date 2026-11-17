import type { CSSProperties, ReactNode } from 'react'
import { neutral, semantic } from '../../theme/tokens'
import type { DataAttributes } from './Field'

export type DefRowLayout = 'inline' | 'stacked' | 'settings'

/**
 * A list of label and value pairs (UI unification U6, group U31): a `dl`, so a screen reader reads
 * each pair as a term and its value (the semantics `InvoiceDocument`'s info block already used).
 * A flex column; `gap` is the space between rows, set to the screen's own rhythm.
 */
export function DefList({ children, gap = 8, style, shot, ...data }: { children: ReactNode; gap?: number; style?: CSSProperties; shot?: string } & DataAttributes) {
  return (
    <dl {...data} data-shot={shot} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap, minWidth: 0, ...style }}>
      {children}
    </dl>
  )
}

/**
 * One label and value pair inside a `DefList` (group U31). Three layouts:
 * - `inline` (default): the drawer and detail row, a 12px label in a fixed column (`labelWidth`, 80,
 *   the drawers' width since U6) beside the 14px value, on one baseline;
 * - `stacked`: the profile fact, a 12/600 label over the value (`note` a mist line under it);
 * - `settings`: the right-aligned settings row (label left in slate, mono value right, `trailing`
 *   after it, such as Phase 26's lock glyph), 32px tall.
 * `trailing` renders inside the `dd`, after the value, so the `dl` stays valid.
 * `mono` sets the value in the data face; `note` adds a 12px mist line under the value; `tone`
 * colours the value (warning: a missing fact); `labelTone` slate where the card's labels are slate.
 * `data-*` attributes land on the row.
 */
export function DefRow({
  label,
  children,
  labelWidth = 80,
  layout = 'inline',
  mono = false,
  note,
  trailing,
  tone,
  labelTone = 'mist',
  valueStyle,
  style,
  shot,
  ...data
}: {
  label: ReactNode
  children?: ReactNode
  labelWidth?: number
  layout?: DefRowLayout
  mono?: boolean
  note?: ReactNode
  trailing?: ReactNode
  tone?: 'warning'
  labelTone?: 'mist' | 'slate'
  valueStyle?: CSSProperties
  style?: CSSProperties
  shot?: string
} & DataAttributes) {
  const labelColour = labelTone === 'slate' ? neutral.slate : neutral.mist
  const valueColour = tone === 'warning' ? semantic.warning.onTint : neutral.ink
  const hasTrailing = trailing !== undefined && trailing !== null && trailing !== false
  const noteLine = note !== undefined ? <div style={{ fontSize: 12, color: neutral.mist }}>{note}</div> : null
  if (layout === 'stacked') {
    return (
      <div {...data} data-shot={shot} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, ...style }}>
        <dt style={{ fontSize: 12, fontWeight: 600, color: labelColour }}>{label}</dt>
        <dd className={mono ? 'mono' : undefined} style={{ margin: 0, fontSize: 14, color: valueColour, overflowWrap: 'anywhere', ...valueStyle }}>
          {children}
        </dd>
        {note !== undefined && <dd style={{ margin: 0, fontSize: 12, color: neutral.mist }}>{note}</dd>}
      </div>
    )
  }
  if (layout === 'settings') {
    return (
      <div {...data} data-shot={shot} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 32, ...style }}>
        <dt style={{ flex: 1, fontSize: 14, color: neutral.slate }}>{label}</dt>
        {!hasTrailing ? (
          <dd className="mono" style={{ margin: 0, fontSize: 13, color: valueColour, textAlign: 'right', ...valueStyle }}>
            {children}
            {noteLine}
          </dd>
        ) : (
          <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: style?.gap ?? 12, fontSize: 13, color: valueColour }}>
            <div className="mono" style={{ textAlign: 'right', ...valueStyle }}>
              {children}
              {noteLine}
            </div>
            {trailing}
          </dd>
        )}
      </div>
    )
  }
  return (
    <div {...data} data-shot={shot} style={{ display: 'flex', alignItems: 'baseline', gap: 10, ...style }}>
      <dt style={{ width: labelWidth, flex: 'none', fontSize: 12, color: labelColour }}>{label}</dt>
      {!hasTrailing ? (
        <dd className={mono ? 'mono' : undefined} style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 14, color: valueColour, ...valueStyle }}>
          {children}
          {noteLine}
        </dd>
      ) : (
        // `trailing` (a stepper, a Split action) sits inside the `dd`, so the `dl` holds only terms and
        // values; it keeps the row's own gap and alignment, as it had beside the value.
        <dd style={{ margin: 0, flex: 1, minWidth: 0, display: 'flex', alignItems: style?.alignItems ?? 'baseline', gap: style?.gap ?? 10, fontSize: 14, color: valueColour }}>
          <div className={mono ? 'mono' : undefined} style={{ flex: 1, minWidth: 0, ...valueStyle }}>
            {children}
            {noteLine}
          </div>
          {trailing}
        </dd>
      )}
    </div>
  )
}
