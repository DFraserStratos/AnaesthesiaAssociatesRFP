import { createContext, useContext, useLayoutEffect, type CSSProperties, type ReactNode, type Ref } from 'react'
import { BackLink, PageHeader } from '../../../shared/ui'
import type { DataAttributes } from '../../../shared/ui/Field'
import { neutral } from '../../../theme/tokens'
import { ADMIN_FIT_MIN_BODY_HEIGHT, ADMIN_RIGHT_RAIL_WIDTH, ADMIN_SUBNAV_WIDTH } from '../layout'

/**
 * The Admin page frame (docs/admin-layout-audit.md, "Layout decisions"): every Admin screen is one
 * `AdminPage`, so title, tabs, toolbar, body and rail sit in the same places on every page, and no
 * screen sets its own page width.
 *
 * - `fit` (list pages): the page is one window high. The title, tabs and toolbar stay put; the list's
 *   card (`TableShell fit`) hugs a short list and, on a long one, scrolls its rows inside itself with
 *   a sticky column header and the pager in its footer. The page itself never scrolls.
 * - `fluid` (records and dashboards): the full width, the page scrolling. Text keeps a measure,
 *   label and value lists flow into columns, forms keep `ADMIN_FORM_WIDTH`.
 * - `document` (invoice, credit note, remittance): the paper at its print width with the rail beside
 *   it, both on the page's left edge.
 *
 * Above the body go only the back link, the title row, the tabs and one `PageToolbar`. Anything else
 * a list page wants to show beside the list goes in `PageBody`'s rail.
 */

export type AdminPageMode = 'fit' | 'fluid' | 'document'

/** Lets a `fit` page tell the Admin shell to stop scrolling and hand the page the window's height. */
export const AdminFrameContext = createContext<((fits: boolean) => void) | null>(null)

const ModeContext = createContext<AdminPageMode>('fluid')

/** The mode of the page around this element (`fluid` outside any `AdminPage`). */
export function useAdminPageMode(): AdminPageMode {
  return useContext(ModeContext)
}

export interface AdminPageProps extends DataAttributes {
  mode: AdminPageMode
  /** The title (an `h1`, `PageHeader` size admin). Omit only on a page whose title is part of its document. */
  title?: ReactNode
  /** One sentence, at most two lines: `PageHeader` caps it at the prose width. */
  sub?: ReactNode
  /** The page's one primary action (a `Button size="desktop"`), right of the title. */
  actions?: ReactNode
  /** A count badge inside the heading. */
  count?: ReactNode
  /** An identifier chip or warning beside the heading. */
  aside?: ReactNode
  headingRef?: Ref<HTMLHeadingElement>
  /** Where Back goes, named for where the user came from ("Invoice AA-S-002568", "Anaesthetists"). */
  back?: { label: ReactNode; onClick?: () => void; to?: string; shot?: string }
  /** `LineTabs` for routed sub-pages only. */
  tabs?: ReactNode
  children: ReactNode
  shot?: string
  testId?: string
  style?: CSSProperties
}

export function AdminPage({ mode, title, sub, actions, count, aside, headingRef, back, tabs, children, shot, testId, style, ...data }: AdminPageProps) {
  const setFits = useContext(AdminFrameContext)
  const fits = mode === 'fit'
  useLayoutEffect(() => {
    if (setFits === null || !fits) return
    setFits(true)
    return () => setFits(false)
  }, [setFits, fits])

  return (
    <ModeContext.Provider value={mode}>
      <div
        {...data}
        data-shot={shot}
        data-testid={testId}
        data-admin-page={mode}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          minWidth: 0,
          ...(fits ? { flex: 1, minHeight: 0 } : {}),
          ...style,
        }}
      >
        {(back !== undefined || title !== undefined) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 'none' }}>
            {back !== undefined && (
              <BackLink {...(back.to !== undefined ? { to: back.to } : {})} {...(back.onClick !== undefined ? { onClick: back.onClick } : {})} {...(back.shot !== undefined ? { shot: back.shot } : {})}>
                {back.label}
              </BackLink>
            )}
            {title !== undefined && (
              <PageHeader
                size="admin"
                title={title}
                {...(sub !== undefined ? { sub } : {})}
                {...(actions !== undefined ? { actions } : {})}
                {...(count !== undefined ? { count } : {})}
                {...(aside !== undefined ? { aside } : {})}
                {...(headingRef !== undefined ? { headingRef } : {})}
              />
            )}
          </div>
        )}
        {tabs !== undefined && <div style={{ flex: 'none' }}>{tabs}</div>}
        {children}
      </div>
    </ModeContext.Provider>
  )
}

/**
 * The one toolbar row under the title (or tabs): filters on the left as compact controls that name
 * themselves by their value (visually hidden labels, no eyebrow labels above), and the result count or
 * summary at the right edge (`end`). The pager does not go here: it lives in the list card's footer.
 */
export function PageToolbar({ children, end, shot }: { children?: ReactNode; end?: ReactNode; shot?: string }) {
  return (
    <div data-shot={shot} data-page-toolbar style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 'none', minHeight: 36 }}>
      {children}
      {end !== undefined && (
        <div data-page-toolbar-end style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: neutral.slate }}>
          {end}
        </div>
      )}
    </div>
  )
}

/**
 * The page's body: the main column, with an optional section navigation on its left (`nav`, Master
 * data's view list) and an optional rail on its right (`rail`, always `ADMIN_RIGHT_RAIL_WIDTH`). In a
 * `fit` page it takes the rest of the window's height (at least `ADMIN_FIT_MIN_BODY_HEIGHT`), the
 * main column lays its children out in a column so a `TableShell fit` can shrink to fit, and the rail
 * scrolls on its own.
 */
export function PageBody({ children, rail, nav, railLabel, gap = 16, shot }: { children: ReactNode; rail?: ReactNode; nav?: ReactNode; railLabel?: string; gap?: number; shot?: string }) {
  const fits = useAdminPageMode() === 'fit'
  return (
    <div
      data-shot={shot}
      data-page-body
      style={{
        display: 'flex',
        gap: 16,
        minWidth: 0,
        ...(fits ? { flex: '1 1 0', minHeight: ADMIN_FIT_MIN_BODY_HEIGHT, alignItems: 'stretch' } : { alignItems: 'flex-start' }),
      }}
    >
      {nav !== undefined && <div style={{ width: ADMIN_SUBNAV_WIDTH, flex: 'none', ...(fits ? { overflowY: 'auto' } : {}) }}>{nav}</div>}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap, ...(fits ? { minHeight: 0 } : {}) }}>{children}</div>
      {rail !== undefined && (
        // The negative margin gives the cards' shadows room inside the scroll box without moving the rail.
        <aside
          aria-label={railLabel}
          data-page-rail
          style={{
            width: ADMIN_RIGHT_RAIL_WIDTH,
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            ...(fits ? { overflowY: 'auto', margin: '-4px -6px', padding: '4px 6px', boxSizing: 'content-box' } : {}),
          }}
        >
          {rail}
        </aside>
      )}
    </div>
  )
}
