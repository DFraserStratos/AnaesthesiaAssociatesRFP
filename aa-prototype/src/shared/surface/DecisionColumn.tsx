/**
 * The decision column (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, O1): a white column whose
 * body scrolls on its own, with a footer pinned under it holding the decision's buttons. The sheet and drawer pattern
 * on a page: you choose in the body and confirm directly below, a short note over the buttons, the secondary first
 * and the primary last on the right (as `SheetActions`' web row and `SidePanel`'s `footerLayout="end"`).
 *
 * The body is a one-column grid, so a table with its own scroller keeps its full height and the body scrolls instead.
 *
 * Hooks: `shot` as `data-shot` on the column, `data-*` passed through to it; the footer is `data-decision-footer`.
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral, space, type as typeScale } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from '../ui/Field'

export interface DecisionFooter {
  /** One quiet line over the buttons: what the primary will do. */
  note?: ReactNode
  /** The secondary button (or buttons), left of the primary. */
  secondary?: ReactNode
  /** The one primary button, last on the right. */
  primary?: ReactNode
  /** `data-shot` on the footer. */
  shot?: string
}

export interface DecisionColumnProps extends DataAttributes {
  children: ReactNode
  /** The pinned footer; left out (or empty) when there is nothing to decide. */
  footer?: DecisionFooter
  /** The column's accessible name. */
  label?: string
  shot?: string
  style?: CSSProperties
}

const present = (n: ReactNode) => n !== undefined && n !== null && n !== false

export function DecisionColumn(props: DecisionColumnProps) {
  const { children, footer, label, shot, style } = props
  const hasButtons = footer !== undefined && (present(footer.secondary) || present(footer.primary))
  const hasFooter = footer !== undefined && (hasButtons || present(footer.note))
  return (
    <section
      {...dataAttributesOf(props)}
      data-shot={shot}
      aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: neutral.surface, ...style }}
    >
      <div data-decision-body style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', padding: `${space[4]}px ${space[6]}px ${space[6]}px`, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridAutoRows: 'max-content', alignContent: 'start', gap: space[4] }}>
        {children}
      </div>
      {hasFooter && (
        <footer
          data-decision-footer
          data-shot={footer.shot}
          style={{ flex: 'none', borderTop: `1px solid ${neutral.line}`, padding: `${space[3]}px ${space[6]}px`, display: 'flex', flexDirection: 'column', gap: space[3], background: neutral.surface }}
        >
          {present(footer.note) && (
            <div data-decision-note style={{ fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.slate }}>
              {footer.note}
            </div>
          )}
          {hasButtons && (
            <div data-decision-actions style={{ display: 'flex', flexWrap: 'wrap', gap: space[3], alignItems: 'center', justifyContent: 'flex-end' }}>
              {footer.secondary}
              {footer.primary}
            </div>
          )}
        </footer>
      )}
    </section>
  )
}

/** A heading inside the column's body ("Place this List", "What this changes on Dr Moana's List"). */
export function DecisionHeading({ children, shot }: { children: ReactNode; shot?: string }) {
  return (
    <h3 data-shot={shot} style={{ margin: 0, fontSize: typeScale.labelLg.size, lineHeight: `${typeScale.labelLg.line}px`, fontWeight: typeScale.heading.weight, color: neutral.ink }}>
      {children}
    </h3>
  )
}
