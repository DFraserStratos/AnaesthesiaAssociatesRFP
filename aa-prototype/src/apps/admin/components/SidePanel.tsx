/**
 * The Admin right-docked side panel (UI unification U2, README U19): one shell
 * for the Admin Day List drawer, the empty-session drawer, the Draft List
 * drawer and the Master data record panel (Parties and Contracts).
 *
 * A scrim, a right-docked surface at `elevation.e3`, a header with an h2 (the
 * sheet title, 18/700) that names the dialog, the corner X, a scrolling body
 * and an optional footer. On the one modal stack (`useModalLayer`): Escape
 * closes only the top layer, focus goes in on open and back on close, Tab
 * stays inside, the page behind is inert. Every close (Escape, scrim, X) runs
 * the one `onClose`.
 *
 * `list` is the 440px drawer, `record` the 600px panel. The record footer is
 * MasterPanel's right-aligned bar with the primary last (README U18
 * canonical); the drawers pass their own action bar, laid out by
 * `footerLayout`.
 */

import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { elevation, neutral, scrim, type as typeScale, zIndex } from '../../../theme/tokens'
import { CornerClose, useModalLayer } from '../../../shared/surface'
import { ADMIN_LIST_DRAWER_WIDTH } from '../layout'

export const SIDE_PANEL_WIDTH = { list: ADMIN_LIST_DRAWER_WIDTH, record: 600 } as const

/** Data attributes and the test id passed through to the panel element (`data-slot-id`, `data-list-id`). */
export type SidePanelAttrs = Record<`data-${string}`, string | undefined>

export interface SidePanelProps {
  open: boolean
  onClose: () => void
  /** The h2: the record's or the List's name. */
  title: ReactNode
  /** Under the title. `record` lays it out as a row of pills and one mist line; `list` renders it as given. */
  meta?: ReactNode
  /** Above the title (the Draft List drawer's state pills). */
  above?: ReactNode
  width: 'list' | 'record'
  footer?: ReactNode
  /** `end`: right-aligned, primary last (record). `row`, `wrap` and `column`: the drawers' action bars. */
  footerLayout?: FooterLayout
  /** A test id on the footer bar (`admin-list-actions`). */
  footerTestId?: string
  shot?: string
  testId?: string
  panelAttrs?: SidePanelAttrs
  /** The gap between the body's blocks: 20 on a record, 16 on a drawer unless given. */
  bodyGap?: number
  children: ReactNode
}

type FooterLayout = 'end' | 'row' | 'wrap' | 'column'

const FOOTER_LAYOUT: Record<FooterLayout, CSSProperties> = {
  end: { padding: '14px 24px', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' },
  row: { padding: 20, display: 'flex', flexWrap: 'nowrap', gap: 8 },
  wrap: { padding: 20, display: 'flex', flexWrap: 'wrap', gap: 8 },
  column: { padding: 20, display: 'flex', flexDirection: 'column', gap: 8 },
}

export function SidePanel({ open, onClose, title, meta, above, width, footer, footerLayout, footerTestId, shot, testId, panelAttrs, bodyGap, children }: SidePanelProps) {
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  useModalLayer({ open, onClose, rootRef, panelRef })

  if (!open) return null
  const record = width === 'record'
  const layout = footerLayout ?? (record ? 'end' : 'row')
  return (
    <div ref={rootRef}>
      <div onClick={onClose} aria-hidden style={{ position: 'fixed', inset: 0, background: scrim, zIndex: zIndex.drawerScrim }} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        data-shot={shot}
        {...panelAttrs}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: SIDE_PANEL_WIDTH[width], maxWidth: '100%', background: neutral.surface, zIndex: zIndex.drawer, boxShadow: elevation.e3, display: 'flex', flexDirection: 'column', outline: 'none' }}
      >
        <header style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: record || above !== undefined ? 6 : 0, minWidth: 0 }}>
            {above}
            <h2 id={titleId} style={{ margin: 0, fontSize: typeScale.sheetTitle.size, lineHeight: `${typeScale.sheetTitle.line}px`, fontWeight: typeScale.sheetTitle.weight }}>{title}</h2>
            {meta !== undefined &&
              (record ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: neutral.slate }}>{meta}</div> : meta)}
          </div>
          <CornerClose onClose={onClose} />
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: record ? '20px 24px' : 24, display: 'flex', flexDirection: 'column', gap: bodyGap ?? (record ? 20 : 16) }}>{children}</div>
        {footer !== undefined && (
          <footer data-testid={footerTestId} style={{ borderTop: `1px solid ${neutral.line}`, ...FOOTER_LAYOUT[layout] }}>
            {footer}
          </footer>
        )}
      </aside>
    </div>
  )
}
